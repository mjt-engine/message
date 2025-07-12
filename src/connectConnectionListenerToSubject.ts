import { Bytes } from "@mjt-engine/byte";
import { Errors } from "@mjt-engine/error";
import { isDefined, isUndefined } from "@mjt-engine/object";
import { type NatsConnection, headers as natsHeaders } from "nats.ws";
import { ABORT_SUBJECT_HEADER } from "./SPECIAL_HEADERS";
import { msgsBufferToCombinedUint8Array } from "./msgsBufferToCombinedUint8Array";
import { natsHeadersToRecord } from "./natsHeadersToRecord";
import { sendMessageError } from "./sendMessageError";
import type { ConnectionListener } from "./type/ConnectionListener";
import type { ConnectionMap } from "./type/ConnectionMap";
import type { ValueOrError } from "./type/ValueOrError";

export const DEFAULT_MAX_MESSAGE_SIZE = 1024 * 1024 * 4;

export const connectConnectionListenerToSubject = async <
  S extends keyof CM,
  CM extends ConnectionMap,
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
  log("connectConnectionListenerToSubject: subject: ", subject);
  const subscription = connection.subscribe(subject, {
    queue,
    max: maxMessages,
    timeout,
  });

  if (isDefined(signal)) {
    if (signal.aborted) {
      subscription.unsubscribe();
      throw new Error("Signal already in aborted state");
    }
    signal.addEventListener("abort", () => {
      subscription.unsubscribe();
    });
  }

  let buffer: (Uint8Array | undefined)[] = [];

  for await (const message of subscription) {
    try {
      const requestHeaders = natsHeadersToRecord(
        message.headers
      ) as CM[S]["headers"];
      const abortController = new AbortController();
      if (isDefined(requestHeaders?.[ABORT_SUBJECT_HEADER])) {
        const abortSubject = requestHeaders[ABORT_SUBJECT_HEADER];
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
        console.log(
          "connectConnectionListenerToSubject: send called",
          response
        );
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
          console.log("NO RESPONSE SENDING EMPTY ISH REPLY");
          // connection.publish(message.reply!);
          message.respond(undefined, {
            headers: responseHeaders,
          });
          return;
        }
        // const replySubject = message.headers?.get(REPLY_HEADER);
        const responseMsg = Bytes.toMsgPack({
          value: response,
        } as ValueOrError);
        // TODO chunk replies if needed
        // if (isDefined(replySubject)) {
        //   console.log(
        //     `connectConnectionListenerToSubject: Sending response to reply subject: ${replySubject}`,
        //     replySubject
        //   );
        //   console.log("before publish");
        //   connection.publish(replySubject, responseMsg, {
        //     headers: responseHeaders,
        //   });
        //   console.log("after publish");
        //   return;
        // }
        connection.publish(message.reply!, responseMsg, {
          headers: responseHeaders,
        });
        // message.respond(responseMsg, {
        //   headers: responseHeaders,
        // });
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

      const chunkHeader = message.headers?.get("chunk");
      let data: Uint8Array = message.data;

      if (isDefined(chunkHeader)) {
        const chunkParts = chunkHeader.split("/");
        if (chunkParts.length !== 2) {
          throw new Error(
            `Invalid chunk header format: ${chunkHeader}. Expected format: "current/total"`
          );
        }
        const [currentChunk, totalChunks] = chunkParts.map(Number);
        if (buffer.length === 0) {
          buffer = new Array(totalChunks).fill(undefined);
        }
        buffer[currentChunk - 1] = new Uint8Array(message.data);
        if (buffer.some((msg) => isUndefined(msg))) {
          continue; // Wait for all chunks
        }
        // Recombine the chunks
        const combined = msgsBufferToCombinedUint8Array(buffer);
        data = combined;
      }
      buffer.length = 0; // Clear the buffer after recombining

      const valueOrError =
        Bytes.msgPackToObject<ValueOrError<CM[S]["request"]>>(data);

      if (isDefined(valueOrError.error)) {
        log(
          "Error: connectListenerToSubscription: valueOrError.error",
          valueOrError.error
        );
        continue;
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
        console.log(
          "connectConnectionListenerToSubject: No reply subject found, skipping response"
        );
        continue;
      }
      console.log(
        `connectConnectionListenerToSubject: Sending response to ${subject} reply subject: ${reply}`,
        result
      );
      send(result);
    } catch (error) {
      const errorDetail = Errors.errorToErrorDetail({
        error,
        extra: [message.subject],
      });
      log(errorDetail);
      sendMessageError(message)(error);
    }
  }
};
