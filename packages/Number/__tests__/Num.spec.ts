import { describe, it, expect } from "vitest";
import { Num } from "@laravel-js/number";

describe("Number", () => {
    describe("format", () => {
        it("should format a number", () => {
            expect(Num.format(1234.5678, 2)).toBe("1,234.57");
            expect(Num.format(1234.5)).toBe("1,234.5");
            expect(Num.format(100000)).toBe("100,000");
            expect(Num.format(100000.1234, null, 3)).toBe("100,000.123");

            expect(Num.format(0)).toBe("0");
            expect(Num.format(0.0)).toBe("0");
            expect(Num.format(0.0)).toBe("0");
            expect(Num.format(1)).toBe("1");
            expect(Num.format(10)).toBe("10");
            expect(Num.format(25)).toBe("25");
            expect(Num.format(100)).toBe("100");
            expect(Num.format(100000)).toBe("100,000");
            expect(Num.format(100000, 2)).toBe("100,000.00");
            expect(Num.format(100000.123, 2)).toBe("100,000.12");
            expect(Num.format(100000.1234, null, 3)).toBe("100,000.123");
            expect(Num.format(100000.1236, null, 3)).toBe("100,000.124");
            expect(Num.format(123456789)).toBe("123,456,789");

            expect(Num.format(-1)).toBe("-1");
            expect(Num.format(-10)).toBe("-10");
            expect(Num.format(-25)).toBe("-25");

            expect(Num.format(0.2)).toBe("0.2");
            expect(Num.format(0.2, 2)).toBe("0.20");
            expect(Num.format(0.1234, null, 3)).toBe("0.123");
            expect(Num.format(1.23)).toBe("1.23");
            expect(Num.format(-1.23)).toBe("-1.23");
            expect(Num.format(123.456)).toBe("123.456");

            expect(Num.format(Infinity)).toBe("∞");
            expect(Num.format(NaN)).toBe("NaN");
        });

        it("format with different locales", () => {
            expect(Num.format(123456789, null, null, "en")).toBe("123,456,789");
            expect(Num.format(123456789, null, null, "de")).toBe("123.456.789");
            expect(Num.format(123456789, null, null, "fr")).toBe("123 456 789");
            expect(Num.format(123456789, null, null, "ru")).toBe("123 456 789");
            expect(Num.format(123456789, null, null, "sv")).toBe("123 456 789");
        });

        it("format with app locale", () => {
            expect(Num.format(123456789)).toBe("123,456,789");

            Num.useLocale("de");

            expect(Num.format(123456789)).toBe("123.456.789");

            Num.useLocale("en");
        });
    });

    describe("parse", () => {
        it("should parse a string to a number", () => {
            expect(Num.parse("1,234.57")).toBe(1234.57);
            expect(Num.parse("123 456,7", "fr")).toBe(123456.7);

            expect(Num.parse("1,234")).toBe(1234.0);
            expect(Num.parse("1,234.5")).toBe(1234.5);
            expect(Num.parse("1,234.56")).toBe(1234.56);
            expect(Num.parse("-1,234.56")).toBe(-1234.56);

            expect(Num.parse("1.234,56", "de")).toBe(1234.56);
            expect(Num.parse("1 234,56", "fr")).toBe(1234.56);
        });
    });

    it("parseInt", () => {
        expect(Num.parseInt("1,234")).toBe(1234);
        expect(Num.parseInt("1,234.5")).toBe(1234);
        expect(Num.parseInt("-1,234.56")).toBe(-1234);

        expect(Num.parseInt("1.234", "de")).toBe(1234);
        expect(Num.parseInt("1 234", "fr")).toBe(1234);
    });

    it("parseFloat", () => {
        expect(Num.parseFloat("1,234")).toBe(1234.0);
        expect(Num.parseFloat("1,234.5")).toBe(1234.5);
        expect(Num.parseFloat("1,234.56")).toBe(1234.56);
        expect(Num.parseFloat("-1,234.56")).toBe(-1234.56);

        expect(Num.parseFloat("1.234,56", "de")).toBe(1234.56);
        expect(Num.parseFloat("1 234,56", "fr")).toBe(1234.56);
    });

    describe.skip("spell", () => {
        it("spell out", () => {
            expect(Num.spell(10)).toBe("ten");
            expect(Num.spell(1.2)).toBe("one point two");
        });

        it("spell out with locale", () => {
            expect(Num.spell(3, "fr")).toBe("trois");
        });

        it("spell out with threshold", () => {
            expect(Num.spell(9, "en", 10)).toBe("9");
            expect(Num.spell(10, "en", 10)).toBe("10");
            expect(Num.spell(11, "en", 10)).toBe("eleven");

            expect(Num.spell(9, "en", null, 10)).toBe("nine");

            expect(Num.spell(10, "en", null, 10)).toBe("10");
            expect(Num.spell(11, "en", null, 10)).toBe("11");

            expect(Num.spell(10000, "en", null, 50000)).toBe("ten thousand");
            expect(Num.spell(100000, "en", null, 50000)).toBe("100,000");
        });
    });

    it("ordinal", () => {
        expect(Num.ordinal(1)).toBe("1st");
        expect(Num.ordinal(2)).toBe("2nd");
        expect(Num.ordinal(3)).toBe("3rd");
        expect(Num.ordinal(4)).toBe("4th");
        expect(Num.ordinal(11)).toBe("11th");
        expect(Num.ordinal(12)).toBe("12th");
        expect(Num.ordinal(13)).toBe("13th");
    });

    it("ordinal - no Intl.PluralRules exist", () => {
        const original = Intl.PluralRules;
        // @ts-expect-error Cannot assign to 'PluralRules' because it is a read-only property.
        Intl.PluralRules = undefined;

        expect(Num.ordinal(1)).toBe("1st");
        expect(Num.ordinal(2)).toBe("2nd");
        expect(Num.ordinal(3)).toBe("3rd");
        expect(Num.ordinal(4)).toBe("4th");
        expect(Num.ordinal(11)).toBe("11th");
        expect(Num.ordinal(12)).toBe("12th");
        expect(Num.ordinal(13)).toBe("13th");

        // @ts-expect-error Cannot assign to 'PluralRules' because it is a read-only property.
        Intl.PluralRules = original;
    });

    it.skip("spellOrdinal", () => {
        expect(Num.spellOrdinal(1)).toBe("first");
        expect(Num.spellOrdinal(2)).toBe("second");
        expect(Num.spellOrdinal(3)).toBe("third");
        expect(Num.spellOrdinal(4)).toBe("fourth");
        expect(Num.spellOrdinal(11)).toBe("eleventh");
        expect(Num.spellOrdinal(12)).toBe("twelfth");
        expect(Num.spellOrdinal(13)).toBe("thirteenth");
    });

    it("percentage", () => {
        expect(Num.percentage(0, 0)).toBe("0%");
        expect(Num.percentage(0)).toBe("0%");
        expect(Num.percentage(1)).toBe("1%");
        expect(Num.percentage(10, 2)).toBe("10.00%");
        expect(Num.percentage(100)).toBe("100%");
        expect(Num.percentage(100, 2)).toBe("100.00%");
        expect(Num.percentage(100.1234, 0, 3)).toBe("100.123%");

        expect(Num.percentage(300)).toBe("300%");
        expect(Num.percentage(1000)).toBe("1,000%");

        expect(Num.percentage(1.75)).toBe("2%");
        expect(Num.percentage(1.75, 2)).toBe("1.75%");
        expect(Num.percentage(1.75, 3)).toBe("1.750%");
        expect(Num.percentage(0.12345)).toBe("0%");
        expect(Num.percentage(0, 2)).toBe("0.00%");
        expect(Num.percentage(0.12345, 2)).toBe("0.12%");
        expect(Num.percentage(0.12345, 4)).toBe("0.1235%");
    });

    describe("currency", () => {
        it("to currency", () => {
            expect(Num.currency(0)).toBe("$0.00");
            expect(Num.currency(1)).toBe("$1.00");
            expect(Num.currency(10)).toBe("$10.00");

            expect(Num.currency(0, "EUR")).toBe("€0.00");
            expect(Num.currency(1, "EUR")).toBe("€1.00");
            expect(Num.currency(10, "EUR")).toBe("€10.00");

            expect(Num.currency(-5)).toBe("-$5.00");
            expect(Num.currency(5.0)).toBe("$5.00");
            expect(Num.currency(5.325)).toBe("$5.33");

            expect(Num.currency(0, "", null, 0)).toBe("$0");
            expect(Num.currency(5.0, "", null, 0)).toBe("$5");
            expect(Num.currency(10.252, "", null, 0)).toBe("$10");
        });

        it("To Currency With Different Locale", () => {
            expect(Num.currency(1, "EUR", "de")).toBe("1,00 €");
            expect(Num.currency(1, "USD", "de")).toBe("1,00 $");
            expect(Num.currency(1, "GBP", "de")).toBe("1,00 £");

            expect(Num.currency(123456789.12345, "USD", "de")).toBe(
                "123.456.789,12 $",
            );
            expect(Num.currency(123456789.12345, "EUR", "de")).toBe(
                "123.456.789,12 €",
            );
            expect(Num.currency(1234.56, "USD", "fr")).toBe("1 234,56 $US");
        });
    });

    it("fileSize", () => {
        expect(Num.fileSize(0)).toBe("0 B");
        expect(Num.fileSize(0, 2)).toBe("0.00 B");
        expect(Num.fileSize(1)).toBe("1 B");
        expect(Num.fileSize(1024)).toBe("1 KB");
        expect(Num.fileSize(2048)).toBe("2 KB");
        expect(Num.fileSize(2048, 2)).toBe("2.00 KB");
        expect(Num.fileSize(1264, 2)).toBe("1.23 KB");
        expect(Num.fileSize(1264.12345, 3)).toBe("1.234 KB");
        expect(Num.fileSize(1264, 3)).toBe("1.234 KB");
        expect(Num.fileSize(1024 * 1024 * 1024 * 5)).toBe("5 GB");
        expect(Num.fileSize(1024 ** 4 * 10)).toBe("10 TB");
        expect(Num.fileSize(1024 ** 5 * 10)).toBe("10 PB");
        expect(Num.fileSize(1024 ** 7)).toBe("1 ZB");
        expect(Num.fileSize(1024 ** 8)).toBe("1 YB");
        expect(Num.fileSize(1024 ** 9)).toBe("1,024 YB");
    });
});
