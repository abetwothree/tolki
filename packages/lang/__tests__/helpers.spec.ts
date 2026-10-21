import { createHelpers, Translator } from "@tolki/lang";
import { describe, expect, it } from "vitest";

const lines = { en: { g: { a: "A" } } };

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
    });

    describe("trans", () => {
        // docs/php-parity/Helpers/trans.json, "trans-without-key-returns-translator"
        it("returns the translator without a key", () => {
            const translator = new Translator(lines, "en");
            const { trans } = createHelpers(translator);

            expect(trans()).toBe(translator);
            expect(trans(null)).toBe(translator);
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
