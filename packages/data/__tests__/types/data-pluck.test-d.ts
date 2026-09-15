import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    nestedRowList,
    nestedRowsById,
    opaque,
    rowList,
    rowMap,
    rowMapAsRecord,
    rowsById,
    unionRows,
    wildcardRowList,
    wildcardRowsById,
} from "./fixtures";

describe("data pluck type tests", () => {
    describe("dataPluck, a literal path", () => {
        it("matches arr.pluck for a list", () => {
            expectTypeOf(Data.dataPluck(rowList, "name")).toEqualTypeOf(
                Arr.pluck(rowList, "name"),
            );
        });

        it("matches obj.pluck for a record", () => {
            expectTypeOf(Data.dataPluck(rowsById, "name")).toEqualTypeOf(
                Obj.pluck(rowsById, "name"),
            );
        });
    });

    describe("dataPluck, a dotted path", () => {
        it("matches arr.pluck for a list", () => {
            expectTypeOf(
                Data.dataPluck(nestedRowList, "user.name"),
            ).toEqualTypeOf(Arr.pluck(nestedRowList, "user.name"));
        });

        it("matches obj.pluck for a record", () => {
            expectTypeOf(
                Data.dataPluck(nestedRowsById, "user.name"),
            ).toEqualTypeOf(Obj.pluck(nestedRowsById, "user.name"));
        });
    });

    describe("dataPluck, a wildcard path", () => {
        it("matches arr.pluck for a list", () => {
            expectTypeOf(
                Data.dataPluck(wildcardRowList, "users.*.first"),
            ).toEqualTypeOf(Arr.pluck(wildcardRowList, "users.*.first"));
        });

        it("matches obj.pluck for a record", () => {
            expectTypeOf(
                Data.dataPluck(wildcardRowsById, "users.*.first"),
            ).toEqualTypeOf(Obj.pluck(wildcardRowsById, "users.*.first"));
        });
    });

    describe("dataPluck, the two-argument key/value form", () => {
        it("matches arr.pluck for a list", () => {
            expectTypeOf(Data.dataPluck(rowList, "name", "id")).toEqualTypeOf(
                Arr.pluck(rowList, "name", "id"),
            );
        });

        it("matches obj.pluck for a record", () => {
            expectTypeOf(Data.dataPluck(rowsById, "name", "id")).toEqualTypeOf(
                Obj.pluck(rowsById, "name", "id"),
            );
        });

        it("matches obj.pluck for a record given a callback key", () => {
            expectTypeOf(
                Data.dataPluck(rowsById, "name", (row) => row.id),
            ).toEqualTypeOf(Obj.pluck(rowsById, "name", (row) => row.id));
        });

        it("matches arr.pluck for a list given a callback key", () => {
            // Standing control: arr's `TValue extends Record<string, unknown>` widens the
            // row, so the list half reads `row["id"]` as unknown where obj reads `row.id`
            // as number. Simplify once arr stops widening; the pins already stand.
            expectTypeOf(
                Data.dataPluck(rowList, "name", (row) => Number(row["id"])),
            ).toEqualTypeOf(
                Arr.pluck(rowList, "name", (row) => Number(row["id"])),
            );
        });
    });

    describe("dataPluck, a callback value path", () => {
        it("matches obj.pluck for a record", () => {
            expectTypeOf(
                Data.dataPluck(rowsById, (row) => row.name),
            ).toEqualTypeOf(Obj.pluck(rowsById, (row) => row.name));
        });

        it("matches arr.pluck for a list", () => {
            // Same arr widening as the callback key above: `row.name` does not compile
            // on the list half because the row arrives as Record<string, unknown>.
            expectTypeOf(
                Data.dataPluck(rowList, (row) => row["name"]),
            ).toEqualTypeOf(Arr.pluck(rowList, (row) => row["name"]));
        });
    });

    describe("dataPluck, a null value path (F-23)", () => {
        // `Arr::pluck($data, null)` keeps each whole item. `dataPluck`'s hand-written
        // `value: string | callback` rejected `null` outright; both delegates take it.

        it("matches arr.pluck for a list", () => {
            expectTypeOf(Data.dataPluck(rowList, null)).toEqualTypeOf(
                Arr.pluck(rowList, null),
            );
        });

        it("matches obj.pluck for a record", () => {
            expectTypeOf(Data.dataPluck(rowsById, null)).toEqualTypeOf(
                Obj.pluck(rowsById, null),
            );
        });

        it("matches each backing given a null value and a key", () => {
            expectTypeOf(Data.dataPluck(rowList, null, "id")).toEqualTypeOf(
                Arr.pluck(rowList, null, "id"),
            );
            expectTypeOf(Data.dataPluck(rowsById, null, "id")).toEqualTypeOf(
                Obj.pluck(rowsById, null, "id"),
            );
        });
    });

    describe("dataSelect", () => {
        it("matches arr.select for a list", () => {
            expectTypeOf(Data.dataSelect(rowList, "name")).toEqualTypeOf(
                Arr.select(rowList, "name"),
            );
        });

        it("matches obj.select for a record", () => {
            expectTypeOf(Data.dataSelect(rowsById, "name")).toEqualTypeOf(
                Obj.select(rowsById, "name"),
            );
        });

        it("matches each backing given a key list", () => {
            expectTypeOf(
                Data.dataSelect(rowList, ["id", "name"]),
            ).toEqualTypeOf(Arr.select(rowList, ["id", "name"]));
            expectTypeOf(
                Data.dataSelect(rowsById, ["id", "name"]),
            ).toEqualTypeOf(Obj.select(rowsById, ["id", "name"]));
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        it("answers dataPluck from obj, and still covers the list half", () => {
            const declared = Data.dataPluck(unionRows, "name");
            expectTypeOf(declared).toEqualTypeOf(Obj.pluck(unionRows, "name"));
            // Standing control: obj's rejects-first row answers `never[]` for a union, so
            // arr's real list answer is NOT assignable. Delete this once obj stops rejecting one.
            expectTypeOf(Arr.pluck(rowList, "name")).not.toExtend<
                typeof declared
            >();
        });

        it("answers dataSelect from obj, and still covers the list half", () => {
            const declared = Data.dataSelect(unionRows, "name");
            expectTypeOf(declared).toEqualTypeOf(Obj.select(unionRows, "name"));
            expectTypeOf(Arr.select(rowList, "name")).not.toExtend<
                typeof declared
            >();
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row stands in for what `toKeyedData`
        // does at runtime, and a conditional over an overloaded delegate resolves only its
        // last signature, so the answer is obj's widest row, not the record's exact one.

        it("types a Map on dataPluck from obj's widest row", () => {
            const widest = Obj.pluck(opaque, "name");
            expectTypeOf(Data.dataPluck(rowMap, "name")).toEqualTypeOf<
                typeof widest
            >();
            // Soundness is the point of the row, so assignability, not equality.
            expectTypeOf(Data.dataPluck(rowMapAsRecord, "name")).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataSelect from obj's widest row", () => {
            const widest = Obj.select(opaque, "name");
            expectTypeOf(Data.dataSelect(rowMap, "name")).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataSelect(rowMapAsRecord, "name")).toExtend<
                typeof widest
            >();
        });
    });

    describe("inputs that fail to compile today (E2)", () => {
        it("accepts data no shape can be read off", () => {
            expectTypeOf(Data.dataPluck(opaque, "name")).toEqualTypeOf(
                Obj.pluck(opaque, "name"),
            );
            expectTypeOf(Data.dataSelect(opaque, "name")).toEqualTypeOf(
                Obj.select(opaque, "name"),
            );
        });
    });
});
