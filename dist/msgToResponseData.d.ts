import type { Msg } from "nats.ws";
export declare const msgToResponseData: ({ msg, subject, request, log, }: {
    msg: Msg;
    subject: unknown;
    request: unknown;
    log: (message: unknown, ...extra: unknown[]) => void;
}) => Promise<unknown>;
