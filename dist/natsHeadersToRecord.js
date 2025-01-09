import { isUndefined } from "@mjt-engine/object";
export const natsHeadersToRecord = (headers) => {
    if (isUndefined(headers)) {
        return undefined;
    }
    const keys = headers.keys();
    const result = {};
    for (const key of keys) {
        result[key] = headers.get(key);
    }
    return result;
};
//# sourceMappingURL=natsHeadersToRecord.js.map