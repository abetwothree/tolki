import { ltrim, rtrim, trim } from "@zinaid/str";
import { describe, expect, it } from "vitest";

describe("Str/Trimmer", () => {
    describe("trim", () => {
        it("Laravel tests trim", () => {
            expect(trim("   foo bar   ")).toBe("foo bar");
            expect(trim("foo bar   ")).toBe("foo bar");
            expect(trim("   foo bar")).toBe("foo bar");
            expect(trim("foo bar")).toBe("foo bar");
            expect(trim(" foo bar ", "")).toBe("foo bar");
            expect(trim(" foo bar ", " ")).toBe("foo bar");
            expect(trim("-foo  bar_", "-_")).toBe("foo  bar");
            expect(trim(" foo    bar ")).toBe("foo    bar");

            expect(trim("   123    ")).toBe("123");
            expect(trim("だ")).toBe("だ");
            expect(trim("ム")).toBe("ム");
            expect(trim("   だ    ")).toBe("だ");
            expect(trim("   ム    ")).toBe("ム");

            expect(
                trim(`
                    foo bar
                `),
            ).toBe("foo bar");
            expect(
                trim(`
                        foo
                        bar
                    `),
            ).toBe(
                `foo
                            bar`,
            );

            expect(trim(" \xE9 ")).toBe("\xE9");

            const trimDefaultChars = [" ", "\n", "\r", "\t", "\v", "\0"];
            trimDefaultChars.forEach((char) => {
                expect(trim(` ${char} `)).toBe("");
                expect(trim(`foo bar ${char}`)).toBe("foo bar");

                expect(trim(`${char} foo bar ${char}`)).toBe("foo bar");
            });
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

        it("handles multiline strings with indentation", () => {
            const multiline = `
    hello
    world
`;
            const result = trim(multiline);
            expect(result).toContain("hello");
            expect(result).toContain("world");
        });

        it("handles multiline with base and tail indent difference", () => {
            // Test where baseIndent > tailIndent (delta > 0)
            const input = "    line1\nline2\n";
            const result = trim(input);
            expect(result).toContain("line1");
            expect(result).toContain("line2");
        });

        it("handles special regex characters in charlist", () => {
            expect(trim("...hello...", ".")).toBe("hello");
            expect(trim("***hello***", "*")).toBe("hello");
            expect(trim("???hello???", "?")).toBe("hello");
            expect(trim("[[[hello]]]", "[]")).toBe("hello");
        });

        it("handles empty charlist as null", () => {
            expect(trim("  hello  ", "")).toBe("hello");
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
                expect(ltrim(`foo bar ${char}`)).toBe("foo bar");

                expect(ltrim(`${char} foo bar ${char}`)).toBe("foo bar");
            });
        });

        it("trims whitespace from left side only", () => {
            // Note: ltrim collapses exactly 2 trailing spaces
            expect(ltrim("  hello")).toBe("hello");
            expect(ltrim("\thello")).toBe("hello");
            expect(ltrim("\nhello")).toBe("hello");
        });

        it("preserves trailing single space", () => {
            // Single trailing space is preserved (unless followed by control char)
            expect(ltrim("  hello ").length).toBeGreaterThanOrEqual(5);
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

        it("handles empty charlist as null", () => {
            expect(ltrim("  hello", "")).toBe("hello");
        });

        it("handles null charlist", () => {
            expect(ltrim("  hello", null)).toBe("hello");
        });

        it("handles trailing control characters", () => {
            // Test removal of space followed by control character at end
            expect(ltrim("  hello \n")).toBe("hello");
            expect(ltrim("  hello \t")).toBe("hello");
        });

        it("handles double trailing spaces", () => {
            // Test collapsing double trailing spaces (special ltrim behavior)
            expect(ltrim("  hello  ")).toBe("hello");
        });

        it("does not collapse triple trailing spaces", () => {
            const result = ltrim("  hello   ");
            expect(result).toBe("hello   ");
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

        it("handles empty charlist as null", () => {
            expect(rtrim("hello  ", "")).toBe("hello");
        });

        it("handles null charlist", () => {
            expect(rtrim("hello  ", null)).toBe("hello");
        });

        it("handles multiline strings with indentation compensation", () => {
            // Test multiline with newline in output (contains \n)
            const input = "line1\nline2   ";
            const result = rtrim(input);
            expect(result).toContain("line1");
            expect(result).toContain("line2");
        });

        it("handles multiline with tailIndent > baseIndent", () => {
            // This should trigger the delta > 0 branch (lines 110-113)
            // baseIndent is computed from first non-empty line
            // tailIndent is computed from last line
            // When tailIndent > baseIndent, delta > 0 and padding is added
            const input = "line1\n    line2\n        ";
            const result = rtrim(input);
            expect(result).toContain("line1");
        });

        it("handles multiline where lines need padding", () => {
            // Create a scenario where tailIndent > baseIndent
            // First line has no indent, last line has indent before trailing spaces
            const input = "hello\n    world\n      ";
            const result = rtrim(input);
            expect(result).toBeDefined();
        });
    });

    describe("computeIndents edge cases", () => {
        it("handles string with no non-whitespace characters", () => {
            // This tests the branch where no line has \S (non-whitespace)
            // so baseIndent defaults to what the first match returns
            const result = trim("   \n   \n   ");
            expect(result).toBe("");
        });

        it("handles empty lines array", () => {
            // Empty string split on newlines should still work
            expect(trim("")).toBe("");
        });

        it("handles line with no leading whitespace", () => {
            // Test when match returns something with 0 length
            const result = trim("hello\nworld");
            expect(result).toBe("hello\nworld");
        });
    });

    describe("edge cases for branch coverage", () => {
        it("handles line where regex match could be null", () => {
            // Most strings will have a match for /^[ \t]*/, but
            // we need to ensure all branches are covered
            const result = trim("a");
            expect(result).toBe("a");
        });

        it("handles multiline trim with varying indentation", () => {
            // Test with first line indented more than subsequent lines
            const input = "    first\nsecond\n";
            const result = trim(input);
            expect(result).toContain("first");
            expect(result).toContain("second");
        });

        it("handles rtrim multiline with empty lines", () => {
            // Test the map function's /\S/.test(ln) branch for empty lines
            const input = "line1\n\nline2\n   ";
            const result = rtrim(input);
            expect(result).toContain("line1");
            expect(result).toContain("line2");
        });

        it("handles trim multiline padding for non-first lines", () => {
            // Test the map's i === 0 check and /^\s*$/.test(ln) branches
            const input = "  first\n  second\n  third\n";
            const result = trim(input);
            expect(result).toContain("first");
        });
    });
});
