import { random, randomInt, randomString } from "@laravel-js/str";
import { describe, expect, it } from "vitest";

describe("Random utilities", () => {
    it("generates alpha-numeric string of given length", () => {
        const r = randomString(32);
        expect(r).toHaveLength(32);
        expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
    });

    it("delegates Str.random to Random.string", () => {
        const r = random(24);
        expect(r).toHaveLength(24);
        expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
    });

    it("randomInt yields value in inclusive range", () => {
        for (let i = 0; i < 50; i++) {
            const v = randomInt(5, 10);
            expect(v).toBeGreaterThanOrEqual(5);
            expect(v).toBeLessThanOrEqual(10);
        }
    });

    it("randomInt same min max returns that value", () => {
        expect(randomInt(7, 7)).toBe(7);
    });
});
