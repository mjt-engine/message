import { type NatsConnection } from "nats.ws";
import type { EventListener } from "./type/EventListener";
import type { EventMap } from "./type/EventMap";
import type { PartialSubject } from "./type/PartialSubject";
export declare const connectEventListenerToSubject: <S extends PartialSubject, EM extends EventMap<S>, E extends Record<string, string>>({ connection, subject, listener, options, env, signal, onError, }: {
    subject: string;
    connection: NatsConnection;
    listener: EventListener<S, EM, E>;
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
