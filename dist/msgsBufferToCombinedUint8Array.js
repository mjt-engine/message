import { isUndefined } from "@mjt-engine/object";
export const msgsBufferToCombinedUint8Array = (buffer) => {
    if (buffer.some((m) => isUndefined(m))) {
        throw new Error("Incomplete messages in buffer");
    }
    const totalLength = buffer.reduce((acc, m) => acc + m.data.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const m of buffer) {
        combined.set(new Uint8Array(m.data), offset);
        offset += m.data.byteLength;
    }
    console.log("msgsBufferToCombinedUint8Array: Combined length:", combined.length);
    return combined;
};
//# sourceMappingURL=msgsBufferToCombinedUint8Array.js.map