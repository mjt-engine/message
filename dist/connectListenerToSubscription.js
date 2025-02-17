import { Bytes } from "@mjt-engine/byte";
import { isDefined, isUndefined } from "@mjt-engine/object";
import { headers as natsHeaders } from "nats.ws";
import { errorToErrorDetail } from "./error/errorToErrorDetail";
import { natsHeadersToRecord } from "./natsHeadersToRecord";
import { sendMessageError } from "./sendMessageError";
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
            const sendError = async (error, options = {}) => sendMessageError(message)(error, options);
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
            const errorDetail = await errorToErrorDetail({
                error,
                extra: [message.subject],
            });
            log(errorDetail);
            return sendMessageError(message)(error);
        }
    }
};
//# sourceMappingURL=connectListenerToSubscription.js.map