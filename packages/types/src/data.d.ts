/**
 * Data that is either a list or a keyed record. Use it for an implementation signature only:
 * as a return type it is a union, so it can only ever be a lower bound and erases the
 * per-shape type the `@tolki/arr` and `@tolki/obj` helpers compute.
 */
export type DataItems<TValue, TKey extends PropertyKey = PropertyKey> =
    | TValue[]
    | Record<TKey, TValue>;

/**
 * Data that may also be supplied as one of the iterable structures that stand
 * in for a PHP `iterable`: a Map for keyed items, or any other iterable such
 * as a generator or a Set for positional items.
 */
export type DataIterableItems<TValue, TKey extends PropertyKey = PropertyKey> =
    | DataItems<TValue, TKey>
    | Map<TKey, TValue>
    | Iterable<TValue>;

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
