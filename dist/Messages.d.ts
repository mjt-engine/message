export declare const Messages: {
    createConnection: <CM extends import(".").ConnectionMap, E extends Record<string, string> = Record<string, string>>({ server, creds, token, subscribers, options, env, }: {
        server: string[] | string;
        subscribers?: Partial<{ [k in keyof CM]: import(".").ConnectionListener<CM, k, E>; }>;
        creds?: string;
        token?: string;
        options?: Partial<{
            log: (message: unknown, ...extra: unknown[]) => void;
        }>;
        env?: Partial<E>;
    }) => Promise<{
        connection: {
            close: () => Promise<void>;
            drain: () => Promise<void>;
            flush: () => Promise<void>;
            stats: () => void;
            status: () => void;
        };
        requestMany: <S extends keyof CM>(props: {
            subject: S;
            request: CM[S]["request"];
            headers?: Record<keyof CM[S]["headers"], string>;
            options?: Partial<{
                timeoutMs: number;
            }>;
            onResponse: (response: CM[S]["response"]) => void | Promise<void>;
            signal?: AbortSignal;
        }) => Promise<void>;
        request: <S extends keyof CM>(props: {
            subject: S;
            request: CM[S]["request"];
            headers?: Record<keyof CM[S]["headers"], string>;
            options?: Partial<{
                timeoutMs: number;
            }>;
        }) => Promise<CM[S]["response"]>;
        publish: <S extends import(".").PartialSubject, EM extends import(".").EventMap<S>>(props: {
            subject: S;
            payload: EM[S];
            headers?: Record<keyof CM[S]["headers"], string>;
        }) => Promise<void>;
    }>;
    connectEventListenerToSubject: <S extends import(".").PartialSubject, EM extends import(".").EventMap<S>, E extends Record<string, string> = Record<string, string>>({ connection, subject, listener, options, env, signal, onError, }: {
        subject: string;
        connection: import("nats.ws").NatsConnection;
        listener: import(".").EventListener<S, EM, E>;
        options?: Partial<{
            queue?: string;
            maxMessages?: number;
            timeout?: number;
            log: (message: unknown, ...extra: unknown[]) => void;
        }>;
        env?: Partial<E>;
        signal?: AbortSignal;
        onError?: (error: unknown) => void;
    }) => Promise<void>;
};
