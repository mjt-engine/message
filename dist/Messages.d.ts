export declare const Messages: {
    createConnection: <CM extends import("./ConnectionMessageTypes").ConnectionMap, E extends Record<string, string> = Record<string, string>>({ server, creds, token, subscribers, options, env, }: {
        server: string[] | string;
        subscribers?: Partial<{ [k in keyof CM]: import("./ConnectionMessageTypes").ConnectionListener<CM, k, E>; }>;
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
    }>;
    connectListenerToSubscription: <CM extends import("./ConnectionMessageTypes").ConnectionMap, S extends keyof CM, E extends Record<string, string>>({ connection, subject, listener, options, env, }: {
        subject: string;
        connection: import("nats.ws").NatsConnection;
        listener: import("./ConnectionMessageTypes").ConnectionListener<CM, S, E>;
        options?: Partial<{
            log: (message: unknown, ...extrap: unknown[]) => void;
        }>;
        env?: Partial<E>;
    }) => Promise<void>;
};
