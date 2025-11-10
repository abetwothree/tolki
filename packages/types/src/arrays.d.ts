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
 * Helper type to check if an array is mutable (not readonly)
 */
type IsMutableArray<T> = T extends readonly unknown[]
    ? T extends unknown[]
        ? true
        : false
    : false;

/**
 * Helper type to add a value to an array type.
 * Excludes readonly arrays as they cannot be mutated.
 */
export type AddToArray<T extends unknown[], V> =
    IsMutableArray<T> extends true
        ? T extends Array<infer U>
            ? Array<U | V>
            : never
        : never;
