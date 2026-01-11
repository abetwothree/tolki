import { format } from "@tolki/num";
import { ToWords } from "to-words";

/**
 * Supported locale codes for the to-words package.
 */
const SUPPORTED_LOCALES: Set<string> = new Set([
    "bn-IN",
    "ee-EE",
    "en-AE",
    "en-AU",
    "en-BD",
    "en-GB",
    "en-GH",
    "en-IE",
    "en-IN",
    "en-MM",
    "en-MA",
    "en-MU",
    "en-NG",
    "en-NP",
    "en-OM",
    "en-PH",
    "en-SA",
    "en-US",
    "es-AR",
    "es-ES",
    "es-MX",
    "es-VE",
    "fa-IR",
    "fr-BE",
    "fr-FR",
    "fr-MA",
    "fr-SA",
    "gu-IN",
    "hi-IN",
    "kn-IN",
    "ko-KR",
    "lv-LV",
    "mr-IN",
    "nl-SR",
    "np-NP",
    "pt-BR",
    "tr-TR",
    "ur-PK",
    "ar-AE",
    "ar-MA",
    "ar-SA",
]);

/**
 * Map a locale string to the closest supported to-words locale code.
 *
 * @param locale - The locale to map (e.g., "en", "en-US", "fr")
 * @returns The closest supported locale code, or "en-US" as fallback
 */
function mapToSupportedLocale(locale: string): string {
    // If exact match exists, use it
    if (SUPPORTED_LOCALES.has(locale)) {
        return locale;
    }

    // Extract language code (e.g., "en" from "en-US")
    const parts = locale.split("-");
    const langCode = (parts[0] || locale).toLowerCase();

    // Find a locale that starts with the same language code
    for (const supported of SUPPORTED_LOCALES) {
        if (supported.toLowerCase().startsWith(langCode + "-")) {
            return supported;
        }
    }

    // Default to en-US
    return "en-US";
}

/**
 * Spell out the given number in the given locale.
 *
 * If `after` is provided and the number is less than or equal to `after`,
 * the number will be returned as a formatted string instead of spelled out.
 *
 * If `until` is provided and the number is greater than or equal to `until`,
 * the number will be returned as a formatted string instead of spelled out.
 *
 * @param number - The number to spell out.
 * @param locale - The locale to use for spelling. Defaults to "en-US".
 * @param after - If provided, numbers <= this value will be formatted instead of spelled.
 * @param until - If provided, numbers >= this value will be formatted instead of spelled.
 * @returns The number spelled out as words, or formatted as a string.
 *
 * @requires {@link https://www.npmjs.com/package/to-words to-words package}
 *
 * @example
 *
 * spell(123); // "One Hundred Twenty Three"
 * spell(123.45); // "One Hundred Twenty Three Point Forty Five"
 * spell(5, null, 10); // "5" (5 <= 10, so formatted instead of spelled)
 * spell(11, null, 10); // "Eleven" (11 > 10, so spelled out)
 * spell(100, null, null, 50); // "100" (100 >= 50, so formatted instead of spelled)
 * spell(49, null, null, 50); // "Forty Nine" (49 < 50, so spelled out)
 */
export function spell(
    number: number | string,
    locale: string | null = null,
    after: number | null = null,
    until: number | null = null,
): string {
    const num = typeof number === "string" ? parseFloat(number) : number;

    // If after is provided and number <= after, return formatted number
    if (after !== null && num <= after) {
        return format(num, null, null, locale) || String(num);
    }

    // If until is provided and number >= until, return formatted number
    if (until !== null && num >= until) {
        return format(num, null, null, locale) || String(num);
    }

    const localeCode = mapToSupportedLocale(locale ?? "en-US");

    const toWords = new ToWords({
        localeCode,
        converterOptions: {
            currency: false,
            ignoreDecimal: false,
        },
    });

    return toWords.convert(num);
}

/**
 * Spell out the given number in the given locale in ordinal form.
 *
 * Note: The to-words package doesn't have native ordinal support, so this
 * function spells out the cardinal number. True ordinal conversion would
 * require locale-specific suffix rules (e.g., "first", "second", "third").
 *
 * @param value - The number to spell out in ordinal form.
 * @param locale - The locale to use for spelling. Defaults to "en-US".
 * @returns The number spelled out as words.
 *
 * @requires {@link https://www.npmjs.com/package/to-words to-words package}
 *
 * @example
 *
 * spellOrdinal(1); // "One"
 * spellOrdinal(2); // "Two"
 * spellOrdinal(21); // "Twenty One"
 */
export function spellOrdinal(
    value: number,
    locale: string | null = null,
): string {
    const localeCode = mapToSupportedLocale(locale ?? "en-US");

    const toWords = new ToWords({
        localeCode,
        converterOptions: {
            currency: false,
            ignoreDecimal: true,
        },
    });

    // to-words doesn't support ordinal conversion natively
    // We return the cardinal number as words
    return toWords.convert(Math.floor(value));
}
