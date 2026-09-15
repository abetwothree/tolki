import * as Arr from "@tolki/arr";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import { dispatch } from "../../src/dispatch";
import {
    abc,
    nestedList,
    nestedRecord,
    numberList,
    rowList,
    rowsById,
} from "./fixtures";

describe("dispatch forwards each delegate's own return type", () => {
    const dCollapse = dispatch(Arr.collapse, Obj.collapse);
    const dKeys = dispatch(Arr.keys, Obj.keys);
    const dPluck = dispatch(Arr.pluck, Obj.pluck);

    it("pins collapse against each delegate's own call", () => {
        expectTypeOf(dCollapse(nestedList)).toEqualTypeOf(
            Arr.collapse(nestedList),
        );
        expectTypeOf(dCollapse(nestedRecord)).toEqualTypeOf(
            Obj.collapse(nestedRecord),
        );
    });

    it("pins keys against each delegate's own call", () => {
        expectTypeOf(dKeys(numberList)).toEqualTypeOf(Arr.keys(numberList));
        expectTypeOf(dKeys(abc)).toEqualTypeOf(Obj.keys(abc));
    });

    it("pins pluck against each delegate's own call", () => {
        expectTypeOf(dPluck(rowList, "name")).toEqualTypeOf(
            Arr.pluck(rowList, "name"),
        );
        expectTypeOf(dPluck(rowsById, "name")).toEqualTypeOf(
            Obj.pluck(rowsById, "name"),
        );
    });

    it("does not collapse both backings onto one type", () => {
        expectTypeOf(dCollapse(nestedList)).not.toEqualTypeOf(
            Obj.collapse(nestedRecord),
        );
        expectTypeOf(dKeys(numberList)).not.toEqualTypeOf(Obj.keys(abc));
    });
});
