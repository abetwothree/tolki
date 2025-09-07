import { Str } from "./Str.js";
import type { ConvertCaseMode } from "./ConvertCase.js";
import type { MarkDownOptions, MarkDownExtensions } from "./Markdown.js";
import { isFunction } from "lodash-es";

export type ConditionableValue =
    | string
    | number
    | boolean
    | ((instance: Stringable) => string | number | boolean);
export type ConditionableClosure =
    | ((instance: Stringable, value: ConditionableValue) => unknown)
    | null;

export class Stringable {
    /**
     * Create a new instance of the class.
     */
    constructor(private readonly _value: string = "") {}

    /**
     * Return the remainder of a string after the first occurrence of a given value.
     */
    after(search: string | number): Stringable {
        return new Stringable(Str.after(this._value, search));
    }

    /**
     * Return the remainder of a string after the last occurrence of a given value
     */
    afterLast(search: string | number): Stringable {
        return new Stringable(Str.afterLast(this._value, search));
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
        return new Stringable(Str.ascii(this._value));
    }

    /**
     * Get the portion of a string before the first occurrence of a given value.
     */
    before(search: string | number): Stringable {
        return new Stringable(Str.before(this._value, search));
    }

    /**
     * Get the portion of a string before the last occurrence of a given value.
     */
    beforeLast(search: string | number): Stringable {
        return new Stringable(Str.beforeLast(this._value, search));
    }

    /**
     * Get the portion of a string between two given values.
     */
    between(from: string | number, to: string | number): Stringable {
        return new Stringable(Str.between(this._value, from, to));
    }

    /**
     * Get the smallest possible portion of a string between two given values.
     */
    betweenFirst(from: string | number, to: string | number): Stringable {
        return new Stringable(Str.betweenFirst(this._value, from, to));
    }

    /**
     * Convert a value to camel case.
     */
    camel(): Stringable {
        return new Stringable(Str.camel(this._value));
    }

    /**
     * Get the character at the specified index.
     */
    charAt(index: number): string | false {
        return Str.charAt(this._value, index);
    }

    /**
     * Remove the given string if it exists at the start of the current string.
     */
    chopStart(needle: string | string[]): Stringable {
        return new Stringable(Str.chopStart(this._value, needle));
    }

    /**
     * Remove the given string if it exists at the end of the current string.
     */
    chopEnd(needle: string | string[]): Stringable {
        return new Stringable(Str.chopEnd(this._value, needle));
    }

    /**
     * Determine if a given string contains a given substring.
     */
    contains(needles: string | Iterable<string>, ignoreCase = false): boolean {
        return Str.contains(this._value, needles, ignoreCase);
    }

    /**
     * Determine if a given string contains all array values.
     */
    containsAll(needles: Iterable<string>, ignoreCase = false): boolean {
        return Str.containsAll(this._value, needles, ignoreCase);
    }

    /**
     * Convert the case of a string.
     */
    convertCase(mode: ConvertCaseMode): Stringable {
        return new Stringable(Str.convertCase(this._value, mode));
    }

    /**
     * Replace consecutive instances of a given character with a single character.
     */
    deduplicate(character: string | string[] = " "): Stringable {
        return new Stringable(Str.deduplicate(this._value, character));
    }

    /**
     * Determine if a given string ends with a given substring.
     */
    endsWith(needles: string | number | Iterable<string>): boolean {
        return Str.endsWith(this._value, needles);
    }

    /**
     * Determine if a given string doesn't end with a given substring.
     */
    doesntEndWith(needles: string | number | Iterable<string>): boolean {
        return Str.doesntEndWith(this._value, needles);
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
    excerpt(phrase = "", options: Record<string, unknown> = {}): string | null {
        return Str.excerpt(this._value, phrase, options);
    }

    /**
     * Explode the string into a collection.
     * TODO
     */
    explode(delimiter: string, limit: number | null = null) {
        limit ??= Number.MAX_SAFE_INTEGER;
        // return new Collection(explode($delimiter, this._value, $limit));
    }

    /**
     * Split a string using a regular expression or by length.
     * TODO
     */
    split(
        pattern: string | number,
        limit: number | null = null,
        flags: number | null = null,
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
        return new Stringable(Str.finish(this._value, cap));
    }

    /**
     * Determine if a given string matches a given pattern.
     */
    is(pattern: string | Iterable<string>, ignoreCase = false): boolean {
        return Str.is(pattern, this._value, ignoreCase);
    }

    /**
     * Determine if a given string is 7 bit ASCII.
     */
    isAscii(): boolean {
        return Str.isAscii(this._value);
    }

    /**
     * Determine if a given string is valid JSON.
     */
    isJson(): boolean {
        return Str.isJson(this._value);
    }

    /**
     * Determine if a given value is a valid URL.
     */
    isUrl(protocols: string[] = []): boolean {
        return Str.isUrl(this._value, protocols);
    }

    /**
     * Determine if a given string is a valid UUID.
     */
    isUuid(version: number | "nil" | "max" | null = null): boolean {
        return Str.isUuid(this._value, version);
    }

    /**
     * Determine if a given string is a valid ULID.
     */
    isUlid(): boolean {
        return Str.isUlid(this._value);
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
        return new Stringable(Str.kebab(this._value));
    }

    /**
     * Return the length of the given string.
     */
    length(): number {
        return Str.length(this._value);
    }

    /**
     * Limit the number of characters in a string.
     */
    limit(limit = 100, end = "...", preserveWords = false): Stringable {
        return new Stringable(
            Str.limit(this._value, limit, end, preserveWords),
        );
    }

    /**
     * Convert the given string to lower-case.
     */
    lower(): Stringable {
        return new Stringable(Str.lower(this._value));
    }

    /**
     * Convert GitHub flavored Markdown into HTML.
     */
    markdown(
        options: MarkDownOptions = { gfm: true, anchors: false },
        extensions: MarkDownExtensions = [],
    ): Stringable {
        return new Stringable(Str.markdown(this._value, options, extensions));
    }

    /**
     * Convert inline Markdown into HTML.
     */
    inlineMarkdown(
        options: MarkDownOptions = { gfm: true },
        extensions: MarkDownExtensions = [],
    ): Stringable {
        return new Stringable(
            Str.inlineMarkdown(this._value, options, extensions),
        );
    }

    /**
     * Masks a portion of a string with a repeated character.
     */
    mask(
        character: string,
        index: number,
        length: number | null = null,
    ): Stringable {
        return new Stringable(Str.mask(this._value, character, index, length));
    }

    /**
     * Get the string matching the given pattern.
     */
    match(pattern: string): Stringable {
        return new Stringable(Str.match(pattern, this._value));
    }

    /**
     * Determine if a given string matches a given pattern.
     */
    isMatch(pattern: string | Iterable<string>): boolean {
        return Str.isMatch(pattern, this._value);
    }

    /**
     * Get the string matching the given pattern.
     */
    matchAll(pattern: string): string[] {
        return Str.matchAll(pattern, this._value);
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
        return new Stringable(Str.numbers(this._value) as string);
    }

    /**
     * Pad both sides of the string with another.
     */
    padBoth(length: number, pad = " "): Stringable {
        return new Stringable(Str.padBoth(this._value, length, pad));
    }

    /**
     * Pad the left side of the string with another.
     */
    padLeft(length: number, pad = " "): Stringable {
        return new Stringable(Str.padLeft(this._value, length, pad));
    }

    /**
     * Pad the right side of the string with another.
     */
    padRight(length: number, pad = " "): Stringable {
        return new Stringable(Str.padRight(this._value, length, pad));
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
        const c = Array.isArray(count) ? count.length : Number(count);
        return new Stringable(Str.plural(this._value, c, prependCount));
    }

    /**
     * Pluralize the last word of an English, studly caps case string.
     */
    pluralStudly(count: number = 2): Stringable {
        const c = Array.isArray(count) ? count.length : Number(count);

        return new Stringable(Str.pluralStudly(this._value, c));
    }

    /**
     * Pluralize the last word of an English, Pascal caps case string.
     */
    pluralPascal(count: number = 2): Stringable {
        const c = Array.isArray(count) ? count.length : Number(count);

        return new Stringable(Str.pluralPascal(this._value, c));
    }

    /**
     * Find the multi-byte safe position of the first occurrence of the given substring.
     */
    position(needle: string, offset = 0): number | false {
        return Str.position(this._value, needle, offset);
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
            Str.remove(search, this._value, caseSensitive) as string,
        );
    }

    /**
     * Reverse the string.
     */
    reverse(): Stringable {
        return new Stringable(Str.reverse(this._value));
    }

    /**
     * Repeat the string.
     */
    repeat(times: number): Stringable {
        return new Stringable(Str.repeat(this._value, times));
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
            Str.replace(
                search,
                replacement,
                this._value,
                caseSensitive,
            ) as string,
        );
    }

    /**
     * Replace a given value in the string sequentially with an array.
     */
    replaceArray(
        search: string,
        replace: Record<string, string> | Iterable<string>,
    ): Stringable {
        return new Stringable(Str.replaceArray(search, replace, this._value));
    }

    /**
     * Replace the first occurrence of a given value in the string.
     */
    replaceFirst(search: string | number, replace: string): Stringable {
        return new Stringable(Str.replaceFirst(search, replace, this._value));
    }

    /**
     * Replace the first occurrence of the given value if it appears at the start of the string.
     */
    replaceStart(search: string | number, replace: string): Stringable {
        return new Stringable(Str.replaceStart(search, replace, this._value));
    }

    /**
     * Replace the last occurrence of a given value in the string.
     */
    replaceLast(search: string | number, replace: string): Stringable {
        return new Stringable(Str.replaceLast(search, replace, this._value));
    }

    /**
     * Replace the last occurrence of a given value if it appears at the end of the string.
     */
    replaceEnd(search: string | number, replace: string): Stringable {
        return new Stringable(Str.replaceEnd(search, replace, this._value));
    }

    /**
     * Replace the patterns matching the given regular expression.
     */
    replaceMatches(
        pattern: string | string[] | RegExp | RegExp[],
        replace: string | string[] | ((match: string[]) => string),
        limit = -1,
    ): Stringable {
        const out = Str.replaceMatches(pattern, replace, this._value, limit);

        return new Stringable(out as string);
    }

    /**
     * Parse input from a string to a collection, according to a format.
     * TODO
     */
    scan(format: string) {
        // return new Collection(sscanf($this->value, $format));
    }

    /**
     * Remove all "extra" blank space from the given string.
     */
    squish(): Stringable {
        return new Stringable(Str.squish(this._value));
    }

    /**
     * Begin a string with a single instance of a given value.
     */
    start(prefix: string): Stringable {
        return new Stringable(Str.start(this._value, prefix));
    }

    /**
     * Strip HTML and PHP tags from the given string.
     */
    stripTags(): Stringable {
        return new Stringable(Str.stripTags(this._value));
    }

    /**
     * Convert the given string to upper-case.
     */
    upper(): Stringable {
        return new Stringable(Str.upper(this._value));
    }

    /**
     * Convert the given string to proper case.
     */
    title(): Stringable {
        return new Stringable(Str.title(this._value));
    }

    /**
     * Convert the given string to proper case for each word.
     */
    headline(): Stringable {
        return new Stringable(Str.headline(this._value));
    }

    /**
     * Convert the given string to APA-style title case.
     */
    apa(): Stringable {
        return new Stringable(Str.apa(this._value));
    }

    /**
     * Transliterate a string to its closest ASCII representation.
     */
    transliterate(): Stringable {
        return new Stringable(Str.transliterate(this._value));
    }

    /**
     * Get the singular form of an English word.
     */
    singular(): Stringable {
        return new Stringable(Str.singular(this._value));
    }

    /**
     * Generate a URL friendly "slug" from a given string.
     */
    slug(
        separator = "-",
        dictionary: Record<string, string> = { "@": "at" },
    ): Stringable {
        return new Stringable(Str.slug(this._value, separator, dictionary));
    }

    /**
     * Convert a string to snake case.
     */
    snake(delimiter = "_"): Stringable {
        return new Stringable(Str.snake(this._value, delimiter));
    }

    /**
     * Determine if a given string starts with a given substring.
     */
    startsWith(
        needles: string | number | null | Iterable<string | number | null>,
    ): boolean {
        return Str.startsWith(this._value, needles as any);
    }

    /**
     * Determine if a given string doesn't start with a given substring.
     */
    doesntStartWith(
        needles: string | number | null | Iterable<string | number | null>,
    ): boolean {
        return Str.doesntStartWith(this._value, needles as any);
    }

    /**
     * Convert a value to studly caps case.
     */
    studly(): Stringable {
        return new Stringable(Str.studly(this._value));
    }

    /**
     * Convert the string to Pascal case.
     */
    pascal(): Stringable {
        return new Stringable(Str.pascal(this._value));
    }

    /**
     * Returns the portion of the string specified by the start and length parameters.
     */
    substr(start: number, length: number | null = null): Stringable {
        return new Stringable(Str.substr(this._value, start, length));
    }

    /**
     * Returns the number of substring occurrences.
     */
    substrCount(
        needle: string,
        offset = 0,
        length: number | null = null,
    ): number {
        return Str.substrCount(this._value, needle, offset, length);
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
            Str.substrReplace(this._value, replace, offset, length) as string,
        );
    }

    /**
     * Swap multiple keywords in a string with other keywords.
     */
    swap(map: Record<string, string>): Stringable {
        return new Stringable(Str.swap(map, this._value));
    }

    /**
     * Take the first or last {$limit} characters.
     */
    take(limit: number): Stringable {
        return new Stringable(Str.take(this._value, limit));
    }

    /**
     * Trim the string of the given characters.
     */
    trim(charlist: string | null = null): Stringable {
        return new Stringable(Str.trim(this._value, charlist));
    }

    /**
     * Left trim the string of the given characters.
     */
    ltrim(charlist: string | null = null): Stringable {
        return new Stringable(Str.ltrim(this._value, charlist));
    }

    /**
     * Right trim the string of the given characters.
     */
    rtrim(charlist: string | null = null): Stringable {
        return new Stringable(Str.rtrim(this._value, charlist));
    }

    /**
     * Make a string's first character lowercase.
     */
    lcfirst(): Stringable {
        return new Stringable(Str.lcfirst(this._value));
    }

    /**
     * Make a string's first character uppercase.
     */
    ucfirst(): Stringable {
        return new Stringable(Str.ucfirst(this._value));
    }

    /**
     * Split a string by uppercase characters.
     * TODO - return type should be a collection
     */
    ucsplit(): string[] {
        return Str.ucsplit(this._value);
    }

    /**
     * Uppercase the first character of each word in a string.
     */
    ucwords(): Stringable {
        return new Stringable(Str.ucwords(this._value));
    }

    /**
     * Apply the callback if the given "value" is (or resolves to) truthy.
     */
    when<T extends ConditionableValue>(
        value: T,
        callback: ConditionableClosure = null,
        defaultCallback: ConditionableClosure = null,
    ): Stringable {
        const resolvedValue = isFunction(value)
            ? (value as (instance: this) => string)(this)
            : (value as string);

        if (resolvedValue) {
            return (callback?.(this, resolvedValue) ?? this) as Stringable;
        } else if (defaultCallback) {
            return (defaultCallback(this, resolvedValue) ?? this) as Stringable;
        }

        return this;
    }

    /**
     * Apply the callback if the given "value" is (or resolves to) falsy.
     */
    unless<T extends ConditionableValue>(
        value: T,
        callback: ConditionableClosure = null,
        defaultCallback: ConditionableClosure = null,
    ): Stringable {
        const resolvedValue = isFunction(value)
            ? value(this)
            : (value as string);

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
    words(words: number = 100, end: string = "..."): Stringable {
        return new Stringable(Str.words(this._value, words, end));
    }

    /**
     * Get the number of words a string contains.
     */
    wordCount(characters: string | null = null): number {
        return Str.wordCount(this._value, characters);
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
            Str.wordWrap(this._value, characters, breakStr, cutLongWords),
        );
    }

    /**
     * Wrap the string with the given strings.
     */
    wrap(before: string, after: string | null = null): Stringable {
        return new Stringable(Str.wrap(this._value, before, after));
    }

    /**
     * Unwrap the string with the given strings.
     */
    unwrap(before: string, after: string | null = null): Stringable {
        return new Stringable(Str.unwrap(this._value, before, after));
    }

    /**
     * Convert the string to Base64 encoding.
     */
    toBase64(): Stringable {
        return new Stringable(Str.toBase64(this._value));
    }

    /**
     * Decode the Base64 encoded string.
     */
    fromBase64(strict = false): Stringable | false {
        const decoded = Str.fromBase64(this._value, strict);
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
        const v = Str.lower(Str.trim(this._value));

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
