import { Bytes } from "@mjt-engine/byte";
import { isDefined } from "@mjt-engine/object";
export const connectEventListenerToSubject = async ({ connection, subject, listener, options = {}, env = {}, signal, onError = (e) => {
    options?.log?.(e);
}, }) => {
    const { log = () => { }, queue, maxMessages, timeout } = options;
    log("connectEventListenerToSubject: subject: ", subject);
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
            const unsubscribe = (maxMessages) => subscription.unsubscribe(maxMessages);
            if (isDefined(valueOrError.error)) {
                onError(valueOrError.error);
                continue;
            }
            await listener({
                detail: valueOrError.value,
                env,
                signal,
                unsubscribe,
            });
        }
        catch (error) {
            onError(error);
        }
    }
};
//# sourceMappingURL=connectEventListenerToSubject.js.map