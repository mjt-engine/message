import type { Msg, MsgHdrs } from "nats.ws";
export declare const msgToResponseData: ({ msg, subject, request, log, }: {
    msg: Msg | {
        data: Uint8Array;
        headers?: MsgHdrs;
    };
    subject: unknown;
    request: unknown;
    log: (message: unknown, ...extra: unknown[]) => void;
}) => Promise<unknown>;
