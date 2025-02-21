import { type NatsConnection } from "nats.ws";
import type { ConnectionListener, ConnectionMap } from "./ConnectionMessageTypes";
export declare const connectListenerToSubscription: <CM extends ConnectionMap, S extends keyof CM, E extends Record<string, string>>({ connection, subject, listener, options, env, signal, }: {
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
