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

/** Whether some locale's keys are typed only as `string`, so the lines name no key in particular. */
type HasUntypedLocale<TLines> = true extends {
    [TLocale in keyof TLines]: string extends keyof TLines[TLocale]
        ? true
        : false;
}[keyof TLines]
    ? true
    : false;

/** The depth left one level further down. */
type NextDepth = [never, 0, 1, 2, 3, 4, 5, 6, 7];

/** A path, when the value under it can be a `TValue`. */
type PathTo<TPath extends string, TChild, TValue> = [
    Extract<TChild, TValue>,
] extends [never]
    ? never
    : TPath;

/** The paths inside a group to a `TValue`, at most `TDepth` levels deep; a list's items go by index. */
type GroupPaths<TGroup, TValue, TDepth extends number> = TDepth extends 0
    ? never
    : TGroup extends readonly (infer TItem)[]
      ?
            | PathTo<`${number}`, TItem, TValue>
            | `${number}.${GroupPaths<TItem, TValue, NextDepth[TDepth]>}`
      : TGroup extends object
        ? {
              [TKey in keyof TGroup & (string | number)]:
                  | PathTo<`${TKey}`, TGroup[TKey], TValue>
                  | `${TKey}.${GroupPaths<TGroup[TKey], TValue, NextDepth[TDepth]>}`;
          }[keyof TGroup & (string | number)]
        : never;

/** Each locale's keys to a `TValue`: JSON lines, groups, and paths at most 4 levels below a group. */
type LocalePaths<TLines extends LangLines, TValue> = {
    [TLocale in keyof TLines]: {
        [TName in keyof TLines[TLocale] & (string | number)]:
            | PathTo<`${TName}`, TLines[TLocale][TName], TValue>
            | `${TName}.${GroupPaths<Exclude<TLines[TLocale][TName], string>, TValue, 4>}`;
    }[keyof TLines[TLocale] & (string | number)];
};

/** Every key the lines name: each locale's JSON lines and groups, and the paths at most 4 levels below a group. */
// Indexed here rather than inside LocalePaths: a key union returned through an alias is far slower to check.
export type TranslationKey<TLines extends LangLines> =
    HasUntypedLocale<TLines> extends true
        ? string
        : LocalePaths<TLines, unknown>[keyof TLines];

/** A key without a namespace split at its first dot into the group and the item, null for a whole group. */
type BasicSegments<TKey extends string> =
    TKey extends `${infer TGroup}.${infer TItem}`
        ? [TGroup, TItem]
        : [TKey, null];

/** A key split as `parseKey()` splits it: the namespace (`*` for none), the group and the item. */
type ParsedKey<TKey extends string> =
    TKey extends `${infer TNamespace}::${infer TRest}`
        ? [
              TNamespace,
              ...BasicSegments<
                  TRest extends `${infer TFirst}::${string}` ? TFirst : TRest
              >,
          ]
        : ["*", ...BasicSegments<TKey>];

/** A group's child under one path segment; a list's children go by index only. */
type ChildValue<TValue, TSegment extends string> = TValue extends string
    ? never
    : TValue extends readonly unknown[]
      ? TSegment extends `${number}`
          ? TSegment extends keyof TValue
              ? TValue[TSegment]
              : TValue[number]
          : never
      : TSegment extends keyof TValue
        ? TValue[TSegment]
        : TSegment extends `${infer TIndex extends number}`
          ? TIndex extends keyof TValue
              ? TValue[TIndex]
              : never
          : never;

/** The value at a dotted path, one segment per level. */
type PathValue<
    TValue,
    TPath extends string,
> = TPath extends `${infer THead}.${infer TRest}`
    ? PathValue<ChildValue<TValue, THead>, TRest>
    : ChildValue<TValue, TPath>;

/** A group's item, read as `Arr::get()` reads it: the whole item as one key first, then split at every dot. */
type ItemValue<TGroup, TItem extends string | null> = TGroup extends unknown
    ? TItem extends string
        ? TItem extends keyof TGroup
            ? TGroup[TItem]
            : PathValue<TGroup, TItem>
        : TGroup
    : never;

/** The values a key reaches in every locale: a JSON line, or a group's line or nested group. */
type LocaleValues<
    TLines extends LangLines,
    TKey extends string,
    TName extends string,
    TItem extends string | null,
> = {
    [TLocale in keyof TLines]:
        | (TKey extends keyof TLines[TLocale]
              ? Extract<TLines[TLocale][TKey], string>
              : never)
        | (TName extends keyof TLines[TLocale]
              ? ReachedValue<
                    ItemValue<Exclude<TLines[TLocale][TName], string>, TItem>
                >
              : never);
}[keyof TLines];

/** PHP skips an empty group, so `get()` answers the key for it. */
type ReachedValue<TValue> = TValue extends string
    ? TValue
    : TValue extends readonly never[]
      ? string
      : [keyof TValue] extends [never]
        ? string
        : TValue;

/** A value as `get()` copies it, every line a string once replaced; a loosely typed group stays as it is. */
// A mapped type over a list expands at once, so a recursive type such as LangValue needs the guards and the depth.
type Translated<TValue, TDepth extends number = 8> = TValue extends string
    ? string
    : TDepth extends 0
      ? TValue
      : { [key: string]: LangValue } extends TValue
        ? TValue
        : LangValue[] extends TValue
          ? TValue
          : {
                -readonly [TKey in keyof TValue]: Translated<
                    TValue[TKey],
                    NextDepth[TDepth]
                >;
            };

/** The groups among the values a key reaches, with their lines; a string when it reaches no group. */
type FoundResult<TValues> = [Extract<TValues, object>] extends [never]
    ? string
    : Translated<TValues>;

/** What `get()` answers for a key spelled out in full. */
type LiteralKeyResult<TLines extends LangLines, TKey extends string> =
    ParsedKey<TKey> extends [
        infer TNamespace extends string,
        infer TGroup extends string,
        infer TItem extends string | null,
    ]
        ? TNamespace extends "*"
            ? TGroup extends "*"
                ? TItem extends null
                    ? LangGroup
                    : string
                : FoundResult<LocaleValues<TLines, TKey, TGroup, TItem>>
            : FoundResult<
                  LocaleValues<TLines, TKey, `${TNamespace}::${TGroup}`, TItem>
              >
        : never;

/** What `get()` answers for each of several keys spelled out in full. */
// KeyResult must not call itself: for a generic key the Extract never resolves, and the recursion hits TS2589.
type LiteralKeysResult<
    TLines extends LangLines,
    TKeys extends string,
> = TKeys extends string ? LiteralKeyResult<TLines, TKeys> : never;

/** What `get()` answers for each key in a union; a pattern answers the key itself, or any known group it matches. */
// Only a pattern such as `a.${string}` makes Record<TKey, unknown> an index signature, which an empty object satisfies.
type KeyResult<
    TLines extends LangLines,
    TKey extends string,
> = TKey extends string
    ? Record<never, never> extends Record<TKey, unknown>
        ?
              | string
              | LiteralKeysResult<
                    TLines,
                    Extract<LocalePaths<TLines, object>[keyof TLines], TKey>
                >
        : LiteralKeyResult<TLines, TKey>
    : never;

/** What `get()` answers for a key: the group it names in any locale, a string otherwise, either for untyped lines. */
export type TranslationResult<
    TLines extends LangLines,
    TKey extends string,
> = string extends TKey
    ? TranslationValue
    : HasUntypedLocale<TLines> extends true
      ? TranslationValue
      : KeyResult<TLines, TKey>;

/** What `array()` answers for a key: the group it names, or any group when it names none. */
export type TranslationArray<TLines extends LangLines, TKey extends string> = [
    Extract<TranslationResult<TLines, TKey>, LangGroup>,
] extends [never]
    ? LangGroup
    : Extract<TranslationResult<TLines, TKey>, LangGroup>;

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
