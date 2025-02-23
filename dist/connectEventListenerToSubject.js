import { Bytes } from "@mjt-engine/byte";
import { isDefined } from "@mjt-engine/object";
export const connectEventListenerToSubjectRoot = async ({ connection, subjectRoot, listener, options = {}, env = {}, signal, onError = (e) => {
    options?.log?.(e);
}, }) => {
    const { log = () => { }, queue, maxMessages, timeout } = options;
    log("connectEventListenerToSubject: subjectRoot: ", subjectRoot);
    const subscription = connection.subscribe(`${subjectRoot}.>`, {
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