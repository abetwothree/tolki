import { substr, substrCount, substrReplace } from "@aid/str";
import { describe, expect, it } from "vitest";

describe("Str/Replacer", () => {
    describe("substr", () => {
        it("Laravel tests substr", () => {
            expect(substr("БГДЖИЛЁ", -1)).toBe("Ё");
            expect(substr("БГДЖИЛЁ", -2)).toBe("ЛЁ");
            expect(substr("БГДЖИЛЁ", -3, 1)).toBe("И");
            expect(substr("БГДЖИЛЁ", 2, -1)).toBe("ДЖИЛ");
            expect(substr("БГДЖИЛЁ", 4, -4)).toBe("");
            expect(substr("БГДЖИЛЁ", -3, -1)).toBe("ИЛ");
            expect(substr("БГДЖИЛЁ", 1)).toBe("ГДЖИЛЁ");
            expect(substr("БГДЖИЛЁ", 1, 3)).toBe("ГДЖ");
            expect(substr("БГДЖИЛЁ", 0, 4)).toBe("БГДЖ");
            expect(substr("БГДЖИЛЁ", -1, 1)).toBe("Ё");
            expect(substr("Б", 2)).toBe("");
        });

        it("returns substring from start position", () => {
            expect(substr("hello world", 0)).toBe("hello world");
            expect(substr("hello world", 6)).toBe("world");
        });

        it("returns substring with length", () => {
            expect(substr("hello world", 0, 5)).toBe("hello");
            expect(substr("hello world", 6, 5)).toBe("world");
            expect(substr("hello world", 0, 1)).toBe("h");
        });

        it("handles negative start position", () => {
            expect(substr("hello world", -5)).toBe("world");
            expect(substr("hello world", -1)).toBe("d");
            expect(substr("hello world", -5, 3)).toBe("wor");
        });

        it("handles negative length", () => {
            expect(substr("hello world", 0, -1)).toBe("hello worl");
            expect(substr("hello world", 0, -6)).toBe("hello");
            expect(substr("hello world", 6, -1)).toBe("worl");
        });

        it("returns empty string when start is beyond string length", () => {
            expect(substr("hello", 10)).toBe("");
            expect(substr("hello", 100)).toBe("");
        });

        it("returns empty string when end is before or equal to start", () => {
            expect(substr("hello", 3, 0)).toBe("");
            expect(substr("hello", 3, -5)).toBe("");
        });

        it("handles multibyte characters", () => {
            expect(substr("こんにちは", 0, 2)).toBe("こん");
            expect(substr("こんにちは", 2, 2)).toBe("にち");
            expect(substr("こんにちは", -2)).toBe("ちは");
        });

        it("handles empty string", () => {
            expect(substr("", 0)).toBe("");
            expect(substr("", 0, 5)).toBe("");
        });

        it("handles null length", () => {
            expect(substr("hello", 2, null)).toBe("llo");
        });

        it("clamps negative start to zero", () => {
            expect(substr("hello", -100)).toBe("hello");
            expect(substr("hello", -100, 2)).toBe("he");
        });
    });

    describe("substrCount", () => {
        it("Laravel tests substrCount", () => {
            expect(substrCount("laravelPHPFramework", "a")).toBe(3);
            expect(substrCount("laravelPHPFramework", "z")).toBe(0);
            expect(substrCount("laravelPHPFramework", "l", 2)).toBe(1);
            expect(substrCount("laravelPHPFramework", "z", 2)).toBe(0);
            expect(substrCount("laravelPHPFramework", "k", -1)).toBe(1);
            expect(substrCount("laravelPHPFramework", "k", -1)).toBe(1);
            expect(substrCount("laravelPHPFramework", "a", 1, 2)).toBe(1);
            expect(substrCount("laravelPHPFramework", "a", 1, 2)).toBe(1);
            expect(substrCount("laravelPHPFramework", "a", 1, -2)).toBe(3);
            expect(substrCount("laravelPHPFramework", "a", -10, -3)).toBe(1);
            expect(substrCount("laravelPHPFramework", "")).toBe(0);
        });

        it("counts occurrences of substring", () => {
            expect(substrCount("hello hello hello", "hello")).toBe(3);
            expect(substrCount("abcabc", "abc")).toBe(2);
            expect(substrCount("aaaa", "a")).toBe(4);
        });

        it("returns zero for empty needle", () => {
            expect(substrCount("hello", "")).toBe(0);
        });

        it("returns zero when needle not found", () => {
            expect(substrCount("hello", "xyz")).toBe(0);
        });

        it("counts with offset", () => {
            expect(substrCount("hello hello hello", "hello", 6)).toBe(2);
            expect(substrCount("abcabc", "abc", 3)).toBe(1);
        });

        it("counts with offset and length", () => {
            expect(substrCount("hello hello hello", "hello", 0, 11)).toBe(2);
            expect(substrCount("hello hello hello", "hello", 6, 5)).toBe(1);
        });

        it("returns zero when offset is beyond string length", () => {
            expect(substrCount("hello", "l", 100)).toBe(0);
        });

        it("returns zero when computed range is invalid", () => {
            expect(substrCount("hello", "l", 3, -5)).toBe(0);
            expect(substrCount("hello", "l", 10, 5)).toBe(0);
        });

        it("handles negative offset", () => {
            expect(substrCount("hello hello", "hello", -5)).toBe(1);
        });

        it("handles negative length", () => {
            // negative length omits characters from the end
            // "hello hello" with length -1 becomes "hello hell" which has 1 "hello"
            expect(substrCount("hello hello", "hello", 0, -1)).toBe(1);
            expect(substrCount("hello hello hello", "hello", 0, -1)).toBe(2);
        });

        it("handles multibyte characters", () => {
            expect(substrCount("こんにちはこんにちは", "こん")).toBe(2);
        });

        it("counts non-overlapping occurrences", () => {
            expect(substrCount("aaa", "aa")).toBe(1);
            expect(substrCount("aaaa", "aa")).toBe(2);
        });
    });

    describe("substrReplace", () => {
        it("Laravel tests substrReplace", () => {
            expect(substrReplace("1200", ":", 2, 0)).toBe("12:00");
            expect(substrReplace("The Framework", "Laravel ", 4, 0)).toBe(
                "The Laravel Framework",
            );
            expect(
                substrReplace(
                    "Laravel Framework",
                    "– The PHP Framework for Web Artisans",
                    8,
                ),
            ).toBe("Laravel – The PHP Framework for Web Artisans");
            expect(substrReplace("hello world", ["hi", "there"], 6)).toEqual([
                "hello hi",
                "hello there",
            ]);
        });

        it("substrReplace with multibyte", () => {
            expect(substrReplace("kenkä", "ng", -3, 2)).toBe("kengä");
            expect(substrReplace("kenka", "ng", -3, 2)).toBe("kenga");
        });

        it("replaces portion of string", () => {
            expect(substrReplace("hello world", "there", 6)).toBe(
                "hello there",
            );
            expect(substrReplace("hello", "abc", 0, 5)).toBe("abc");
        });

        it("uses default offset of 0 when not provided", () => {
            expect(substrReplace("hello", "X")).toBe("X");
        });

        it("inserts at position when length is 0", () => {
            expect(substrReplace("hello", " world", 5, 0)).toBe("hello world");
            expect(substrReplace("hello", "x", 0, 0)).toBe("xhello");
        });

        it("handles negative offset", () => {
            expect(substrReplace("hello world", "there", -5)).toBe(
                "hello there",
            );
        });

        it("handles negative length", () => {
            expect(substrReplace("hello world", "x", 0, -6)).toBe("x world");
        });

        it("handles array of replacements", () => {
            const result = substrReplace("hello", ["a", "b", "c"], 0, 1);
            expect(result).toEqual(["aello", "bello", "cello"]);
        });

        it("handles array offset (uses first element)", () => {
            expect(substrReplace("hello", "x", [2], 1)).toBe("hexlo");
        });

        it("handles array length (uses first element)", () => {
            expect(substrReplace("hello", "x", 0, [2])).toBe("xllo");
        });

        it("handles null length (replaces to end)", () => {
            expect(substrReplace("hello world", "!", 5, null)).toBe("hello!");
        });

        it("handles multibyte characters", () => {
            expect(substrReplace("こんにちは", "XX", 2, 2)).toBe("こんXXは");
        });

        it("handles empty replacement", () => {
            expect(substrReplace("hello", "", 1, 3)).toBe("ho");
        });

        it("handles empty string", () => {
            expect(substrReplace("", "hello", 0)).toBe("hello");
        });

        it("handles offset beyond string length", () => {
            expect(substrReplace("hello", "x", 10)).toBe("hellox");
        });

        it("handles empty array offset (defaults to 0)", () => {
            expect(substrReplace("hello", "x", [], 1)).toBe("xello");
        });

        it("handles empty array length (defaults to null/size)", () => {
            expect(substrReplace("hello", "x", 0, [])).toBe("x");
        });
    });
});
