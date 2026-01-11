import type {
    ConvertCaseMode,
    MarkDownExtensions,
    MarkDownOptions,
} from "@tolki/str";
import {
    after,
    afterLast,
    apa,
    ascii,
    before,
    beforeLast,
    between,
    betweenFirst,
    camel,
    charAt,
    chopEnd,
    chopStart,
    contains,
    containsAll,
    convertCase,
    deduplicate,
    doesntContain,
    doesntEndWith,
    doesntStartWith,
    endsWith,
    excerpt,
    finish,
    fromBase64,
    headline,
    inlineMarkdown,
    is,
    isAscii,
    isJson,
    isMatch,
    isUlid,
    isUrl,
    isUuid,
    kebab,
    lcfirst,
    length,
    limit,
    lower,
    ltrim,
    markdown,
    mask,
    match,
    matchAll,
    numbers,
    padBoth,
    padLeft,
    padRight,
    pascal,
    plural,
    pluralPascal,
    pluralStudly,
    position,
    remove,
    repeat,
    replace,
    replaceArray,
    replaceEnd,
    replaceFirst,
    replaceLast,
    replaceMatches,
    replaceStart,
    reverse,
    rtrim,
    singular,
    slug,
    snake,
    squish,
    start,
    startsWith,
    stripTags,
    studly,
    substr,
    substrCount,
    substrReplace,
    swap,
    take,
    title,
    toBase64,
    transliterate,
    trim,
    ucfirst,
    ucsplit,
    ucwords,
    unwrap,
    upper,
    wordCount,
    words,
    wordWrap,
    wrap,
} from "@tolki/str";
import { isArray, isFunction, isInteger } from "@tolki/utils";

export type ConditionableValue =
    | string
    | number
    | boolean
    | ((instance: Stringable) => string | number | boolean);

export type ConditionableClosure =
    | ((instance: Stringable, value: ConditionableValue) => unknown)
    | null;

/**
 * Get a new stringable object from the given string.
 *
 * @param value - The string value to wrap in a Stringable instance.
 * @returns A new Stringable instance.
 *
 * @example
 *
 * of('foo').append('bar'); -> 'foobar'
 */
export function of(value: string): Stringable {
    return new Stringable(value);
}

/**
 * Get a new stringable object from the given string.
 *
 * @param value - The string value to wrap in a Stringable instance.
 * @returns A new Stringable instance.
 *
 * @example
 *
 * str('foo').append('bar'); -> 'foobar'
 */
export function str(value: string): Stringable {
    return new Stringable(value);
}

export class Stringable {
    /**
     * Create a new instance of the class.
     *
     * @param _value - The initial string value. Defaults to an empty string.
     */
    constructor(private readonly _value: string = "") {}

    /**
     * Return the remainder of a string after the first occurrence of a given value.
     *
     * @param search - The substring to search for.
     * @returns The portion of the string after the first occurrence of the search value.
     */
    after(search: string | number): Stringable {
        return new Stringable(after(this._value, search));
    }

    /**
     * Return the remainder of a string after the last occurrence of a given value
     *
     * @param search - The substring to search for.
     * @returns The portion of the string after the last occurrence of the search value.
     */
    afterLast(search: string | number): Stringable {
        return new Stringable(afterLast(this._value, search));
    }

    /**
     * Append the given values to the string.
     *
     * @param values - The values to append to the string.
     * @returns The updated Stringable instance.
     */
    append(...values: Array<string | number>): Stringable {
        return new Stringable(this._value + values.map(String).join(""));
    }

    /**
     * Append a new line to the string.
     *
     * @param count - The number of new lines to append. Defaults to 1.
     * @returns The updated Stringable instance.
     */
    newLine(count = 1): Stringable {
        return this.append("\n".repeat(Math.max(0, count)));
    }

    /**
     * Transliterate a UTF-8 value to ASCII.
     *
     * @returns The transliterated string as a new Stringable instance.
     */
    ascii(): Stringable {
        return new Stringable(ascii(this._value));
    }

    /**
     * Get the portion of a string before the first occurrence of a given value.
     *
     * @param search - The substring to search for.
     * @returns The portion of the string before the first occurrence of the search value.
     */
    before(search: string | number): Stringable {
        return new Stringable(before(this._value, search));
    }

    /**
     * Get the portion of a string before the last occurrence of a given value.
     *
     * @param search - The substring to search for.
     * @returns The portion of the string before the last occurrence of the search value.
     */
    beforeLast(search: string | number): Stringable {
        return new Stringable(beforeLast(this._value, search));
    }

    /**
     * Get the portion of a string between two given values.
     *
     * @param from - The starting substring.
     * @param to - The ending substring.
     * @returns The portion of the string between the two given values.
     */
    between(from: string | number, to: string | number): Stringable {
        return new Stringable(between(this._value, from, to));
    }

    /**
     * Get the smallest possible portion of a string between two given values.
     *
     * @param from - The starting substring.
     * @param to - The ending substring.
     * @returns The smallest possible portion of the string between the two given values.
     */
    betweenFirst(from: string | number, to: string | number): Stringable {
        return new Stringable(betweenFirst(this._value, from, to));
    }

    /**
     * Convert a value to camel case.
     *
     * @returns The camel-cased string as a new Stringable instance.
     */
    camel(): Stringable {
        return new Stringable(camel(this._value));
    }

    /**
     * Get the character at the specified index.
     *
     * @param index - The index of the character to retrieve.
     * @returns The character at the specified index, or false if the index is out of bounds.
     */
    charAt(index: number): string | false {
        return charAt(this._value, index);
    }

    /**
     * Remove the given string if it exists at the start of the current string.
     *
     * @param needle - The string or array of strings to remove from the start.
     * @returns The updated Stringable instance.
     */
    chopStart(needle: string | string[]): Stringable {
        return new Stringable(chopStart(this._value, needle));
    }

    /**
     * Remove the given string if it exists at the end of the current string.
     *
     * @param needle - The string or array of strings to remove from the end.
     * @returns The updated Stringable instance.
     */
    chopEnd(needle: string | string[]): Stringable {
        return new Stringable(chopEnd(this._value, needle));
    }

    /**
     * Determine if a given string contains a given substring.
     *
     * @param needles - The substring(s) to search for
     * @param ignoreCase - Whether the search should be case-insensitive
     * @returns boolean - True if the substring(s) are found, false otherwise
     */
    contains(needles: string | Iterable<string>, ignoreCase = false): boolean {
        return contains(this._value, needles, ignoreCase);
    }

    /**
     * Determine if a given string contains all array values.
     *
     * @param needles - The substring(s) to search for
     * @param ignoreCase - Whether the search should be case-insensitive
     * @returns boolean - True if all substring(s) are found, false otherwise
     */
    containsAll(needles: Iterable<string>, ignoreCase = false): boolean {
        return containsAll(this._value, needles, ignoreCase);
    }

    /**
     * Determine if a given string doesn't contain a given substring.
     *
     * @param needles - The substring(s) to search for
     * @param ignoreCase - Whether the search should be case-insensitive
     * @returns boolean - True if the substring(s) are not found, false otherwise
     */
    doesntContain(
        needles: string | Iterable<string>,
        ignoreCase = false,
    ): boolean {
        return doesntContain(this._value, needles, ignoreCase);
    }

    /**
     * Convert the case of a string.
     *
     * @param mode - The case conversion mode to apply.
     * @returns The converted string as a new Stringable instance.
     */
    convertCase(mode: ConvertCaseMode): Stringable {
        return new Stringable(convertCase(this._value, mode));
    }

    /**
     * Replace consecutive instances of a given character with a single character.
     *
     * @param character - The character or array of characters to deduplicate. Defaults to a space.
     * @returns The updated Stringable instance.
     */
    deduplicate(character: string | string[] = " "): Stringable {
        return new Stringable(deduplicate(this._value, character));
    }

    /**
     * Determine if a given string ends with a given substring.
     *
     * @param needles - The substring(s) to search for
     * @returns boolean - True if the substring(s) are found, false otherwise
     */
    endsWith(needles: string | number | Iterable<string>): boolean {
        return endsWith(this._value, needles);
    }

    /**
     * Determine if a given string doesn't end with a given substring.
     *
     * @param needles - The substring(s) to search for
     * @returns boolean - True if the substring(s) are not found, false otherwise
     */
    doesntEndWith(needles: string | number | Iterable<string>): boolean {
        return doesntEndWith(this._value, needles);
    }

    /**
     * Determine if the string is an exact match with the given value.
     *
     * @param value - The value to compare against.
     * @returns True if the strings are exactly the same, false otherwise.
     */
    exactly(value: Stringable | string): boolean {
        const other =
            value instanceof Stringable ? value.toString() : String(value);

        return this._value === other;
    }

    /**
     * Extracts an excerpt from text that matches the first instance of a phrase.
     *
     * @param phrase - The phrase to search for within the text.
     * @param options - Options to customize the excerpt extraction, including radius and omission string.
     * @returns The extracted excerpt or null if the phrase is not found.
     */
    excerpt(
        phrase: string | null = "",
        options: { radius?: number; omission?: string } = {},
    ): string | null {
        return excerpt(this._value, phrase, options);
    }

    /**
     * Explode the string into an array
     *
     * @param delimiter - The delimiter string to split the string by.
     * @param limit - The maximum number of elements to return. Defaults to Number.MAX_SAFE_INTEGER.
     * @returns An array of strings obtained by splitting the original string.
     */
    explode(delimiter: string, limit: number = Number.MAX_SAFE_INTEGER) {
        // PHP explode semantics:
        // limit > 0: return at most 'limit' elements (last element contains rest)
        // limit < 0: return all elements except the last 'limit' elements
        // limit = 0: same as no limit

        const parts = this._value.split(delimiter);

        if (limit > 0 && parts.length > limit) {
            const result = parts.slice(0, limit - 1);
            result.push(parts.slice(limit - 1).join(delimiter));
            return result;
        } else if (limit < 0) {
            return parts.slice(0, limit);
        }

        return parts;
    }

    /**
     * Split a string using a regular expression or by length.
     *
     * @param pattern - The regex pattern or length to split the string by.
     * @param limit - The maximum number of splits to perform. Defaults to null (no limit).
     * @returns An array of strings obtained by splitting the original string.
     */
    split(pattern: string | number, limit: number | null = null) {
        if (isInteger(pattern)) {
            const length = Number(pattern);
            const result: string[] = [];
            for (let i = 0; i < this._value.length; i += length) {
                result.push(this._value.substr(i, length));
            }

            return result;
        }

        const segments = this._value.split(
            new RegExp(String(pattern)),
            limit ?? undefined,
        );

        return segments;
    }

    /**
     * Cap a string with a single instance of a given value.
     *
     * @param cap - The string to cap the original string with.
     * @returns The updated Stringable instance.
     */
    finish(cap: string): Stringable {
        return new Stringable(finish(this._value, cap));
    }

    /**
     * Determine if a given string matches a given pattern.
     *
     * @param pattern - The pattern(s) to match against
     * @returns boolean - True if the pattern(s) match, false otherwise
     */
    is(pattern: string | Iterable<string>, ignoreCase = false): boolean {
        return is(pattern, this._value, ignoreCase);
    }

    /**
     * Determine if a given string is 7 bit ASCII.
     *
     * @returns True if the string is ASCII, false otherwise.
     */
    isAscii(): boolean {
        return isAscii(this._value);
    }

    /**
     * Determine if a given string is valid JSON.
     *
     * @returns True if the string is valid JSON, false otherwise.
     */
    isJson(): boolean {
        return isJson(this._value);
    }

    /**
     * Determine if a given value is a valid URL.
     *
     * @param protocols - An array of allowed protocols (e.g., ['http', 'https']).
     * @returns True if the string is a valid URL, false otherwise.
     */
    isUrl(protocols: string[] = []): boolean {
        return isUrl(this._value, protocols);
    }

    /**
     * Determine if a given string is a valid UUID.
     *
     * @param version - The UUID version to validate against (1-5), "nil", "max", or null for any version.
     * @returns True if the string is a valid UUID, false otherwise.
     */
    isUuid(version: number | "nil" | "max" | null = null): boolean {
        return isUuid(this._value, version);
    }

    /**
     * Determine if a given string is a valid ULID.
     *
     * @return True if the string is a valid ULID, false otherwise.
     */
    isUlid(): boolean {
        return isUlid(this._value);
    }

    /**
     * Determine if the given string is empty.
     *
     * @return True if the string is empty, false otherwise.
     */
    isEmpty(): boolean {
        return this._value === "";
    }

    /**
     * Determine if the given string is not empty.
     *
     * @return True if the string is not empty, false otherwise.
     */
    isNotEmpty(): boolean {
        return !this.isEmpty();
    }

    /**
     * Convert a string to kebab case.
     *
     * @returns The kebab-cased string as a new Stringable instance.
     */
    kebab(): Stringable {
        return new Stringable(kebab(this._value));
    }

    /**
     * Return the length of the given string.
     *
     * @returns The length of the string.
     */
    length(): number {
        return length(this._value);
    }

    /**
     * Limit the number of characters in a string.
     *
     * @param limitValue - The maximum number of characters allowed.
     * @param end - The string to append if the original string exceeds the limit.
     * @param preserveWords - Whether to avoid cutting off in the middle of a word.
     * @returns A new Stringable instance with the limited string.
     */
    limit(limitValue = 100, end = "...", preserveWords = false): Stringable {
        return new Stringable(
            limit(this._value, limitValue, end, preserveWords),
        );
    }

    /**
     * Convert the given string to lower-case.
     *
     * @returns The lower-cased string as a new Stringable instance.
     */
    lower(): Stringable {
        return new Stringable(lower(this._value));
    }

    /**
     * Convert GitHub flavored Markdown into HTML.
     *
     * @param options - Options to customize the markdown rendering. Defaults to GFM enabled and no anchors.
     * @param extensions - An array of markdown-it extensions to apply during rendering.
     * @returns The resulting HTML string as a new Stringable instance.
     */
    markdown(
        options: MarkDownOptions = { gfm: true, anchors: false },
        extensions: MarkDownExtensions = [],
    ): Stringable {
        return new Stringable(markdown(this._value, options, extensions));
    }

    /**
     * Convert inline Markdown into HTML.
     *
     * @param options - Options to customize the markdown rendering. Defaults to GFM enabled.
     * @param extensions - An array of markdown-it extensions to apply during rendering.
     * @returns The resulting HTML string as a new Stringable instance.
     */
    inlineMarkdown(
        options: MarkDownOptions = { gfm: true },
        extensions: MarkDownExtensions = [],
    ): Stringable {
        return new Stringable(inlineMarkdown(this._value, options, extensions));
    }

    /**
     * Masks a portion of a string with a repeated character.
     *
     * @param character - The character to use for masking.
     * @param index - The starting index to begin masking.
     * @param length - The number of characters to mask. If null, masks to the end of the string.
     * @returns The masked string as a new Stringable instance.
     */
    mask(
        character: string,
        index: number,
        length: number | null = null,
    ): Stringable {
        return new Stringable(mask(this._value, character, index, length));
    }

    /**
     * Get the string matching the given pattern.
     *
     * @param pattern - The pattern to match against.
     * @returns A new Stringable instance containing the matched string.
     */
    match(pattern: string): Stringable {
        return new Stringable(match(pattern, this._value));
    }

    /**
     * Determine if a given string matches a given pattern.
     *
     * @param pattern - The pattern(s) to match against
     * @returns boolean - True if the pattern(s) match, false otherwise
     */
    isMatch(pattern: string | Iterable<string>): boolean {
        return isMatch(pattern, this._value);
    }

    /**
     * Get the string matching the given pattern.
     *
     * @param pattern - The pattern to match against.
     * @returns An array of all matched strings.
     */
    matchAll(pattern: string): string[] {
        return matchAll(pattern, this._value);
    }

    /**
     * Determine if the string matches the given pattern.
     *
     * @param pattern - The pattern(s) to match against
     * @returns boolean - True if the pattern(s) match, false otherwise
     */
    test(pattern: string): boolean {
        return this.isMatch(pattern);
    }

    /**
     * Remove all non-numeric characters from a string.
     *
     * @returns The numeric string as a new Stringable instance.
     */
    numbers(): Stringable {
        return new Stringable(numbers(this._value) as string);
    }

    /**
     * Pad both sides of the string with another.
     *
     * @param length - The desired total length of the string after padding.
     * @param pad - The string to use for padding. Defaults to a space.
     * @returns The padded string as a new Stringable instance.
     */
    padBoth(length: number, pad = " "): Stringable {
        return new Stringable(padBoth(this._value, length, pad));
    }

    /**
     * Pad the left side of the string with another.
     *
     * @param length - The desired total length of the string after padding.
     * @param pad - The string to use for padding. Defaults to a space.
     * @returns The padded string as a new Stringable instance.
     */
    padLeft(length: number, pad = " "): Stringable {
        return new Stringable(padLeft(this._value, length, pad));
    }

    /**
     * Pad the right side of the string with another.
     *
     * @param length - The desired total length of the string after padding.
     * @param pad - The string to use for padding. Defaults to a space.
     * @returns The padded string as a new Stringable instance.
     */
    padRight(length: number, pad = " "): Stringable {
        return new Stringable(padRight(this._value, length, pad));
    }

    /**
     * Call the given callback and return a new string.
     *
     * @param callback - The callback function to process the string.
     * @returns The processed string as a new Stringable instance.
     */
    pipe<T = Stringable | string>(callback: (s: Stringable) => T): Stringable {
        const res = callback(this) as T;

        return res instanceof Stringable ? res : new Stringable(String(res));
    }

    /**
     * Get the plural form of an English word.
     *
     * @param count - The count to determine singular or plural form. Defaults to 2.
     * @param prependCount - Whether to prepend the count to the result. Defaults to false.
     * @returns The pluralized string as a new Stringable instance.
     */
    plural(count: number = 2, prependCount: boolean = false): Stringable {
        return new Stringable(plural(this._value, count, prependCount));
    }

    /**
     * Pluralize the last word of an English, studly caps case string.
     *
     * @param count - The count to determine singular or plural form. Defaults to 2.
     * @returns The pluralized string as a new Stringable instance.
     */
    pluralStudly(count: number = 2): Stringable {
        const c = isArray(count) ? count.length : Number(count);

        return new Stringable(pluralStudly(this._value, c));
    }

    /**
     * Pluralize the last word of an English, Pascal caps case string.
     *
     * @param count - The count to determine singular or plural form. Defaults to 2.
     * @returns The pluralized string as a new Stringable instance.
     */
    pluralPascal(count: number = 2): Stringable {
        const c = isArray(count) ? count.length : Number(count);

        return new Stringable(pluralPascal(this._value, c));
    }

    /**
     * Find the multi-byte safe position of the first occurrence of the given substring.
     *
     * @param needle - The substring to search for.
     * @param offset - The offset from which to start the search. Defaults to 0.
     * @returns The position of the first occurrence of the substring, or false if not found.
     */
    position(needle: string, offset = 0): number | false {
        return position(this._value, needle, offset);
    }

    /**
     * Prepend the given values to the string.
     *
     * @param values - The values to prepend to the string.
     * @returns The updated Stringable instance.
     */
    prepend(...values: Array<string | number>): Stringable {
        return new Stringable(values.map(String).join("") + this._value);
    }

    /**
     * Remove any occurrence of the given string in the subject.
     *
     * @param search - The string or iterable of strings to remove.
     * @param caseSensitive - Whether the search should be case-sensitive. Defaults to true.
     * @returns The updated Stringable instance.
     */
    remove(
        search: string | Iterable<string>,
        caseSensitive = true,
    ): Stringable {
        return new Stringable(
            remove(search, this._value, caseSensitive) as string,
        );
    }

    /**
     * Reverse the string.
     *
     * @returns The reversed string as a new Stringable instance.
     */
    reverse(): Stringable {
        return new Stringable(reverse(this._value));
    }

    /**
     * Repeat the string.
     *
     * @param times - The number of times to repeat the string.
     * @returns The repeated string as a new Stringable instance.
     */
    repeat(times: number): Stringable {
        return new Stringable(repeat(this._value, times));
    }

    /**
     * Replace the given value in the given string.
     *
     * @param search - The value or iterable of values to search for.
     * @param replacement - The replacement value or iterable of values.
     * @param caseSensitive - Whether the search should be case-sensitive. Defaults to true.
     * @returns The updated Stringable instance.
     */
    replace(
        search: string | Iterable<string>,
        replacement: string | Iterable<string>,
        caseSensitive = true,
    ): Stringable {
        return new Stringable(
            replace(search, replacement, this._value, caseSensitive) as string,
        );
    }

    /**
     * Replace a given value in the string sequentially with an array.
     *
     * @param search - The value to search for.
     * @param replace - The array or record of replacements.
     * @returns The updated Stringable instance.
     */
    replaceArray(
        search: string,
        replace: Record<string, string> | Iterable<string>,
    ): Stringable {
        return new Stringable(replaceArray(search, replace, this._value));
    }

    /**
     * Replace the first occurrence of a given value in the string.
     *
     * @param search - The value to search for.
     * @param replace - The replacement value.
     * @returns The updated Stringable instance.
     */
    replaceFirst(search: string | number, replace: string): Stringable {
        return new Stringable(replaceFirst(search, replace, this._value));
    }

    /**
     * Replace the first occurrence of the given value if it appears at the start of the string.
     *
     * @param search - The value to search for.
     * @param replace - The replacement value.
     * @returns The updated Stringable instance.
     */
    replaceStart(search: string | number, replace: string): Stringable {
        return new Stringable(replaceStart(search, replace, this._value));
    }

    /**
     * Replace the last occurrence of a given value in the string.
     *
     * @param search - The value to search for.
     * @param replace - The replacement value.
     * @returns The updated Stringable instance.
     */
    replaceLast(search: string | number, replace: string): Stringable {
        return new Stringable(replaceLast(search, replace, this._value));
    }

    /**
     * Replace the last occurrence of a given value if it appears at the end of the string.
     *
     * @param search - The value to search for.
     * @param replace - The replacement value.
     * @returns The updated Stringable instance.
     */
    replaceEnd(search: string | number, replace: string): Stringable {
        return new Stringable(replaceEnd(search, replace, this._value));
    }

    /**
     * Replace the patterns matching the given regular expression.
     *
     * @param pattern - The pattern(s) to search for.
     * @param replace - The replacement string(s) or a callback function.
     * @param limit - The maximum number of replacements to perform. Defaults to -1 (no limit).
     * @returns The updated Stringable instance.
     */
    replaceMatches(
        pattern: string | string[] | RegExp | RegExp[],
        replace: string | string[] | ((match: string[]) => string),
        limit = -1,
    ): Stringable {
        const out = replaceMatches(pattern, replace, this._value, limit);

        return new Stringable(out as string);
    }

    /**
     * Parse input from a string to an array, according to a format.
     *
     * @param format - A format string like "%d", "%s", "%[^,],%s", etc.
     * @returns Array of parsed values according to the format
     *
     * @example
     *
     * Str.of("SN/123456").scan("SN/%d") -> ["123456"]
     * Str.of("Otwell, Taylor").scan("%[^,],%s") -> ["Otwell", "Taylor"]
     * Str.of("filename.jpg").scan("%[^.].%s") -> ["filename", "jpg"]
     */
    scan(format: string): string[] {
        // Convert PHP sscanf format to JavaScript regex
        // Supported format specifiers: %d (int), %s (string), %[...] (character class)
        // Note: %s skips leading whitespace and matches until next whitespace

        let regexPattern = "";
        let i = 0;

        while (i < format.length) {
            if (format[i] === "%") {
                if (format[i + 1] === "[") {
                    // Character class like %[^,]
                    let j = i + 2;
                    while (j < format.length && format[j] !== "]") {
                        j++;
                    }
                    const charClass = format.substring(i + 2, j);
                    regexPattern += "([" + charClass + "]+)";
                    i = j + 1;
                } else if (format[i + 1] === "d") {
                    // Integer (may have optional leading whitespace)
                    regexPattern += "\\s*(-?\\d+)";
                    i += 2;
                } else if (format[i + 1] === "s") {
                    // String - skip leading whitespace, then match non-whitespace
                    regexPattern += "\\s*(\\S+)";
                    i += 2;
                } else {
                    regexPattern += format[i];
                    i++;
                }
            } else {
                // Escape special regex chars
                const char = format[i];
                if (char && /[.+?^${}()|\\]/.test(char)) {
                    regexPattern += "\\" + char;
                } else {
                    regexPattern += char;
                }
                i++;
            }
        }

        const regex = new RegExp("^" + regexPattern + "$");
        const matches = this._value.match(regex);

        if (!matches) {
            return [];
        }

        // Return captured groups as strings
        const result: string[] = [];
        for (let i = 1; i < matches.length; i++) {
            const match = matches[i];
            if (match) {
                result.push(match);
            }
        }

        return result;
    }

    /**
     * Remove all "extra" blank space from the given string.
     *
     * @returns The updated Stringable instance.
     */
    squish(): Stringable {
        return new Stringable(squish(this._value));
    }

    /**
     * Begin a string with a single instance of a given value.
     *
     * @param prefix - The string to start the original string with.
     * @returns The updated Stringable instance.
     */
    start(prefix: string): Stringable {
        return new Stringable(start(this._value, prefix));
    }

    /**
     * Strip HTML and PHP tags from the given string.
     *
     * @returns The updated Stringable instance.
     */
    stripTags(): Stringable {
        return new Stringable(stripTags(this._value));
    }

    /**
     * Convert the given string to upper-case.
     *
     * @returns The upper-cased string as a new Stringable instance.
     */
    upper(): Stringable {
        return new Stringable(upper(this._value));
    }

    /**
     * Convert the given string to proper case.
     *
     * @returns The title-cased string as a new Stringable instance.
     */
    title(): Stringable {
        return new Stringable(title(this._value));
    }

    /**
     * Convert the given string to proper case for each word.
     *
     * @returns The headline-cased string as a new Stringable instance.
     */
    headline(): Stringable {
        return new Stringable(headline(this._value));
    }

    /**
     * Convert the given string to APA-style title case.
     *
     * @returns The APA title-cased string as a new Stringable instance.
     */
    apa(): Stringable {
        return new Stringable(apa(this._value));
    }

    /**
     * Transliterate a string to its closest ASCII representation.
     *
     * @returns The transliterated string as a new Stringable instance.
     */
    transliterate(): Stringable {
        return new Stringable(transliterate(this._value));
    }

    /**
     * Get the singular form of an English word.
     *
     * @returns The singularized string as a new Stringable instance.
     */
    singular(): Stringable {
        return new Stringable(singular(this._value));
    }

    /**
     * Generate a URL friendly "slug" from a given string.
     *
     * @param separator - The separator to use in the slug. Defaults to "-".
     * @param dictionary - A dictionary of characters to replace. Defaults to { "@": "at" }.
     * @returns The slugified string as a new Stringable instance.
     */
    slug(
        separator = "-",
        dictionary: Record<string, string> = { "@": "at" },
    ): Stringable {
        return new Stringable(slug(this._value, separator, dictionary));
    }

    /**
     * Convert a string to snake case.
     *
     * @param delimiter - The delimiter to use in the snake case. Defaults to "_".
     * @returns The snake-cased string as a new Stringable instance.
     */
    snake(delimiter = "_"): Stringable {
        return new Stringable(snake(this._value, delimiter));
    }

    /**
     * Determine if a given string starts with a given substring.
     *
     * @param needles - The substring(s) to search for
     * @returns boolean - True if the substring(s) are found, false otherwise
     */
    startsWith(
        needles: string | number | null | Iterable<string | number | null>,
    ): boolean {
        return startsWith(this._value, needles);
    }

    /**
     * Determine if a given string doesn't start with a given substring.
     *
     * @param needles - The substring(s) to search for
     * @returns boolean - True if the substring(s) are not found, false otherwise
     */
    doesntStartWith(
        needles: string | number | null | Iterable<string | number | null>,
    ): boolean {
        return doesntStartWith(this._value, needles);
    }

    /**
     * Convert a value to studly caps case.
     *
     * @returns The studly-cased string as a new Stringable instance.
     */
    studly(): Stringable {
        return new Stringable(studly(this._value));
    }

    /**
     * Convert the string to Pascal case.
     *
     * @returns The pascal-cased string as a new Stringable instance.
     */
    pascal(): Stringable {
        return new Stringable(pascal(this._value));
    }

    /**
     * Returns the portion of the string specified by the start and length parameters.
     *
     * @param start - The starting position of the substring.
     * @param length - The length of the substring. If null, extracts to the end of the string.
     * @returns The extracted substring as a new Stringable instance.
     */
    substr(start: number, length: number | null = null): Stringable {
        return new Stringable(substr(this._value, start, length));
    }

    /**
     * Returns the number of substring occurrences.
     *
     * @param needle - The substring to search for.
     * @param offset - The offset to start searching from. Defaults to 0.
     * @param length - The length of the string to search within. If null, searches to the end of the string.
     * @returns The number of occurrences of the substring.
     */
    substrCount(
        needle: string,
        offset = 0,
        length: number | null = null,
    ): number {
        return substrCount(this._value, needle, offset, length);
    }

    /**
     * Replace text within a portion of a string.
     *
     * @param replace - The replacement string.
     * @param offset - The starting position to begin replacing.
     * @param length - The number of characters to replace. If null, replaces to the end of the string.
     * @returns The updated Stringable instance.
     */
    substrReplace(
        replace: string,
        offset: number | number[] = 0,
        length: number | number[] | null = null,
    ): Stringable {
        return new Stringable(
            substrReplace(this._value, replace, offset, length) as string,
        );
    }

    /**
     * Swap multiple keywords in a string with other keywords.
     *
     * @param map - A record of keywords to swap (key: search, value: replacement).
     * @returns The updated Stringable instance.
     */
    swap(map: Record<string, string>): Stringable {
        return new Stringable(swap(map, this._value));
    }

    /**
     * Take the first or last {$limit} characters.
     *
     * @param limit - The number of characters to take. Positive for start, negative for end.
     * @returns The resulting substring as a new Stringable instance.
     */
    take(limit: number): Stringable {
        return new Stringable(take(this._value, limit));
    }

    /**
     * Trim the string of the given characters.
     *
     * @param charlist - The characters to trim from the string. If null, trims whitespace.
     * @returns The trimmed string as a new Stringable instance.
     */
    trim(charlist: string | null = null): Stringable {
        return new Stringable(trim(this._value, charlist));
    }

    /**
     * Left trim the string of the given characters.
     *
     * @param charlist - The characters to trim from the start of the string. If null, trims whitespace.
     * @returns The left-trimmed string as a new Stringable instance.
     */
    ltrim(charlist: string | null = null): Stringable {
        return new Stringable(ltrim(this._value, charlist));
    }

    /**
     * Right trim the string of the given characters.
     *
     * @param charlist - The characters to trim from the end of the string. If null, trims whitespace.
     * @returns The right-trimmed string as a new Stringable instance.
     */
    rtrim(charlist: string | null = null): Stringable {
        return new Stringable(rtrim(this._value, charlist));
    }

    /**
     * Make a string's first character lowercase.
     *
     * @returns The updated Stringable instance.
     */
    lcfirst(): Stringable {
        return new Stringable(lcfirst(this._value));
    }

    /**
     * Make a string's first character uppercase.
     *
     * @returns The updated Stringable instance.
     */
    ucfirst(): Stringable {
        return new Stringable(ucfirst(this._value));
    }

    /**
     * Split a string by uppercase characters.
     *
     * @returns An array of substrings split at uppercase characters.
     */
    ucsplit(): string[] {
        return ucsplit(this._value);
    }

    /**
     * Uppercase the first character of each word in a string.
     *
     * @returns The updated Stringable instance.
     */
    ucwords(): Stringable {
        return new Stringable(ucwords(this._value));
    }

    /**
     * Apply the callback if the given "value" is (or resolves to) truthy.
     *
     * @param value - The value to evaluate or a closure that returns the value
     * @param callback - The callback to execute if the value is truthy
     * @param defaultCallback - The callback to execute if the value is falsy
     * @returns Stringable - The current instance or the result of the callback
     *
     * @example
     *
     * ```typescript
     * const str = new Stringable('hello world');
     *
     * Using a direct value
     * str.when(true, s => s.upper()); // Returns 'HELLO WORLD'
     * str.when(false, s => s.upper(), s => s.lower()); // Returns 'hello world'
     *
     * Using a closure to determine the value
     * str.when(s => s.contains('world'), s => s.upper()); // Returns 'HELLO WORLD'
     * str.when(s => s.contains('foo'), s => s.upper(), s => s.lower()); // Returns 'hello world'
     * ```
     */
    when<TWhenParameter, TWhenReturnType>(
        value: ((instance: this) => TWhenParameter) | TWhenParameter | null,
        callback:
            | ((instance: this, value: TWhenParameter) => TWhenReturnType)
            | null = null,
        defaultCallback:
            | ((instance: this, value: TWhenParameter) => TWhenReturnType)
            | null = null,
    ): Stringable {
        const resolvedValue = isFunction(value)
            ? (value as (instance: this) => TWhenParameter)(this)
            : (value as TWhenParameter);

        if (resolvedValue) {
            return (callback?.(this, resolvedValue) ?? this) as Stringable;
        } else if (defaultCallback) {
            return (defaultCallback(this, resolvedValue) ?? this) as Stringable;
        }

        return this;
    }

    /**
     * Apply the callback if the given "value" is (or resolves to) falsy.
     *
     * @param value - The value to evaluate or a closure that returns the value
     * @param callback - The callback to execute if the value is falsy
     * @param defaultCallback - The callback to execute if the value is truthy
     * @returns Stringable - The current instance or the result of the callback
     *
     * @example
     *
     * const str = new Stringable('hello world');
     * str.unless(true, s => s.upper()); // Returns 'hello world'
     * str.unless(false, s => s.upper(), s => s.lower()); // Returns 'HELLO WORLD'
     */
    unless<TUnlessParameter, TUnlessReturnType>(
        value: ((instance: this) => TUnlessParameter) | TUnlessParameter | null,
        callback:
            | ((instance: this, value: TUnlessParameter) => TUnlessReturnType)
            | null = null,
        defaultCallback:
            | ((instance: this, value: TUnlessParameter) => TUnlessReturnType)
            | null = null,
    ): Stringable {
        const resolvedValue = (
            isFunction(value) ? value(this) : value
        ) as TUnlessParameter;

        if (!resolvedValue) {
            return (callback?.(this, resolvedValue) ?? this) as Stringable;
        } else if (defaultCallback) {
            return (defaultCallback(this, resolvedValue) ?? this) as Stringable;
        }

        return this;
    }

    /**
     * Execute the given callback if the string contains a given substring.
     *
     * @param needles - The substring(s) to search for
     * @param callback - The callback to execute if the substring(s) are found
     * @param defaultCallback - The callback to execute if the substring(s) are not found
     * @returns Stringable - The current instance or the result of the callback
     */
    whenContains(
        needles: string | Iterable<string>,
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.contains(needles), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string contains all array values.
     *
     * @param needles - The substring(s) to search for
     * @param callback - The callback to execute if all substring(s) are found
     * @param defaultCallback - The callback to execute if not all substring(s) are found
     * @returns Stringable - The current instance or the result of the callback
     */
    whenContainsAll(
        needles: string | Iterable<string>,
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.containsAll(needles), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string is empty.
     *
     * @param callback - The callback to execute if the string is empty
     * @param defaultCallback - The callback to execute if the string is not empty
     * @returns Stringable - The current instance or the result of the callback
     */
    whenEmpty(
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.isEmpty(), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string is not empty.
     *
     * @param callback - The callback to execute if the string is not empty
     * @param defaultCallback - The callback to execute if the string is empty
     * @returns Stringable - The current instance or the result of the callback
     */
    whenNotEmpty(
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.isNotEmpty(), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string ends with a given substring.
     *
     * @param needles - The substring(s) to search for
     * @param callback - The callback to execute if the substring(s) are found
     * @param defaultCallback - The callback to execute if the substring(s) are not found
     * @returns Stringable - The current instance or the result of the callback
     */
    whenEndsWith(
        needles: string | Iterable<string>,
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.endsWith(needles), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string doesn't end with a given substring.
     *
     * @param needles - The substring(s) to search for
     * @param callback - The callback to execute if the substring(s) are not found
     * @param defaultCallback - The callback to execute if the substring(s) are found
     * @returns Stringable - The current instance or the result of the callback
     */
    whenDoesntEndWith(
        needles: string | Iterable<string>,
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(
            this.doesntEndWith(needles),
            callback,
            defaultCallback,
        );
    }

    /**
     * Execute the given callback if the string is an exact match with the given value.
     *
     * @param value - The value to compare against
     * @param callback - The callback to execute if the string matches the value
     * @param defaultCallback - The callback to execute if the string does not match the value
     * @returns Stringable - The current instance or the result of the callback
     */
    whenExactly(
        value: string,
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.exactly(value), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string is not an exact match with the given value.
     *
     * @param value - The value to compare against
     * @param callback - The callback to execute if the string does not match the value
     * @param defaultCallback - The callback to execute if the string matches the value
     * @returns Stringable - The current instance or the result of the callback
     */
    whenNotExactly(
        value: string,
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(!this.exactly(value), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string matches a given pattern.
     *
     * @param pattern - The pattern(s) to match against
     * @param callback - The callback to execute if the pattern(s) match
     * @param defaultCallback - The callback to execute if the pattern(s) do not match
     * @returns Stringable - The current instance or the result of the callback
     */
    whenIs(
        pattern: string | Iterable<string>,
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.is(pattern), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string is 7 bit ASCII.
     *
     * @param callback - The callback to execute if the string is ASCII
     * @param defaultCallback - The callback to execute if the string is not ASCII
     * @returns Stringable - The current instance or the result of the callback
     */
    whenIsAscii(
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.isAscii(), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string is a valid UUID.
     *
     * @param callback - The callback to execute if the string is a UUID
     * @param defaultCallback - The callback to execute if the string is not a UUID
     * @returns Stringable - The current instance or the result of the callback
     */
    whenIsUuid(
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.isUuid(), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string is a valid ULID.
     *
     * @param callback - The callback to execute if the string is a ULID
     * @param defaultCallback - The callback to execute if the string is not a ULID
     * @returns Stringable - The current instance or the result of the callback
     */
    whenIsUlid(
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.isUlid(), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string starts with a given substring.
     *
     * @param needles - The substring(s) to search for
     * @param callback - The callback to execute if the substring(s) are found
     * @param defaultCallback - The callback to execute if the substring(s) are not found
     * @returns Stringable - The current instance or the result of the callback
     */
    whenStartsWith(
        needles: string | Iterable<string>,
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.startsWith(needles), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string matches the given pattern.
     *
     * @param pattern - The pattern(s) to match against
     * @param callback - The callback to execute if the pattern(s) match
     * @param defaultCallback - The callback to execute if the pattern(s) do not match
     * @returns Stringable - The current instance or the result of the callback
     */
    whenTest(
        pattern: string,
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.test(pattern), callback, defaultCallback);
    }

    /**
     * Limit the number of words in a string.
     *
     * @param wordsValue - The maximum number of words allowed. Defaults to 100.
     * @param end - The string to append if the string is truncated. Defaults to "...".
     * @returns The truncated string as a new Stringable instance.
     */
    words(wordsValue: number = 100, end: string = "..."): Stringable {
        return new Stringable(words(this._value, wordsValue, end));
    }

    /**
     * Get the number of words a string contains.
     *
     * @param characters - The characters to consider as word boundaries. If null, defaults to standard word boundaries.
     * @returns The number of words in the string.
     */
    wordCount(characters: string | null = null): number {
        return wordCount(this._value, characters);
    }

    /**
     * Wrap a string to a given number of characters.
     *
     * @param characters - The number of characters at which to wrap the string. Defaults to 75.
     * @param breakStr - The string to insert as a break. Defaults to "\n".
     * @param cutLongWords - Whether to cut words longer than the specified length. Defaults to false.
     * @returns The wrapped string as a new Stringable instance.
     */
    wordWrap(
        characters = 75,
        breakStr = "\n",
        cutLongWords = false,
    ): Stringable {
        return new Stringable(
            wordWrap(this._value, characters, breakStr, cutLongWords),
        );
    }

    /**
     * Wrap the string with the given strings.
     *
     * @param before - The string to prepend
     * @param after - The string to append. Defaults to the value of `before`
     * @returns The wrapped string as a new Stringable instance.
     */
    wrap(before: string, after: string | null = null): Stringable {
        return new Stringable(wrap(this._value, before, after));
    }

    /**
     * Unwrap the string with the given strings.
     *
     * @param before - The string to remove from the start
     * @param after - The string to remove from the end. Defaults to the value of `before`
     * @returns The unwrapped string as a new Stringable instance.
     */
    unwrap(before: string, after: string | null = null): Stringable {
        return new Stringable(unwrap(this._value, before, after));
    }

    /**
     * Convert the string to Base64 encoding.
     *
     * @returns The Base64 encoded string as a new Stringable instance.
     */
    toBase64(): Stringable {
        return new Stringable(toBase64(this._value));
    }

    /**
     * Decode the Base64 encoded string.
     *
     * @param strict - Whether to use strict decoding. Defaults to false.
     * @returns The decoded string as a new Stringable instance, or false on failure.
     */
    fromBase64(strict = false): Stringable | false {
        const decoded = fromBase64(this._value, strict);
        return decoded === false ? false : new Stringable(decoded);
    }

    /**
     * Get the underlying string value.
     *
     * @returns The string representation of the object.
     */
    toString(): string {
        return this.value();
    }

    /**
     * Get the underlying string value.
     *
     * @returns The string value.
     */
    value(): string {
        return String(this._value);
    }

    /**
     * Get the underlying string value as an integer.
     *
     * @param base - The base to use for conversion. Defaults to 10.
     * @returns The integer value.
     */
    toInteger(base = 10): number {
        const b = Number(base) || 10;
        return parseInt(this._value, b);
    }

    /**
     * Get the underlying string value as a float.
     *
     * @returns The float value.
     */
    toFloat(): number {
        return parseFloat(this._value);
    }

    /**
     * Get the underlying string value as a boolean.
     *
     * @returns true when value is "1", "true", "on", and "yes". Otherwise, returns false.
     */
    toBoolean(): boolean {
        const v = lower(trim(this._value));

        return v === "1" || v === "true" || v === "on" || v === "yes";
    }

    /**
     * Get the underlying string value as a Carbon instance.
     *
     * @returns The Date instance or null if parsing fails.
     */
    toDate(): Date | null {
        const parsed = Date.parse(this._value);
        return isNaN(parsed) ? null : new Date(parsed);
    }

    /**
     * Convert the object to a string when JSON encoded.
     *
     * @returns The string representation of the object.
     */
    jsonSerialize(): string {
        return this.toString();
    }
}
