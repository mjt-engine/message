import { Bytes } from "@mjt-engine/byte";
import { isDefined, isUndefined } from "@mjt-engine/object";
import { type NatsConnection, headers as natsHeaders } from "nats.ws";
import type {
  ConnectionListener,
  ConnectionMap,
} from "./ConnectionMessageTypes";
import { errorToErrorDetail } from "./error/errorToErrorDetail";
import { natsHeadersToRecord } from "./natsHeadersToRecord";
import { sendMessageError } from "./sendMessageError";
import type { ValueOrError } from "./ValueOrError";

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
  signal,
}: {
  subject: string;
  connection: NatsConnection;
  listener: ConnectionListener<CM, S, E>;
  options?: Partial<{
    queue?: string;
    maxMessages?: number;
    timeout?: number;
    log: (message: unknown, ...extra: unknown[]) => void;
  }>;
  env?: Partial<E>;
  signal?: AbortSignal;
}) => {
  const { log = () => {}, queue, maxMessages, timeout } = options;
  log("connectListenerToSubscription: subject: ", subject);
  const subscription = connection.subscribe(subject, {
    queue,
    max: maxMessages,
    timeout,
  });

  if (isDefined(signal)) {
    signal.addEventListener("abort", () => {
      subscription.unsubscribe();
    });
  }

  for await (const message of subscription) {
    try {
      const valueOrError = Bytes.msgPackToObject<
        ValueOrError<CM[S]["request"]>
      >(message.data);
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
        const responseMsg = Bytes.toMsgPack({
          value: response,
        } as ValueOrError);
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
      ) => sendMessageError(message)(error, options);

      const unsubscribe = (maxMessages?: number) =>
        subscription.unsubscribe(maxMessages);

      if (isDefined(valueOrError.error)) {
        throw valueOrError.error;
      }

      const result = await listener({
        detail: valueOrError.value,
        headers: requestHeaders,
        env,
        signal: abortController.signal,
        send,
        sendError,
        unsubscribe,
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
      return sendMessageError(message)(error);
    }
  }
};
