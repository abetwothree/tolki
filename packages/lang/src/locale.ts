import { slug } from "@tolki/str";

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
    return slug(locale, "_")
        .split("_")
        .map((subtag, index) => {
            return index > 0 && /^[a-z]{2}$/.test(subtag)
                ? subtag.toUpperCase()
                : subtag;
        })
        .join("_");
}
