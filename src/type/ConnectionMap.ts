export type ConnectionMap<
  Req = unknown,
  Resp = unknown,
  Header extends string = string
> = Record<
  string, { request: Req; response: Resp; headers?: Record<Header, string>; }
>;
