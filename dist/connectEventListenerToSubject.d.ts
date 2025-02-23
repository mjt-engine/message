import { type NatsConnection } from "nats.ws";
import type { EventListener } from "./type/EventListener";
import type { EventMap } from "./type/EventMap";
import type { PartialSubject } from "./type/PartialSubject";
export declare const connectEventListenerToSubjectRoot: <S extends PartialSubject, EM extends EventMap<S>, E extends Record<string, string> = Record<string, string>>({ connection, subjectRoot, listener, options, env, signal, onError, }: {
    subjectRoot: string;
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
