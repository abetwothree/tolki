import type { StringableHandlers } from "@tolki/lang";
import { makeReplacements } from "@tolki/lang";
import { describe, expect, it } from "vitest";

class LangMoney {
    constructor(public cents: number) {}

    toString(): string {
        return "$" + this.cents;
    }
}

class LangEuro extends LangMoney {}

class LangOpaque {}

describe("makeReplacements", () => {
    // docs/php-parity/Translator/makeReplacements.json, "replace-case-variants"
    it("replaces :name, :Name and :NAME", () => {
        expect(
            makeReplacements("breeze :0 :Foo :BAR", {
                0: "john",
                foo: "bar",
                bar: "foo",
            }),
        ).toBe("breeze john Bar FOO");
    });

    // docs/php-parity/Translator/makeReplacements.json,
    //   "replace-longest-key-first", "replace-longest-key-first-with-spaces"
    it("replaces the longest key first", () => {
        expect(
            makeReplacements("breeze :foo :foobar", {
                foo: "bar",
                foobar: "taylor",
            }),
        ).toBe("breeze bar taylor");
        expect(
            makeReplacements("breeze :foo :foobar", {
                foo: "foo bar baz",
                foobar: "taylor",
            }),
        ).toBe("breeze foo bar baz taylor");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-adjacent-placeholders"
    it("replaces adjacent placeholders", () => {
        expect(
            makeReplacements("bar :i:c :u", {
                i: "one",
                c: "two",
                u: "three",
            }),
        ).toBe("bar onetwo three");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-is-atomic"
    it("does not replace inside a replacement", () => {
        expect(
            makeReplacements("Hello :foo!", { foo: "baz:bar", bar: "abcdef" }),
        ).toBe("Hello baz:bar!");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-follows-line-order"
    it("follows the order of the line", () => {
        expect(
            makeReplacements(":greeting :name", {
                name: "David",
                greeting: "Greetings",
            }),
        ).toBe("Greetings David");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-list"
    it("replaces from a list", () => {
        expect(makeReplacements(":0 and :1", ["john", "jane"])).toBe(
            "john and jane",
        );
    });

    // docs/php-parity/Translator/makeReplacements.json,
    //   "replace-int", "replace-float", "replace-large-float", "replace-bools", "replace-null-is-empty"
    it("casts a float as PHP does", () => {
        expect(makeReplacements(":n", { n: 5 })).toBe("5");
        expect(makeReplacements(":n", { n: 0.1 + 0.2 })).toBe("0.3");
        expect(makeReplacements(":n", { n: 1e20 })).toBe("1.0E+20");
        expect(makeReplacements(":a|:b", { a: true, b: false })).toBe("1|");
        expect(makeReplacements("foo :message", { message: null })).toBe(
            "foo ",
        );
    });

    // JS-only: undefined stands for PHP's null; docs/php-parity/Translator/makeReplacements.json,
    //   "replace-null-is-empty"
    it("treats undefined like null", () => {
        expect(makeReplacements("foo :message", { message: undefined })).toBe(
            "foo ",
        );
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-case-variants-overwrite"
    it("lets a later case variant overwrite an earlier one", () => {
        expect(
            makeReplacements(":name :Name :NAME", { name: "a", Name: "b" }),
        ).toBe("a b B");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-empty-key"
    it("replaces an empty key", () => {
        expect(makeReplacements("a:b", { "": "X" })).toBe("aXb");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-multibyte-case"
    it("changes the case of multibyte text", () => {
        expect(makeReplacements(":Name :NAME", { name: "élan" })).toBe(
            "Élan ÉLAN",
        );
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-empty-replacements-keep-line"
    it("leaves the line alone without replacements", () => {
        expect(makeReplacements(":name", {})).toBe(":name");
        expect(makeReplacements(":name", [])).toBe(":name");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-stringable-object"
    it("casts an object with its own toString", () => {
        expect(makeReplacements(":a", { a: new LangMoney(5) })).toBe("$5");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-string-backed-enum", "replace-int-backed-enum"
    it("reads an enum case's value", () => {
        expect(
            makeReplacements(":a", {
                a: { name: "February", value: "February" },
            }),
        ).toBe("February");
        expect(
            makeReplacements(":a", { a: { name: "Thirteen", value: 13 } }),
        ).toBe("13");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-array-value-throws", "replace-opaque-object-throws"
    it("throws for a value PHP cannot cast", () => {
        expect(() => makeReplacements(":a", { a: [1] })).toThrow(
            new TypeError(
                "mb_ucfirst(): Argument #1 ($string) must be of type string, array given",
            ),
        );
        expect(() => makeReplacements(":a", { a: new LangOpaque() })).toThrow(
            new TypeError(
                "mb_ucfirst(): Argument #1 ($string) must be of type string, LangOpaque given",
            ),
        );
        // JS-only: a Date stands for PHP's DateTime, which has no __toString.
        expect(() => makeReplacements(":a", { a: new Date(0) })).toThrow(
            TypeError,
        );
    });

    // docs/php-parity/Translator/stringable.json,
    //   "stringable-handler-formats-its-class", "stringable-handler-skips-a-subclass",
    //   "stringable-handler-output-is-cased"
    it("uses a handler for its exact class only", () => {
        const handlers: StringableHandlers = new Map([
            [LangMoney, (m: LangMoney) => "m" + m.cents],
        ]);

        expect(makeReplacements(":a", { a: new LangMoney(5) }, handlers)).toBe(
            "m5",
        );
        expect(makeReplacements(":a", { a: new LangEuro(5) }, handlers)).toBe(
            "$5",
        );
        expect(makeReplacements(":A", { a: new LangMoney(5) }, handlers)).toBe(
            "M5",
        );
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-tag", "replace-tag-repeats"
    it("replaces a tag with its callback's answer", () => {
        expect(
            makeReplacements(
                "We have some nice <docs-link>documentation</docs-link>",
                {
                    "docs-link": (c) =>
                        `<a href="https://laravel.com/docs">${c}</a>`,
                },
            ),
        ).toBe(
            'We have some nice <a href="https://laravel.com/docs">documentation</a>',
        );
        expect(
            makeReplacements(
                "<bold-this>bold</bold-this> something else <bold-this>also bold</bold-this>",
                { "bold-this": (c) => `<b>${c}</b>` },
            ),
        ).toBe("<b>bold</b> something else <b>also bold</b>");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-tag-closure-int"
    it("casts the answer of a tag callback", () => {
        expect(makeReplacements("<b>x</b>", { b: () => 5 })).toBe("5");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-tag-skips-newline"
    it("skips a newline inside a tag", () => {
        expect(makeReplacements("<b>x\ny</b>", { b: (c) => `[${c}]` })).toBe(
            "<b>x\ny</b>",
        );
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-tag-matches-carriage-return"
    it("matches a carriage return inside a tag", () => {
        expect(makeReplacements("<b>x\ry</b>", { b: (c) => `[${c}]` })).toBe(
            "[x\ry]",
        );
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-tag-is-lazy"
    it("matches the shortest tag body", () => {
        expect(
            makeReplacements("<b>a<b>c</b>d</b>", { b: (c) => `[${c}]` }),
        ).toBe("[a<b>c]d</b>");
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-tag-leaves-colon-placeholder"
    it("leaves a colon placeholder of a tag key alone", () => {
        expect(makeReplacements(":b <b>x</b>", { b: (c) => `[${c}]` })).toBe(
            ":b [x]",
        );
    });

    // docs/php-parity/Translator/makeReplacements.json, "replace-tag-output-gets-placeholders"
    it("replaces placeholders in a tag's output", () => {
        expect(
            makeReplacements("<b>x</b>", { b: () => ":name", name: "Ann" }),
        ).toBe("Ann");
    });

    // JS-only: D6, Laravel reads the key as a pattern; docs/php-parity/Translator/makeReplacements.json,
    //   "replace-tag-key-is-a-pattern"
    it("matches a tag key literally", () => {
        expect(
            makeReplacements("<aXb>hi</aXb>", {
                "a.b": (c) => c.toUpperCase(),
            }),
        ).toBe("<aXb>hi</aXb>");
        expect(
            makeReplacements("<a.b>hi</a.b>", {
                "a.b": (c) => c.toUpperCase(),
            }),
        ).toBe("HI");
    });

    // docs/php-parity/Translator/get.json,
    //   "get-group-leaves-cast-with-replacements", "get-group-leaves-keep-type-without-replacements"
    it("casts a line that is not a string", () => {
        expect(
            Reflect.apply(makeReplacements, undefined, [5, { a: "b" }]),
        ).toBe("5");
        expect(Reflect.apply(makeReplacements, undefined, [5, {}])).toBe(5);
    });
});
