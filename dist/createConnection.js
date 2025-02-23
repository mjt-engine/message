import { Bytes } from "@mjt-engine/byte";
import { isDefined, isUndefined, toMany } from "@mjt-engine/object";
import { RequestStrategy, connect, credsAuthenticator, } from "nats.ws";
import { connectConnectionListenerToSubjectRoot } from "./connectConnectionListenerToSubjectRoot";
import { msgToResponseData } from "./msgToResponseData";
import { recordToNatsHeaders } from "./recordToNatsHeaders";
export const createConnection = async ({ server, creds, token, subscribers = {}, options = {}, env = {}, }) => {
    const { log = () => { } } = options;
    log("createConnection: server: ", server);
    const connection = await connect({
        servers: [...toMany(server)],
        authenticator: isDefined(creds)
            ? credsAuthenticator(new TextEncoder().encode(creds))
            : undefined,
        token: token,
    });
    const entries = Object.entries(subscribers);
    log("createConnection: entries: ", entries);
    for (const [subject, listener] of entries) {
        if (isUndefined(listener)) {
            continue;
        }
        connectConnectionListenerToSubjectRoot({
            connection,
            subject,
            listener,
            options,
            env,
        });
    }
    return {
        connection,
        requestMany: async (props) => {
            const { request, subject, headers, options = {}, onResponse, signal, } = props;
            const requestMsg = Bytes.toMsgPack({ value: request });
            const { timeoutMs = 60 * 1000 } = options;
            const hs = recordToNatsHeaders(headers);
            if (isDefined(signal)) {
                const abortSubject = `abort.${Date.now()}.${crypto.randomUUID()}`;
                hs?.set("abort-subject", abortSubject);
                signal.addEventListener("abort", () => {
                    connection.publish(abortSubject);
                });
            }
            const iterable = await connection.requestMany(subject, requestMsg, {
                maxWait: timeoutMs,
                headers: hs,
                strategy: RequestStrategy.SentinelMsg,
            });
            for await (const resp of iterable) {
                iterable;
                if (signal?.aborted) {
                    return;
                }
                if (isUndefined(resp.data) || resp.data.byteLength === 0) {
                    break;
                }
                const responseData = await msgToResponseData({
                    msg: resp,
                    subject,
                    request,
                    log,
                });
                await onResponse(responseData);
            }
        },
        request: async (props) => {
            const { request, subject, headers, options = {} } = props;
            const requestMsg = Bytes.toMsgPack({ value: request });
            const { timeoutMs = 60 * 1000 } = options;
            const hs = recordToNatsHeaders(headers);
            const resp = await connection.request(subject, requestMsg, {
                timeout: timeoutMs,
                headers: hs,
            });
            if (isUndefined(resp.data) || resp.data.byteLength === 0) {
                return undefined;
            }
            return msgToResponseData({ msg: resp, subject, request, log });
        },
        publish: async (props) => {
            const { payload, subject, headers } = props;
            const msg = Bytes.toMsgPack({ value: payload });
            const hs = recordToNatsHeaders(headers);
            return connection.publish(subject, msg, {
                headers: hs,
            });
        },
    };
};
//# sourceMappingURL=createConnection.js.map