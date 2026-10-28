import { isUndefined } from "@tolki/utils";

/**
 * Turn a BCP 47 tag into the spelling Laravel's plural table uses.
 *
 * @param locale - The locale tag, such as `en-US` or `pt-br`.
 * @returns The locale spelled `en_US`; only two-letter subtags after the first are upper-cased.
 *
 * @example
 *
 * normalizeLocale("pt-br"); // "pt_BR"
 */
export function normalizeLocale(locale: string): string {
    return locale
        .trim()
        .toLowerCase()
        .split(/[-_\s]+/)
        .map((subtag, index) => {
            return index > 0 && /^[a-z]{2}$/.test(subtag)
                ? subtag.toUpperCase()
                : subtag;
        })
        .join("_");
}

/**
 * Read the locale the page declares on its `<html lang>`.
 *
 * @param locales - The locales the lines hold; the tag matches one ignoring case and `-` versus `_`
 * @returns The listed locale's own spelling, or null without a document, without a tag or when none matches
 *
 * @example
 *
 * htmlLocale(["pt_BR", "en"]); // "pt_BR" for <html lang="pt-BR">
 */
export function htmlLocale(locales?: readonly string[]): string | null {
    if (isUndefined(globalThis.document)) {
        return null;
    }

    const tag = globalThis.document.documentElement.lang.trim();

    if (tag === "") {
        return null;
    }

    const normalized = normalizeLocale(tag);

    if (isUndefined(locales)) {
        return normalized;
    }

    if (locales.includes(tag)) {
        return tag;
    }

    const wanted = normalized.toLowerCase();

    return (
        locales.find((locale) => {
            return normalizeLocale(locale).toLowerCase() === wanted;
        }) ?? null
    );
}
