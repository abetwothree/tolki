import type {
    Lang,
    LangLines,
    LangOptions,
    LinesFromRegister,
    LocaleNormalizer,
    TranslationValue,
} from "@tolki/lang";
import { createLang, normalizeLocale } from "@tolki/lang";
import { describe, expectTypeOf, it } from "vitest";

import { LINES } from "./fixtures/lines";

declare const registered: Lang<LinesFromRegister<{ lines: typeof LINES.en }>>;

describe("createLang", () => {
    it("types keys from the lines it was given", () => {
        expectTypeOf(
            createLang({ locale: "en", lines: { en: LINES.en } }).__(
                "auth.failed",
            ),
        ).toEqualTypeOf<string>();
    });

    it("answers any translation value when it has no lines", () => {
        expectTypeOf(
            createLang({ locale: "en" }).__("anything"),
        ).toEqualTypeOf<TranslationValue>();
    });

    it("answers a promise from setLocale", () => {
        expectTypeOf(
            createLang({ locale: "en" }).setLocale("es"),
        ).toEqualTypeOf<Promise<void>>();
    });

    it("takes a locale normalizer, or null", () => {
        expectTypeOf<LangOptions["normalizeLocalesUsing"]>().toEqualTypeOf<
            LocaleNormalizer | null | undefined
        >();
        expectTypeOf(normalizeLocale).toExtend<LocaleNormalizer>();
        expectTypeOf(
            createLang({
                locale: "en",
                normalizeLocalesUsing: normalizeLocale,
            }),
        ).toExtend<Lang<LangLines>>();
    });
});

describe("LinesFromRegister", () => {
    it("types keys from the registered lines", () => {
        expectTypeOf(registered.__("auth.failed")).toEqualTypeOf<string>();
        expectTypeOf(registered.__("auth")).toEqualTypeOf<
            { failed: string } | string
        >();
    });

    it("falls back to the loose lines without a registration", () => {
        // The empty register is the case under test.
        // oxlint-disable-next-line typescript/no-empty-object-type
        expectTypeOf<LinesFromRegister<{}>>().toEqualTypeOf<LangLines>();
    });
});
