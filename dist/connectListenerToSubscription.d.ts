import { type NatsConnection } from "nats.ws";
import type { ConnectionListener, ConnectionMap } from "./ConnectionMessageTypes";
export declare const connectListenerToSubscription: <CM extends ConnectionMap, S extends keyof CM, E extends Record<string, string>>({ connection, subject, listener, options, env, }: {
    subject: string;
    connection: NatsConnection;
    listener: ConnectionListener<CM, S, E>;
    options?: Partial<{
        log: (message: string, extra: unknown) => void;
    }>;
    env?: Partial<E>;
}) => Promise<void>;
