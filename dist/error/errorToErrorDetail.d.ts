import type { ErrorDetail } from "./ErrorDetail";
export declare const errorToErrorDetail: ({ error, extra, stack, }: {
    error: unknown;
    stack?: string;
    extra?: unknown[];
}) => Promise<ErrorDetail>;
