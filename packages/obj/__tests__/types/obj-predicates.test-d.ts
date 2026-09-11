import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    integerKeyed,
    numberList,
    numberMap,
    profile,
    scores,
    unknownObject,
    user,
} from "./fixtures";

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

        it("infers the key and value from a Map", () => {
            Obj.every(numberMap, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string>();

                return true;
            });
        });

        it("hands a list's callback unknown values", () => {
            Obj.every(numberList, (value) => {
                expectTypeOf(value).toEqualTypeOf<unknown>();

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
    });
});
