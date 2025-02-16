import { Bytes } from "@mjt-engine/byte";
import { errorToErrorDetail } from "./error/errorToErrorDetail";
export const msgToResponseData = ({ msg, subject, request, }) => {
    const responseData = Bytes.msgPackToObject(new Uint8Array(msg.data));
    if (msg.headers?.hasError) {
        throw new Error(`Error response on subject: ${subject}`, {
            cause: errorToErrorDetail({
                error: responseData,
                extra: [request],
            }),
        });
    }
};
//# sourceMappingURL=msgToResponseData.js.map