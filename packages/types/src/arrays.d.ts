export interface Arrayable<TValue> {
    toArray(): TValue[];
}

export interface ArrayAccess<TValue> {
    offsetExists(offset: number | string): boolean;
    offsetGet(offset: number | string): TValue | undefined;
    offsetSet(offset: number | string, value: TValue): void;
    offsetUnset(offset: number | string): void;
}

export type ArrayInnerValue<X> = X extends ReadonlyArray<infer U> ? U : never;

export type ArrayItems<T> = T[] | Array<T>;

/**
 * Helper type to add a value to an array type
 */
export type AddToArray<T, V> = (T | V)[];
