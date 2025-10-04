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

export type ArrayItems<T> = T[] | ReadonlyArray<T> | Array<T>;