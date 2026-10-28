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
    it("types the reads from the lines", () => {
        expectTypeOf<
            ReactLang<typeof LINES>["locale"]
        >().toEqualTypeOf<string>();
        expectTypeOf<ReturnType<ReactLang<typeof LINES>["__"]>>().toExtend<
            unknown
        >();
    });
});
