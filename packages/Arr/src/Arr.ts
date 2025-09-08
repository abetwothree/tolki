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
    static accessible(value: unknown): boolean {
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
}
