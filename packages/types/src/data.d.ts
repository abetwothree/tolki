import type { ObjectKey } from "./objects";

export type DataItems<TValue, TKey extends ObjectKey = ObjectKey> =
    | TValue[]
    | Record<TKey, TValue>;

export interface Countable {
    count(): number;
}

export interface IteratorAggregate<TValue, TKey> {
    getIterator(): IterableIterator<[TKey, TValue]>;
}

export interface Jsonable {
    toJson(): string;
}

export interface JsonSerializable {
    jsonSerialize(): unknown;
}
