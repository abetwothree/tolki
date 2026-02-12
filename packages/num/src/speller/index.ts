import { format } from "@tolki/num";
import { isString, toLower } from "@tolki/utils";

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
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#spell
 */
export async function spell(
    number: number | string,
    locale: string | null = null,
    after: number | null = null,
    until: number | null = null,
): Promise<string> {
    const num = isString(number) ? parseFloat(number) : number;

    // If after is provided and number <= after, return formatted number
    if (after !== null && num <= after) {
        return format(num, null, null, locale) as string;
    }

    // If until is provided and number >= until, return formatted number
    if (until !== null && num >= until) {
        return format(num, null, null, locale) as string;
    }

    const toWords = await loadToWords(locale ?? "en-US");

    return toLower(toWords.convert(num));
}

/**
 * Spell out the given number in the given locale in ordinal form.
 *
 * @param value - The number to spell out in ordinal form.
 * @param locale - The locale to use for spelling. Defaults to "en-US".
 * @returns The number spelled out as ordinal words (e.g., "First", "Twenty First").
 *
 * @requires {@link https://www.npmjs.com/package/to-words to-words package}
 *
 * @see https://tolki.abe.dev/numbers/number-utilities-list.html#spellordinal
 */
export async function spellOrdinal(
    number: number | string,
    locale: string | null = null,
): Promise<string> {
    const num = isString(number) ? parseFloat(number) : number;
    const toWords = await loadToWords(locale ?? "en-US");

    return toLower(toWords.toOrdinal(Math.floor(num)));
}

/**
 * Dynamically import a ToWords class for the given locale.
 *
 * Tries the exact locale first, then falls back to a language-code
 * match (e.g., "en" → "en-US"), and finally defaults to "en-US".
 *
 * @param locale - The locale code (e.g., "en-US", "fr-FR", "en")
 * @returns A ToWords instance configured for the resolved locale
 */
async function loadToWords(locale: string): Promise<{
    convert: (n: number | bigint | string) => string;
    toOrdinal: (n: number) => string;
}> {
    // Try exact locale match
    try {
        const mod = await import(`to-words/${locale}`);

        return new mod.ToWords();
    } catch {
        // Locale not found, try fallback
    }

    // Try language-code prefix (e.g., "en" → "en-US", "fr" → "fr-FR")
    const langCode = String(locale.split("-")[0]).toLowerCase();
    const langDefaults: Record<string, string> = {
        af: "af-ZA",
        am: "am-ET",
        ar: "ar-SA",
        az: "az-AZ",
        be: "be-BY",
        bg: "bg-BG",
        bn: "bn-IN",
        ca: "ca-ES",
        cs: "cs-CZ",
        da: "da-DK",
        de: "de-DE",
        ee: "ee-EE",
        el: "el-GR",
        en: "en-US",
        es: "es-ES",
        fa: "fa-IR",
        fi: "fi-FI",
        fil: "fil-PH",
        fr: "fr-FR",
        gu: "gu-IN",
        ha: "ha-NG",
        hbo: "hbo-IL",
        he: "he-IL",
        hi: "hi-IN",
        hr: "hr-HR",
        hu: "hu-HU",
        id: "id-ID",
        is: "is-IS",
        it: "it-IT",
        ja: "ja-JP",
        ka: "ka-GE",
        kn: "kn-IN",
        ko: "ko-KR",
        lt: "lt-LT",
        lv: "lv-LV",
        mr: "mr-IN",
        ms: "ms-MY",
        nb: "nb-NO",
        nl: "nl-NL",
        np: "np-NP",
        pa: "pa-IN",
        pl: "pl-PL",
        pt: "pt-BR",
        ro: "ro-RO",
        ru: "ru-RU",
        sk: "sk-SK",
        sl: "sl-SI",
        sq: "sq-AL",
        sr: "sr-RS",
        sv: "sv-SE",
        sw: "sw-KE",
        ta: "ta-IN",
        te: "te-IN",
        th: "th-TH",
        tr: "tr-TR",
        uk: "uk-UA",
        ur: "ur-PK",
        vi: "vi-VN",
        yo: "yo-NG",
        zh: "zh-CN",
    };

    const fallback = langDefaults[langCode];
    if (fallback && fallback !== locale) {
        try {
            const mod = await import(`to-words/${fallback}`);

            return new mod.ToWords();
        } catch {
            // Fallback locale not found either
        }
    }

    // Default to en-US
    const mod = await import("to-words/en-US");

    return new mod.ToWords();
}
