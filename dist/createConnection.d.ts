import { type NatsConnection, type Stats, type Status } from "nats.ws";
import type { ConnectionListener } from "./type/ConnectionListener";
import type { ConnectionMap } from "./type/ConnectionMap";
import type { EventMap } from "./type/EventMap";
import type { PartialSubject } from "./type/PartialSubject";
export type MessageConnection = NatsConnection;
export type MessageConnectionStats = Stats;
export type MessageConnectionStatus = Status;
export type MessageConnectionInstance<CM extends ConnectionMap> = {
    connection: MessageConnection;
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
    publish: <S extends PartialSubject, EM extends EventMap<S>>(props: {
        subject: S;
        payload: EM[S];
        headers?: Record<keyof CM[S]["headers"], string>;
        options?: Partial<{
            timeoutMs: number;
        }>;
        onResponse?: (response: CM[S]["response"]) => void | Promise<void>;
        onError?: (error: unknown) => void;
        signal?: AbortSignal;
    }) => Promise<void>;
};
export declare const createConnection: <CM extends ConnectionMap, E extends Record<string, string> = Record<string, string>>({ server, creds, token, subscribers, options, env, }: {
    server: string[] | string;
    subscribers?: Partial<{ [k in keyof CM]: ConnectionListener<CM, k, E>; }>;
    creds?: string;
    token?: string;
    options?: Partial<{
        log: (message: unknown, ...extra: unknown[]) => void;
        maxMessageSize?: number;
    }>;
    env?: Partial<E>;
}) => Promise<MessageConnectionInstance<CM>>;
