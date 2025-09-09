import { Collection } from "@laravel-js/collection";

// Extract the element type from either an array or a Collection
export type InnerValue<X> =
        X extends ReadonlyArray<infer U>
                ? U
                : X extends Collection<infer U>
                    ? U
                    : never;

export class Arr {
    /**
     * Determine whether the given value is array accessible.
     *
     * @example
     *
     * Arr.accessible([]); // true
     * Arr.accessible([1, 2]); // true
     * Arr.accessible({ a: 1, b: 2 }); // false
     * Arr.accessible(new Collection()); // true
     */
    static accessible<T extends unknown>(value: T): boolean {
        if (Array.isArray(value)) {
            return true;
        }

        return Arr.isCollection(value);
    }

    /**
     * Determine whether the given value is arrayable.
     *
     * @example
     *
     * Arr.arrayable([]); // true
     * Arr.arrayable([1, 2]); // true
     * Arr.arrayable({ a: 1, b: 2 }); // false
     * Arr.arrayable(new Collection()); // true
     */
    static arrayable(
        value: unknown,
    ): value is ReadonlyArray<unknown> | Collection<unknown[]> {
        if (Array.isArray(value)) {
            return true;
        }

        return Arr.isCollection(value);
    }

    /**
     * Add an element to an array using "dot" notation if it doesn't exist.
     *
     * @example
     *
     * Arr.add(['Desk'], 'Table'); // -> ['Desk', 'Table']
     * Arr.add([], 'Ferid', 'Mövsümov'); // -> ['Ferid', 'Mövsümov']
     */
    static add<T extends readonly unknown[], V extends readonly unknown[]>(
        data: T,
        ...values: V
    ): [...T, ...V] {
        return [...data, ...values] as [...T, ...V];
    }

    /**
     * Collapse an array of arrays into a single array.
     *
     * @example
     *
     * Arr.collapse([[1], [2], [3], ['foo', 'bar']]); // -> [1, 2, 3, 'foo', 'bar']
     */
    static collapse<
        T extends ReadonlyArray<ReadonlyArray<unknown> | Collection<unknown[]>>,
    >(array: T): InnerValue<T[number]>[] {
        const out: InnerValue<T[number]>[] = [];

        for (const item of array) {
            if (Array.isArray(item)) {
                out.push(...(item as InnerValue<T[number]>[]));
            } else if (item instanceof Collection) {
                out.push(...(item.all() as unknown as InnerValue<T[number]>[]));
            }
        }

        return out;
    }

    /**
     * Determine whether the given value is a Collection.
     */
    static isCollection<T extends unknown>(value: T): boolean {
        if (value instanceof Collection) {
            return true;
        }

        return false;
    }

    /**
     * Cross join the given arrays, returning all possible permutations.
     *
     * @example
     *
     * Arr.crossJoin([1], ["a"]); // -> [[1, 'a']]
     */
    static crossJoin<T extends ReadonlyArray<ReadonlyArray<unknown>>>(
        ...arrays: T
    ): InnerValue<T[number]>[][] {
        let results: InnerValue<T[number]>[][] = [[]];

        for (const array of arrays) {
            if (!array.length) {
                return [];
            }

            const next: InnerValue<T[number]>[][] = [];

            for (const product of results) {
                for (const item of array) {
                    next.push([
                        ...product,
                        item as InnerValue<T[number]>,
                    ] as InnerValue<T[number]>[]);
                }
            }

            results = next;
        }

        return results;
    }

    /**
     * Divide an array into two arrays. One with keys and the other with values.
     *
     * @param  array  $array
     * @return array
     */
    static divide(array: readonly []): [number[], unknown[]];
    static divide<A extends readonly unknown[]>(
        array: A,
    ): [number[], A extends ReadonlyArray<infer V> ? V[] : unknown[]];
    static divide<A extends readonly unknown[]>(
        array: A,
    ): [number[], A extends ReadonlyArray<infer V> ? V[] : unknown[]] {
        const keys = array.map((_, i) => i);
        // Cast is safe: we only reorder (copy) the existing elements
        return [keys, array.slice() as unknown as A extends ReadonlyArray<infer V> ? V[] : unknown[]];
    }
}
