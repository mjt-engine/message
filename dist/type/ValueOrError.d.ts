import type { ErrorDetail } from "../error/ErrorDetail";
export type ValueOrError<T = unknown> = {
    value: T;
    error: ErrorDetail;
};
