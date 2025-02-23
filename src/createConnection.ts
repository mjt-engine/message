import { Bytes } from "@mjt-engine/byte";
import { isDefined, isUndefined, toMany } from "@mjt-engine/object";
import {
  RequestStrategy,
  connect,
  credsAuthenticator,
  type NatsConnection,
  type Stats,
  type Status,
} from "nats.ws";
import type { ConnectionMap } from "./type/ConnectionMap";
import type { ConnectionSpecialHeader } from "./type/ConnectionSpecialHeader";
import type { ConnectionListener } from "./type/ConnectionListener";
import { connectConnectionListenerToSubject } from "./connectConnectionListenerToSubject";
import { msgToResponseData } from "./msgToResponseData";
import { recordToNatsHeaders } from "./recordToNatsHeaders";
import type { ValueOrError } from "./type/ValueOrError";
import type { PartialSubject } from "./type/PartialSubject";
import type { EventMap } from "./type/EventMap";

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
    payload: EM[S];
    headers?: Record<keyof CM[S]["headers"], string>;
  }) => Promise<void>;
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
  }>;
  env?: Partial<E>;
}): Promise<MessageConnectionInstance<CM>> => {
  const { log = () => {} } = options;
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
      options?: Partial<{ timeoutMs: number }>;
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
      const requestMsg = Bytes.toMsgPack({ value: request } as ValueOrError);
      const { timeoutMs = 60 * 1000 } = options;

      const hs = recordToNatsHeaders(headers);
      if (isDefined(signal)) {
        const abortSubject = `abort.${Date.now()}.${crypto.randomUUID()}`;
        hs?.set(
          "abort-subject" satisfies ConnectionSpecialHeader,
          abortSubject
        );
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
      for await (const resp of iterable) {
        iterable;
        if (signal?.aborted) {
          return;
        }
        if (isUndefined(resp.data) || resp.data.byteLength === 0) {
          break;
        }
        const responseData = await msgToResponseData({
          msg: resp,
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
      return msgToResponseData({ msg: resp, subject, request, log });
    },
    publish: async <S extends PartialSubject, EM extends EventMap<S>>(props: {
      subject: S;
      payload: EM[S];
      headers?: Record<keyof CM[S]["headers"], string>;
    }): Promise<void> => {
      const { payload, subject, headers } = props;
      const msg = Bytes.toMsgPack({ value: payload } as ValueOrError);

      const hs = recordToNatsHeaders(headers);

      return connection.publish(subject as string, msg, {
        headers: hs,
      });
    },
  };
};
