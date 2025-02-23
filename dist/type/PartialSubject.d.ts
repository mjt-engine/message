export type PartialSubject<T extends string = string> = `${T}.${string}` | T;
