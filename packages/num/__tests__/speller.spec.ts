import { Speller } from "@laravel-js/num";
import { describe, expect, it } from "vitest";

// Smoke tests to cover the speller class and its constructor path
// It relies on to-words library defaults (en-IN). We'll just assert it returns a non-empty string for some values.

describe("Num/Speller", () => {
    it("constructs and spells numbers", () => {
        const sp = new Speller();
        expect(typeof sp.spellNumber(0)).toBe("string");
        expect(sp.spellNumber(0).length).toBeGreaterThan(0);
        expect(typeof sp.spellNumber(42)).toBe("string");
    });
});
