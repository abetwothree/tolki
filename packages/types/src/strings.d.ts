export interface CanBeEscapedWhenCastToString {
    escapeWhenCastToString(escape: boolean): this;
}

/**
 * A subject Str's replace() and remove() accept: a string, strings in a list, Map, collection or iterable,
 * or an object of strings.
 */
export type StringSubject<TSubject> =
    | string
    | Iterable<string>
    | ReadonlyMap<unknown, string>
    | (object & { readonly [K in keyof TSubject]: string });

/**
 * What replace() and remove() return for a subject: a string for a string, else the subject's shape holding
 * strings.
 */
export type StringSubjectResult<TSubject> = TSubject extends string
    ? string
    : TSubject extends ReadonlyMap<infer TKey, unknown>
      ? Map<TKey, string>
      : TSubject extends readonly unknown[]
        ? string[]
        : TSubject extends { all(): infer TItems }
          ? StringSubjectResult<TItems>
          : TSubject extends Iterable<unknown>
            ? string[]
            : { [K in keyof TSubject]: string };
