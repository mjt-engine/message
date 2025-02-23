import type { PartialSubject } from "./PartialSubject";


export type ParsedSubject<T extends string = string> = {
  root: T;
  segments: string[];
  subpath: string;
};

export const parseSubject = <T extends string = string>(
  subject: PartialSubject<T>
): ParsedSubject<T> => {
  const segments = subject.split(".");
  const root = segments.shift() as T;
  const subpath = segments.join(".");

  return {
    root,
    segments,
    subpath,
  };
};
