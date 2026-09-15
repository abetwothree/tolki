import * as Arr from "@tolki/arr";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

/** Mirrors `data`'s dispatch so `arr`'s row shape is pinned where it is decided. */
type AnyFn = (...args: never[]) => unknown;
declare function dispatch<A extends AnyFn, O extends AnyFn>(a: A, o: O): A & O;

describe("arr rows leave keyed data to obj", () => {
    const rec = { a: 1, b: 2 };
    const list = [1, 2, 3];

    it("routes a record to obj for values", () => {
        expectTypeOf(dispatch(Arr.values, Obj.values)(rec)).toEqualTypeOf(
            Obj.values(rec),
        );
    });

    it("keeps a list on arr for values", () => {
        expectTypeOf(dispatch(Arr.values, Obj.values)(list)).toEqualTypeOf(
            Arr.values(list),
        );
    });

    it("routes a record to obj for keys", () => {
        expectTypeOf(dispatch(Arr.keys, Obj.keys)(rec)).toEqualTypeOf(
            Obj.keys(rec),
        );
    });

    it("routes a record to obj for reverse", () => {
        expectTypeOf(dispatch(Arr.reverse, Obj.reverse)(rec)).toEqualTypeOf(
            Obj.reverse(rec),
        );
    });
});
