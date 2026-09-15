/**
 * Shared typed fixtures for `@tolki/data` type-level tests. They exist for their inferred types;
 * this file matches neither Vitest include pattern, so it is never collected as a test.
 */

import type { DataItems } from "@tolki/types";

/** A list backing: the arr delegate's shape. */
export const numberList = [1, 2, 3];

/**
 * The package's own canonical input type. A union matches none of arr's array-shaped rows,
 * so it reaches obj's widest row; concrete fixtures never show that.
 */
export const unionItems: DataItems<number, string> = [1, 2, 3];

/** A read-only list backing: `TValue[]` rejects it, `ArrayItems<TValue>` accepts it. */
export const readonlyNumberList: readonly number[] = [1, 2, 3];

/** A keyed backing: the obj delegate's shape, with literal keys. */
export const abc = { a: 1, b: 2, c: 3 };

/** An interface-typed record: interfaces have no implicit index signature (see E2). */
export interface Settings {
    a: number;
    b: number;
}

/** A value typed by the `Settings` interface — the input that fails to compile today. */
export const settings: Settings = { a: 1, b: 2 };

/** A class instance: also has no index signature. */
export class Box {
    constructor(
        public a = 1,
        public b = 2,
    ) {}
}

/** An instance of `Box`. */
export const box = new Box();

/** A Map backing, which only `obj.from` accepts unnormalized. */
export const numberMap = new Map([
    ["a", 1],
    ["b", 2],
]);

/** Data obj cannot narrow, which reaches the widest row of every obj overload set. */
export const opaque: unknown = null;

/** The record `numberMap` mirrors: the shape `toKeyedData` builds from it at runtime. */
export const numberMapAsRecord: Record<string, number> = { a: 1, b: 2 };

/** A list of booleans, for the typed accessors. */
export const booleanList = [true, false];

/** A record of booleans. */
export const flags = { on: true, off: false };

/** A list of strings, for the typed accessors. */
export const stringList = ["Ada", "Grace"];

/** A record of strings. */
export const names = { first: "Ada", last: "Lovelace" };

/** A nested list, for collapse and flatten. */
export const nestedList = [[1, 2], [3]];

/** A nested record, for collapse and flatten. */
export const nestedRecord = { a: { x: 1 }, b: { y: "s" } };

/** The row type shared by record-of-rows fixtures. */
export interface Row {
    id: number;
    name: string;
}

/** A list of rows, for pluck, select, keyBy and sort. */
export const rowList: Row[] = [
    { id: 1, name: "Ada" },
    { id: 2, name: "Grace" },
];

/** A record of rows. */
export const rowsById: Record<"r1" | "r2", Row> = {
    r1: { id: 1, name: "Ada" },
    r2: { id: 2, name: "Grace" },
};

/** The canonical union at the shape keyBy needs: rows rather than scalars. */
export const unionRows: DataItems<Row, "r1" | "r2"> = rowList;

/** The nested row type shared by pluck's dotted-path fixtures. */
export interface NestedRow {
    user: Row;
}

/** A list of nested rows, for pluck's dotted paths. */
export const nestedRowList: NestedRow[] = [
    { user: { id: 1, name: "Ada" } },
    { user: { id: 2, name: "Grace" } },
];

/** The record of the same nested rows. */
export const nestedRowsById: Record<"r1" | "r2", NestedRow> = {
    r1: { user: { id: 1, name: "Ada" } },
    r2: { user: { id: 2, name: "Grace" } },
};

/** The wildcard row type: a row holding a list, so `a.*.b` has something to walk. */
export interface WildcardRow {
    users: { first: string }[];
}

/** A list of wildcard rows, for pluck's `*` segment. */
export const wildcardRowList: WildcardRow[] = [
    { users: [{ first: "taylor" }, { first: "dayle" }] },
];

/** The record of the same wildcard rows. */
export const wildcardRowsById: Record<"r1", WildcardRow> = {
    r1: { users: [{ first: "taylor" }, { first: "dayle" }] },
};

/** A Map of rows, which only `dispatch`'s Map row accepts. */
export const rowMap = new Map<string, Row>([
    ["r1", { id: 1, name: "Ada" }],
    ["r2", { id: 2, name: "Grace" }],
]);

/** The record `rowMap` mirrors: the shape `toKeyedData` builds from it at runtime. */
export const rowMapAsRecord: Record<string, Row> = {
    r1: { id: 1, name: "Ada" },
    r2: { id: 2, name: "Grace" },
};

/** A list of pairs: the tuple shape `mapSpread`'s typed arr rows are written for. */
export const pairList: [number, string][] = [
    [1, "Ada"],
    [2, "Grace"],
];

/** A record of pairs, so `mapSpread`'s keyed backing has the same tuple shape. */
export const pairsById: Record<"p1" | "p2", [number, string]> = {
    p1: [1, "Ada"],
    p2: [2, "Grace"],
};
