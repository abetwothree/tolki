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
