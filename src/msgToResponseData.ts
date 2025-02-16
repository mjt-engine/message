import { Bytes } from "@mjt-engine/byte";
import type { Msg } from "nats.ws";
import { errorToErrorDetail } from "./error/errorToErrorDetail";


export const msgToResponseData = ({
  msg, subject, request,
}: {
  msg: Msg;
  subject: unknown;
  request: unknown;
}) => {
  const responseData = Bytes.msgPackToObject(new Uint8Array(msg.data));
  if (msg.headers?.hasError) {
    throw new Error(`Error response on subject: ${subject as string}`, {
      cause: errorToErrorDetail({
        error: responseData,
        extra: [request],
      }),
    });
  }
};
