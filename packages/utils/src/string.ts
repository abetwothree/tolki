import type { PathKey } from "@tolki/types";

import { phpTypeName } from "./reflect";

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

/**
 * Build Arr::array()'s exact "must be an array" message, shared by every
 * push/array guard so arr, obj, and the path leaf-check agree on one string.
 *
 * @param value - The resolved value that failed the array check.
 * @param key - The key or path used in the error message.
 * @returns The formatted error message.
 */
export function arrayValueMessage(value: unknown, key: PathKey): string {
    return `Array value for key [${String(key)}] must be an array, ${phpTypeName(value)} found.`;
}

/**
 * Escape a value for safe interpolation into a shell command string.
 *
 * Uses POSIX single-quote wrapping: the only character that requires
 * escaping inside single quotes is the single quote itself.
 *
 * @param value - The raw string to escape.
 * @returns A shell-safe string.
 */
export function escapeShellArg(value: string): string {
    if (value === "") {
        return "''";
    }

    if (/^[\w@%+=:,./-]+$/.test(value)) {
        return value;
    }

    return "'" + value.replace(/'/g, "'\\''") + "'";
}
