import type { PathKey } from "@tolki/types";
import { createSortSpecComparator } from "@tolki/utils";
import { describe, expectTypeOf, it } from "vitest";

const comparatorFor = createSortSpecComparator(
    (item: unknown, key: PathKey) =>
        (item as Record<string, unknown>)[key as string],
);

describe("createSortSpecComparator", () => {
    it("types a comparator's answer as the number or the bool a comparator descriptor may give", () => {
        expectTypeOf(
            comparatorFor<number>((a, b) => a > b, false),
        ).toEqualTypeOf<(a: number, b: number) => number | boolean>();
        expectTypeOf(
            comparatorFor<{ age: number }>("age", false),
        ).toEqualTypeOf<
            (a: { age: number }, b: { age: number }) => number | boolean
        >();
    });
});
