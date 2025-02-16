import { isDefined, isUndefined } from "@mjt-engine/object";
import { type NatsConnection, headers as natsHeaders } from "nats.ws";
import type {
  ConnectionListener,
  ConnectionMap,
} from "./ConnectionMessageTypes";
import { errorToErrorDetail } from "./error/errorToErrorDetail";
import { natsHeadersToRecord } from "./natsHeadersToRecord";
import { Bytes } from "@mjt-engine/byte";

export const connectListenerToSubscription = async <
  CM extends ConnectionMap,
  S extends keyof CM,
  E extends Record<string, string>
>({
  connection,
  subject,
  listener,
  options = {},
  env = {},
}: {
  subject: string;
  connection: NatsConnection;
  listener: ConnectionListener<CM, S, E>;
  options?: Partial<{ log: (message: unknown, ...extrap: unknown[]) => void }>;
  env?: Partial<E>;
}) => {
  const { log = () => {} } = options;
  log("connectListenerToSubscription: subject: ", subject);
  const subscription = connection.subscribe(subject);

  for await (const message of subscription) {
    try {
      const detail = Bytes.msgPackToObject<CM[S]["request"]>(message.data);
      const requestHeaders = natsHeadersToRecord(
        message.headers
      ) as CM[S]["headers"];
      const abortController = new AbortController();
      if (isDefined(requestHeaders?.["abort-subject"])) {
        const abortSubject = requestHeaders["abort-subject"];
        const abortSubscription = connection.subscribe(abortSubject, {
          max: 1,
          callback: () => {
            abortController.abort();
            abortSubscription.unsubscribe();
            message.respond(); // Acknowledge the abort
          },
        });
      }
      const send = (
        response?: CM[S]["response"],
        options: Partial<{
          code: number;
          codeDescription: string;
          headers: Record<string, string>;
        }> = {}
      ) => {
        const responseHeaders = natsHeaders(
          options.code,
          options.codeDescription
        );
        if (isDefined(options.headers)) {
          for (const [key, value] of Object.entries(options.headers)) {
            responseHeaders.set(key, value);
          }
        }
        if (isUndefined(response)) {
          connection.publish(message.reply!);
          return;
        }
        const responseMsg = Bytes.toMsgPack(response);
        message.respond(responseMsg, {
          headers: responseHeaders,
        });
      };
      const sendError = async (
        error: unknown,

        options: Partial<{
          code: number;

          codeDescription: string;
          headers: Record<string, string>;
        }> = {}
      ) => {
        const errorDetail = await errorToErrorDetail({
          error,
          extra: [message.subject],
        });
        const responseHeaders = natsHeaders(
          options.code ?? 500,
          options.codeDescription ?? "Error"
        );
        if (isDefined(options.headers)) {
          for (const [key, value] of Object.entries(options.headers)) {
            responseHeaders.set(key, value);
          }
        }
        message.respond(Bytes.toMsgPack(errorDetail), {
          headers: responseHeaders,
        });
      };
      const result = await listener({
        detail,
        headers: requestHeaders,
        env,
        signal: abortController.signal,
        send,
        sendError,
      });
      const reply = message.reply;
      if (isUndefined(reply)) {
        continue;
      }
      send(result);
    } catch (error) {
      const errorDetail = await errorToErrorDetail({
        error,
        extra: [message.subject],
      });
      log(errorDetail);
      const hs = natsHeaders(500, "Listener Error");
      message.respond(Bytes.toMsgPack(errorDetail), {
        headers: hs,
      });
    }
  }
};
