import type { PartialSubject } from "./PartialSubject";
export type EventMap<S extends PartialSubject, T = unknown> = Record<S, T>;
