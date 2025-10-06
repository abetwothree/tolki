import * as Num from "@laravel-js/num";
import { describe, expect,it } from "vitest";

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
        expect(Num.parseInt("a string that isn't a number")).toBe(false);
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

    it("forHumans", () => {
        expect(Num.forHumans(1)).toBe("1");
        expect(Num.forHumans(1, 2)).toBe("1.00");
        expect(Num.forHumans(10)).toBe("10");
        expect(Num.forHumans(100)).toBe("100");
        expect(Num.forHumans(1000)).toBe("1 thousand");
        expect(Num.forHumans(1000, 2)).toBe("1.00 thousand");
        expect(Num.forHumans(1000, 0, 2)).toBe("1 thousand");
        expect(Num.forHumans(1230)).toBe("1.2 thousand");
        expect(Num.forHumans(1230, 0, 1)).toBe("1.2 thousand");
        expect(Num.forHumans(1000000)).toBe("1 million");
        expect(Num.forHumans(1000000000)).toBe("1 billion");
        expect(Num.forHumans(1000000000000)).toBe("1 trillion");
        expect(Num.forHumans(1000000000000000)).toBe("1 quadrillion");
        expect(Num.forHumans(1000000000000000000)).toBe(
            "1 thousand quadrillion",
        );

        expect(Num.forHumans(123)).toBe("123");
        expect(Num.forHumans(1234)).toBe("1 thousand");
        expect(Num.forHumans(1234, 2)).toBe("1.23 thousand");
        expect(Num.forHumans(12345)).toBe("12 thousand");
        expect(Num.forHumans(1234567)).toBe("1 million");
        expect(Num.forHumans(1234567890)).toBe("1 billion");
        expect(Num.forHumans(1234567890123)).toBe("1 trillion");
        expect(Num.forHumans(1234567890123, 2)).toBe("1.23 trillion");
        expect(Num.forHumans(1234567890123456)).toBe("1 quadrillion");

        // Compose the large (unsafe) integer from smaller safe integer literals to avoid the no-loss-of-precision lint rule.
        // 1,234,567,890,123,456,789 = 1234 * 1_000_000_000_000_000 + 567_890_123_456_789
        const LARGE_UNSAFE_NUMBER =
            1234 * 1_000_000_000_000_000 + 567_890_123_456_789;
        expect(Num.forHumans(LARGE_UNSAFE_NUMBER, 2)).toBe(
            "1.23 thousand quadrillion",
        );

        expect(Num.forHumans(489939)).toBe("490 thousand");
        expect(Num.forHumans(489939, 4)).toBe("489.9390 thousand");
        expect(Num.forHumans(500000000, 5)).toBe("500.00000 million");

        expect(Num.forHumans(1000000000000000000000)).toBe(
            "1 million quadrillion",
        );
        expect(Num.forHumans(1000000000000000000000000)).toBe(
            "1 billion quadrillion",
        );
        expect(Num.forHumans(1000000000000000000000000000)).toBe(
            "1 trillion quadrillion",
        );
        expect(Num.forHumans(1000000000000000000000000000000)).toBe(
            "1 quadrillion quadrillion",
        );
        expect(Num.forHumans(1000000000000000000000000000000000)).toBe(
            "1 thousand quadrillion quadrillion",
        );

        expect(Num.forHumans(0)).toBe("0");
        expect(Num.forHumans(0.0)).toBe("0");
        expect(Num.forHumans(0, 2)).toBe("0.00");
        expect(Num.forHumans(0.0, 2)).toBe("0.00");
        expect(Num.forHumans(-1)).toBe("-1");
        expect(Num.forHumans(-1, 2)).toBe("-1.00");
        expect(Num.forHumans(-10)).toBe("-10");
        expect(Num.forHumans(-100)).toBe("-100");
        expect(Num.forHumans(-1000)).toBe("-1 thousand");
        expect(Num.forHumans(-1234, 2)).toBe("-1.23 thousand");
        expect(Num.forHumans(-1234, 1)).toBe("-1.2 thousand");
        expect(Num.forHumans(-1000000)).toBe("-1 million");
        expect(Num.forHumans(-1000000000)).toBe("-1 billion");
        expect(Num.forHumans(-1000000000000)).toBe("-1 trillion");
        expect(Num.forHumans(-1100000000000, 1)).toBe("-1.1 trillion");
        expect(Num.forHumans(-1000000000000000)).toBe("-1 quadrillion");
        expect(Num.forHumans(-1000000000000000000)).toBe(
            "-1 thousand quadrillion",
        );

        expect(Num.forHumans(123, 0, null, true)).toBe("123");
        expect(Num.forHumans(1234, 0, null, true)).toBe("1K");
        expect(Num.forHumans(1234, 2, null, true)).toBe("1.23K");
    });

    it("clamp", () => {
        expect(Num.clamp(1, 2, 3)).toBe(2);
        expect(Num.clamp(5, 2, 3)).toBe(3);
        expect(Num.clamp(5, 1, 10)).toBe(5);
        expect(Num.clamp(4.5, 1, 10)).toBe(4.5);
        expect(Num.clamp(-10, 1, 5)).toBe(1);
    });

    it("pairs", () => {
        expect(Num.pairs(25, 10, 0, 0)).toEqual([
            [0, 10],
            [10, 20],
            [20, 25],
        ]);
        expect(Num.pairs(25, 10, 0, 1)).toEqual([
            [0, 9],
            [10, 19],
            [20, 25],
        ]);
        expect(Num.pairs(25, 10, 1, 0)).toEqual([
            [1, 11],
            [11, 21],
            [21, 25],
        ]);
        expect(Num.pairs(25, 10, 1, 1)).toEqual([
            [1, 10],
            [11, 20],
            [21, 25],
        ]);
        expect(Num.pairs(2500, 1000, 0, 0)).toEqual([
            [0, 1000],
            [1000, 2000],
            [2000, 2500],
        ]);
        expect(Num.pairs(2500, 1000, 0, 1)).toEqual([
            [0, 999],
            [1000, 1999],
            [2000, 2500],
        ]);
        expect(Num.pairs(2500, 1000, 1, 0)).toEqual([
            [1, 1001],
            [1001, 2001],
            [2001, 2500],
        ]);
        expect(Num.pairs(2500, 1000, 1, 1)).toEqual([
            [1, 1000],
            [1001, 2000],
            [2001, 2500],
        ]);
        expect(Num.pairs(10, 2.5, 0, 0)).toEqual([
            [0, 2.5],
            [2.5, 5.0],
            [5.0, 7.5],
            [7.5, 10.0],
        ]);
        expect(Num.pairs(10, 2.5, 0, 0.5)).toEqual([
            [0, 2.0],
            [2.5, 4.5],
            [5.0, 7.0],
            [7.5, 9.5],
        ]);
        expect(Num.pairs(10, 2.5, 0.5, 0)).toEqual([
            [0.5, 3.0],
            [3.0, 5.5],
            [5.5, 8.0],
            [8.0, 10],
        ]);
        expect(Num.pairs(10, 2.5, 0.5, 0.5)).toEqual([
            [0.5, 2.5],
            [3.0, 5.0],
            [5.5, 7.5],
            [8.0, 10.0],
        ]);
    });

    it("trim", () => {
        expect(Num.trim(12)).toBe(12);
        expect(Num.trim(120)).toBe(120);
        expect(Num.trim(12.0)).toBe(12);
        expect(Num.trim(12.3)).toBe(12.3);
        expect(Num.trim(12.3)).toBe(12.3);
        expect(Num.trim(12.3456789)).toBe(12.3456789);
        expect(Num.trim(12.3456789)).toBe(12.3456789);
    });

    it("minutesToHuman", () => {
        expect(Num.minutesToHuman(0)).toBe("0 seconds");
        expect(Num.minutesToHuman(1)).toBe("1 minute");
        expect(Num.minutesToHuman(60)).toBe("1 hour");
        expect(Num.minutesToHuman(61)).toBe("1 hour");
        expect(Num.minutesToHuman(61, false)).toBe("1 hour, 1 minute");
        expect(Num.minutesToHuman(120)).toBe("2 hours");
        expect(Num.minutesToHuman(121)).toBe("2 hours");
        expect(Num.minutesToHuman(121, false)).toBe("2 hours, 1 minute");
        expect(Num.minutesToHuman(1440)).toBe("1 day");
        expect(Num.minutesToHuman(1500)).toBe("1 day");
        expect(Num.minutesToHuman(1500, false)).toBe("1 day, 1 hour");
        expect(Num.minutesToHuman(2880)).toBe("2 days");
        expect(Num.minutesToHuman(4320)).toBe("3 days");
        expect(Num.minutesToHuman(10080)).toBe("1 week");
        expect(Num.minutesToHuman(20160)).toBe("1 month");
        expect(Num.minutesToHuman(43200)).toBe("1 month");
        expect(Num.minutesToHuman(86400)).toBe("2 months");
        expect(Num.minutesToHuman(525600)).toBe("1 year");
        expect(Num.minutesToHuman(1051200)).toBe("2 years");
    });

    it("secondsToHuman - with round", () => {
        expect(Num.secondsToHuman(-20)).toBe("0 seconds");
        expect(Num.secondsToHuman(0)).toBe("0 seconds");
        expect(Num.secondsToHuman(1)).toBe("1 second");
        expect(Num.secondsToHuman(60)).toBe("1 minute");
        expect(Num.secondsToHuman(3600)).toBe("1 hour");
        expect(Num.secondsToHuman(86400)).toBe("1 day");
        expect(Num.secondsToHuman(604800)).toBe("1 week");
        expect(Num.secondsToHuman(2419200)).toBe("1 month");
        expect(Num.secondsToHuman(29030400)).toBe("1 year");
    });

    it("secondsToHuman - no round", () => {
        expect(Num.secondsToHuman(0, false)).toBe("0 seconds");
        expect(Num.secondsToHuman(1, false)).toBe("1 second");
        expect(Num.secondsToHuman(60, false)).toBe("1 minute");
        expect(Num.secondsToHuman(3600, false)).toBe("1 hour");
        expect(Num.secondsToHuman(86400, false)).toBe("1 day");
        expect(Num.secondsToHuman(604800, false)).toBe("1 week");
        expect(Num.secondsToHuman(2419200, false)).toBe("1 month");
        expect(Num.secondsToHuman(29030400, false)).toBe("1 year");

        expect(Num.secondsToHuman(3610, false)).toBe("1 hour, 10 seconds");
        expect(Num.secondsToHuman(3661, false)).toBe(
            "1 hour, 1 minute, 1 second",
        );
        expect(Num.secondsToHuman(7325, false)).toBe(
            "2 hours, 2 minutes, 5 seconds",
        );
        expect(Num.secondsToHuman(86461, false)).toBe(
            "1 day, 1 minute, 1 second",
        );
        expect(Num.secondsToHuman(90061, false)).toBe(
            "1 day, 1 hour, 1 minute, 1 second",
        );
        expect(Num.secondsToHuman(172800, false)).toBe("2 days");
        expect(Num.secondsToHuman(604861, false)).toBe(
            "1 week, 1 minute, 1 second",
        );
        expect(Num.secondsToHuman(2419261, false)).toBe(
            "1 month, 1 minute, 1 second",
        );
        expect(Num.secondsToHuman(29031061, false)).toBe(
            "1 year, 11 minutes, 1 second",
        );
    });

    it("withLocale", () => {
        expect(
            Num.withLocale("fr", () => {
                return Num.format(1234.56);
            }),
        ).toBe("1 234,56");
    });

    it("withCurrency", () => {
        expect(
            Num.withCurrency("EUR", () => {
                return Num.format(1234.56);
            }),
        ).toBe("1,234.56");
    });

    it("defaultLocale", () => {
        expect(Num.defaultLocale()).toBe("en");
    });

    it("defaultCurrency", () => {
        expect(Num.defaultCurrency()).toBe("USD");
    });
});
