import { describe, it, expect } from "vitest";
import { Number } from "@laravel-js/number";

describe("Number", () => {
    describe("format", () => {
        it("should format a number", () => {
            expect(Number.format(1234.5678, 2)).toBe("1,234.57");
            expect(Number.format(1234.5)).toBe("1,234.5");
            expect(Number.format(100000)).toBe("100,000");
            expect(Number.format(100000.1234, null, 3)).toBe("100,000.123");

            expect(Number.format(0)).toBe("0");
            expect(Number.format(0.0)).toBe("0");
            expect(Number.format(0.0)).toBe("0");
            expect(Number.format(1)).toBe("1");
            expect(Number.format(10)).toBe("10");
            expect(Number.format(25)).toBe("25");
            expect(Number.format(100)).toBe("100");
            expect(Number.format(100000)).toBe("100,000");
            expect(Number.format(100000, 2)).toBe("100,000.00");
            expect(Number.format(100000.123, 2)).toBe("100,000.12");
            expect(Number.format(100000.1234, null, 3)).toBe("100,000.123");
            expect(Number.format(100000.1236, null, 3)).toBe("100,000.124");
            expect(Number.format(123456789)).toBe("123,456,789");

            expect(Number.format(-1)).toBe("-1");
            expect(Number.format(-10)).toBe("-10");
            expect(Number.format(-25)).toBe("-25");

            expect(Number.format(0.2)).toBe("0.2");
            expect(Number.format(0.2, 2)).toBe("0.20");
            expect(Number.format(0.1234, null, 3)).toBe("0.123");
            expect(Number.format(1.23)).toBe("1.23");
            expect(Number.format(-1.23)).toBe("-1.23");
            expect(Number.format(123.456)).toBe("123.456");

            expect(Number.format(Infinity)).toBe("∞");
            expect(Number.format(NaN)).toBe("NaN");
        });

        it("format with different locales", () => {
            expect(Number.format(123456789, null, null, "en")).toBe(
                "123,456,789",
            );
            expect(Number.format(123456789, null, null, "de")).toBe(
                "123.456.789",
            );
            expect(Number.format(123456789, null, null, "fr")).toBe(
                "123 456 789",
            );
            expect(Number.format(123456789, null, null, "ru")).toBe(
                "123 456 789",
            );
            expect(Number.format(123456789, null, null, "sv")).toBe(
                "123 456 789",
            );
        });

        it("format with app locale", () => {
            expect(Number.format(123456789)).toBe("123,456,789");

            Number.useLocale("de");

            expect(Number.format(123456789)).toBe("123.456.789");

            Number.useLocale("en");
        });
    });

    describe("parse", () => {
        it("should parse a string to a number", () => {
            expect(Number.parse("1,234.57")).toBe(1234.57);
            expect(Number.parse("123 456,7", "fr")).toBe(123456.7);

            expect(Number.parse("1,234")).toBe(1234.0);
            expect(Number.parse("1,234.5")).toBe(1234.5);
            expect(Number.parse("1,234.56")).toBe(1234.56);
            expect(Number.parse("-1,234.56")).toBe(-1234.56);

            expect(Number.parse("1.234,56", "de")).toBe(1234.56);
            expect(Number.parse("1 234,56", "fr")).toBe(1234.56);
        });
    });

    it("parseInt", () => {
        expect(Number.parseInt("1,234")).toBe(1234);
        expect(Number.parseInt("1,234.5")).toBe(1234);
        expect(Number.parseInt("-1,234.56")).toBe(-1234);

        expect(Number.parseInt("1.234", "de")).toBe(1234);
        expect(Number.parseInt("1 234", "fr")).toBe(1234);
    });

    it("parseFloat", () => {
        expect(Number.parseFloat("1,234")).toBe(1234.0);
        expect(Number.parseFloat("1,234.5")).toBe(1234.5);
        expect(Number.parseFloat("1,234.56")).toBe(1234.56);
        expect(Number.parseFloat("-1,234.56")).toBe(-1234.56);

        expect(Number.parseFloat("1.234,56", "de")).toBe(1234.56);
        expect(Number.parseFloat("1 234,56", "fr")).toBe(1234.56);
    });

    describe.skip("spell", () => {
        it("spell out", () => {
            expect(Number.spell(10)).toBe("ten");
            expect(Number.spell(1.2)).toBe("one point two");
        });

        it("spell out with locale", () => {
            expect(Number.spell(3, "fr")).toBe("trois");
        });

        it("spell out with threshold", () => {
            expect(Number.spell(9, "en", 10)).toBe("9");
            expect(Number.spell(10, "en", 10)).toBe("10");
            expect(Number.spell(11, "en", 10)).toBe("eleven");

            expect(Number.spell(9, "en", null, 10)).toBe("nine");

            expect(Number.spell(10, "en", null, 10)).toBe("10");
            expect(Number.spell(11, "en", null, 10)).toBe("11");

            expect(Number.spell(10000, "en", null, 50000)).toBe("ten thousand");
            expect(Number.spell(100000, "en", null, 50000)).toBe("100,000");
        });
    });

    it("ordinal", () => {
        expect(Number.ordinal(1)).toBe("1st");
        expect(Number.ordinal(2)).toBe("2nd");
        expect(Number.ordinal(3)).toBe("3rd");
        expect(Number.ordinal(4)).toBe("4th");
        expect(Number.ordinal(11)).toBe("11th");
        expect(Number.ordinal(12)).toBe("12th");
        expect(Number.ordinal(13)).toBe("13th");
    });

    it("ordinal - no Intl.PluralRules exist", () => {
        const original = Intl.PluralRules;
        // @ts-expect-error Cannot assign to 'PluralRules' because it is a read-only property.
        Intl.PluralRules = undefined;

        expect(Number.ordinal(1)).toBe("1st");
        expect(Number.ordinal(2)).toBe("2nd");
        expect(Number.ordinal(3)).toBe("3rd");
        expect(Number.ordinal(4)).toBe("4th");
        expect(Number.ordinal(11)).toBe("11th");
        expect(Number.ordinal(12)).toBe("12th");
        expect(Number.ordinal(13)).toBe("13th");

        // @ts-expect-error Cannot assign to 'PluralRules' because it is a read-only property.
        Intl.PluralRules = original;
    });
});
