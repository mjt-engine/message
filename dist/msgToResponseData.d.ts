import type { Msg } from "nats.ws";
export declare const msgToResponseData: ({ msg, subject, request, }: {
    msg: Msg;
    subject: unknown;
    request: unknown;
}) => Promise<unknown>;
