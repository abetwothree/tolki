import { localeTag, normalizeLocale } from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("normalizeLocale", () => {
    // JS-only: Laravel has no BCP 47 step; its plural table spells locales en_US.
    it("turns a BCP 47 tag into Laravel's spelling", () => {
        expect(normalizeLocale("en-US")).toBe("en_US");
        expect(normalizeLocale("pt-br")).toBe("pt_BR");
        expect(normalizeLocale("EN_us")).toBe("en_US");
    });

    // JS-only: Laravel has no BCP 47 step; its plural table spells locales en_US.
    it("trims surrounding spaces", () => {
        expect(normalizeLocale(" en-US ")).toBe("en_US");
    });

    // JS-only: Laravel has no BCP 47 step; its plural table spells locales en_US.
    it("leaves a bare language alone", () => {
        expect(normalizeLocale("en")).toBe("en");
    });

    // JS-only: Laravel has no BCP 47 step; its plural table spells locales en_US.
    it("splits on runs of hyphens, underscores and spaces", () => {
        expect(normalizeLocale("en US")).toBe("en_US");
        expect(normalizeLocale("pt-_ br")).toBe("pt_BR");
    });

    // JS-only: Laravel has no BCP 47 step; its plural table spells locales en_US.
    it("leaves an empty locale empty", () => {
        expect(normalizeLocale("")).toBe("");
    });

    // docs/php-parity/Php/Locale.json, "canonicalize-script-subtags"
    it("upper-cases regions and title-cases scripts, as ICU spells them", () => {
        expect(normalizeLocale("zh-hant-tw")).toBe("zh_Hant_TW");
        expect(normalizeLocale("zh-Hant-TW")).toBe("zh_Hant_TW");
        expect(normalizeLocale("sr-latn")).toBe("sr_Latn");
        expect(normalizeLocale("az-cyrl-az")).toBe("az_Cyrl_AZ");
        expect(normalizeLocale("uz_Latn")).toBe("uz_Latn");
        expect(normalizeLocale("zh-Hans")).toBe("zh_Hans");
        expect(normalizeLocale("es-419")).toBe("es_419");
    });

    // JS-only: ICU upper-cases variants (en_US_POSIX); Laravel's plural table never reads them.
    it("leaves variant subtags lower-case", () => {
        expect(normalizeLocale("en-US-POSIX")).toBe("en_US_posix");
        expect(normalizeLocale("be-tarask")).toBe("be_tarask");
    });
});

describe("localeTag", () => {
    // JS-only: PHP hands either spelling to ICU; Intl reads only BCP 47.
    it("turns Laravel's spelling into a BCP 47 tag", () => {
        expect(localeTag("pt_BR")).toBe("pt-BR");
        expect(localeTag("es_419")).toBe("es-419");
        expect(localeTag("en")).toBe("en");
    });

    // JS-only: PHP hands either spelling to ICU; Intl reads only BCP 47.
    it("canonicalizes case", () => {
        expect(localeTag("zh_hant_tw")).toBe("zh-Hant-TW");
        expect(localeTag("EN_us")).toBe("en-US");
        expect(localeTag("pt-br")).toBe("pt-BR");
    });

    // JS-only: PHP hands either spelling to ICU; Intl reads only BCP 47.
    it("replaces deprecated codes as Intl does", () => {
        expect(localeTag("iw")).toBe("he");
    });

    // JS-only: PHP hands either spelling to ICU; Intl reads only BCP 47.
    it("hyphenates a tag Intl cannot canonicalize, without throwing", () => {
        expect(localeTag("not a locale")).toBe("not a locale");
        expect(localeTag(" pt_BR ")).toBe(" pt-BR ");
        expect(localeTag("pt_BR.UTF-8")).toBe("pt-BR.UTF-8");
        expect(localeTag("")).toBe("");
    });

    // JS-only: PHP hands either spelling to ICU; Intl reads only BCP 47.
    it("round-trips with normalizeLocale", () => {
        expect(normalizeLocale(localeTag("zh_hant_tw"))).toBe("zh_Hant_TW");
        expect(localeTag(normalizeLocale("pt-br"))).toBe("pt-BR");
    });
});
