import { isDefined, safe } from "@mjt-engine/object";
import type { ErrorDetail } from "./ErrorDetail";

const formatErrorDetail = (errorDetail: ErrorDetail): string => {
  const { message, stack, extra, cause } = errorDetail;
  const causeText = cause ? `\nCaused by: ${formatErrorDetail(cause)}` : "";
  const extraText = extra
    ? `\nExtra: ${JSON.stringify(extra, undefined, 2)}`
    : "";
  return [message, stack].filter(isDefined).join("\n") + extraText + causeText;
};

export const errorToText = (error: unknown): string => {
  if (typeof error == "string") {
    return error;
  }
  if (error instanceof Response) {
    return `${error.url} ${error.status} ${error.statusText}`;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return formatErrorDetail(error as ErrorDetail);
  }
  return safe(() => JSON.stringify(error, undefined, 2)) ?? "";
};

export const errorToTextAsync = async (error: unknown): Promise<string> => {
  if (typeof error == "string") {
    return error;
  }
  if (error instanceof Response) {
    const text = await error.text();
    return `${error.url} ${error.status} ${error.statusText} ${text}`;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return formatErrorDetail(error as ErrorDetail);
  }
  return safe(() => JSON.stringify(error, undefined, 2)) ?? "";
};
