import type {
    ChoiceNumber,
    LangLines,
    LocaleLines,
    Replacements,
    TranslationKey,
    TranslationResult,
} from "@tolki/types";

import type { Translator } from "./translator";

export type {
    ChoiceNumber,
    LangCountable as Countable,
    LangGroup,
    LangInputValue,
    LangLines,
    LangOptions,
    LangValue,
    LocaleLines,
    LocaleLinesLoader,
    LocaleModule,
    LocalesResolver,
    MissingKeyHandler,
    Replacements,
    ReplacementValue,
    StringableHandlers,
    StringableType,
    TagCallback,
    TranslationArray,
    TranslationKey,
    TranslationResult,
    TranslationValue,
} from "@tolki/types";

/** The `__`, `trans` and `transChoice` helpers, bound to one translator. */
export interface TranslationHelpers<TLines extends LangLines = LangLines> {
    /**
     * Translate the given message.
     *
     * @param key - The key to look up; null answers null
     * @returns The null, or the translation
     */
    __(key?: null): null;
    __<TKey extends TranslationKey<TLines> | (string & {})>(
        key: TKey,
        replace?: Replacements,
        locale?: string | null,
    ): TranslationResult<TLines, TKey>;
    __<TKey extends TranslationKey<TLines> | (string & {})>(
        key?: TKey | null,
        replace?: Replacements,
        locale?: string | null,
    ): TranslationResult<TLines, TKey> | null;

    /**
     * Translate the given message.
     *
     * @param key - The key to look up; none answers the translator
     * @returns The translator, or the translation
     */
    trans(key?: null): Translator<TLines>;
    trans<TKey extends TranslationKey<TLines> | (string & {})>(
        key: TKey,
        replace?: Replacements,
        locale?: string | null,
    ): TranslationResult<TLines, TKey>;
    trans<TKey extends TranslationKey<TLines> | (string & {})>(
        key?: TKey | null,
        replace?: Replacements,
        locale?: string | null,
    ): Translator<TLines> | TranslationResult<TLines, TKey>;

    /**
     * Translates the given message based on a count.
     *
     * @param key - The key to look up
     * @param number - The number to choose a form for; a countable is counted
     * @returns The chosen form
     */
    transChoice(
        key: string,
        number: ChoiceNumber,
        replace?: Replacements,
        locale?: string | null,
    ): string;
}

/** The reads of a `Lang`, which a framework adapter wraps to track what a view depends on. */
export interface LangReader<
    TLines extends LangLines = LangLines,
> extends TranslationHelpers<TLines> {
    /**
     * Determine if a translation exists.
     *
     * @param key - The key to look up
     * @param locale - The locale to read, the current locale when empty
     * @param fallback - Whether to read the fallback locale too
     * @returns Whether a line exists
     */
    has(key: string, locale?: string | null, fallback?: boolean): boolean;

    /**
     * Determine if a translation exists for a given locale.
     *
     * @param key - The key to look up
     * @param locale - The locale to read, the current locale when empty
     * @returns Whether the locale has a line for the key, ignoring the fallback locale
     */
    hasForLocale(key: string, locale?: string | null): boolean;

    /**
     * Get the current locale.
     *
     * @returns The current locale
     */
    getLocale(): string;

    /**
     * Get the fallback locale.
     *
     * @returns The fallback locale, or null when none is set
     */
    getFallback(): string | null;

    /**
     * Determine if a locale is the current locale.
     *
     * @param locale - The locale to compare
     * @returns Whether the locale is the current locale
     */
    isLocale(locale: string): boolean;

    /**
     * Determine if a locale's lines are loaded.
     *
     * @param locale - The locale to check, the current locale when empty
     * @returns Whether the locale's lines are loaded
     */
    isLoaded(locale?: string): boolean;
}

/** A translator that loads and switches locales, and tells subscribers when its answers change. */
export interface Lang<
    TLines extends LangLines = LangLines,
> extends LangReader<TLines> {
    /** The translator behind the reads. */
    readonly translator: Translator<TLines>;

    /** Settles once the starting locale and fallback are loaded. */
    readonly ready: Promise<void>;

    /**
     * Load a locale, then make it the current locale.
     *
     * @param locale - The locale to switch to
     * @returns A promise that settles once the switch happened or failed
     */
    setLocale(locale: string): Promise<void>;

    /**
     * Load a locale, then make it the fallback locale.
     *
     * @param fallback - The fallback locale, or null for none
     * @returns A promise that settles once the fallback changed or failed
     */
    setFallback(fallback: string | null): Promise<void>;

    /**
     * Load a locale without switching to it.
     *
     * @param locale - The locale to load
     * @returns A promise that settles once the lines are loaded or failed
     */
    load(locale: string): Promise<void>;

    /**
     * Call a listener whenever the answers change.
     *
     * @param listener - Called after every change
     * @returns A function that stops the calls
     */
    subscribe(listener: () => void): () => void;

    /**
     * Count the changes so far.
     *
     * @returns A number that grows with every change
     */
    getVersion(): number;
}

/** Apps augment this to name their lines: `interface LangRegister { lines: typeof en }`. */
 
export interface LangRegister {}

/** The lines a register names, or any lines when it names none. */
export type LinesFromRegister<TRegister> = TRegister extends {
    readonly lines: infer TLocale extends LocaleLines;
}
    ? Readonly<Record<string, TLocale>>
    : LangLines;

/** The lines the app registered. */
export type RegisteredLines = LinesFromRegister<LangRegister>;
