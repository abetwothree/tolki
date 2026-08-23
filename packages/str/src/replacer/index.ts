import { isArray, isObject, isString } from "@tolki/utils";

/**
 * Returns the portion of the string specified by the start and length parameters.
 *
 * @param string - The input string.
 * @param start - The starting position. If negative, it starts that many characters from the end of the string.
 * @param length - The number of characters to return. If omitted or null, returns all characters from start to the end of the string. If negative, omits that many characters from the end.
 * @returns The extracted substring.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#substr
 */
export function substr(
    string: string,
    start: number,
    length: number | null = null,
): string {
    const chars = Array.from(string);
    const size = chars.length;

    const { start: s, end } = computeRange(size, start, length);

    if (s >= size || end <= s) {
        return "";
    }

    return chars.slice(s, end).join("");
}

/**
 * Returns the number of substring occurrences.
 *
 * @param haystack - The string to search within.
 * @param needle - The substring to count.
 * @param offset - The starting position for the search. If negative, it starts that many characters from the end of the string.
 * @param length - The length of the segment to search within. If omitted or null, searches to the end of the string. If negative, omits that many characters from the end.
 * @returns The number of occurrences of the substring within the specified segment.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#substrcount
 */
export function substrCount(
    haystack: string,
    needle: string,
    offset: number = 0,
    length: number | null = null,
): number {
    if (needle === "") {
        return 0; // safe behavior for empty needle
    }

    const chars = Array.from(haystack);
    const size = chars.length;
    const { start, end } = computeRange(size, offset, length);

    if (start >= size || end <= start) {
        return 0;
    }

    const segment = chars.slice(start, end).join("");

    return countNonOverlapping(segment, needle);
}

/**
 * Replace text within a portion of a string, an array of strings, or an object of strings.
 * Properly handles multibyte characters.
 *
 * @param string - The subject string, array of strings, or object of strings.
 * @param replace - The replacement string, or an array/object of replacement strings applied positionally.
 * @param offset - The starting position for the replacement, or an array of positions applied positionally. If negative, it starts that many characters from the end of the string.
 * @param length - The number of characters to replace, or an array of lengths applied positionally. If omitted or null, replaces all characters from offset to the end of the string. If negative, omits that many characters from the end.
 * @returns The modified string, or an array/object of modified strings mirroring the subject's shape and keys.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#substrreplace
 */
export function substrReplace(
    string: string,
    replace: string | string[] | Record<string, string>,
    offset?: number,
    length?: number | null,
): string;
export function substrReplace(
    string: string[],
    replace: string | string[] | Record<string, string>,
    offset?: number | number[],
    length?: number | number[] | null,
): string[];
export function substrReplace<TSubject extends Record<string, string>>(
    string: TSubject,
    replace: string | string[] | Record<string, string>,
    offset?: number | number[],
    length?: number | number[] | null,
): Record<keyof TSubject, string>;
export function substrReplace(
    string: string | string[] | Record<string, string>,
    replace: string | string[] | Record<string, string>,
    offset?: number | number[],
    length?: number | number[] | null,
): string | string[] | Record<string, string>;
export function substrReplace(
    string: string | string[] | Record<string, string>,
    replace: string | string[] | Record<string, string>,
    offset: number | number[] = 0,
    length: number | number[] | null = null,
): string | string[] | Record<string, string> {
    const replacements: string[] | null = isArray(replace)
        ? replace
        : isObject<string, string>(replace)
          ? Object.values(replace)
          : null;

    if (isString(string)) {
        if (isArray(offset) || isArray(length)) {
            throw new TypeError(
                "substrReplace(): offset and length must be numbers when the subject is a string",
            );
        }

        const replacement =
            replacements === null
                ? String(replace)
                : String(replacements[0] ?? "");

        return replaceSubstring(string, replacement, offset, length);
    }

    const offsets: number[] | null = isArray(offset) ? offset : null;
    const lengths: number[] | null = isArray(length) ? length : null;

    const replaceEntry = (value: string, position: number): string => {
        return replaceSubstring(
            value,
            replacements === null
                ? String(replace)
                : String(replacements[position] ?? ""),
            offsets === null ? (offset as number) : (offsets[position] ?? 0),
            lengths === null
                ? (length as number | null)
                : (lengths[position] ?? null),
        );
    };

    if (isArray(string)) {
        return string.map((value, position) => replaceEntry(value, position));
    }

    return Object.fromEntries(
        Object.entries(string).map(([key, value], position) => [
            key,
            replaceEntry(value, position),
        ]),
    );
}

/**
 * Replace text within a portion of a single string on code points, mirroring
 * PHP's mb_substr semantics: mb_substr($string, 0, $offset) . $replace . mb_substr(mb_substr($string, $offset), $length).
 *
 * @param str - The subject string.
 * @param rep - The replacement string.
 * @param off - The starting position for the replacement. If negative, it starts that many characters from the end of the string.
 * @param len - The number of characters to replace. If null, replaces all characters from the offset to the end of the string. If negative, omits that many characters from the end.
 * @returns The modified string.
 */
function replaceSubstring(
    str: string,
    rep: string,
    off: number,
    len: number | null,
): string {
    const chars = Array.from(str);
    const size = chars.length;

    // Normalize offset (negative = from end)
    let start = off >= 0 ? off : size + off;
    if (start < 0) {
        start = 0;
    }
    if (start > size) {
        start = size;
    }

    const head = chars.slice(0, start).join("");

    // Compute tail using PHP semantics: mb_substr(mb_substr($string, $offset), $length)
    // First get the substring from the offset, then apply length to that substring
    const fromOffset = chars.slice(start);
    let tail: string;
    if (len === null) {
        tail = "";
    } else {
        tail = fromOffset.slice(len).join("");
    }

    return head + rep + tail;
}

/**
 * Compute [start, end) range on code points with PHP-like semantics for offset/length
 *
 * @param size - The total size of the string in code points.
 * @param offset - The starting position. If negative, it starts that many characters from the end of the string.
 * @param length - The number of characters to include. If omitted or null, includes all characters from offset to the end of the string. If negative, omits that many characters from the end.
 * @returns An object containing the computed start and end indices.
 */
function computeRange(
    size: number,
    offset: number,
    length: number | null | undefined,
): { start: number; end: number } {
    // Normalize start (offset may be negative)
    let start = offset >= 0 ? offset : size + offset;
    if (start < 0) start = 0;
    if (start > size) start = size;

    // Determine end
    let end: number;
    if (length === null || length === undefined) {
        end = size;
    } else if (length < 0) {
        end = size + length; // omit characters from the end
    } else {
        end = start + length;
    }

    // Clamp
    end = Math.max(0, Math.min(end, size));

    return { start, end };
}

/**
 * Count non-overlapping occurrences of a substring within a string.
 *
 * @param haystack - The string to search within.
 * @param needle - The substring to count.
 * @returns The number of non-overlapping occurrences of the substring.
 */
function countNonOverlapping(haystack: string, needle: string): number {
    let count = 0;
    let pos = 0;

    while (true) {
        const idx = haystack.indexOf(needle, pos);
        if (idx === -1) {
            break;
        }
        count++;
        pos = idx + needle.length;
    }

    return count;
}
