import { type NatsConnection, type Stats, type Status } from "nats.ws";
import type { ConnectionListener, ConnectionMap } from "./ConnectionMessageTypes";
export type MessageConnection = NatsConnection;
export type MessageConnectionStats = Stats;
export type MessageConnectionStatus = Status;
export declare const createConnection: <CM extends ConnectionMap, E extends Record<string, string> = Record<string, string>>({ server, creds, token, subscribers, options, env, }: {
    server: string[] | string;
    subscribers?: Partial<{ [k in keyof CM]: ConnectionListener<CM, k, E>; }>;
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
