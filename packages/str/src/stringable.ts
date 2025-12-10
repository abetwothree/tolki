import type {
    ConvertCaseMode,
    MarkDownExtensions,
    MarkDownOptions,
} from "@laravel-js/str";
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
} from "@laravel-js/str";
import type {
    ConditionableClosure,
    // TODO: update conditionable functions like in Collection.ts
    // ConditionableValue,
} from "@laravel-js/types";
import { isArray, isFunction } from "@laravel-js/utils";

/**
 * Get a new stringable object from the given string.
 *
 * @example
 *
 * of('foo').append('bar'); -> 'foobar'
 */
export function of(value: string): Stringable {
    return new Stringable(value);
}

export class Stringable {
    /**
     * Create a new instance of the class.
     */
    constructor(private readonly _value: string = "") { }

    /**
     * Return the remainder of a string after the first occurrence of a given value.
     */
    after(search: string | number): Stringable {
        return new Stringable(after(this._value, search));
    }

    /**
     * Return the remainder of a string after the last occurrence of a given value
     */
    afterLast(search: string | number): Stringable {
        return new Stringable(afterLast(this._value, search));
    }

    /**
     * Append the given values to the string.
     */
    append(...values: Array<string | number>): Stringable {
        return new Stringable(this._value + values.map(String).join(""));
    }

    /**
     * Append a new line to the string.
     */
    newLine(count = 1): Stringable {
        return this.append("\n".repeat(Math.max(0, count)));
    }

    /**
     * Transliterate a UTF-8 value to ASCII.
     */
    ascii(): Stringable {
        return new Stringable(ascii(this._value));
    }

    /**
     * Get the portion of a string before the first occurrence of a given value.
     */
    before(search: string | number): Stringable {
        return new Stringable(before(this._value, search));
    }

    /**
     * Get the portion of a string before the last occurrence of a given value.
     */
    beforeLast(search: string | number): Stringable {
        return new Stringable(beforeLast(this._value, search));
    }

    /**
     * Get the portion of a string between two given values.
     */
    between(from: string | number, to: string | number): Stringable {
        return new Stringable(between(this._value, from, to));
    }

    /**
     * Get the smallest possible portion of a string between two given values.
     */
    betweenFirst(from: string | number, to: string | number): Stringable {
        return new Stringable(betweenFirst(this._value, from, to));
    }

    /**
     * Convert a value to camel case.
     */
    camel(): Stringable {
        return new Stringable(camel(this._value));
    }

    /**
     * Get the character at the specified index.
     */
    charAt(index: number): string | false {
        return charAt(this._value, index);
    }

    /**
     * Remove the given string if it exists at the start of the current string.
     */
    chopStart(needle: string | string[]): Stringable {
        return new Stringable(chopStart(this._value, needle));
    }

    /**
     * Remove the given string if it exists at the end of the current string.
     */
    chopEnd(needle: string | string[]): Stringable {
        return new Stringable(chopEnd(this._value, needle));
    }

    /**
     * Determine if a given string contains a given substring.
     */
    contains(needles: string | Iterable<string>, ignoreCase = false): boolean {
        return contains(this._value, needles, ignoreCase);
    }

    /**
     * Determine if a given string contains all array values.
     */
    containsAll(needles: Iterable<string>, ignoreCase = false): boolean {
        return containsAll(this._value, needles, ignoreCase);
    }

    /**
     * Determine if a given string doesn't contain a given substring.
     *
     * @param needles - The substring(s) to search for
     * @returns boolean - True if the substring(s) are not found, false otherwise
     */
    doesntContain(needles: string | Iterable<string>): boolean {
        return doesntContain(this._value, needles);
    }

    /**
     * Convert the case of a string.
     */
    convertCase(mode: ConvertCaseMode): Stringable {
        return new Stringable(convertCase(this._value, mode));
    }

    /**
     * Replace consecutive instances of a given character with a single character.
     */
    deduplicate(character: string | string[] = " "): Stringable {
        return new Stringable(deduplicate(this._value, character));
    }

    /**
     * Determine if a given string ends with a given substring.
     */
    endsWith(needles: string | number | Iterable<string>): boolean {
        return endsWith(this._value, needles);
    }

    /**
     * Determine if a given string doesn't end with a given substring.
     */
    doesntEndWith(needles: string | number | Iterable<string>): boolean {
        return doesntEndWith(this._value, needles);
    }

    /**
     * Determine if the string is an exact match with the given value.
     */
    exactly(value: Stringable | string): boolean {
        const other =
            value instanceof Stringable ? value.toString() : String(value);

        return this._value === other;
    }

    /**
     * Extracts an excerpt from text that matches the first instance of a phrase.
     */
    excerpt(
        phrase: string | null = "",
        options: { radius?: number; omission?: string } = {},
    ): string | null {
        return excerpt(this._value, phrase, options);
    }

    /**
     * Explode the string into a collection.
     * TODO
     */
    explode(
        _delimiter: string,

        _limit: number | null = null,
    ) {
        _limit ??= Number.MAX_SAFE_INTEGER;
        // return new Collection(explode($delimiter, this._value, $limit));
    }

    /**
     * Split a string using a regular expression or by length.
     * TODO
     */
    split(
        _pattern: string | number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _limit: number | null = null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _flags: number | null = null,
    ) {
        // if (filter_var($pattern, FILTER_VALIDATE_INT) !== false) {
        //     return new Collection(mb_str_split($this->value, $pattern));
        // }
        // $segments = preg_split($pattern, $this->value, $limit, $flags);
        // return ! empty($segments) ? new Collection($segments) : new Collection;
    }

    /**
     * Cap a string with a single instance of a given value.
     */
    finish(cap: string): Stringable {
        return new Stringable(finish(this._value, cap));
    }

    /**
     * Determine if a given string matches a given pattern.
     */
    is(pattern: string | Iterable<string>, ignoreCase = false): boolean {
        return is(pattern, this._value, ignoreCase);
    }

    /**
     * Determine if a given string is 7 bit ASCII.
     */
    isAscii(): boolean {
        return isAscii(this._value);
    }

    /**
     * Determine if a given string is valid JSON.
     */
    isJson(): boolean {
        return isJson(this._value);
    }

    /**
     * Determine if a given value is a valid URL.
     */
    isUrl(protocols: string[] = []): boolean {
        return isUrl(this._value, protocols);
    }

    /**
     * Determine if a given string is a valid UUID.
     */
    isUuid(version: number | "nil" | "max" | null = null): boolean {
        return isUuid(this._value, version);
    }

    /**
     * Determine if a given string is a valid ULID.
     */
    isUlid(): boolean {
        return isUlid(this._value);
    }

    /**
     * Determine if the given string is empty.
     */
    isEmpty(): boolean {
        return this._value === "";
    }

    /**
     * Determine if the given string is not empty.
     */
    isNotEmpty(): boolean {
        return !this.isEmpty();
    }

    /**
     * Convert a string to kebab case.
     */
    kebab(): Stringable {
        return new Stringable(kebab(this._value));
    }

    /**
     * Return the length of the given string.
     */
    length(): number {
        return length(this._value);
    }

    /**
     * Limit the number of characters in a string.
     */
    limit(limitValue = 100, end = "...", preserveWords = false): Stringable {
        return new Stringable(
            limit(this._value, limitValue, end, preserveWords),
        );
    }

    /**
     * Convert the given string to lower-case.
     */
    lower(): Stringable {
        return new Stringable(lower(this._value));
    }

    /**
     * Convert GitHub flavored Markdown into HTML.
     */
    markdown(
        options: MarkDownOptions = { gfm: true, anchors: false },
        extensions: MarkDownExtensions = [],
    ): Stringable {
        return new Stringable(markdown(this._value, options, extensions));
    }

    /**
     * Convert inline Markdown into HTML.
     */
    inlineMarkdown(
        options: MarkDownOptions = { gfm: true },
        extensions: MarkDownExtensions = [],
    ): Stringable {
        return new Stringable(inlineMarkdown(this._value, options, extensions));
    }

    /**
     * Masks a portion of a string with a repeated character.
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
     */
    match(pattern: string): Stringable {
        return new Stringable(match(pattern, this._value));
    }

    /**
     * Determine if a given string matches a given pattern.
     */
    isMatch(pattern: string | Iterable<string>): boolean {
        return isMatch(pattern, this._value);
    }

    /**
     * Get the string matching the given pattern.
     */
    matchAll(pattern: string): string[] {
        return matchAll(pattern, this._value);
    }

    /**
     * Determine if the string matches the given pattern.
     */
    test(pattern: string): boolean {
        return this.isMatch(pattern);
    }

    /**
     * Remove all non-numeric characters from a string.
     */
    numbers(): Stringable {
        return new Stringable(numbers(this._value) as string);
    }

    /**
     * Pad both sides of the string with another.
     */
    padBoth(length: number, pad = " "): Stringable {
        return new Stringable(padBoth(this._value, length, pad));
    }

    /**
     * Pad the left side of the string with another.
     */
    padLeft(length: number, pad = " "): Stringable {
        return new Stringable(padLeft(this._value, length, pad));
    }

    /**
     * Pad the right side of the string with another.
     */
    padRight(length: number, pad = " "): Stringable {
        return new Stringable(padRight(this._value, length, pad));
    }

    /**
     * Call the given callback and return a new string.
     */
    pipe<T = Stringable | string>(callback: (s: Stringable) => T): Stringable {
        const res = callback(this) as T;

        return res instanceof Stringable ? res : new Stringable(String(res));
    }

    /**
     * Get the plural form of an English word.
     */
    plural(count: number = 2, prependCount: boolean = false): Stringable {
        return new Stringable(plural(this._value, count, prependCount));
    }

    /**
     * Pluralize the last word of an English, studly caps case string.
     */
    pluralStudly(count: number = 2): Stringable {
        const c = isArray(count) ? count.length : Number(count);

        return new Stringable(pluralStudly(this._value, c));
    }

    /**
     * Pluralize the last word of an English, Pascal caps case string.
     */
    pluralPascal(count: number = 2): Stringable {
        const c = isArray(count) ? count.length : Number(count);

        return new Stringable(pluralPascal(this._value, c));
    }

    /**
     * Find the multi-byte safe position of the first occurrence of the given substring.
     */
    position(needle: string, offset = 0): number | false {
        return position(this._value, needle, offset);
    }

    /**
     * Prepend the given values to the string.
     */
    prepend(...values: Array<string | number>): Stringable {
        return new Stringable(values.map(String).join("") + this._value);
    }

    /**
     * Remove any occurrence of the given string in the subject.
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
     */
    reverse(): Stringable {
        return new Stringable(reverse(this._value));
    }

    /**
     * Repeat the string.
     */
    repeat(times: number): Stringable {
        return new Stringable(repeat(this._value, times));
    }

    /**
     * Replace the given value in the given string.
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
     */
    replaceArray(
        search: string,
        replace: Record<string, string> | Iterable<string>,
    ): Stringable {
        return new Stringable(replaceArray(search, replace, this._value));
    }

    /**
     * Replace the first occurrence of a given value in the string.
     */
    replaceFirst(search: string | number, replace: string): Stringable {
        return new Stringable(replaceFirst(search, replace, this._value));
    }

    /**
     * Replace the first occurrence of the given value if it appears at the start of the string.
     */
    replaceStart(search: string | number, replace: string): Stringable {
        return new Stringable(replaceStart(search, replace, this._value));
    }

    /**
     * Replace the last occurrence of a given value in the string.
     */
    replaceLast(search: string | number, replace: string): Stringable {
        return new Stringable(replaceLast(search, replace, this._value));
    }

    /**
     * Replace the last occurrence of a given value if it appears at the end of the string.
     */
    replaceEnd(search: string | number, replace: string): Stringable {
        return new Stringable(replaceEnd(search, replace, this._value));
    }

    /**
     * Replace the patterns matching the given regular expression.
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
     * Parse input from a string to a collection, according to a format.
     * TODO
     */
    scan(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _format: string,
    ) {
        // return new Collection(sscanf($this->value, $format));
    }

    /**
     * Remove all "extra" blank space from the given string.
     */
    squish(): Stringable {
        return new Stringable(squish(this._value));
    }

    /**
     * Begin a string with a single instance of a given value.
     */
    start(prefix: string): Stringable {
        return new Stringable(start(this._value, prefix));
    }

    /**
     * Strip HTML and PHP tags from the given string.
     */
    stripTags(): Stringable {
        return new Stringable(stripTags(this._value));
    }

    /**
     * Convert the given string to upper-case.
     */
    upper(): Stringable {
        return new Stringable(upper(this._value));
    }

    /**
     * Convert the given string to proper case.
     */
    title(): Stringable {
        return new Stringable(title(this._value));
    }

    /**
     * Convert the given string to proper case for each word.
     */
    headline(): Stringable {
        return new Stringable(headline(this._value));
    }

    /**
     * Convert the given string to APA-style title case.
     */
    apa(): Stringable {
        return new Stringable(apa(this._value));
    }

    /**
     * Transliterate a string to its closest ASCII representation.
     */
    transliterate(): Stringable {
        return new Stringable(transliterate(this._value));
    }

    /**
     * Get the singular form of an English word.
     */
    singular(): Stringable {
        return new Stringable(singular(this._value));
    }

    /**
     * Generate a URL friendly "slug" from a given string.
     */
    slug(
        separator = "-",
        dictionary: Record<string, string> = { "@": "at" },
    ): Stringable {
        return new Stringable(slug(this._value, separator, dictionary));
    }

    /**
     * Convert a string to snake case.
     */
    snake(delimiter = "_"): Stringable {
        return new Stringable(snake(this._value, delimiter));
    }

    /**
     * Determine if a given string starts with a given substring.
     */
    startsWith(
        needles: string | number | null | Iterable<string | number | null>,
    ): boolean {
        return startsWith(this._value, needles);
    }

    /**
     * Determine if a given string doesn't start with a given substring.
     */
    doesntStartWith(
        needles: string | number | null | Iterable<string | number | null>,
    ): boolean {
        return doesntStartWith(this._value, needles);
    }

    /**
     * Convert a value to studly caps case.
     */
    studly(): Stringable {
        return new Stringable(studly(this._value));
    }

    /**
     * Convert the string to Pascal case.
     */
    pascal(): Stringable {
        return new Stringable(pascal(this._value));
    }

    /**
     * Returns the portion of the string specified by the start and length parameters.
     */
    substr(start: number, length: number | null = null): Stringable {
        return new Stringable(substr(this._value, start, length));
    }

    /**
     * Returns the number of substring occurrences.
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
     */
    swap(map: Record<string, string>): Stringable {
        return new Stringable(swap(map, this._value));
    }

    /**
     * Take the first or last {$limit} characters.
     */
    take(limit: number): Stringable {
        return new Stringable(take(this._value, limit));
    }

    /**
     * Trim the string of the given characters.
     */
    trim(charlist: string | null = null): Stringable {
        return new Stringable(trim(this._value, charlist));
    }

    /**
     * Left trim the string of the given characters.
     */
    ltrim(charlist: string | null = null): Stringable {
        return new Stringable(ltrim(this._value, charlist));
    }

    /**
     * Right trim the string of the given characters.
     */
    rtrim(charlist: string | null = null): Stringable {
        return new Stringable(rtrim(this._value, charlist));
    }

    /**
     * Make a string's first character lowercase.
     */
    lcfirst(): Stringable {
        return new Stringable(lcfirst(this._value));
    }

    /**
     * Make a string's first character uppercase.
     */
    ucfirst(): Stringable {
        return new Stringable(ucfirst(this._value));
    }

    /**
     * Split a string by uppercase characters.
     */
    ucsplit(): string[] {
        return ucsplit(this._value);
    }

    /**
     * Uppercase the first character of each word in a string.
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
     * // Using a direct value
     * str.when(true, s => s.upper()); // Returns 'HELLO WORLD'
     * str.when(false, s => s.upper(), s => s.lower()); // Returns 'hello world'
     *
     * // Using a closure to determine the value
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
     */
    whenEmpty(
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.isEmpty(), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string is not empty.
     */
    whenNotEmpty(
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.isNotEmpty(), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string ends with a given substring.
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
     */
    whenIsAscii(
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.isAscii(), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string is a valid UUID.
     */
    whenIsUuid(
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.isUuid(), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string is a valid ULID.
     */
    whenIsUlid(
        callback: ConditionableClosure,
        defaultCallback: ConditionableClosure = null,
    ) {
        return this.when(this.isUlid(), callback, defaultCallback);
    }

    /**
     * Execute the given callback if the string starts with a given substring.
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
     */
    words(wordsValue: number = 100, end: string = "..."): Stringable {
        return new Stringable(words(this._value, wordsValue, end));
    }

    /**
     * Get the number of words a string contains.
     */
    wordCount(characters: string | null = null): number {
        return wordCount(this._value, characters);
    }

    /**
     * Wrap a string to a given number of characters.
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
     */
    wrap(before: string, after: string | null = null): Stringable {
        return new Stringable(wrap(this._value, before, after));
    }

    /**
     * Unwrap the string with the given strings.
     */
    unwrap(before: string, after: string | null = null): Stringable {
        return new Stringable(unwrap(this._value, before, after));
    }

    /**
     * Convert the string to Base64 encoding.
     */
    toBase64(): Stringable {
        return new Stringable(toBase64(this._value));
    }

    /**
     * Decode the Base64 encoded string.
     */
    fromBase64(strict = false): Stringable | false {
        const decoded = fromBase64(this._value, strict);
        return decoded === false ? false : new Stringable(decoded);
    }

    /**
     * Get the underlying string value.
     */
    toString(): string {
        return this.value();
    }

    /**
     * Get the underlying string value.
     */
    value(): string {
        return String(this._value);
    }

    /**
     * Get the underlying string value as an integer.
     */
    toInteger(base = 10): number {
        const b = Number(base) || 10;
        return parseInt(this._value, b);
    }

    /**
     * Get the underlying string value as a float.
     */
    toFloat(): number {
        return parseFloat(this._value);
    }

    /**
     * Get the underlying string value as a boolean.
     *
     * Returns true when value is "1", "true", "on", and "yes". Otherwise, returns false.
     */
    toBoolean(): boolean {
        const v = lower(trim(this._value));

        return v === "1" || v === "true" || v === "on" || v === "yes";
    }

    /**
     * Get the underlying string value as a Carbon instance.
     */
    toDate(): Date | null {
        const parsed = Date.parse(this._value);
        return isNaN(parsed) ? null : new Date(parsed);
    }

    /**
     * Convert the object to a string when JSON encoded.
     */
    jsonSerialize(): string {
        return this.toString();
    }
}
