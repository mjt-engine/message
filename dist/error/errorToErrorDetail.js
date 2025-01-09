import { isDefined } from "@mjt-engine/object";
import { errorToTextAsync } from "./errorToText";
export const errorToErrorDetail = async ({ error, extra, stack, }) => {
    if (error instanceof Error) {
        const cause = isDefined(error.cause)
            ? await errorToErrorDetail({ error: error.cause })
            : undefined;
        return {
            message: error.message,
            stack: error.stack ?? stack,
            extra,
            cause,
        };
    }
    return {
        message: await errorToTextAsync(error),
        stack,
        extra,
    };
};
//# sourceMappingURL=errorToErrorDetail.js.map