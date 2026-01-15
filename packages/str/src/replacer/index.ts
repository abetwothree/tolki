import { isArray } from "@tolki/utils";

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
 * Replace text within a portion of a string.
 * Properly handles multibyte characters.
 *
 * @param value - The original string.
 * @param replace - The replacement string or an array of replacement strings.
 * @param offset - The starting position for the replacement. If negative, it starts that many characters from the end of the string.
 * @param length - The number of characters to replace. If omitted or null, replaces all characters from offset to the end of the string. If negative, omits that many characters from the end.
 * @returns The modified string or an array of modified strings if multiple replacements are provided.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#substrreplace
 */
export function substrReplace(
    value: string,
    replace: string | string[],
    offset: number | number[] = 0,
    length: number | number[] | null = null,
): string | string[] {
    const off: number = isArray(offset) ? (offset[0] ?? 0) : offset;
    const lenArg: number | null = isArray(length)
        ? ((length[0] as number) ?? null)
        : length;

    const doReplace = (rep: string): string => {
        const chars = Array.from(value);
        const size = chars.length;

        // Use size if length not provided
        const finalLength =
            lenArg === null || lenArg === undefined ? size : lenArg;

        const { start, end } = computeRange(size, off, finalLength);
        const head = chars.slice(0, start).join("");
        const tail = chars.slice(end).join("");
        return head + rep + tail;
    };

    if (isArray(replace)) {
        return replace.map((r) => doReplace(String(r)));
    }

    return doReplace(String(replace));
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
