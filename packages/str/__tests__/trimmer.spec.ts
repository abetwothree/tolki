import { ltrim, rtrim, trim } from "@tolki/str";
import { describe, expect, it } from "vitest";

describe("Str/Trimmer", () => {
    describe("trim", () => {
        it("Laravel tests trim", () => {
            // StrTest::testTrim. The empty charlist and the two multi-line inputs are also rows of
            // docs/php-parity/task-33-laravel-13-34-sync.json, "trim-cases"
            expect(trim("   foo bar   ")).toBe("foo bar");
            expect(trim("foo bar   ")).toBe("foo bar");
            expect(trim("   foo bar")).toBe("foo bar");
            expect(trim("foo bar")).toBe("foo bar");
            expect(trim(" foo bar ", "")).toBe(" foo bar ");
            expect(trim(" foo bar ", " ")).toBe("foo bar");
            expect(trim("-foo  bar_", "-_")).toBe("foo  bar");
            expect(trim(" foo    bar ")).toBe("foo    bar");

            expect(trim("   123    ")).toBe("123");
            expect(trim("だ")).toBe("だ");
            expect(trim("ム")).toBe("ム");
            expect(trim("   だ    ")).toBe("だ");
            expect(trim("   ム    ")).toBe("ム");

            expect(trim("\n                foo bar\n            ")).toBe(
                "foo bar",
            );
            expect(
                trim(
                    "\n                foo\n                bar\n            ",
                ),
            ).toBe("foo\n                bar");

            expect(trim(" \xE9 ")).toBe("\xE9");

            const trimDefaultChars = [" ", "\n", "\r", "\t", "\v", "\0"];
            trimDefaultChars.forEach((char) => {
                expect(trim(` ${char} `)).toBe("");
                expect(trim(`foo bar ${char}`)).toBe("foo bar");

                expect(trim(`${char} foo bar ${char}`)).toBe("foo bar");
            });
        });

        it("Laravel tests: handles long interior whitespace runs", () => {
            // StrTest::testTrimAndRtrimHandleLongInteriorWhitespaceRuns
            // docs/php-parity/task-33-laravel-13-34-sync.json, "trim-long-interior-run"
            const run = " \u200B\t".repeat(20000);

            expect(trim(`${run}[${run}x${run}`)).toBe(`[${run}x`);
            expect(trim(run)).toBe("");
            expect(trim(" a b c\u00A0\uFEFF\n")).toBe("a b c");
        }, 2000);

        it("stays fast over a long interior run of the charlist's characters", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "trim-charlist-long-interior-run"
            const run = "x".repeat(120000);

            expect(trim(`${run}[${run}y${run}`, "x")).toBe(`[${run}y`);
        }, 2000);

        it("trims a character of two UTF-16 units at either end", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "trim-cases"
            expect(trim("\u{1D159}a\u{E0020}\u{1D173}")).toBe("a");
            expect(trim("😀a😀", "😀")).toBe("a");
        });

        it("reads a charlist of regex characters literally", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "trim-cases"
            expect(trim("-^a^-", "^-")).toBe("a");
            expect(trim("\\a\\", "\\")).toBe("a");
        });

        it("trims whitespace from both ends", () => {
            expect(trim("  hello  ")).toBe("hello");
            expect(trim("\thello\t")).toBe("hello");
            expect(trim("\nhello\n")).toBe("hello");
        });

        it("trims invisible characters", () => {
            // Zero-width space (U+200B)
            expect(trim("\u200Bhello\u200B")).toBe("hello");
            // Non-breaking space (U+00A0)
            expect(trim("\u00A0hello\u00A0")).toBe("hello");
            // NUL character
            expect(trim("\x00hello\x00")).toBe("hello");
        });

        it("trims specified characters when charlist provided", () => {
            expect(trim("xxxhelloxxx", "x")).toBe("hello");
            expect(trim("abchelloabc", "abc")).toBe("hello");
            expect(trim("//path//", "/")).toBe("path");
        });

        it("handles empty string", () => {
            expect(trim("")).toBe("");
            expect(trim("   ")).toBe("");
        });

        it("returns original string when no trimming needed", () => {
            expect(trim("hello")).toBe("hello");
        });

        it("leaves the lines between the ends exactly as they were", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "trim-cases"
            expect(trim("\n    hello\n    world\n")).toBe("hello\n    world");
            expect(trim("    line1\nline2\n")).toBe("line1\nline2");
            expect(trim("  first\n  second\n  third\n")).toBe(
                "first\n  second\n  third",
            );
            expect(trim("   \n   \n   ")).toBe("");
            expect(trim("hello\nworld")).toBe("hello\nworld");
        });

        it("trims the next-line character, which PHP counts as whitespace", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "trim-cases" and "trim-default-characters"
            expect(trim("\u0085a\u0085")).toBe("a");
        });

        it("trims exactly the characters Laravel's default trim removes", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "trim-default-characters"
            const ranges = [
                [0x0000, 0x0000],
                [0x0009, 0x000d],
                [0x0020, 0x0020],
                [0x0085, 0x0085],
                [0x00a0, 0x00a0],
                [0x00ad, 0x00ad],
                [0x034f, 0x034f],
                [0x061c, 0x061c],
                [0x115f, 0x1160],
                [0x1680, 0x1680],
                [0x17b4, 0x17b5],
                [0x180e, 0x180e],
                [0x2000, 0x200f],
                [0x2028, 0x2029],
                [0x202f, 0x202f],
                [0x205f, 0x2065],
                [0x206a, 0x206f],
                [0x2800, 0x2800],
                [0x3000, 0x3000],
                [0x3164, 0x3164],
                [0xfeff, 0xfeff],
                [0xffa0, 0xffa0],
                [0x1d159, 0x1d159],
                [0x1d173, 0x1d17a],
                [0xe0020, 0xe0020],
            ] as const;
            const removed = ranges.flatMap(([from, to]) =>
                Array.from({ length: to - from + 1 }, (_, offset) =>
                    String.fromCodePoint(from + offset),
                ),
            );

            expect(removed).toHaveLength(65);

            for (const char of removed) {
                expect(trim(char)).toBe("");
                expect(ltrim(char)).toBe("");
                expect(rtrim(char)).toBe("");
            }

            // Each range's nearest neighbour on either side stays.
            const removedCodePoints = new Set(
                removed.map((char) => char.codePointAt(0)),
            );
            const kept = ranges
                .flatMap(([from, to]) => [from - 1, to + 1])
                .filter(
                    (codePoint) =>
                        codePoint >= 0 && !removedCodePoints.has(codePoint),
                )
                .map((codePoint) => String.fromCodePoint(codePoint));

            expect(kept).toHaveLength(49);

            for (const char of kept) {
                expect(trim(char)).toBe(char);
                expect(ltrim(char)).toBe(char);
                expect(rtrim(char)).toBe(char);
            }
        });

        it("handles special regex characters in charlist", () => {
            expect(trim("...hello...", ".")).toBe("hello");
            expect(trim("***hello***", "*")).toBe("hello");
            expect(trim("???hello???", "?")).toBe("hello");
            expect(trim("[[[hello]]]", "[]")).toBe("hello");
        });

        it("trims nothing for an empty charlist, as PHP's trim() does", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "trim-cases"
            expect(trim("  hello  ", "")).toBe("  hello  ");
        });

        it("handles null charlist", () => {
            expect(trim("  hello  ", null)).toBe("hello");
        });

        it("handles multibyte characters", () => {
            expect(trim("  こんにちは  ")).toBe("こんにちは");
            expect(trim("你好你好hello你好你好", "你好")).toBe("hello");
        });
    });

    describe("ltrim", () => {
        it("Laravel tests ltrim", () => {
            // StrTest::testLtrim. The `foo bar` inputs for newline and NUL in the last loop are also rows of
            // docs/php-parity/task-33-laravel-13-34-sync.json, "ltrim-cases"
            expect(ltrim(" foo    bar ")).toBe("foo    bar ");

            expect(ltrim("   123    ")).toBe("123    ");
            expect(ltrim("だ")).toBe("だ");
            expect(ltrim("ム")).toBe("ム");
            expect(ltrim("   だ    ")).toBe("だ    ");
            expect(ltrim("   ム    ")).toBe("ム    ");

            expect(ltrim("   foo bar")).toBe("foo bar");
            expect(ltrim("foo bar   ")).toBe("foo bar   ");
            expect(ltrim(" foo bar ", " ")).toBe("foo bar ");
            expect(ltrim("-foo  bar_", "-_")).toBe("foo  bar_");
            expect(ltrim(" foo    bar ")).toBe("foo    bar ");

            expect(
                ltrim(`
                    foo bar
                `),
            ).toBe(`foo bar
                `);

            expect(ltrim(" \xE9 ")).toBe("\xE9 ");

            const ltrimDefaultChars = [" ", "\n", "\r", "\t", "\v", "\0"];
            ltrimDefaultChars.forEach((char) => {
                expect(ltrim(` ${char} `)).toBe("");

                expect(ltrim(`${char} foo bar ${char}`)).toBe(
                    `foo bar ${char}`,
                );
            });
        });

        it("trims whitespace from left side only", () => {
            expect(ltrim("  hello")).toBe("hello");
            expect(ltrim("\thello")).toBe("hello");
            expect(ltrim("\nhello")).toBe("hello");
        });

        it("leaves the end of the string exactly as it was", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "ltrim-cases"
            expect(ltrim("  hello ")).toBe("hello ");
            expect(ltrim("  hello  ")).toBe("hello  ");
            expect(ltrim("  hello   ")).toBe("hello   ");
            expect(ltrim("  hello \n")).toBe("hello \n");
            expect(ltrim("  hello \t")).toBe("hello \t");
            expect(ltrim("\u0085a\u0085")).toBe("a\u0085");
        });

        it("trims invisible characters from left", () => {
            expect(ltrim("\u200Bhello")).toBe("hello");
            expect(ltrim("\u00A0hello")).toBe("hello");
            expect(ltrim("\x00hello")).toBe("hello");
        });

        it("trims specified characters when charlist provided", () => {
            expect(ltrim("xxxhello", "x")).toBe("hello");
            expect(ltrim("abchello", "abc")).toBe("hello");
            expect(ltrim("//path", "/")).toBe("path");
        });

        it("handles empty string", () => {
            expect(ltrim("")).toBe("");
            expect(ltrim("   ")).toBe("");
        });

        it("returns original string when no trimming needed", () => {
            expect(ltrim("hello")).toBe("hello");
        });

        it("handles special regex characters in charlist", () => {
            expect(ltrim("...hello", ".")).toBe("hello");
            expect(ltrim("***hello", "*")).toBe("hello");
        });

        it("trims nothing for an empty charlist, as PHP's ltrim() does", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "ltrim-cases"
            expect(ltrim("  hello", "")).toBe("  hello");
        });

        it("handles null charlist", () => {
            expect(ltrim("  hello", null)).toBe("hello");
        });
    });

    describe("rtrim", () => {
        it("Laravel tests rtrim", () => {
            expect(rtrim(" foo    bar ")).toBe(" foo    bar");

            expect(rtrim("   123    ")).toBe("   123");
            expect(rtrim("だ")).toBe("だ");
            expect(rtrim("ム")).toBe("ム");
            expect(rtrim("   だ    ")).toBe("   だ");
            expect(rtrim("   ム    ")).toBe("   ム");

            expect(rtrim("foo bar   ")).toBe("foo bar");
            expect(rtrim("   foo bar")).toBe("   foo bar");
            expect(rtrim(" foo bar ", " ")).toBe(" foo bar");
            expect(rtrim("_foo  bar-", "_-")).toBe("_foo  bar");
            expect(rtrim(" foo    bar ")).toBe(" foo    bar");

            expect(
                rtrim(`
                    foo bar
                `),
            ).toBe(`
                    foo bar`);

            expect(rtrim(" \xE9 ")).toBe(" \xE9");

            const rtrimDefaultChars = [" ", "\n", "\r", "\t", "\v", "\0"];

            rtrimDefaultChars.forEach((char) => {
                expect(rtrim(` ${char} `)).toBe("");
                expect(rtrim(`${char} foo bar ${char}`)).toBe(
                    `${char} foo bar`,
                );
            });
        });

        it("Laravel tests: handles long interior whitespace runs", () => {
            // StrTest::testTrimAndRtrimHandleLongInteriorWhitespaceRuns
            // docs/php-parity/task-33-laravel-13-34-sync.json, "trim-long-interior-run"
            const run = " \u200B\t".repeat(20000);

            expect(rtrim(`${run}[${run}x${run}`)).toBe(`${run}[${run}x`);
            expect(rtrim(run)).toBe("");
            expect(rtrim(" a  b \u3000\r\n")).toBe(" a  b");
        }, 2000);

        it("stays fast over a long interior run of the charlist's characters", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "rtrim-charlist-long-interior-run"
            const run = "x".repeat(120000);

            expect(rtrim(`${run}[${run}y${run}`, "x")).toBe(`${run}[${run}y`);
        }, 2000);

        it("trims a character of two UTF-16 units from the end", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "rtrim-cases"
            expect(rtrim("a\u{1D159}\u{E0020}")).toBe("a");
            expect(rtrim("a😀😀b😀", "😀")).toBe("a😀😀b");
            expect(rtrim("a]]", "]")).toBe("a");
        });

        it("never removes half of a two-unit character", () => {
            // JS-only: a PHP string cannot hold half of a surrogate pair
            expect(rtrim("a😀", "\uDE00")).toBe("a😀");
            expect(rtrim("a\uD83Dx", "x")).toBe("a\uD83D");
        });

        it("trims whitespace from right side only", () => {
            expect(rtrim("  hello  ")).toBe("  hello");
            expect(rtrim("hello\t")).toBe("hello");
            expect(rtrim("hello\n")).toBe("hello");
        });

        it("trims invisible characters from right", () => {
            expect(rtrim("hello\u200B")).toBe("hello");
            expect(rtrim("hello\u00A0")).toBe("hello");
            expect(rtrim("hello\x00")).toBe("hello");
        });

        it("trims specified characters when charlist provided", () => {
            expect(rtrim("helloxxx", "x")).toBe("hello");
            expect(rtrim("helloabc", "abc")).toBe("hello");
            expect(rtrim("path//", "/")).toBe("path");
        });

        it("handles empty string", () => {
            expect(rtrim("")).toBe("");
            expect(rtrim("   ")).toBe("");
        });

        it("returns original string when no trimming needed", () => {
            expect(rtrim("hello")).toBe("hello");
        });

        it("handles special regex characters in charlist", () => {
            expect(rtrim("hello...", ".")).toBe("hello");
            expect(rtrim("hello***", "*")).toBe("hello");
        });

        it("trims nothing for an empty charlist, as PHP's rtrim() does", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "rtrim-cases"
            expect(rtrim("hello  ", "")).toBe("hello  ");
        });

        it("handles null charlist", () => {
            expect(rtrim("hello  ", null)).toBe("hello");
        });

        it("leaves the lines before the end exactly as they were", () => {
            // docs/php-parity/task-33-laravel-13-34-sync.json, "rtrim-cases"
            expect(rtrim("line1\nline2   ")).toBe("line1\nline2");
            expect(rtrim("line1\n    line2\n        ")).toBe(
                "line1\n    line2",
            );
            expect(rtrim("hello\n    world\n      ")).toBe("hello\n    world");
            expect(rtrim("line1\n\nline2\n   ")).toBe("line1\n\nline2");
            expect(rtrim("\u0085a\u0085")).toBe("\u0085a");
        });
    });
});
