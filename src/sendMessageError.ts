import { Bytes } from "@mjt-engine/byte";
import { isDefined } from "@mjt-engine/object";
import { type Msg, headers as natsHeaders } from "nats.ws";
import { errorToErrorDetail } from "./error/errorToErrorDetail";

export const sendMessageError =
  (message: Msg) =>
  async (
    error: unknown,
    options: Partial<{
      code: number;
      codeDescription: string;
      headers: Record<string, string>;
    }> = {}
  ) => {
    const errorDetail = await errorToErrorDetail({
      error,
      extra: [message.subject],
    });
    const responseHeaders = natsHeaders();
    if (isDefined(options.headers)) {
      for (const [key, value] of Object.entries(options.headers)) {
        responseHeaders.set(key, value);
      }
    }
    message.respond(Bytes.toMsgPack({ error: errorDetail }), {
      headers: responseHeaders,
    });
  };
