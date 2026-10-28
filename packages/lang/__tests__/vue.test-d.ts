import type {
    RegisteredLines,
    TranslationHelpers,
    TranslationValue,
} from "@tolki/lang";
import type { VueLang } from "@tolki/lang/vue";
import { describe, expectTypeOf, it } from "vitest";
import type { ComponentCustomProperties, WritableComputedRef } from "vue";

import { LINES } from "./fixtures/lines";

declare const typedReader: VueLang<typeof LINES>;
declare const untypedReader: VueLang;

describe("useLang", () => {
    it("types __ from the lines", () => {
        expectTypeOf(typedReader.__("Welcome")).toEqualTypeOf<string>();
    });

    it("types __ as a translation value without lines", () => {
        expectTypeOf(
            untypedReader.__("anything"),
        ).toEqualTypeOf<TranslationValue>();
    });

    it("types locale as a writable computed ref", () => {
        expectTypeOf(typedReader.locale).toEqualTypeOf<
            WritableComputedRef<string>
        >();
    });

    it("types setLocale", () => {
        expectTypeOf(typedReader.setLocale("en")).toEqualTypeOf<
            Promise<void>
        >();
    });
});

describe("ComponentCustomProperties", () => {
    it("types the template __ by the registered lines", () => {
        expectTypeOf<ComponentCustomProperties["__"]>().toEqualTypeOf<
            TranslationHelpers<RegisteredLines>["__"]
        >();
    });
});
