/**
 * Shared typed fixtures for `@tolki/arr` type-level tests.
 *
 * These constants exist purely for their inferred types. Type test files
 * import them to exercise overload resolution against realistic shapes
 * instead of re-declaring the same literals in every test file.
 *
 * This file is not itself a test: it matches neither Vitest's `include`
 * nor `typecheck.include`, so it is never collected as a test file. It is
 * still covered by the root `tsconfig.json` `include`, so it must type-check
 * cleanly on its own.
 */

/** A flat array of user objects, for functions that operate on record shapes. */
export const users = [
    { id: 1, name: "Ada" },
    { id: 2, name: "Grace" },
];

/** Users with a nested `friends` array, for wildcard/path-based lookups. */
export const nestedUsers = [
    {
        id: 1,
        name: "Ada",
        friends: [{ id: 2, name: "Grace" }],
    },
    {
        id: 2,
        name: "Grace",
        friends: [{ id: 1, name: "Ada" }],
    },
];

/**
 * A minimal `{ id: number }[]` object array, for predicate-style helpers that
 * only need to prove object element types survive — smaller than `users` so
 * assertions don't have to account for a `name` field they don't care about.
 */
export const idObjects: { id: number }[] = [{ id: 1 }, { id: 2 }];

/** An array whose element type is a union, for testing type-preserving overloads. */
export const unionElements: (string | number)[] = ["a", 1, "b", 2];

/** An array whose element type includes `null`, for null-filtering helpers. */
export const nullableElements: (string | null)[] = ["a", null, "b"];

/**
 * A numeric array whose element type includes both `null` and `undefined`,
 * for helpers that narrow `null`/`undefined`/falsy values out of the element
 * type independently of each other.
 */
export const nullishNumbers: (number | null | undefined)[] = [
    1,
    null,
    2,
    undefined,
];

/** A two-dimensional numeric array, for flatten/collapse-style helpers. */
export const numberGrid: number[][] = [
    [1, 2],
    [3, 4],
];

/** A `readonly string[]`, to confirm readonly arrays are accepted without casts. */
export const readonlyStrings: readonly string[] = ["a", "b"];

/** A `readonly number[]`, to confirm readonly numeric arrays are accepted without casts. */
export const readonlyNumbers: readonly number[] = [1, 2];

/** An `as const` string tuple, to confirm literal element types are preserved. */
export const stringTuple = ["a", "b"] as const;
