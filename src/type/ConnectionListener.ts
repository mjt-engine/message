import type { ConnectionMap } from "./ConnectionMap";


export type ConnectionListener<
  CM extends ConnectionMap,
  S extends keyof CM,
  E extends Record<string, string> = Record<string, string>
> = (props: {
  env: Readonly<Partial<E>>;
  detail: CM[S]["request"];
  headers?: CM[S]["headers"];
  signal: AbortSignal;
  send: (
    response?: CM[S]["response"],
    options?: Partial<{
      code: number;
      codeDescription: string;
      headers: Record<string, string>;
    }>
  ) => void;
  sendError: (
    error: unknown,
    options?: Partial<{
      code: number;
      codeDescription: string;
      headers: Record<string, string>;
    }>
  ) => void;
  unsubscribe: (maxMessages?: number) => void;
}) => CM[S]["response"] |
    Promise<CM[S]["response"] | void> |
    void |
    Promise<void>;
