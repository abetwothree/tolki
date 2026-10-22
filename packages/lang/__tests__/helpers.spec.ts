import { createHelpers, Translator } from "@tolki/lang";
import { describe, expect, it } from "vitest";

const lines = { en: { g: { a: "A" } } };
const bilingual = { en: { g: { a: "A" } }, es: { g: { a: "A-es" } } };

describe("createHelpers", () => {
    describe("__", () => {
        // docs/php-parity/Helpers/__.json, "underscore-null-key"
        it("answers null for a null key", () => {
            const { __ } = createHelpers(new Translator(lines, "en"));

            expect(__(null)).toBeNull();
            expect(__()).toBeNull();
        });

        // docs/php-parity/Helpers/__.json, "underscore-translates"
        it("translates through the translator", () => {
            const translator = new Translator(lines, "en");
            const { __, trans } = createHelpers(translator);

            expect(__("g.a")).toBe("A");
            // docs/php-parity/Helpers/trans.json, "trans-translates"
            expect(trans("g.a")).toBe("A");
        });

        // docs/php-parity/Helpers/__.json, "underscore-locale-argument"
        it("reads the given locale", () => {
            const { __ } = createHelpers(new Translator(bilingual, "en"));

            expect(__("g.a", {}, "es")).toBe("A-es");
        });
    });

    describe("trans", () => {
        // docs/php-parity/Helpers/trans.json, "trans-without-key-returns-translator"
        it("returns the translator without a key", () => {
            const translator = new Translator(lines, "en");
            const { trans } = createHelpers(translator);

            expect(trans()).toBe(translator);
            expect(trans(null)).toBe(translator);
        });

        // docs/php-parity/Helpers/trans.json, "trans-locale-argument"
        it("reads the given locale", () => {
            const { trans } = createHelpers(new Translator(bilingual, "en"));

            expect(trans("g.a", {}, "es")).toBe("A-es");
        });
    });

    describe("transChoice", () => {
        it("chooses through the translator", () => {
            const translator = new Translator(lines, "en");
            const { transChoice } = createHelpers(translator);

            // docs/php-parity/Helpers/trans_choice.json, "trans-choice-without-fallback"
            expect(transChoice("x|y", 2)).toBe("x");

            translator.setFallback("en");

            // docs/php-parity/Helpers/trans_choice.json, "trans-choice-with-fallback"
            expect(transChoice("x|y", 2)).toBe("y");
        });

        // docs/php-parity/Helpers/trans_choice.json, "trans-choice-replace-and-locale"
        it("passes the replacements and the locale", () => {
            const { transChoice } = createHelpers(
                new Translator({ ru: { x: ":n один|:n два|:n много" } }, "en"),
            );

            expect(transChoice("x", 2, { n: "N" }, "ru")).toBe("N два");
        });
    });

    // JS-only: the helpers are plain functions, so a destructured one must not lose its translator.
    it("works when destructured", () => {
        const { __, trans, transChoice } = createHelpers(
            new Translator(lines, "en"),
        );

        expect(__("g.a")).toBe("A");
        expect(trans("g.a")).toBe("A");
        expect(transChoice("x|y", 1)).toBe("x");
    });
});
