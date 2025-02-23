import { Bytes } from "@mjt-engine/byte";
import { isDefined } from "@mjt-engine/object";
import { type NatsConnection } from "nats.ws";
import type { EventListener } from "./type/EventListener";
import type { EventMap } from "./type/EventMap";
import type { PartialSubject } from "./type/PartialSubject";
import type { ValueOrError } from "./type/ValueOrError";

export const connectEventListenerToSubject = async <
  S extends PartialSubject,
  EM extends EventMap<S>,
  E extends Record<string, string> = Record<string, string>
>({
  connection,
  subject,
  listener,
  options = {},
  env = {},
  signal,
  onError = (e) => {
    options?.log?.(e);
  },
}: {
  subject: string;
  connection: NatsConnection;
  listener: EventListener<S, EM, E>;
  options?: Partial<{
    queue?: string;
    maxMessages?: number;
    timeout?: number;
    log: (message: unknown, ...extra: unknown[]) => void;
  }>;
  env?: Partial<E>;
  signal?: AbortSignal;

  onError?: (error: unknown) => void;
}) => {
  const { log = () => {}, queue, maxMessages, timeout } = options;
  log("connectEventListenerToSubject: subject: ", subject);
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

  for await (const message of subscription) {
    try {
      const valueOrError = Bytes.msgPackToObject<ValueOrError<EM[S]>>(
        message.data
      );

      const unsubscribe = (maxMessages?: number) =>
        subscription.unsubscribe(maxMessages);

      if (isDefined(valueOrError.error)) {
        onError(valueOrError.error);
        continue;
      }

      await listener({
        detail: valueOrError.value,
        env,
        signal,
        unsubscribe,
      });
    } catch (error) {
      onError(error);
    }
  }
};
