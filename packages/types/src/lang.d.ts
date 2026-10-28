import type { Countable } from "./data";
import type {
    ObjectDotPath,
    ObjectDotPathValue,
    ObjectResolvePath,
} from "./path-resolve";

/** A tag callback receives the text between `<key>` and `</key>`. */
type TagCallback = (children: string) => unknown;

/** A value a placeholder can take; what PHP cannot cast to a string throws. */
type ReplacementValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | object
    | TagCallback;

/** Placeholder values keyed by name, or a list keyed by position. */
type Replacements =
    | Readonly<Record<string, ReplacementValue>>
    | readonly ReplacementValue[];

/** Any class, so a handler can be registered for it. */
type StringableType<TValue = unknown> = abstract new (
    ...args: never[]
) => TValue;

/** Handlers that turn an instance of the exact class into a replacement. */
type StringableHandlers = ReadonlyMap<
    StringableType,
    (value: never) => unknown
>;

/** A group of lines, as a PHP lang file's array holds them. */
type LangGroup = { [key: string]: LangValue } | LangValue[];

/** A line, or a group of lines. */
type LangValue = string | LangGroup;

/** A line, or a group of lines, as the caller hands them over; the translator never writes to them. */
type LangInputValue =
    | string
    | { readonly [key: string]: LangInputValue }
    | readonly LangInputValue[];

/** One locale's lines: a group under its file's name (`ns::group` for a package), any other value a JSON line. */
type LocaleLines = Readonly<Record<string, LangInputValue>>;

/** Every locale's lines, keyed by locale. */
type LangLines = Readonly<Record<string, LocaleLines>>;

/** What `get()` answers: a line, or a copy of a group. */
type TranslationValue = string | LangGroup;

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

/** Each locale's keys to a `TValue`: JSON lines, groups, and paths at most 4 levels below a group. */
type LocalePaths<TLines extends LangLines, TValue> = {
    [TLocale in keyof TLines]: ObjectDotPath<TLines[TLocale], TValue, 5>;
};

/** Every key the lines name: each locale's JSON lines and groups, and the paths at most 4 levels below a group. */
// Indexed here rather than inside LocalePaths: a key union returned through an alias is far slower to check.
type TranslationKey<TLines extends LangLines> =
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

/** The lines and groups a key reaches in every locale's groups; a JSON line is a string, which every answer holds. */
type LocaleValues<
    TLines extends LangLines,
    TName extends string,
    TItem extends string | null,
> = {
    [TLocale in keyof TLines]: TName extends keyof TLines[TLocale]
        ? ReachedValue<
              GroupItem<Exclude<TLines[TLocale][TName], string>, TItem>
          >
        : never;
}[keyof TLines];

/** A group's item, or the whole group for none; only a pattern's paths, such as a list's `${number}`, are templates. */
// Distributed so a JSON line, which leaves no group, reaches nothing: ObjectResolvePath reads `never` as unknown.
type GroupItem<TGroup, TItem extends string | null> = TGroup extends unknown
    ? TItem extends string
        ? Record<never, never> extends Record<TItem, unknown>
            ? ObjectDotPathValue<TGroup, TItem>
            : ObjectResolvePath<TGroup, TItem, never>
        : TGroup
    : never;

/** PHP skips an empty group, so `get()` answers the key for it. */
// An unknown value stands for any line or group, which keyof alone would read as an empty group.
type ReachedValue<TValue> = unknown extends TValue
    ? TranslationValue
    : TValue extends string
      ? TValue
      : TValue extends readonly never[]
        ? string
        : [keyof TValue] extends [never]
          ? string
          : TValue;

/** A value as `get()` copies it, every line a string once replaced; a loosely typed group copies as a `LangGroup`. */
// A mapped type over a list expands at once, so a recursive type such as LangValue needs the guards and the depth.
type Translated<TValue, TDepth extends number = 8> = TValue extends string
    ? string
    : TDepth extends 0
      ? TValue
      : { [key: string]: LangValue } extends TValue
        ? string extends keyof TValue
            ? { [key: string]: LangValue }
            : TValue
        : LangValue[] extends TValue
          ? LangValue[]
          : {
                -readonly [TKey in keyof TValue]: Translated<
                    TValue[TKey],
                    NextDepth[TDepth]
                >;
            };

/** The groups a key reaches, with their lines, or the key itself, which a locale without them answers. */
type FoundResult<TValues> = Translated<TValues> | string;

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
                    ? LangGroup | string
                    : string
                : FoundResult<LocaleValues<TLines, TGroup, TItem>>
            : FoundResult<
                  LocaleValues<TLines, `${TNamespace}::${TGroup}`, TItem>
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

/** What `get()` answers: the group a key names in any locale or the key, otherwise a string; either if untyped. */
type TranslationResult<
    TLines extends LangLines,
    TKey extends string,
> = string extends TKey
    ? TranslationValue
    : HasUntypedLocale<TLines> extends true
      ? TranslationValue
      : KeyResult<TLines, TKey>;

/** What `array()` answers for a key: the group it names, or any group when it names none. */
type TranslationArray<TLines extends LangLines, TKey extends string> = [
    Extract<TranslationResult<TLines, TKey>, LangGroup>,
] extends [never]
    ? LangGroup
    : Extract<TranslationResult<TLines, TKey>, LangGroup>;

/** Answers the line for a key no locale has; `null` or `undefined` keeps the key. */
type MissingKeyHandler = (
    key: string,
    replace: Replacements,
    locale: string,
    fallback: boolean,
) => string | null | undefined;

/** Turns the locales a lookup would read into the ones it reads. */
type LocalesResolver = (locales: string[]) => string[];

/** What PHP's `count()` accepts: an array, a `Countable`, or here a `Map`, a `Set` or an object. */
type LangCountable =
    | readonly unknown[]
    | ReadonlyMap<unknown, unknown>
    | ReadonlySet<unknown>
    | Countable
    | Readonly<Record<string, unknown>>;

/** A number, or a value whose count is the number. */
type ChoiceNumber = number | LangCountable;

/** What `import()` answers for a locale's JSON file: a module namespace whose default export is the lines. */
type LocaleModule = { readonly default: LocaleLines };

/** Fetches one locale's lines, at once or later; a file imported as a module is unwrapped. */
type LocaleLinesLoader = (
    locale: string,
) => LocaleLines | LocaleModule | Promise<LocaleLines | LocaleModule>;

/** What `createLang()` is built from. */
interface LangOptions<TLines extends LangLines = LangLines> {
    /** The locale to start in. */
    readonly locale: string;
    /** The locale a lookup falls back to. */
    readonly fallback?: string | null;
    /** The lines already at hand, one object per locale. */
    readonly lines?: TLines;
    /** Fetches a locale's lines when it is first needed. */
    readonly load?: LocaleLinesLoader;
}

// An export list keeps the helpers above private: a .d.ts module without one exports every declaration.
export type {
    ChoiceNumber,
    LangCountable,
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
};
