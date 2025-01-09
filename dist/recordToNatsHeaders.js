import { isUndefined } from "@mjt-engine/object";
import { headers as natsHeaders } from "nats.ws";
export const recordToNatsHeaders = (record) => {
    const hs = natsHeaders();
    if (isUndefined(record)) {
        return hs;
    }
    for (const [key, value] of Object.entries(record)) {
        hs.set(key, value);
    }
    return hs;
};
//# sourceMappingURL=recordToNatsHeaders.js.map