import type { EventMap } from "./EventMap";
import type { PartialSubject } from "./PartialSubject";

export type EventListener<
  S extends PartialSubject,
  EM extends EventMap<S>,
  E extends Record<string, string> = Record<string, string>
> = (props: {
  env: Readonly<Partial<E>>;
  detail: EM[S];
  subject: S;
  signal?: AbortSignal;
  unsubscribe: (maxMessages?: number) => void;
  onError?: (error: unknown) => void;
}) => void | Promise<void>;
