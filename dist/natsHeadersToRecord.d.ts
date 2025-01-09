import type { Msg } from "nats.ws";
export declare const natsHeadersToRecord: (headers?: Msg["headers"]) => Record<string, string> | undefined;
