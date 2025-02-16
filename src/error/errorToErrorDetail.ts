import { isDefined } from "@mjt-engine/object";
import { errorToTextAsync } from "./errorToText";
import type { ErrorDetail } from "./ErrorDetail";

export const errorToErrorDetail = async ({
  error,
  extra,
  stack,
}: {
  error: unknown;
  stack?: string;
  extra?: unknown[];
}): Promise<ErrorDetail> => {
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
