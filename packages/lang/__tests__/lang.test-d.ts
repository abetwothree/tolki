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

/** Lines whose keys walk more than one segment below the group, and a JSON line that is a group elsewhere. */
const paths = {
    en: {
        Hello: "Hello",
        g: {
            nested: { deeper: { x: "x" } },
            "a.b": { c: "c" },
            list: [{ a: "a" }],
            0: { zero: "0" },
        },
        "courier::mail": { sent: { to: "Ann" } },
        rows: [{ a: "a" }],
    },
    es: { Hello: { x: "Hola" } },
};
const pathsTranslator = new Translator(paths, "en");

/** A key known only by its pattern, as a template literal expression is typed. */
declare const messagesKey: `messages.${string}`;

/** A key known only by its pattern, which matches lines and no group. */
declare const welcomeKey: `messages.wel${string}`;

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

    it("answers the group or the key for a group key", () => {
        expectTypeOf(translator.get("messages.nested")).toEqualTypeOf<
            { deep: string } | string
        >();
        expectTypeOf(translator.get("messages")).toEqualTypeOf<
            | { welcome: string; nested: { deep: string } }
            | { bye: string }
            | string
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
        expectTypeOf<
            TranslationResult<Mixed, "g">
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
        expectTypeOf(translator.get(welcomeKey)).toEqualTypeOf<string>();
    });

    it("answers the JSON lines as a group for the * group", () => {
        expectTypeOf(translator.get("*")).toEqualTypeOf<LangGroup | string>();
        expectTypeOf(translator.get("*.Hello")).toEqualTypeOf<string>();
    });

    it("reads the * namespace as no namespace", () => {
        expectTypeOf(translator.get("*::messages.nested")).toEqualTypeOf<
            { deep: string } | string
        >();
    });

    it("answers a string, never the literal, for lines declared as const", () => {
        const constant = new Translator(
            { en: { g: { a: "A", list: ["x", "y"] } } } as const,
            "en",
        );

        expectTypeOf(constant.get("g.a")).toEqualTypeOf<string>();
        expectTypeOf(constant.get("g")).toEqualTypeOf<
            { a: string; list: [string, string] } | string
        >();
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
        expectTypeOf(empty.get("validation.kept")).toEqualTypeOf<
            { none: Record<never, never> } | string
        >();
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
            Record<string, LangValue> | string
        >();
        expectTypeOf<TranslationResult<Loose, "flat">>().toEqualTypeOf<
            { [key: string]: string } | string
        >();
        expectTypeOf<
            TranslationResult<Loose, "flat.any">
        >().toEqualTypeOf<string>();
    });

    it("reads a group typed with any as any lines", () => {
        // An untyped import or a cast can type a group's values as any.
        type AnyGroup = { en: { g: Record<string, any> } };

        expectTypeOf<TranslationResult<AnyGroup, "g">>().toEqualTypeOf<
            { [key: string]: LangValue } | string
        >();
        expectTypeOf<TranslationKey<AnyGroup>>().toEqualTypeOf<
            "g" | `g.${string}`
        >();
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

describe("deep paths", () => {
    it("walks every segment to a group two levels down", () => {
        expectTypeOf(pathsTranslator.get("g.nested.deeper")).toEqualTypeOf<
            { x: string } | string
        >();
        expectTypeOf(pathsTranslator.array("g.nested.deeper")).toEqualTypeOf<{
            x: string;
        }>();
    });

    it("reads a dotted item as one key first", () => {
        expectTypeOf(pathsTranslator.get("g.a.b")).toEqualTypeOf<
            { c: string } | string
        >();
    });

    it("reads a list's items and an object's number keys by index", () => {
        expectTypeOf(pathsTranslator.get("g.list.0")).toEqualTypeOf<
            { a: string } | string
        >();
        expectTypeOf(pathsTranslator.get("g.0")).toEqualTypeOf<
            { zero: string } | string
        >();
    });

    it("reads a tuple's item at its own index", () => {
        type Pair = { en: { g: { pair: [string, { a: string }] } } };

        expectTypeOf<
            TranslationResult<Pair, "g.pair.0">
        >().toEqualTypeOf<string>();
        expectTypeOf<TranslationResult<Pair, "g.pair.1">>().toEqualTypeOf<
            { a: string } | string
        >();
    });

    it("reads a list's own properties as no item", () => {
        expectTypeOf(
            pathsTranslator.get("g.list.length"),
        ).toEqualTypeOf<string>();
        expectTypeOf(
            pathsTranslator.get("rows.length"),
        ).toEqualTypeOf<string>();
        expectTypeOf(pathsTranslator.get("rows.map")).toEqualTypeOf<string>();
    });

    it("reads a namespaced key only up to its second separator", () => {
        expectTypeOf(
            pathsTranslator.get("courier::mail.sent::cut"),
        ).toEqualTypeOf<{ to: string } | string>();
    });

    it("answers a JSON line that is a group in another locale as either", () => {
        expectTypeOf(pathsTranslator.get("Hello")).toEqualTypeOf<
            { x: string } | string
        >();
    });

    it("lists the paths below a list's items", () => {
        expectTypeOf<"g.list.0.a">().toExtend<TranslationKey<typeof paths>>();
        expectTypeOf<"g.0.zero">().toExtend<TranslationKey<typeof paths>>();
        expectTypeOf<"g.nested.deeper.x">().toExtend<
            TranslationKey<typeof paths>
        >();
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

        expectTypeOf(lookup("messages.nested")).toEqualTypeOf<
            { deep: string } | string
        >();
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

        expectTypeOf(lookup(translator, "messages.nested")).toEqualTypeOf<
            { deep: string } | string
        >();
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

describe("lines declared as const in a variable", () => {
    it("accepts readonly lists and objects", () => {
        const constLines = {
            en: { g: { a: "A", list: ["a", "b"], nested: { deep: "x" } } },
        } as const;
        const constant = new Translator(constLines, "en");

        expectTypeOf(constant.get("g.a")).toEqualTypeOf<string>();
        expectTypeOf(constant.get("g.list.0")).toEqualTypeOf<string>();
        expectTypeOf(constant.array("g.list")).toEqualTypeOf<
            [string, string]
        >();
        expectTypeOf(constant.get("g.nested")).toEqualTypeOf<
            { deep: string } | string
        >();
        expectTypeOf(createHelpers(constant).__("g.a")).toEqualTypeOf<string>();
    });
});

describe("pattern keys through lists and index signatures", () => {
    type Pairs = {
        en: {
            g: {
                pair: [string, { a: string }];
                trio: [{ a: string }, string, { b: string }[]];
            };
        };
    };
    type Lists = { en: { g: { m: { x: string }[][]; s: string[] } } };
    type Loose = {
        en: {
            loose: Record<string, LangValue>;
            flat: Record<string, string>;
            typed: Record<string, { x: string }>;
        };
    };
    type Rec = string | Rec[];
    type Nested = { en: { g: { r: Rec } } };

    it("answers a list's item for an index pattern", () => {
        expectTypeOf<
            TranslationResult<typeof paths, `g.list.${string}`>
        >().toEqualTypeOf<string | { a: string }>();
        expectTypeOf<
            TranslationResult<typeof paths, `g.list.${number}`>
        >().toEqualTypeOf<string | { a: string }>();
        expectTypeOf(
            pathsTranslator.array(`g.list.${0 as number}`),
        ).toEqualTypeOf<{
            a: string;
        }>();
    });

    it("answers any tuple member, and a nested list's items, for an index pattern", () => {
        expectTypeOf<
            TranslationResult<Pairs, `g.pair.${string}`>
        >().toEqualTypeOf<string | { a: string }>();
        expectTypeOf<
            TranslationResult<Pairs, `g.trio.${string}`>
        >().toEqualTypeOf<
            string | { a: string } | { b: string }[] | { b: string }
        >();
        expectTypeOf<TranslationResult<Lists, `g.m.${string}`>>().toEqualTypeOf<
            string | { x: string }[] | { x: string }
        >();
    });

    it("keeps the groups a loosely typed or recursive group may answer", () => {
        expectTypeOf<
            TranslationResult<Loose, `loose.${string}`>
        >().toEqualTypeOf<LangValue | string>();
        expectTypeOf<
            TranslationResult<Loose, `${string}.${string}`>
        >().toEqualTypeOf<
            string | { [key: string]: LangValue } | LangValue[] | { x: string }
        >();
        expectTypeOf<
            TranslationResult<Nested, `g.r.${string}`>
        >().toEqualTypeOf<Rec | string>();
    });
});

describe("readonly lines in, mutable groups out", () => {
    type LangInputValue = import("@tolki/lang").LangInputValue;

    const frozen = {
        en: { g: { list: ["a", "b"], o: { k: "v" } } },
    } as const;

    it("answers a mutable group for untyped lines", () => {
        const wide = new Translator({} as LangLines, "en");

        expectTypeOf(wide.get("anything")).toEqualTypeOf<
            string | { [key: string]: LangValue } | LangValue[]
        >();
        expectTypeOf(wide.array("anything")).toEqualTypeOf<
            { [key: string]: LangValue } | LangValue[]
        >();
    });

    it("accepts readonly lines in the constructor, addLines and setLoaded", () => {
        const wide = new Translator({} as LangLines, "en");
        const added = { "g.list": ["a", "b"] } as const;

        expectTypeOf(frozen.en).toExtend<
            Readonly<Record<string, LangInputValue>>
        >();
        expectTypeOf(wide.setLoaded).toBeCallableWith(frozen);
        expectTypeOf(wide.addLines).toBeCallableWith(added, "en");
        expectTypeOf(new Translator(frozen, "en").get("g.o")).toEqualTypeOf<
            { k: string } | string
        >();
    });

    it("answers a loosely typed readonly group as a mutable copy", () => {
        type Frozen = {
            en: {
                loose: { readonly [key: string]: LangInputValue };
                list: readonly LangInputValue[];
            };
        };

        expectTypeOf<TranslationResult<Frozen, "loose">>().toEqualTypeOf<
            { [key: string]: LangValue } | string
        >();
        expectTypeOf<TranslationResult<Frozen, "list">>().toEqualTypeOf<
            LangValue[] | string
        >();
        expectTypeOf<
            TranslationResult<Frozen, "loose.any">
        >().toEqualTypeOf<LangValue>();
    });
});

describe("items no group types precisely", () => {
    it("answers a string for an item below a JSON line", () => {
        expectTypeOf(translator.get("Hello.x")).toEqualTypeOf<string>();
    });

    it("answers any line or group for an item typed any", () => {
        expectTypeOf<
            TranslationResult<{ en: { g: Record<string, any> } }, "g.x">
        >().toEqualTypeOf<TranslationValue>();
    });
});
