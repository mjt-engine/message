import { isUndefined } from "@mjt-engine/object";
import type { Msg } from "nats.ws";

export const natsHeadersToRecord = (headers?: Msg["headers"]) => {
  if (isUndefined(headers)) {
    return undefined;
  }
  const keys = headers.keys();
  const result: Record<string, string> = {};
  for (const key of keys) {
    result[key] = headers.get(key);
  }
  return result;
};
