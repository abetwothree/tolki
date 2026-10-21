import type {
    LangGroup,
    LangLines,
    LangValue,
    LocaleLines,
    TranslationHelpers,
    TranslationKey,
    TranslationResult,
    TranslationValue,
} from "@tolki/lang";
import { createHelpers, Translator } from "@tolki/lang";
import { describe, expectTypeOf, it } from "vitest";

const lines = {
    en: {
        Hello: "Hello",
        messages: { welcome: "Welcome, :name", nested: { deep: "x" } },
        "courier::mail": { sent: "Sent" },
    },
    es: { messages: { bye: "Adiós" } },
};
const translator = new Translator(lines, "en");

/** A key known only by its pattern, as a template literal expression is typed. */
declare const messagesKey: `messages.${string}`;

/** A key or nothing, which no single overload row accepts. */
declare const maybeKey: "messages.welcome" | null;

describe("Translator types", () => {
    it("answers a string for a line", () => {
        expectTypeOf(translator.get("Hello")).toEqualTypeOf<string>();
        expectTypeOf(
            translator.get("messages.welcome"),
        ).toEqualTypeOf<string>();
        expectTypeOf(
            translator.get("courier::mail.sent"),
        ).toEqualTypeOf<string>();
    });

    it("answers the group for a group key", () => {
        expectTypeOf(translator.get("messages.nested")).toEqualTypeOf<{
            deep: string;
        }>();
        expectTypeOf(translator.get("messages")).toEqualTypeOf<
            { welcome: string; nested: { deep: string } } | { bye: string }
        >();
        expectTypeOf(translator.array("messages.nested")).toEqualTypeOf<{
            deep: string;
        }>();
    });

    it("answers a string for an unknown key", () => {
        expectTypeOf(translator.get("missing.key")).toEqualTypeOf<string>();
    });

    it("answers either for untyped lines", () => {
        const wide = new Translator({} as LangLines, "en");

        expectTypeOf(wide.get("anything")).toEqualTypeOf<TranslationValue>();
        expectTypeOf(wide.array("anything")).toEqualTypeOf<LangGroup>();
    });

    it("types the helpers", () => {
        const { __, trans, transChoice } = createHelpers(translator);

        expectTypeOf(__(null)).toEqualTypeOf<null>();
        expectTypeOf(__("messages.welcome")).toEqualTypeOf<string>();
        expectTypeOf(trans()).toEqualTypeOf<Translator<typeof lines>>();
        expectTypeOf(
            transChoice("messages.welcome", 3),
        ).toEqualTypeOf<string>();
    });
});

describe("TranslationKey", () => {
    it("lists every JSON line and group path of every locale", () => {
        expectTypeOf<TranslationKey<typeof lines>>().toEqualTypeOf<
            | "Hello"
            | "messages"
            | "messages.welcome"
            | "messages.nested"
            | "messages.nested.deep"
            | "messages.bye"
            | "courier::mail"
            | "courier::mail.sent"
        >();
    });

    it("stops 4 levels below the group", () => {
        type Deep = { en: { g: { a: { b: { c: { d: { e: string } } } } } } };

        expectTypeOf<"g.a.b.c.d">().toExtend<TranslationKey<Deep>>();
        expectTypeOf<"g.a.b.c.d.e">().not.toExtend<TranslationKey<Deep>>();
    });

    it("lists a list's items by index", () => {
        type Listed = { en: { g: { list: string[] } } };

        expectTypeOf<"g.list.0">().toExtend<TranslationKey<Listed>>();
    });

    it("is any string for untyped lines", () => {
        expectTypeOf<TranslationKey<LangLines>>().toEqualTypeOf<string>();
    });
});

describe("TranslationResult", () => {
    it("answers either for a key typed string", () => {
        expectTypeOf<
            TranslationResult<typeof lines, string>
        >().toEqualTypeOf<TranslationValue>();
    });

    it("answers either when any locale is untyped", () => {
        type Mixed = { en: { g: { a: string } }; es: LocaleLines };

        expectTypeOf<
            TranslationResult<Mixed, "g.a">
        >().toEqualTypeOf<TranslationValue>();
    });

    it("answers each member of a union of keys", () => {
        expectTypeOf<
            TranslationResult<typeof lines, "Hello" | "messages.nested">
        >().toEqualTypeOf<string | { deep: string }>();
    });

    it("answers every known key a pattern matches", () => {
        expectTypeOf(translator.get(messagesKey)).toEqualTypeOf<
            string | { deep: string }
        >();
    });

    it("answers the JSON lines as a group for the * group", () => {
        expectTypeOf(translator.get("*")).toEqualTypeOf<LangGroup>();
        expectTypeOf(translator.get("*.Hello")).toEqualTypeOf<string>();
    });

    it("reads the * namespace as no namespace", () => {
        expectTypeOf(translator.get("*::messages.nested")).toEqualTypeOf<{
            deep: string;
        }>();
    });

    it("answers a string, never the literal, for lines declared as const", () => {
        const constant = new Translator(
            { en: { g: { a: "A", list: ["x", "y"] } } } as const,
            "en",
        );

        expectTypeOf(constant.get("g.a")).toEqualTypeOf<string>();
        expectTypeOf(constant.get("g")).toEqualTypeOf<{
            a: string;
            list: [string, string];
        }>();
        expectTypeOf(constant.array("g.list")).toEqualTypeOf<
            [string, string]
        >();
    });

    it("answers a string for an empty group, which reads as no line", () => {
        const empty = new Translator(
            {
                en: {
                    validation: {
                        attributes: {},
                        list: [],
                        kept: { none: {} },
                    },
                },
            },
            "en",
        );

        expectTypeOf(
            empty.get("validation.attributes"),
        ).toEqualTypeOf<string>();
        expectTypeOf(empty.get("validation.list")).toEqualTypeOf<string>();
        expectTypeOf(empty.get("validation.kept")).toEqualTypeOf<{
            none: Record<never, never>;
        }>();
    });

    it("answers a loosely typed group's own type", () => {
        type Loose = {
            en: {
                loose: Record<string, LangValue>;
                flat: Record<string, string>;
            };
        };

        expectTypeOf<
            TranslationResult<Loose, "loose.any">
        >().toEqualTypeOf<LangValue>();
        expectTypeOf<TranslationResult<Loose, "loose">>().toEqualTypeOf<
            Record<string, LangValue>
        >();
        expectTypeOf<TranslationResult<Loose, "flat">>().toEqualTypeOf<{
            [key: string]: string;
        }>();
        expectTypeOf<
            TranslationResult<Loose, "flat.any">
        >().toEqualTypeOf<string>();
    });

    it("ends on a recursive line type", () => {
        type Nested = string | Nested[];

        expectTypeOf<
            TranslationResult<{ en: { g: { r: Nested } } }, "g.r">
        >().toEqualTypeOf<Nested>();
    });

    it("answers a list group passed straight to another call", () => {
        expectTypeOf(
            new Translator(
                { en: { "foo::bar": { baz: ["breeze :foo"] } } },
                "en",
            ).array("foo::bar.baz"),
        ).toEqualTypeOf<string[]>();
    });

    it("answers any group from array() for a line key", () => {
        expectTypeOf(
            translator.array("messages.welcome"),
        ).toEqualTypeOf<LangGroup>();
    });

    it("keeps string for string() and choice()", () => {
        expectTypeOf(translator.string("messages")).toEqualTypeOf<string>();
        expectTypeOf(
            translator.choice("messages.welcome", 2),
        ).toEqualTypeOf<string>();
    });
});

describe("type-parameter callers", () => {
    it("answers either for a string key on any lines", () => {
        function lookup<TLines extends LangLines>(
            reader: Translator<TLines>,
            key: string,
        ): TranslationValue {
            return reader.get(key);
        }

        function lookupGroup<TLines extends LangLines>(
            reader: Translator<TLines>,
            key: string,
        ): LangGroup {
            return reader.array(key);
        }

        expectTypeOf(
            lookup(translator, "messages"),
        ).toEqualTypeOf<TranslationValue>();
        expectTypeOf(
            lookupGroup(translator, "messages"),
        ).toEqualTypeOf<LangGroup>();
    });

    it("accepts a key whose type is a type parameter", () => {
        function lookup<TKey extends string>(
            key: TKey,
        ): TranslationResult<typeof lines, TKey> {
            return translator.get(key);
        }

        expectTypeOf(lookup("messages.nested")).toEqualTypeOf<{
            deep: string;
        }>();
    });

    it("forwards a key typed by the lines", () => {
        function lookup<
            TLines extends LangLines,
            TKey extends TranslationKey<TLines>,
        >(
            reader: Translator<TLines>,
            key: TKey,
        ): TranslationResult<TLines, TKey> {
            return reader.get(key);
        }

        expectTypeOf(lookup(translator, "messages.nested")).toEqualTypeOf<{
            deep: string;
        }>();
    });

    it("binds the helpers to any lines", () => {
        function translate<TLines extends LangLines>(
            reader: Translator<TLines>,
            key: string,
        ): TranslationValue | null {
            return createHelpers(reader).__(key);
        }

        expectTypeOf(
            translate(translator, "messages"),
        ).toEqualTypeOf<TranslationValue | null>();
    });
});

describe("helper union arguments", () => {
    it("answers both rows for a key that may be null", () => {
        const { __, trans } = createHelpers(translator);

        expectTypeOf(__(maybeKey)).toEqualTypeOf<string | null>();
        expectTypeOf(trans(maybeKey)).toEqualTypeOf<
            Translator<typeof lines> | string
        >();
    });
});

describe("typed translators where untyped ones are expected", () => {
    it("accepts a typed translator and its helpers", () => {
        expectTypeOf(translator).toExtend<Translator>();
        expectTypeOf(createHelpers(translator)).toExtend<TranslationHelpers>();
    });
});
