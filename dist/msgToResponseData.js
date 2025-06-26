import { Bytes } from "@mjt-engine/byte";
import { isDefined } from "@mjt-engine/object";
import { Errors } from "@mjt-engine/error";
export const msgToResponseData = async ({ msg, subject, request, log, }) => {
    const responseData = Bytes.msgPackToObject(new Uint8Array(msg.data));
    if (msg.headers?.hasError) {
        log("Error: msgToResponseData: msg.headers.hasError", {
            headers: msg.headers,
            responseData,
        });
        throw new Error(`Message Error on subject: ${subject}`, {
            cause: Errors.errorToErrorDetail({
                error: responseData,
                extra: [request],
            }),
        });
    }
    if (isDefined(responseData.error)) {
        log("Error: msgToResponseData: responseData.error", responseData.error);
        throw new Error(`Error on subject: ${subject}`, {
            cause: Errors.errorToErrorDetail({
                error: responseData.error,
                extra: [request],
            }),
        });
    }
    return responseData.value;
};
//# sourceMappingURL=msgToResponseData.js.map