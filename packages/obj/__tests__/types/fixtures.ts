/**
 * Shared typed fixtures for `@tolki/obj` type-level tests. They exist for their inferred types;
 * this file matches neither Vitest include pattern, so it is never collected as a test.
 */

/** A heterogeneous record whose per-key types must survive every helper. */
export const user = {
    name: "John",
    age: 30,
    address: { city: "NYC", zip: 10001 },
};

/** An interface-typed record: interfaces have no implicit index signature. */
export interface Profile {
    name: string;
    nick?: string;
    boss: { name: string } | null;
    age: number | null;
}

/** A value typed by the `Profile` interface. */
export const profile: Profile = { name: "Ada", boss: null, age: null };

/** A literal-key numeric record. */
export const abc = { a: 1, b: 2, c: 3 };

/** A dictionary: a string index signature, so any key may be missing. */
export const scores: Record<string, number> = { a: 1, b: 2 };

/** The row type shared by record-of-records fixtures, so their value type is one type, not a duplicate union. */
export interface Row {
    id: number;
    name: string;
}

/** A record of rows, for pluck, select, keyBy and mapWithKeys. */
export const rowsById: Record<"r1" | "r2", Row> = {
    r1: { id: 1, name: "Ada" },
    r2: { id: 2, name: "Grace" },
};

/** A row with a nested list, for wildcard pluck paths. */
export interface Account {
    account: string;
    users: { first: string; email?: string }[];
}

/** A record of accounts. */
export const accounts: Record<"a" | "b", Account> = {
    a: { account: "a", users: [{ first: "taylor", email: "t@example.com" }] },
    b: { account: "b", users: [{ first: "abigail" }] },
};

/** A record whose values may be null. */
export const nullableValues: Record<string, string | null> = {
    a: "x",
    b: null,
};

/** A record of lists, for flatten and push. */
export const listsByKey = { a: [1, 2], b: [3, 4] };

/** A record of tuples, for mapSpread. */
export const tuplesByKey: Record<"x" | "y", [number, string]> = {
    x: [1, "a"],
    y: [2, "b"],
};

/** A readonly dictionary, to confirm readonly input needs no cast. */
export const readonlyRecord: Readonly<Record<string, number>> = { a: 1 };

/** An `as const` record, to confirm literal value types survive. */
export const constRecord = { a: 1, b: "two" } as const;

/** A record with integer-like keys, which obj renumbers when it reorders. */
export const integerKeyed = { 0: "zero", 1: "one", name: "n" };

/** An object-shaped value typed as `unknown`, for the untyped fallback rows. */
export const unknownObject: unknown = { a: 1 };

/** A dictionary of booleans, for the CSS helpers. */
export const booleanFlags: Record<string, boolean> = {
    "font-bold": true,
    "text-red": false,
};

/** A self-referential type, to confirm path types stay bounded. */
export interface TreeNode {
    value: number;
    children: TreeNode[];
}

/** A value typed by the `TreeNode` interface. */
export const tree: TreeNode = { value: 1, children: [] };

/** A list, which the object helpers route to their untyped result. */
export const numberList = [1, 2];

/** A Map, which the object helpers either walk explicitly or route to their untyped result. */
export const numberMap = new Map([["a", 1]]);
