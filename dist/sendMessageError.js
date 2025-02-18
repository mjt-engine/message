import { Bytes } from "@mjt-engine/byte";
import { isDefined } from "@mjt-engine/object";
import { headers as natsHeaders } from "nats.ws";
import { errorToErrorDetail } from "./error/errorToErrorDetail";
export const sendMessageError = (message) => async (error, options = {}) => {
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
//# sourceMappingURL=sendMessageError.js.map