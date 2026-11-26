import { localeTag } from "@tolki/utils";

/**
 * Turns a locale into the tag `Intl` reads.
 */
export type LocaleNormalizer = (locale: string) => string;

/**
 * The callback that turns every locale into the tag `Intl` reads.
 */
let normalizer: LocaleNormalizer | null = localeTag;

/**
 * Set the callback that turns every locale into the tag `Intl` reads, or null to pass locales through unchanged.
 *
 * @sideEffects state writes the module locale normalizer
 *
 * @param callback - Turns a locale into a BCP 47 tag.
 */
export function setLocaleNormalizer(callback: LocaleNormalizer | null): void {
    normalizer = callback;
}

/**
 * Resolve a locale to the canonical tag `Intl` formats with, as PHP's NumberFormatter reads it through ICU.
 *
 * @param locale - The locale as the caller wrote it.
 * @returns The canonical tag, or the runtime's own locale when empty.
 * @throws Error when ICU has no data for the locale, as PHP's NumberFormatter throws its ValueError
 */
/* @__NO_SIDE_EFFECTS__ */
export function intlLocale(locale: string): string {
    if (locale === "") {
        return new Intl.NumberFormat().resolvedOptions().locale;
    }

    const tag = normalizer === null ? locale : normalizer(locale);
    let supported: string | undefined;

    try {
        supported = Intl.NumberFormat.supportedLocalesOf(tag)[0];
    } catch {
        supported = undefined;
    }

    if (supported === undefined) {
        throw new Error(
            `NumberFormatter::__construct(): Argument #1 ($locale) "${locale}" is invalid`,
        );
    }

    return supported;
}
