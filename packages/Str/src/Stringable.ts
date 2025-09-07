import { Str } from "./Str.js";

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

    before(search: string | number): Stringable {
        return new Stringable(Str.before(this._value, search));
    }

    beforeLast(search: string | number): Stringable {
        return new Stringable(Str.beforeLast(this._value, search));
    }

    between(from: string | number, to: string | number): Stringable {
        return new Stringable(Str.between(this._value, from, to));
    }

    betweenFirst(from: string | number, to: string | number): Stringable {
        return new Stringable(Str.betweenFirst(this._value, from, to));
    }

    camel(): Stringable {
        return new Stringable(Str.camel(this._value));
    }

    charAt(index: number): string | false {
        return Str.charAt(this._value, index);
    }

    chopStart(needle: string | string[]): Stringable {
        return new Stringable(Str.chopStart(this._value, needle));
    }

    chopEnd(needle: string | string[]): Stringable {
        return new Stringable(Str.chopEnd(this._value, needle));
    }

    contains(needles: string | Iterable<string>, ignoreCase = false): boolean {
        return Str.contains(this._value, needles, ignoreCase);
    }

    containsAll(needles: Iterable<string>, ignoreCase = false): boolean {
        return Str.containsAll(this._value, needles, ignoreCase);
    }

    convertCase(mode: number): Stringable {
        // Mode follows CaseTypes enum from ConvertCase
        return new Stringable(Str.convertCase(this._value, mode as any));
    }

    deduplicate(character: string | string[] = " "): Stringable {
        return new Stringable(Str.deduplicate(this._value, character));
    }

    endsWith(needles: string | number | Iterable<string>): boolean {
        return Str.endsWith(this._value, needles as any);
    }

    doesntEndWith(needles: string | number | Iterable<string>): boolean {
        return Str.doesntEndWith(this._value, needles as any);
    }

    exactly(value: Stringable | string): boolean {
        const other =
            value instanceof Stringable ? value.toString() : String(value);
        return this._value === other;
    }

    excerpt(phrase = "", options: Record<string, any> = {}): string | null {
        return Str.excerpt(this._value, phrase, options);
    }

    finish(cap: string): Stringable {
        return new Stringable(Str.finish(this._value, cap));
    }

    is(pattern: string | Iterable<string>, ignoreCase = false): boolean {
        return Str.is(pattern, this._value, ignoreCase);
    }

    isAscii(): boolean {
        return Str.isAscii(this._value);
    }

    isJson(): boolean {
        return Str.isJson(this._value);
    }

    isUrl(protocols: string[] = []): boolean {
        return Str.isUrl(this._value, protocols);
    }

    isUuid(version: number | "nil" | "max" | null = null): boolean {
        return Str.isUuid(this._value, version);
    }

    isUlid(): boolean {
        return Str.isUlid(this._value);
    }

    isEmpty(): boolean {
        return this._value === "";
    }

    isNotEmpty(): boolean {
        return !this.isEmpty();
    }

    kebab(): Stringable {
        return new Stringable(Str.kebab(this._value));
    }

    length(): number {
        return Str.length(this._value);
    }

    limit(limit = 100, end = "...", preserveWords = false): Stringable {
        return new Stringable(
            Str.limit(this._value, limit, end, preserveWords),
        );
    }

    lower(): Stringable {
        return new Stringable(Str.lower(this._value));
    }

    markdown(
        options: any = { gfm: true, anchors: false },
        extensions: any[] = [],
    ): Stringable {
        return new Stringable(Str.markdown(this._value, options, extensions));
    }

    inlineMarkdown(
        options: any = { gfm: true },
        extensions: any[] = [],
    ): Stringable {
        return new Stringable(
            Str.inlineMarkdown(this._value, options, extensions),
        );
    }

    mask(
        character: string,
        index: number,
        length: number | null = null,
    ): Stringable {
        return new Stringable(Str.mask(this._value, character, index, length));
    }

    match(pattern: string): Stringable {
        return new Stringable(Str.match(pattern, this._value));
    }

    isMatch(pattern: string | Iterable<string>): boolean {
        return Str.isMatch(pattern as any, this._value);
    }

    matchAll(pattern: string): string[] {
        return Str.matchAll(pattern, this._value);
    }

    test(pattern: string): boolean {
        return this.isMatch(pattern);
    }

    numbers(): Stringable {
        return new Stringable(Str.numbers(this._value) as string);
    }

    padBoth(length: number, pad = " "): Stringable {
        return new Stringable(Str.padBoth(this._value, length, pad));
    }

    padLeft(length: number, pad = " "): Stringable {
        return new Stringable(Str.padLeft(this._value, length, pad));
    }

    padRight(length: number, pad = " "): Stringable {
        return new Stringable(Str.padRight(this._value, length, pad));
    }

    pipe<T = Stringable>(callback: (s: Stringable) => T): Stringable {
        const res = callback(this) as any;
        return res instanceof Stringable ? res : new Stringable(String(res));
    }

    plural(count: number | any[] = 2, prependCount = false): Stringable {
        const c = Array.isArray(count) ? count.length : Number(count);
        return new Stringable(Str.plural(this._value, c, prependCount));
    }

    pluralStudly(count: number | any[] = 2): Stringable {
        const c = Array.isArray(count) ? count.length : Number(count);
        return new Stringable(Str.pluralStudly(this._value, c));
    }

    pluralPascal(count: number | any[] = 2): Stringable {
        const c = Array.isArray(count) ? count.length : Number(count);
        return new Stringable(Str.pluralPascal(this._value, c));
    }

    position(needle: string, offset = 0): number | false {
        return Str.position(this._value, needle, offset);
    }

    prepend(...values: Array<string | number>): Stringable {
        return new Stringable(values.map(String).join("") + this._value);
    }

    remove(
        search: string | Iterable<string>,
        caseSensitive = true,
    ): Stringable {
        return new Stringable(
            Str.remove(search as any, this._value, caseSensitive) as string,
        );
    }

    reverse(): Stringable {
        return new Stringable(Str.reverse(this._value));
    }

    repeat(times: number): Stringable {
        return new Stringable(Str.repeat(this._value, times));
    }

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

    replaceArray(
        search: string,
        replace: Record<string, string> | Iterable<string>,
    ): Stringable {
        return new Stringable(Str.replaceArray(search, replace, this._value));
    }

    replaceFirst(search: string | number, replace: string): Stringable {
        return new Stringable(Str.replaceFirst(search, replace, this._value));
    }

    replaceStart(search: string | number, replace: string): Stringable {
        return new Stringable(Str.replaceStart(search, replace, this._value));
    }

    replaceLast(search: string | number, replace: string): Stringable {
        return new Stringable(Str.replaceLast(search, replace, this._value));
    }

    replaceEnd(search: string | number, replace: string): Stringable {
        return new Stringable(Str.replaceEnd(search, replace, this._value));
    }

    replaceMatches(
        pattern: string | string[] | RegExp | RegExp[],
        replace: string | string[] | ((match: string[]) => string),
        limit = -1,
    ): Stringable {
        const out = Str.replaceMatches(
            pattern as any,
            replace as any,
            this._value,
            limit,
        );
        return new Stringable(out as string);
    }

    squish(): Stringable {
        return new Stringable(Str.squish(this._value));
    }

    start(prefix: string): Stringable {
        return new Stringable(Str.start(this._value, prefix));
    }

    stripTags(): Stringable {
        return new Stringable(Str.stripTags(this._value));
    }

    upper(): Stringable {
        return new Stringable(Str.upper(this._value));
    }

    title(): Stringable {
        return new Stringable(Str.title(this._value));
    }

    headline(): Stringable {
        return new Stringable(Str.headline(this._value));
    }

    apa(): Stringable {
        return new Stringable(Str.apa(this._value));
    }

    transliterate(): Stringable {
        return new Stringable(Str.transliterate(this._value));
    }

    singular(): Stringable {
        return new Stringable(Str.singular(this._value));
    }

    slug(
        separator = "-",
        dictionary: Record<string, string> = { "@": "at" },
    ): Stringable {
        return new Stringable(Str.slug(this._value, separator, dictionary));
    }

    snake(delimiter = "_"): Stringable {
        return new Stringable(Str.snake(this._value, delimiter));
    }

    startsWith(
        needles: string | number | null | Iterable<string | number | null>,
    ): boolean {
        return Str.startsWith(this._value, needles as any);
    }

    doesntStartWith(
        needles: string | number | null | Iterable<string | number | null>,
    ): boolean {
        return Str.doesntStartWith(this._value, needles as any);
    }

    studly(): Stringable {
        return new Stringable(Str.studly(this._value));
    }

    pascal(): Stringable {
        return new Stringable(Str.pascal(this._value));
    }

    substr(start: number, length: number | null = null): Stringable {
        return new Stringable(Str.substr(this._value, start, length));
    }

    substrCount(
        needle: string,
        offset = 0,
        length: number | null = null,
    ): number {
        return Str.substrCount(this._value, needle, offset, length);
    }

    substrReplace(
        replace: string,
        offset: number | number[] = 0,
        length: number | number[] | null = null,
    ): Stringable {
        return new Stringable(
            Str.substrReplace(this._value, replace, offset, length) as string,
        );
    }

    swap(map: Record<string, string>): Stringable {
        return new Stringable(Str.swap(map, this._value));
    }

    take(limit: number): Stringable {
        return new Stringable(Str.take(this._value, limit));
    }

    trim(charlist: string | null = null): Stringable {
        return new Stringable(Str.trim(this._value, charlist));
    }

    ltrim(charlist: string | null = null): Stringable {
        return new Stringable(Str.ltrim(this._value, charlist));
    }

    rtrim(charlist: string | null = null): Stringable {
        return new Stringable(Str.rtrim(this._value, charlist));
    }

    lcfirst(): Stringable {
        return new Stringable(Str.lcfirst(this._value));
    }

    ucfirst(): Stringable {
        return new Stringable(Str.ucfirst(this._value));
    }

    ucsplit(): string[] {
        return Str.ucsplit(this._value);
    }

    ucwords(): Stringable {
        return new Stringable(Str.ucwords(this._value));
    }

    wordCount(characters: string | null = null): number {
        return Str.wordCount(this._value, characters);
    }

    wordWrap(
        characters = 75,
        breakStr = "\n",
        cutLongWords = false,
    ): Stringable {
        return new Stringable(
            Str.wordWrap(this._value, characters, breakStr, cutLongWords),
        );
    }

    wrap(before: string, after: string | null = null): Stringable {
        return new Stringable(Str.wrap(this._value, before, after));
    }

    unwrap(before: string, after: string | null = null): Stringable {
        return new Stringable(Str.unwrap(this._value, before, after));
    }

    toBase64(): Stringable {
        return new Stringable(Str.toBase64(this._value));
    }

    fromBase64(strict = false): Stringable | false {
        const decoded = Str.fromBase64(this._value, strict);
        return decoded === false ? false : new Stringable(decoded);
    }

    toString(): string {
        return this.value();
    }

    value(): string {
        return String(this._value);
    }

    // Simple type converters
    toInteger(base = 10): number {
        const b = Number(base) || 10;
        return parseInt(this._value, b);
    }

    toFloat(): number {
        return parseFloat(this._value);
    }

    toBoolean(): boolean {
        // Align with common truthy strings
        const v = this._value.trim().toLowerCase();
        return v === "1" || v === "true" || v === "on" || v === "yes";
    }

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