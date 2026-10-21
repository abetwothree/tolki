import type { Translator } from "./translator";

/** A tag callback receives the text between `<key>` and `</key>`. */
export type TagCallback = (children: string) => unknown;

/** A value a placeholder can take; what PHP cannot cast to a string throws. */
export type ReplacementValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | object
    | TagCallback;

/** Placeholder values keyed by name, or a list keyed by position. */
export type Replacements =
    | Readonly<Record<string, ReplacementValue>>
    | readonly ReplacementValue[];

/** Any class, so a handler can be registered for it. */
export type StringableType<TValue = unknown> = abstract new (
    ...args: never[]
) => TValue;

/** Handlers that turn an instance of the exact class into a replacement. */
export type StringableHandlers = ReadonlyMap<
    StringableType,
    (value: never) => unknown
>;

/** A group of lines, as a PHP lang file's array holds them. */
export type LangGroup = { [key: string]: LangValue } | LangValue[];

/** A line, or a group of lines. */
export type LangValue = string | LangGroup;

/** One locale's lines: a group under its file's name (`ns::group` for a package), any other value a JSON line. */
export type LocaleLines = Record<string, LangValue>;

/** Every locale's lines, keyed by locale. */
export type LangLines = Record<string, LocaleLines>;

/** What `get()` answers: a line, or a copy of a group. */
export type TranslationValue = string | LangGroup;

/** Answers the line for a key no locale has; `null` or `undefined` keeps the key. */
export type MissingKeyHandler = (
    key: string,
    replace: Replacements,
    locale: string,
    fallback: boolean,
) => string | null | undefined;

/** Turns the locales a lookup would read into the ones it reads. */
export type LocalesResolver = (locales: string[]) => string[];

/** What PHP's `count()` accepts: an array, a `Countable`, or here a `Map`, a `Set` or an object. */
export type Countable =
    | readonly unknown[]
    | ReadonlyMap<unknown, unknown>
    | ReadonlySet<unknown>
    | { count(): number }
    | Readonly<Record<string, unknown>>;

/** A number, or a value whose count is the number. */
export type ChoiceNumber = number | Countable;

/** The `__`, `trans` and `transChoice` helpers, bound to one translator. */
export interface TranslationHelpers<TLines extends LangLines = LangLines> {
    /**
     * Translate the given message.
     *
     * @param key - The key to look up; null answers null
     * @returns The null, or the translation
     */
    __(key?: null): null;
    __(
        key: string,
        replace?: Replacements,
        locale?: string | null,
    ): TranslationValue;

    /**
     * Translate the given message.
     *
     * @param key - The key to look up; none answers the translator
     * @returns The translator, or the translation
     */
    trans(key?: null): Translator<TLines>;
    trans(
        key: string,
        replace?: Replacements,
        locale?: string | null,
    ): TranslationValue;

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
