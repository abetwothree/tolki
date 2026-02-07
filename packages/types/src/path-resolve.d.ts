/**
 * A key used to access a path in an object or array.
 */
export type PathKey = number | string | null | undefined;

/**
 * A set of keys used to access a path in an object or array.
 */
export type PathKeys = number | string | null | undefined | Array<PathKey>;

/**
 * Unwraps a value or function that returns a value.
 */
export type UnwrapFn<T> = T extends (...args: unknown[]) => infer R ? R : T;

/**
 * Path resolution types for resolving values at dot-delimited paths
 * in arrays and objects. Inspired by Lodash's GetFieldType but tailored
 * for array-first contexts (like Laravel's Arr helpers).
 */

/**
 * Resolves the type of a value at a single key in a type.
 *
 * For arrays: numeric keys resolve to the element type.
 * For objects: string keys resolve to the property type.
 * For tuples: specific numeric keys resolve to the element at that position.
 *
 * @example
 * ```ts
 * type A = ResolveKey<string[], 0>; // string
 * type B = ResolveKey<{ name: string; age: number }, "name">; // string
 * type C = ResolveKey<[string, number], 1>; // number
 * ```
 */
export type ResolveKey<T, K> =
    // If K is directly a key of T (handles objects and tuple numeric indices)
    K extends keyof T
        ? T[K]
        : // If K is a number and T is an array, resolve element type
          T extends readonly (infer U)[]
            ? K extends number
                ? U
                : // If K is a numeric string like "0", resolve element type
                  K extends `${number}`
                    ? U
                    : undefined
            : // If K is a numeric string and T is an object with that as key
              K extends `${infer N extends number}`
                ? N extends keyof T
                    ? T[N]
                    : undefined
                : // If K is a number and the stringified version is a key
                  K extends number
                    ? `${K}` extends keyof T
                        ? T[`${K}`]
                        : undefined
                    : undefined;

/**
 * Resolves the type at a dot-delimited path within a type.
 * Recursively walks through the path segments.
 *
 * @example
 * ```ts
 * type A = ResolvePath<{ user: { name: string } }, "user.name">; // string
 * type B = ResolvePath<{ items: number[] }, "items.0">; // number
 * type C = ResolvePath<[{ name: string }], "0.name">; // string
 * ```
 */
export type ResolvePath<T, P> =
    // If P is a string with dots, split and recurse
    P extends `${infer First}.${infer Rest}`
        ? ResolveKey<T, First> extends infer Resolved
            ? Resolved extends undefined
                ? undefined
                : ResolvePath<NonNullable<Resolved>, Rest>
            : undefined
        : // No dots: just resolve a single key
          ResolveKey<T, P>;

/**
 * Resolves the type at a path within an array context.
 * This is the main type for Arr helper functions that operate on arrays
 * and use dot-notation paths to access nested values.
 *
 * When the path is a non-literal `string` or `number`, falls back to TDefault
 * since the path cannot be statically resolved.
 *
 * When the path is `null` or `undefined`, returns the entire array.
 *
 * @template TArray - The array type to resolve from (e.g., `string[]`, `{name: string}[]`)
 * @template TPath - The path to resolve (e.g., `0`, `"0.name"`, `"0.items.1"`)
 * @template TDefault - The fallback type when the path cannot be resolved (defaults to `unknown`)
 *
 * @example
 * ```ts
 * type A = ArrayResolvePath<string[], 0>; // string
 * type B = ArrayResolvePath<{name: string}[], "0.name">; // string
 * type C = ArrayResolvePath<{users: {name: string}[]}[], "0.users.0.name">; // string
 * type D = ArrayResolvePath<string[], null>; // string[]
 * type E = ArrayResolvePath<string[], string>; // unknown (non-literal)
 * ```
 */
export type ArrayResolvePath<
    TArray extends readonly unknown[],
    TPath,
    TDefault = unknown,
> =
    // null/undefined key → return the entire array
    TPath extends null | undefined
        ? TArray
        : // Literal number → resolve element type
          number extends TPath
            ? TDefault
            : // Literal string check — non-literal strings should fallback
              TPath extends string
                ? string extends TPath
                    ? TDefault
                    : ResolvePath<TArray, TPath> extends infer R
                        ? [R] extends [undefined]
                            ? TDefault
                            : R
                        : TDefault
                : TPath extends number
                    ? ResolvePath<TArray, `${TPath}`> extends infer R
                        ? [R] extends [undefined]
                            ? TDefault
                            : R
                        : TDefault
                    : TDefault;

/**
 * Ensures a resolved path type is an array type.
 * If the resolved type is already an array, returns it as-is.
 * Otherwise falls back to `unknown[]`.
 *
 * Handles the `never` case (e.g., from empty arrays) by falling back
 * to `unknown[]` instead of propagating `never`.
 *
 * Useful for functions like `arrayItem` that validate the resolved
 * value is an array at runtime and throw if not.
 *
 * @example
 * ```ts
 * type A = EnsureArray<string[]>; // string[]
 * type B = EnsureArray<number>; // unknown[]
 * type C = EnsureArray<unknown>; // unknown[]
 * type D = EnsureArray<never>; // unknown[]
 * ```
 */
export type EnsureArray<T> = [T] extends [never]
    ? unknown[]
    : T extends readonly unknown[]
        ? T
        : unknown[];

/**
 * Checks whether a type is a literal string or number, rather than a
 * widened `string` or `number` type.
 *
 * @example
 * ```ts
 * type A = IsLiteral<"hello">; // true
 * type B = IsLiteral<42>; // true
 * type C = IsLiteral<string>; // false
 * type D = IsLiteral<number>; // false
 * ```
 */
export type IsLiteral<T> = string extends T
    ? false
    : number extends T
        ? false
        : T extends string | number
            ? true
            : false;

/**
 * Resolves a path within an array and adds `| null` only when the path
 * is non-literal (widened `string` or `number`), meaning it cannot be
 * statically verified at compile time.
 *
 * When the path is a literal (e.g., `0`, `"0.name"`), returns just the
 * resolved type without `| null`, consistent with TypeScript's array
 * access convention where `arr[0]` returns the element type without
 * `| undefined`.
 *
 * When the path is non-literal (`string` or `number`), `| null` is added
 * since the path cannot be verified at compile time.
 *
 * @example
 * ```ts
 * Literal path → resolved type, no null
 * type A = ArrayResolvePathOrNull<{name: string}[], "0.name">; // string
 *
 * Non-literal path → element type | null
 * type B = ArrayResolvePathOrNull<{name: string}[], string>; // {name: string} | null
 *
 * Literal index on simple array → element type, no null
 * type C = ArrayResolvePathOrNull<string[], 0>; // string
 * ```
 */
export type ArrayResolvePathOrNull<
    TArray extends readonly unknown[],
    TPath,
> =
    IsLiteral<TPath> extends true
        ? ArrayResolvePath<TArray, TPath, TArray[number]>
        : ArrayResolvePath<TArray, TPath, TArray[number]> | null;


/**
 * Gets the type of a value at a given path in an object or array.
 * Supports dot notation (a.b.c) and array indexing (a.0.b).
 *
 * Delegates to {@link ResolvePath} for the actual path resolution
 * logic and adds TDefault fallback handling.
 */
export type GetFieldType<
    T,
    P extends string | number,
    TDefault = never,
> = P extends keyof T
    ? T[P]
    : P extends string
      ? ResolvePath<T, P> extends infer R
          ? [R] extends [undefined]
              ? TDefault
              : R
          : TDefault
      : P extends number
        ? ResolveKey<T, P> extends infer R
            ? [R] extends [undefined]
                ? TDefault
                : R
            : TDefault
        : TDefault;
