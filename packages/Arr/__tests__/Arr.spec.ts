import { describe, it, expect } from "vitest";
import { Arr } from "@laravel-js/arr";

describe("Arr", () => {
    describe("map", () => {
        it.skip("should apply a function to each element", () => {
            const result = Arr.map([1, 2, 3], (x) => x * 2);
            expect(result).toEqual([2, 4, 6]);
        });
    });

    describe("filter", () => {
        it.skip("should filter elements based on a predicate", () => {
            const result = Arr.filter([1, 2, 3], (x) => x > 1);
            expect(result).toEqual([2, 3]);
        });
    });
});
