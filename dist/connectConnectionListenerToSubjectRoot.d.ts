import { type NatsConnection } from "nats.ws";
import type { ConnectionMap } from "./type/ConnectionMap";
import type { ConnectionListener } from "./type/ConnectionListener";
export declare const connectConnectionListenerToSubjectRoot: <S extends keyof CM, CM extends ConnectionMap, E extends Record<string, string>>({ connection, subject, listener, options, env, signal, }: {
    subject: string;
    connection: NatsConnection;
    listener: ConnectionListener<CM, S, E>;
    options?: Partial<{
        queue?: string;
        maxMessages?: number;
        timeout?: number;
        log: (message: unknown, ...extra: unknown[]) => void;
    }>;
    env?: Partial<E>;
    signal?: AbortSignal;
}) => Promise<void>;
