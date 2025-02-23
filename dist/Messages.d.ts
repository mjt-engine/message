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
    }) => Promise<import("./createConnection").MessageConnectionInstance<CM>>;
    connectEventListenerToSubjectRoot: <S extends import(".").PartialSubject, EM extends import(".").EventMap<S>, E extends Record<string, string> = Record<string, string>>({ connection, subjectRoot, listener, options, env, signal, onError, }: {
        subjectRoot: string;
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
