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

    describe("resolveSpliceRange", () => {
        it("runs a null length to the end, as PHP's ?int length reads null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-splice-null-length-to-the-end"
            expect(Utils.resolveSpliceRange(4, 1, null)).toEqual({
                start: 1,
                count: 3,
            });
            expect(Utils.resolveSpliceRange(4, -1, null)).toEqual({
                start: 3,
                count: 1,
            });
        });

        it("drops the offset's fraction before counting a negative one back from the end", () => {
            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-B-splice-fractional-and-non-finite-offsets"
            expect(Utils.resolveSpliceRange(4, 1.5, undefined)).toEqual({
                start: 1,
                count: 3,
            });
            expect(Utils.resolveSpliceRange(4, -1.5, 1)).toEqual({
                start: 3,
                count: 1,
            });
        });

        it("drops the length's fraction before counting a negative one back from the end", () => {
            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-B-splice-fractional-and-non-finite-lengths"
            expect(Utils.resolveSpliceRange(4, 1, 1.5)).toEqual({
                start: 1,
                count: 1,
            });
            expect(Utils.resolveSpliceRange(4, 1, -1.5)).toEqual({
                start: 1,
                count: 2,
            });
        });

        it("throws array_splice()'s TypeError for an offset or a length no int holds, the offset's first", () => {
            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-B-splice-fractional-and-non-finite-offsets" and "C32-B-splice-fractional-and-non-finite-lengths"
            for (const value of [NaN, Infinity, -Infinity, 1e19]) {
                expect(() => Utils.resolveSpliceRange(4, value, value)).toThrow(
                    new TypeError(
                        "array_splice(): Argument #2 ($offset) must be of type int, float given",
                    ),
                );
                expect(() => Utils.resolveSpliceRange(4, 1, value)).toThrow(
                    new TypeError(
                        "array_splice(): Argument #3 ($length) must be of type ?int, float given",
                    ),
                );
            }
        });
    });

    describe("resolveRangeSize", () => {
        it("counts an integer range's whole steps and rounds a float range's size half up", () => {
            // CollectionTest::testRangeMethod
            expect(Utils.resolveRangeSize(1, 5, 1)).toBe(5);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-descending-step"
            expect(Utils.resolveRangeSize(10, 1, 3)).toBe(4);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-float-size-rounds-half-up"
            expect(Utils.resolveRangeSize(0.2, 0.5, 0.1)).toBe(4);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-single"
            expect(Utils.resolveRangeSize(3, 3, 1)).toBe(1);
        });

        it("throws range()'s ValueError for an argument it refuses, the step's first", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-non-finite-arguments-throw",
            // "C32-A-range-checks-the-step-first", "C32-A-range-step-zero-throws",
            // "C32-A-range-negative-step-increasing-throws" and "C32-A-range-step-exceeds-span-throws"
            expect(() => Utils.resolveRangeSize(NaN, NaN, NaN)).toThrow(
                new Error(
                    "range(): Argument #3 ($step) must be a finite number, NAN provided",
                ),
            );
            expect(() => Utils.resolveRangeSize(NaN, 5, 0)).toThrow(
                new Error("range(): Argument #3 ($step) cannot be 0"),
            );
            expect(() => Utils.resolveRangeSize(-Infinity, 5, 1)).toThrow(
                new Error(
                    "range(): Argument #1 ($start) must be a finite number, INF provided",
                ),
            );
            expect(() => Utils.resolveRangeSize(0, Infinity, 1)).toThrow(
                new Error(
                    "range(): Argument #2 ($end) must be a finite number, INF provided",
                ),
            );
            expect(() => Utils.resolveRangeSize(1, 5, -1)).toThrow(
                new Error(
                    "range(): Argument #3 ($step) must be greater than 0 for increasing ranges",
                ),
            );
            expect(() => Utils.resolveRangeSize(1, 2, 3)).toThrow(
                new Error(
                    "range(): Argument #3 ($step) must be less than the range spanned by argument #1 ($start) and argument #2 ($end)",
                ),
            );
        });

        it("throws range()'s ValueError past the maximum array size, printing an integer range's bounds or a float range's", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-past-maximum-array-size"
            for (const [[start, end, step], message] of [
                [
                    [1, 1073741824, 1],
                    "The supplied range exceeds the maximum array size by 0 elements: start=1, end=1073741824, step=1. Calculated size: 1073741823. Maximum size: 1073741824.",
                ],
                [
                    [0, 1073741824, 1],
                    "The supplied range exceeds the maximum array size by 1 elements: start=0, end=1073741824, step=1. Calculated size: 1073741824. Maximum size: 1073741824.",
                ],
                [
                    [2147483648, 1, 1],
                    "The supplied range exceeds the maximum array size by 1073741824 elements: start=1, end=2147483648, step=1. Calculated size: 2147483647. Maximum size: 1073741824.",
                ],
                [
                    [1, 2147483648, 2],
                    "The supplied range exceeds the maximum array size by 0 elements: start=1, end=2147483648, step=2. Calculated size: 1073741823. Maximum size: 1073741824.",
                ],
                [
                    [1, 1e19, 1],
                    "The supplied range exceeds the maximum array size by 9999999998926258176.0 elements: start=1.0, end=10000000000000000000.0, step=1.0. Max size: 1073741824",
                ],
                [
                    [1e19, 1, 1],
                    "The supplied range exceeds the maximum array size by 9999999998926258176.0 elements: start=1.0, end=10000000000000000000.0, step=1.0. Max size: 1073741824",
                ],
                [
                    [0, 2147483648, 0.5],
                    "The supplied range exceeds the maximum array size by 3221225473.0 elements: start=0.0, end=2147483648.0, step=0.5. Max size: 1073741824",
                ],
                [
                    [0.5, 1e10, 1],
                    "The supplied range exceeds the maximum array size by 8926258176.5 elements: start=0.5, end=10000000000.0, step=1.0. Max size: 1073741824",
                ],
                [
                    [1, 1e22, 1],
                    "The supplied range exceeds the maximum array size by 9999999999998926258176.0 elements: start=1.0, end=10000000000000000000000.0, step=1.0. Max size: 1073741824",
                ],
            ] as [[number, number, number], string][]) {
                expect(() => Utils.resolveRangeSize(start, end, step)).toThrow(
                    new Error(message),
                );
            }
        });

        it("prints a float range's figures as %.1f does, an exact half to even and its sign from the value", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-size-message-rounding" and
            // "C32-A-range-size-message-signs-and-carries"
            for (const [[start, end, step], message] of [
                [
                    [0.25, 1e10, 1],
                    "The supplied range exceeds the maximum array size by 8926258176.8 elements: start=0.2, end=10000000000.0, step=1.0. Max size: 1073741824",
                ],
                [
                    [-0.25, 1e10, 1],
                    "The supplied range exceeds the maximum array size by 8926258177.2 elements: start=-0.2, end=10000000000.0, step=1.0. Max size: 1073741824",
                ],
                [
                    [1.75, 1e10, 1],
                    "The supplied range exceeds the maximum array size by 8926258175.2 elements: start=1.8, end=10000000000.0, step=1.0. Max size: 1073741824",
                ],
                [
                    [0, 1e10, 1.25],
                    "The supplied range exceeds the maximum array size by 6926258177.0 elements: start=0.0, end=10000000000.0, step=1.2. Max size: 1073741824",
                ],
                [
                    [-0, 1e10, 1],
                    "The supplied range exceeds the maximum array size by 8926258177.0 elements: start=0.0, end=10000000000.0, step=1.0. Max size: 1073741824",
                ],
                [
                    [-0.04, 1e10, 1],
                    "The supplied range exceeds the maximum array size by 8926258177.0 elements: start=-0.0, end=10000000000.0, step=1.0. Max size: 1073741824",
                ],
                [
                    [0.05, 1e10, 1],
                    "The supplied range exceeds the maximum array size by 8926258177.0 elements: start=0.1, end=10000000000.0, step=1.0. Max size: 1073741824",
                ],
                [
                    [99.95, 1e10, 1],
                    "The supplied range exceeds the maximum array size by 8926258077.0 elements: start=100.0, end=10000000000.0, step=1.0. Max size: 1073741824",
                ],
            ] as [[number, number, number], string][]) {
                expect(() => Utils.resolveRangeSize(start, end, step)).toThrow(
                    new Error(message),
                );
            }
        });

        it("prints a size that overflows as inf", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-size-message-infinite"
            for (const [[start, end, step], message] of [
                [
                    [0, 1, 5e-324],
                    "The supplied range exceeds the maximum array size by inf elements: start=0.0, end=1.0, step=0.0. Max size: 1073741824",
                ],
                [
                    [-1e308, 1e308, 1],
                    "The supplied range exceeds the maximum array size by inf elements: start=-100000000000000001097906362944045541740492309677311846336810682903157585404911491537163328978494688899061249669721172515611590283743140088328307009198146046031271664502933027185697489699588559043338384466165001178426897626212945177628091195786707458122783970171784415105291802893207873272974885715430223118336.0, end=100000000000000001097906362944045541740492309677311846336810682903157585404911491537163328978494688899061249669721172515611590283743140088328307009198146046031271664502933027185697489699588559043338384466165001178426897626212945177628091195786707458122783970171784415105291802893207873272974885715430223118336.0, step=1.0. Max size: 1073741824",
                ],
                [
                    [0, 1e308, 1e-10],
                    "The supplied range exceeds the maximum array size by inf elements: start=0.0, end=100000000000000001097906362944045541740492309677311846336810682903157585404911491537163328978494688899061249669721172515611590283743140088328307009198146046031271664502933027185697489699588559043338384466165001178426897626212945177628091195786707458122783970171784415105291802893207873272974885715430223118336.0, step=0.0. Max size: 1073741824",
                ],
            ] as [[number, number, number], string][]) {
                expect(() => Utils.resolveRangeSize(start, end, step)).toThrow(
                    new Error(message),
                );
            }
        });

        it("throws range()'s ValueError for a count past the maximum array size, as times() hands range() one", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-times-past-maximum-array-size"
            for (const [[start, end, step], message] of [
                [
                    [1, 1e19, 1],
                    "The supplied range exceeds the maximum array size by 9999999998926258176.0 elements: start=1.0, end=10000000000000000000.0, step=1.0. Max size: 1073741824",
                ],
                [
                    [1, 2147483648, 1],
                    "The supplied range exceeds the maximum array size by 1073741824 elements: start=1, end=2147483648, step=1. Calculated size: 2147483647. Maximum size: 1073741824.",
                ],
                [
                    [1, 1073741824, 1],
                    "The supplied range exceeds the maximum array size by 0 elements: start=1, end=1073741824, step=1. Calculated size: 1073741823. Maximum size: 1073741824.",
                ],
            ] as [[number, number, number], string][]) {
                expect(() => Utils.resolveRangeSize(start, end, step)).toThrow(
                    new Error(message),
                );
            }
        });
    });
});
