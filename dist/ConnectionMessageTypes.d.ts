export type ConnectionMap<Req = unknown, Resp = unknown, Header extends string = string> = Record<string, {
    request: Req;
    response: Resp;
    headers?: Record<Header, string>;
}>;
export type ConnectionSpecialHeader = "abort-subject";
export type ConnectionListener<CM extends ConnectionMap, S extends keyof CM, E extends Record<string, string> = Record<string, string>> = (props: {
    env: Readonly<Partial<E>>;
    detail: CM[S]["request"];
    headers?: CM[S]["headers"];
    signal: AbortSignal;
    send: (response?: CM[S]["response"], options?: Partial<{
        code: number;
        codeDescription: string;
        headers: Record<string, string>;
    }>) => void;
    sendError: (error: unknown, options?: Partial<{
        code: number;
        codeDescription: string;
        headers: Record<string, string>;
    }>) => void;
}) => CM[S]["response"] | Promise<CM[S]["response"] | void> | void | Promise<void>;
export type ConnectionRequester<Req = unknown, Resp = unknown> = (props: {
    subject: string;
    request: Req;
    options?: Partial<{
        headers: Record<string, string>;
    }>;
}) => Promise<Resp>;
