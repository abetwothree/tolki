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

    it("routes a record to obj for union", () => {
        expectTypeOf(
            dispatch(Arr.union, Obj.union)({ a: 1 }, { b: 2 }),
        ).toEqualTypeOf(Obj.union({ a: 1 }, { b: 2 }));
    });

    it("routes a record to obj for from", () => {
        expectTypeOf(dispatch(Arr.from, Obj.from)({ a: 1 })).toEqualTypeOf(
            Obj.from({ a: 1 }),
        );
    });

    it("routes keyed dimensions to obj for crossJoin", () => {
        expectTypeOf(
            dispatch(Arr.crossJoin, Obj.crossJoin)({ a: [1] }, { b: ["x"] }),
        ).toEqualTypeOf(Obj.crossJoin({ a: [1] }, { b: ["x"] }));
    });

    it("keeps array dimensions on arr for crossJoin", () => {
        // Bound first: as a direct argument the literal `["x"]` widens differently
        // on each side, which is an inference artifact, not a dispatch difference.
        const dispatched = dispatch(Arr.crossJoin, Obj.crossJoin)(
            [1, 2],
            ["x"],
        );
        const direct = Arr.crossJoin([1, 2], ["x"]);
        expectTypeOf(dispatched).toEqualTypeOf(direct);
    });

    it("routes a record to obj for pop", () => {
        expectTypeOf(dispatch(Arr.pop, Obj.pop)(rec)).toEqualTypeOf(
            Obj.pop(rec),
        );
    });

    it("keeps a list on arr for pop", () => {
        expectTypeOf(dispatch(Arr.pop, Obj.pop)(list)).toEqualTypeOf(
            Arr.pop(list),
        );
    });

    it("routes a record to obj for shift", () => {
        expectTypeOf(dispatch(Arr.shift, Obj.shift)(rec)).toEqualTypeOf(
            Obj.shift(rec),
        );
    });

    it("keeps a list on arr for shift", () => {
        expectTypeOf(dispatch(Arr.shift, Obj.shift)(list)).toEqualTypeOf(
            Arr.shift(list),
        );
    });

    it("keeps a list on arr for union and from", () => {
        expectTypeOf(dispatch(Arr.union, Obj.union)(list, list)).toEqualTypeOf(
            Arr.union(list, list),
        );
        expectTypeOf(dispatch(Arr.from, Obj.from)(list)).toEqualTypeOf(
            Arr.from(list),
        );
    });
});
