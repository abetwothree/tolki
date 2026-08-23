/**
 * Helper function to safely compare two unknown values for sorting.
 * Provides stable comparison for objects using JSON serialization.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 *
 * @example
 * compareValues(1, 2); -> -1
 * compareValues('b', 'a'); -> 1
 * compareValues({x: 1}, {x: 1}); -> 0
 */
export function compareValues(a: unknown, b: unknown): number {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    // For objects, compare by JSON string representation for stable sorting
    if (typeof a === "object" && typeof b === "object") {
        const aStr = JSON.stringify(a);
        const bStr = JSON.stringify(b);
        if (aStr < bStr) return -1;
        if (aStr > bStr) return 1;
        return 0;
    }

    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/**
 * PHP-like loose equality comparison.
 * Mimics PHP's == operator behavior where null, false, 0, '', and [] are considered loosely equal.
 * Also handles deep comparison for arrays and objects.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are loosely equal in PHP-like manner
 *
 * @example
 *
 * looseEqual(null, false); -> true
 * looseEqual(null, 0); -> true
 * looseEqual(null, ''); -> true
 * looseEqual(0, false); -> true
 * looseEqual(1, '1'); -> true
 * looseEqual(['a'], ['a']); -> true
 */
export function looseEqual(a: unknown, b: unknown): boolean {
    // Use JavaScript's loose equality first
    if (a == b) {
        return true;
    }

    // PHP's boolean comparison rules:
    // - true == any truthy value
    // - false == any falsy value
    if (typeof a === "boolean" || typeof b === "boolean") {
        const boolValue = typeof a === "boolean" ? a : b;
        const otherValue = typeof a === "boolean" ? b : a;

        // In PHP, true == any truthy value, false == any falsy value
        if (boolValue === true) {
            // Check if otherValue is truthy in PHP terms
            return !(
                otherValue === null ||
                otherValue === false ||
                otherValue === 0 ||
                otherValue === "" ||
                (Array.isArray(otherValue) && otherValue.length === 0)
            );
        } else {
            // boolValue === false
            // Check if otherValue is falsy in PHP terms
            // Note: otherValue === false and [] == false are already handled by JS loose equality above
            return otherValue === null || otherValue === 0 || otherValue === "";
        }
    }

    // PHP considers these "falsy" values as loosely equal to each other:
    // null, false, 0, '', []
    const isFalsyA =
        a === null ||
        a === false ||
        a === 0 ||
        a === "" ||
        (Array.isArray(a) && a.length === 0);
    const isFalsyB =
        b === null ||
        b === false ||
        b === 0 ||
        b === "" ||
        (Array.isArray(b) && b.length === 0);

    if (isFalsyA && isFalsyB) {
        return true;
    }

    // Handle deep comparison for arrays
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }

        for (let i = 0; i < a.length; i++) {
            if (!looseEqual(a[i], b[i])) {
                return false;
            }
        }

        return true;
    }

    // Handle deep comparison for plain objects
    if (
        a !== null &&
        b !== null &&
        typeof a === "object" &&
        typeof b === "object" &&
        !Array.isArray(a) &&
        !Array.isArray(b)
    ) {
        const keysA = Object.keys(a as Record<string, unknown>);
        const keysB = Object.keys(b as Record<string, unknown>);

        if (keysA.length !== keysB.length) {
            return false;
        }

        for (const key of keysA) {
            if (!keysB.includes(key)) {
                return false;
            }

            if (
                !looseEqual(
                    (a as Record<string, unknown>)[key],
                    (b as Record<string, unknown>)[key],
                )
            ) {
                return false;
            }
        }

        return true;
    }

    return false;
}

/**
 * PHP-like strict equality comparison (=== operator).
 * Performs strict type checking for primitives but value-based comparison for arrays and objects.
 * NOTE: For class instances (objects with constructors other than Object), uses reference equality.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are strictly equal in PHP-like manner
 *
 * @example
 *
 * strictEqual(1, 1); -> true
 * strictEqual(1, '1'); -> false (different types)
 * strictEqual(['a'], ['a']); -> true (same array content)
 * strictEqual({a: 1}, {a: 1}); -> true (same object content)
 */
export function strictEqual(a: unknown, b: unknown): boolean {
    // Use JavaScript's strict equality first (handles primitives and same reference)
    if (a === b) {
        return true;
    }

    // Handle deep comparison for arrays with strict element comparison
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }

        for (let i = 0; i < a.length; i++) {
            if (!strictEqual(a[i], b[i])) {
                return false;
            }
        }

        return true;
    }

    // Handle deep comparison for plain objects with strict value comparison
    // But NOT for class instances - those should only match by reference
    if (
        a !== null &&
        b !== null &&
        typeof a === "object" &&
        typeof b === "object" &&
        !Array.isArray(a) &&
        !Array.isArray(b)
    ) {
        // Check if these are plain objects (constructor is Object)
        // If they're class instances, they should only match by reference (already failed above)
        const isPlainA =
            a.constructor === Object || a.constructor === undefined;
        const isPlainB =
            b.constructor === Object || b.constructor === undefined;

        if (!isPlainA || !isPlainB) {
            // At least one is a class instance, use reference equality (already failed)
            return false;
        }

        const keysA = Object.keys(a as Record<string, unknown>);
        const keysB = Object.keys(b as Record<string, unknown>);

        if (keysA.length !== keysB.length) {
            return false;
        }

        for (const key of keysA) {
            if (!keysB.includes(key)) {
                return false;
            }

            if (
                !strictEqual(
                    (a as Record<string, unknown>)[key],
                    (b as Record<string, unknown>)[key],
                )
            ) {
                return false;
            }
        }

        return true;
    }

    return false;
}
