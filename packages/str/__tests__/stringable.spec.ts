import { CaseTypes, Stringable } from "@zinaid/str";
import * as Str from "@zinaid/str";
import { describe, expect, it } from "vitest";

// Helper to compare Stringable method against Str function
function expectEqual(strResult: string, s: Stringable) {
    expect(s.toString()).toBe(strResult);
}

describe("Stringable basic delegation", () => {
    it("after/before/between family delegates to Str", () => {
        const input = "a-hello-b-world-c";
        expectEqual(Str.after(input, "-"), Str.of(input).after("-"));
        expectEqual(Str.afterLast(input, "-"), Str.of(input).afterLast("-"));
        expectEqual(Str.before(input, "-"), Str.of(input).before("-"));
        expectEqual(Str.beforeLast(input, "-"), Str.of(input).beforeLast("-"));
        expectEqual(
            Str.between(input, "-", "-"),
            Str.of(input).between("-", "-"),
        );
        expectEqual(
            Str.betweenFirst(input, "-", "-"),
            Str.of(input).betweenFirst("-", "-"),
        );
    });

    describe("str", () => {
        it("test str function", () => {
            const input = "hello world";
            const s = Str.str(input);
            expect(s).toBeInstanceOf(Stringable);
        });
    });

    it("ascii/isAscii/transliterate family delegates to Str", () => {
        const input = "foo";
        expect(Str.isAscii(input)).toBe(Str.of(input).isAscii());
        expectEqual(Str.ascii("fóó"), Str.of("fóó").ascii());
        expectEqual(Str.transliterate("fóó"), Str.of("fóó").transliterate());
    });

    it("snake/camel/studly family delegates to Str", () => {
        expectEqual(Str.camel("foo_bar"), Str.of("foo_bar").camel());
        expectEqual(Str.snake("fooBar"), Str.of("fooBar").snake());
        expectEqual(Str.studly("foo bar"), Str.of("foo bar").studly());
    });

    it("charAt/chopStart/chopEnd", () => {
        const input = "hello";
        expect(Str.charAt(input, 1)).toBe(Str.of(input).charAt(1));
        expectEqual(Str.chopStart(input, "h"), Str.of(input).chopStart("h"));
        expectEqual(Str.chopEnd(input, "o"), Str.of(input).chopEnd("o"));
    });

    it("convertCase", () => {
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

    it("deduplicate", () => {
        const input = "foo bar baz foo";
        const expected = Str.of("foo bar baz foo").deduplicate();
        expectEqual(Str.deduplicate(input), expected);
    });

    it("excerpt", () => {
        const input = "The quick brown fox jumps over the lazy dog";
        expect(Str.excerpt(input)).toBe(Str.of(input).excerpt());
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

    it("isJson/isUrl", () => {
        const json = '{"key":"value"}';
        const notJson = '{"key":"value"';
        expect(Str.of(json).isJson()).toBe(true);
        expect(Str.of(notJson).isJson()).toBe(false);

        const url = "https://example.com";
        const notUrl = "not a url";
        expect(Str.of(url).isUrl()).toBe(true);
        expect(Str.of(notUrl).isUrl()).toBe(false);
    });

    it("lower", () => {
        expectEqual("foo", Str.of("FOO").lower());
    });

    it("position", () => {
        const input = "hello";
        expect(Str.position(input, "e")).toBe(Str.of(input).position("e"));
    });

    it("remove", () => {
        expectEqual(
            Str.remove("bar", "foo bar baz") as string,
            Str.of("foo bar baz").remove("bar"),
        );
    });

    it("repeat", () => {
        const input = "hello";
        expectEqual(Str.repeat(input, 2), Str.of(input).repeat(2));
    });

    it("replaceArray/replaceMatches", () => {
        expectEqual(
            Str.replaceArray("?", ["foo", "bar", "baz"], "?/?/?"),
            Str.of("?/?/?").replaceArray("?", ["foo", "bar", "baz"]),
        );
        expectEqual(
            String(Str.replaceMatches("/baz/", "bar", "foo baz bar")),
            Str.of("foo baz bar").replaceMatches("/baz/", "bar"),
        );
    });

    describe("scan", () => {
        it("test scan basic format specifiers", () => {
            // $this->assertSame([123456], $this->stringable('SN/123456')->scan('SN/%d')->toArray());
            expect(Str.of("SN/123456").scan("SN/%d")).toEqual(["123456"]);

            // $this->assertSame(['Otwell', 'Taylor'], $this->stringable('Otwell, Taylor')->scan('%[^,],%s')->toArray());
            expect(Str.of("Otwell, Taylor").scan("%[^,],%s")).toEqual([
                "Otwell",
                "Taylor",
            ]);

            // $this->assertSame(['filename', 'jpg'], $this->stringable('filename.jpg')->scan('%[^.].%s')->toArray());
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
    });

    it("stripTags", () => {
        const input = "<p>Hello <strong>World</strong></p>";
        expectEqual(Str.stripTags(input), Str.of(input).stripTags());
    });

    it("singular", () => {
        const input = "apples";
        expectEqual(Str.singular(input), Str.of(input).singular());
    });

    it("substr/substrCount/substrReplace", () => {
        expectEqual(
            Str.substr("БГДЖИЛЁ", 2, -1),
            Str.of("БГДЖИЛЁ").substr(2, -1),
        );
        expect(Str.substrCount("laravelPHPFramework", "a")).toBe(
            Str.of("laravelPHPFramework").substrCount("a"),
        );
        expectEqual(
            Str.substrReplace("1200", ":", 2, 0) as string,
            Str.of("1200").substrReplace(":", 2, 0),
        );
    });

    it("swap/take", () => {
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
        expectEqual(Str.take("foo", 2), Str.of("foo").take(2));
    });

    it("trim/ltrim/rtrim", () => {
        expectEqual(Str.trim("  foo  "), Str.of("  foo  ").trim());
        expectEqual(Str.ltrim("  foo  "), Str.of("  foo  ").ltrim());
        expectEqual(Str.rtrim("  foo  "), Str.of("  foo  ").rtrim());
    });

    it("lcfirst/ucfirst/ucsplit/ucwords", () => {
        expectEqual(Str.lcfirst("FOO"), Str.of("FOO").lcfirst());
        expectEqual(Str.ucfirst("foo"), Str.of("foo").ucfirst());
        expect(Str.ucsplit("Laravel_P_h_p_framework")).toEqual(
            Str.of("Laravel_P_h_p_framework").ucsplit(),
        );
        expectEqual(
            Str.ucwords("hello world"),
            Str.of("hello world").ucwords(),
        );
    });

    it("ucwords/words", () => {
        expectEqual(
            Str.ucwords("laravel php framework"),
            Str.of("laravel php framework").ucwords(),
        );
        expectEqual(
            Str.words("The quick brown fox jumps over the lazy dog"),
            Str.of("The quick brown fox jumps over the lazy dog").words(),
        );
    });

    it("case transformations and trimming chain", () => {
        const input = "  foo_bar baz  ";
        const expected = Str.upper(Str.snake(Str.trim(input)));
        const result = Str.of(input).trim().snake().upper().toString();
        expect(result).toBe(expected);
    });

    it("replace family delegates to Str", () => {
        const input = "foo bar baz";
        expectEqual(
            Str.replace("bar", "qux", input) as string,
            Str.of(input).replace("bar", "qux"),
        );
        expectEqual(
            Str.replaceFirst("f", "F", input),
            Str.of(input).replaceFirst("f", "F"),
        );
        expectEqual(
            Str.replaceLast("a", "A", input),
            Str.of(input).replaceLast("a", "A"),
        );
        expectEqual(
            Str.replaceStart("foo", "FOO", input),
            Str.of(input).replaceStart("foo", "FOO"),
        );
        expectEqual(
            Str.replaceEnd("baz", "BAZ", input),
            Str.of(input).replaceEnd("baz", "BAZ"),
        );
    });

    it("pad / start / finish / wrap / unwrap", () => {
        const input = "Alien";
        expectEqual(Str.padLeft(input, 8, "-"), Str.of(input).padLeft(8, "-"));
        expectEqual(
            Str.padRight(input, 8, "-"),
            Str.of(input).padRight(8, "-"),
        );
        expectEqual(Str.padBoth(input, 9, "-"), Str.of(input).padBoth(9, "-"));

        expectEqual(Str.start("x", "/"), Str.of("x").start("/"));
        expectEqual(Str.finish("x", "/"), Str.of("x").finish("/"));
        expectEqual(Str.wrap("x", "[", "]"), Str.of("x").wrap("[", "]"));
        expectEqual(
            Str.unwrap("[x]", "[", "]"),
            Str.of("[x]").unwrap("[", "]"),
        );
    });

    it("markdown delegates to Str", () => {
        const input = "# Hello";
        expectEqual(Str.markdown(input), Str.of(input).markdown());
        expectEqual(
            Str.inlineMarkdown("Hello *World*"),
            Str.of("Hello *World*").inlineMarkdown(),
        );
    });

    it("mask, numbers, reverse, squish, wordWrap", () => {
        const input = "taylor@email.com";
        expectEqual(Str.mask(input, "*", 3), Str.of(input).mask("*", 3));
        expectEqual(
            Str.numbers("abc123def") as string,
            Str.of("abc123def").numbers(),
        );
        expectEqual(Str.reverse("hello"), Str.of("hello").reverse());
        expectEqual(Str.squish("a   b\n c"), Str.of("a   b\n c").squish());
        expectEqual(
            Str.wordWrap("foo bar baz", 5),
            Str.of("foo bar baz").wordWrap(5),
        );
    });

    it("pluralization helpers", () => {
        expectEqual(Str.plural("apple", 2), Str.of("apple").plural(2));
        expectEqual(
            Str.pluralStudly("FooBar", 3),
            Str.of("FooBar").pluralStudly(3),
        );
        expectEqual(
            Str.pluralPascal("FooBar", 3),
            Str.of("FooBar").pluralPascal(3),
        );
    });

    it("slug, studly, pascal, kebab, snake, title, headline, apa", () => {
        const input = "foo bar baz";
        expectEqual(Str.slug(input), Str.of(input).slug());
        expectEqual(Str.studly(input), Str.of(input).studly());
        expectEqual(Str.pascal(input), Str.of(input).pascal());
        expectEqual(Str.kebab(input), Str.of(input).kebab());
        expectEqual(Str.snake(input), Str.of(input).snake());
        expectEqual(Str.title(input), Str.of(input).title());
        expectEqual(Str.headline(input), Str.of(input).headline());
        expectEqual(Str.apa(input), Str.of(input).apa());
    });

    it("startsWith/endsWith/contains booleans match", () => {
        const input = "Laravel";
        expect(Str.of(input).startsWith("La")).toBe(
            Str.startsWith(input, "La"),
        );
        expect(Str.of(input).endsWith("vel")).toBe(Str.endsWith(input, "vel"));
        expect(Str.of(input).contains("rav")).toBe(Str.contains(input, "rav"));
        expect(Str.of(input).doesntStartWith("ra")).toBe(
            Str.doesntStartWith(input, "ra"),
        );
        expect(Str.of(input).doesntEndWith("ra")).toBe(
            Str.doesntEndWith(input, "ra"),
        );
    });

    describe("doestContain", () => {
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

    it("match/isMatch/matchAll/test parity", () => {
        const input = "foo bar baz";
        expectEqual(
            Str.match(/bar/.source, input),
            Str.of(input).match(/bar/.source),
        );
        expect(Str.of(input).isMatch(/bar/.source)).toBe(
            Str.isMatch(/bar/.source, input),
        );
        expect(Str.of(input).test(/baz/.source)).toBe(
            Str.isMatch(/baz/.source, input),
        );
        expect(Str.of(input).matchAll(/ba./.source)).toEqual(
            Str.matchAll(/ba./.source, input),
        );
    });

    it("length/wordCount limit/words", () => {
        const input = "Hello brave new world";
        expect(Str.of(input).length()).toBe(Str.length(input));
        expect(Str.of(input).wordCount()).toBe(Str.wordCount(input));
        expectEqual(Str.limit(input, 7), Str.of(input).limit(7));
        // words() exists on Str only; we just ensure wordWrap and limit above cover behavior
    });

    it("base64 roundtrip and strict failure", () => {
        const input = "Hello 世界";
        const encoded = Str.of(input).toBase64();
        expect(encoded.toString()).toBe(Str.toBase64(input));
        const decoded = encoded.fromBase64();
        expect(decoded && decoded.toString()).toBe(input);
        const bad = Str.of("@@@").fromBase64(true);
        expect(bad).toBe(false);
    });

    it("pipe works and preserves Stringable", () => {
        const r = Str.of("hello").pipe((s) => s.upper().append("!"));
        expect(r.toString()).toBe("HELLO!");
    });
});
