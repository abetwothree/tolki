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

    describe("resolvePadLength", () => {
        it("drops a fraction toward zero, as array_pad()'s int parameter does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pad-fractional-and-non-int-sizes"
            expect(Utils.resolvePadLength(7.5)).toBe(7);
            expect(Utils.resolvePadLength(-7.5)).toBe(-7);
            expect(Utils.resolvePadLength(0.5)).toBe(0);
        });

        it("throws array_pad()'s TypeError for NAN, an infinity or a length past PHP's int range", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pad-fractional-and-non-int-sizes"
            for (const size of [NaN, Infinity, -Infinity, 1e19, -1e19]) {
                expect(() => Utils.resolvePadLength(size)).toThrow(
                    new TypeError(
                        "array_pad(): Argument #2 ($length) must be of type int, float given",
                    ),
                );
            }
        });

        it("throws array_pad()'s ValueError for a length past the maximum array size, either way round", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pad-past-maximum-array-size"
            for (const size of [1073741825, -1073741825, 1e18]) {
                expect(() => Utils.resolvePadLength(size)).toThrow(
                    new Error(
                        "array_pad(): Argument #2 ($length) must not exceed the maximum allowed array size",
                    ),
                );
            }

            // PHP lets a length of exactly 2^30 through, then runs out of memory before it can answer
            expect(Utils.resolvePadLength(-(2 ** 30))).toBe(-(2 ** 30));
        });
    });
});
