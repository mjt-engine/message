import { isDefined, safe } from "@mjt-engine/object";

export const errorToText = (error: unknown) => {
  if (typeof error == "string") {
    return error;
  }
  if (error instanceof Error) {
    return [error.message, error.stack].filter(isDefined).join("\n");
  }
  if (error instanceof Response) {
    return `${error.url} ${error.status} ${error.statusText}`;
  }
  return safe(() => JSON.stringify(error, undefined, 2)) ?? "";
};

export const errorToTextAsync = async (error: unknown) => {
  if (typeof error == "string") {
    return error;
  }
  if (error instanceof Error) {
    return [error.message, error.stack].filter(isDefined).join("\n");
  }
  if (error instanceof Response) {
    const text = await error.text();
    return `${error.url} ${error.status} ${error.statusText} ${text}`;
  }
  return safe(() => JSON.stringify(error, undefined, 2));
};
