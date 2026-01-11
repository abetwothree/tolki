import { spell, spellOrdinal } from "@tolki/num";
import { describe, expect, it } from "vitest";

describe("Num/Speller", () => {
    describe("spell", () => {
        it("spells out numbers in words", () => {
            expect(spell(0)).toBe("Zero");
            expect(spell(1)).toBe("One");
            expect(spell(42)).toBe("Forty Two");
            expect(spell(123)).toBe("One Hundred Twenty Three");
        });

        it("spells out decimal numbers", () => {
            // Note: to-words spells decimals as full numbers (45 -> "Forty Five")
            expect(spell(123.45)).toBe(
                "One Hundred Twenty Three Point Forty Five",
            );
            expect(spell(1.5)).toBe("One Point Five");
        });

        it("accepts string numbers", () => {
            expect(spell("42")).toBe("Forty Two");
            expect(spell("123.45")).toBe(
                "One Hundred Twenty Three Point Forty Five",
            );
        });

        it("returns formatted number when <= after threshold", () => {
            // number <= after returns formatted
            expect(spell(5, null, 10)).toBe("5"); // 5 <= 10, so formatted
            expect(spell(10, null, 10)).toBe("10"); // 10 <= 10, so formatted
            expect(spell(11, null, 10)).toBe("Eleven"); // 11 > 10, so spelled
        });

        it("returns formatted number when >= until threshold", () => {
            // number >= until returns formatted
            expect(spell(100, null, null, 50)).toBe("100"); // 100 >= 50, so formatted
            expect(spell(50, null, null, 50)).toBe("50"); // 50 >= 50, so formatted
            expect(spell(49, null, null, 50)).toBe("Forty Nine"); // 49 < 50, so spelled
        });

        it("handles both after and until thresholds", () => {
            // Only spell numbers between after and until (exclusive)
            expect(spell(5, null, 10, 100)).toBe("5"); // 5 <= 10
            expect(spell(15, null, 10, 100)).toBe("Fifteen"); // 10 < 15 < 100
            expect(spell(100, null, 10, 100)).toBe("100"); // 100 >= 100
        });

        it("uses different locales", () => {
            expect(spell(42, "en-US")).toBe("Forty Two");
            expect(spell(42, "fr-FR")).toBe("Quarante-Deux");
            expect(spell(42, "es-ES")).toBe("Cuarenta Y Dos");
        });

        it("falls back to en-US for unsupported locales", () => {
            expect(spell(42, "xx-XX")).toBe("Forty Two");
        });

        it("maps partial locale codes to supported ones", () => {
            // "en" should map to an English locale
            expect(spell(42, "en")).toBe("Forty Two");
            // "fr" should map to a French locale
            expect(spell(42, "fr")).toBe("Quarante-Deux");
        });
    });

    describe("spellOrdinal", () => {
        it("spells out numbers as cardinal words", () => {
            // Note: to-words doesn't support true ordinals, so we return cardinals
            expect(spellOrdinal(1)).toBe("One");
            expect(spellOrdinal(2)).toBe("Two");
            expect(spellOrdinal(21)).toBe("Twenty One");
        });

        it("floors decimal values", () => {
            expect(spellOrdinal(1.9)).toBe("One");
            expect(spellOrdinal(21.5)).toBe("Twenty One");
        });

        it("uses different locales", () => {
            expect(spellOrdinal(42, "fr-FR")).toBe("Quarante-Deux");
        });
    });
});
