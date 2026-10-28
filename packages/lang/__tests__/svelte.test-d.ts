import type { TranslationValue } from "@tolki/lang";
import type { SvelteLang } from "@tolki/lang/svelte";
import { createLang, langContext } from "@tolki/lang/svelte";
import { describe, expectTypeOf, it } from "vitest";

import { LINES } from "./fixtures/lines";

declare const reader: SvelteLang<typeof LINES>;
declare const bareReader: SvelteLang;

describe("SvelteLang", () => {
    it("types __ from the lines", () => {
        expectTypeOf(reader.__("Welcome")).toEqualTypeOf<string>();
    });

    it("types __ as a translation value without lines", () => {
        expectTypeOf(
            bareReader.__("anything"),
        ).toEqualTypeOf<TranslationValue>();
    });

    it("types setLocale and locale", () => {
        expectTypeOf(reader.setLocale("en")).toEqualTypeOf<Promise<void>>();
        expectTypeOf(reader.locale).toEqualTypeOf<string>();
    });
});

describe("langContext", () => {
    it("answers a map of the lang's reader", () => {
        const lang = createLang({ locale: "en", lines: LINES });

        expectTypeOf(langContext(lang)).toEqualTypeOf<
            Map<symbol, SvelteLang<typeof LINES>>
        >();
    });
});
