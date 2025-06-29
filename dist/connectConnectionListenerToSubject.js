import { Bytes } from "@mjt-engine/byte";
import { isDefined, isUndefined } from "@mjt-engine/object";
import { headers as natsHeaders } from "nats.ws";
import { natsHeadersToRecord } from "./natsHeadersToRecord";
import { sendMessageError } from "./sendMessageError";
import { Errors } from "@mjt-engine/error";
export const connectConnectionListenerToSubject = async ({ connection, subject, listener, options = {}, env = {}, signal, }) => {
    const { log = () => { }, queue, maxMessages, timeout } = options;
    log("connectConnectionListenerToSubject: subject: ", subject);
    const subscription = connection.subscribe(subject, {
        queue,
        max: maxMessages,
        timeout,
    });
    if (isDefined(signal)) {
        if (signal.aborted) {
            subscription.unsubscribe();
            throw new Error("Signal already in aborted state");
        }
        signal.addEventListener("abort", () => {
            subscription.unsubscribe();
        });
    }
    for await (const message of subscription) {
        try {
            const valueOrError = Bytes.msgPackToObject(message.data);
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
                const responseMsg = Bytes.toMsgPack({
                    value: response,
                });
                message.respond(responseMsg, {
                    headers: responseHeaders,
                });
            };
            const sendError = async (error, options = {}) => sendMessageError(message)(error, options);
            const unsubscribe = (maxMessages) => subscription.unsubscribe(maxMessages);
            if (isDefined(valueOrError.error)) {
                log("Error: connectListenerToSubscription: valueOrError.error", valueOrError.error);
                continue;
            }
            const result = await listener({
                detail: valueOrError.value,
                headers: requestHeaders,
                env,
                signal: abortController.signal,
                send,
                sendError,
                unsubscribe,
            });
            const reply = message.reply;
            if (isUndefined(reply)) {
                continue;
            }
            send(result);
        }
        catch (error) {
            const errorDetail = Errors.errorToErrorDetail({
                error,
                extra: [message.subject],
            });
            log(errorDetail);
            sendMessageError(message)(error);
        }
    }
};
//# sourceMappingURL=connectConnectionListenerToSubject.js.map