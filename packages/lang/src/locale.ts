import { isUndefined, normalizeLocale } from "@tolki/utils";

export { localeTag, normalizeLocale } from "@tolki/utils";

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
/* @__NO_SIDE_EFFECTS__ */
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
