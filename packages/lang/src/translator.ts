import { dataGet, dataSet } from "@tolki/data";
import { contains } from "@tolki/str";
import {
    defineKey,
    InvalidArgumentException,
    isArray,
    isFunction,
    isMap,
    isNull,
    isNumber,
    isPhpFalsy,
    isPlainObject,
    isSet,
    isString,
    isUndefined,
    phpTypeName,
} from "@tolki/utils";

import { choose } from "./message-selector";
import { makeReplacements } from "./replacements";
import type {
    ChoiceNumber,
    LangGroup,
    LangLines,
    LangValue,
    LocaleLines,
    LocalesResolver,
    MissingKeyHandler,
    Replacements,
    ReplacementValue,
    StringableType,
    TranslationValue,
} from "./types";

/**
 * Determine if a value is a group: a PHP lang file's array.
 *
 * @param value - The value to check
 * @returns Whether the value is an array or a plain object
 */
function isGroup(value: unknown): value is LangGroup {
    return isArray(value) || isPlainObject(value);
}

/**
 * Determine if a locale's top-level value is a JSON line rather than a group.
 *
 * @param value - The value under one of a locale's keys
 * @returns Whether the value is a line of the locale's JSON file
 */
function isJsonLine(value: unknown): value is string {
    return !isUndefined(value) && !isNull(value) && !isGroup(value);
}

/**
 * Collect a locale's JSON lines into a new group.
 *
 * @param localeLines - The locale's lines, if any
 * @returns A new object holding only the locale's JSON lines
 */
function jsonLines(
    localeLines: LocaleLines | undefined,
): Record<string, string> {
    const lines: Record<string, string> = {};

    for (const [key, value] of Object.entries({ ...localeLines })) {
        if (isJsonLine(value)) {
            defineKey(lines, key, value);
        }
    }

    return lines;
}

/**
 * Read a record's own key, never one it inherits.
 *
 * @param record - The record to read, if any
 * @param key - The key to read
 * @returns The value under the key, or undefined
 */
function ownValue<TValue>(
    record: Readonly<Record<string, TValue>> | undefined,
    key: string,
): TValue | undefined {
    return !isUndefined(record) && Object.hasOwn(record, key)
        ? record[key]
        : undefined;
}

/**
 * Name a translation value's type as PHP's gettype() does.
 *
 * @param value - The translation value
 * @returns "array" for a group, otherwise PHP's name for the type
 */
function gettype(value: unknown): string {
    return isGroup(value) ? "array" : phpTypeName(value);
}

/**
 * Count a choice number the way PHP's count() does for an array or a Countable.
 *
 * @param number - A number, or a value to count
 * @returns The number itself, or the count of the value
 */
function countOf(number: ChoiceNumber): number {
    if (isNumber(number)) {
        return number;
    }

    if (isArray(number)) {
        return number.length;
    }

    if (isMap(number) || isSet(number)) {
        return number.size;
    }

    const counter: unknown = Reflect.get(number, "count");

    if (isFunction(counter)) {
        return Number(Reflect.apply(counter, number, []));
    }

    return Object.keys(number).length;
}

/**
 * Copy a group with every leaf passed through a callback, as array_walk_recursive() walks it.
 *
 * @param group - The group to walk
 * @param callback - Turns a leaf into its new value
 * @returns A new group of the same shape
 */
function walkLeaves(
    group: LangGroup,
    callback: (leaf: string) => string,
): LangGroup {
    const walk = (value: LangValue): LangValue => {
        return isGroup(value) ? walkLeaves(value, callback) : callback(value);
    };

    if (isArray(group)) {
        return group.map(walk);
    }

    const walked: Record<string, LangValue> = {};

    for (const [key, value] of Object.entries(group)) {
        defineKey(walked, key, walk(value));
    }

    return walked;
}

/**
 * Parse a key without a namespace into its group and item.
 *
 * @param key - The key
 * @returns The group, and the item or null when the key names a whole group
 */
function parseBasicSegments(key: string): [group: string, item: string | null] {
    const dot = key.indexOf(".");

    return dot === -1 ? [key, null] : [key.slice(0, dot), key.slice(dot + 1)];
}

/**
 * Translate keys into lines, with Laravel's Translator rules for groups, JSON lines, locales and placeholders.
 */
export class Translator<TLines extends LangLines = LangLines> {
    /**
     * The lines, one object per locale.
     */
    #lines: LangLines;

    /**
     * The default locale being used by the translator.
     */
    #locale = "";

    /**
     * The fallback locale used by the translator.
     */
    #fallback: string | null = null;

    /**
     * The callable that should be invoked to determine applicable locales.
     */
    #determineLocalesUsing: LocalesResolver | null = null;

    /**
     * The custom rendering callbacks for stringable objects.
     */
    #stringableHandlers = new Map<StringableType, (value: never) => unknown>();

    /**
     * The callback that is responsible for handling missing translation keys.
     */
    #missingTranslationKeyCallback: MissingKeyHandler | null = null;

    /**
     * Indicates whether missing translation keys should be handled.
     */
    #handleMissingTranslationKeys = true;

    /**
     * Create a new translator instance.
     *
     * @param lines - The lines, one object per locale
     * @param locale - The default locale
     * @throws InvalidArgumentException when the locale holds a path character
     */
    constructor(lines: TLines, locale: string) {
        this.#lines = lines;

        this.setLocale(locale);
    }

    /**
     * Determine if a translation exists for a given locale.
     *
     * @param key - The key to look up
     * @param locale - The locale to read, the default locale when empty
     * @returns Whether the locale has a line for the key, ignoring the fallback locale
     *
     * @example
     *
     * new Translator({ en: { g: { a: "A" } } }, "en").hasForLocale("g.a"); // true
     */
    hasForLocale(key: string, locale: string | null = null): boolean {
        return this.has(key, locale, false);
    }

    /**
     * Determine if a translation exists.
     *
     * @param key - The key to look up
     * @param locale - The locale to read, the default locale when empty
     * @param fallback - Whether to read the fallback locale too
     * @returns Whether a line exists; a group line equal to its key does not count
     *
     * @example
     *
     * new Translator({ en: { g: { a: "A" } } }, "en").has("g.b"); // false
     */
    has(key: string, locale: string | null = null, fallback = true): boolean {
        const resolved =
            isString(locale) && !isPhpFalsy(locale) ? locale : this.#locale;

        const handleMissingTranslationKeys = this.#handleMissingTranslationKeys;

        this.#handleMissingTranslationKeys = false;

        const line = this.get(key, {}, resolved, fallback);

        this.#handleMissingTranslationKeys = handleMissingTranslationKeys;

        if (!isNull(this.#jsonLine(resolved, key))) {
            return true;
        }

        return line !== key;
    }

    /**
     * Get the translation for the given key.
     *
     * @param key - A JSON line's key, or a `group.item` key (`ns::group.item` for a package)
     * @param replace - The placeholder values
     * @param locale - The locale to read, the default locale when empty
     * @param fallback - Whether to read the fallback locale too
     * @returns The line, a copy of the group, or the key itself when nothing matches
     * @throws TypeError when a replacement is a value PHP cannot cast to a string
     *
     * @example
     *
     * const translator = new Translator({ en: { messages: { welcome: "Welcome, :name" } } }, "en");
     *
     * translator.get("messages.welcome", { name: "ann" }); // "Welcome, ann"
     * translator.get("messages.missing"); // "messages.missing"
     */
    get(
        key: string,
        replace: Replacements = {},
        locale: string | null = null,
        fallback = true,
    ): TranslationValue {
        const resolved =
            isString(locale) && !isPhpFalsy(locale) ? locale : this.#locale;

        const line = this.#jsonLine(resolved, key);

        if (!isNull(line)) {
            return this.#makeReplacements(
                isPhpFalsy(line) ? key : line,
                replace,
            );
        }

        const [namespace, group, item] = this.parseKey(key);

        const locales = fallback ? this.#localeArray(resolved) : [resolved];

        for (const languageLineLocale of locales) {
            const found = this.#getLine(
                namespace,
                group,
                languageLineLocale,
                item,
                replace,
            );

            if (!isNull(found)) {
                return found;
            }
        }

        return this.#makeReplacements(
            this.#handleMissingTranslationKey(key, replace, resolved, fallback),
            replace,
        );
    }

    /**
     * Get the specified string translation value.
     *
     * @param key - The key to look up
     * @param replace - The placeholder values
     * @param locale - The locale to read, the default locale when empty
     * @param fallback - Whether to read the fallback locale too
     * @returns The line, or the key itself when nothing matches
     * @throws InvalidArgumentException when the key names a group
     *
     * @example
     *
     * new Translator({ en: { g: { a: "A" } } }, "en").string("g.a"); // "A"
     */
    string(
        key: string,
        replace: Replacements = {},
        locale: string | null = null,
        fallback = true,
    ): string {
        const value = this.get(key, replace, locale, fallback);

        if (!isString(value)) {
            throw new InvalidArgumentException(
                `Translation value for key [${key}] must be a string, ${gettype(value)} given.`,
            );
        }

        return value;
    }

    /**
     * Get the specified array translation value.
     *
     * @param key - The key to look up
     * @param replace - The placeholder values
     * @param locale - The locale to read, the default locale when empty
     * @param fallback - Whether to read the fallback locale too
     * @returns A copy of the group
     * @throws InvalidArgumentException when the key names a line or nothing
     *
     * @example
     *
     * new Translator({ en: { g: { list: ["a", "b"] } } }, "en").array("g.list"); // ["a", "b"]
     */
    array(
        key: string,
        replace: Replacements = {},
        locale: string | null = null,
        fallback = true,
    ): LangGroup {
        const value = this.get(key, replace, locale, fallback);

        if (!isGroup(value)) {
            throw new InvalidArgumentException(
                `Translation value for key [${key}] must be an array, ${gettype(value)} given.`,
            );
        }

        return value;
    }

    /**
     * Get a translation according to an integer value.
     *
     * @param key - The key to look up
     * @param number - The number to choose a form for; a countable is counted
     * @param replace - The placeholder values; `count` is added unless it holds a value
     * @param locale - The locale to read, the default locale when empty
     * @returns The chosen form with its placeholders replaced
     * @throws InvalidArgumentException when the key names a group
     *
     * @example
     *
     * new Translator({ en: { apples: "one|:count apples" } }, "en").choice("apples", 3); // "3 apples"
     */
    choice(
        key: string,
        number: ChoiceNumber,
        replace: Replacements = {},
        locale: string | null = null,
    ): string {
        const resolved = this.#localeForChoice(key, locale);
        const line = this.string(key, [], resolved);

        const count = countOf(number);

        const withCount: Record<string, ReplacementValue> = { ...replace };

        if (isNull(withCount["count"]) || isUndefined(withCount["count"])) {
            withCount["count"] = count;
        }

        return this.#makeReplacements(choose(line, count, resolved), withCount);
    }

    /**
     * Add translation lines to the given locale.
     *
     * @param lines - The lines keyed `group.item`; group `*` adds JSON lines
     * @param locale - The locale to add them to
     * @param namespace - The package namespace, `*` for none
     *
     * @example
     *
     * translator.addLines({ "messages.welcome": "Welcome", "*.Hello": "Hola" }, "es");
     */
    addLines(
        lines: Readonly<Record<string, LangValue>>,
        locale: string,
        namespace = "*",
    ): void {
        const localeLines: LocaleLines = { ...ownValue(this.#lines, locale) };

        for (const [key, value] of Object.entries(lines)) {
            const dot = key.indexOf(".");
            const group = dot === -1 ? key : key.slice(0, dot);
            const item = dot === -1 ? "" : key.slice(dot + 1);

            // A JSON line's key may hold dots of its own, which Laravel would split into nested keys.
            if (namespace === "*" && group === "*") {
                defineKey(localeLines, item, value);

                continue;
            }

            const groupKey =
                namespace === "*" ? group : `${namespace}::${group}`;
            const existing = ownValue(localeLines, groupKey);

            // dataSet types its copy as a loose record; writing a line into a group still leaves a group.
            defineKey<LangValue>(
                localeLines,
                groupKey,
                dataSet(
                    isGroup(existing) ? existing : {},
                    item,
                    value,
                ) as LangGroup,
            );
        }

        const allLines: LangLines = { ...this.#lines };

        defineKey(allLines, locale, localeLines);

        this.#lines = allLines;
    }

    /**
     * Register a callback that is responsible for handling missing translation keys.
     *
     * @param callback - Answers the line for a missing key, or null to stop handling
     * @returns The translator
     *
     * @example
     *
     * translator.handleMissingKeysUsing((key) => `[missing: ${key}]`);
     */
    handleMissingKeysUsing(callback: MissingKeyHandler | null): this {
        this.#missingTranslationKeyCallback = callback;

        return this;
    }

    /**
     * Parse a key into namespace, group, and item.
     *
     * @param key - The key to parse
     * @returns The namespace (`*` for none), the group, and the item or null for a whole group
     *
     * @example
     *
     * translator.parseKey("courier::mail.sent"); // ["courier", "mail", "sent"]
     * translator.parseKey("messages"); // ["*", "messages", null]
     */
    parseKey(
        key: string,
    ): [namespace: string, group: string, item: string | null] {
        const separator = key.indexOf("::");

        if (separator === -1) {
            return ["*", ...parseBasicSegments(key)];
        }

        const rest = key.slice(separator + 2);
        const next = rest.indexOf("::");

        // explode() splits at every separator, but only the first two pieces are read.
        return [
            key.slice(0, separator),
            ...parseBasicSegments(next === -1 ? rest : rest.slice(0, next)),
        ];
    }

    /**
     * Specify a callback that should be invoked to determine the applicable locale array.
     *
     * @param callback - Receives the locales a lookup would read and answers the ones it reads
     *
     * @example
     *
     * translator.determineLocalesUsing((locales) => [...locales, "en"]);
     */
    determineLocalesUsing(callback: LocalesResolver): void {
        this.#determineLocalesUsing = callback;
    }

    /**
     * Get the default locale being used.
     *
     * @returns The default locale
     */
    locale(): string {
        return this.getLocale();
    }

    /**
     * Get the default locale being used.
     *
     * @returns The default locale
     */
    getLocale(): string {
        return this.#locale;
    }

    /**
     * Set the default locale.
     *
     * @param locale - The locale
     * @throws InvalidArgumentException when the locale holds `/`, `\`, `..` or a NUL byte
     */
    setLocale(locale: string): void {
        if (contains(locale, ["/", "\\", "..", "\0"])) {
            throw new InvalidArgumentException(
                "Invalid characters present in locale.",
            );
        }

        this.#locale = locale;
    }

    /**
     * Get the fallback locale being used.
     *
     * @returns The fallback locale, or null when none is set
     */
    getFallback(): string | null {
        return this.#fallback;
    }

    /**
     * Set the fallback locale being used.
     *
     * @param fallback - The fallback locale, or null for none
     */
    setFallback(fallback: string | null): void {
        this.#fallback = fallback;
    }

    /**
     * Set the loaded translation lines.
     *
     * @param lines - The lines, one object per locale
     */
    setLoaded(lines: TLines): void {
        this.#lines = lines;
    }

    /**
     * Add a handler to be executed in order to format a given class to a string during translation replacements.
     *
     * @param type - The class whose exact instances the handler formats
     * @param handler - Turns an instance into its replacement
     *
     * @example
     *
     * translator.stringable(Money, (money) => money.format());
     */
    stringable<TValue>(
        type: StringableType<TValue>,
        handler: (value: TValue) => unknown,
    ): void {
        this.#stringableHandlers.set(type, handler);
    }

    /**
     * Get the JSON line of a locale.
     *
     * @param locale - The locale
     * @param key - The line's key, read whole
     * @returns The line, or null when the locale has none for the key
     */
    #jsonLine(locale: string, key: string): string | null {
        const line = ownValue(ownValue(this.#lines, locale), key);

        return isJsonLine(line) ? line : null;
    }

    /**
     * Retrieve a language line out the loaded array.
     *
     * @param namespace - The namespace, `*` for none
     * @param group - The group
     * @param locale - The locale
     * @param item - The item, or null for the whole group
     * @param replace - The placeholder values
     * @returns The line, a copy of a non-empty group, or null
     */
    #getLine(
        namespace: string,
        group: string,
        locale: string,
        item: string | null,
        replace: Replacements,
    ): TranslationValue | null {
        const localeLines = ownValue(this.#lines, locale);

        // Laravel loads a locale's JSON file as the group `*` of the namespace `*`.
        const groupLines =
            namespace === "*" && group === "*"
                ? jsonLines(localeLines)
                : ownValue(
                      localeLines,
                      namespace === "*" ? group : `${namespace}::${group}`,
                  );

        const line: unknown = dataGet(
            isGroup(groupLines) ? groupLines : {},
            item,
        );

        if (isString(line)) {
            return this.#makeReplacements(line, replace);
        }

        if (isGroup(line) && !isPhpFalsy(line)) {
            return walkLeaves(line, (leaf) => {
                return this.#makeReplacements(leaf, replace);
            });
        }

        return null;
    }

    /**
     * Make the place-holder replacements on a line.
     *
     * @param line - The line
     * @param replace - The placeholder values
     * @returns The line with every placeholder replaced
     */
    #makeReplacements(line: string, replace: Replacements): string {
        return makeReplacements(line, replace, this.#stringableHandlers);
    }

    /**
     * Handle a missing translation key.
     *
     * @param key - The missing key
     * @param replace - The placeholder values
     * @param locale - The locale that was read
     * @param fallback - Whether the fallback locale was read too
     * @returns The handler's answer, or the key
     */
    #handleMissingTranslationKey(
        key: string,
        replace: Replacements,
        locale: string,
        fallback: boolean,
    ): string {
        const callback = this.#missingTranslationKeyCallback;

        if (!this.#handleMissingTranslationKeys || isNull(callback)) {
            return key;
        }

        // Prevents infinite loops; PHP resets the flag without `finally`, so a callback that throws leaves it off.
        this.#handleMissingTranslationKeys = false;

        const handled = callback(key, replace, locale, fallback) ?? key;

        this.#handleMissingTranslationKeys = true;

        return handled;
    }

    /**
     * Get the proper locale for a choice operation.
     *
     * @param key - The key being chosen
     * @param locale - The requested locale, the default locale when empty
     * @returns The locale when it has the key, otherwise the fallback locale, which may be null
     */
    #localeForChoice(key: string, locale: string | null): string | null {
        const resolved =
            isString(locale) && !isPhpFalsy(locale) ? locale : this.#locale;

        return this.hasForLocale(key, resolved) ? resolved : this.#fallback;
    }

    /**
     * Get the array of locales to be checked.
     *
     * @param locale - The locale being read
     * @returns The locale and the fallback locale, as the resolver answers them, without duplicates
     */
    #localeArray(locale: string): string[] {
        const locales = [locale, this.#fallback].filter(
            (entry): entry is string => !isPhpFalsy(entry),
        );

        const resolver = this.#determineLocalesUsing;

        const determined = isNull(resolver) ? locales : resolver(locales);

        return [...new Set(determined)];
    }
}
