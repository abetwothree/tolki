import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    integerKeyed,
    mapOrList,
    mapUnion,
    maybeMap,
    numberList,
    numberMap,
    profile,
    scores,
    unknownObject,
    user,
} from "./fixtures";

declare const opaque: unknown;
// `declare`, not an initializer: a `const` narrows to its initializer's type, which would
// hide `contains`' cost by handing the call a `string` where the declared type is wider.
declare const flag: boolean;

describe("obj predicate type tests", () => {
    describe("exists, has, hasAll and hasAny", () => {
        it("return boolean for typed, interface and unknown data", () => {
            expectTypeOf(Obj.exists(user, "name")).toEqualTypeOf<boolean>();
            expectTypeOf(
                Obj.has(user, ["name", "address.city"]),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Obj.hasAll(profile, ["name", "age"]),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Obj.hasAny(unknownObject, "a"),
            ).toEqualTypeOf<boolean>();
        });

        it("accept null keys", () => {
            expectTypeOf(Obj.has(user, null)).toEqualTypeOf<boolean>();
            expectTypeOf(Obj.exists(user, null)).toEqualTypeOf<boolean>();
        });

        it("accept a readonly keys constant", () => {
            const keys = ["name", "age"] as const;

            expectTypeOf(Obj.has(user, keys)).toEqualTypeOf<boolean>();
            expectTypeOf(Obj.hasAll(profile, keys)).toEqualTypeOf<boolean>();
            expectTypeOf(Obj.hasAny(numberMap, keys)).toEqualTypeOf<boolean>();
        });
    });

    describe("every", () => {
        it("infers the value and literal key for a record", () => {
            Obj.every(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 0;
            });
        });

        it("hands integer-like keys over as numbers", () => {
            Obj.every(integerKeyed, (value, key) => {
                expectTypeOf(key).toEqualTypeOf<0 | 1 | "name">();

                return value !== "";
            });
        });

        it("infers from an interface and a dictionary", () => {
            Obj.every(profile, (value) => {
                expectTypeOf(value).toEqualTypeOf<
                    string | { name: string } | number | null | undefined
                >();

                return true;
            });
            Obj.every(scores, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return true;
            });
        });

        it("infers the value from a Map and casts its key as PHP would", () => {
            // A Map<string, …> key "2" reaches the callback as 2, as PHP casts it.
            Obj.every(numberMap, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return true;
            });
        });

        it("hands a list's callback unknown values", () => {
            Obj.every(numberList, (value) => {
                expectTypeOf(value).toEqualTypeOf<unknown>();

                return true;
            });
        });

        it("hands a union of Maps' callback its members' values and keys", () => {
            Obj.every(mapUnion, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<string | number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return true;
            });
            Obj.every(mapOrList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<unknown>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return true;
            });
        });
    });

    describe("some", () => {
        it("infers the value and key for a record and a Map", () => {
            Obj.some(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
            Obj.some(new Map([[1, "a"]]), (value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return true;
            });
        });
    });

    describe("contains", () => {
        it("types a callback's value and key", () => {
            Obj.contains(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("accepts any needle, because loose comparison may match across types", () => {
            expectTypeOf(Obj.contains(abc, "1")).toEqualTypeOf<boolean>();
            expectTypeOf(Obj.contains(abc, 1, true)).toEqualTypeOf<boolean>();
        });

        it("types a Map callback's value, and its key as PHP casts it", () => {
            expectTypeOf(
                Obj.contains(
                    new Map([[1, "a"]]),
                    (value, key) => {
                        expectTypeOf(value).toEqualTypeOf<string>();
                        expectTypeOf(key).toEqualTypeOf<number>();

                        return value === "a";
                    },
                    true,
                ),
            ).toEqualTypeOf<boolean>();
            // A Map<string, …> key "2" reaches the callback as 2, as PHP casts it.
            Obj.contains(numberMap, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return true;
            });
        });

        it("accepts any needle for a Map, and every other form a Map reaches", () => {
            expectTypeOf(Obj.contains(numberMap, "1")).toEqualTypeOf<boolean>();
            expectTypeOf(
                Obj.contains(numberMap, 1, true),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Obj.contains(numberMap, null, ">", 0),
            ).toEqualTypeOf<boolean>();
        });

        it("types a union of Maps' callback, and a Map-or-list callback as the widest row does", () => {
            Obj.contains(mapUnion, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<string | number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return true;
            });
            Obj.contains(mapOrList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<unknown>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return true;
            });
            expectTypeOf(Obj.contains(maybeMap, "c")).toEqualTypeOf<boolean>();
        });

        it("keeps the key/value row off every third argument the runtime cannot serve", () => {
            // The row declares `NonBooleanValue`, so it promises only the forms the runtime
            // takes: a boolean third argument is `strict`. Four shapes pay for that, and
            // each is written with the four-argument operator form instead.
            expectTypeOf(
                Obj.contains({ a: { v: 1 } }, "v", "=", opaque),
            ).toEqualTypeOf<boolean>();
            // @ts-expect-error - 1 of 4: an unknown value belongs on the operator row
            Obj.contains({ a: { v: 1 } }, "v", opaque);
            // A plain boolean is NOT one of the four: it matches the earlier `strict` row,
            // which is exactly what the runtime does with a boolean third argument.
            expectTypeOf(
                Obj.contains({ a: { v: 1 } }, "v", flag),
            ).toEqualTypeOf<boolean>();
        });

        it("keeps it off a union holding boolean and off a type parameter", () => {
            // The other three of the four. A generic needle has to be turned away because
            // the call site may instantiate it with `boolean`, which `strict` would take.
            const cost = <TNeedle, TBoolish extends string | boolean>(
                union: string | boolean,
                needle: TNeedle,
                boolish: TBoolish,
            ): void => {
                // @ts-expect-error - 2 of 4: a union holding boolean is not NonBooleanValue
                Obj.contains({ a: { v: 1 } }, "v", union);
                // @ts-expect-error - 3 of 4: an unconstrained type parameter could be a boolean
                Obj.contains({ a: { v: 1 } }, "v", needle);
                // @ts-expect-error - 4 of 4: nor may a constraint that holds boolean
                Obj.contains({ a: { v: 1 } }, "v", boolish);
                // Each is written this way instead, on the operator row.
                expectTypeOf(
                    Obj.contains({ a: { v: 1 } }, "v", "=", union),
                ).toEqualTypeOf<boolean>();
            };

            expectTypeOf(cost).toBeFunction();
        });
    });

    describe("containsStrict", () => {
        it("types a record callback's value and key", () => {
            Obj.containsStrict(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("types a Map callback's value, and its key as PHP casts it", () => {
            // It walks a Map through contains, so it declares its own Map row, not the untyped one.
            expectTypeOf(
                Obj.containsStrict(new Map([[1, "a"]]), (value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value === "a";
                }),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Obj.containsStrict(numberMap, 1),
            ).toEqualTypeOf<boolean>();
        });

        it("types a union of Maps' callback, and a Map-or-list callback as the widest row does", () => {
            Obj.containsStrict(mapUnion, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<string | number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return true;
            });
            Obj.containsStrict(mapOrList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<unknown>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return true;
            });
            expectTypeOf(
                Obj.containsStrict(numberList, 1),
            ).toEqualTypeOf<boolean>();
        });
    });

    describe("sole", () => {
        it("returns the value type", () => {
            expectTypeOf(Obj.sole(abc)).toEqualTypeOf<number>();
        });

        it("types the callback and still returns the value type", () => {
            expectTypeOf(
                Obj.sole(abc, (value, key) => {
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return value > 2;
                }),
            ).toEqualTypeOf<number>();
        });

        it("is never for a list, which always throws, and unknown for unknown data", () => {
            expectTypeOf(Obj.sole(numberList)).toEqualTypeOf<never>();
            expectTypeOf(Obj.sole(unknownObject)).toEqualTypeOf<unknown>();
        });

        it("returns a Map's value type and types its callback's key as PHP casts it", () => {
            expectTypeOf(Obj.sole(numberMap)).toEqualTypeOf<number>();
            expectTypeOf(
                Obj.sole(new Map([[true, "a"]]), (value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    // PHP stores a true key as 1.
                    expectTypeOf(key).toEqualTypeOf<1 | 0>();

                    return value === "a";
                }),
            ).toEqualTypeOf<string>();
        });
    });
});
