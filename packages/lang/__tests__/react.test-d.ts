import type { Lang, TranslationValue } from "@tolki/lang";
import type { LangProviderProps, ReactLang } from "@tolki/lang/react";
import { createLang, LangProvider } from "@tolki/lang/react";
import type { ReactElement } from "react";
import { describe, expectTypeOf, it } from "vitest";

import { LINES } from "./fixtures/lines";

describe("LangProvider", () => {
    it("accepts a lang made from literal lines", () => {
        const lang = createLang({ locale: "en", lines: { en: LINES.en } });

        expectTypeOf(LangProvider({ lang })).toEqualTypeOf<ReactElement>();
        expectTypeOf(LangProvider).parameter(0).toExtend<LangProviderProps>();
    });
});

describe("useLang", () => {
    it("types __ from the lines", () => {
        const reader = {} as ReactLang<typeof LINES>;

        expectTypeOf(reader.__("Welcome")).toEqualTypeOf<string>();
    });

    it("types __ as a translation value without lines", () => {
        const reader = {} as ReactLang;

        expectTypeOf(reader.__("anything")).toEqualTypeOf<TranslationValue>();
    });

    it("types setLocale and lang", () => {
        const reader = {} as ReactLang<typeof LINES>;

        expectTypeOf(reader.setLocale("en")).toEqualTypeOf<Promise<void>>();
        expectTypeOf(reader.lang).toEqualTypeOf<Lang<typeof LINES>>();
    });
});
