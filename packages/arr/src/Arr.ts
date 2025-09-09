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
    static accessible<T>(value: T): boolean {
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
     * Determine whether the given value is a Collection.
     */
    static isCollection<T>(value: T): boolean {
        if (value instanceof Collection) {
            return true;
        }

        return false;
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
     * @example
     *
     * Arr.divide(["Desk", 100, true]); // -> [[0, 1, 2], ['Desk', 100, true]]
     */
    static divide(array: readonly []): [number[], unknown[]];
    static divide<A extends readonly unknown[]>(
        array: A,
    ): [number[], A extends ReadonlyArray<infer V> ? V[] : unknown[]];
    static divide<A extends readonly unknown[]>(
        array: A,
    ): [number[], A extends ReadonlyArray<infer V> ? V[] : unknown[]] {
        const keys = array.map((_, i) => i);
        return [
            keys,
            array.slice() as unknown as A extends ReadonlyArray<infer V>
                ? V[]
                : unknown[],
        ];
    }

    /**
     * Return the first element in an array passing a given truth test.
     *
     * @example
     *
     * Arr.first([100, 200, 300]); // -> 100
     */
    // Overload: no predicate, no explicit default -> T | null
    static first<T>(
        data: readonly T[] | Iterable<T> | null | undefined,
        predicate?: null,
        defaultValue?: undefined,
    ): T | null;
    // Overload: no predicate, explicit default value (eager or lazy)
    static first<T, D>(
        data: readonly T[] | Iterable<T> | null | undefined,
        predicate: null | undefined,
        defaultValue: D | (() => D),
    ): T | D;
    // Overload: predicate, no explicit default
    static first<T>(
        data: readonly T[] | Iterable<T> | null | undefined,
        predicate: (value: T, index: number) => boolean,
    ): T | null;
    // Overload: predicate with default
    static first<T, D>(
        data: readonly T[] | Iterable<T> | null | undefined,
        predicate: (value: T, index: number) => boolean,
        defaultValue: D | (() => D),
    ): T | D;
    static first<T, D>(
        data: readonly T[] | Iterable<T> | null | undefined,
        predicate?: ((value: T, index: number) => boolean) | null,
        defaultValue?: D | (() => D),
    ): T | D | null {
        const resolveDefault = (): D | null => {
            if (defaultValue === undefined) {
                return null;
            }

            return typeof defaultValue === "function"
                ? (defaultValue as () => D)()
                : (defaultValue as D);
        };

        if (data == null) {
            return resolveDefault();
        }

        const isArray = Array.isArray(data);
        const iterable: Iterable<T> = isArray
            ? (data as readonly T[])
            : (data as Iterable<T>);

        // No predicate: just return first element if it exists.
        if (!predicate) {
            if (isArray) {
                const arr = data as readonly T[];
                if (arr.length === 0) {
                    return resolveDefault();
                }

                // After length check arr[0] is defined
                return arr[0] as T;
            }

            for (const item of iterable) {
                return item; // first
            }

            return resolveDefault();
        }

        let index = 0;
        for (const item of iterable) {
            if (predicate(item, index++)) {
                return item;
            }
        }

        return resolveDefault();
    }

    /**
     * Return the last element in an array passing a given truth test.
     *
     * @template TKey
     * @template TValue
     * @template TLastDefault
     *
     * @param  iterable<TKey, TValue>  $array
     * @param  (callable(TValue, TKey): bool)|null  $callback
     * @param  TLastDefault|(\Closure(): TLastDefault)  $default
     * @return TValue|TLastDefault
     */
    static last($array, ?callable $callback = null, $default = null)
    {
        if (is_null($callback)) {
            return empty($array) ? value($default) : array_last($array);
        }

        return static::first(array_reverse($array, true), $callback, $default);
    }
}
