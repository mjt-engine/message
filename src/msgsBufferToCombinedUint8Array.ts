import { isUndefined } from "@mjt-engine/object";

export const msgsBufferToCombinedUint8Array = (buffer: Uint8Array[]) => {
  if (buffer.some((m) => isUndefined(m))) {
    throw new Error("Incomplete messages in buffer");
  }
  const totalLength = buffer.reduce((acc, m) => acc + m.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const item of buffer) {
    combined.set(item, offset);
    offset += item.byteLength;
  }
  console.log(
    "msgsBufferToCombinedUint8Array: Combined length:",
    combined.length
  );
  return combined;
};
