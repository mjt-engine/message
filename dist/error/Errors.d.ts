export declare const Errors: {
    errorToErrorDetail: ({ error, extra, stack, }: {
        error: unknown;
        stack?: string;
        extra?: unknown[];
    }) => Promise<import("./ErrorDetail").ErrorDetail>;
    errorToText: (error: unknown) => string;
    errorToTextAsync: (error: unknown) => Promise<string>;
};
