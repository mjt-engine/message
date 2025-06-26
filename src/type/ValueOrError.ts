import { ErrorDetail } from "@mjt-engine/error";

export type ValueOrError<T = unknown> = { value: T; error: ErrorDetail };
