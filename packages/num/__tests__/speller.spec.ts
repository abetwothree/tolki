import { spell, spellOrdinal } from "@tolki/num";
import { describe, expect, it } from "vitest";

describe("Num/Speller", () => {
    describe("spell", () => {
        it("Laravel tests", async () => {
            expect(await spell(10)).toBe("ten");
            expect(await spell(1.2)).toBe("one point two");

            expect(await spell(3, "fr")).toBe("trois");

            expect(await spell(9, null, 10)).toBe("9"); // 9 <= 10, so formatted
            expect(await spell(10, null, 10)).toBe("10"); // 10 <= 10, so formatted
            expect(await spell(11, null, 10)).toBe("eleven"); // 11 > 10, so spelled

            expect(await spell(9, null, null, 10)).toBe("nine"); // 9 < 10, so spelled
            expect(await spell(10, null, null, 10)).toBe("10"); // 10 >= 10, so formatted
            expect(await spell(11, null, null, 10)).toBe("11"); // 11 >= 10, so formatted

            expect(await spell(10000, null, null, 50000)).toBe("ten thousand"); // 10000 < 50000, so spelled
            expect(await spell(100000, null, null, 50000)).toBe("100,000"); // 100000 >= 50000, so formatted
        });

        it("spells out numbers in words", async () => {
            expect(await spell(0)).toBe("zero");
            expect(await spell(1)).toBe("one");
            expect(await spell(42)).toBe("forty two");
            expect(await spell(123)).toBe("one hundred twenty three");
        });

        it("spells out decimal numbers", async () => {
            expect(await spell(123.45)).toBe(
                "one hundred twenty three point forty five",
            );
            expect(await spell(1.5)).toBe("one point five");
        });

        it("accepts string numbers", async () => {
            expect(await spell("42")).toBe("forty two");
            expect(await spell("123.45")).toBe(
                "one hundred twenty three point forty five",
            );
        });

        it("returns formatted number when <= after threshold", async () => {
            // number <= after returns formatted
            expect(await spell(5, null, 10)).toBe("5"); // 5 <= 10, so formatted
            expect(await spell(10, null, 10)).toBe("10"); // 10 <= 10, so formatted
            expect(await spell(11, null, 10)).toBe("eleven"); // 11 > 10, so spelled
        });

        it("returns formatted number when >= until threshold", async () => {
            // number >= until returns formatted
            expect(await spell(100, null, null, 50)).toBe("100"); // 100 >= 50, so formatted
            expect(await spell(50, null, null, 50)).toBe("50"); // 50 >= 50, so formatted
            expect(await spell(49, null, null, 50)).toBe("forty nine"); // 49 < 50, so spelled
        });

        it("handles both after and until thresholds", async () => {
            // Only spell numbers between after and until (exclusive)
            expect(await spell(5, null, 10, 100)).toBe("5"); // 5 <= 10
            expect(await spell(15, null, 10, 100)).toBe("fifteen"); // 10 < 15 < 100
            expect(await spell(100, null, 10, 100)).toBe("100"); // 100 >= 100
        });

        it("uses different locales", async () => {
            expect(await spell(42, "en-US")).toBe("forty two");
            expect(await spell(42, "fr-FR")).toBe("quarante-deux");
            expect(await spell(42, "es-ES")).toBe("cuarenta y dos");
        });

        it("falls back to en-US for unsupported locales", async () => {
            expect(await spell(42, "xx-XX")).toBe("forty two");
        });

        it("maps partial locale codes to supported ones", async () => {
            // "en" should map to an English locale
            expect(await spell(42, "en")).toBe("forty two");
            // "fr" should map to a French locale
            expect(await spell(42, "fr")).toBe("quarante-deux");
        });
    });

    describe("spellOrdinal", () => {
        it("Laravel tests", async () => {
            expect(await spellOrdinal(1)).toBe("first");
            expect(await spellOrdinal(2)).toBe("second");
            expect(await spellOrdinal(3)).toBe("third");
        });

        it("spells out numbers as ordinal words", async () => {
            expect(await spellOrdinal(1)).toBe("first");
            expect(await spellOrdinal(2)).toBe("second");
            expect(await spellOrdinal(21)).toBe("twenty first");
        });

        it("floors decimal values", async () => {
            expect(await spellOrdinal(1.9)).toBe("first");
            expect(await spellOrdinal(21.5)).toBe("twenty first");
        });

        it("uses different locales", async () => {
            expect(await spellOrdinal(1, "fr-FR")).toBe("premier");
            expect(await spellOrdinal(42, "fr-FR")).toBe("quarante-deux");
        });

        it("As strings", async () => {
            expect(await spellOrdinal("1")).toBe("first");
            expect(await spellOrdinal("2")).toBe("second");
            expect(await spellOrdinal("3")).toBe("third");
        });
    });
});
