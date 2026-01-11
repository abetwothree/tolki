import * as Str from "@tolki/str";
import { describe, expect, it } from "vitest";

describe("Str/Pluralizer", () => {
    describe("plural", () => {
        it("pluralizes words", () => {
            expect(Str.plural("cat")).toBe("cats");
            expect(Str.plural("child")).toBe("children");
        });

        it("uses default count of 2 when not specified", () => {
            expect(Str.plural("apple")).toBe("apples");
        });

        it("respects uncountable words", () => {
            expect(Str.plural("fish")).toBe("fish");
            expect(Str.plural("sheep")).toBe("sheep");
            expect(Str.plural("deer")).toBe("deer");
        });

        it("matches case of input word", () => {
            expect(Str.plural("DOG")).toBe("DOGS");
            expect(Str.plural("Dog")).toBe("Dogs");
            expect(Str.plural("dog")).toBe("dogs");
        });

        it("returns singular when count is 1", () => {
            expect(Str.plural("apple", 1)).toBe("apple");
            expect(Str.plural("cat", 1)).toBe("cat");
        });

        it("returns singular when count is -1", () => {
            expect(Str.plural("apple", -1)).toBe("apple");
        });

        it("returns plural when count is not 1 or -1", () => {
            expect(Str.plural("apple", 2)).toBe("apples");
            expect(Str.plural("apple", 0)).toBe("apples");
            expect(Str.plural("apple", 5)).toBe("apples");
        });

        it("prepends count when prependCount is true", () => {
            expect(Str.plural("apple", 2, true)).toBe("2 apples");
            expect(Str.plural("apple", 1, true)).toBe("1 apple");
            expect(Str.plural("apple", 0, true)).toBe("0 apples");
        });

        it("returns uncountable word unchanged regardless of count", () => {
            // Test uncountable branch when count is not 1
            expect(Str.plural("fish", 5)).toBe("fish");
            expect(Str.plural("software", 100)).toBe("software");
        });
    });

    describe("singular", () => {
        it("singularizes words", () => {
            expect(Str.singular("dogs")).toBe("dog");
            expect(Str.singular("cats")).toBe("cat");
            expect(Str.singular("children")).toBe("child");
        });

        it("respects uncountable words", () => {
            expect(Str.singular("series")).toBe("series");
            expect(Str.singular("fish")).toBe("fish");
        });

        it("matches case of input word", () => {
            expect(Str.singular("DOGS")).toBe("DOG");
            expect(Str.singular("Dogs")).toBe("Dog");
            expect(Str.singular("dogs")).toBe("dog");
        });
    });

    describe("uncountable", () => {
        it("returns true for uncountable words", () => {
            expect(Str.uncountable("fish")).toBe(true);
            expect(Str.uncountable("sheep")).toBe(true);
            expect(Str.uncountable("deer")).toBe(true);
            expect(Str.uncountable("software")).toBe(true);
        });

        it("returns false for countable words", () => {
            expect(Str.uncountable("cat")).toBe(false);
            expect(Str.uncountable("dog")).toBe(false);
        });

        it("is case-insensitive", () => {
            expect(Str.uncountable("FISH")).toBe(true);
            expect(Str.uncountable("Fish")).toBe(true);
        });
    });

    describe("isPlural", () => {
        it("returns true for plural words", () => {
            expect(Str.isPlural("cars")).toBe(true);
            expect(Str.isPlural("dogs")).toBe(true);
            expect(Str.isPlural("children")).toBe(true);
        });

        it("returns false for singular words", () => {
            expect(Str.isPlural("car")).toBe(false);
            expect(Str.isPlural("dog")).toBe(false);
        });

        it("uses default empty string parameter", () => {
            expect(Str.isPlural()).toBe(true);
        });
    });

    describe("isSingular", () => {
        it("returns true for singular words", () => {
            expect(Str.isSingular("car")).toBe(true);
            expect(Str.isSingular("dog")).toBe(true);
            expect(Str.isSingular("child")).toBe(true);
        });

        it("returns false for plural words", () => {
            expect(Str.isSingular("cars")).toBe(false);
            expect(Str.isSingular("dogs")).toBe(false);
        });

        it("uses default empty string parameter", () => {
            expect(Str.isSingular()).toBe(true);
        });
    });

    describe("matchCase", () => {
        it("returns lowercase when comparison is lowercase", () => {
            expect(Str.matchCase("HELLO", "world")).toBe("hello");
        });

        it("returns uppercase when comparison is uppercase", () => {
            expect(Str.matchCase("hello", "WORLD")).toBe("HELLO");
        });

        it("returns title case when comparison is title case", () => {
            expect(Str.matchCase("hello", "World")).toBe("Hello");
        });

        it("returns value unchanged for mixed case comparison", () => {
            expect(Str.matchCase("hello", "wOrLd")).toBe("hello");
        });

        it("handles empty value string", () => {
            expect(Str.matchCase("", "World")).toBe("");
        });

        it("handles empty comparison string", () => {
            expect(Str.matchCase("hello", "")).toBe("hello");
        });
    });

    describe("inflector", () => {
        it("returns the pluralize instance", () => {
            const inflectorInstance = Str.inflector();
            expect(inflectorInstance).toBeDefined();
            expect(typeof inflectorInstance.plural).toBe("function");
            expect(typeof inflectorInstance.singular).toBe("function");
        });

        it("returns the same instance on subsequent calls", () => {
            const first = Str.inflector();
            const second = Str.inflector();
            expect(first).toBe(second);
        });
    });
});
