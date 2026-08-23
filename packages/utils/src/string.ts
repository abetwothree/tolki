/**
 * Convert a string to lower-case.
 */
export function toLower(value: string): string {
    return value.toLowerCase();
}

/**
 * Convert a string to upper-case.
 */
export function toUpper(value: string): string {
    return value.toUpperCase();
}

/**
 * Convert the first character of a string to lower-case.
 */
export function lowerFirst(value: string): string {
    const chars = [...value];

    if (chars.length === 0) {
        return value;
    }

    chars[0] = (chars[0] as string).toLowerCase();

    return chars.join("");
}

/**
 * Convert the first character of a string to upper-case.
 */
export function upperFirst(value: string): string {
    const chars = [...value];

    if (chars.length === 0) {
        return value;
    }

    chars[0] = (chars[0] as string).toUpperCase();

    return chars.join("");
}
