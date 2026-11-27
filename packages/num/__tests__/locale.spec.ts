import { localeTag } from "@tolki/utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import { intlLocale, setLocaleNormalizer } from "../src/locale/index.js";

describe("intlLocale", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        setLocaleNormalizer(localeTag);
    });

    it("resolves either spelling to the canonical tag", () => {
        // docs/php-parity/Number/format.json, "format-locale-spellings"
        expect(intlLocale("pt_BR")).toBe("pt-BR");
        expect(intlLocale("PT-br")).toBe("pt-BR");
        expect(intlLocale("zh_hant_tw")).toBe("zh-Hant-TW");
    });

    it("throws PHP's ValueError message, naming the locale as given", () => {
        // docs/php-parity/Number/format.json, "format-locale-unknown", "format-locale-unknown-region",
        // "format-locale-malformed" and "format-locale-padded"
        for (const locale of ["xx", "xx_YY", "not a locale", " pt_BR "]) {
            expect(() => intlLocale(locale)).toThrow(
                new Error(
                    `NumberFormatter::__construct(): Argument #1 ($locale) "${locale}" is invalid`,
                ),
            );
        }
    });

    it("reads an empty locale as the runtime's default", () => {
        // docs/php-parity/Number/format.json, "format-locale-empty-is-icu-default"
        expect(intlLocale("")).toBe(
            new Intl.NumberFormat().resolvedOptions().locale,
        );
    });

    // JS-only: a runtime with less locale data than ICU 78 rejects what it cannot format, as PHP does.
    it("throws when the runtime has no data for the locale", () => {
        vi.spyOn(Intl.NumberFormat, "supportedLocalesOf").mockReturnValueOnce(
            [],
        );

        expect(() => intlLocale("haw")).toThrow(
            'Argument #1 ($locale) "haw" is invalid',
        );
    });
});

describe("setLocaleNormalizer", () => {
    afterEach(() => {
        setLocaleNormalizer(localeTag);
    });

    // JS-only: PHP has no hook; null hands the locale to Intl unchanged.
    it("passes the locale through untouched when null", () => {
        setLocaleNormalizer(null);

        expect(intlLocale("pt-BR")).toBe("pt-BR");
        expect(() => intlLocale("pt_BR")).toThrow('"pt_BR" is invalid');
    });

    // JS-only: the error names what the caller passed, not what the hook made of it.
    it("names the original locale when the hook's answer is invalid", () => {
        setLocaleNormalizer(() => "xx");

        expect(() => intlLocale("br")).toThrow('"br" is invalid');
    });
});
