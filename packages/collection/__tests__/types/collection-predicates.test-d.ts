import { collect } from "@tolki/collection";
import { describe, expectTypeOf, it } from "vitest";

import { type Row, rows } from "./fixtures";

describe("collection predicate type tests", () => {
    describe("firstWhere", () => {
        it("types the callback's value as the item, so reading a field it lacks is a compile error", () => {
            collect(rows).firstWhere((row) => {
                expectTypeOf(row).toEqualTypeOf<Row>();

                // @ts-expect-error - a Row has no nonexistent field
                return row.nonexistent === "key";
            });
        });
    });
});
