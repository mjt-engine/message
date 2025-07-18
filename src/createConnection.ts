import { Bytes } from "@mjt-engine/byte";
import { Errors } from "@mjt-engine/error";
import { isDefined, isUndefined, toMany } from "@mjt-engine/object";
import {
  connect,
  createInbox,
  credsAuthenticator,
  RequestStrategy,
  type NatsConnection,
  type Stats,
  type Status,
} from "nats.ws";
import {
  connectConnectionListenerToSubject,
  DEFAULT_MAX_MESSAGE_SIZE,
} from "./connectConnectionListenerToSubject";
import { msgsBufferToCombinedUint8Array } from "./msgsBufferToCombinedUint8Array";
import { msgToResponseData } from "./msgToResponseData";
import { recordToNatsHeaders } from "./recordToNatsHeaders";
import { ABORT_SUBJECT_HEADER, CHUNK_HEADER } from "./SPECIAL_HEADERS";
import type { ConnectionListener } from "./type/ConnectionListener";
import type { ConnectionMap } from "./type/ConnectionMap";
import type { EventMap } from "./type/EventMap";
import type { PartialSubject } from "./type/PartialSubject";
import type { ValueOrError } from "./type/ValueOrError";

export type MessageConnection = NatsConnection;
export type MessageConnectionStats = Stats;
export type MessageConnectionStatus = Status;

export type MessageConnectionInstance<CM extends ConnectionMap> = {
  connection: MessageConnection;
  requestMany: <S extends keyof CM>(props: {
    subject: S;
    request: CM[S]["request"];
    headers?: Record<keyof CM[S]["headers"], string>;
    options?: Partial<{ timeoutMs: number }>;
    onResponse: (response: CM[S]["response"]) => void | Promise<void>;
    signal?: AbortSignal;
  }) => Promise<void>;
  request: <S extends keyof CM>(props: {
    subject: S;
    request: CM[S]["request"];
    headers?: Record<keyof CM[S]["headers"], string>;
    options?: Partial<{ timeoutMs: number }>;
  }) => Promise<CM[S]["response"]>;
  publish: <S extends PartialSubject, EM extends EventMap<S>>(props: {
    subject: S;
    payload?: EM[S];
    request?: CM[S]["request"];
    headers?: Record<keyof CM[S]["headers"], string>;
    options?: Partial<{ timeoutMs: number }>;
    onResponse?: (response: CM[S]["response"]) => void | Promise<void>;
    onError?: (error: unknown) => void;
    signal?: AbortSignal;
  }) => Promise<CM[S]["response"]>;
};

export const createConnection = async <
  CM extends ConnectionMap,
  E extends Record<string, string> = Record<string, string>
>({
  server,
  creds,
  token,
  subscribers = {},
  options = {},
  env = {},
}: {
  server: string[] | string;
  subscribers?: Partial<{ [k in keyof CM]: ConnectionListener<CM, k, E> }>;
  creds?: string;
  token?: string;
  options?: Partial<{
    log: (message: unknown, ...extra: unknown[]) => void;
    maxMessageSize?: number;
  }>;
  env?: Partial<E>;
}): Promise<MessageConnectionInstance<CM>> => {
  const { log = () => {}, maxMessageSize = DEFAULT_MAX_MESSAGE_SIZE } = options;
  log("createConnection: server: ", server);
  const connection: MessageConnection = await connect({
    servers: [...toMany(server)],
    authenticator: isDefined(creds)
      ? credsAuthenticator(new TextEncoder().encode(creds))
      : undefined,
    token: token,
  });
  const entries = Object.entries(subscribers);
  log("createConnection: entries: ", entries);
  for (const [subject, listener] of entries) {
    if (isUndefined(listener)) {
      continue;
    }
    connectConnectionListenerToSubject({
      connection,
      subject,
      listener,
      options,
      env,
    });
  }

  return {
    connection,
    requestMany: async <S extends keyof CM>(props: {
      subject: S;
      request: CM[S]["request"];
      headers?: Record<keyof CM[S]["headers"], string>;
      options?: Partial<{ timeoutMs: number; maxMessageSize: number }>;
      onResponse: (response: CM[S]["response"]) => void | Promise<void>;
      signal?: AbortSignal;
    }) => {
      const {
        request,
        subject,
        headers,
        options = {},
        onResponse,
        signal,
      } = props;
      const {
        timeoutMs = 60 * 1000,
        maxMessageSize = DEFAULT_MAX_MESSAGE_SIZE,
      } = options;
      const requestMsg = Bytes.toMsgPack({ value: request } as ValueOrError);

      if (requestMsg.byteLength > maxMessageSize) {
      }

      const hs = recordToNatsHeaders(headers);
      if (isDefined(signal)) {
        const abortSubject = `abort.${Date.now()}.${crypto.randomUUID()}`;
        hs?.set(ABORT_SUBJECT_HEADER, abortSubject);
        signal.addEventListener("abort", () => {
          connection.publish(abortSubject);
        });
      }

      const iterable = await connection.requestMany(
        subject as string,
        requestMsg,
        {
          maxWait: timeoutMs,
          headers: hs,
          strategy: RequestStrategy.SentinelMsg,
        }
      );
      let buffer: (Uint8Array | undefined)[] = [];
      for await (const resp of iterable) {
        iterable;
        if (signal?.aborted) {
          return;
        }
        if (isUndefined(resp.data) || resp.data.byteLength === 0) {
          break;
        }
        const chunkHeader = resp.headers?.get(CHUNK_HEADER);
        if (chunkHeader) {
          const chunkParts = chunkHeader.split("/");
          if (chunkParts.length !== 2) {
            throw Errors.errorToErrorDetail({
              error: new Error("Invalid chunk header format"),
              extra: [{ subject, request, headers, options }],
            });
          }
          if (resp.headers?.hasError) {
            throw Errors.errorToErrorDetail({
              error: new Error("Chunked response has error"),
              extra: [{ subject, request, headers, options, resp }],
            });
          }
          const [currentChunk, totalChunks] = chunkParts.map(Number);
          if (buffer.length === 0) {
            buffer = new Array(totalChunks).fill(undefined);
          }
          buffer[currentChunk - 1] = new Uint8Array(resp.data);
          continue;
        }
        const responseData = await msgToResponseData({
          msg: resp,
          subject,
          request,
          log,
        });
        await onResponse(responseData);
      }
      if (buffer.length > 0) {
        //recombine the chunks
        const combined = msgsBufferToCombinedUint8Array(buffer);
        buffer.length = 0; // Clear the buffer after recombining
        const responseData = await msgToResponseData({
          msg: { data: combined },
          subject,
          request,
          log,
        });
        await onResponse(responseData);
      }
    },

    request: async <S extends keyof CM>(props: {
      subject: S;
      request: CM[S]["request"];
      headers?: Record<keyof CM[S]["headers"], string>;
      options?: Partial<{ timeoutMs: number }>;
    }): Promise<CM[S]["response"]> => {
      const { request, subject, headers, options = {} } = props;
      const requestMsg = Bytes.toMsgPack({ value: request } as ValueOrError);
      const { timeoutMs = 60 * 1000 } = options;

      const hs = recordToNatsHeaders(headers);

      const resp = await connection.request(subject as string, requestMsg, {
        timeout: timeoutMs,
        headers: hs,
      });
      if (isUndefined(resp.data) || resp.data.byteLength === 0) {
        return undefined;
      }
      if (resp.headers?.get(CHUNK_HEADER)) {
        throw Errors.errorToErrorDetail({
          error: new Error(
            "Chunked response recieved. Use requestMany instead."
          ),
          extra: [{ subject, request, headers, options }],
        });
      }
      return msgToResponseData({ msg: resp, subject, request, log });
    },

    publish: async <S extends PartialSubject, EM extends EventMap<S>>(props: {
      subject: S;
      payload?: EM[S];
      request?: CM[S]["request"];
      headers?: Record<keyof CM[S]["headers"], string>;
      options?: Partial<{ timeoutMs: number }>;
      onResponse?: (response: CM[S]["response"]) => void | Promise<void>;
      onError?: (error: unknown) => void;
      signal?: AbortSignal;
    }): Promise<CM[S]["response"]> => {
      const {
        payload,
        request,
        subject,
        headers,
        onResponse,
        options = {},
        signal,
        onError,
      } = props;
      const { timeoutMs = 60 * 1000 } = options;
      const value = isDefined(payload) ? payload : request;
      const msg = Bytes.toMsgPack({ value } as ValueOrError);
      const replySubject = createInbox();
      const hs = recordToNatsHeaders(headers);
      const subscription = connection.subscribe(replySubject);
      await connection.flush();
      const result = new Promise<CM[S]["response"]>(async (resolve, reject) => {
        let buffer: (Uint8Array | undefined)[] = [];
        const timeoutId = setTimeout(() => {
          subscription.unsubscribe();
          // reject(new Error("Request timed out"));
        }, timeoutMs);
        for await (const msg of subscription) {
          if (signal?.aborted) {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
            return reject(new Error("Signal aborted"));
          }

          if (isUndefined(msg.data) || msg.data.byteLength === 0) {
            if (buffer.length != 0) {
              const combined = msgsBufferToCombinedUint8Array(buffer);
              buffer.length = 0; // Clear the buffer after recombining
              try {
                const responseData = await msgToResponseData({
                  msg: { data: combined },
                  subject,
                  request: payload,
                  log,
                });
                clearTimeout(timeoutId);
                subscription.unsubscribe();
                await onResponse?.(responseData);
                resolve(responseData);
                return;
              } catch (e) {
                onError?.(e);
                reject(e);
              }
            }
          }
          if (msg.headers?.get(CHUNK_HEADER)) {
            const chunkHeader = msg.headers.get(CHUNK_HEADER);
            const chunkParts = chunkHeader.split("/");
            if (chunkParts.length !== 2) {
              onError?.(
                new Error("Invalid chunk header format: " + chunkHeader)
              );
              return;
            }
            const [currentChunk, totalChunks] = chunkParts.map(Number);
            if (buffer.length === 0) {
              buffer = new Array(totalChunks).fill(undefined);
            }
            buffer[currentChunk - 1] = new Uint8Array(msg.data);
            return;
          }
          if (isUndefined(msg.data) || msg.data.byteLength === 0) {
            console.log(
              "connectConnectionListenerToSubject: No data in message ",
              msg
            );
            resolve(undefined);
            return;
          }
          clearTimeout(timeoutId);
          subscription.unsubscribe();
          const responseData = await msgToResponseData({
            msg,
            subject,
            request: payload,
            log,
          });
          await onResponse?.(responseData);

          resolve(responseData);
        }
        if (signal) {
          if (signal.aborted) {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
            return reject(new Error("Signal already in aborted state"));
          }
          signal.addEventListener("abort", () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
            reject(new Error("Signal aborted"));
          });
        }
      });
      if (msg.byteLength < maxMessageSize) {
        return connection.publish(subject as string, msg, {
          headers: hs,
          reply: replySubject,
        });
      }
      const chunkCount = Math.ceil(msg.byteLength / maxMessageSize);
      const chunks: Uint8Array[] = [];
      for (let i = 0; i < chunkCount; i++) {
        const start = i * maxMessageSize;
        const end = start + maxMessageSize;
        const chunk = new Uint8Array(msg.slice(start, end));
        chunks.push(chunk);
      }
      // Publish each chunk separately
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkHeader = `${i + 1}/${chunkCount}`;
        const chunkHeaders = {
          ...headers,
          [CHUNK_HEADER]: chunkHeader,
        };
        connection.request(subject as string, chunk, {
          headers: recordToNatsHeaders(chunkHeaders),
          reply: replySubject,
          timeout: timeoutMs,
          noMux: true, // Ensure no multiplexing for chunked messages
        });
      }
      return result;
    },
  };
};
