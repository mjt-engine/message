import type { PartialSubject } from "./PartialSubject";
export type ParsedSubject<T extends string = string> = {
    root: T;
    segments: string[];
    subpath: string;
};
export declare const parseSubject: <T extends string = string>(subject: PartialSubject<T>) => ParsedSubject<T>;
