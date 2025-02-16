import { isDefined, isUndefined } from "@mjt-engine/object";
import { headers as natsHeaders } from "nats.ws";
import { errorToErrorDetail } from "./error/errorToErrorDetail";
import { natsHeadersToRecord } from "./natsHeadersToRecord";
import { Bytes } from "@mjt-engine/byte";
export const connectListenerToSubscription = async ({ connection, subject, listener, options = {}, env = {}, }) => {
    const { log = () => { } } = options;
    log("connectListenerToSubscription: subject: ", subject);
    const subscription = connection.subscribe(subject);
    for await (const message of subscription) {
        try {
            const detail = Bytes.msgPackToObject(message.data);
            const requestHeaders = natsHeadersToRecord(message.headers);
            const abortController = new AbortController();
            if (isDefined(requestHeaders?.["abort-subject"])) {
                const abortSubject = requestHeaders["abort-subject"];
                const abortSubscription = connection.subscribe(abortSubject, {
                    max: 1,
                    callback: () => {
                        abortController.abort();
                        abortSubscription.unsubscribe();
                        message.respond(); // Acknowledge the abort
                    },
                });
            }
            const send = (response, options = {}) => {
                const responseHeaders = natsHeaders(options.code, options.codeDescription);
                if (isDefined(options.headers)) {
                    for (const [key, value] of Object.entries(options.headers)) {
                        responseHeaders.set(key, value);
                    }
                }
                if (isUndefined(response)) {
                    connection.publish(message.reply);
                    return;
                }
                const responseMsg = Bytes.toMsgPack(response);
                message.respond(responseMsg, {
                    headers: responseHeaders,
                });
            };
            const sendError = async (error, options = {}) => {
                const errorDetail = await errorToErrorDetail({
                    error,
                    extra: [message.subject],
                });
                const responseHeaders = natsHeaders(options.code ?? 500, options.codeDescription ?? "Error");
                if (isDefined(options.headers)) {
                    for (const [key, value] of Object.entries(options.headers)) {
                        responseHeaders.set(key, value);
                    }
                }
                message.respond(Bytes.toMsgPack(errorDetail), {
                    headers: responseHeaders,
                });
            };
            const result = await listener({
                detail,
                headers: requestHeaders,
                env,
                signal: abortController.signal,
                send,
                sendError,
            });
            const reply = message.reply;
            if (isUndefined(reply)) {
                continue;
            }
            send(result);
        }
        catch (error) {
            log("connectListenerToSubscription: error", error);
            const errorDetail = await errorToErrorDetail({
                error,
                extra: [message.subject],
            });
            const hs = natsHeaders(500, "Listener Error");
            message.respond(Bytes.toMsgPack(errorDetail), {
                headers: hs,
            });
        }
    }
};
//# sourceMappingURL=connectListenerToSubscription.js.map