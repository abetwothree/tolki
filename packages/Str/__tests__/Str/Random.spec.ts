import { describe, it, expect } from "vitest";
import { Random, random_int, Str } from "@laravel-js/str";

describe("Random utilities", () => {
    it("generates alpha-numeric string of given length", () => {
        const r = Random.string(32);
        expect(r).toHaveLength(32);
        expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
    });

    it("delegates Str.random to Random.string", () => {
        const r = Str.random(24);
        expect(r).toHaveLength(24);
        expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
    });

    it("random_int yields value in inclusive range", () => {
        for (let i = 0; i < 50; i++) {
            const v = random_int(5, 10);
            expect(v).toBeGreaterThanOrEqual(5);
            expect(v).toBeLessThanOrEqual(10);
        }
    });

    it("random_int same min max returns that value", () => {
        expect(Random.int(7, 7)).toBe(7);
    });
});
