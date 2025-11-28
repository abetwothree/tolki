import { CaseTypes, Stringable } from "@laravel-js/str";
import * as Str from "@laravel-js/str";
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
