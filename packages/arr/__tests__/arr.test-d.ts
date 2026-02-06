import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

describe("arr type tests", () => {
    describe("accessible", () => {
        it("narrows to array type", () => {
            const value: unknown = [1, 2, 3];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<unknown[]>();
            }
        });
    });

    describe("arrayable", () => {
        it("narrows to array type", () => {
            const value: unknown = [1, 2, 3];
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<unknown[]>();
            }
        });
    });

    describe("add", () => {
        it("returns TValue[]", () => {
            const result = Arr.add([1, 2, 3], 3, 4);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("works with string arrays", () => {
            const result = Arr.add(["a", "b"], 2, "c");
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("works with string & number arrays", () => {
            const result = Arr.add(["a", "b"], 2, 5);
            expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
        });
    });

    describe("arrayItem", () => {
        it("returns unknown[]", () => {
            const result = Arr.arrayItem(
                [
                    [1, 2],
                    [3, 4],
                ],
                0,
            );
            expectTypeOf(result).toEqualTypeOf<unknown[]>();
        });
    });

    describe("boolean", () => {
        it("returns boolean", () => {
            const result = Arr.boolean([true, false], 0);
            expectTypeOf(result).toEqualTypeOf<boolean>();
        });
    });

    describe("chunk", () => {
        it("returns nested arrays of the same type", () => {
            const result = Arr.chunk([1, 2, 3, 4], 2);
            expectTypeOf(result).toEqualTypeOf<number[][]>();
        });
    });

    describe("collapse", () => {
        it("flattens one level of nesting", () => {
            const result = Arr.collapse([
                [1, 2],
                [3, 4],
            ]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("combine", () => {
        it("returns combined tuple arrays", () => {
            const result = Arr.combine([1, 2], [3, 4]);
            expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
        });
    });

    describe("crossJoin", () => {
        it("returns arrays of tuples", () => {
            const result = Arr.crossJoin([
                [1, 2],
                ["a", "b"],
            ]);
            expectTypeOf(result).toExtend<unknown[][]>();
        });
    });

    describe("divide", () => {
        it("returns tuple of keys and values for typed array", () => {
            const result = Arr.divide([10, 20, 30]);
            expectTypeOf(result).toEqualTypeOf<[number[], number[]]>();
        });

        it("returns tuple for empty array", () => {
            const result = Arr.divide([]);
            expectTypeOf(result).toEqualTypeOf<[number[], unknown[]]>();
        });
    });

    describe("dot", () => {
        it("returns a record with string keys", () => {
            const result = Arr.dot([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
        });
    });

    describe("undot", () => {
        it("returns TValue array", () => {
            const result = Arr.undot({ "0": "a", "1": "b" });
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("union", () => {
        it("returns union of array types", () => {
            const result = Arr.union([1, 2], [3, 4]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("unshift", () => {
        it("returns array with new value type", () => {
            const result = Arr.unshift([1, 2], "a");
            expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
        });
    });

    describe("except", () => {
        it("returns TValue[]", () => {
            const result = Arr.except(["a", "b", "c"], [0, 2]);
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("exceptValues", () => {
        it("returns TValue[]", () => {
            const result = Arr.exceptValues([1, 2, 3], [2]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("exists", () => {
        it("returns boolean", () => {
            const result = Arr.exists([1, 2, 3], 1);
            expectTypeOf(result).toEqualTypeOf<boolean>();
        });
    });

    describe("first", () => {
        it("returns TValue or null for array without callback", () => {
            const result = Arr.first([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue or null with callback", () => {
            const result = Arr.first([1, 2, 3], (v) => v > 1);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue or TDefault with default", () => {
            const result = Arr.first([1, 2, 3], null, "default");
            expectTypeOf(result).toExtend<number | string | null>();
        });
    });

    describe("last", () => {
        it("returns TValue or null for array without callback", () => {
            const result = Arr.last([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue or TDefault with default", () => {
            const result = Arr.last([1, 2, 3], null, "default");
            expectTypeOf(result).toExtend<number | string | null>();
        });
    });

    describe("take", () => {
        it("returns TValue[]", () => {
            const result = Arr.take([1, 2, 3, 4, 5], 3);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("flatten", () => {
        it("returns flattened array", () => {
            const result = Arr.flatten([
                [1, 2],
                [3, 4],
            ]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("flip", () => {
        it("returns Record<string, number>", () => {
            const result = Arr.flip(["a", "b", "c"]);
            expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
        });
    });

    describe("float", () => {
        it("returns number", () => {
            const result = Arr.float([1.5, 2.5], 0);
            expectTypeOf(result).toEqualTypeOf<number>();
        });
    });

    describe("forget", () => {
        it("returns TValue[]", () => {
            const result = Arr.forget([1, 2, 3], [0]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("from", () => {
        it("returns TValue[] for array input", () => {
            const result = Arr.from([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("returns Record for Map input", () => {
            const result = Arr.from(new Map([["a", 1]]));
            expectTypeOf(result).toEqualTypeOf<Record<PropertyKey, number>>();
        });
    });

    describe("get", () => {
        it("returns TValue[] when key is null", () => {
            const result = Arr.get(["a", "b", "c"], null);
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("returns TValue[] when key is undefined", () => {
            const result = Arr.get(["a", "b", "c"], undefined);
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("returns TValue | null when key is provided without default", () => {
            const result = Arr.get(["a", "b", "c"], 1);
            expectTypeOf(result).toEqualTypeOf<string | null>();
        });

        it("returns TValue | TDefault when key and default provided", () => {
            const result = Arr.get(["a", "b", "c"], 1, 0);
            expectTypeOf(result).toEqualTypeOf<string | number>();
        });

        it("returns TValue | TDefault with callback default", () => {
            const result = Arr.get(["a", "b"], 5, () => "fallback");
            expectTypeOf(result).toEqualTypeOf<string>();
        });
    });

    describe("has", () => {
        it("returns boolean", () => {
            expectTypeOf(Arr.has([1, 2, 3], 1)).toEqualTypeOf<boolean>();
            expectTypeOf(
                Arr.hasAll([1, 2, 3], [0, 1]),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Arr.hasAny([1, 2, 3], [0, 5]),
            ).toEqualTypeOf<boolean>();
        });
    });

    describe("every / some", () => {
        it("returns boolean", () => {
            expectTypeOf(
                Arr.every([1, 2, 3], (v) => v > 0),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Arr.some([1, 2, 3], (v) => v > 2),
            ).toEqualTypeOf<boolean>();
        });
    });

    describe("integer", () => {
        it("returns number", () => {
            const result = Arr.integer([1, 2, 3], 0);
            expectTypeOf(result).toEqualTypeOf<number>();
        });
    });

    describe("join", () => {
        it("returns string", () => {
            const result = Arr.join([1, 2, 3], ", ");
            expectTypeOf(result).toEqualTypeOf<string>();
        });
    });

    describe("keyBy", () => {
        it("returns Record with string callback", () => {
            const data = [{ id: 1, name: "a" }];
            const result = Arr.keyBy(data, "id");
            expectTypeOf(result).toEqualTypeOf<
                Record<string, { id: number; name: string }>
            >();
        });
    });

    describe("only", () => {
        it("returns TValue[]", () => {
            const result = Arr.only(["a", "b", "c", "d"], [1, 3]);
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("onlyValues", () => {
        it("returns TValue[]", () => {
            const result = Arr.onlyValues([1, 2, 3, 4, 5], [2, 4]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("select", () => {
        it("returns Record array", () => {
            const data = [{ id: 1, name: "a", age: 30 }];
            const result = Arr.select(data, ["id", "name"]);
            expectTypeOf(result).toEqualTypeOf<Record<string, unknown>[]>();
        });
    });

    describe("pluck", () => {
        it("returns unknown[] when no key", () => {
            const data = [{ name: "John" }, { name: "Jane" }];
            const result = Arr.pluck(data, "name");
            expectTypeOf(result).toEqualTypeOf<unknown[]>();
        });

        it("returns Record when key is provided", () => {
            const data = [
                { id: 1, name: "John" },
                { id: 2, name: "Jane" },
            ];
            const result = Arr.pluck(data, "name", "id");
            expectTypeOf(result).toEqualTypeOf<
                Record<string | number, unknown>
            >();
        });
    });

    describe("pop", () => {
        it("returns TValue | null without count", () => {
            const result = Arr.pop([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue[] with count", () => {
            const result = Arr.pop([1, 2, 3], 2);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("map", () => {
        it("returns mapped array type", () => {
            const result = Arr.map([1, 2, 3], (v) => String(v));
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("callback infers value and key types", () => {
            Arr.map([1, 2, 3], (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value;
            });
        });
    });

    describe("mapWithKeys", () => {
        it("returns Record when callback returns object", () => {
            const result = Arr.mapWithKeys(
                [{ id: 1, name: "John" }],
                (item) => ({ [item.id]: item.name }),
            );
            expectTypeOf(result).toExtend<
                Record<string, unknown> | Map<unknown, unknown>
            >();
        });
    });

    describe("mapSpread", () => {
        it("maps spread items", () => {
            const result = Arr.mapSpread(
                [
                    [1, "a"],
                    [2, "b"],
                ],
                (num: number, str: string) => `${num}-${str}`,
            );
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("prepend", () => {
        it("returns TValue[]", () => {
            const result = Arr.prepend([1, 2, 3], 0);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("pull", () => {
        it("returns object with value and data", () => {
            const result = Arr.pull([1, 2, 3], 1);
            expectTypeOf(result).toEqualTypeOf<{
                value: number | null;
                data: number[];
            }>();
        });
    });

    describe("query", () => {
        it("returns string", () => {
            const result = Arr.query([["key", "value"]]);
            expectTypeOf(result).toEqualTypeOf<string>();
        });
    });

    describe("random", () => {
        it("returns TValue | null without count", () => {
            const result = Arr.random([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue[] with count", () => {
            const result = Arr.random([1, 2, 3], 2);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("returns Record with preserveKeys=true", () => {
            const result = Arr.random([1, 2, 3], 2, true);
            expectTypeOf(result).toEqualTypeOf<Record<number, number>>();
        });
    });

    describe("shift", () => {
        it("returns TValue | null without count", () => {
            const result = Arr.shift([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue[] with count", () => {
            const result = Arr.shift([1, 2, 3], 2);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("set", () => {
        it("returns TValue[]", () => {
            const result = Arr.set(["a", "b", "c"], 1, "x");
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("push", () => {
        it("returns TValue[]", () => {
            const result = Arr.push(["a", "b"], null, "c");
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("shuffle", () => {
        it("returns TValue[]", () => {
            const result = Arr.shuffle([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("slice", () => {
        it("returns TValue[]", () => {
            const result = Arr.slice([1, 2, 3, 4, 5], 1, 3);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("sole", () => {
        it("returns TValue", () => {
            const result = Arr.sole([42]);
            expectTypeOf(result).toEqualTypeOf<number>();
        });
    });

    describe("sort", () => {
        it("returns TValue[]", () => {
            const result = Arr.sort([3, 1, 2]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("callback infers types", () => {
            Arr.sort([3, 1, 2], (a, b) => {
                expectTypeOf(a).toEqualTypeOf<number>();
                expectTypeOf(b).toEqualTypeOf<number>();
                return a - b;
            });
        });
    });

    describe("sortDesc", () => {
        it("returns TValue[]", () => {
            const result = Arr.sortDesc([1, 3, 2]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("sortRecursive", () => {
        it("returns TValue[]", () => {
            const result = Arr.sortRecursive([3, 1, 2]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("splice", () => {
        it("returns object with value and removed arrays", () => {
            const result = Arr.splice(["a", "b", "c"], 1, 1);
            expectTypeOf(result).toEqualTypeOf<{
                value: string[];
                removed: string[];
            }>();
        });
    });

    describe("string", () => {
        it("returns string", () => {
            const result = Arr.string(["hello", "world"], 0);
            expectTypeOf(result).toEqualTypeOf<string>();
        });
    });

    describe("toCssClasses", () => {
        it("returns string", () => {
            const result = Arr.toCssClasses(["p-4", "font-bold"]);
            expectTypeOf(result).toEqualTypeOf<string>();
        });
    });

    describe("toCssStyles", () => {
        it("returns string", () => {
            const result = Arr.toCssStyles(["color: red", "font-size: 14px"]);
            expectTypeOf(result).toEqualTypeOf<string>();
        });
    });

    describe("where", () => {
        it("returns TValue[]", () => {
            const result = Arr.where(
                [
                    { name: "a", age: 10 },
                    { name: "b", age: 20 },
                ],
                (item) => item.age > 15,
            );
            expectTypeOf(result).toEqualTypeOf<
                { name: string; age: number }[]
            >();
        });
    });

    describe("reject", () => {
        it("returns TValue[]", () => {
            const result = Arr.reject([1, 2, 3, 4], (v) => v > 2);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("callback infers value type", () => {
            Arr.reject(["a", "b", "c"], (value) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                return value === "b";
            });
        });
    });

    describe("replace", () => {
        it("returns TValue[]", () => {
            const result = Arr.replace([1, 2, 3], [10, 20]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("replaceRecursive", () => {
        it("returns TValue[]", () => {
            const result = Arr.replaceRecursive([1, 2, 3], [10]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("reverse", () => {
        it("returns TValue[]", () => {
            const result = Arr.reverse([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("pad", () => {
        it("returns TValue[]", () => {
            const result = Arr.pad([1, 2], 5, 0);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("partition", () => {
        it("returns tuple of two TValue arrays", () => {
            const result = Arr.partition([1, 2, 3, 4], (v) => v > 2);
            expectTypeOf(result).toEqualTypeOf<[number[], number[]]>();
        });

        it("callback infers value type", () => {
            Arr.partition(["a", "b", "c"], (value) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                return value === "b";
            });
        });
    });

    describe("whereNotNull", () => {
        it("returns TValue[]", () => {
            const result = Arr.whereNotNull([1, null, 2, null, 3]);
            expectTypeOf(result).toEqualTypeOf<(number | null)[]>();
        });
    });

    describe("contains", () => {
        it("returns boolean", () => {
            const result = Arr.contains([1, 2, 3], 2);
            expectTypeOf(result).toEqualTypeOf<boolean>();
        });
    });

    describe("filter", () => {
        it("returns TValue[]", () => {
            const result = Arr.filter([1, 2, 3, 4], (v) => v > 2);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("callback infers value type", () => {
            Arr.filter(["a", "b", "c"], (value) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                return value === "b";
            });
        });
    });

    describe("wrap", () => {
        it("wraps null into empty array", () => {
            const result = Arr.wrap(null);
            expectTypeOf(result).toEqualTypeOf<[]>();
        });

        it("passes through arrays", () => {
            const result = Arr.wrap([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("wraps non-array value into tuple", () => {
            const result = Arr.wrap("hello");
            expectTypeOf(result).toEqualTypeOf<[string]>();
        });

        it("wraps number into tuple", () => {
            const result = Arr.wrap(42);
            expectTypeOf(result).toEqualTypeOf<[number]>();
        });
    });

    describe("keys", () => {
        it("returns number[]", () => {
            const result = Arr.keys([10, 20, 30]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("values", () => {
        it("returns TValue[]", () => {
            const result = Arr.values([10, 20, 30]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("diff", () => {
        it("returns TValue[]", () => {
            const result = Arr.diff([1, 2, 3, 4], [2, 4]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("intersect", () => {
        it("returns TValue[]", () => {
            const result = Arr.intersect([1, 2, 3], [2, 3, 4]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("intersectByKeys", () => {
        it("returns TValue[]", () => {
            const result = Arr.intersectByKeys(["a", "b", "c", "d"], [0, 2]);
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });
});
