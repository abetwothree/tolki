import * as Arr from "@tolki/arr";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

/** Mirrors `data`'s dispatch so `arr`'s row shape is pinned where it is decided. */
type AnyFn = (...args: never[]) => unknown;
declare function dispatch<A extends AnyFn, O extends AnyFn>(a: A, o: O): A & O;

const rec = { a: 1, b: 2, c: 3 };
const recB = { d: 4 };
const list = [1, 2, 3];
const nestedRec = { a: [1], b: [2] };
const nestedList = [[1], [2]];
const recOfRecords = { a: { id: "x" }, b: { id: "y" } };
const listOfRecords = [{ id: "x" }, { id: "y" }];
const recOfLists = { a: [1, 2], b: [3, 4] };
const listOfLists = [
    [1, 2],
    [3, 4],
];
const dimRecA = { a: [1] };
const dimRecB = { b: ["x"] };
const dimListA = [1, 2];
const dimListB = ["x"];
const key = "a";
const idx = 0;
const one = 1;
const zero = 0;
const nine = 9;
const size = 2;
const glue = ", ";
const prefix = "p_";
const idKey = "id";
const idKeys = ["id"];
const truthy = () => true;
const toOne = () => 1;
const toRecord = () => ({ k: 1 });

describe("arr rows leave keyed data to obj", () => {
    it("routes a record to obj for add", () => {
        expectTypeOf(dispatch(Arr.add, Obj.add)(rec, key, nine)).toEqualTypeOf(
            Obj.add(rec, key, nine),
        );
    });

    it("keeps a list on arr for add", () => {
        expectTypeOf(dispatch(Arr.add, Obj.add)(list, idx, nine)).toEqualTypeOf(
            Arr.add(list, idx, nine),
        );
    });

    it("rejects a record on arr for add", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.add(rec, key, nine);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.add(rec, idx, nine);
    });

    it("routes a record to obj for boolean", () => {
        expectTypeOf(
            dispatch(Arr.boolean, Obj.boolean)(rec, key),
        ).toEqualTypeOf(Obj.boolean(rec, key));
    });

    it("keeps a list on arr for boolean", () => {
        expectTypeOf(
            dispatch(Arr.boolean, Obj.boolean)(list, idx),
        ).toEqualTypeOf(Arr.boolean(list, idx));
    });

    it("rejects a record on arr for boolean", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.boolean(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.boolean(rec, idx);
    });

    it("routes a record to obj for chunk", () => {
        expectTypeOf(dispatch(Arr.chunk, Obj.chunk)(rec, size)).toEqualTypeOf(
            Obj.chunk(rec, size),
        );
    });

    it("keeps a list on arr for chunk", () => {
        expectTypeOf(dispatch(Arr.chunk, Obj.chunk)(list, size)).toEqualTypeOf(
            Arr.chunk(list, size),
        );
    });

    it("rejects a record on arr for chunk", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.chunk(rec, size);
    });

    it("routes a record to obj for chunkBy", () => {
        expectTypeOf(
            dispatch(Arr.chunkBy, Obj.chunkBy)(rec, key),
        ).toEqualTypeOf(Obj.chunkBy(rec, key));
    });

    it("keeps a list on arr for chunkBy", () => {
        expectTypeOf(
            dispatch(Arr.chunkBy, Obj.chunkBy)(list, key),
        ).toEqualTypeOf(Arr.chunkBy(list, key));
    });

    it("rejects a record on arr for chunkBy", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.chunkBy(rec, key);
    });

    it("routes a record to obj for chunkWhile", () => {
        expectTypeOf(
            dispatch(Arr.chunkWhile, Obj.chunkWhile)(rec, truthy),
        ).toEqualTypeOf(Obj.chunkWhile(rec, truthy));
    });

    it("keeps a list on arr for chunkWhile", () => {
        expectTypeOf(
            dispatch(Arr.chunkWhile, Obj.chunkWhile)(list, truthy),
        ).toEqualTypeOf(Arr.chunkWhile(list, truthy));
    });

    it("rejects a record on arr for chunkWhile", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.chunkWhile(rec, truthy);
    });

    it("routes a record to obj for collapse", () => {
        expectTypeOf(
            dispatch(Arr.collapse, Obj.collapse)(nestedRec),
        ).toEqualTypeOf(Obj.collapse(nestedRec));
    });

    it("keeps a list on arr for collapse", () => {
        expectTypeOf(
            dispatch(Arr.collapse, Obj.collapse)(nestedList),
        ).toEqualTypeOf(Arr.collapse(nestedList));
    });

    it("rejects a record on arr for collapse", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.collapse(nestedRec);
    });

    it("routes a record to obj for combine", () => {
        expectTypeOf(
            dispatch(Arr.combine, Obj.combine)(rec, rec),
        ).toEqualTypeOf(Obj.combine(rec, rec));
    });

    it("keeps a list on arr for combine", () => {
        expectTypeOf(
            dispatch(Arr.combine, Obj.combine)(list, list),
        ).toEqualTypeOf(Arr.combine(list, list));
    });

    it("rejects a record on arr for combine", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.combine(rec, rec);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.combine(rec, list);
    });

    it("routes a record to obj for contains", () => {
        expectTypeOf(
            dispatch(Arr.contains, Obj.contains)(rec, one),
        ).toEqualTypeOf(Obj.contains(rec, one));
    });

    it("keeps a list on arr for contains", () => {
        expectTypeOf(
            dispatch(Arr.contains, Obj.contains)(list, one),
        ).toEqualTypeOf(Arr.contains(list, one));
    });

    it("rejects a record on arr for contains", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.contains(rec, one);
    });

    it("routes a record to obj for crossJoin", () => {
        expectTypeOf(
            dispatch(Arr.crossJoin, Obj.crossJoin)(dimRecA, dimRecB),
        ).toEqualTypeOf(Obj.crossJoin(dimRecA, dimRecB));
    });

    it("keeps a list on arr for crossJoin", () => {
        expectTypeOf(
            dispatch(Arr.crossJoin, Obj.crossJoin)(dimListA, dimListB),
        ).toEqualTypeOf(Arr.crossJoin(dimListA, dimListB));
    });

    it("rejects a record on arr for crossJoin", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.crossJoin(dimRecA, dimRecB);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.crossJoin(dimRecA, dimListB);
    });

    it("routes a record to obj for diff", () => {
        expectTypeOf(dispatch(Arr.diff, Obj.diff)(rec, rec)).toEqualTypeOf(
            Obj.diff(rec, rec),
        );
    });

    it("keeps a list on arr for diff", () => {
        expectTypeOf(dispatch(Arr.diff, Obj.diff)(list, list)).toEqualTypeOf(
            Arr.diff(list, list),
        );
    });

    it("rejects a record on arr for diff", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.diff(rec, rec);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.diff(rec, list);
    });

    it("routes a record to obj for diffAssoc", () => {
        expectTypeOf(
            dispatch(Arr.diffAssoc, Obj.diffAssoc)(rec, rec),
        ).toEqualTypeOf(Obj.diffAssoc(rec, rec));
    });

    it("keeps a list on arr for diffAssoc", () => {
        expectTypeOf(
            dispatch(Arr.diffAssoc, Obj.diffAssoc)(list, list),
        ).toEqualTypeOf(Arr.diffAssoc(list, list));
    });

    it("rejects a record on arr for diffAssoc", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.diffAssoc(rec, rec);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.diffAssoc(rec, list);
    });

    it("routes a record to obj for divide", () => {
        expectTypeOf(dispatch(Arr.divide, Obj.divide)(rec)).toEqualTypeOf(
            Obj.divide(rec),
        );
    });

    it("keeps a list on arr for divide", () => {
        expectTypeOf(dispatch(Arr.divide, Obj.divide)(list)).toEqualTypeOf(
            Arr.divide(list),
        );
    });

    it("rejects a record on arr for divide", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.divide(rec);
    });

    it("routes a record to obj for dot", () => {
        expectTypeOf(dispatch(Arr.dot, Obj.dot)(rec)).toEqualTypeOf(
            Obj.dot(rec),
        );
    });

    it("keeps a list on arr for dot", () => {
        expectTypeOf(dispatch(Arr.dot, Obj.dot)(list)).toEqualTypeOf(
            Arr.dot(list),
        );
    });

    it("rejects a record on arr for dot", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.dot(rec);
    });

    it("routes a record to obj for every", () => {
        expectTypeOf(dispatch(Arr.every, Obj.every)(rec, truthy)).toEqualTypeOf(
            Obj.every(rec, truthy),
        );
    });

    it("keeps a list on arr for every", () => {
        expectTypeOf(
            dispatch(Arr.every, Obj.every)(list, truthy),
        ).toEqualTypeOf(Arr.every(list, truthy));
    });

    it("rejects a record on arr for every", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.every(rec, truthy);
    });

    it("routes a record to obj for except", () => {
        expectTypeOf(dispatch(Arr.except, Obj.except)(rec, key)).toEqualTypeOf(
            Obj.except(rec, key),
        );
    });

    it("keeps a list on arr for except", () => {
        expectTypeOf(dispatch(Arr.except, Obj.except)(list, idx)).toEqualTypeOf(
            Arr.except(list, idx),
        );
    });

    it("rejects a record on arr for except", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.except(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.except(rec, idx);
    });

    it("routes a record to obj for exceptValues", () => {
        expectTypeOf(
            dispatch(Arr.exceptValues, Obj.exceptValues)(rec, one),
        ).toEqualTypeOf(Obj.exceptValues(rec, one));
    });

    it("keeps a list on arr for exceptValues", () => {
        expectTypeOf(
            dispatch(Arr.exceptValues, Obj.exceptValues)(list, one),
        ).toEqualTypeOf(Arr.exceptValues(list, one));
    });

    it("rejects a record on arr for exceptValues", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.exceptValues(rec, one);
    });

    it("routes a record to obj for exists", () => {
        expectTypeOf(dispatch(Arr.exists, Obj.exists)(rec, key)).toEqualTypeOf(
            Obj.exists(rec, key),
        );
    });

    it("keeps a list on arr for exists", () => {
        expectTypeOf(dispatch(Arr.exists, Obj.exists)(list, idx)).toEqualTypeOf(
            Arr.exists(list, idx),
        );
    });

    it("rejects a record on arr for exists", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.exists(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.exists(rec, idx);
    });

    it("routes a record to obj for filter", () => {
        expectTypeOf(
            dispatch(Arr.filter, Obj.filter)(rec, truthy),
        ).toEqualTypeOf(Obj.filter(rec, truthy));
    });

    it("keeps a list on arr for filter", () => {
        expectTypeOf(
            dispatch(Arr.filter, Obj.filter)(list, truthy),
        ).toEqualTypeOf(Arr.filter(list, truthy));
    });

    it("rejects a record on arr for filter", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.filter(rec, truthy);
    });

    it("routes a record to obj for first", () => {
        expectTypeOf(dispatch(Arr.first, Obj.first)(rec)).toEqualTypeOf(
            Obj.first(rec),
        );
    });

    it("keeps a list on arr for first", () => {
        expectTypeOf(dispatch(Arr.first, Obj.first)(list)).toEqualTypeOf(
            Arr.first(list),
        );
    });

    it("rejects a record on arr for first", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.first(rec);
    });

    it("routes a record to obj for flatten", () => {
        expectTypeOf(dispatch(Arr.flatten, Obj.flatten)(rec)).toEqualTypeOf(
            Obj.flatten(rec),
        );
    });

    it("keeps a list on arr for flatten", () => {
        expectTypeOf(dispatch(Arr.flatten, Obj.flatten)(list)).toEqualTypeOf(
            Arr.flatten(list),
        );
    });

    it("rejects a record on arr for flatten", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.flatten(rec);
    });

    it("routes a record to obj for flip", () => {
        expectTypeOf(dispatch(Arr.flip, Obj.flip)(rec)).toEqualTypeOf(
            Obj.flip(rec),
        );
    });

    it("keeps a list on arr for flip", () => {
        expectTypeOf(dispatch(Arr.flip, Obj.flip)(list)).toEqualTypeOf(
            Arr.flip(list),
        );
    });

    it("rejects a record on arr for flip", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.flip(rec);
    });

    it("routes a record to obj for float", () => {
        expectTypeOf(dispatch(Arr.float, Obj.float)(rec, key)).toEqualTypeOf(
            Obj.float(rec, key),
        );
    });

    it("keeps a list on arr for float", () => {
        expectTypeOf(dispatch(Arr.float, Obj.float)(list, idx)).toEqualTypeOf(
            Arr.float(list, idx),
        );
    });

    it("rejects a record on arr for float", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.float(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.float(rec, idx);
    });

    it("routes a record to obj for forget", () => {
        expectTypeOf(dispatch(Arr.forget, Obj.forget)(rec, key)).toEqualTypeOf(
            Obj.forget(rec, key),
        );
    });

    it("keeps a list on arr for forget", () => {
        expectTypeOf(dispatch(Arr.forget, Obj.forget)(list, idx)).toEqualTypeOf(
            Arr.forget(list, idx),
        );
    });

    it("rejects a record on arr for forget", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.forget(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.forget(rec, idx);
    });

    it("routes a record to obj for from", () => {
        expectTypeOf(dispatch(Arr.from, Obj.from)(rec)).toEqualTypeOf(
            Obj.from(rec),
        );
    });

    it("keeps a list on arr for from", () => {
        expectTypeOf(dispatch(Arr.from, Obj.from)(list)).toEqualTypeOf(
            Arr.from(list),
        );
    });

    it("rejects a record on arr for from", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.from(rec);
    });

    it("routes a record to obj for get", () => {
        expectTypeOf(dispatch(Arr.get, Obj.get)(rec, key)).toEqualTypeOf(
            Obj.get(rec, key),
        );
    });

    it("keeps a list on arr for get", () => {
        expectTypeOf(dispatch(Arr.get, Obj.get)(list, idx)).toEqualTypeOf(
            Arr.get(list, idx),
        );
    });

    it("rejects a record on arr for get", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.get(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.get(rec, idx);
    });

    it("routes a record to obj for has", () => {
        expectTypeOf(dispatch(Arr.has, Obj.has)(rec, key)).toEqualTypeOf(
            Obj.has(rec, key),
        );
    });

    it("keeps a list on arr for has", () => {
        expectTypeOf(dispatch(Arr.has, Obj.has)(list, idx)).toEqualTypeOf(
            Arr.has(list, idx),
        );
    });

    it("rejects a record on arr for has", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.has(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.has(rec, idx);
    });

    it("routes a record to obj for hasAll", () => {
        expectTypeOf(dispatch(Arr.hasAll, Obj.hasAll)(rec, key)).toEqualTypeOf(
            Obj.hasAll(rec, key),
        );
    });

    it("keeps a list on arr for hasAll", () => {
        expectTypeOf(dispatch(Arr.hasAll, Obj.hasAll)(list, idx)).toEqualTypeOf(
            Arr.hasAll(list, idx),
        );
    });

    it("rejects a record on arr for hasAll", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.hasAll(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.hasAll(rec, idx);
    });

    it("routes a record to obj for hasAny", () => {
        expectTypeOf(dispatch(Arr.hasAny, Obj.hasAny)(rec, key)).toEqualTypeOf(
            Obj.hasAny(rec, key),
        );
    });

    it("keeps a list on arr for hasAny", () => {
        expectTypeOf(dispatch(Arr.hasAny, Obj.hasAny)(list, idx)).toEqualTypeOf(
            Arr.hasAny(list, idx),
        );
    });

    it("rejects a record on arr for hasAny", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.hasAny(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.hasAny(rec, idx);
    });

    it("routes a record to obj for integer", () => {
        expectTypeOf(
            dispatch(Arr.integer, Obj.integer)(rec, key),
        ).toEqualTypeOf(Obj.integer(rec, key));
    });

    it("keeps a list on arr for integer", () => {
        expectTypeOf(
            dispatch(Arr.integer, Obj.integer)(list, idx),
        ).toEqualTypeOf(Arr.integer(list, idx));
    });

    it("rejects a record on arr for integer", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.integer(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.integer(rec, idx);
    });

    it("routes a record to obj for intersect", () => {
        expectTypeOf(
            dispatch(Arr.intersect, Obj.intersect)(rec, rec),
        ).toEqualTypeOf(Obj.intersect(rec, rec));
    });

    it("keeps a list on arr for intersect", () => {
        expectTypeOf(
            dispatch(Arr.intersect, Obj.intersect)(list, list),
        ).toEqualTypeOf(Arr.intersect(list, list));
    });

    it("rejects a record on arr for intersect", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.intersect(rec, rec);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.intersect(rec, list);
    });

    it("routes a record to obj for intersectAssoc", () => {
        expectTypeOf(
            dispatch(Arr.intersectAssoc, Obj.intersectAssoc)(rec, rec),
        ).toEqualTypeOf(Obj.intersectAssoc(rec, rec));
    });

    it("keeps a list on arr for intersectAssoc", () => {
        expectTypeOf(
            dispatch(Arr.intersectAssoc, Obj.intersectAssoc)(list, list),
        ).toEqualTypeOf(Arr.intersectAssoc(list, list));
    });

    it("rejects a record on arr for intersectAssoc", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.intersectAssoc(rec, rec);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.intersectAssoc(rec, list);
    });

    it("routes a record to obj for intersectAssocUsing", () => {
        expectTypeOf(
            dispatch(Arr.intersectAssocUsing, Obj.intersectAssocUsing)(
                rec,
                rec,
                truthy,
            ),
        ).toEqualTypeOf(Obj.intersectAssocUsing(rec, rec, truthy));
    });

    it("keeps a list on arr for intersectAssocUsing", () => {
        expectTypeOf(
            dispatch(Arr.intersectAssocUsing, Obj.intersectAssocUsing)(
                list,
                list,
                truthy,
            ),
        ).toEqualTypeOf(Arr.intersectAssocUsing(list, list, truthy));
    });

    it("rejects a record on arr for intersectAssocUsing", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.intersectAssocUsing(rec, rec, truthy);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.intersectAssocUsing(rec, list, truthy);
    });

    it("routes a record to obj for intersectByKeys", () => {
        expectTypeOf(
            dispatch(Arr.intersectByKeys, Obj.intersectByKeys)(rec, rec),
        ).toEqualTypeOf(Obj.intersectByKeys(rec, rec));
    });

    it("keeps a list on arr for intersectByKeys", () => {
        expectTypeOf(
            dispatch(Arr.intersectByKeys, Obj.intersectByKeys)(list, list),
        ).toEqualTypeOf(Arr.intersectByKeys(list, list));
    });

    it("rejects a record on arr for intersectByKeys", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.intersectByKeys(rec, rec);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.intersectByKeys(rec, list);
    });

    it("routes a record to obj for join", () => {
        expectTypeOf(dispatch(Arr.join, Obj.join)(rec, glue)).toEqualTypeOf(
            Obj.join(rec, glue),
        );
    });

    it("keeps a list on arr for join", () => {
        expectTypeOf(dispatch(Arr.join, Obj.join)(list, glue)).toEqualTypeOf(
            Arr.join(list, glue),
        );
    });

    it("rejects a record on arr for join", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.join(rec, glue);
    });

    it("routes a record to obj for keyBy", () => {
        expectTypeOf(
            dispatch(Arr.keyBy, Obj.keyBy)(recOfRecords, idKey),
        ).toEqualTypeOf(Obj.keyBy(recOfRecords, idKey));
    });

    it("keeps a list on arr for keyBy", () => {
        expectTypeOf(
            dispatch(Arr.keyBy, Obj.keyBy)(listOfRecords, idKey),
        ).toEqualTypeOf(Arr.keyBy(listOfRecords, idKey));
    });

    it("rejects a record on arr for keyBy", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.keyBy(recOfRecords, idKey);
    });

    it("routes a record to obj for keys", () => {
        expectTypeOf(dispatch(Arr.keys, Obj.keys)(rec)).toEqualTypeOf(
            Obj.keys(rec),
        );
    });

    it("keeps a list on arr for keys", () => {
        expectTypeOf(dispatch(Arr.keys, Obj.keys)(list)).toEqualTypeOf(
            Arr.keys(list),
        );
    });

    it("rejects a record on arr for keys", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.keys(rec);
    });

    it("routes a record to obj for last", () => {
        expectTypeOf(dispatch(Arr.last, Obj.last)(rec)).toEqualTypeOf(
            Obj.last(rec),
        );
    });

    it("keeps a list on arr for last", () => {
        expectTypeOf(dispatch(Arr.last, Obj.last)(list)).toEqualTypeOf(
            Arr.last(list),
        );
    });

    it("rejects a record on arr for last", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.last(rec);
    });

    it("routes a record to obj for map", () => {
        expectTypeOf(dispatch(Arr.map, Obj.map)(rec, toOne)).toEqualTypeOf(
            Obj.map(rec, toOne),
        );
    });

    it("keeps a list on arr for map", () => {
        expectTypeOf(dispatch(Arr.map, Obj.map)(list, toOne)).toEqualTypeOf(
            Arr.map(list, toOne),
        );
    });

    it("rejects a record on arr for map", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.map(rec, toOne);
    });

    it("routes a record to obj for mapSpread", () => {
        expectTypeOf(
            dispatch(Arr.mapSpread, Obj.mapSpread)(recOfLists, toOne),
        ).toEqualTypeOf(Obj.mapSpread(recOfLists, toOne));
    });

    it("keeps a list on arr for mapSpread", () => {
        expectTypeOf(
            dispatch(Arr.mapSpread, Obj.mapSpread)(listOfLists, toOne),
        ).toEqualTypeOf(Arr.mapSpread(listOfLists, toOne));
    });

    it("rejects a record on arr for mapSpread", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.mapSpread(recOfLists, toOne);
    });

    it("routes a record to obj for mapWithKeys", () => {
        expectTypeOf(
            dispatch(Arr.mapWithKeys, Obj.mapWithKeys)(rec, toRecord),
        ).toEqualTypeOf(Obj.mapWithKeys(rec, toRecord));
    });

    it("keeps a list on arr for mapWithKeys", () => {
        expectTypeOf(
            dispatch(Arr.mapWithKeys, Obj.mapWithKeys)(list, toRecord),
        ).toEqualTypeOf(Arr.mapWithKeys(list, toRecord));
    });

    it("rejects a record on arr for mapWithKeys", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.mapWithKeys(rec, toRecord);
    });

    it("routes a record to obj for only", () => {
        expectTypeOf(dispatch(Arr.only, Obj.only)(rec, key)).toEqualTypeOf(
            Obj.only(rec, key),
        );
    });

    it("keeps a list on arr for only", () => {
        expectTypeOf(dispatch(Arr.only, Obj.only)(list, idx)).toEqualTypeOf(
            Arr.only(list, idx),
        );
    });

    it("rejects a record on arr for only", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.only(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.only(rec, idx);
    });

    it("routes a record to obj for onlyValues", () => {
        expectTypeOf(
            dispatch(Arr.onlyValues, Obj.onlyValues)(rec, one),
        ).toEqualTypeOf(Obj.onlyValues(rec, one));
    });

    it("keeps a list on arr for onlyValues", () => {
        expectTypeOf(
            dispatch(Arr.onlyValues, Obj.onlyValues)(list, one),
        ).toEqualTypeOf(Arr.onlyValues(list, one));
    });

    it("rejects a record on arr for onlyValues", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.onlyValues(rec, one);
    });

    it("routes a record to obj for pad", () => {
        expectTypeOf(dispatch(Arr.pad, Obj.pad)(rec, size, zero)).toEqualTypeOf(
            Obj.pad(rec, size, zero),
        );
    });

    it("keeps a list on arr for pad", () => {
        expectTypeOf(
            dispatch(Arr.pad, Obj.pad)(list, size, zero),
        ).toEqualTypeOf(Arr.pad(list, size, zero));
    });

    it("rejects a record on arr for pad", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.pad(rec, size, zero);
    });

    it("routes a record to obj for partition", () => {
        expectTypeOf(
            dispatch(Arr.partition, Obj.partition)(rec, truthy),
        ).toEqualTypeOf(Obj.partition(rec, truthy));
    });

    it("keeps a list on arr for partition", () => {
        expectTypeOf(
            dispatch(Arr.partition, Obj.partition)(list, truthy),
        ).toEqualTypeOf(Arr.partition(list, truthy));
    });

    it("rejects a record on arr for partition", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.partition(rec, truthy);
    });

    it("routes a record to obj for pluck", () => {
        expectTypeOf(
            dispatch(Arr.pluck, Obj.pluck)(recOfRecords, idKey),
        ).toEqualTypeOf(Obj.pluck(recOfRecords, idKey));
    });

    it("keeps a list on arr for pluck", () => {
        expectTypeOf(
            dispatch(Arr.pluck, Obj.pluck)(listOfRecords, idKey),
        ).toEqualTypeOf(Arr.pluck(listOfRecords, idKey));
    });

    it("rejects a record on arr for pluck", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.pluck(recOfRecords, idKey);
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

    it("rejects a record on arr for pop", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.pop(rec);
    });

    it("routes a record to obj for prepend", () => {
        expectTypeOf(
            dispatch(Arr.prepend, Obj.prepend)(rec, one),
        ).toEqualTypeOf(Obj.prepend(rec, one));
    });

    it("keeps a list on arr for prepend", () => {
        expectTypeOf(
            dispatch(Arr.prepend, Obj.prepend)(list, one),
        ).toEqualTypeOf(Arr.prepend(list, one));
    });

    it("rejects a record on arr for prepend", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.prepend(rec, one);
    });

    it("routes a record to obj for prependKeysWith", () => {
        expectTypeOf(
            dispatch(Arr.prependKeysWith, Obj.prependKeysWith)(rec, prefix),
        ).toEqualTypeOf(Obj.prependKeysWith(rec, prefix));
    });

    it("keeps a list on arr for prependKeysWith", () => {
        expectTypeOf(
            dispatch(Arr.prependKeysWith, Obj.prependKeysWith)(list, prefix),
        ).toEqualTypeOf(Arr.prependKeysWith(list, prefix));
    });

    it("rejects a record on arr for prependKeysWith", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.prependKeysWith(rec, prefix);
    });

    it("routes a record to obj for pull", () => {
        expectTypeOf(dispatch(Arr.pull, Obj.pull)(rec, key)).toEqualTypeOf(
            Obj.pull(rec, key),
        );
    });

    it("keeps a list on arr for pull", () => {
        expectTypeOf(dispatch(Arr.pull, Obj.pull)(list, idx)).toEqualTypeOf(
            Arr.pull(list, idx),
        );
    });

    it("rejects a record on arr for pull", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.pull(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.pull(rec, idx);
    });

    it("routes a record to obj for push", () => {
        expectTypeOf(
            dispatch(Arr.push, Obj.push)(rec, key, nine),
        ).toEqualTypeOf(Obj.push(rec, key, nine));
    });

    it("keeps a list on arr for push", () => {
        expectTypeOf(
            dispatch(Arr.push, Obj.push)(list, idx, nine),
        ).toEqualTypeOf(Arr.push(list, idx, nine));
    });

    it("rejects a record on arr for push", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.push(rec, key, nine);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.push(rec, idx, nine);
    });

    it("routes a record to obj for query", () => {
        expectTypeOf(dispatch(Arr.query, Obj.query)(rec)).toEqualTypeOf(
            Obj.query(rec),
        );
    });

    it("keeps a list on arr for query", () => {
        expectTypeOf(dispatch(Arr.query, Obj.query)(list)).toEqualTypeOf(
            Arr.query(list),
        );
    });

    it("rejects a record on arr for query", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.query(rec);
    });

    it("routes a record to obj for random", () => {
        expectTypeOf(dispatch(Arr.random, Obj.random)(rec)).toEqualTypeOf(
            Obj.random(rec),
        );
    });

    it("keeps a list on arr for random", () => {
        expectTypeOf(dispatch(Arr.random, Obj.random)(list)).toEqualTypeOf(
            Arr.random(list),
        );
    });

    it("rejects a record on arr for random", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.random(rec);
    });

    it("routes a record to obj for reject", () => {
        expectTypeOf(
            dispatch(Arr.reject, Obj.reject)(rec, truthy),
        ).toEqualTypeOf(Obj.reject(rec, truthy));
    });

    it("keeps a list on arr for reject", () => {
        expectTypeOf(
            dispatch(Arr.reject, Obj.reject)(list, truthy),
        ).toEqualTypeOf(Arr.reject(list, truthy));
    });

    it("rejects a record on arr for reject", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.reject(rec, truthy);
    });

    it("routes a record to obj for reverse", () => {
        expectTypeOf(dispatch(Arr.reverse, Obj.reverse)(rec)).toEqualTypeOf(
            Obj.reverse(rec),
        );
    });

    it("keeps a list on arr for reverse", () => {
        expectTypeOf(dispatch(Arr.reverse, Obj.reverse)(list)).toEqualTypeOf(
            Arr.reverse(list),
        );
    });

    it("rejects a record on arr for reverse", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.reverse(rec);
    });

    it("routes a record to obj for select", () => {
        expectTypeOf(
            dispatch(Arr.select, Obj.select)(recOfRecords, idKeys),
        ).toEqualTypeOf(Obj.select(recOfRecords, idKeys));
    });

    it("keeps a list on arr for select", () => {
        expectTypeOf(
            dispatch(Arr.select, Obj.select)(listOfRecords, idKeys),
        ).toEqualTypeOf(Arr.select(listOfRecords, idKeys));
    });

    it("rejects a record on arr for select", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.select(recOfRecords, idKeys);
    });

    it("routes a record to obj for set", () => {
        expectTypeOf(dispatch(Arr.set, Obj.set)(rec, key, nine)).toEqualTypeOf(
            Obj.set(rec, key, nine),
        );
    });

    it("keeps a list on arr for set", () => {
        expectTypeOf(dispatch(Arr.set, Obj.set)(list, idx, nine)).toEqualTypeOf(
            Arr.set(list, idx, nine),
        );
    });

    it("rejects a record on arr for set", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.set(rec, key, nine);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.set(rec, idx, nine);
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

    it("rejects a record on arr for shift", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.shift(rec);
    });

    it("routes a record to obj for shuffle", () => {
        expectTypeOf(dispatch(Arr.shuffle, Obj.shuffle)(rec)).toEqualTypeOf(
            Obj.shuffle(rec),
        );
    });

    it("keeps a list on arr for shuffle", () => {
        expectTypeOf(dispatch(Arr.shuffle, Obj.shuffle)(list)).toEqualTypeOf(
            Arr.shuffle(list),
        );
    });

    it("rejects a record on arr for shuffle", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.shuffle(rec);
    });

    it("routes a record to obj for slice", () => {
        expectTypeOf(dispatch(Arr.slice, Obj.slice)(rec, one)).toEqualTypeOf(
            Obj.slice(rec, one),
        );
    });

    it("keeps a list on arr for slice", () => {
        expectTypeOf(dispatch(Arr.slice, Obj.slice)(list, one)).toEqualTypeOf(
            Arr.slice(list, one),
        );
    });

    it("rejects a record on arr for slice", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.slice(rec, one);
    });

    it("routes a record to obj for sole", () => {
        expectTypeOf(dispatch(Arr.sole, Obj.sole)(rec)).toEqualTypeOf(
            Obj.sole(rec),
        );
    });

    it("keeps a list on arr for sole", () => {
        expectTypeOf(dispatch(Arr.sole, Obj.sole)(list)).toEqualTypeOf(
            Arr.sole(list),
        );
    });

    it("rejects a record on arr for sole", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.sole(rec);
    });

    it("routes a record to obj for some", () => {
        expectTypeOf(dispatch(Arr.some, Obj.some)(rec, truthy)).toEqualTypeOf(
            Obj.some(rec, truthy),
        );
    });

    it("keeps a list on arr for some", () => {
        expectTypeOf(dispatch(Arr.some, Obj.some)(list, truthy)).toEqualTypeOf(
            Arr.some(list, truthy),
        );
    });

    it("rejects a record on arr for some", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.some(rec, truthy);
    });

    it("routes a record to obj for sort", () => {
        expectTypeOf(dispatch(Arr.sort, Obj.sort)(rec)).toEqualTypeOf(
            Obj.sort(rec),
        );
    });

    it("keeps a list on arr for sort", () => {
        expectTypeOf(dispatch(Arr.sort, Obj.sort)(list)).toEqualTypeOf(
            Arr.sort(list),
        );
    });

    it("rejects a record on arr for sort", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.sort(rec);
    });

    it("routes a record to obj for sortDesc", () => {
        expectTypeOf(dispatch(Arr.sortDesc, Obj.sortDesc)(rec)).toEqualTypeOf(
            Obj.sortDesc(rec),
        );
    });

    it("keeps a list on arr for sortDesc", () => {
        expectTypeOf(dispatch(Arr.sortDesc, Obj.sortDesc)(list)).toEqualTypeOf(
            Arr.sortDesc(list),
        );
    });

    it("rejects a record on arr for sortDesc", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.sortDesc(rec);
    });

    it("routes a record to obj for sortRecursive", () => {
        expectTypeOf(
            dispatch(Arr.sortRecursive, Obj.sortRecursive)(rec),
        ).toEqualTypeOf(Obj.sortRecursive(rec));
    });

    it("keeps a list on arr for sortRecursive", () => {
        expectTypeOf(
            dispatch(Arr.sortRecursive, Obj.sortRecursive)(list),
        ).toEqualTypeOf(Arr.sortRecursive(list));
    });

    it("rejects a record on arr for sortRecursive", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.sortRecursive(rec);
    });

    it("routes a record to obj for sortRecursiveDesc", () => {
        expectTypeOf(
            dispatch(Arr.sortRecursiveDesc, Obj.sortRecursiveDesc)(rec),
        ).toEqualTypeOf(Obj.sortRecursiveDesc(rec));
    });

    it("keeps a list on arr for sortRecursiveDesc", () => {
        expectTypeOf(
            dispatch(Arr.sortRecursiveDesc, Obj.sortRecursiveDesc)(list),
        ).toEqualTypeOf(Arr.sortRecursiveDesc(list));
    });

    it("rejects a record on arr for sortRecursiveDesc", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.sortRecursiveDesc(rec);
    });

    it("routes a record to obj for splice", () => {
        expectTypeOf(dispatch(Arr.splice, Obj.splice)(rec, one)).toEqualTypeOf(
            Obj.splice(rec, one),
        );
    });

    it("keeps a list on arr for splice", () => {
        expectTypeOf(dispatch(Arr.splice, Obj.splice)(list, one)).toEqualTypeOf(
            Arr.splice(list, one),
        );
    });

    it("rejects a record on arr for splice", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.splice(rec, one);
    });

    it("routes a record to obj for string", () => {
        expectTypeOf(dispatch(Arr.string, Obj.string)(rec, key)).toEqualTypeOf(
            Obj.string(rec, key),
        );
    });

    it("keeps a list on arr for string", () => {
        expectTypeOf(dispatch(Arr.string, Obj.string)(list, idx)).toEqualTypeOf(
            Arr.string(list, idx),
        );
    });

    it("rejects a record on arr for string", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.string(rec, key);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.string(rec, idx);
    });

    it("routes a record to obj for take", () => {
        expectTypeOf(dispatch(Arr.take, Obj.take)(rec, size)).toEqualTypeOf(
            Obj.take(rec, size),
        );
    });

    it("keeps a list on arr for take", () => {
        expectTypeOf(dispatch(Arr.take, Obj.take)(list, size)).toEqualTypeOf(
            Arr.take(list, size),
        );
    });

    it("rejects a record on arr for take", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.take(rec, size);
    });

    it("routes a record to obj for toCssClasses", () => {
        expectTypeOf(
            dispatch(Arr.toCssClasses, Obj.toCssClasses)(rec),
        ).toEqualTypeOf(Obj.toCssClasses(rec));
    });

    it("keeps a list on arr for toCssClasses", () => {
        expectTypeOf(
            dispatch(Arr.toCssClasses, Obj.toCssClasses)(list),
        ).toEqualTypeOf(Arr.toCssClasses(list));
    });

    it("rejects a record on arr for toCssClasses", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.toCssClasses(rec);
    });

    it("routes a record to obj for toCssStyles", () => {
        expectTypeOf(
            dispatch(Arr.toCssStyles, Obj.toCssStyles)(rec),
        ).toEqualTypeOf(Obj.toCssStyles(rec));
    });

    it("keeps a list on arr for toCssStyles", () => {
        expectTypeOf(
            dispatch(Arr.toCssStyles, Obj.toCssStyles)(list),
        ).toEqualTypeOf(Arr.toCssStyles(list));
    });

    it("rejects a record on arr for toCssStyles", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.toCssStyles(rec);
    });

    it("routes a record to obj for union", () => {
        expectTypeOf(dispatch(Arr.union, Obj.union)(rec, rec)).toEqualTypeOf(
            Obj.union(rec, rec),
        );
    });

    it("keeps a list on arr for union", () => {
        expectTypeOf(dispatch(Arr.union, Obj.union)(list, list)).toEqualTypeOf(
            Arr.union(list, list),
        );
    });

    it("rejects a record on arr for union", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.union(rec, rec);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.union(rec, list);
    });

    it("routes a record to obj for unshift", () => {
        expectTypeOf(
            dispatch(Arr.unshift, Obj.unshift)(rec, recB),
        ).toEqualTypeOf(Obj.unshift(rec, recB));
    });

    it("keeps a list on arr for unshift", () => {
        expectTypeOf(
            dispatch(Arr.unshift, Obj.unshift)(list, nine),
        ).toEqualTypeOf(Arr.unshift(list, nine));
    });

    it("rejects a record on arr for unshift", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.unshift(rec, recB);
        // @ts-expect-error - arr-valid tail: only the record can be the error
        Arr.unshift(rec, nine);
    });

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

    it("rejects a record on arr for values", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.values(rec);
    });

    it("routes a record to obj for where", () => {
        expectTypeOf(dispatch(Arr.where, Obj.where)(rec, truthy)).toEqualTypeOf(
            Obj.where(rec, truthy),
        );
    });

    it("keeps a list on arr for where", () => {
        expectTypeOf(
            dispatch(Arr.where, Obj.where)(list, truthy),
        ).toEqualTypeOf(Arr.where(list, truthy));
    });

    it("rejects a record on arr for where", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.where(rec, truthy);
    });

    it("routes a record to obj for whereNotNull", () => {
        expectTypeOf(
            dispatch(Arr.whereNotNull, Obj.whereNotNull)(rec),
        ).toEqualTypeOf(Obj.whereNotNull(rec));
    });

    it("keeps a list on arr for whereNotNull", () => {
        expectTypeOf(
            dispatch(Arr.whereNotNull, Obj.whereNotNull)(list),
        ).toEqualTypeOf(Arr.whereNotNull(list));
    });

    it("rejects a record on arr for whereNotNull", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.whereNotNull(rec);
    });
});
