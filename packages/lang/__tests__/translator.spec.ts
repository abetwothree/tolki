import type { LangLines } from "@tolki/lang";
import { Translator } from "@tolki/lang";
import { InvalidArgumentException } from "@tolki/utils";
import { describe, expect, it } from "vitest";

class LangMoney {
    constructor(public cents: number) {}

    toString(): string {
        return "$" + this.cents;
    }
}

class LangEuro extends LangMoney {}

const T1 = {
    en: {
        "foo::bar": {
            foo: "foo",
            baz: "breeze :foo",
            qux: {
                0: "tree :foo",
                1: "breeze :foo",
                beep: { rock: "tree :foo" },
            },
        },
    },
};

const T2 = {
    en: {
        Hello: "Hello",
        Empty: "",
        g: { a: "A", same: "g.same" },
    },
    lv: { g: { b: "B" } },
};

/**
 * Build a translator with a fallback locale, as the probes' langTranslator() does.
 *
 * @param lines - The lines, one object per locale
 * @param locale - The default locale
 * @param fallback - The fallback locale
 * @returns The translator
 */
function withFallback<TLines extends LangLines>(
    lines: TLines,
    locale: string,
    fallback: string,
): Translator<TLines> {
    const translator = new Translator(lines, locale);

    translator.setFallback(fallback);

    return translator;
}

describe("Translator", () => {
    describe("hasForLocale", () => {
        // docs/php-parity/Translator/hasForLocale.json, "has-for-locale-ignores-fallback"
        it("ignores the fallback locale", () => {
            expect(withFallback(T2, "en", "lv").hasForLocale("g.b")).toBe(
                false,
            );
        });

        // docs/php-parity/Translator/hasForLocale.json, "has-for-locale-own-line"
        it("finds a line of the locale itself", () => {
            expect(withFallback(T2, "en", "lv").hasForLocale("g.a")).toBe(true);
        });
    });

    describe("has", () => {
        // docs/php-parity/Translator/has.json, "has-group-line"
        it("finds a group line", () => {
            expect(withFallback(T2, "en", "lv").has("g.a")).toBe(true);
        });

        // docs/php-parity/Translator/has.json, "has-missing-key"
        it("misses a missing key", () => {
            expect(withFallback(T2, "en", "lv").has("g.zzz")).toBe(false);
        });

        // docs/php-parity/Translator/has.json, "has-json-line-equal-to-key"
        it("finds a JSON line equal to its key", () => {
            expect(withFallback(T2, "en", "lv").has("Hello")).toBe(true);
        });

        // docs/php-parity/Translator/has.json, "has-json-empty-line"
        it("finds an empty JSON line", () => {
            expect(withFallback(T2, "en", "lv").has("Empty")).toBe(true);
        });

        // docs/php-parity/Translator/has.json, "has-star-group-json-line"
        it("finds a JSON line through the group *", () => {
            expect(
                new Translator({ en: { Hello: "Hola :name" } }, "en").has(
                    "*.Hello",
                ),
            ).toBe(true);
        });

        // docs/php-parity/Translator/has.json, "has-group-line-equal-to-key"
        it("misses a group line equal to its key", () => {
            expect(withFallback(T2, "en", "lv").has("g.same")).toBe(false);
        });

        // docs/php-parity/Translator/has.json, "has-reads-fallback"
        it("reads the fallback locale", () => {
            expect(withFallback(T2, "en", "lv").has("g.b")).toBe(true);
        });

        // docs/php-parity/Translator/has.json, "has-locale-argument"
        it("reads the given locale", () => {
            expect(withFallback(T2, "en", "lv").has("g.b", "lv")).toBe(true);
        });

        // docs/php-parity/Translator/has.json, "has-locale-argument-without-fallback"
        it("reads the given locale without a fallback locale", () => {
            const translator = new Translator({ lv: { g: { b: "B" } } }, "en");

            expect([
                translator.has("g.b", "lv"),
                translator.has("g.b"),
            ]).toEqual([true, false]);
        });

        // docs/php-parity/Translator/has.json, "has-skips-missing-key-handler"
        it("skips the missing-key handler", () => {
            let calls = 0;
            const translator = withFallback(T2, "en", "lv");

            translator.handleMissingKeysUsing(() => {
                calls++;

                return "X";
            });

            expect([translator.has("g.zzz"), calls]).toEqual([false, 0]);
        });

        // docs/php-parity/Translator/has.json, "has-restores-missing-key-handler"
        it("turns the missing-key handler back on", () => {
            let calls = 0;
            const translator = withFallback(T2, "en", "lv");

            translator.handleMissingKeysUsing(() => {
                calls++;

                return "X";
            });

            expect([
                translator.has("g.zzz"),
                translator.get("nope"),
                calls,
            ]).toEqual([false, "X", 1]);
        });
    });

    describe("get", () => {
        // docs/php-parity/Translator/get.json, "get-namespaced-list-item"
        it("reads a nested item of a namespaced group", () => {
            expect(
                new Translator(T1, "en").get("foo::bar.qux", { foo: "bar" }),
            ).toEqual({
                0: "tree bar",
                1: "breeze bar",
                beep: { rock: "tree bar" },
            });
        });

        // docs/php-parity/Translator/get.json, "get-namespaced-line"
        it("reads a namespaced line", () => {
            expect(
                new Translator(T1, "en").get("foo::bar.baz", { foo: "bar" }),
            ).toBe("breeze bar");
        });

        // docs/php-parity/Translator/get.json, "get-namespaced-line-without-replacements"
        it("reads a namespaced line without replacements", () => {
            expect(new Translator(T1, "en").get("foo::bar.foo")).toBe("foo");
        });

        // docs/php-parity/Translator/get.json, "get-whole-group-walks-replacements"
        it("replaces placeholders through a whole group", () => {
            expect(
                new Translator(T1, "en").get("foo::bar", { foo: "bar" }),
            ).toEqual({
                foo: "foo",
                baz: "breeze bar",
                qux: {
                    0: "tree bar",
                    1: "breeze bar",
                    beep: { rock: "tree bar" },
                },
            });
        });

        // docs/php-parity/Translator/get.json, "get-missing-namespaced-group-returns-key"
        it("answers the key for a missing namespaced group", () => {
            expect(
                new Translator(T1, "en").get("foo::unknown", { foo: "bar" }),
            ).toBe("foo::unknown");
        });

        // docs/php-parity/Translator/get.json, "get-missing-namespaced-item-returns-key"
        it("answers the key for a missing namespaced item", () => {
            expect(new Translator(T1, "en").get("foo::bar.unknown")).toBe(
                "foo::bar.unknown",
            );
        });

        // docs/php-parity/Translator/get.json, "get-keeps-html"
        it("keeps HTML in a line", () => {
            expect(
                new Translator(
                    { en: { foo: { bar: "breeze <p>test</p>" } } },
                    "en",
                ).get("foo.bar"),
            ).toBe("breeze <p>test</p>");
        });

        // docs/php-parity/Translator/get.json, "get-group-reads-fallback-locale"
        it("reads a group of the fallback locale", () => {
            expect(
                withFallback(
                    { lv: { "foo::bar": { baz: "breeze :foo" } } },
                    "en",
                    "lv",
                ).get("foo::bar.baz", { foo: "bar" }),
            ).toBe("breeze bar");
        });

        // docs/php-parity/Translator/get.json, "get-global-group-line"
        it("reads a line of a group without a namespace", () => {
            expect(
                new Translator(
                    { en: { foo: { bar: "breeze :foo" } } },
                    "en",
                ).get("foo.bar", { foo: "bar" }),
            ).toBe("breeze bar");
        });

        // docs/php-parity/Translator/get.json, "get-json-line"
        it("reads a JSON line", () => {
            expect(
                new Translator({ en: { foo: "one" } }, "en").get("foo"),
            ).toBe("one");
        });

        // docs/php-parity/Translator/get.json, "get-json-line-replaces"
        it("replaces placeholders in a JSON line", () => {
            expect(
                new Translator({ en: { Hello: "Hola :name" } }, "en").get(
                    "Hello",
                    { name: "Ann" },
                ),
            ).toBe("Hola Ann");
        });

        // docs/php-parity/Translator/get.json, "get-json-miss-reads-group"
        it("reads a group when no JSON line matches", () => {
            expect(
                new Translator({ en: { foo: { bar: "one" } } }, "en").get(
                    "foo.bar",
                ),
            ).toBe("one");
        });

        // docs/php-parity/Translator/get.json, "get-json-miss-reads-group-and-replaces"
        it("replaces placeholders in a group line read after a JSON miss", () => {
            expect(
                new Translator(
                    { en: { foo: { bar: "one :message" } } },
                    "en",
                ).get("foo.bar", { message: "two" }),
            ).toBe("one two");
        });

        // docs/php-parity/Translator/get.json, "get-missing-returns-key"
        it("answers the key when no line matches", () => {
            expect(new Translator({}, "en").get("Foo that bar")).toBe(
                "Foo that bar",
            );
        });

        // docs/php-parity/Translator/get.json, "get-missing-returns-key-and-replaces"
        it("replaces placeholders in a key with no line", () => {
            expect(
                new Translator({}, "en").get("foo :message", {
                    message: "baz",
                }),
            ).toBe("foo baz");
        });

        // docs/php-parity/Translator/get.json, "get-json-empty-line-returns-key"
        it("answers the key for an empty JSON line", () => {
            expect(new Translator({ en: { Hi: "" } }, "en").get("Hi")).toBe(
                "Hi",
            );
        });

        // docs/php-parity/Translator/get.json, "get-json-zero-line-returns-key"
        it("answers the key for a JSON line of 0", () => {
            expect(new Translator({ en: { Hi: "0" } }, "en").get("Hi")).toBe(
                "Hi",
            );
        });

        // docs/php-parity/Translator/get.json, "get-json-null-line-returns-key"
        it("answers the key for a null JSON line", () => {
            const translator: Translator = Reflect.construct(Translator, [
                { en: { Hi: null } },
                "en",
            ]);

            expect(translator.get("Hi")).toBe("Hi");
        });

        // docs/php-parity/Translator/get.json, "get-json-number-line"
        it("answers a JSON line that is a number unchanged", () => {
            const translator: Translator = Reflect.construct(Translator, [
                { en: { Hi: 5 } },
                "en",
            ]);

            expect(translator.get("Hi")).toBe(5);
        });

        // docs/php-parity/Translator/get.json, "get-group-number-leaf-returns-key"
        it("answers the key for a group item that is a number", () => {
            const translator: Translator = Reflect.construct(Translator, [
                { en: { g: { n: 5 } } },
                "en",
            ]);

            expect(translator.get("g.n")).toBe("g.n");
        });

        // docs/php-parity/Translator/get.json, "get-json-ignores-fallback"
        it("reads JSON lines of the current locale only", () => {
            expect(
                withFallback({ es: { Hi: "Hola" } }, "en", "es").get("Hi"),
            ).toBe("Hi");
        });

        // docs/php-parity/Translator/get.json, "get-group-leaves-keep-type-without-replacements"
        it("keeps the leaves of a group without replacements", () => {
            const translator: Translator = Reflect.construct(Translator, [
                { en: { g: { n: 5, s: ":x" } } },
                "en",
            ]);

            expect(translator.get("g")).toEqual({ n: 5, s: ":x" });
        });

        // docs/php-parity/Translator/get.json, "get-group-leaves-cast-with-replacements"
        it("casts the leaves of a group with replacements", () => {
            const translator: Translator = Reflect.construct(Translator, [
                { en: { g: { n: 5, s: ":x" } } },
                "en",
            ]);

            expect(translator.get("g", { x: "y" })).toEqual({ n: "5", s: "y" });
        });

        // docs/php-parity/Translator/get.json, "get-group-null-leaf-with-replacements"
        it("casts a null leaf to an empty string with replacements", () => {
            const translator: Translator = Reflect.construct(Translator, [
                { en: { g: { n: null, s: ":x" } } },
                "en",
            ]);

            expect(translator.get("g", { x: "y" })).toEqual({ n: "", s: "y" });
        });

        // docs/php-parity/Translator/get.json, "get-empty-group-returns-key"
        it("answers the key for an empty group", () => {
            expect(new Translator({ en: { g: [] } }, "en").get("g")).toBe("g");
        });

        // docs/php-parity/Translator/get.json, "get-dotted-key-inside-group"
        it("reads a dotted key inside a group", () => {
            expect(
                new Translator({ en: { g: { "a.b": "flat" } } }, "en").get(
                    "g.a.b",
                ),
            ).toBe("flat");
        });

        // docs/php-parity/Translator/get.json, "get-list-group-index"
        it("reads a list group by index", () => {
            expect(
                new Translator({ en: { g: ["a", "b"] } }, "en").get("g.1"),
            ).toBe("b");
        });

        // docs/php-parity/Translator/get.json, "get-locale-zero-uses-default"
        it("reads the current locale for a locale of 0", () => {
            expect(
                new Translator({ en: { g: { a: "A" } } }, "en").get(
                    "g.a",
                    {},
                    "0",
                ),
            ).toBe("A");
        });

        // docs/php-parity/Translator/get.json, "get-locale-argument"
        it("reads the given locale", () => {
            expect(
                new Translator({ es: { g: { a: "A-es" } } }, "en").get(
                    "g.a",
                    {},
                    "es",
                ),
            ).toBe("A-es");
        });

        // docs/php-parity/Translator/get.json, "get-without-fallback"
        it("skips the fallback locale when told to", () => {
            expect(
                withFallback({ lv: { g: { a: "A" } } }, "en", "lv").get(
                    "g.a",
                    {},
                    null,
                    false,
                ),
            ).toBe("g.a");
        });

        // docs/php-parity/Translator/get.json, "get-extra-namespace-separator"
        it("answers the key for a second namespace separator", () => {
            expect(new Translator({}, "en").get("a::b::c.d")).toBe("a::b::c.d");
        });

        // docs/php-parity/Translator/get.json, "get-json-line-is-not-a-group"
        it("does not read a JSON line as a group", () => {
            expect(
                new Translator({ en: { messages: "Messages" } }, "en").get(
                    "messages.welcome",
                ),
            ).toBe("messages.welcome");
        });

        // docs/php-parity/Translator/get.json, "get-star-group-reads-json-lines"
        it("reads a JSON line through the group *", () => {
            expect(
                new Translator({ en: { Hello: "Hola :name" } }, "en").get(
                    "*.Hello",
                    { name: "Ann" },
                ),
            ).toBe("Hola Ann");
        });

        // docs/php-parity/Translator/get.json, "get-star-alone-returns-json-lines"
        it("answers the JSON lines for the group * alone", () => {
            expect(
                new Translator({ en: { Hello: "Hola :name" } }, "en").get("*"),
            ).toEqual({ Hello: "Hola :name" });
        });
    });

    describe("string", () => {
        // docs/php-parity/Translator/string.json, "string-returns-line"
        it("answers a line", () => {
            expect(
                new Translator(T1, "en").string("foo::bar.baz", { foo: "bar" }),
            ).toBe("breeze bar");
        });

        // docs/php-parity/Translator/string.json, "string-throws-for-group"
        it("throws for a group", () => {
            expect(() =>
                new Translator(T1, "en").string("foo::bar.qux"),
            ).toThrow(
                new InvalidArgumentException(
                    "Translation value for key [foo::bar.qux] must be a string, array given.",
                ),
            );
        });

        // docs/php-parity/Translator/string.json, "string-returns-missing-key"
        it("answers a missing key", () => {
            expect(new Translator(T1, "en").string("nope")).toBe("nope");
        });
    });

    describe("array", () => {
        // docs/php-parity/Translator/array.json, "array-returns-group"
        it("answers a group", () => {
            expect(
                new Translator(
                    { en: { "foo::bar": { baz: ["breeze :foo"] } } },
                    "en",
                ).array("foo::bar.baz", { foo: "bar" }),
            ).toEqual(["breeze bar"]);
        });

        // docs/php-parity/Translator/array.json, "array-throws-for-line"
        it("throws for a line", () => {
            expect(() =>
                new Translator(T1, "en").array("foo::bar.baz"),
            ).toThrow(
                new InvalidArgumentException(
                    "Translation value for key [foo::bar.baz] must be an array, string given.",
                ),
            );
        });

        // docs/php-parity/Translator/array.json, "array-throws-for-missing-key"
        it("throws for a missing key", () => {
            expect(() => new Translator({}, "en").array("g.a")).toThrow(
                new InvalidArgumentException(
                    "Translation value for key [g.a] must be an array, string given.",
                ),
            );
        });

        // docs/php-parity/Translator/array.json, "array-throws-for-json-number"
        it("throws for a JSON line that is a number", () => {
            const translator: Translator = Reflect.construct(Translator, [
                { en: { n: 5 } },
                "en",
            ]);

            expect(() => translator.array("n")).toThrow(
                new InvalidArgumentException(
                    "Translation value for key [n] must be an array, integer given.",
                ),
            );
        });
    });

    describe("choice", () => {
        const T3 = {
            en: {
                apples: "{0} none|{1} one|[2,*] :count apples",
                ":count foos": "{1} :count foos|[2,*] :count foos",
                files: "file|files",
            },
            ru: { files: "файл|файла|файлов" },
        };

        // docs/php-parity/Translator/choice.json, "choice-fills-count"
        it("fills the count", () => {
            expect(new Translator(T3, "en").choice("apples", 3)).toBe(
                "3 apples",
            );
        });

        // docs/php-parity/Translator/choice.json, "choice-exact-one"
        it("picks an exact form", () => {
            expect(new Translator(T3, "en").choice("apples", 1)).toBe("one");
        });

        // docs/php-parity/Translator/choice.json, "choice-custom-count"
        it("keeps a custom count", () => {
            expect(
                new Translator(T3, "en").choice(":count foos", 1234, {
                    count: "1,234",
                }),
            ).toBe("1,234 foos");
        });

        // docs/php-parity/Translator/choice.json, "choice-counts-list"
        it("counts a list", () => {
            expect(
                new Translator(T3, "en").choice("apples", ["a", "b", "c"]),
            ).toBe("3 apples");
        });

        // docs/php-parity/Translator/choice.json, "choice-counts-assoc-array"
        it("counts an object's keys", () => {
            expect(
                new Translator(T3, "en").choice("apples", { a: 1, b: 2 }),
            ).toBe("2 apples");
        });

        // docs/php-parity/Translator/choice.json, "choice-counts-collection"
        // JS-only: a Countable stand-in for the collection, which is an object with count().
        it("counts an object with a count method", () => {
            expect(
                new Translator(T3, "en").choice("apples", { count: () => 3 }),
            ).toBe("3 apples");
        });

        // JS-only: PHP has no Map or Set; their size is the count.
        it("counts a Map and a Set", () => {
            const translator = new Translator(T3, "en");

            expect(translator.choice("apples", new Map([["a", 1]]))).toBe(
                "one",
            );
            expect(translator.choice("apples", new Set([1, 2]))).toBe(
                "2 apples",
            );
        });

        // docs/php-parity/Translator/choice.json, "choice-float"
        it("picks index 1 untrimmed for a float no range matches", () => {
            expect(new Translator(T3, "en").choice("apples", 1.2)).toBe(" one");
        });

        // docs/php-parity/Translator/choice.json, "choice-null-count-is-filled"
        it("fills a null count", () => {
            expect(
                new Translator(T3, "en").choice("apples", 3, { count: null }),
            ).toBe("3 apples");
        });

        // docs/php-parity/Translator/choice.json, "choice-null-count-is-filled"
        it("fills an undefined count", () => {
            expect(
                new Translator(T3, "en").choice("apples", 3, {
                    count: undefined,
                }),
            ).toBe("3 apples");
        });

        // docs/php-parity/Translator/choice.json, "choice-list-replace-gains-count"
        it("adds the count to a list of replacements", () => {
            expect(new Translator({}, "en").choice(":0 :count", 2, ["z"])).toBe(
                "z 2",
            );
        });

        // docs/php-parity/Translator/choice.json, "choice-uses-fallback-locale-rule"
        it("uses the fallback locale's rule", () => {
            expect(withFallback(T3, "cs", "en").choice("files", 5)).toBe(
                "files",
            );
        });

        // docs/php-parity/Translator/choice.json, "choice-with-fallback-uses-its-rule"
        it("uses the fallback locale's rule on a missing key", () => {
            expect(withFallback({}, "en", "en").choice("item|items", 5)).toBe(
                "items",
            );
        });

        // docs/php-parity/Translator/choice.json, "choice-uses-own-locale-rule"
        it("uses the locale's own rule", () => {
            expect(withFallback(T3, "ru", "en").choice("files", 5)).toBe(
                "файлов",
            );
        });

        // docs/php-parity/Translator/choice.json, "choice-locale-argument"
        it("takes the locale argument", () => {
            expect(
                withFallback(T3, "en", "en").choice("files", 5, [], "ru"),
            ).toBe("файлов");
        });

        // docs/php-parity/Translator/choice.json, "choice-without-fallback-uses-first-form"
        it("uses the first form when no fallback is set", () => {
            expect(new Translator({}, "en").choice("item|items", 5)).toBe(
                "item",
            );
        });

        // JS-only: PHP throws a TypeError handing a group to the selector; here the group is rejected up front.
        it("throws for a key that names a group", () => {
            expect(() => new Translator(T2, "en").choice("g", 2)).toThrow(
                InvalidArgumentException,
            );
        });
    });

    describe("addLines", () => {
        // docs/php-parity/Translator/addLines.json, "add-lines-group-item"
        it("adds an item to a group", () => {
            const translator = new Translator({ en: { g: { b: "B" } } }, "en");

            translator.addLines({ "g.a": "A" }, "en");

            expect(translator.get("g.a")).toBe("A");
        });

        // No loader exists, so the given lines count as loaded and Laravel's unloaded-group case cannot arise.
        // docs/php-parity/Translator/addLines.json, "add-lines-merges-into-a-loaded-group"
        it("merges into a group", () => {
            const translator = new Translator({ en: { g: { b: "B" } } }, "en");

            translator.get("g.b");
            translator.addLines({ "g.a": "A" }, "en");

            expect(translator.get("g")).toEqual({ b: "B", a: "A" });
        });

        // docs/php-parity/Translator/addLines.json, "add-lines-nested-item"
        it("adds a nested item", () => {
            const translator = new Translator({ en: { g: { b: "B" } } }, "en");

            translator.addLines({ "g.x.y": "deep" }, "en");

            expect(translator.get("g.x.y")).toBe("deep");
        });

        // docs/php-parity/Translator/addLines.json, "add-lines-key-without-dot"
        it("adds a key without a dot as an empty item", () => {
            const translator = new Translator({ en: { g: { b: "B" } } }, "en");

            translator.addLines({ nodot: "v" }, "en");

            expect(translator.get("nodot")).toEqual({ "": "v" });
        });

        // docs/php-parity/Translator/addLines.json, "add-lines-key-without-dot-reads-empty-item"
        it("reads the empty item of a key without a dot", () => {
            const translator = new Translator({ en: { g: { b: "B" } } }, "en");

            translator.addLines({ nodot: "v" }, "en");

            expect(translator.get("nodot.")).toBe("v");
        });

        // docs/php-parity/Translator/addLines.json, "add-lines-json-group"
        it("adds a JSON line for the group *", () => {
            const translator = new Translator({ en: { g: { b: "B" } } }, "en");

            translator.addLines({ "*.Hello": "Hola" }, "en");

            expect(translator.get("Hello")).toBe("Hola");
        });

        // JS-only: D10, one JSON line keeps the dots Laravel splits on;
        //   docs/php-parity/Translator/addLines.json, "add-lines-json-dotted-key"
        it("adds a dotted JSON line as one line", () => {
            const translator = new Translator({ en: { g: { b: "B" } } }, "en");

            translator.addLines({ "*.x.y": "xy" }, "en");

            expect(translator.get("x.y")).toBe("xy");
        });

        // docs/php-parity/Translator/addLines.json, "add-lines-json-group-reads-back-through-star"
        it("reads an added JSON line back through the group *", () => {
            const translator = new Translator({ en: { g: { b: "B" } } }, "en");

            translator.addLines({ "*.Bye": "Adios" }, "en");

            expect(translator.get("*.Bye")).toBe("Adios");
        });

        // docs/php-parity/Translator/addLines.json, "add-lines-namespace"
        it("adds lines to a namespace", () => {
            const translator = new Translator({ en: { g: { b: "B" } } }, "en");

            translator.addLines({ "g.a": "A" }, "en", "courier");

            expect(translator.get("courier::g.a")).toBe("A");
        });

        // docs/php-parity/Translator/addLines.json, "add-lines-json-group-in-a-namespace"
        it("adds the group * of a namespace as a group", () => {
            const translator = new Translator({ en: { g: { b: "B" } } }, "en");

            translator.addLines({ "*.Hello": "Hola" }, "en", "courier");

            expect([
                translator.get("Hello"),
                translator.get("courier::*.Hello"),
            ]).toEqual(["Hello", "Hola"]);
        });
    });

    describe("handleMissingKeysUsing", () => {
        // docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-receives-arguments"
        it("passes the key, replacements, locale and fallback", () => {
            let seen: unknown[] = [];
            const translator = new Translator({}, "en");

            translator.handleMissingKeysUsing((...args) => {
                seen = args;

                return null;
            });
            translator.get("nope", { x: "1" });

            expect(seen).toEqual(["nope", { x: "1" }, "en", true]);
        });

        // docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-result-is-replaced"
        it("replaces placeholders in the handler's answer", () => {
            expect(
                new Translator({}, "en")
                    .handleMissingKeysUsing(() => "Missing :x")
                    .get("nope", { x: "1" }),
            ).toBe("Missing 1");
        });

        // docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-null-keeps-key"
        it("keeps the key when the handler answers null", () => {
            expect(
                new Translator({}, "en")
                    .handleMissingKeysUsing(() => null)
                    .get("nope"),
            ).toBe("nope");
        });

        // docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-not-recursive"
        it("does not call the handler from inside itself", () => {
            const translator = new Translator({}, "en");

            translator.handleMissingKeysUsing(
                () => translator.get("other") as string,
            );

            expect(translator.get("nope")).toBe("other");
        });

        // docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-skipped-for-a-found-line"
        it("skips the handler for a found line", () => {
            let calls = 0;
            const translator = new Translator({ en: { g: { a: "A" } } }, "en");

            translator.handleMissingKeysUsing(() => {
                calls++;

                return null;
            });
            translator.get("g.a");

            expect(calls).toBe(0);
        });

        // docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-returns-translator"
        it("answers the translator", () => {
            const translator = new Translator({}, "en");

            expect(translator.handleMissingKeysUsing(null)).toBe(translator);
        });

        // D7: PHP turns handling back on without `finally`, so a handler that throws leaves it off.
        // docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-throw-disables-it"
        it("stays off after a handler throws", () => {
            const translator = new Translator({}, "en");

            translator.handleMissingKeysUsing(() => {
                throw new Error("boom");
            });

            expect(() => translator.get("a")).toThrow("boom");

            translator.handleMissingKeysUsing(() => "second");

            expect(translator.get("b")).toBe("b");
        });

        // docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-runs-for-each-missing-key"
        it("runs the handler for each missing key", () => {
            let calls = 0;
            const translator = new Translator({}, "en");

            translator.handleMissingKeysUsing(() => {
                calls++;

                return "X";
            });

            expect([translator.get("a"), translator.get("b"), calls]).toEqual([
                "X",
                "X",
                2,
            ]);
        });
    });

    describe("parseKey", () => {
        // docs/php-parity/Translator/parseKey.json, "parse-key-group-item"
        it("parses a group and an item", () => {
            expect(new Translator({}, "en").parseKey("g.a")).toEqual([
                "*",
                "g",
                "a",
            ]);
        });

        // docs/php-parity/Translator/parseKey.json, "parse-key-group-only"
        it("parses a group alone", () => {
            expect(new Translator({}, "en").parseKey("g")).toEqual([
                "*",
                "g",
                null,
            ]);
        });

        // docs/php-parity/Translator/parseKey.json, "parse-key-nested-item"
        it("keeps the dots of a nested item", () => {
            expect(new Translator({}, "en").parseKey("g.a.b")).toEqual([
                "*",
                "g",
                "a.b",
            ]);
        });

        // docs/php-parity/Translator/parseKey.json, "parse-key-namespaced"
        it("parses a namespace", () => {
            expect(new Translator({}, "en").parseKey("ns::g.a")).toEqual([
                "ns",
                "g",
                "a",
            ]);
        });

        // docs/php-parity/Translator/parseKey.json, "parse-key-namespaced-group-only"
        it("parses a namespaced group alone", () => {
            expect(new Translator({}, "en").parseKey("ns::g")).toEqual([
                "ns",
                "g",
                null,
            ]);
        });

        // docs/php-parity/Translator/parseKey.json, "parse-key-extra-separator"
        it("drops what follows a second namespace separator", () => {
            expect(new Translator({}, "en").parseKey("a::b::c.d")).toEqual([
                "a",
                "b",
                null,
            ]);
        });

        // docs/php-parity/Translator/parseKey.json, "parse-key-leading-dot"
        it("parses a leading dot as an empty group", () => {
            expect(new Translator({}, "en").parseKey(".a")).toEqual([
                "*",
                "",
                "a",
            ]);
        });

        // docs/php-parity/Translator/parseKey.json, "parse-key-empty"
        it("parses an empty key", () => {
            expect(new Translator({}, "en").parseKey("")).toEqual([
                "*",
                "",
                null,
            ]);
        });

        // docs/php-parity/Translator/parseKey.json, "parse-key-trailing-separator"
        it("parses a trailing namespace separator", () => {
            expect(new Translator({}, "en").parseKey("a::")).toEqual([
                "a",
                "",
                null,
            ]);
        });
    });

    describe("determineLocalesUsing", () => {
        // docs/php-parity/Translator/determineLocalesUsing.json, "determine-locales-receives-locales"
        it("passes the locales to the resolver", () => {
            let seen: string[] = [];
            const translator = new Translator({}, "en");

            translator.determineLocalesUsing((locales) => {
                seen = locales;

                return locales;
            });
            translator.get("g.a");

            expect(seen).toEqual(["en"]);
        });

        // docs/php-parity/Translator/determineLocalesUsing.json, "determine-locales-receives-duplicates"
        it("passes duplicate locales to the resolver", () => {
            let seen: string[] = [];
            const translator = withFallback({}, "en", "en");

            translator.determineLocalesUsing((locales) => {
                seen = locales;

                return locales;
            });
            translator.get("g.a");

            expect(seen).toEqual(["en", "en"]);
        });

        // docs/php-parity/Translator/determineLocalesUsing.json, "determine-locales-adds-locale"
        it("reads the locales the resolver answers", () => {
            const translator = new Translator({ fr: { g: { a: "fr" } } }, "en");

            translator.determineLocalesUsing(() => ["en", "fr", "en"]);

            expect(translator.get("g.a")).toBe("fr");
        });
    });

    describe("locale", () => {
        // docs/php-parity/Translator/getLocale.json, "locale-alias-reads-current"
        it("answers the current locale", () => {
            expect(new Translator({}, "en").locale()).toBe("en");
        });
    });

    describe("getLocale", () => {
        // docs/php-parity/Translator/getLocale.json, "get-locale-reads-current"
        it("answers the current locale", () => {
            expect(new Translator({}, "en").getLocale()).toBe("en");
        });
    });

    describe("setLocale", () => {
        const invalid = new InvalidArgumentException(
            "Invalid characters present in locale.",
        );

        // docs/php-parity/Translator/setLocale.json, "set-locale-rejects-parent-path"
        it("rejects a parent path", () => {
            expect(() =>
                new Translator({}, "en").setLocale("../secret"),
            ).toThrow(invalid);
        });

        // docs/php-parity/Translator/setLocale.json, "set-locale-rejects-backslash"
        it("rejects a backslash", () => {
            expect(() =>
                new Translator({}, "en").setLocale("..\\secret"),
            ).toThrow(invalid);
        });

        // docs/php-parity/Translator/setLocale.json, "set-locale-rejects-lone-backslash"
        it("rejects a lone backslash", () => {
            expect(() => new Translator({}, "en").setLocale("en\\US")).toThrow(
                invalid,
            );
        });

        // docs/php-parity/Translator/setLocale.json, "set-locale-rejects-dots"
        it("rejects two dots", () => {
            expect(() => new Translator({}, "en").setLocale("..")).toThrow(
                invalid,
            );
        });

        // docs/php-parity/Translator/setLocale.json, "set-locale-rejects-nul"
        it("rejects a NUL byte", () => {
            expect(() => new Translator({}, "en").setLocale("en\0")).toThrow(
                invalid,
            );
        });

        // docs/php-parity/Translator/setLocale.json, "set-locale-rejects-slash"
        it("rejects a slash", () => {
            expect(() => new Translator({}, "en").setLocale("en/US")).toThrow(
                invalid,
            );
        });

        // docs/php-parity/Translator/setLocale.json, "set-locale-keeps-previous-locale"
        it("keeps the previous locale after a rejection", () => {
            const translator = new Translator({}, "en");

            for (const locale of [
                "../secret",
                "..\\secret",
                "..",
                "en\0",
                "en/US",
            ]) {
                expect(() => translator.setLocale(locale)).toThrow(invalid);
            }

            expect(translator.getLocale()).toBe("en");
        });

        // docs/php-parity/Translator/setLocale.json, "set-locale-accepts-region"
        it("accepts a locale with a region", () => {
            const translator = new Translator({}, "en");

            translator.setLocale("en_US");

            expect(translator.getLocale()).toBe("en_US");
        });
    });

    describe("getFallback", () => {
        // docs/php-parity/Translator/getFallback.json, "fallback-starts-null"
        it("starts without a fallback locale", () => {
            expect(new Translator({}, "en").getFallback()).toBeNull();
        });

        // docs/php-parity/Translator/getFallback.json, "fallback-is-set"
        it("answers the fallback locale that was set", () => {
            expect(withFallback({}, "en", "en").getFallback()).toBe("en");
        });
    });

    describe("setLoaded", () => {
        // The lines take the constructor's shape, which stands for Laravel's namespace, group and locale nesting.
        // docs/php-parity/Translator/setLoaded.json, "set-loaded-replaces-lines"
        it("replaces the lines", () => {
            const translator = new Translator(
                { en: { g: { a: "old" } } },
                "en",
            );

            translator.setLoaded({ en: { g: { a: "new" } } });

            expect(translator.get("g.a")).toBe("new");
        });
    });

    describe("stringable", () => {
        // docs/php-parity/Translator/stringable.json, "stringable-handler-formats-its-class"
        it("formats an instance of its class", () => {
            const translator = new Translator({}, "en");

            translator.stringable(LangMoney, (m) => "m" + m.cents);

            expect(translator.get(":a", { a: new LangMoney(5) })).toBe("m5");
        });

        // docs/php-parity/Translator/stringable.json, "stringable-handler-skips-a-subclass"
        it("skips an instance of a subclass", () => {
            const translator = new Translator({}, "en");

            translator.stringable(LangMoney, (m) => "m" + m.cents);

            expect(translator.get(":a", { a: new LangEuro(5) })).toBe("$5");
        });

        // docs/php-parity/Translator/stringable.json, "stringable-handler-output-is-cased"
        it("changes the case of the handler's answer", () => {
            const translator = new Translator({}, "en");

            translator.stringable(LangMoney, (m) => "m" + m.cents);

            expect(translator.get(":A", { a: new LangMoney(5) })).toBe("M5");
        });
    });

    // JS-only: a lines object read through the prototype would answer a function for "constructor".
    it("reads only own keys", () => {
        const translator = new Translator({ en: { g: { a: "A" } } }, "en");

        expect(translator.get("constructor")).toBe("constructor");
        expect(translator.get("toString")).toBe("toString");
        expect(translator.get("g.constructor")).toBe("g.constructor");
        expect(translator.get("g.a", {}, "constructor")).toBe("g.a");

        translator.addLines({ "__proto__.polluted": "yes" }, "en");

        expect(translator.get("__proto__.polluted")).toBe("yes");
        expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    });

    // JS-only: PHP copies arrays on assignment; a JS object is shared unless copied.
    it("never changes the lines it was given", () => {
        const lines = { en: { g: { a: "A", list: ["x"] } } };
        const snapshot = structuredClone(lines);
        const translator = new Translator(lines, "en");
        const group = translator.get("g") as { a: string; list: string[] };

        group.a = "changed";
        group.list.push("y");
        translator.addLines({ "g.b": "B", "h.c": "C" }, "en");

        expect(lines).toEqual(snapshot);
        expect(translator.get("g.a")).toBe("A");
    });
});
