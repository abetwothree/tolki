/**
 * Turn a BCP 47 tag into the spelling Laravel's plural table uses.
 *
 * @param locale - The locale tag, such as `en-US` or `pt-br`.
 * @returns The locale spelled `en_US`: two-letter subtags after the first upper-cased, four-letter ones title-cased.
 *
 * @example
 *
 * normalizeLocale("pt-br"); // "pt_BR"
 * normalizeLocale("zh-hant-tw"); // "zh_Hant_TW"
 */
/* @__NO_SIDE_EFFECTS__ */
export function normalizeLocale(locale: string): string {
    return locale
        .trim()
        .toLowerCase()
        .split(/[-_\s]+/)
        .map((subtag, index) => {
            if (index === 0) {
                return subtag;
            }

            if (/^[a-z]{2}$/.test(subtag)) {
                return subtag.toUpperCase();
            }

            if (/^[a-z]{4}$/.test(subtag)) {
                return subtag.charAt(0).toUpperCase() + subtag.slice(1);
            }

            return subtag;
        })
        .join("_");
}

/**
 * Turn a locale spelled as Laravel does into the BCP 47 tag `Intl` reads.
 *
 * @param locale - The locale, such as `pt_BR` or `zh_hant_tw`.
 * @returns The canonical tag, or the input with its underscores replaced when `Intl` cannot read it.
 *
 * @example
 *
 * localeTag("pt_BR"); // "pt-BR"
 * localeTag("zh_hant_tw"); // "zh-Hant-TW"
 */
/* @__NO_SIDE_EFFECTS__ */
export function localeTag(locale: string): string {
    const tag = locale.replaceAll("_", "-");

    try {
        return Intl.getCanonicalLocales(tag)[0] ?? tag;
    } catch {
        return tag;
    }
}
