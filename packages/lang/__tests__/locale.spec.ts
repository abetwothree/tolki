import { getPluralIndex, htmlLocale, normalizeLocale } from "@tolki/lang";
import { afterEach, describe, expect, it, vi } from "vitest";

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

describe("htmlLocale", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        document.documentElement.lang = "";
    });

    // JS-only: the browser's <html lang> has no Laravel counterpart.
    it("reads <html lang> in Laravel's spelling", () => {
        document.documentElement.lang = "pt-BR";

        expect(htmlLocale()).toBe("pt_BR");
    });

    // JS-only: the browser's <html lang> has no Laravel counterpart.
    it("prefers the spelling the exporter wrote", () => {
        document.documentElement.lang = "pt-BR";

        expect(htmlLocale(["pt_BR", "en"])).toBe("pt_BR");
        expect(htmlLocale(["pt-BR"])).toBe("pt-BR");
        expect(htmlLocale(["en"])).toBeNull();
    });

    // JS-only: the browser's <html lang> has no Laravel counterpart.
    it.each([
        ["sr-Latn", ["sr_Latn", "en"], "sr_Latn"],
        ["zh-Hant", ["zh_Hant"], "zh_Hant"],
        ["sr-Latn-ME", ["sr_Latn_ME"], "sr_Latn_ME"],
        ["pt-br", ["pt-BR"], "pt-BR"],
    ])(
        "matches %s against the list's own spelling, ignoring case",
        (tag, locales, expected) => {
            document.documentElement.lang = tag;

            expect(htmlLocale(locales)).toBe(expected);
        },
    );

    // JS-only: the browser's <html lang> has no Laravel counterpart.
    it("answers null for an empty lang", () => {
        document.documentElement.lang = "";

        expect(htmlLocale()).toBeNull();
    });

    // JS-only: the browser's <html lang> has no Laravel counterpart.
    it("answers null without a document", () => {
        vi.stubGlobal("document", undefined);

        expect(htmlLocale()).toBeNull();
    });
});
