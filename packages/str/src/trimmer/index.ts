/**
 * Precomputed character class (as a regex fragment) for Laravel's invisible characters list.
 * Built using ES2015 Unicode escapes (\\u{...}) and intended for use with the 'u' flag.
 */
const INVISIBLE_CHAR_CLASS: string = (() => {
    const cps = [
        0x0009, 0x0020, 0x00a0, 0x00ad, 0x034f, 0x061c, 0x115f, 0x1160, 0x17b4,
        0x17b5, 0x180e, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006,
        0x2007, 0x2008, 0x2009, 0x200a, 0x200b, 0x200c, 0x200d, 0x200e, 0x200f,
        0x202f, 0x205f, 0x2060, 0x2061, 0x2062, 0x2063, 0x2064, 0x2065, 0x206a,
        0x206b, 0x206c, 0x206d, 0x206e, 0x206f, 0x3000, 0x2800, 0x3164, 0xfeff,
        0xffa0, 0x1d159, 0x1d173, 0x1d174, 0x1d175, 0x1d176, 0x1d177, 0x1d178,
        0x1d179, 0x1d17a, 0xe0020,
    ];

    return cps.map((cp) => `\\u{${cp.toString(16)}}`).join("");
})();

/**
 * Get the default character class for trimming whitespace, including invisible characters.
 *
 * @returns The default character class as a string.
 */
function defaultClass(): string {
    // PHP's \s also matches NEL (U+0085) under its u modifier, which JS's \s leaves out; NUL is Laravel's own addition.
    return `\\s\\u0085${INVISIBLE_CHAR_CLASS}\\u0000`;
}

/**
 * Escape special regex characters in a string for use in a character class.
 *
 * @param s - The string to escape.
 * @returns The escaped string.
 */
function escapeForClass(s: string): string {
    return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
}

/**
 * Remove the trailing run of characters in a character class.
 *
 * @param value - The string to strip.
 * @param characterClass - The body of the character class, as a regex fragment for the 'u' flag.
 * @returns The string without its trailing run.
 */
function stripEnd(value: string, characterClass: string): string {
    const last = new RegExp(`[${characterClass}]$`, "u");
    let end = value.length;

    // Reading one character at a time, at most two UTF-16 units, keeps this linear: a `[...]+$` pattern retries
    // from every character of an interior run.
    while (end > 0) {
        const match = last.exec(value.slice(Math.max(end - 2, 0), end));

        if (match === null) {
            break;
        }

        end -= match[0].length;
    }

    return value.slice(0, end);
}

/**
 * Remove the leading run of characters in a character class.
 *
 * @param value - The string to strip.
 * @param characterClass - The body of the character class, as a regex fragment for the 'u' flag.
 * @returns The string without its leading run.
 */
function stripStart(value: string, characterClass: string): string {
    return value.replace(new RegExp(`^[${characterClass}]+`, "u"), "");
}

/**
 * Get the character class that `trim`, `ltrim` and `rtrim` remove.
 *
 * @param charlist - The characters to remove, or null for whitespace and invisible characters.
 * @returns The body of the character class. An empty charlist gives an empty class, which matches nothing, as in PHP.
 */
function trimmedClass(charlist: string | null): string {
    return charlist === null ? defaultClass() : escapeForClass(charlist);
}

/**
 * Remove all whitespace from both ends of a string.
 *
 * @param value - The string to trim.
 * @param charlist - Optional list of characters to trim instead of whitespace.
 * @returns The trimmed string.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#trim
 */
export function trim(value: string, charlist: string | null = null): string {
    const characterClass = trimmedClass(charlist);

    return stripEnd(stripStart(value, characterClass), characterClass);
}

/**
 * Remove all whitespace from the beginning of a string.
 *
 * @param value - The string to trim.
 * @param charlist - Optional list of characters to trim instead of whitespace.
 * @returns The left-trimmed string.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#ltrim
 */
export function ltrim(value: string, charlist: string | null = null): string {
    return stripStart(value, trimmedClass(charlist));
}

/**
 * Remove all whitespace from the end of a string.
 *
 * @param value - The string to trim.
 * @param charlist - Optional list of characters to trim instead of whitespace.
 * @returns The right-trimmed string.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#rtrim
 */
export function rtrim(value: string, charlist: string | null = null): string {
    return stripEnd(value, trimmedClass(charlist));
}
