import { Str } from "@laravel-js/str";

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
        return (
            Array.isArray(value) ||
            (typeof value === "object" && value !== null && "length" in value)
        );
    }

    /**
     * Determine whether the given value is arrayable.
     * TODO - add collection as arrayable
     *
     * @example
     *
     * Arr.arrayable([]); // true
     * Arr.arrayable([1, 2]); // true
     * Arr.arrayable({ a: 1, b: 2 }); // false
     * Arr.arrayable(new Collection()); // true
     */
    static arrayable(value: unknown): boolean {
        return Array.isArray(value);
    }

    /**
     * Add an element to an array using "dot" notation if it doesn't exist.
     *
     * @example
     *
     * Arr.add(['Desk'], 'Table'); // -> ['Desk', 'Table']
     * Arr.add([], 'Ferid', 'Mövsümov'); // -> ['Ferid' => 'Mövsümov']
     */
    static add<T extends readonly unknown[], V extends readonly unknown[]>(
        data: T,
        ...values: V
    ): [...T, ...V] {
        return [...data, ...values] as [...T, ...V];
    }
}
