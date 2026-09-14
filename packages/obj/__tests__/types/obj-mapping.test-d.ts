import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    integerKeyed,
    nullableValues,
    numberList,
    profile,
    type Row,
    rowsById,
    tuplesByKey,
    unknownObject,
} from "./fixtures";

describe("obj mapping type tests", () => {
    describe("map", () => {
        it("infers the value and key, and keeps the keys", () => {
            const result = Obj.map(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return String(value);
            });

            expectTypeOf(result).toEqualTypeOf<{
                a: string;
                b: string;
                c: string;
            }>();
        });

        it("maps an interface's keys", () => {
            expectTypeOf(Obj.map(profile, () => 1)).toEqualTypeOf<{
                name: number;
                nick?: number;
                boss: number;
                age: number;
            }>();
        });

        it("falls back for unknown data and empties a list", () => {
            expectTypeOf(
                Obj.map(unknownObject, (value) => value),
            ).toEqualTypeOf<Record<string, unknown>>();
            expectTypeOf(Obj.map(numberList, (value) => value)).toEqualTypeOf<
                Record<string, never>
            >();
        });
    });

    describe("mapWithKeys", () => {
        it("returns a plain record of the mapped keys and values", () => {
            const result = Obj.mapWithKeys(rowsById, (row, key) => {
                expectTypeOf(row).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<"r1" | "r2">();

                return { [row.name]: row.id };
            });

            expectTypeOf(result).toEqualTypeOf<
                Record<string | number, number>
            >();
        });

        it("keeps literal mapped keys", () => {
            expectTypeOf(
                Obj.mapWithKeys(abc, (value) => ({ total: value })),
            ).toEqualTypeOf<Record<"total", number>>();
        });
    });

    describe("mapSpread", () => {
        it("spreads a tuple row and appends the key", () => {
            const result = Obj.mapSpread(tuplesByKey, (count, label, key) => {
                expectTypeOf(count).toEqualTypeOf<number>();
                expectTypeOf(label).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<"x" | "y">();

                return `${count}-${label}`;
            });

            expectTypeOf(result).toEqualTypeOf<{ x: string; y: string }>();
        });

        it("keeps as-const positions and lets the callback leave off the key", () => {
            const rows = { x: [1, "a"], y: [2, "b"] } as const;

            Obj.mapSpread(rows, (count, label) => {
                expectTypeOf(count).toEqualTypeOf<1 | 2>();
                expectTypeOf(label).toEqualTypeOf<"a" | "b">();

                return label;
            });
            Obj.mapSpread(rows, (_count, _label, key) => {
                expectTypeOf(key).toEqualTypeOf<"x" | "y">();

                return key;
            });
        });

        it("rejects a callback that asks a tuple row for more arguments than it passes", () => {
            // @ts-expect-error -- a [number, string] row passes three arguments
            Obj.mapSpread(tuplesByKey, (_count, _label, _key, extra) => extra);
        });

        it("types each argument as any item or the key when a row's length is unknown", () => {
            Obj.mapSpread(
                { x: [1, "a"], y: [2, "b"] },
                (first, second, key) => {
                    expectTypeOf(first).toEqualTypeOf<string | number>();
                    expectTypeOf(second).toEqualTypeOf<string | number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return first;
                },
            );
            Obj.mapSpread({ p: { x: 1, y: 2 } }, (x, y) => {
                expectTypeOf(x).toEqualTypeOf<number | "p">();
                expectTypeOf(y).toEqualTypeOf<number | "p">();

                return x;
            });
        });

        it("types every argument as unknown for unknown row values", () => {
            const rows: Record<string, unknown> = { a: [1, 2, 3] };

            Obj.mapSpread(rows, (first, second, third) => {
                expectTypeOf(first).toEqualTypeOf<unknown>();
                expectTypeOf(second).toEqualTypeOf<unknown>();
                expectTypeOf(third).toEqualTypeOf<unknown>();

                return third;
            });
        });

        it("falls back for unknown data", () => {
            expectTypeOf(
                Obj.mapSpread(unknownObject, (...args) => args.length),
            ).toEqualTypeOf<Record<string, number>>();
        });
    });

    describe("filter", () => {
        it("drops PHP-falsy entries without a callback", () => {
            expectTypeOf(Obj.filter({ a: 0, b: "x", c: null })).toEqualTypeOf<{
                a?: number;
                b?: string;
            }>();
        });

        it("keeps the per-key types with a callback", () => {
            expectTypeOf(
                Obj.filter(abc, (value, key) => {
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return value > 1;
                }),
            ).toEqualTypeOf<Partial<{ a: number; b: number; c: number }>>();
        });

        it("empties a list and falls back for unknown data", () => {
            expectTypeOf(Obj.filter(numberList)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.filter(unknownObject)).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });

    describe("where and reject", () => {
        it("keep the per-key types as optional", () => {
            expectTypeOf(Obj.where(abc, (value) => value > 1)).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
            expectTypeOf(Obj.reject(abc, (value) => value > 1)).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
        });

        it("hand integer-like keys over as numbers", () => {
            Obj.where(integerKeyed, (_value, key) => {
                expectTypeOf(key).toEqualTypeOf<0 | 1 | "name">();

                return true;
            });
        });
    });

    describe("whereNotNull", () => {
        it("makes only nullable keys optional", () => {
            expectTypeOf(
                Obj.whereNotNull({ a: "x" as string | null, b: null, c: 1 }),
            ).toEqualTypeOf<{ a?: string; c: number }>();
        });

        it("works for an interface and a dictionary", () => {
            expectTypeOf(Obj.whereNotNull(profile)).toEqualTypeOf<{
                name: string;
                nick?: string;
                boss?: { name: string };
                age?: number;
            }>();
            expectTypeOf(Obj.whereNotNull(nullableValues)).toEqualTypeOf<{
                [x: string]: string | undefined;
            }>();
        });
    });

    describe("partition", () => {
        it("destructures into two typed halves", () => {
            const [passed, failed] = Obj.partition(abc, (value, key) => {
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });

            expectTypeOf(passed).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
            expectTypeOf(failed).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
        });
    });
});
