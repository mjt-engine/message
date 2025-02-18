import { type Msg } from "nats.ws";
export declare const sendMessageError: (message: Msg) => (error: unknown, options?: Partial<{
    code: number;
    codeDescription: string;
    headers: Record<string, string>;
}>) => Promise<void>;
