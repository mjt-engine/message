export type ErrorDetail = {
    message?: string;
    stack?: string;
    extra?: unknown[];
    cause?: ErrorDetail;
};
export declare const errorToErrorDetail: ({ error, extra, stack, }: {
    error: unknown;
    stack?: string;
    extra?: unknown[];
}) => Promise<ErrorDetail>;
