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
