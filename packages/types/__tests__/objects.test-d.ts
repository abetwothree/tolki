import type {
    ArrayableItems,
    DeepMergeObjects,
    EnsureObject,
    FlipObject,
    MapArrayKey,
    MapData,
    MapEntryKey,
    MapEntryValue,
    MergeObjects,
    NonKeyedItems,
    NonNullableObject,
    NonObjectItems,
    ObjectFlatValue,
    ObjectKey,
    ObjectPathValue,
    ObjectResolvePath,
    ObjectValue,
    PhpArrayKey,
    PrefixKeys,
    ReindexedObject,
    SetObjectPath,
    Simplify,
    SpreadObjects,
    TruthyObject,
    UnionToIntersection,
} from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

interface TreeNode {
    value: number;
    children: TreeNode[];
}

describe("object helper types", () => {
    describe("PhpArrayKey", () => {
        it("turns canonical integer strings into numbers", () => {
            expectTypeOf<PhpArrayKey<"10">>().toEqualTypeOf<10>();
            expectTypeOf<PhpArrayKey<"-1">>().toEqualTypeOf<-1>();
            expectTypeOf<PhpArrayKey<0>>().toEqualTypeOf<0>();
        });

        it("keeps non-canonical numeric strings as strings", () => {
            expectTypeOf<PhpArrayKey<"01">>().toEqualTypeOf<"01">();
            expectTypeOf<PhpArrayKey<"1.5">>().toEqualTypeOf<"1.5">();
            expectTypeOf<PhpArrayKey<"1e3">>().toEqualTypeOf<"1e3">();
            expectTypeOf<PhpArrayKey<" 1">>().toEqualTypeOf<" 1">();
        });

        it("widens a string index signature to string | number", () => {
            expectTypeOf<PhpArrayKey<string>>().toEqualTypeOf<
                string | number
            >();
        });
    });

    describe("MapArrayKey", () => {
        it("casts a string key as PhpArrayKey does", () => {
            expectTypeOf<MapArrayKey<"10">>().toEqualTypeOf<10>();
            expectTypeOf<MapArrayKey<"01">>().toEqualTypeOf<"01">();
            expectTypeOf<MapArrayKey<string>>().toEqualTypeOf<
                string | number
            >();
        });

        it("keeps an integer key and widens a float one, which PHP truncates", () => {
            expectTypeOf<MapArrayKey<2>>().toEqualTypeOf<2>();
            expectTypeOf<MapArrayKey<-1>>().toEqualTypeOf<-1>();
            expectTypeOf<MapArrayKey<1.5>>().toEqualTypeOf<number>();
            expectTypeOf<MapArrayKey<number>>().toEqualTypeOf<number>();
        });

        it("still says number for an integer key past 2^53, which arrives as its digit string", () => {
            // A documented limit: at runtime `keys(new Map([[2 ** 53, "x"]]))` returns ["9007199254740992"],
            // as a key outside the safe integer range stays a digit string. PhpArrayKey shares the limit.
            expectTypeOf<
                MapArrayKey<9007199254740992>
            >().toEqualTypeOf<9007199254740992>();
            expectTypeOf<
                PhpArrayKey<"9007199254740992">
            >().toEqualTypeOf<9007199254740992>();
        });

        it("casts a boolean, null or undefined key as PHP casts an array offset", () => {
            expectTypeOf<MapArrayKey<true>>().toEqualTypeOf<1>();
            expectTypeOf<MapArrayKey<false>>().toEqualTypeOf<0>();
            expectTypeOf<MapArrayKey<boolean>>().toEqualTypeOf<0 | 1>();
            expectTypeOf<MapArrayKey<null>>().toEqualTypeOf<"">();
            expectTypeOf<MapArrayKey<undefined>>().toEqualTypeOf<"">();
        });

        it("widens any other key to what its string form may cast to", () => {
            expectTypeOf<MapArrayKey<object>>().toEqualTypeOf<
                string | number
            >();
            expectTypeOf<MapArrayKey<symbol>>().toEqualTypeOf<
                string | number
            >();
        });

        it("distributes over a union of keys", () => {
            expectTypeOf<MapArrayKey<"a" | "7" | 3>>().toEqualTypeOf<
                "a" | 7 | 3
            >();
        });
    });

    describe("MapEntryKey and MapEntryValue", () => {
        it("read a Map's keys as MapArrayKey and its values as they are", () => {
            expectTypeOf<MapEntryKey<Map<"1" | "a", string>>>().toEqualTypeOf<
                1 | "a"
            >();
            expectTypeOf<
                MapEntryValue<ReadonlyMap<string, boolean>>
            >().toEqualTypeOf<boolean>();
        });

        it("combine the keys and values of a union of Maps", () => {
            type TwoMaps = Map<string, number> | Map<number, string>;
            expectTypeOf<MapEntryKey<TwoMaps>>().toEqualTypeOf<
                string | number
            >();
            expectTypeOf<MapEntryValue<TwoMaps>>().toEqualTypeOf<
                string | number
            >();
            expectTypeOf<
                MapEntryKey<Map<boolean, string> | Map<2, string>>
            >().toEqualTypeOf<0 | 1 | 2>();
        });

        it("ignore a union member that is not a Map", () => {
            expectTypeOf<
                MapEntryKey<Map<number, string> | undefined>
            >().toEqualTypeOf<number>();
            expectTypeOf<
                MapEntryValue<Map<number, string> | string[] | null>
            >().toEqualTypeOf<string>();
            expectTypeOf<MapEntryValue<string[]>>().toEqualTypeOf<never>();
        });
    });

    describe("MapData", () => {
        function rowFor<TMap>(data: MapData<TMap>): MapEntryValue<TMap>;
        function rowFor(data: unknown): "no Map row";
        function rowFor(data: unknown): unknown {
            return data;
        }

        it("takes a Map, or a union of Maps, as it arrived", () => {
            expectTypeOf(rowFor(new Map([[2, "c"]]))).toEqualTypeOf<string>();
            expectTypeOf(
                rowFor(
                    new Map([[2, "c"]]) as
                        | Map<number, string>
                        | Map<string, boolean>,
                ),
            ).toEqualTypeOf<string | boolean>();
        });

        it("turns away any, and anything that is not a Map", () => {
            // JSON.parse is typed as returning any.
            expectTypeOf(
                rowFor(JSON.parse("{}")),
            ).toEqualTypeOf<"no Map row">();
            expectTypeOf(rowFor({ a: 1 })).toEqualTypeOf<"no Map row">();
            expectTypeOf(
                rowFor(new Map() as Map<number, string> | string[]),
            ).toEqualTypeOf<"no Map row">();
        });

        it("turns away a Map typed by a type parameter, which it cannot tell from any", () => {
            const generic = <M extends Map<string, number>>(map: M) =>
                rowFor(map);

            expectTypeOf(generic).returns.toEqualTypeOf<"no Map row">();
        });
    });

    describe("NonKeyedItems", () => {
        it("takes every NonObjectItems member except a Map", () => {
            expectTypeOf<number[]>().toExtend<NonKeyedItems>();
            expectTypeOf<ReadonlySet<string>>().toExtend<NonKeyedItems>();
            expectTypeOf<WeakMap<object, number>>().toExtend<NonKeyedItems>();
            expectTypeOf<WeakSet<object>>().toExtend<NonKeyedItems>();
            expectTypeOf<() => void>().toExtend<NonKeyedItems>();
            expectTypeOf<NonKeyedItems>().toExtend<NonObjectItems>();
        });

        it("does not take a Map keyed by PHP array keys, or a ReadonlyMap", () => {
            expectTypeOf<Map<string, number>>().not.toExtend<NonKeyedItems>();
            expectTypeOf<
                Map<number | boolean, number>
            >().not.toExtend<NonKeyedItems>();
            expectTypeOf<
                ReadonlyMap<unknown, unknown>
            >().not.toExtend<NonKeyedItems>();
        });

        it("still takes a Map keyed by objects or unknown, through the WeakMap member", () => {
            // The documented limit: such a Map has every member a WeakMap declares. On its own it
            // is claimed by each helper's Map row first; only inside a union does it reach this.
            expectTypeOf<Map<object, string>>().toExtend<NonKeyedItems>();
            expectTypeOf<Map<unknown, string>>().toExtend<NonKeyedItems>();
        });
    });

    describe("ObjectKey and ObjectValue", () => {
        it("reports keys the way PHP would", () => {
            expectTypeOf<
                ObjectKey<{ a: 1; 0: 2; "10": 3; "01": 4 }>
            >().toEqualTypeOf<"a" | 0 | 10 | "01">();
        });

        it("unions an object's values", () => {
            expectTypeOf<ObjectValue<{ a: number; b: string }>>().toEqualTypeOf<
                number | string
            >();
        });
    });

    describe("ReindexedObject", () => {
        it("keeps a string-keyed object as-is", () => {
            expectTypeOf<ReindexedObject<{ a: number }>>().toEqualTypeOf<{
                a: number;
            }>();
        });

        it("widens an integer-keyed object to a record of its values", () => {
            expectTypeOf<
                ReindexedObject<{ 0: string; a: number }>
            >().toEqualTypeOf<Record<string | number, string | number>>();
        });
    });

    describe("TruthyObject and NonNullableObject", () => {
        it("makes every surviving key optional and drops falsy-only keys", () => {
            expectTypeOf<
                TruthyObject<{ a: number; b: null; c: string }>
            >().toEqualTypeOf<{ a?: number; c?: string }>();
        });

        it("makes only nullable keys optional", () => {
            expectTypeOf<
                NonNullableObject<{ a: string | null; b: null; c: number }>
            >().toEqualTypeOf<{ a?: string; c: number }>();
        });
    });

    describe("FlipObject and PrefixKeys", () => {
        it("swaps literal keys and values, normalizing integer keys", () => {
            expectTypeOf<
                FlipObject<{ name: "taylor"; 0: "zero" }>
            >().toEqualTypeOf<{ taylor: "name"; zero: 0 }>();
        });

        it("prefixes every key", () => {
            expectTypeOf<PrefixKeys<{ a: 1; 0: 2 }, "item_">>().toEqualTypeOf<{
                item_a: 1;
                item_0: 2;
            }>();
        });
    });

    describe("ArrayableItems", () => {
        it("unwraps an Enumerable- or Arrayable-like operand", () => {
            expectTypeOf<
                ArrayableItems<{ all(): { a: number } }>
            >().toEqualTypeOf<{ a: number }>();
            expectTypeOf<
                ArrayableItems<{ toArray(): string[] }>
            >().toEqualTypeOf<Record<number, string>>();
        });

        it("keys a list, an iterable and a Map", () => {
            expectTypeOf<ArrayableItems<string[]>>().toEqualTypeOf<
                Record<number, string>
            >();
            expectTypeOf<ArrayableItems<Set<boolean>>>().toEqualTypeOf<
                Record<number, boolean>
            >();
            expectTypeOf<ArrayableItems<Map<string, number>>>().toEqualTypeOf<
                Record<string, number>
            >();
        });

        it("empties null, wraps a scalar and keeps a plain object", () => {
            expectTypeOf<ArrayableItems<null>>().toEqualTypeOf<
                Record<never, never>
            >();
            expectTypeOf<ArrayableItems<"x">>().toEqualTypeOf<{ 0: "x" }>();
            expectTypeOf<ArrayableItems<{ a: 1 }>>().toEqualTypeOf<{ a: 1 }>();
        });
    });

    describe("MergeObjects and DeepMergeObjects", () => {
        it("lets the left-most operand win each key, and a null operand adds nothing", () => {
            expectTypeOf<
                Simplify<MergeObjects<[{ a: 1 }, null, { a: 2; b: 3 }]>>
            >().toEqualTypeOf<{ a: 1; b: 3 }>();
        });

        it("adds a list operand's indices and keeps a key the winner may lack", () => {
            expectTypeOf<MergeObjects<[{ a: 1 }, number[]]>>().toEqualTypeOf<{
                [x: number]: number;
                a: 1;
            }>();
            expectTypeOf<
                MergeObjects<[{ a?: number }, { a: string }]>
            >().toEqualTypeOf<{ a: number | string }>();
        });

        it("reads the first operand by its own entries and unwraps only the later ones", () => {
            expectTypeOf<
                MergeObjects<
                    [{ all: () => "x"; b: 1 }, { all: () => { c: 2 } }]
                >
            >().toEqualTypeOf<{ all: () => "x"; b: 1; c: 2 }>();
            expectTypeOf<
                MergeObjects<[Map<string, 1>, null, { b: 2 }]>
            >().toEqualTypeOf<{ b: 2 }>();
        });

        it("merges nested objects by key and nested lists by index", () => {
            expectTypeOf<
                DeepMergeObjects<
                    { a: { x: 1; y: [1] }; b: 1 },
                    { a: { y: ["s"] }; c: true }
                >
            >().toEqualTypeOf<{
                a: { x: 1; y: (1 | "s")[] };
                b: 1;
                c: true;
            }>();
        });

        it("merges a list meeting an object by key", () => {
            expectTypeOf<
                DeepMergeObjects<{ k: string[] }, { k: { x: number } }>
            >().toEqualTypeOf<{ k: { [x: number]: string; x: number } }>();
        });

        it("unwraps a Collection-like replacer, but never a nested value", () => {
            expectTypeOf<
                DeepMergeObjects<
                    { a: { x: number } },
                    { all(): { a: { y: number } } }
                >
            >().toEqualTypeOf<{ a: { x: number; y: number } }>();
            expectTypeOf<
                DeepMergeObjects<
                    { a: { x: number } },
                    { a: { toArray(): string[] } }
                >
            >().toEqualTypeOf<{ a: { x: number; toArray(): string[] } }>();
        });

        it("replaces a Date, a Map or a RegExp whole, as PHP does an object", () => {
            expectTypeOf<
                DeepMergeObjects<
                    { d: Date; m: Map<string, number>; o: { a: 1 } },
                    { d: Date; m: Map<string, string>; o: RegExp }
                >
            >().toEqualTypeOf<{ d: Date; m: Map<string, string>; o: RegExp }>();
        });
    });

    describe("SpreadObjects", () => {
        it("lays the second operand's own entries over the first's", () => {
            expectTypeOf<
                SpreadObjects<{ a: 1; b: 2 }, { b: "x" }>
            >().toEqualTypeOf<{ a: 1; b: "x" }>();
            expectTypeOf<SpreadObjects<{ a: 1 }, { a?: "x" }>>().toEqualTypeOf<{
                a: 1 | "x";
            }>();
        });

        it("spreads a list's indices and nothing from a Map", () => {
            expectTypeOf<SpreadObjects<string[], { a: 1 }>>().toEqualTypeOf<{
                [x: number]: string;
                a: 1;
            }>();
            expectTypeOf<
                SpreadObjects<{ a: 1 }, Map<string, number>>
            >().toEqualTypeOf<{ a: 1 }>();
        });

        it("spreads nothing from a Date, a RegExp or a Promise", () => {
            expectTypeOf<SpreadObjects<Date, { a: number }>>().toEqualTypeOf<{
                a: number;
            }>();
            expectTypeOf<
                SpreadObjects<{ a: 1 }, RegExp | Promise<number>>
            >().toEqualTypeOf<{ a: 1 }>();
        });
    });

    describe("SetObjectPath", () => {
        it("creates nested objects for a missing path", () => {
            expectTypeOf<
                SetObjectPath<Record<never, never>, "a.b", 1>
            >().toEqualTypeOf<{ a: { b: 1 } }>();
        });

        it("replaces a scalar segment with an object", () => {
            expectTypeOf<
                SetObjectPath<
                    { products: string },
                    "products.desk.price",
                    number
                >
            >().toEqualTypeOf<{
                products: { desk: { price: number } };
            }>();
        });

        it("writes a literal key that contains a dot as one key", () => {
            expectTypeOf<
                SetObjectPath<{ "a.b": 1 }, "a.b", 2>
            >().toEqualTypeOf<{ "a.b": 2 }>();
        });
    });

    describe("ObjectFlatValue, EnsureObject and UnionToIntersection", () => {
        it("reaches the leaves of nested arrays and objects", () => {
            expectTypeOf<
                ObjectFlatValue<{ a: [1, 2]; b: { c: "x" } }>
            >().toEqualTypeOf<1 | 2 | "x">();
        });

        it("keeps a Date whole and reads a Collection-like value through all()", () => {
            expectTypeOf<
                ObjectFlatValue<{ d: Date; r: RegExp }>
            >().toEqualTypeOf<Date | RegExp>();
            expectTypeOf<
                ObjectFlatValue<{ c: { all(): [1, { x: "y" }] } }>
            >().toEqualTypeOf<1 | "y">();
        });

        it("reads a keyless object type as holding anything", () => {
            expectTypeOf<
                ObjectFlatValue<{ o: object; n: 1 }>
            >().toEqualTypeOf<unknown>();
        });

        it("keeps only object members, falling back to a loose record", () => {
            expectTypeOf<EnsureObject<{ a: 1 } | null>>().toEqualTypeOf<{
                a: 1;
            }>();
            expectTypeOf<EnsureObject<number>>().toEqualTypeOf<
                Record<string, unknown>
            >();
        });

        it("intersects a union", () => {
            expectTypeOf<
                UnionToIntersection<{ a: 1 } | { b: 2 }>
            >().toEqualTypeOf<{ a: 1 } & { b: 2 }>();
        });
    });

    describe("ObjectResolvePath", () => {
        it("trusts a literal path through declared keys", () => {
            expectTypeOf<
                ObjectResolvePath<{ a: { b: number } }, "a.b">
            >().toEqualTypeOf<number>();
        });

        it("adds the default for optional, nullable and missing segments", () => {
            expectTypeOf<
                ObjectResolvePath<{ a?: { b: number } }, "a.b">
            >().toEqualTypeOf<number | null>();
            expectTypeOf<
                ObjectResolvePath<{ a: { b: number } | null }, "a.b", "d">
            >().toEqualTypeOf<number | "d">();
            expectTypeOf<
                ObjectResolvePath<{ a: number }, "zzz">
            >().toEqualTypeOf<null>();
        });

        it("keeps a null leaf and adds the default only for an undefined one", () => {
            expectTypeOf<
                ObjectResolvePath<{ a: string | null }, "a">
            >().toEqualTypeOf<string | null>();
            expectTypeOf<
                ObjectResolvePath<{ a?: string }, "a", 0>
            >().toEqualTypeOf<string | 0>();
        });

        it("adds the default for index signatures and array indices", () => {
            expectTypeOf<
                ObjectResolvePath<Record<string, number>, "x", 0>
            >().toEqualTypeOf<number | 0>();
            expectTypeOf<
                ObjectResolvePath<{ tags: string[] }, "tags.0">
            >().toEqualTypeOf<string | null>();
        });

        it("reads a number index, a number key literally and a dotted top-level key whole", () => {
            expectTypeOf<
                ObjectResolvePath<Record<number, string>, "1">
            >().toEqualTypeOf<string | null>();
            expectTypeOf<
                ObjectResolvePath<{ 1: { 5: string } }, 1.5>
            >().toEqualTypeOf<null>();
            expectTypeOf<
                ObjectResolvePath<{ "a.b": number }, "a.b">
            >().toEqualTypeOf<number>();
            expectTypeOf<
                ObjectResolvePath<Record<string, number>, "a.b", 0>
            >().toEqualTypeOf<number | 0>();
        });

        it("walks past an optional dotted key and reads each member of a union", () => {
            expectTypeOf<
                ObjectResolvePath<{ "a.b"?: string; a: { b: number } }, "a.b">
            >().toEqualTypeOf<string | number | null>();
            expectTypeOf<
                ObjectResolvePath<
                    { "a.b": number } | { a: { b: string } },
                    "a.b"
                >
            >().toEqualTypeOf<number | string>();
            expectTypeOf<
                ObjectResolvePath<Record<number, { z: number }>, "1.5">
            >().toEqualTypeOf<{ z: number } | null>();
        });

        it("ends a path at a scalar or a built-in's prototype member, and past an unknown value", () => {
            expectTypeOf<
                ObjectResolvePath<{ s: string }, "s.length">
            >().toEqualTypeOf<null>();
            expectTypeOf<
                ObjectResolvePath<{ d: Date }, "d.getTime", 0>
            >().toEqualTypeOf<(() => number) | 0>();
            expectTypeOf<
                ObjectResolvePath<{ a: unknown }, "a.b">
            >().toEqualTypeOf<unknown>();
            expectTypeOf<
                ObjectResolvePath<object, "a.b">
            >().toEqualTypeOf<unknown>();
        });

        it("returns the whole object for a null path", () => {
            expectTypeOf<
                ObjectResolvePath<{ a: number }, null>
            >().toEqualTypeOf<{ a: number }>();
        });

        it("widens a non-literal path to every reachable value", () => {
            expectTypeOf<
                ObjectResolvePath<{ a: { b: number } }, string>
            >().toEqualTypeOf<{ b: number } | number | null>();
        });

        it("widens a template-literal path, which names no one key", () => {
            expectTypeOf<
                ObjectResolvePath<{ a: { b: number } }, `a.${string}`>
            >().toEqualTypeOf<{ b: number } | number | null>();
        });

        it("stays bounded on a self-referential type", () => {
            expectTypeOf<
                ObjectResolvePath<TreeNode, "children.0.value">
            >().toEqualTypeOf<number | null>();
            expectTypeOf<ObjectPathValue<TreeNode>>().toEqualTypeOf<unknown>();
        });
    });
});
