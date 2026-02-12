import { CaseTypes, Stringable } from "@tolki/str";
import * as Str from "@tolki/str";
import { describe, expect, it } from "vitest";

// Helper to compare Stringable method against Str function
function expectEqual(strResult: string, s: Stringable) {
    expect(s.toString()).toBe(strResult);
}

describe("Stringable basic delegation", () => {
    describe("after", () => {
        it("Laravel tests", () => {
            const input = "a-hello-b-world-c";
            expectEqual(Str.after(input, "-"), Str.of(input).after("-"));
        });
    });

    describe("afterLast", () => {
        it("Laravel tests", () => {
            const input = "a-hello-b-world-c";
            expectEqual(
                Str.afterLast(input, "-"),
                Str.of(input).afterLast("-"),
            );
        });
    });

    describe("before", () => {
        it("Laravel tests", () => {
            const input = "a-hello-b-world-c";
            expectEqual(Str.before(input, "-"), Str.of(input).before("-"));
        });
    });

    describe("beforeLast", () => {
        it("Laravel tests", () => {
            const input = "a-hello-b-world-c";
            expectEqual(
                Str.beforeLast(input, "-"),
                Str.of(input).beforeLast("-"),
            );
        });
    });

    describe("between", () => {
        it("Laravel tests", () => {
            const input = "a-hello-b-world-c";
            expectEqual(
                Str.between(input, "-", "-"),
                Str.of(input).between("-", "-"),
            );
        });
    });

    describe("betweenFirst", () => {
        it("Laravel tests", () => {
            const input = "a-hello-b-world-c";
            expectEqual(
                Str.betweenFirst(input, "-", "-"),
                Str.of(input).betweenFirst("-", "-"),
            );
        });
    });

    describe("str", () => {
        it("test str function", () => {
            const input = "hello world";
            const s = Str.str(input);
            expect(s).toBeInstanceOf(Stringable);
        });
    });

    describe("isAscii", () => {
        it("Laravel tests", () => {
            const input = "foo";
            expect(Str.isAscii(input)).toBe(Str.of(input).isAscii());
        });
    });

    describe("ascii", () => {
        it("Laravel tests", () => {
            expectEqual(Str.ascii("fóó"), Str.of("fóó").ascii());
        });
    });

    describe("transliterate", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.transliterate("fóó"),
                Str.of("fóó").transliterate(),
            );
        });
    });

    describe("snake", () => {
        it("Laravel tests", () => {
            expectEqual(Str.snake("fooBar"), Str.of("fooBar").snake());
        });
    });

    describe("camel", () => {
        it("Laravel tests", () => {
            expectEqual(Str.camel("foo_bar"), Str.of("foo_bar").camel());
        });
    });

    describe("studly", () => {
        it("Laravel tests", () => {
            expectEqual(Str.studly("foo bar"), Str.of("foo bar").studly());
        });
    });

    describe("charAt", () => {
        it("Laravel tests", () => {
            const input = "hello";
            expect(Str.charAt(input, 1)).toBe(Str.of(input).charAt(1));
        });
    });

    describe("chopStart", () => {
        it("Laravel tests", () => {
            const input = "hello";
            expectEqual(
                Str.chopStart(input, "h"),
                Str.of(input).chopStart("h"),
            );
        });
    });

    describe("chopEnd", () => {
        it("Laravel tests", () => {
            const input = "hello";
            expectEqual(Str.chopEnd(input, "o"), Str.of(input).chopEnd("o"));
        });
    });

    describe("convertCase", () => {
        it("Laravel tests", () => {
            const input = "foo bar";
            expectEqual(
                Str.convertCase(input, CaseTypes.fold),
                Str.of(input).convertCase(CaseTypes.fold),
            );
            expectEqual(
                Str.convertCase(input, CaseTypes.title),
                Str.of(input).convertCase(CaseTypes.title),
            );
            expectEqual(
                Str.convertCase(input, CaseTypes.upper),
                Str.of(input).convertCase(CaseTypes.upper),
            );
        });
    });

    describe("deduplicate", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz foo";
            const expected = Str.of("foo bar baz foo").deduplicate();
            expectEqual(Str.deduplicate(input), expected);
        });

        it("deduplicates with array of characters", () => {
            expect(
                Str.of(" laravell    foreverrr  ")
                    .deduplicate([" ", "l", "r"])
                    .toString(),
            ).toBe(" laravel forever ");
        });
    });

    describe("excerpt", () => {
        it("Laravel tests", () => {
            const input = "The quick brown fox jumps over the lazy dog";
            expect(Str.excerpt(input)).toBe(Str.of(input).excerpt());
        });
    });

    describe("explode", () => {
        it("test explode", () => {
            expect(Str.of("Foo Bar Baz").explode(" ")).toEqual([
                "Foo",
                "Bar",
                "Baz",
            ]);

            expect(Str.of("Foo Bar Baz").explode(" ", 2)).toEqual([
                "Foo",
                "Bar Baz",
            ]);

            expect(Str.of("Foo Bar Baz").explode(" ", -1)).toEqual([
                "Foo",
                "Bar",
            ]);

            // Test limit=0 (no limit) and limit=1
            expect(Str.of("Foo Bar Baz").explode(" ", 0)).toEqual([
                "Foo",
                "Bar",
                "Baz",
            ]);
            expect(Str.of("Foo Bar Baz").explode(" ", 1)).toEqual([
                "Foo Bar Baz",
            ]);

            // Test negative limit removes last elements
            expect(Str.of("Foo Bar Baz Qux").explode(" ", -2)).toEqual([
                "Foo",
                "Bar",
            ]);
        });
    });

    describe("split", () => {
        it("test split by chunk length", () => {
            // Integer pattern splits string into chunks of specified length
            expect(Str.of("foobarbaz").split(3)).toEqual(["foo", "bar", "baz"]);
        });

        it("test split with uneven chunk length", () => {
            // When string length is not divisible by chunk size, last chunk is smaller
            expect(Str.of("hello").split(2)).toEqual(["he", "ll", "o"]);
            expect(Str.of("abcde").split(3)).toEqual(["abc", "de"]);
        });

        it("test split with chunk size 1", () => {
            // Split every character
            expect(Str.of("hello").split(1)).toEqual(["h", "e", "l", "l", "o"]);
        });

        it("test split with chunk size larger than string", () => {
            // If chunk size is larger than string, return whole string as single element
            expect(Str.of("hello").split(10)).toEqual(["hello"]);
        });

        it("test split empty string", () => {
            // Empty string returns empty array
            expect(Str.of("").split(3)).toEqual([]);
        });

        it("test split by regex pattern", () => {
            // String pattern splits by regex
            expect(Str.of("foo-bar-baz").split("-")).toEqual([
                "foo",
                "bar",
                "baz",
            ]);
            expect(Str.of("hello world test").split(" ")).toEqual([
                "hello",
                "world",
                "test",
            ]);
        });

        it("test split by regex with limit", () => {
            // Regex pattern with limit parameter
            expect(Str.of("foo-bar-baz-qux").split("-", 2)).toEqual([
                "foo",
                "bar",
            ]);
            expect(Str.of("a b c d e").split(" ", 3)).toEqual(["a", "b", "c"]);
        });

        it("test split with complex patterns", () => {
            // Test splitting by various patterns
            expect(Str.of("hello123world456test").split("\\d+")).toEqual([
                "hello",
                "world",
                "test",
            ]);
        });
    });

    describe("isJson", () => {
        it("Laravel tests", () => {
            const json = '{"key":"value"}';
            const notJson = '{"key":"value"';
            expect(Str.of(json).isJson()).toBe(true);
            expect(Str.of(notJson).isJson()).toBe(false);
        });
    });

    describe("isUrl", () => {
        it("Laravel tests", () => {
            const url = "https://example.com";
            const notUrl = "not a url";
            expect(Str.of(url).isUrl()).toBe(true);
            expect(Str.of(notUrl).isUrl()).toBe(false);
        });
    });

    describe("lower", () => {
        it("Laravel tests", () => {
            expectEqual("foo", Str.of("FOO").lower());
        });
    });

    describe("position", () => {
        it("Laravel tests", () => {
            const input = "hello";
            expect(Str.position(input, "e")).toBe(Str.of(input).position("e"));
        });
    });

    describe("remove", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.remove("bar", "foo bar baz"),
                Str.of("foo bar baz").remove("bar"),
            );
        });
    });

    describe("repeat", () => {
        it("Laravel tests", () => {
            const input = "hello";
            expectEqual(Str.repeat(input, 2), Str.of(input).repeat(2));
        });
    });

    describe("replaceArray", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.replaceArray("?", ["foo", "bar", "baz"], "?/?/?"),
                Str.of("?/?/?").replaceArray("?", ["foo", "bar", "baz"]),
            );
        });
    });

    describe("replaceMatches", () => {
        it("Laravel tests", () => {
            expectEqual(
                String(Str.replaceMatches("/baz/", "bar", "foo baz bar")),
                Str.of("foo baz bar").replaceMatches("/baz/", "bar"),
            );
        });
    });

    describe("scan", () => {
        it("test scan basic format specifiers", () => {
            expect(Str.of("SN/123456").scan("SN/%d")).toEqual(["123456"]);

            expect(Str.of("Otwell, Taylor").scan("%[^,],%s")).toEqual([
                "Otwell",
                "Taylor",
            ]);

            expect(Str.of("filename.jpg").scan("%[^.].%s")).toEqual([
                "filename",
                "jpg",
            ]);
        });

        it("test scan with no matches", () => {
            // Non-matching format returns empty array
            expect(Str.of("hello world").scan("%d")).toEqual([]);
            expect(Str.of("123").scan("abc%s")).toEqual([]);
        });

        it("test scan with empty string", () => {
            // Empty string returns empty array
            expect(Str.of("").scan("%d")).toEqual([]);
            expect(Str.of("").scan("%s")).toEqual([]);
            expect(Str.of("").scan("%[a-z]")).toEqual([]);
        });

        it("test scan with multiple integers", () => {
            // Multiple %d format specifiers
            expect(Str.of("10 20 30").scan("%d %d %d")).toEqual([
                "10",
                "20",
                "30",
            ]);
            expect(Str.of("1,2,3").scan("%d,%d,%d")).toEqual(["1", "2", "3"]);
        });

        it("test scan with multiple strings", () => {
            // Multiple %s format specifiers
            expect(Str.of("hello world test").scan("%s %s %s")).toEqual([
                "hello",
                "world",
                "test",
            ]);
            expect(Str.of("foo-bar-baz").scan("%s-%s-%s")).toEqual([
                "foo",
                "bar",
                "baz",
            ]);
        });

        it("test scan with negative integers", () => {
            // Negative number parsing
            expect(Str.of("Value: -42").scan("Value: %d")).toEqual(["-42"]);
            expect(Str.of("-10,-20").scan("%d,%d")).toEqual(["-10", "-20"]);
        });

        it("test scan with character class negation", () => {
            // Character class with negation %[^...]
            expect(Str.of("apple: red").scan("%[^:]:%s")).toEqual([
                "apple",
                "red",
            ]);
            expect(Str.of("user@domain.com").scan("%[^@]@%s")).toEqual([
                "user",
                "domain.com",
            ]);
        });

        it("test scan with character class inclusion", () => {
            // Character class with inclusion %[...]
            // Exact match required: %[a-z]%d matches "abc123" exactly, not "abc123def"
            expect(Str.of("abc123").scan("%[a-z]%d")).toEqual(["abc", "123"]);
            expect(Str.of("test456").scan("%[a-z]%d")).toEqual(["test", "456"]);
        });

        it("test scan with mixed format specifiers", () => {
            // Combine different format specifiers
            expect(Str.of("id:123 name:John").scan("id:%d name:%s")).toEqual([
                "123",
                "John",
            ]);
            expect(Str.of("2024-12-25").scan("%d-%d-%d")).toEqual([
                "2024",
                "12",
                "25",
            ]);
        });

        it("test scan with extra whitespace", () => {
            // Extra whitespace in input is handled by %s skipping it
            expect(Str.of("hello    world").scan("%s %s")).toEqual([
                "hello",
                "world",
            ]);
            expect(Str.of("10  20").scan("%d %d")).toEqual(["10", "20"]);
        });

        it("test scan with special literal characters", () => {
            // Literal special characters in format
            expect(Str.of("test.txt").scan("%[^.].%s")).toEqual([
                "test",
                "txt",
            ]);
            expect(Str.of("2024-01-15").scan("%d-%d-%d")).toEqual([
                "2024",
                "01",
                "15",
            ]);
            expect(Str.of("user(admin)").scan("%[^(](%s")).toEqual([
                "user",
                "admin)",
            ]);
        });

        it("test scan returns strings not numbers", () => {
            // Even though %d is for integers, JavaScript returns strings
            const result = Str.of("42").scan("%d");
            expect(result).toEqual(["42"]);
            expect(typeof result[0]).toBe("string");
        });

        it("test scan with single character matches", () => {
            // Single character class - exact match required
            expect(Str.of("a1").scan("%[a-z]%d")).toEqual(["a", "1"]);
            expect(Str.of("b2").scan("%[a-z]%d")).toEqual(["b", "2"]);
            // Does not match if extra characters follow
            expect(Str.of("a1b2c3").scan("%[a-z]%d")).toEqual([]);
        });

        it("test scan matching from start to end", () => {
            // Format must match entire string
            expect(Str.of("hello world").scan("hello %s")).toEqual(["world"]);
            expect(Str.of("hello world").scan("%s world")).toEqual(["hello"]);
        });

        it("test scan with only literal characters", () => {
            // Format with no specifiers - just literal text must match exactly
            expect(Str.of("hello").scan("hello")).toEqual([]);
            expect(Str.of("test").scan("test")).toEqual([]);
        });

        it("test scan with escaped special regex characters", () => {
            // Format contains special regex characters that need escaping
            expect(Str.of("a.b").scan("%s.%s")).toEqual(["a", "b"]);
            expect(Str.of("test+data").scan("%s+%s")).toEqual(["test", "data"]);
            expect(Str.of("a$b").scan("%s$%s")).toEqual(["a", "b"]);
            expect(Str.of("x^y").scan("%s^%s")).toEqual(["x", "y"]);
        });

        it("test scan with percent sign followed by non-format character", () => {
            // % followed by something other than [, d, s is treated as literal %
            expect(Str.of("100%").scan("100%")).toEqual([]);
            expect(Str.of("item%end").scan("item%end")).toEqual([]);
        });

        it("test scan with character class at start and end", () => {
            // Character class at the beginning and end
            expect(Str.of("abc").scan("%[a-z]%[b-z]%[c-z]")).toEqual([
                "a",
                "b",
                "c",
            ]);
            expect(Str.of("xyz").scan("%[x-z]%[x-z]%[x-z]")).toEqual([
                "x",
                "y",
                "z",
            ]);
        });

        it("test scan with digits in character class", () => {
            // Character class containing digits
            expect(Str.of("abc123def").scan("%[a-z]%[0-9]")).toEqual([]);
            // Character classes are greedy by default, so %[a-z] captures "ab", %[0-9] captures "12"
            expect(Str.of("ab12").scan("%[a-z]%[0-9]")).toEqual(["ab", "12"]);
        });

        it("test scan with uppercase and lowercase in character class", () => {
            // Mixed case in character class - character classes are greedy but each specifier is separate
            // So %[A-Za-z]+ on "AaBbCc" will match all letters, but since there are 3 separate specifiers,
            // the first captures "AaBb" (up to next character class boundary), and the rest capture single chars
            expect(
                Str.of("AaBbCc").scan("%[A-Za-z]%[A-Za-z]%[A-Za-z]"),
            ).toEqual(["AaBb", "C", "c"]);
            // %[A-Z] captures "H", then each %[a-z] captures one letter
            expect(
                Str.of("Hello").scan("%[A-Z]%[a-z]%[a-z]%[a-z]%[a-z]"),
            ).toEqual(["H", "e", "l", "l", "o"]);
        });

        it("test scan with whitespace in format as literal character", () => {
            // Whitespace in format acts as literal match
            expect(Str.of("hello world").scan("%s world")).toEqual(["hello"]);
            expect(Str.of("a b").scan("%s %s")).toEqual(["a", "b"]);
        });

        it("test scan with zero values", () => {
            // Test with zero values to ensure they're handled correctly
            expect(Str.of("0").scan("%d")).toEqual(["0"]);
            expect(Str.of("0,0,0").scan("%d,%d,%d")).toEqual(["0", "0", "0"]);
        });

        it("test scan with leading zeros in numbers", () => {
            // Numbers with leading zeros
            expect(Str.of("00123").scan("%d")).toEqual(["00123"]);
            expect(Str.of("001,002").scan("%d,%d")).toEqual(["001", "002"]);
        });

        it("test scan with very long numbers", () => {
            // Test with large numbers
            expect(Str.of("999999999999").scan("%d")).toEqual(["999999999999"]);
            expect(Str.of("123456789012345").scan("%d")).toEqual([
                "123456789012345",
            ]);
        });

        it("test scan with tab and newline characters", () => {
            // Special whitespace characters - %s should skip them
            expect(Str.of("hello\tworld").scan("%s %s")).toEqual([]);
            expect(Str.of("hello world").scan("%s %s")).toEqual([
                "hello",
                "world",
            ]);
        });

        it("test scan with hyphenated numbers", () => {
            // Numbers with hyphens (dates, etc.)
            expect(Str.of("2024-01-01").scan("%d-%d-%d")).toEqual([
                "2024",
                "01",
                "01",
            ]);
            expect(Str.of("123-456-7890").scan("%d-%d-%d")).toEqual([
                "123",
                "456",
                "7890",
            ]);
        });

        it("test scan with character class containing special characters", () => {
            // Character classes with literal separators work correctly
            expect(
                Str.of("hello-world-test").scan("%[a-z]-%[a-z]-%[a-z]"),
            ).toEqual(["hello", "world", "test"]);
            expect(Str.of("a-b").scan("%s-%s")).toEqual(["a", "b"]);
        });

        it("test scan with unclosed character class", () => {
            // If character class is not closed, pattern continues to end of format
            // %[a-z with no closing ] becomes ([a-z+ which matches "abc"
            expect(Str.of("abc").scan("%[a-z")).toEqual(["abc"]);
        });

        it("test scan with consecutive format specifiers", () => {
            // Format specifiers with no separator work when types don't mix
            expect(Str.of("abc123").scan("%[a-z]%d")).toEqual(["abc", "123"]);
            // %s matches non-whitespace including digits, so %s%d will capture everything except last digits for %d
            expect(Str.of("abc123def456").scan("%s%d")).toEqual([
                "abc123def45",
                "6",
            ]);
        });

        it("test scan with single digit", () => {
            // Single digit matching
            expect(Str.of("5").scan("%d")).toEqual(["5"]);
            expect(Str.of("1,2,3").scan("%d,%d,%d")).toEqual(["1", "2", "3"]);
        });

        it("test scan preserves order of captured groups", () => {
            // Verify captured groups are returned in order
            const result = Str.of("first:1 second:2 third:3").scan(
                "first:%d second:%d third:%d",
            );
            expect(result).toEqual(["1", "2", "3"]);
            expect(result[0]).toBe("1");
            expect(result[1]).toBe("2");
            expect(result[2]).toBe("3");
        });

        it("test scan with format shorter than input", () => {
            // Format doesn't match because it doesn't consume entire input
            expect(Str.of("hello world extra").scan("hello %s")).toEqual([]);
        });

        it("test scan with numeric strings", () => {
            // %s matching numeric strings
            expect(Str.of("123 456").scan("%s %s")).toEqual(["123", "456"]);
            expect(Str.of("12.34 56.78").scan("%s %s")).toEqual([
                "12.34",
                "56.78",
            ]);
        });

        it("test scan with only character classes", () => {
            // Format containing only character classes
            expect(Str.of("abc").scan("%[a-z]%[a-z]%[a-z]")).toEqual([
                "a",
                "b",
                "c",
            ]);
            expect(Str.of("ABC").scan("%[A-Z]%[A-Z]%[A-Z]")).toEqual([
                "A",
                "B",
                "C",
            ]);
        });

        it("scan with undefined capture groups", () => {
            // Tests the branch on line 940 where match[i] is undefined
            // Use format that might produce undefined groups
            const result = Str.of("123").scan("%d");
            expect(result).toEqual(["123"]);

            // Test scan with no matches
            expect(Str.of("abc").scan("%d")).toEqual([]);
        });
    });

    describe("stripTags", () => {
        it("Laravel tests", () => {
            const input = "<p>Hello <strong>World</strong></p>";
            expectEqual(Str.stripTags(input), Str.of(input).stripTags());
        });
    });

    describe("singular", () => {
        it("Laravel tests", () => {
            const input = "apples";
            expectEqual(Str.singular(input), Str.of(input).singular());
        });
    });

    describe("substr", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.substr("БГДЖИЛЁ", 2, -1),
                Str.of("БГДЖИЛЁ").substr(2, -1),
            );
        });

        it("substr with default length parameter (null)", () => {
            // Tests default length = null on line 1103
            const s = Str.of("hello world");
            expect(s.substr(6).toString()).toBe("world");
        });
    });

    describe("substrCount", () => {
        it("Laravel tests", () => {
            expect(Str.substrCount("laravelPHPFramework", "a")).toBe(
                Str.of("laravelPHPFramework").substrCount("a"),
            );
        });
    });

    describe("substrReplace", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.substrReplace("1200", ":", 2, 0),
                Str.of("1200").substrReplace(":", 2, 0),
            );
        });

        it("substrReplace with default parameters", () => {
            // Tests default offset = 0 and length = null on lines 1133-1134
            expect(Str.of("hello").substrReplace("X").toString()).toBe("X");
        });
    });

    describe("swap", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.swap(
                    {
                        PHP: "PHP 8",
                        awesome: "fantastic",
                    },
                    "PHP is awesome",
                ),
                Str.of("PHP is awesome").swap({
                    PHP: "PHP 8",
                    awesome: "fantastic",
                }),
            );
        });
    });

    describe("take", () => {
        it("Laravel tests", () => {
            expectEqual(Str.take("foo", 2), Str.of("foo").take(2));
        });
    });

    describe("trim", () => {
        it("Laravel tests", () => {
            expectEqual(Str.trim("  foo  "), Str.of("  foo  ").trim());
        });
    });

    describe("ltrim", () => {
        it("Laravel tests", () => {
            expectEqual(Str.ltrim("  foo  "), Str.of("  foo  ").ltrim());
        });
    });

    describe("rtrim", () => {
        it("Laravel tests", () => {
            expectEqual(Str.rtrim("  foo  "), Str.of("  foo  ").rtrim());
        });
    });

    describe("lcfirst", () => {
        it("Laravel tests", () => {
            expectEqual(Str.lcfirst("FOO"), Str.of("FOO").lcfirst());
        });
    });

    describe("ucfirst", () => {
        it("Laravel tests", () => {
            expectEqual(Str.ucfirst("foo"), Str.of("foo").ucfirst());
        });
    });

    describe("ucsplit", () => {
        it("Laravel tests", () => {
            expect(Str.ucsplit("Laravel_P_h_p_framework")).toEqual(
                Str.of("Laravel_P_h_p_framework").ucsplit(),
            );
        });
    });

    describe("ucwords", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.ucwords("hello world"),
                Str.of("hello world").ucwords(),
            );

            expectEqual(
                Str.ucwords("laravel php framework"),
                Str.of("laravel php framework").ucwords(),
            );
        });
    });

    describe("words", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.words("The quick brown fox jumps over the lazy dog"),
                Str.of("The quick brown fox jumps over the lazy dog").words(),
            );
        });
    });

    it("case transformations and trimming chain", () => {
        const input = "  foo_bar baz  ";
        const expected = Str.upper(Str.snake(Str.trim(input)));
        const result = Str.of(input).trim().snake().upper().toString();
        expect(result).toBe(expected);
    });

    describe("replace", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(
                Str.replace("bar", "qux", input),
                Str.of(input).replace("bar", "qux"),
            );
        });
    });

    describe("replaceFirst", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(
                Str.replaceFirst("f", "F", input),
                Str.of(input).replaceFirst("f", "F"),
            );
        });
    });

    describe("replaceLast", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(
                Str.replaceLast("a", "A", input),
                Str.of(input).replaceLast("a", "A"),
            );
        });
    });

    describe("replaceStart", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(
                Str.replaceStart("foo", "FOO", input),
                Str.of(input).replaceStart("foo", "FOO"),
            );
        });
    });

    describe("replaceEnd", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(
                Str.replaceEnd("baz", "BAZ", input),
                Str.of(input).replaceEnd("baz", "BAZ"),
            );
        });
    });

    describe("padLeft", () => {
        it("Laravel tests", () => {
            const input = "Alien";
            expectEqual(
                Str.padLeft(input, 8, "-"),
                Str.of(input).padLeft(8, "-"),
            );
        });

        it("padLeft with default pad parameter", () => {
            const s = Str.of("hi");
            expect(s.padLeft(4).toString()).toBe("  hi");
        });
    });

    describe("padRight", () => {
        it("Laravel tests", () => {
            const input = "Alien";
            expectEqual(
                Str.padRight(input, 8, "-"),
                Str.of(input).padRight(8, "-"),
            );
        });

        it("padRight with default pad parameter", () => {
            const s = Str.of("hi");
            expect(s.padRight(4).toString()).toBe("hi  ");
        });
    });

    describe("padBoth", () => {
        it("Laravel tests", () => {
            const input = "Alien";
            expectEqual(
                Str.padBoth(input, 9, "-"),
                Str.of(input).padBoth(9, "-"),
            );
        });

        it("padBoth with default pad parameter", () => {
            const s = Str.of("hi");
            expect(s.padBoth(6).toString()).toBe("  hi  ");
        });
    });

    describe("start", () => {
        it("Laravel tests", () => {
            expectEqual(Str.start("x", "/"), Str.of("x").start("/"));
        });
    });

    describe("finish", () => {
        it("Laravel tests", () => {
            expectEqual(Str.finish("x", "/"), Str.of("x").finish("/"));
        });
    });

    describe("wrap", () => {
        it("Laravel tests", () => {
            expectEqual(Str.wrap("x", "[", "]"), Str.of("x").wrap("[", "]"));
        });

        it("wrap with default after parameter (null)", () => {
            // Tests default after = null on line 1571
            expect(Str.of("hello").wrap("*").toString()).toBe("*hello*");
        });
    });

    describe("unwrap", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.unwrap("[x]", "[", "]"),
                Str.of("[x]").unwrap("[", "]"),
            );
        });

        it("unwrap with default after parameter (null)", () => {
            // Tests default after = null on line 1582
            expect(Str.of("*hello*").unwrap("*").toString()).toBe("hello");
        });
    });

    describe("markdown", () => {
        it("Laravel tests", () => {
            const input = "# Hello";
            expectEqual(Str.markdown(input), Str.of(input).markdown());
        });
    });

    describe("inlineMarkdown", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.inlineMarkdown("Hello *World*"),
                Str.of("Hello *World*").inlineMarkdown(),
            );
        });
    });

    describe("mask", () => {
        it("Laravel tests", () => {
            const input = "taylor@email.com";
            expectEqual(Str.mask(input, "*", 3), Str.of(input).mask("*", 3));
        });
    });

    describe("numbers", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.numbers("abc123def"),
                Str.of("abc123def").numbers(),
            );
        });

        it("numbers() keeps only digits and returns Stringable", () => {
            const s = Str.of("a1b2c3").numbers();
            expect(s).toBeInstanceOf(Stringable);
            expect(s.toString()).toBe("123");
        });
    });

    describe("reverse", () => {
        it("Laravel tests", () => {
            expectEqual(Str.reverse("hello"), Str.of("hello").reverse());
        });
    });

    describe("squish", () => {
        it("Laravel tests", () => {
            expectEqual(Str.squish("a   b\n c"), Str.of("a   b\n c").squish());
        });
    });

    describe("wordWrap", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.wordWrap("foo bar baz", 5),
                Str.of("foo bar baz").wordWrap(5),
            );
        });

        it("wordWrap with default parameters", () => {
            // Tests default characters = 75, breakStr = "\n", cutLongWords = false on line 1555
            const longString = "hello world";
            expect(Str.of(longString).wordWrap().toString()).toBe(longString);
        });
    });

    describe("plural", () => {
        it("Laravel tests", () => {
            expectEqual(Str.plural("apple", 2), Str.of("apple").plural(2));
        });

        it("plural with prependCount = true", () => {
            // Tests prependCount = true on line 696
            expect(Str.of("apple").plural(3, true).toString()).toBe("3 apples");
        });

        it("plural with default parameters", () => {
            // Tests default count = 2 on line 696
            expect(Str.of("apple").plural().toString()).toBe("apples");
            // Count of 1 should return singular
            expect(Str.of("apple").plural(1).toString()).toBe("apple");
        });
    });

    describe("pluralStudly", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.pluralStudly("FooBar", 3),
                Str.of("FooBar").pluralStudly(3),
            );
        });

        it("pluralStudly with default count", () => {
            // Tests default count = 2 on line 706
            expect(Str.of("FooBar").pluralStudly().toString()).toBe("FooBars");
        });
    });

    describe("pluralPascal", () => {
        it("Laravel tests", () => {
            expectEqual(
                Str.pluralPascal("FooBar", 3),
                Str.of("FooBar").pluralPascal(3),
            );
        });

        it("pluralPascal with default count", () => {
            // Tests default count = 2 on line 718
            expect(Str.of("FooBar").pluralPascal().toString()).toBe("FooBars");
        });
    });

    describe("slug", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(Str.slug(input), Str.of(input).slug());
        });
    });

    describe("studly", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(Str.studly(input), Str.of(input).studly());
        });
    });

    describe("pascal", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(Str.pascal(input), Str.of(input).pascal());
        });
    });

    describe("kebab", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(Str.kebab(input), Str.of(input).kebab());
        });
    });

    describe("snake", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(Str.snake(input), Str.of(input).snake());
        });
    });

    describe("title", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(Str.title(input), Str.of(input).title());
        });
    });

    describe("headline", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(Str.headline(input), Str.of(input).headline());
        });
    });

    describe("apa", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(Str.apa(input), Str.of(input).apa());
        });
    });

    describe("startsWith", () => {
        it("Laravel tests", () => {
            const input = "Laravel";
            expect(Str.of(input).startsWith("La")).toBe(
                Str.startsWith(input, "La"),
            );
        });
    });

    describe("endsWith", () => {
        it("Laravel tests", () => {
            const input = "Laravel";
            expect(Str.of(input).endsWith("vel")).toBe(
                Str.endsWith(input, "vel"),
            );
        });
    });

    describe("contains", () => {
        it("Laravel tests", () => {
            const input = "Laravel";
            expect(Str.of(input).contains("rav")).toBe(
                Str.contains(input, "rav"),
            );
        });
    });

    describe("doesntStartWith", () => {
        it("Laravel tests", () => {
            const input = "Laravel";
            expect(Str.of(input).doesntStartWith("ra")).toBe(
                Str.doesntStartWith(input, "ra"),
            );
        });
    });

    describe("doesntEndWith", () => {
        it("Laravel tests", () => {
            const input = "Laravel";
            expect(Str.of(input).doesntEndWith("ra")).toBe(
                Str.doesntEndWith(input, "ra"),
            );
        });
    });

    describe("doesntContain", () => {
        it("test doesntContain", () => {
            expect(Str.of("taylor").doesntContain("xxx")).toBe(true);

            expect(Str.of("taylor").doesntContain(["xxx"])).toBe(true);

            expect(Str.of("taylor").doesntContain(["xxx", "yyy"])).toBe(true);

            expect(Str.of("taylor").doesntContain(["xxx", "yyy"])).toBe(true);

            expect(Str.of("taylor").doesntContain("")).toBe(true);

            expect(Str.of("taylor").doesntContain("ylo")).toBe(false);

            expect(Str.of("taylor").doesntContain("taylor")).toBe(false);

            expect(Str.of("taylor").doesntContain(["xxx", "ylo"])).toBe(false);

            expect(Str.of("taylor").doesntContain(["LOR"], true)).toBe(false);
        });
    });

    describe("match", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expectEqual(
                Str.match(/bar/.source, input),
                Str.of(input).match(/bar/.source),
            );
        });
    });

    describe("isMatch", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expect(Str.of(input).isMatch(/bar/.source)).toBe(
                Str.isMatch(/bar/.source, input),
            );
            expect(Str.of(input).test(/baz/.source)).toBe(
                Str.isMatch(/baz/.source, input),
            );
        });
    });

    describe("matchAll", () => {
        it("Laravel tests", () => {
            const input = "foo bar baz";
            expect(Str.of(input).matchAll(/ba./.source)).toEqual(
                Str.matchAll(/ba./.source, input),
            );
        });
    });

    describe("length", () => {
        it("Laravel tests", () => {
            const input = "Hello brave new world";
            expect(Str.of(input).length()).toBe(Str.length(input));
        });
    });

    describe("wordCount", () => {
        it("Laravel tests", () => {
            const input = "Hello brave new world";
            expect(Str.of(input).wordCount()).toBe(Str.wordCount(input));
        });
    });

    describe("limit", () => {
        it("Laravel tests", () => {
            const input = "Hello brave new world";
            expectEqual(Str.limit(input, 7), Str.of(input).limit(7));
        });

        it("limit with default parameters", () => {
            // Tests default limitValue = 100 on line 536
            const shortString = "Short string";
            expect(Str.of(shortString).limit().toString()).toBe(shortString);
        });
    });

    describe("words", () => {
        it("Laravel tests", () => {
            // TODO: copy tests from packages/str/stubs/StringableTest.php
            // const input = "Hello brave new world";
        });
    });

    describe("base64", () => {
        it("Laravel tests", () => {
            const input = "Hello 世界";
            const encoded = Str.of(input).toBase64();
            expect(encoded.toString()).toBe(Str.toBase64(input));
            const decoded = encoded.fromBase64();
            expect(decoded && decoded.toString()).toBe(input);
            const bad = Str.of("@@@").fromBase64(true);
            expect(bad).toBe(false);
        });
    });

    describe("pipe", () => {
        it("Laravel tests", () => {
            const r = Str.of("hello").pipe((s) => s.upper().append("!"));
            expect(r.toString()).toBe("HELLO!");
        });

        it("pipe returns Stringable when callback returns string", () => {
            const r = Str.of("hi").pipe(() => "HI!");
            expect(r).toBeInstanceOf(Stringable);
            expect(r.toString()).toBe("HI!");
        });
    });

    describe("append", () => {
        it("Laravel tests", () => {
            expectEqual(
                "foo123bar",
                Str.of("foo").append(1, 2, 3).append("bar"),
            );
        });
    });

    describe("prepend", () => {
        it("Laravel tests", () => {
            expectEqual("abcfoo", Str.of("foo").prepend("a", "b", "c"));
        });
    });

    describe("newLine", () => {
        it("Laravel tests", () => {
            // newLine appends N newlines, clamps negatives to 0
            expectEqual("x\n\n", Str.of("x").newLine(2));
            expectEqual("x", Str.of("x").newLine(-5));
            expectEqual("x\n", Str.of("x").newLine());
        });
    });

    describe("exactly", () => {
        it("Laravel tests", () => {
            const a = Str.of("hello");
            const b = Str.of("hello");
            const c = Str.of("world");
            expect(a.exactly("hello")).toBe(true);
            expect(a.exactly(b)).toBe(true);
            expect(a.exactly(c)).toBe(false);
        });
    });

    describe("isEmpty", () => {
        it("Laravel tests", () => {
            const empty = Str.of("");
            const nonEmpty = Str.of(" ");
            expect(empty.isEmpty()).toBe(true);
            expect(nonEmpty.isEmpty()).toBe(false);

            const s = Str.of("abc");
            expect(s.toString()).toBe("abc");
            expect(s.value()).toBe("abc");
        });
    });

    describe("isNotEmpty", () => {
        it("Laravel tests", () => {
            const empty = Str.of("");
            const nonEmpty = Str.of(" ");
            expect(empty.isNotEmpty()).toBe(false);
            expect(nonEmpty.isNotEmpty()).toBe(true);

            const s = Str.of("abc");
            expect(s.toString()).toBe("abc");
            expect(s.value()).toBe("abc");
        });
    });

    describe("toInteger", () => {
        it("Laravel tests", () => {
            expect(Str.of("10").toInteger()).toBe(10);
            expect(Str.of("FF").toInteger(16)).toBe(255);
            // Invalid base falls back to 10
            expect(Str.of("10").toInteger("oops" as unknown as number)).toBe(
                10,
            );
        });
    });

    describe("toFloat", () => {
        it("Laravel tests", () => {
            expect(Str.of("3.14159").toFloat()).toBeCloseTo(3.14159);
            expect(Number.isNaN(Str.of("not-a-number").toFloat())).toBe(true);
        });
    });

    describe("toBoolean", () => {
        it("Laravel tests", () => {
            const truthy = ["1", "true", "on", "yes", "  TRUE  "];
            truthy.forEach((v) => expect(Str.of(v).toBoolean()).toBe(true));

            const falsy = ["0", "false", "off", "no", "", "random"];
            falsy.forEach((v) => expect(Str.of(v).toBoolean()).toBe(false));
        });
    });

    describe("toDate", () => {
        it("Laravel tests", () => {
            const d = Str.of("2023-01-02T03:04:05Z").toDate();
            expect(d).toBeInstanceOf(Date);
            expect(d?.toISOString()).toBe("2023-01-02T03:04:05.000Z");

            const bad = Str.of("not a date").toDate();
            expect(bad).toBeNull();
        });
    });

    describe("jsonSerialize", () => {
        it("Laravel tests", () => {
            expect(Str.of("hello").jsonSerialize()).toBe("hello");
        });
    });

    describe("when & unless", () => {
        it("when executes callback on truthy and default on falsy", () => {
            const s = Str.of("hello");
            const truthy = s.when(true, (inst) => inst.upper());
            expectEqual("HELLO", truthy);

            const falsy = s.when(
                false,
                (inst) => inst.upper(),
                (inst) => inst.append("!"),
            );
            expectEqual("hello!", falsy);
        });

        it("unless executes callback on falsy and default on truthy", () => {
            const s = Str.of("hello");
            const onFalsy = s.unless(false, (inst) => inst.upper());
            expectEqual("HELLO", onFalsy);

            const onTruthy = s.unless(
                true,
                (inst) => inst.upper(),
                (inst) => inst.append("?"),
            );
            expectEqual("hello?", onTruthy);
        });

        it("when value can be a function and returning undefined keeps original", () => {
            const s = Str.of("hello");
            const same = s.when(
                () => true,
                () => undefined as unknown as Stringable,
            );
            expect(same).toBe(s); // same instance when callback returns undefined

            const sameUnless = s.unless(
                () => false,
                () => undefined as unknown as Stringable,
            );
            expect(sameUnless).toBe(s);
        });

        it("when with falsy value and no defaultCallback returns this", () => {
            const s = Str.of("hello");
            // No defaultCallback provided, falsy condition returns original instance
            const result = s.when(false, (inst) => inst.upper());
            expect(result).toBe(s);
            expect(result.toString()).toBe("hello");

            // Also test with null value
            const resultNull = s.when(null, (inst) => inst.upper());
            expect(resultNull).toBe(s);

            // And with function returning falsy
            const resultFunc = s.when(
                () => 0,
                (inst) => inst.upper(),
            );
            expect(resultFunc).toBe(s);
        });

        it("unless with truthy value and no defaultCallback returns this", () => {
            const s = Str.of("hello");
            // No defaultCallback provided, truthy condition returns original instance
            const result = s.unless(true, (inst) => inst.upper());
            expect(result).toBe(s);
            expect(result.toString()).toBe("hello");

            // Also test with truthy string value
            const resultTruthy = s.unless("yes", (inst) => inst.upper());
            expect(resultTruthy).toBe(s);

            // And with function returning truthy
            const resultFunc = s.unless(
                () => 1,
                (inst) => inst.upper(),
            );
            expect(resultFunc).toBe(s);
        });

        it("when with null callback returns this", () => {
            // Tests callback = null default
            const s = Str.of("hello");
            const result = s.when(true, null);
            expect(result).toBe(s);
            expect(result.toString()).toBe("hello");
        });
        it("when called without callback parameter", () => {
            // Tests callback default parameter = null
            const s = Str.of("hello");
            const result = s.when(true);
            expect(result).toBe(s);
        });
        it("when callback returns undefined returns this", () => {
            // Tests callback?.() ?? this
            const s = Str.of("hello");
            const result = s.when(
                true,
                () => undefined as unknown as Stringable,
            );
            expect(result).toBe(s);
        });

        it("unless with null callback returns this", () => {
            // Tests callback = null default
            const s = Str.of("hello");
            const result = s.unless(false, null);
            expect(result).toBe(s);
            expect(result.toString()).toBe("hello");
        });

        it("unless callback returns undefined returns this", () => {
            // Tests callback?.() ?? this
            const s = Str.of("hello");
            const result = s.unless(
                false,
                () => undefined as unknown as Stringable,
            );
            expect(result).toBe(s);
        });

        it("unless with truthy value and no defaultCallback returns this", () => {
            // Tests where defaultCallback is null
            const s = Str.of("hello");
            const result = s.unless(true);
            expect(result).toBe(s);
        });

        it("when with falsy value and defaultCallback that returns undefined", () => {
            // Tests defaultCallback returning undefined falls back to this on line 1265
            const s = Str.of("hello");
            const result = s.when(
                false,
                () => Str.of("UPPER"),
                () => undefined as unknown as Stringable,
            );
            expect(result).toBe(s);
        });

        it("unless with truthy value and defaultCallback that returns undefined", () => {
            // Tests defaultCallback returning undefined falls back to this on line 1301
            const s = Str.of("hello");
            const result = s.unless(
                true,
                () => Str.of("UPPER"),
                () => undefined as unknown as Stringable,
            );
            expect(result).toBe(s);
        });
    });

    describe("conditional helpers (when*)", () => {
        it("whenContains / whenContainsAll", () => {
            const s = Str.of("foo bar baz");
            expectEqual(
                "FOO bar baz",
                s.whenContains("foo", (inst) =>
                    inst.replaceFirst("foo", "FOO"),
                ),
            );

            expectEqual(
                "[foo bar baz]",
                s.whenContainsAll(["foo", "bar"], (inst) =>
                    inst.wrap("[", "]"),
                ),
            );

            // default path
            expectEqual(
                "foo bar baz",
                s.whenContainsAll(
                    ["missing"],
                    (inst) => inst.upper(),
                    (inst) => inst,
                ),
            );
        });

        it("whenEmpty / whenNotEmpty", () => {
            expectEqual(
                "(empty)",
                Str.of("").whenEmpty((inst) =>
                    inst.prepend("empty").wrap("(", ")"),
                ),
            );
            expectEqual(
                "a!",
                Str.of("a").whenNotEmpty((inst) => inst.append("!")),
            );
        });

        it("whenEndsWith / whenDoesntEndWith", () => {
            expectEqual(
                "path/",
                Str.of("path").whenDoesntEndWith("/", (i) => i.finish("/")),
            );
            expectEqual(
                "hello",
                Str.of("hello").whenEndsWith("lo", (i) => i),
            );
        });

        it("whenExactly / whenNotExactly", () => {
            expectEqual(
                "OK",
                Str.of("x").whenExactly("x", () => Str.of("OK")),
            );
            expectEqual(
                "NO",
                Str.of("x").whenNotExactly("y", () => Str.of("NO")),
            );
        });

        it("whenIs, whenIsAscii, whenIsUuid, whenIsUlid, whenStartsWith, whenTest", () => {
            expectEqual(
                "match",
                Str.of("hello").whenIs("hello", () => Str.of("match")),
            );
            expectEqual(
                "ASCII",
                Str.of("abc").whenIsAscii(() => Str.of("ASCII")),
            );
            expectEqual(
                "not ascii",
                Str.of("こんにちは").whenIsAscii(
                    () => Str.of("ASCII"),
                    () => Str.of("not ascii"),
                ),
            );

            const uuid = "550e8400-e29b-41d4-a716-446655440000";
            expectEqual(
                "uuid",
                Str.of(uuid).whenIsUuid(() => Str.of("uuid")),
            );
            expectEqual(
                "not uuid",
                Str.of("nope").whenIsUuid(
                    () => Str.of("uuid"),
                    () => Str.of("not uuid"),
                ),
            );

            const ulid = "01F8MECHZX2D7J8F8C8D4B8F8C";
            expectEqual(
                "ulid",
                Str.of(ulid).whenIsUlid(() => Str.of("ulid")),
            );

            expectEqual(
                "starts",
                Str.of("foobar").whenStartsWith("foo", () => Str.of("starts")),
            );
            expectEqual(
                "has bar",
                Str.of("foo bar baz").whenTest("bar", () => Str.of("has bar")),
            );
        });
    });

    describe("of & str & constructor", () => {
        it("of() and str() with default parameter (no argument)", () => {
            // Tests the default parameter value = "" on lines 116, 128
            const defaultOf = Str.of();
            expect(defaultOf.toString()).toBe("");
            expect(defaultOf.isEmpty()).toBe(true);

            const defaultStr = Str.str();
            expect(defaultStr.toString()).toBe("");
            expect(defaultStr.isEmpty()).toBe(true);
        });

        it("Stringable constructor with default parameter", () => {
            // Tests the default parameter value = "" on line 138
            const s = new Stringable();
            expect(s.toString()).toBe("");
            expect(s.isEmpty()).toBe(true);
        });
    });
});
