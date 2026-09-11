import type {
    ArrayableItems,
    DeepMergeObjects,
    EnsureObject,
    FlipObject,
    MergeObjects,
    NonNullableObject,
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
