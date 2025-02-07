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
import type {
  ConnectionListener,
  ConnectionMap,
  ConnectionSpecialHeader,
} from "./ConnectionMessageTypes";
import { connectListenerToSubscription } from "./connectListenerToSubscription";
import { recordToNatsHeaders } from "./recordToNatsHeaders";

export type MessageConnection = NatsConnection;
export type MessageConnectionStats = Stats;
export type MessageConnectionStatus = Status;

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
    log: (message: string, extra: unknown) => void;
  }>;
  env?: Partial<E>;
}) => {
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
    connectListenerToSubscription({
      connection,
      subject,
      listener,
      options,
      env,
    });
  }

  return {
    connection: {
      close: () => connection.close(),
      drain: () => connection.drain(),
      flush: () => connection.flush(),
      stats: () => {
        console.log(connection.stats());
      },
      status: () => {
        console.log(connection.status());
      },
    },
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
      const requestMsg = Bytes.toMsgPack(request);
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

        const responseData = Bytes.msgPackToObject<CM[S]["response"]>(
          new Uint8Array(resp.data)
        );
        if (resp.headers?.hasError) {
          throw new Error(`Error response on subject: ${subject as string}`, {
            cause: responseData,
          });
        }
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
      const requestMsg = Bytes.toMsgPack(request);
      const { timeoutMs = 60 * 1000 } = options;

      const hs = recordToNatsHeaders(headers);

      const resp = await connection.request(subject as string, requestMsg, {
        timeout: timeoutMs,
        headers: hs,
      });

      const responseData = Bytes.msgPackToObject<CM[S]["response"]>(resp.data);
      if (resp.headers?.hasError) {
        throw new Error(`Error response on subject: ${subject as string}`, {
          cause: responseData,
        });
      }
      return responseData;
    },
  };
};
