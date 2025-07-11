import { isUndefined } from "@mjt-engine/object";

export const msgsBufferToCombinedUint8Array = (
  buffer: (Uint8Array | undefined)[]
) => {
  console.log("msgsBufferToCombinedUint8Array: Buffer length:", buffer.length);
  console.log("msgsBufferToCombinedUint8Array: Buffer contents:", buffer);
  if (buffer.some((m) => isUndefined(m))) {
    throw new Error("Incomplete messages in buffer");
  }
  const totalLength = (buffer as Uint8Array[]).reduce(
    (acc, m) => acc + m.byteLength,
    0
  );
  console.log("msgsBufferToCombinedUint8Array: Total length:", totalLength);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const item of buffer) {
    if (isUndefined(item)) {
      throw new Error("Undefined item in buffer");
    }
    combined.set(item, offset);
    offset += item.byteLength;
  }
  console.log(
    "msgsBufferToCombinedUint8Array: Combined length:",
    combined.length
  );
  return combined;
};
