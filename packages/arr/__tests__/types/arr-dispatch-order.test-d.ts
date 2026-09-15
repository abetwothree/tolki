import * as Arr from "@tolki/arr";
import * as Obj from "@tolki/obj";
import type { PathKey } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

// `data` is the consumer whose dispatch decides these rows, so the sweep pins the real
// helper rather than a local mirror of it.
import { dispatch } from "../../../data/src/dispatch";

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

interface Settings {
    a: number;
    b: number;
}
declare const settings: Settings;
class Box {
    a = 1;
    b = 2;
}
declare const box: Box;

interface NestedSettings {
    a: number[];
    b: number[];
}
declare const nestedSettings: NestedSettings;
class NestedBox {
    a = [1];
    b = [2];
}
declare const nestedBox: NestedBox;

interface RecordsSettings {
    a: { id: string };
    b: { id: string };
}
declare const recordsSettings: RecordsSettings;
class RecordsBox {
    a = { id: "x" };
    b = { id: "y" };
}
declare const recordsBox: RecordsBox;

interface DimSettings {
    a: number[];
}
declare const dimSettings: DimSettings;
class DimBox {
    a = [1];
}
declare const dimBox: DimBox;

const numberMap = new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
]);
const listMap = new Map([
    ["a", [1]],
    ["b", [2]],
]);
const recordMap = new Map([
    ["a", { id: "x" }],
    ["b", { id: "y" }],
]);
const dimMap = new Map([["a", [1]]]);
// Task C2b gave `dispatch` a Map row: `toKeyedData` swaps a Map for the record obj walks,
// and nothing in the type said so. A conditional over an overloaded delegate resolves only its
// last signature, so that row answers with obj's widest overload — what these fixtures reach.
declare const opaque: unknown;
declare const opaqueKey: PathKey;
declare const opaqueFn: () => unknown;
declare const opaqueRecFn: () => Record<PropertyKey, unknown>;
declare const opaqueTuple: unknown[];
declare const opaqueObjects: object[];

describe("arr rows leave keyed data to obj", () => {
    it("routes a record to obj for add", () => {
        expectTypeOf(dispatch(Arr.add, Obj.add)(rec, key, nine)).toEqualTypeOf(
            Obj.add(rec, key, nine),
        );
    });

    it("routes an interface-typed object to obj for add", () => {
        expectTypeOf(
            dispatch(Arr.add, Obj.add)(settings, key, nine),
        ).toEqualTypeOf(Obj.add(settings, key, nine));
    });

    it("routes a class instance to obj for add", () => {
        expectTypeOf(dispatch(Arr.add, Obj.add)(box, key, nine)).toEqualTypeOf(
            Obj.add(box, key, nine),
        );
    });

    it("routes a Map to obj for add", () => {
        const widest = Obj.add(opaque, key, nine);
        expectTypeOf(
            dispatch(Arr.add, Obj.add)(numberMap, key, nine),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for add", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.add(numberMap, key, nine);
    });

    // `item` pairs arr's `arrayItem` with obj's `objectItem`; the naming is why Part B's
    // arrX/objX sweep missed it, leaving arr's catch-all wide enough to swallow a record.
    it("routes a record to obj for item", () => {
        expectTypeOf(
            dispatch(Arr.arrayItem, Obj.objectItem)(recOfRecords, key),
        ).toEqualTypeOf(Obj.objectItem(recOfRecords, key));
    });

    it("routes an interface-typed object to obj for item", () => {
        expectTypeOf(
            dispatch(Arr.arrayItem, Obj.objectItem)(recordsSettings, key),
        ).toEqualTypeOf(Obj.objectItem(recordsSettings, key));
    });

    it("routes a class instance to obj for item", () => {
        expectTypeOf(
            dispatch(Arr.arrayItem, Obj.objectItem)(recordsBox, key),
        ).toEqualTypeOf(Obj.objectItem(recordsBox, key));
    });

    it("routes a Map to obj for item", () => {
        const widest = Obj.objectItem(opaque, key);
        expectTypeOf(
            dispatch(Arr.arrayItem, Obj.objectItem)(recordMap, key),
        ).toEqualTypeOf<typeof widest>();
    });

    it("keeps a list on arr for item", () => {
        expectTypeOf(
            dispatch(Arr.arrayItem, Obj.objectItem)(nestedList, idx),
        ).toEqualTypeOf(Arr.arrayItem(nestedList, idx));
    });

    it("rejects a record on arr for item", () => {
        // @ts-expect-error - arr must be ineligible for the dispatched call
        Arr.arrayItem(recOfRecords, key);
    });

    it("rejects a Map on arr for item", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.arrayItem(recordMap, key);
    });

    it("rejects an interface and a class on arr for item", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.arrayItem(recordsSettings, key);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.arrayItem(recordsBox, key);
    });

    it("routes a record to obj for boolean", () => {
        expectTypeOf(
            dispatch(Arr.boolean, Obj.boolean)(rec, key),
        ).toEqualTypeOf(Obj.boolean(rec, key));
    });

    it("routes an interface-typed object to obj for boolean", () => {
        expectTypeOf(
            dispatch(Arr.boolean, Obj.boolean)(settings, key),
        ).toEqualTypeOf(Obj.boolean(settings, key));
    });

    it("routes a class instance to obj for boolean", () => {
        expectTypeOf(
            dispatch(Arr.boolean, Obj.boolean)(box, key),
        ).toEqualTypeOf(Obj.boolean(box, key));
    });

    it("routes a Map to obj for boolean", () => {
        const widest = Obj.boolean(opaque, key);
        expectTypeOf(
            dispatch(Arr.boolean, Obj.boolean)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for boolean", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.boolean(numberMap, key);
    });

    it("rejects an interface and a class on arr for boolean", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.boolean(settings, key);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.boolean(box, key);
    });

    it("routes a record to obj for chunk", () => {
        expectTypeOf(dispatch(Arr.chunk, Obj.chunk)(rec, size)).toEqualTypeOf(
            Obj.chunk(rec, size),
        );
    });

    it("routes an interface-typed object to obj for chunk", () => {
        expectTypeOf(
            dispatch(Arr.chunk, Obj.chunk)(settings, size),
        ).toEqualTypeOf(Obj.chunk(settings, size));
    });

    it("routes a class instance to obj for chunk", () => {
        expectTypeOf(dispatch(Arr.chunk, Obj.chunk)(box, size)).toEqualTypeOf(
            Obj.chunk(box, size),
        );
    });

    it("routes a Map to obj for chunk", () => {
        const widest = Obj.chunk(opaque, size);
        expectTypeOf(
            dispatch(Arr.chunk, Obj.chunk)(numberMap, size),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for chunk", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.chunk(numberMap, size);
    });

    it("routes a record to obj for chunkBy", () => {
        expectTypeOf(
            dispatch(Arr.chunkBy, Obj.chunkBy)(rec, key),
        ).toEqualTypeOf(Obj.chunkBy(rec, key));
    });

    it("routes an interface-typed object to obj for chunkBy", () => {
        expectTypeOf(
            dispatch(Arr.chunkBy, Obj.chunkBy)(settings, key),
        ).toEqualTypeOf(Obj.chunkBy(settings, key));
    });

    it("routes a class instance to obj for chunkBy", () => {
        expectTypeOf(
            dispatch(Arr.chunkBy, Obj.chunkBy)(box, key),
        ).toEqualTypeOf(Obj.chunkBy(box, key));
    });

    it("routes a Map to obj for chunkBy", () => {
        const widest = Obj.chunkBy(opaque, key);
        expectTypeOf(
            dispatch(Arr.chunkBy, Obj.chunkBy)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for chunkBy", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.chunkBy(numberMap, key);
    });

    it("routes a record to obj for chunkWhile", () => {
        expectTypeOf(
            dispatch(Arr.chunkWhile, Obj.chunkWhile)(rec, truthy),
        ).toEqualTypeOf(Obj.chunkWhile(rec, truthy));
    });

    it("routes an interface-typed object to obj for chunkWhile", () => {
        expectTypeOf(
            dispatch(Arr.chunkWhile, Obj.chunkWhile)(settings, truthy),
        ).toEqualTypeOf(Obj.chunkWhile(settings, truthy));
    });

    it("routes a class instance to obj for chunkWhile", () => {
        expectTypeOf(
            dispatch(Arr.chunkWhile, Obj.chunkWhile)(box, truthy),
        ).toEqualTypeOf(Obj.chunkWhile(box, truthy));
    });

    it("routes a Map to obj for chunkWhile", () => {
        const widest = Obj.chunkWhile(opaque, truthy);
        expectTypeOf(
            dispatch(Arr.chunkWhile, Obj.chunkWhile)(numberMap, truthy),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for chunkWhile", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.chunkWhile(numberMap, truthy);
    });

    it("routes a record to obj for collapse", () => {
        expectTypeOf(
            dispatch(Arr.collapse, Obj.collapse)(nestedRec),
        ).toEqualTypeOf(Obj.collapse(nestedRec));
    });

    it("routes an interface-typed object to obj for collapse", () => {
        expectTypeOf(
            dispatch(Arr.collapse, Obj.collapse)(nestedSettings),
        ).toEqualTypeOf(Obj.collapse(nestedSettings));
    });

    it("routes a class instance to obj for collapse", () => {
        expectTypeOf(
            dispatch(Arr.collapse, Obj.collapse)(nestedBox),
        ).toEqualTypeOf(Obj.collapse(nestedBox));
    });

    it("routes a Map to obj for collapse", () => {
        const widest = Obj.collapse(opaque);
        expectTypeOf(
            dispatch(Arr.collapse, Obj.collapse)(listMap),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for collapse", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.collapse(listMap);
    });

    it("routes a record to obj for combine", () => {
        expectTypeOf(
            dispatch(Arr.combine, Obj.combine)(rec, rec),
        ).toEqualTypeOf(Obj.combine(rec, rec));
    });

    it("routes an interface-typed object to obj for combine", () => {
        expectTypeOf(
            dispatch(Arr.combine, Obj.combine)(settings, rec),
        ).toEqualTypeOf(Obj.combine(settings, rec));
    });

    it("routes a class instance to obj for combine", () => {
        expectTypeOf(
            dispatch(Arr.combine, Obj.combine)(box, rec),
        ).toEqualTypeOf(Obj.combine(box, rec));
    });

    it("routes a Map to obj for combine", () => {
        const widest = Obj.combine(opaque, rec);
        expectTypeOf(
            dispatch(Arr.combine, Obj.combine)(numberMap, rec),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for combine", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.combine(numberMap, rec);
    });

    it("routes a record to obj for contains", () => {
        expectTypeOf(
            dispatch(Arr.contains, Obj.contains)(rec, one),
        ).toEqualTypeOf(Obj.contains(rec, one));
    });

    it("routes an interface-typed object to obj for contains", () => {
        expectTypeOf(
            dispatch(Arr.contains, Obj.contains)(settings, one),
        ).toEqualTypeOf(Obj.contains(settings, one));
    });

    it("routes a class instance to obj for contains", () => {
        expectTypeOf(
            dispatch(Arr.contains, Obj.contains)(box, one),
        ).toEqualTypeOf(Obj.contains(box, one));
    });

    it("routes a Map to obj for contains", () => {
        const widest = Obj.contains(opaque, one);
        expectTypeOf(
            dispatch(Arr.contains, Obj.contains)(numberMap, one),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for contains", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.contains(numberMap, one);
    });

    it("rejects an interface and a class on arr for contains", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.contains(settings, one);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.contains(box, one);
    });

    it("routes a record to obj for crossJoin", () => {
        expectTypeOf(
            dispatch(Arr.crossJoin, Obj.crossJoin)(dimRecA, dimRecB),
        ).toEqualTypeOf(Obj.crossJoin(dimRecA, dimRecB));
    });

    it("routes an interface-typed object to obj for crossJoin", () => {
        expectTypeOf(
            dispatch(Arr.crossJoin, Obj.crossJoin)(dimSettings, dimRecB),
        ).toEqualTypeOf(Obj.crossJoin(dimSettings, dimRecB));
    });

    it("routes a class instance to obj for crossJoin", () => {
        expectTypeOf(
            dispatch(Arr.crossJoin, Obj.crossJoin)(dimBox, dimRecB),
        ).toEqualTypeOf(Obj.crossJoin(dimBox, dimRecB));
    });

    it("routes a Map to obj for crossJoin", () => {
        const widest = Obj.crossJoin(...opaqueObjects);
        expectTypeOf(
            dispatch(Arr.crossJoin, Obj.crossJoin)(dimMap, dimRecB),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for crossJoin", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.crossJoin(dimMap, dimRecB);
    });

    it("routes a record to obj for diff", () => {
        expectTypeOf(dispatch(Arr.diff, Obj.diff)(rec, rec)).toEqualTypeOf(
            Obj.diff(rec, rec),
        );
    });

    it("routes an interface-typed object to obj for diff", () => {
        expectTypeOf(dispatch(Arr.diff, Obj.diff)(settings, rec)).toEqualTypeOf(
            Obj.diff(settings, rec),
        );
    });

    it("routes a class instance to obj for diff", () => {
        expectTypeOf(dispatch(Arr.diff, Obj.diff)(box, rec)).toEqualTypeOf(
            Obj.diff(box, rec),
        );
    });

    it("routes a Map to obj for diff", () => {
        const widest = Obj.diff(opaque, rec);
        expectTypeOf(
            dispatch(Arr.diff, Obj.diff)(numberMap, rec),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for diff", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.diff(numberMap, rec);
    });

    it("routes a record to obj for diffAssoc", () => {
        expectTypeOf(
            dispatch(Arr.diffAssoc, Obj.diffAssoc)(rec, rec),
        ).toEqualTypeOf(Obj.diffAssoc(rec, rec));
    });

    it("routes an interface-typed object to obj for diffAssoc", () => {
        expectTypeOf(
            dispatch(Arr.diffAssoc, Obj.diffAssoc)(settings, rec),
        ).toEqualTypeOf(Obj.diffAssoc(settings, rec));
    });

    it("routes a class instance to obj for diffAssoc", () => {
        expectTypeOf(
            dispatch(Arr.diffAssoc, Obj.diffAssoc)(box, rec),
        ).toEqualTypeOf(Obj.diffAssoc(box, rec));
    });

    it("routes a Map to obj for diffAssoc", () => {
        const widest = Obj.diffAssoc(opaque, rec);
        expectTypeOf(
            dispatch(Arr.diffAssoc, Obj.diffAssoc)(numberMap, rec),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for diffAssoc", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.diffAssoc(numberMap, rec);
    });

    it("routes a record to obj for divide", () => {
        expectTypeOf(dispatch(Arr.divide, Obj.divide)(rec)).toEqualTypeOf(
            Obj.divide(rec),
        );
    });

    it("routes an interface-typed object to obj for divide", () => {
        expectTypeOf(dispatch(Arr.divide, Obj.divide)(settings)).toEqualTypeOf(
            Obj.divide(settings),
        );
    });

    it("routes a class instance to obj for divide", () => {
        expectTypeOf(dispatch(Arr.divide, Obj.divide)(box)).toEqualTypeOf(
            Obj.divide(box),
        );
    });

    it("routes a Map to obj for divide", () => {
        const widest = Obj.divide(opaque);
        expectTypeOf(dispatch(Arr.divide, Obj.divide)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for divide", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.divide(numberMap);
    });

    it("routes a record to obj for dot", () => {
        expectTypeOf(dispatch(Arr.dot, Obj.dot)(rec)).toEqualTypeOf(
            Obj.dot(rec),
        );
    });

    it("routes an interface-typed object to obj for dot", () => {
        expectTypeOf(dispatch(Arr.dot, Obj.dot)(settings)).toEqualTypeOf(
            Obj.dot(settings),
        );
    });

    it("routes a class instance to obj for dot", () => {
        expectTypeOf(dispatch(Arr.dot, Obj.dot)(box)).toEqualTypeOf(
            Obj.dot(box),
        );
    });

    it("routes a Map to obj for dot", () => {
        const widest = Obj.dot(opaque);
        expectTypeOf(dispatch(Arr.dot, Obj.dot)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for dot", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.dot(numberMap);
    });

    it("rejects an interface and a class on arr for dot", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.dot(settings);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.dot(box);
    });

    it("routes a record to obj for every", () => {
        expectTypeOf(dispatch(Arr.every, Obj.every)(rec, truthy)).toEqualTypeOf(
            Obj.every(rec, truthy),
        );
    });

    it("routes an interface-typed object to obj for every", () => {
        expectTypeOf(
            dispatch(Arr.every, Obj.every)(settings, truthy),
        ).toEqualTypeOf(Obj.every(settings, truthy));
    });

    it("routes a class instance to obj for every", () => {
        expectTypeOf(dispatch(Arr.every, Obj.every)(box, truthy)).toEqualTypeOf(
            Obj.every(box, truthy),
        );
    });

    it("routes a Map to obj for every", () => {
        const widest = Obj.every(opaque, truthy);
        expectTypeOf(
            dispatch(Arr.every, Obj.every)(numberMap, truthy),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects an interface and a class on arr for every", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.every(settings, truthy);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.every(box, truthy);
    });

    it("routes a record to obj for except", () => {
        expectTypeOf(dispatch(Arr.except, Obj.except)(rec, key)).toEqualTypeOf(
            Obj.except(rec, key),
        );
    });

    it("routes an interface-typed object to obj for except", () => {
        expectTypeOf(
            dispatch(Arr.except, Obj.except)(settings, key),
        ).toEqualTypeOf(Obj.except(settings, key));
    });

    it("routes a class instance to obj for except", () => {
        expectTypeOf(dispatch(Arr.except, Obj.except)(box, key)).toEqualTypeOf(
            Obj.except(box, key),
        );
    });

    it("routes a Map to obj for except", () => {
        const widest = Obj.except(opaque, key);
        expectTypeOf(
            dispatch(Arr.except, Obj.except)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for except", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.except(numberMap, key);
    });

    it("routes a record to obj for exceptValues", () => {
        expectTypeOf(
            dispatch(Arr.exceptValues, Obj.exceptValues)(rec, one),
        ).toEqualTypeOf(Obj.exceptValues(rec, one));
    });

    it("routes an interface-typed object to obj for exceptValues", () => {
        expectTypeOf(
            dispatch(Arr.exceptValues, Obj.exceptValues)(settings, one),
        ).toEqualTypeOf(Obj.exceptValues(settings, one));
    });

    it("routes a class instance to obj for exceptValues", () => {
        expectTypeOf(
            dispatch(Arr.exceptValues, Obj.exceptValues)(box, one),
        ).toEqualTypeOf(Obj.exceptValues(box, one));
    });

    it("routes a Map to obj for exceptValues", () => {
        const widest = Obj.exceptValues(opaque, one);
        expectTypeOf(
            dispatch(Arr.exceptValues, Obj.exceptValues)(numberMap, one),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for exceptValues", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.exceptValues(numberMap, one);
    });

    it("routes a record to obj for exists", () => {
        expectTypeOf(dispatch(Arr.exists, Obj.exists)(rec, key)).toEqualTypeOf(
            Obj.exists(rec, key),
        );
    });

    it("routes an interface-typed object to obj for exists", () => {
        expectTypeOf(
            dispatch(Arr.exists, Obj.exists)(settings, key),
        ).toEqualTypeOf(Obj.exists(settings, key));
    });

    it("routes a class instance to obj for exists", () => {
        expectTypeOf(dispatch(Arr.exists, Obj.exists)(box, key)).toEqualTypeOf(
            Obj.exists(box, key),
        );
    });

    it("routes a Map to obj for exists", () => {
        const widest = Obj.exists(opaque, key);
        expectTypeOf(
            dispatch(Arr.exists, Obj.exists)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for exists", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.exists(numberMap, key);
    });

    it("rejects an interface and a class on arr for exists", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.exists(settings, key);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.exists(box, key);
    });

    it("routes a record to obj for filter", () => {
        expectTypeOf(
            dispatch(Arr.filter, Obj.filter)(rec, truthy),
        ).toEqualTypeOf(Obj.filter(rec, truthy));
    });

    it("routes an interface-typed object to obj for filter", () => {
        expectTypeOf(
            dispatch(Arr.filter, Obj.filter)(settings, truthy),
        ).toEqualTypeOf(Obj.filter(settings, truthy));
    });

    it("routes a class instance to obj for filter", () => {
        expectTypeOf(
            dispatch(Arr.filter, Obj.filter)(box, truthy),
        ).toEqualTypeOf(Obj.filter(box, truthy));
    });

    it("routes a Map to obj for filter", () => {
        const widest = Obj.filter(opaque, truthy);
        expectTypeOf(
            dispatch(Arr.filter, Obj.filter)(numberMap, truthy),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for filter", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.filter(numberMap, truthy);
    });

    it("routes a record to obj for first", () => {
        expectTypeOf(dispatch(Arr.first, Obj.first)(rec)).toEqualTypeOf(
            Obj.first(rec),
        );
    });

    it("routes an interface-typed object to obj for first", () => {
        expectTypeOf(dispatch(Arr.first, Obj.first)(settings)).toEqualTypeOf(
            Obj.first(settings),
        );
    });

    it("routes a class instance to obj for first", () => {
        expectTypeOf(dispatch(Arr.first, Obj.first)(box)).toEqualTypeOf(
            Obj.first(box),
        );
    });

    it("routes a Map to obj for first", () => {
        const widest = Obj.first(opaque);
        expectTypeOf(dispatch(Arr.first, Obj.first)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects an interface and a class on arr for first", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.first(settings);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.first(box);
    });

    it("routes a record to obj for flatten", () => {
        expectTypeOf(dispatch(Arr.flatten, Obj.flatten)(rec)).toEqualTypeOf(
            Obj.flatten(rec),
        );
    });

    it("routes an interface-typed object to obj for flatten", () => {
        expectTypeOf(
            dispatch(Arr.flatten, Obj.flatten)(settings),
        ).toEqualTypeOf(Obj.flatten(settings));
    });

    it("routes a class instance to obj for flatten", () => {
        expectTypeOf(dispatch(Arr.flatten, Obj.flatten)(box)).toEqualTypeOf(
            Obj.flatten(box),
        );
    });

    it("routes a Map to obj for flatten", () => {
        const widest = Obj.flatten(opaque);
        expectTypeOf(
            dispatch(Arr.flatten, Obj.flatten)(numberMap),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for flatten", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.flatten(numberMap);
    });

    it("rejects an interface and a class on arr for flatten", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.flatten(settings);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.flatten(box);
    });

    it("routes a record to obj for flip", () => {
        expectTypeOf(dispatch(Arr.flip, Obj.flip)(rec)).toEqualTypeOf(
            Obj.flip(rec),
        );
    });

    it("routes an interface-typed object to obj for flip", () => {
        expectTypeOf(dispatch(Arr.flip, Obj.flip)(settings)).toEqualTypeOf(
            Obj.flip(settings),
        );
    });

    it("routes a class instance to obj for flip", () => {
        expectTypeOf(dispatch(Arr.flip, Obj.flip)(box)).toEqualTypeOf(
            Obj.flip(box),
        );
    });

    it("routes a Map to obj for flip", () => {
        const widest = Obj.flip(opaque);
        expectTypeOf(dispatch(Arr.flip, Obj.flip)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for flip", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.flip(numberMap);
    });

    it("routes a record to obj for float", () => {
        expectTypeOf(dispatch(Arr.float, Obj.float)(rec, key)).toEqualTypeOf(
            Obj.float(rec, key),
        );
    });

    it("routes an interface-typed object to obj for float", () => {
        expectTypeOf(
            dispatch(Arr.float, Obj.float)(settings, key),
        ).toEqualTypeOf(Obj.float(settings, key));
    });

    it("routes a class instance to obj for float", () => {
        expectTypeOf(dispatch(Arr.float, Obj.float)(box, key)).toEqualTypeOf(
            Obj.float(box, key),
        );
    });

    it("routes a Map to obj for float", () => {
        const widest = Obj.float(opaque, key);
        expectTypeOf(
            dispatch(Arr.float, Obj.float)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for float", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.float(numberMap, key);
    });

    it("rejects an interface and a class on arr for float", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.float(settings, key);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.float(box, key);
    });

    it("routes a record to obj for forget", () => {
        expectTypeOf(dispatch(Arr.forget, Obj.forget)(rec, key)).toEqualTypeOf(
            Obj.forget(rec, key),
        );
    });

    it("routes an interface-typed object to obj for forget", () => {
        expectTypeOf(
            dispatch(Arr.forget, Obj.forget)(settings, key),
        ).toEqualTypeOf(Obj.forget(settings, key));
    });

    it("routes a class instance to obj for forget", () => {
        expectTypeOf(dispatch(Arr.forget, Obj.forget)(box, key)).toEqualTypeOf(
            Obj.forget(box, key),
        );
    });

    it("routes a Map to obj for forget", () => {
        const widest = Obj.forget(opaque, key);
        expectTypeOf(
            dispatch(Arr.forget, Obj.forget)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for forget", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.forget(numberMap, key);
    });

    it("routes a record to obj for from", () => {
        expectTypeOf(dispatch(Arr.from, Obj.from)(rec)).toEqualTypeOf(
            Obj.from(rec),
        );
    });

    it("routes an interface-typed object to obj for from", () => {
        expectTypeOf(dispatch(Arr.from, Obj.from)(settings)).toEqualTypeOf(
            Obj.from(settings),
        );
    });

    it("routes a class instance to obj for from", () => {
        expectTypeOf(dispatch(Arr.from, Obj.from)(box)).toEqualTypeOf(
            Obj.from(box),
        );
    });

    it("routes a Map to obj for from", () => {
        const widest = Obj.from(opaque);
        expectTypeOf(dispatch(Arr.from, Obj.from)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("routes an interface-typed object to obj for get", () => {
        expectTypeOf(dispatch(Arr.get, Obj.get)(settings, key)).toEqualTypeOf(
            Obj.get(settings, key),
        );
    });

    it("routes a class instance to obj for get", () => {
        expectTypeOf(dispatch(Arr.get, Obj.get)(box, key)).toEqualTypeOf(
            Obj.get(box, key),
        );
    });

    it("routes a Map to obj for get", () => {
        const widest = Obj.get(opaque, key);
        expectTypeOf(dispatch(Arr.get, Obj.get)(numberMap, key)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for get", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.get(numberMap, key);
    });

    it("rejects an interface and a class on arr for get", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.get(settings, key);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.get(box, key);
    });

    it("routes a record to obj for has", () => {
        expectTypeOf(dispatch(Arr.has, Obj.has)(rec, key)).toEqualTypeOf(
            Obj.has(rec, key),
        );
    });

    it("routes an interface-typed object to obj for has", () => {
        expectTypeOf(dispatch(Arr.has, Obj.has)(settings, key)).toEqualTypeOf(
            Obj.has(settings, key),
        );
    });

    it("routes a class instance to obj for has", () => {
        expectTypeOf(dispatch(Arr.has, Obj.has)(box, key)).toEqualTypeOf(
            Obj.has(box, key),
        );
    });

    it("routes a Map to obj for has", () => {
        const widest = Obj.has(opaque, key);
        expectTypeOf(dispatch(Arr.has, Obj.has)(numberMap, key)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for has", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.has(numberMap, key);
    });

    it("rejects an interface and a class on arr for has", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.has(settings, key);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.has(box, key);
    });

    it("routes a record to obj for hasAll", () => {
        expectTypeOf(dispatch(Arr.hasAll, Obj.hasAll)(rec, key)).toEqualTypeOf(
            Obj.hasAll(rec, key),
        );
    });

    it("routes an interface-typed object to obj for hasAll", () => {
        expectTypeOf(
            dispatch(Arr.hasAll, Obj.hasAll)(settings, key),
        ).toEqualTypeOf(Obj.hasAll(settings, key));
    });

    it("routes a class instance to obj for hasAll", () => {
        expectTypeOf(dispatch(Arr.hasAll, Obj.hasAll)(box, key)).toEqualTypeOf(
            Obj.hasAll(box, key),
        );
    });

    it("routes a Map to obj for hasAll", () => {
        const widest = Obj.hasAll(opaque, key);
        expectTypeOf(
            dispatch(Arr.hasAll, Obj.hasAll)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for hasAll", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.hasAll(numberMap, key);
    });

    it("rejects an interface and a class on arr for hasAll", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.hasAll(settings, key);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.hasAll(box, key);
    });

    it("routes a record to obj for hasAny", () => {
        expectTypeOf(dispatch(Arr.hasAny, Obj.hasAny)(rec, key)).toEqualTypeOf(
            Obj.hasAny(rec, key),
        );
    });

    it("routes an interface-typed object to obj for hasAny", () => {
        expectTypeOf(
            dispatch(Arr.hasAny, Obj.hasAny)(settings, key),
        ).toEqualTypeOf(Obj.hasAny(settings, key));
    });

    it("routes a class instance to obj for hasAny", () => {
        expectTypeOf(dispatch(Arr.hasAny, Obj.hasAny)(box, key)).toEqualTypeOf(
            Obj.hasAny(box, key),
        );
    });

    it("routes a Map to obj for hasAny", () => {
        const widest = Obj.hasAny(opaque, key);
        expectTypeOf(
            dispatch(Arr.hasAny, Obj.hasAny)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for hasAny", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.hasAny(numberMap, key);
    });

    it("rejects an interface and a class on arr for hasAny", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.hasAny(settings, key);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.hasAny(box, key);
    });

    it("routes a record to obj for integer", () => {
        expectTypeOf(
            dispatch(Arr.integer, Obj.integer)(rec, key),
        ).toEqualTypeOf(Obj.integer(rec, key));
    });

    it("routes an interface-typed object to obj for integer", () => {
        expectTypeOf(
            dispatch(Arr.integer, Obj.integer)(settings, key),
        ).toEqualTypeOf(Obj.integer(settings, key));
    });

    it("routes a class instance to obj for integer", () => {
        expectTypeOf(
            dispatch(Arr.integer, Obj.integer)(box, key),
        ).toEqualTypeOf(Obj.integer(box, key));
    });

    it("routes a Map to obj for integer", () => {
        const widest = Obj.integer(opaque, key);
        expectTypeOf(
            dispatch(Arr.integer, Obj.integer)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for integer", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.integer(numberMap, key);
    });

    it("rejects an interface and a class on arr for integer", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.integer(settings, key);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.integer(box, key);
    });

    it("routes a record to obj for intersect", () => {
        expectTypeOf(
            dispatch(Arr.intersect, Obj.intersect)(rec, rec),
        ).toEqualTypeOf(Obj.intersect(rec, rec));
    });

    it("routes an interface-typed object to obj for intersect", () => {
        expectTypeOf(
            dispatch(Arr.intersect, Obj.intersect)(settings, rec),
        ).toEqualTypeOf(Obj.intersect(settings, rec));
    });

    it("routes a class instance to obj for intersect", () => {
        expectTypeOf(
            dispatch(Arr.intersect, Obj.intersect)(box, rec),
        ).toEqualTypeOf(Obj.intersect(box, rec));
    });

    it("routes a Map to obj for intersect", () => {
        const widest = Obj.intersect(opaque, rec);
        expectTypeOf(
            dispatch(Arr.intersect, Obj.intersect)(numberMap, rec),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for intersect", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.intersect(numberMap, rec);
    });

    it("routes a record to obj for intersectAssoc", () => {
        expectTypeOf(
            dispatch(Arr.intersectAssoc, Obj.intersectAssoc)(rec, rec),
        ).toEqualTypeOf(Obj.intersectAssoc(rec, rec));
    });

    it("routes an interface-typed object to obj for intersectAssoc", () => {
        expectTypeOf(
            dispatch(Arr.intersectAssoc, Obj.intersectAssoc)(settings, rec),
        ).toEqualTypeOf(Obj.intersectAssoc(settings, rec));
    });

    it("routes a class instance to obj for intersectAssoc", () => {
        expectTypeOf(
            dispatch(Arr.intersectAssoc, Obj.intersectAssoc)(box, rec),
        ).toEqualTypeOf(Obj.intersectAssoc(box, rec));
    });

    it("routes a Map to obj for intersectAssoc", () => {
        const widest = Obj.intersectAssoc(opaque, rec);
        expectTypeOf(
            dispatch(Arr.intersectAssoc, Obj.intersectAssoc)(numberMap, rec),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for intersectAssoc", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.intersectAssoc(numberMap, rec);
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

    it("routes an interface-typed object to obj for intersectAssocUsing", () => {
        expectTypeOf(
            dispatch(Arr.intersectAssocUsing, Obj.intersectAssocUsing)(
                settings,
                rec,
                truthy,
            ),
        ).toEqualTypeOf(Obj.intersectAssocUsing(settings, rec, truthy));
    });

    it("routes a class instance to obj for intersectAssocUsing", () => {
        expectTypeOf(
            dispatch(Arr.intersectAssocUsing, Obj.intersectAssocUsing)(
                box,
                rec,
                truthy,
            ),
        ).toEqualTypeOf(Obj.intersectAssocUsing(box, rec, truthy));
    });

    it("routes a Map to obj for intersectAssocUsing", () => {
        const widest = Obj.intersectAssocUsing(opaque, rec, truthy);
        expectTypeOf(
            dispatch(Arr.intersectAssocUsing, Obj.intersectAssocUsing)(
                numberMap,
                rec,
                truthy,
            ),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for intersectAssocUsing", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.intersectAssocUsing(numberMap, rec, truthy);
    });

    it("routes a record to obj for intersectByKeys", () => {
        expectTypeOf(
            dispatch(Arr.intersectByKeys, Obj.intersectByKeys)(rec, rec),
        ).toEqualTypeOf(Obj.intersectByKeys(rec, rec));
    });

    it("routes an interface-typed object to obj for intersectByKeys", () => {
        expectTypeOf(
            dispatch(Arr.intersectByKeys, Obj.intersectByKeys)(settings, rec),
        ).toEqualTypeOf(Obj.intersectByKeys(settings, rec));
    });

    it("routes a class instance to obj for intersectByKeys", () => {
        expectTypeOf(
            dispatch(Arr.intersectByKeys, Obj.intersectByKeys)(box, rec),
        ).toEqualTypeOf(Obj.intersectByKeys(box, rec));
    });

    it("routes a Map to obj for intersectByKeys", () => {
        const widest = Obj.intersectByKeys(opaque, rec);
        expectTypeOf(
            dispatch(Arr.intersectByKeys, Obj.intersectByKeys)(numberMap, rec),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for intersectByKeys", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.intersectByKeys(numberMap, rec);
    });

    it("routes a record to obj for join", () => {
        expectTypeOf(dispatch(Arr.join, Obj.join)(rec, glue)).toEqualTypeOf(
            Obj.join(rec, glue),
        );
    });

    it("routes an interface-typed object to obj for join", () => {
        expectTypeOf(
            dispatch(Arr.join, Obj.join)(settings, glue),
        ).toEqualTypeOf(Obj.join(settings, glue));
    });

    it("routes a class instance to obj for join", () => {
        expectTypeOf(dispatch(Arr.join, Obj.join)(box, glue)).toEqualTypeOf(
            Obj.join(box, glue),
        );
    });

    it("routes a Map to obj for join", () => {
        const widest = Obj.join(opaque, glue);
        expectTypeOf(
            dispatch(Arr.join, Obj.join)(numberMap, glue),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for join", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.join(numberMap, glue);
    });

    it("rejects an interface and a class on arr for join", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.join(settings, glue);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.join(box, glue);
    });

    it("routes a record to obj for keyBy", () => {
        expectTypeOf(
            dispatch(Arr.keyBy, Obj.keyBy)(recOfRecords, idKey),
        ).toEqualTypeOf(Obj.keyBy(recOfRecords, idKey));
    });

    it("routes an interface-typed object to obj for keyBy", () => {
        expectTypeOf(
            dispatch(Arr.keyBy, Obj.keyBy)(recordsSettings, idKey),
        ).toEqualTypeOf(Obj.keyBy(recordsSettings, idKey));
    });

    it("routes a class instance to obj for keyBy", () => {
        expectTypeOf(
            dispatch(Arr.keyBy, Obj.keyBy)(recordsBox, idKey),
        ).toEqualTypeOf(Obj.keyBy(recordsBox, idKey));
    });

    it("routes a Map to obj for keyBy", () => {
        const widest = Obj.keyBy(opaque, idKey);
        expectTypeOf(
            dispatch(Arr.keyBy, Obj.keyBy)(recordMap, idKey),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for keyBy", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.keyBy(recordMap, idKey);
    });

    it("routes a record to obj for keys", () => {
        expectTypeOf(dispatch(Arr.keys, Obj.keys)(rec)).toEqualTypeOf(
            Obj.keys(rec),
        );
    });

    it("routes an interface-typed object to obj for keys", () => {
        expectTypeOf(dispatch(Arr.keys, Obj.keys)(settings)).toEqualTypeOf(
            Obj.keys(settings),
        );
    });

    it("routes a class instance to obj for keys", () => {
        expectTypeOf(dispatch(Arr.keys, Obj.keys)(box)).toEqualTypeOf(
            Obj.keys(box),
        );
    });

    it("routes a Map to obj for keys", () => {
        const widest = Obj.keys(opaque);
        expectTypeOf(dispatch(Arr.keys, Obj.keys)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for keys", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.keys(numberMap);
    });

    it("routes a record to obj for last", () => {
        expectTypeOf(dispatch(Arr.last, Obj.last)(rec)).toEqualTypeOf(
            Obj.last(rec),
        );
    });

    it("routes an interface-typed object to obj for last", () => {
        expectTypeOf(dispatch(Arr.last, Obj.last)(settings)).toEqualTypeOf(
            Obj.last(settings),
        );
    });

    it("routes a class instance to obj for last", () => {
        expectTypeOf(dispatch(Arr.last, Obj.last)(box)).toEqualTypeOf(
            Obj.last(box),
        );
    });

    it("routes a Map to obj for last", () => {
        const widest = Obj.last(opaque);
        expectTypeOf(dispatch(Arr.last, Obj.last)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects an interface and a class on arr for last", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.last(settings);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.last(box);
    });

    it("routes a record to obj for map", () => {
        expectTypeOf(dispatch(Arr.map, Obj.map)(rec, toOne)).toEqualTypeOf(
            Obj.map(rec, toOne),
        );
    });

    it("routes an interface-typed object to obj for map", () => {
        expectTypeOf(dispatch(Arr.map, Obj.map)(settings, toOne)).toEqualTypeOf(
            Obj.map(settings, toOne),
        );
    });

    it("routes a class instance to obj for map", () => {
        expectTypeOf(dispatch(Arr.map, Obj.map)(box, toOne)).toEqualTypeOf(
            Obj.map(box, toOne),
        );
    });

    it("routes a Map to obj for map", () => {
        const widest = Obj.map(opaque, opaqueFn);
        expectTypeOf(
            dispatch(Arr.map, Obj.map)(numberMap, toOne),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for map", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.map(numberMap, toOne);
    });

    it("routes a record to obj for mapSpread", () => {
        expectTypeOf(
            dispatch(Arr.mapSpread, Obj.mapSpread)(recOfLists, toOne),
        ).toEqualTypeOf(Obj.mapSpread(recOfLists, toOne));
    });

    it("routes an interface-typed object to obj for mapSpread", () => {
        expectTypeOf(
            dispatch(Arr.mapSpread, Obj.mapSpread)(nestedSettings, toOne),
        ).toEqualTypeOf(Obj.mapSpread(nestedSettings, toOne));
    });

    it("routes a class instance to obj for mapSpread", () => {
        expectTypeOf(
            dispatch(Arr.mapSpread, Obj.mapSpread)(nestedBox, toOne),
        ).toEqualTypeOf(Obj.mapSpread(nestedBox, toOne));
    });

    it("routes a Map to obj for mapSpread", () => {
        const widest = Obj.mapSpread(opaque, opaqueFn);
        expectTypeOf(
            dispatch(Arr.mapSpread, Obj.mapSpread)(listMap, toOne),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for mapSpread", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.mapSpread(listMap, toOne);
    });

    it("routes a record to obj for mapWithKeys", () => {
        expectTypeOf(
            dispatch(Arr.mapWithKeys, Obj.mapWithKeys)(rec, toRecord),
        ).toEqualTypeOf(Obj.mapWithKeys(rec, toRecord));
    });

    it("routes an interface-typed object to obj for mapWithKeys", () => {
        expectTypeOf(
            dispatch(Arr.mapWithKeys, Obj.mapWithKeys)(settings, toRecord),
        ).toEqualTypeOf(Obj.mapWithKeys(settings, toRecord));
    });

    it("routes a class instance to obj for mapWithKeys", () => {
        expectTypeOf(
            dispatch(Arr.mapWithKeys, Obj.mapWithKeys)(box, toRecord),
        ).toEqualTypeOf(Obj.mapWithKeys(box, toRecord));
    });

    it("routes a Map to obj for mapWithKeys", () => {
        const widest = Obj.mapWithKeys(opaque, opaqueRecFn);
        expectTypeOf(
            dispatch(Arr.mapWithKeys, Obj.mapWithKeys)(numberMap, toRecord),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for mapWithKeys", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.mapWithKeys(numberMap, toRecord);
    });

    it("rejects an interface and a class on arr for mapWithKeys", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.mapWithKeys(settings, toRecord);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.mapWithKeys(box, toRecord);
    });

    it("routes a record to obj for only", () => {
        expectTypeOf(dispatch(Arr.only, Obj.only)(rec, key)).toEqualTypeOf(
            Obj.only(rec, key),
        );
    });

    it("routes an interface-typed object to obj for only", () => {
        expectTypeOf(dispatch(Arr.only, Obj.only)(settings, key)).toEqualTypeOf(
            Obj.only(settings, key),
        );
    });

    it("routes a class instance to obj for only", () => {
        expectTypeOf(dispatch(Arr.only, Obj.only)(box, key)).toEqualTypeOf(
            Obj.only(box, key),
        );
    });

    it("routes a Map to obj for only", () => {
        const widest = Obj.only(opaque, key);
        expectTypeOf(
            dispatch(Arr.only, Obj.only)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for only", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.only(numberMap, key);
    });

    it("routes a record to obj for onlyValues", () => {
        expectTypeOf(
            dispatch(Arr.onlyValues, Obj.onlyValues)(rec, one),
        ).toEqualTypeOf(Obj.onlyValues(rec, one));
    });

    it("routes an interface-typed object to obj for onlyValues", () => {
        expectTypeOf(
            dispatch(Arr.onlyValues, Obj.onlyValues)(settings, one),
        ).toEqualTypeOf(Obj.onlyValues(settings, one));
    });

    it("routes a class instance to obj for onlyValues", () => {
        expectTypeOf(
            dispatch(Arr.onlyValues, Obj.onlyValues)(box, one),
        ).toEqualTypeOf(Obj.onlyValues(box, one));
    });

    it("routes a Map to obj for onlyValues", () => {
        const widest = Obj.onlyValues(opaque, one);
        expectTypeOf(
            dispatch(Arr.onlyValues, Obj.onlyValues)(numberMap, one),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for onlyValues", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.onlyValues(numberMap, one);
    });

    it("routes a record to obj for pad", () => {
        expectTypeOf(dispatch(Arr.pad, Obj.pad)(rec, size, zero)).toEqualTypeOf(
            Obj.pad(rec, size, zero),
        );
    });

    it("routes an interface-typed object to obj for pad", () => {
        expectTypeOf(
            dispatch(Arr.pad, Obj.pad)(settings, size, zero),
        ).toEqualTypeOf(Obj.pad(settings, size, zero));
    });

    it("routes a class instance to obj for pad", () => {
        expectTypeOf(dispatch(Arr.pad, Obj.pad)(box, size, zero)).toEqualTypeOf(
            Obj.pad(box, size, zero),
        );
    });

    it("routes a Map to obj for pad", () => {
        const widest = Obj.pad(opaque, size, zero);
        expectTypeOf(
            dispatch(Arr.pad, Obj.pad)(numberMap, size, zero),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for pad", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.pad(numberMap, size, zero);
    });

    it("routes a record to obj for partition", () => {
        expectTypeOf(
            dispatch(Arr.partition, Obj.partition)(rec, truthy),
        ).toEqualTypeOf(Obj.partition(rec, truthy));
    });

    it("routes an interface-typed object to obj for partition", () => {
        expectTypeOf(
            dispatch(Arr.partition, Obj.partition)(settings, truthy),
        ).toEqualTypeOf(Obj.partition(settings, truthy));
    });

    it("routes a class instance to obj for partition", () => {
        expectTypeOf(
            dispatch(Arr.partition, Obj.partition)(box, truthy),
        ).toEqualTypeOf(Obj.partition(box, truthy));
    });

    it("routes a Map to obj for partition", () => {
        const widest = Obj.partition(opaque, truthy);
        expectTypeOf(
            dispatch(Arr.partition, Obj.partition)(numberMap, truthy),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for partition", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.partition(numberMap, truthy);
    });

    it("routes a record to obj for pluck", () => {
        expectTypeOf(
            dispatch(Arr.pluck, Obj.pluck)(recOfRecords, idKey),
        ).toEqualTypeOf(Obj.pluck(recOfRecords, idKey));
    });

    it("routes an interface-typed object to obj for pluck", () => {
        expectTypeOf(
            dispatch(Arr.pluck, Obj.pluck)(recordsSettings, idKey),
        ).toEqualTypeOf(Obj.pluck(recordsSettings, idKey));
    });

    it("routes a class instance to obj for pluck", () => {
        expectTypeOf(
            dispatch(Arr.pluck, Obj.pluck)(recordsBox, idKey),
        ).toEqualTypeOf(Obj.pluck(recordsBox, idKey));
    });

    it("routes a Map to obj for pluck", () => {
        const widest = Obj.pluck(opaque, idKey);
        expectTypeOf(
            dispatch(Arr.pluck, Obj.pluck)(recordMap, idKey),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for pluck", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.pluck(recordMap, idKey);
    });

    it("rejects an interface and a class on arr for pluck", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.pluck(recordsSettings, idKey);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.pluck(recordsBox, idKey);
    });

    it("routes a record to obj for pop", () => {
        expectTypeOf(dispatch(Arr.pop, Obj.pop)(rec)).toEqualTypeOf(
            Obj.pop(rec),
        );
    });

    it("routes an interface-typed object to obj for pop", () => {
        expectTypeOf(dispatch(Arr.pop, Obj.pop)(settings)).toEqualTypeOf(
            Obj.pop(settings),
        );
    });

    it("routes a class instance to obj for pop", () => {
        expectTypeOf(dispatch(Arr.pop, Obj.pop)(box)).toEqualTypeOf(
            Obj.pop(box),
        );
    });

    it("routes a Map to obj for pop", () => {
        const widest = Obj.pop(opaque);
        expectTypeOf(dispatch(Arr.pop, Obj.pop)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for pop", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.pop(numberMap);
    });

    it("rejects an interface and a class on arr for pop", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.pop(settings);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.pop(box);
    });

    it("routes a record to obj for prepend", () => {
        expectTypeOf(
            dispatch(Arr.prepend, Obj.prepend)(rec, one),
        ).toEqualTypeOf(Obj.prepend(rec, one));
    });

    it("routes an interface-typed object to obj for prepend", () => {
        expectTypeOf(
            dispatch(Arr.prepend, Obj.prepend)(settings, one),
        ).toEqualTypeOf(Obj.prepend(settings, one));
    });

    it("routes a class instance to obj for prepend", () => {
        expectTypeOf(
            dispatch(Arr.prepend, Obj.prepend)(box, one),
        ).toEqualTypeOf(Obj.prepend(box, one));
    });

    it("routes a Map to obj for prepend", () => {
        const widest = Obj.prepend(opaque, one);
        expectTypeOf(
            dispatch(Arr.prepend, Obj.prepend)(numberMap, one),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for prepend", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.prepend(numberMap, one);
    });

    it("routes a record to obj for prependKeysWith", () => {
        expectTypeOf(
            dispatch(Arr.prependKeysWith, Obj.prependKeysWith)(rec, prefix),
        ).toEqualTypeOf(Obj.prependKeysWith(rec, prefix));
    });

    it("routes an interface-typed object to obj for prependKeysWith", () => {
        expectTypeOf(
            dispatch(Arr.prependKeysWith, Obj.prependKeysWith)(
                settings,
                prefix,
            ),
        ).toEqualTypeOf(Obj.prependKeysWith(settings, prefix));
    });

    it("routes a class instance to obj for prependKeysWith", () => {
        expectTypeOf(
            dispatch(Arr.prependKeysWith, Obj.prependKeysWith)(box, prefix),
        ).toEqualTypeOf(Obj.prependKeysWith(box, prefix));
    });

    it("routes a Map to obj for prependKeysWith", () => {
        const widest = Obj.prependKeysWith(opaque, prefix);
        expectTypeOf(
            dispatch(Arr.prependKeysWith, Obj.prependKeysWith)(
                numberMap,
                prefix,
            ),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for prependKeysWith", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.prependKeysWith(numberMap, prefix);
    });

    it("routes a record to obj for pull", () => {
        expectTypeOf(dispatch(Arr.pull, Obj.pull)(rec, key)).toEqualTypeOf(
            Obj.pull(rec, key),
        );
    });

    it("routes an interface-typed object to obj for pull", () => {
        expectTypeOf(dispatch(Arr.pull, Obj.pull)(settings, key)).toEqualTypeOf(
            Obj.pull(settings, key),
        );
    });

    it("routes a class instance to obj for pull", () => {
        expectTypeOf(dispatch(Arr.pull, Obj.pull)(box, key)).toEqualTypeOf(
            Obj.pull(box, key),
        );
    });

    it("routes a Map to obj for pull", () => {
        const widest = Obj.pull(opaque, key);
        expectTypeOf(
            dispatch(Arr.pull, Obj.pull)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for pull", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.pull(numberMap, key);
    });

    it("routes a record to obj for push", () => {
        expectTypeOf(
            dispatch(Arr.push, Obj.push)(rec, key, nine),
        ).toEqualTypeOf(Obj.push(rec, key, nine));
    });

    it("routes an interface-typed object to obj for push", () => {
        expectTypeOf(
            dispatch(Arr.push, Obj.push)(settings, key, nine),
        ).toEqualTypeOf(Obj.push(settings, key, nine));
    });

    it("routes a class instance to obj for push", () => {
        expectTypeOf(
            dispatch(Arr.push, Obj.push)(box, key, nine),
        ).toEqualTypeOf(Obj.push(box, key, nine));
    });

    it("routes a Map to obj for push", () => {
        const widest = Obj.push(opaque, key, nine);
        expectTypeOf(
            dispatch(Arr.push, Obj.push)(numberMap, key, nine),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for push", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.push(numberMap, key, nine);
    });

    it("routes a record to obj for query", () => {
        expectTypeOf(dispatch(Arr.query, Obj.query)(rec)).toEqualTypeOf(
            Obj.query(rec),
        );
    });

    it("routes an interface-typed object to obj for query", () => {
        expectTypeOf(dispatch(Arr.query, Obj.query)(settings)).toEqualTypeOf(
            Obj.query(settings),
        );
    });

    it("routes a class instance to obj for query", () => {
        expectTypeOf(dispatch(Arr.query, Obj.query)(box)).toEqualTypeOf(
            Obj.query(box),
        );
    });

    it("routes a Map to obj for query", () => {
        const widest = Obj.query(opaque);
        expectTypeOf(dispatch(Arr.query, Obj.query)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for query", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.query(numberMap);
    });

    it("rejects an interface and a class on arr for query", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.query(settings);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.query(box);
    });

    it("routes a record to obj for random", () => {
        expectTypeOf(dispatch(Arr.random, Obj.random)(rec)).toEqualTypeOf(
            Obj.random(rec),
        );
    });

    it("routes an interface-typed object to obj for random", () => {
        expectTypeOf(dispatch(Arr.random, Obj.random)(settings)).toEqualTypeOf(
            Obj.random(settings),
        );
    });

    it("routes a class instance to obj for random", () => {
        expectTypeOf(dispatch(Arr.random, Obj.random)(box)).toEqualTypeOf(
            Obj.random(box),
        );
    });

    it("routes a Map to obj for random", () => {
        const widest = Obj.random(opaque);
        expectTypeOf(dispatch(Arr.random, Obj.random)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for random", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.random(numberMap);
    });

    it("routes a record to obj for reject", () => {
        expectTypeOf(
            dispatch(Arr.reject, Obj.reject)(rec, truthy),
        ).toEqualTypeOf(Obj.reject(rec, truthy));
    });

    it("routes an interface-typed object to obj for reject", () => {
        expectTypeOf(
            dispatch(Arr.reject, Obj.reject)(settings, truthy),
        ).toEqualTypeOf(Obj.reject(settings, truthy));
    });

    it("routes a class instance to obj for reject", () => {
        expectTypeOf(
            dispatch(Arr.reject, Obj.reject)(box, truthy),
        ).toEqualTypeOf(Obj.reject(box, truthy));
    });

    it("routes a Map to obj for reject", () => {
        const widest = Obj.reject(opaque, truthy);
        expectTypeOf(
            dispatch(Arr.reject, Obj.reject)(numberMap, truthy),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for reject", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.reject(numberMap, truthy);
    });

    it("routes a record to obj for reverse", () => {
        expectTypeOf(dispatch(Arr.reverse, Obj.reverse)(rec)).toEqualTypeOf(
            Obj.reverse(rec),
        );
    });

    it("routes an interface-typed object to obj for reverse", () => {
        expectTypeOf(
            dispatch(Arr.reverse, Obj.reverse)(settings),
        ).toEqualTypeOf(Obj.reverse(settings));
    });

    it("routes a class instance to obj for reverse", () => {
        expectTypeOf(dispatch(Arr.reverse, Obj.reverse)(box)).toEqualTypeOf(
            Obj.reverse(box),
        );
    });

    it("routes a Map to obj for reverse", () => {
        const widest = Obj.reverse(opaque);
        expectTypeOf(
            dispatch(Arr.reverse, Obj.reverse)(numberMap),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for reverse", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.reverse(numberMap);
    });

    it("routes a record to obj for select", () => {
        expectTypeOf(
            dispatch(Arr.select, Obj.select)(recOfRecords, idKeys),
        ).toEqualTypeOf(Obj.select(recOfRecords, idKeys));
    });

    it("routes an interface-typed object to obj for select", () => {
        expectTypeOf(
            dispatch(Arr.select, Obj.select)(recordsSettings, idKeys),
        ).toEqualTypeOf(Obj.select(recordsSettings, idKeys));
    });

    it("routes a class instance to obj for select", () => {
        expectTypeOf(
            dispatch(Arr.select, Obj.select)(recordsBox, idKeys),
        ).toEqualTypeOf(Obj.select(recordsBox, idKeys));
    });

    it("routes a Map to obj for select", () => {
        const widest = Obj.select(opaque, idKeys);
        expectTypeOf(
            dispatch(Arr.select, Obj.select)(recordMap, idKeys),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for select", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.select(recordMap, idKeys);
    });

    it("routes a record to obj for set", () => {
        expectTypeOf(dispatch(Arr.set, Obj.set)(rec, key, nine)).toEqualTypeOf(
            Obj.set(rec, key, nine),
        );
    });

    it("routes an interface-typed object to obj for set", () => {
        expectTypeOf(
            dispatch(Arr.set, Obj.set)(settings, key, nine),
        ).toEqualTypeOf(Obj.set(settings, key, nine));
    });

    it("routes a class instance to obj for set", () => {
        expectTypeOf(dispatch(Arr.set, Obj.set)(box, key, nine)).toEqualTypeOf(
            Obj.set(box, key, nine),
        );
    });

    it("routes a Map to obj for set", () => {
        const widest = Obj.set(opaque, opaqueKey, opaque);
        expectTypeOf(
            dispatch(Arr.set, Obj.set)(numberMap, key, nine),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for set", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.set(numberMap, key, nine);
    });

    it("routes a record to obj for shift", () => {
        expectTypeOf(dispatch(Arr.shift, Obj.shift)(rec)).toEqualTypeOf(
            Obj.shift(rec),
        );
    });

    it("routes an interface-typed object to obj for shift", () => {
        expectTypeOf(dispatch(Arr.shift, Obj.shift)(settings)).toEqualTypeOf(
            Obj.shift(settings),
        );
    });

    it("routes a class instance to obj for shift", () => {
        expectTypeOf(dispatch(Arr.shift, Obj.shift)(box)).toEqualTypeOf(
            Obj.shift(box),
        );
    });

    it("routes a Map to obj for shift", () => {
        const widest = Obj.shift(opaque);
        expectTypeOf(dispatch(Arr.shift, Obj.shift)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for shift", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.shift(numberMap);
    });

    it("rejects an interface and a class on arr for shift", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.shift(settings);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.shift(box);
    });

    it("routes a record to obj for shuffle", () => {
        expectTypeOf(dispatch(Arr.shuffle, Obj.shuffle)(rec)).toEqualTypeOf(
            Obj.shuffle(rec),
        );
    });

    it("routes an interface-typed object to obj for shuffle", () => {
        expectTypeOf(
            dispatch(Arr.shuffle, Obj.shuffle)(settings),
        ).toEqualTypeOf(Obj.shuffle(settings));
    });

    it("routes a class instance to obj for shuffle", () => {
        expectTypeOf(dispatch(Arr.shuffle, Obj.shuffle)(box)).toEqualTypeOf(
            Obj.shuffle(box),
        );
    });

    it("routes a Map to obj for shuffle", () => {
        const widest = Obj.shuffle(opaque);
        expectTypeOf(
            dispatch(Arr.shuffle, Obj.shuffle)(numberMap),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for shuffle", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.shuffle(numberMap);
    });

    it("routes a record to obj for slice", () => {
        expectTypeOf(dispatch(Arr.slice, Obj.slice)(rec, one)).toEqualTypeOf(
            Obj.slice(rec, one),
        );
    });

    it("routes an interface-typed object to obj for slice", () => {
        expectTypeOf(
            dispatch(Arr.slice, Obj.slice)(settings, one),
        ).toEqualTypeOf(Obj.slice(settings, one));
    });

    it("routes a class instance to obj for slice", () => {
        expectTypeOf(dispatch(Arr.slice, Obj.slice)(box, one)).toEqualTypeOf(
            Obj.slice(box, one),
        );
    });

    it("routes a Map to obj for slice", () => {
        const widest = Obj.slice(opaque, one);
        expectTypeOf(
            dispatch(Arr.slice, Obj.slice)(numberMap, one),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for slice", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.slice(numberMap, one);
    });

    it("routes a record to obj for sole", () => {
        expectTypeOf(dispatch(Arr.sole, Obj.sole)(rec)).toEqualTypeOf(
            Obj.sole(rec),
        );
    });

    it("routes an interface-typed object to obj for sole", () => {
        expectTypeOf(dispatch(Arr.sole, Obj.sole)(settings)).toEqualTypeOf(
            Obj.sole(settings),
        );
    });

    it("routes a class instance to obj for sole", () => {
        expectTypeOf(dispatch(Arr.sole, Obj.sole)(box)).toEqualTypeOf(
            Obj.sole(box),
        );
    });

    it("routes a Map to obj for sole", () => {
        const widest = Obj.sole(opaque);
        expectTypeOf(dispatch(Arr.sole, Obj.sole)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for sole", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.sole(numberMap);
    });

    it("rejects an interface and a class on arr for sole", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.sole(settings);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.sole(box);
    });

    it("routes a record to obj for some", () => {
        expectTypeOf(dispatch(Arr.some, Obj.some)(rec, truthy)).toEqualTypeOf(
            Obj.some(rec, truthy),
        );
    });

    it("routes an interface-typed object to obj for some", () => {
        expectTypeOf(
            dispatch(Arr.some, Obj.some)(settings, truthy),
        ).toEqualTypeOf(Obj.some(settings, truthy));
    });

    it("routes a class instance to obj for some", () => {
        expectTypeOf(dispatch(Arr.some, Obj.some)(box, truthy)).toEqualTypeOf(
            Obj.some(box, truthy),
        );
    });

    it("routes a Map to obj for some", () => {
        const widest = Obj.some(opaque, truthy);
        expectTypeOf(
            dispatch(Arr.some, Obj.some)(numberMap, truthy),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects an interface and a class on arr for some", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.some(settings, truthy);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.some(box, truthy);
    });

    it("routes a record to obj for sort", () => {
        expectTypeOf(dispatch(Arr.sort, Obj.sort)(rec)).toEqualTypeOf(
            Obj.sort(rec),
        );
    });

    it("routes an interface-typed object to obj for sort", () => {
        expectTypeOf(dispatch(Arr.sort, Obj.sort)(settings)).toEqualTypeOf(
            Obj.sort(settings),
        );
    });

    it("routes a class instance to obj for sort", () => {
        expectTypeOf(dispatch(Arr.sort, Obj.sort)(box)).toEqualTypeOf(
            Obj.sort(box),
        );
    });

    it("routes a Map to obj for sort", () => {
        const widest = Obj.sort(opaque);
        expectTypeOf(dispatch(Arr.sort, Obj.sort)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for sort", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.sort(numberMap);
    });

    it("routes a record to obj for sortDesc", () => {
        expectTypeOf(dispatch(Arr.sortDesc, Obj.sortDesc)(rec)).toEqualTypeOf(
            Obj.sortDesc(rec),
        );
    });

    it("routes an interface-typed object to obj for sortDesc", () => {
        expectTypeOf(
            dispatch(Arr.sortDesc, Obj.sortDesc)(settings),
        ).toEqualTypeOf(Obj.sortDesc(settings));
    });

    it("routes a class instance to obj for sortDesc", () => {
        expectTypeOf(dispatch(Arr.sortDesc, Obj.sortDesc)(box)).toEqualTypeOf(
            Obj.sortDesc(box),
        );
    });

    it("routes a Map to obj for sortDesc", () => {
        const widest = Obj.sortDesc(opaque);
        expectTypeOf(
            dispatch(Arr.sortDesc, Obj.sortDesc)(numberMap),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for sortDesc", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.sortDesc(numberMap);
    });

    it("routes a record to obj for sortRecursive", () => {
        expectTypeOf(
            dispatch(Arr.sortRecursive, Obj.sortRecursive)(rec),
        ).toEqualTypeOf(Obj.sortRecursive(rec));
    });

    it("routes an interface-typed object to obj for sortRecursive", () => {
        expectTypeOf(
            dispatch(Arr.sortRecursive, Obj.sortRecursive)(settings),
        ).toEqualTypeOf(Obj.sortRecursive(settings));
    });

    it("routes a class instance to obj for sortRecursive", () => {
        expectTypeOf(
            dispatch(Arr.sortRecursive, Obj.sortRecursive)(box),
        ).toEqualTypeOf(Obj.sortRecursive(box));
    });

    it("routes a Map to obj for sortRecursive", () => {
        const widest = Obj.sortRecursive(opaque);
        expectTypeOf(
            dispatch(Arr.sortRecursive, Obj.sortRecursive)(numberMap),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for sortRecursive", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.sortRecursive(numberMap);
    });

    it("routes a record to obj for sortRecursiveDesc", () => {
        expectTypeOf(
            dispatch(Arr.sortRecursiveDesc, Obj.sortRecursiveDesc)(rec),
        ).toEqualTypeOf(Obj.sortRecursiveDesc(rec));
    });

    it("routes an interface-typed object to obj for sortRecursiveDesc", () => {
        expectTypeOf(
            dispatch(Arr.sortRecursiveDesc, Obj.sortRecursiveDesc)(settings),
        ).toEqualTypeOf(Obj.sortRecursiveDesc(settings));
    });

    it("routes a class instance to obj for sortRecursiveDesc", () => {
        expectTypeOf(
            dispatch(Arr.sortRecursiveDesc, Obj.sortRecursiveDesc)(box),
        ).toEqualTypeOf(Obj.sortRecursiveDesc(box));
    });

    it("routes a Map to obj for sortRecursiveDesc", () => {
        const widest = Obj.sortRecursiveDesc(opaque);
        expectTypeOf(
            dispatch(Arr.sortRecursiveDesc, Obj.sortRecursiveDesc)(numberMap),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for sortRecursiveDesc", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.sortRecursiveDesc(numberMap);
    });

    it("routes a record to obj for splice", () => {
        expectTypeOf(dispatch(Arr.splice, Obj.splice)(rec, one)).toEqualTypeOf(
            Obj.splice(rec, one),
        );
    });

    it("routes an interface-typed object to obj for splice", () => {
        expectTypeOf(
            dispatch(Arr.splice, Obj.splice)(settings, one),
        ).toEqualTypeOf(Obj.splice(settings, one));
    });

    it("routes a class instance to obj for splice", () => {
        expectTypeOf(dispatch(Arr.splice, Obj.splice)(box, one)).toEqualTypeOf(
            Obj.splice(box, one),
        );
    });

    it("routes a Map to obj for splice", () => {
        const widest = Obj.splice(opaque, one);
        expectTypeOf(
            dispatch(Arr.splice, Obj.splice)(numberMap, one),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for splice", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.splice(numberMap, one);
    });

    it("routes a record to obj for string", () => {
        expectTypeOf(dispatch(Arr.string, Obj.string)(rec, key)).toEqualTypeOf(
            Obj.string(rec, key),
        );
    });

    it("routes an interface-typed object to obj for string", () => {
        expectTypeOf(
            dispatch(Arr.string, Obj.string)(settings, key),
        ).toEqualTypeOf(Obj.string(settings, key));
    });

    it("routes a class instance to obj for string", () => {
        expectTypeOf(dispatch(Arr.string, Obj.string)(box, key)).toEqualTypeOf(
            Obj.string(box, key),
        );
    });

    it("routes a Map to obj for string", () => {
        const widest = Obj.string(opaque, key);
        expectTypeOf(
            dispatch(Arr.string, Obj.string)(numberMap, key),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for string", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.string(numberMap, key);
    });

    it("rejects an interface and a class on arr for string", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.string(settings, key);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.string(box, key);
    });

    it("routes a record to obj for take", () => {
        expectTypeOf(dispatch(Arr.take, Obj.take)(rec, size)).toEqualTypeOf(
            Obj.take(rec, size),
        );
    });

    it("routes an interface-typed object to obj for take", () => {
        expectTypeOf(
            dispatch(Arr.take, Obj.take)(settings, size),
        ).toEqualTypeOf(Obj.take(settings, size));
    });

    it("routes a class instance to obj for take", () => {
        expectTypeOf(dispatch(Arr.take, Obj.take)(box, size)).toEqualTypeOf(
            Obj.take(box, size),
        );
    });

    it("routes a Map to obj for take", () => {
        const widest = Obj.take(opaque, size);
        expectTypeOf(
            dispatch(Arr.take, Obj.take)(numberMap, size),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for take", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.take(numberMap, size);
    });

    it("routes a record to obj for toCssClasses", () => {
        expectTypeOf(
            dispatch(Arr.toCssClasses, Obj.toCssClasses)(rec),
        ).toEqualTypeOf(Obj.toCssClasses(rec));
    });

    it("routes an interface-typed object to obj for toCssClasses", () => {
        expectTypeOf(
            dispatch(Arr.toCssClasses, Obj.toCssClasses)(settings),
        ).toEqualTypeOf(Obj.toCssClasses(settings));
    });

    it("routes a class instance to obj for toCssClasses", () => {
        expectTypeOf(
            dispatch(Arr.toCssClasses, Obj.toCssClasses)(box),
        ).toEqualTypeOf(Obj.toCssClasses(box));
    });

    it("routes a Map to obj for toCssClasses", () => {
        const widest = Obj.toCssClasses(opaque);
        expectTypeOf(
            dispatch(Arr.toCssClasses, Obj.toCssClasses)(numberMap),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for toCssClasses", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.toCssClasses(numberMap);
    });

    it("rejects an interface and a class on arr for toCssClasses", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.toCssClasses(settings);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.toCssClasses(box);
    });

    it("routes a record to obj for toCssStyles", () => {
        expectTypeOf(
            dispatch(Arr.toCssStyles, Obj.toCssStyles)(rec),
        ).toEqualTypeOf(Obj.toCssStyles(rec));
    });

    it("routes an interface-typed object to obj for toCssStyles", () => {
        expectTypeOf(
            dispatch(Arr.toCssStyles, Obj.toCssStyles)(settings),
        ).toEqualTypeOf(Obj.toCssStyles(settings));
    });

    it("routes a class instance to obj for toCssStyles", () => {
        expectTypeOf(
            dispatch(Arr.toCssStyles, Obj.toCssStyles)(box),
        ).toEqualTypeOf(Obj.toCssStyles(box));
    });

    it("routes a Map to obj for toCssStyles", () => {
        const widest = Obj.toCssStyles(opaque);
        expectTypeOf(
            dispatch(Arr.toCssStyles, Obj.toCssStyles)(numberMap),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for toCssStyles", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.toCssStyles(numberMap);
    });

    it("rejects an interface and a class on arr for toCssStyles", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.toCssStyles(settings);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.toCssStyles(box);
    });

    it("routes a record to obj for union", () => {
        expectTypeOf(dispatch(Arr.union, Obj.union)(rec, rec)).toEqualTypeOf(
            Obj.union(rec, rec),
        );
    });

    it("routes an interface-typed object to obj for union", () => {
        expectTypeOf(
            dispatch(Arr.union, Obj.union)(settings, rec),
        ).toEqualTypeOf(Obj.union(settings, rec));
    });

    it("routes a class instance to obj for union", () => {
        expectTypeOf(dispatch(Arr.union, Obj.union)(box, rec)).toEqualTypeOf(
            Obj.union(box, rec),
        );
    });

    it("routes a Map to obj for union", () => {
        const widest = Obj.union(...opaqueTuple);
        expectTypeOf(
            dispatch(Arr.union, Obj.union)(numberMap, rec),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for union", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.union(numberMap, rec);
    });

    it("routes a record to obj for unshift", () => {
        expectTypeOf(
            dispatch(Arr.unshift, Obj.unshift)(rec, recB),
        ).toEqualTypeOf(Obj.unshift(rec, recB));
    });

    it("routes an interface-typed object to obj for unshift", () => {
        expectTypeOf(
            dispatch(Arr.unshift, Obj.unshift)(settings, recB),
        ).toEqualTypeOf(Obj.unshift(settings, recB));
    });

    it("routes a class instance to obj for unshift", () => {
        expectTypeOf(
            dispatch(Arr.unshift, Obj.unshift)(box, recB),
        ).toEqualTypeOf(Obj.unshift(box, recB));
    });

    it("routes a Map to obj for unshift", () => {
        const widest = Obj.unshift(opaque, recB);
        expectTypeOf(
            dispatch(Arr.unshift, Obj.unshift)(numberMap, recB),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for unshift", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.unshift(numberMap, recB);
    });

    it("routes a record to obj for values", () => {
        expectTypeOf(dispatch(Arr.values, Obj.values)(rec)).toEqualTypeOf(
            Obj.values(rec),
        );
    });

    it("routes an interface-typed object to obj for values", () => {
        expectTypeOf(dispatch(Arr.values, Obj.values)(settings)).toEqualTypeOf(
            Obj.values(settings),
        );
    });

    it("routes a class instance to obj for values", () => {
        expectTypeOf(dispatch(Arr.values, Obj.values)(box)).toEqualTypeOf(
            Obj.values(box),
        );
    });

    it("routes a Map to obj for values", () => {
        const widest = Obj.values(opaque);
        expectTypeOf(dispatch(Arr.values, Obj.values)(numberMap)).toEqualTypeOf<
            typeof widest
        >();
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

    it("rejects a Map on arr for values", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.values(numberMap);
    });

    it("rejects an interface and a class on arr for values", () => {
        // @ts-expect-error - arr must be ineligible for the interface-typed shape too
        Arr.values(settings);
        // @ts-expect-error - arr must be ineligible for the class instance too
        Arr.values(box);
    });

    it("routes a record to obj for where", () => {
        expectTypeOf(dispatch(Arr.where, Obj.where)(rec, truthy)).toEqualTypeOf(
            Obj.where(rec, truthy),
        );
    });

    it("routes an interface-typed object to obj for where", () => {
        expectTypeOf(
            dispatch(Arr.where, Obj.where)(settings, truthy),
        ).toEqualTypeOf(Obj.where(settings, truthy));
    });

    it("routes a class instance to obj for where", () => {
        expectTypeOf(dispatch(Arr.where, Obj.where)(box, truthy)).toEqualTypeOf(
            Obj.where(box, truthy),
        );
    });

    it("routes a Map to obj for where", () => {
        const widest = Obj.where(opaque, truthy);
        expectTypeOf(
            dispatch(Arr.where, Obj.where)(numberMap, truthy),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for where", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.where(numberMap, truthy);
    });

    it("routes a record to obj for whereNotNull", () => {
        expectTypeOf(
            dispatch(Arr.whereNotNull, Obj.whereNotNull)(rec),
        ).toEqualTypeOf(Obj.whereNotNull(rec));
    });

    it("routes an interface-typed object to obj for whereNotNull", () => {
        expectTypeOf(
            dispatch(Arr.whereNotNull, Obj.whereNotNull)(settings),
        ).toEqualTypeOf(Obj.whereNotNull(settings));
    });

    it("routes a class instance to obj for whereNotNull", () => {
        expectTypeOf(
            dispatch(Arr.whereNotNull, Obj.whereNotNull)(box),
        ).toEqualTypeOf(Obj.whereNotNull(box));
    });

    it("routes a Map to obj for whereNotNull", () => {
        const widest = Obj.whereNotNull(opaque);
        expectTypeOf(
            dispatch(Arr.whereNotNull, Obj.whereNotNull)(numberMap),
        ).toEqualTypeOf<typeof widest>();
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

    it("rejects a Map on arr for whereNotNull", () => {
        // @ts-expect-error - arr must be ineligible for the Map the runtime sends to obj
        Arr.whereNotNull(numberMap);
    });
});
