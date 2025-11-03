export type DataItems<TValue, TKey extends PropertyKey = PropertyKey> =
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
