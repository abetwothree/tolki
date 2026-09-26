import * as Utils from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("Utils", () => {
    describe("resolveTakeCount", () => {
        it("drops a fraction, as the loop over range(1, $count) does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-shift-fractional-and-non-finite-counts"
            expect(Utils.resolveTakeCount(2.5, 4)).toBe(2);
            expect(Utils.resolveTakeCount(2, 4)).toBe(2);
            expect(Utils.resolveTakeCount(1, 4)).toBe(1);
        });

        it("takes every item for a NAN or an infinite count, and never more than there are", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-shift-fractional-and-non-finite-counts"
            expect(Utils.resolveTakeCount(NaN, 4)).toBe(4);
            expect(Utils.resolveTakeCount(Infinity, 4)).toBe(4);
            expect(Utils.resolveTakeCount(1e19, 4)).toBe(4);
        });

        it("throws range()'s ValueError for a fraction below 2, unless fewer items cap it", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-shift-fractional-and-non-finite-counts"
            // and "C32-B-pop-fractional-and-non-finite-counts"
            const failure = new Error(
                "range(): Argument #3 ($step) must be less than the range spanned by argument #1 ($start) and argument #2 ($end)",
            );

            expect(() => Utils.resolveTakeCount(1.5, 4)).toThrow(failure);
            expect(() => Utils.resolveTakeCount(0.5, 4)).toThrow(failure);
            expect(Utils.resolveTakeCount(1.5, 1)).toBe(1);
        });

        it("takes nothing when there is nothing to take", () => {
            // JS-only: PHP checks for an empty collection before it reaches the loop
            expect(Utils.resolveTakeCount(2.5, 0)).toBe(0);
            expect(Utils.resolveTakeCount(NaN, 0)).toBe(0);
        });
    });
});
