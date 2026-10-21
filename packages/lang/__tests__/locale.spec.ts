import { getPluralIndex, normalizeLocale } from "@tolki/lang";
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

    // JS-only: Laravel has no BCP 47 step; its plural table spells locales en_US.
    it("upper-cases only two-letter subtags", () => {
        expect(normalizeLocale("zh-Hant-TW")).toBe("zh_hant_TW");
        expect(normalizeLocale("es-419")).toBe("es_419");
    });

    // JS-only: Laravel has no BCP 47 step; docs/php-parity/MessageSelector/getPluralIndex.json, "plural-index-en_US"
    it("feeds the plural rules", () => {
        expect(getPluralIndex(normalizeLocale("en-US"), 5)).toBe(1);
    });
});
