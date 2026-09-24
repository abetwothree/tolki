import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    integerKeyed,
    mapOrList,
    mapUnion,
    maybeMap,
    nullableValues,
    numberList,
    numberMap,
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

        it("maps a Map's values, handing the callback each key PHP stores", () => {
            const result = Obj.map(new Map([[2, "c"]]), (value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value.length;
            });

            expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
            // A Map<string, …> key "2" reaches the callback as 2, as PHP casts it.
            Obj.map(numberMap, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value;
            });
        });

        it("maps a union of Maps, handing the callback each Map's values and keys", () => {
            const result = Obj.map(mapUnion, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<string | number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return String(value);
            });

            expectTypeOf(result).toEqualTypeOf<Record<string, string>>();
        });

        it("reads a Map typed by a type parameter through its constraint, as before", () => {
            // The ReadonlyMap<TKey, TValue> row does this; the MapData row cannot tell such an M from any.
            const addOne = <M extends Map<string, number>>(map: M) =>
                Obj.map(map, (value) => value + 1);

            expectTypeOf(addOne).returns.toEqualTypeOf<
                Record<string, number>
            >();
        });

        it("still hands an any argument's callback any, from the per-key row", () => {
            // JSON.parse is typed as returning any; MapData turns it away from the Map rows.
            Obj.map(JSON.parse("{}"), (value) => {
                expectTypeOf(value).toBeAny();

                return value;
            });
        });

        it("answers the widest row, not an empty one, for a Map that may be missing or a list", () => {
            // The Map member is mapped, so `Record<string, never>` would be false for it.
            expectTypeOf(Obj.map(maybeMap, (value) => value)).toEqualTypeOf<
                Record<string, unknown>
            >();
            Obj.map(mapOrList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<unknown>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value;
            });
            expectTypeOf(Obj.map(mapOrList, () => 1)).toEqualTypeOf<
                Record<string, number>
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

        it("widens a literal mapped value, as a fresh record's values are writable", () => {
            // The list row above infers its tuple from `readonly [...TMapped]`. Written
            // with a `const` type parameter instead, that inference leaks across overload
            // resolution and narrows THIS record's value to 1, which nothing may assign to.
            expectTypeOf(Obj.mapWithKeys(abc, () => ({ x: 1 }))).toEqualTypeOf<
                Record<"x", number>
            >();
        });

        it("files a list return under its own indexes, as the fold does", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "d6-map-with-keys-list-return", "arr-assoc": ['a'=>1,'b'=>2] with a
            // ["key_$k", $v*2] return answers ["key_b", 4], not a record keyed by the
            // first member. The positions are what the type pins; the values widen.
            expectTypeOf(
                Obj.mapWithKeys(abc, (value, key) => [
                    `key_${String(key)}`,
                    value * 2,
                ]),
            ).toEqualTypeOf<{ 0: string; 1: number }>();
        });

        it("keeps an unbounded list return on its index signature", () => {
            const names: string[] = ["a", "b"];

            expectTypeOf(Obj.mapWithKeys(abc, () => names)).toEqualTypeOf<
                Record<number, string>
            >();
        });

        it("maps a Map's items to the keys the callback returns", () => {
            const result = Obj.mapWithKeys(
                new Map([[2, "c"]]),
                (value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return { [`k${String(key)}`]: value };
                },
            );

            expectTypeOf(result).toEqualTypeOf<
                Record<string | number, string>
            >();
            expectTypeOf(
                Obj.mapWithKeys(numberMap, (value) => ({ total: value })),
            ).toEqualTypeOf<Record<"total", number>>();
        });

        it("files a Map's list return under its own indexes", () => {
            expectTypeOf(
                Obj.mapWithKeys(numberMap, (value, key) => [key, value]),
            ).toEqualTypeOf<{ 0: string | number; 1: number }>();
        });

        it("maps a union of Maps, and answers the widest row for a Map in any other union", () => {
            expectTypeOf(
                Obj.mapWithKeys(mapUnion, (value, key) => ({
                    [`k${String(key)}`]: value,
                })),
            ).toEqualTypeOf<Record<string | number, string | number>>();
            expectTypeOf(
                Obj.mapWithKeys(mapOrList, (value) => ({ total: value })),
            ).toEqualTypeOf<Record<"total", unknown>>();
            expectTypeOf(
                Obj.mapWithKeys(maybeMap, (value) => ({ total: value })),
            ).toEqualTypeOf<Record<"total", unknown>>();
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

        it("spreads a Map's tuple rows and appends the key PHP stores", () => {
            const rows = new Map<number, [number, string]>([[2, [1, "a"]]]);
            const result = Obj.mapSpread(rows, (count, label, key) => {
                expectTypeOf(count).toEqualTypeOf<number>();
                expectTypeOf(label).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return `${count}-${label}`;
            });

            expectTypeOf(result).toEqualTypeOf<Record<string, string>>();
        });

        it("spreads a union of Maps' rows, and answers the widest row for a Map in any other union", () => {
            const rows = new Map([[2, [1, "a"]]]) as
                | Map<number, [number, string]>
                | Map<string, [number, string]>;
            const result = Obj.mapSpread(rows, (count, label, key) => {
                expectTypeOf(count).toEqualTypeOf<number>();
                expectTypeOf(label).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return label;
            });

            expectTypeOf(result).toEqualTypeOf<Record<string, string>>();
            expectTypeOf(
                Obj.mapSpread(mapOrList, (...args) => args.length),
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

        it("drops a Map's PHP-falsy value types without a callback", () => {
            const flags = new Map<string, string | 0 | null>([["a", "x"]]);

            expectTypeOf(Obj.filter(flags)).toEqualTypeOf<
                Record<string, string>
            >();
            expectTypeOf(Obj.filter(flags, null)).toEqualTypeOf<
                Record<string, string>
            >();
        });

        it("keeps a Map's value type with a callback", () => {
            expectTypeOf(
                Obj.filter(numberMap, (value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return value > 1;
                }),
            ).toEqualTypeOf<Record<string, number>>();
        });

        it("filters a union of Maps, and answers the widest row for a Map in any other union", () => {
            expectTypeOf(Obj.filter(mapUnion)).toEqualTypeOf<
                Record<string, string | number>
            >();
            // The empty-result row takes null and undefined but no Map, so neither union lands on it.
            expectTypeOf(Obj.filter(maybeMap)).toEqualTypeOf<
                Record<string, unknown>
            >();
            expectTypeOf(
                Obj.filter(mapOrList, (value, key) => {
                    expectTypeOf(value).toEqualTypeOf<unknown>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return true;
                }),
            ).toEqualTypeOf<Record<string, unknown>>();
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

        it("keep a Map's value type, handing the callback each key PHP stores", () => {
            const rows = new Map([[2, "c"]]);

            expectTypeOf(
                Obj.where(rows, (value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return true;
                }),
            ).toEqualTypeOf<Record<string, string>>();
            expectTypeOf(
                Obj.reject(numberMap, (value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return false;
                }),
            ).toEqualTypeOf<Record<string, number>>();
        });

        it("keep a union of Maps' values, and answer the widest row for a Map in any other union", () => {
            expectTypeOf(Obj.where(mapUnion, () => true)).toEqualTypeOf<
                Record<string, string | number>
            >();
            expectTypeOf(Obj.reject(mapUnion, () => false)).toEqualTypeOf<
                Record<string, string | number>
            >();
            expectTypeOf(Obj.where(maybeMap, () => true)).toEqualTypeOf<
                Record<string, unknown>
            >();
            expectTypeOf(Obj.reject(mapOrList, () => false)).toEqualTypeOf<
                Record<string, unknown>
            >();
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

        it("drops only null from a Map's value type", () => {
            // JS-only: PHP has one null, so an undefined value survives, as it does in a record.
            const values = new Map<string, string | null | undefined>([
                ["a", "x"],
            ]);

            expectTypeOf(Obj.whereNotNull(values)).toEqualTypeOf<
                Record<string, string | undefined>
            >();
        });

        it("reads a union of Maps, and answers the widest row for a Map in any other union", () => {
            expectTypeOf(Obj.whereNotNull(mapUnion)).toEqualTypeOf<
                Record<string, string | number>
            >();
            expectTypeOf(Obj.whereNotNull(maybeMap)).toEqualTypeOf<
                Record<string, unknown>
            >();
            expectTypeOf(Obj.whereNotNull(mapOrList)).toEqualTypeOf<
                Record<string, unknown>
            >();
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

        it("splits a Map into two records of its value type", () => {
            const [passed, failed] = Obj.partition(numberMap, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });

            expectTypeOf(passed).toEqualTypeOf<Record<string, number>>();
            expectTypeOf(failed).toEqualTypeOf<Record<string, number>>();
        });

        it("splits a union of Maps, and answers the widest row for a Map in any other union", () => {
            expectTypeOf(Obj.partition(mapUnion, () => true)).toEqualTypeOf<
                [
                    Record<string, string | number>,
                    Record<string, string | number>,
                ]
            >();
            expectTypeOf(Obj.partition(maybeMap, () => true)).toEqualTypeOf<
                [Record<string, unknown>, Record<string, unknown>]
            >();
            expectTypeOf(Obj.partition(mapOrList, () => true)).toEqualTypeOf<
                [Record<string, unknown>, Record<string, unknown>]
            >();
        });
    });
});
