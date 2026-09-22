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
            expectTypeOf(
                Data.dataPluck(rowList, "name", (row) => row.id),
            ).toEqualTypeOf(Arr.pluck(rowList, "name", (row) => row.id));
        });
    });

    describe("dataPluck, a callback value path", () => {
        it("matches obj.pluck for a record", () => {
            expectTypeOf(
                Data.dataPluck(rowsById, (row) => row.name),
            ).toEqualTypeOf(Obj.pluck(rowsById, (row) => row.name));
        });

        it("matches arr.pluck for a list", () => {
            expectTypeOf(
                Data.dataPluck(rowList, (row) => row.name),
            ).toEqualTypeOf(Arr.pluck(rowList, (row) => row.name));
        });
    });

    describe("dataPluck, a null value path", () => {
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
        it("answers dataPluck off an empty key set, covering neither backing", () => {
            // obj's `<T extends object>` row reads the union's collapsed `keyof`, which is
            // `never`, so the row resolves off no declared key at all.
            const declared = Data.dataPluck(unionRows, "name");
            expectTypeOf(declared).toEqualTypeOf(Obj.pluck(unionRows, "name"));
        });

        it("answers dataSelect from obj, covering only its own list arm", () => {
            // obj's mapped row distributes, so the union answers a union of both shapes.
            // arr's row constraint is `object`, so its own answer for a list of interface
            // rows is `Pick<Row, "name">[]`, which arr-subsets.test-d.ts pins directly.
            const declared = Data.dataSelect(unionRows, "name");
            expectTypeOf(declared).toEqualTypeOf(Obj.select(unionRows, "name"));
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row is inferred from the last of obj's overloads,
        // so a Map gets obj's widest row, not obj's own Map row.

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

    describe("inputs a Record<PropertyKey, unknown> constraint would reject", () => {
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
