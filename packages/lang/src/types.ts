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
