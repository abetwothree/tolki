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
        return Array.isArray(value) || (typeof value === "object" && value !== null && "length" in value);
    }
}
