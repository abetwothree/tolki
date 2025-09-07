import { describe, it, expect } from "vitest";
import { Str, Stringable } from "../src/index.js";

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
