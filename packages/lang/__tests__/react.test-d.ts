import type { Lang, TranslationValue } from "@tolki/lang";
import type { LangProviderProps, ReactLang } from "@tolki/lang/react";
import { createLang, LangProvider } from "@tolki/lang/react";
import type { ReactElement } from "react";
import { describe, expectTypeOf, it } from "vitest";

import { LINES } from "./fixtures/lines";

declare const typedReader: ReactLang<typeof LINES>;
declare const untypedReader: ReactLang;

describe("LangProvider", () => {
    it("accepts a lang made from literal lines", () => {
        const lang = createLang({ locale: "en", lines: { en: LINES.en } });

        expectTypeOf(LangProvider({ lang })).toEqualTypeOf<ReactElement>();
        expectTypeOf(LangProvider).parameter(0).toExtend<LangProviderProps>();
    });
});

describe("useLang", () => {
    it("types __ from the lines", () => {
        expectTypeOf(typedReader.__("Welcome")).toEqualTypeOf<string>();
    });

    it("types __ as a translation value without lines", () => {
        expectTypeOf(
            untypedReader.__("anything"),
        ).toEqualTypeOf<TranslationValue>();
    });

    it("types locale as a string", () => {
        expectTypeOf(typedReader.locale).toEqualTypeOf<string>();
    });

    it("types setLocale and lang", () => {
        expectTypeOf(typedReader.setLocale("en")).toEqualTypeOf<
            Promise<void>
        >();
        expectTypeOf(typedReader.lang).toEqualTypeOf<Lang<typeof LINES>>();
    });
});
