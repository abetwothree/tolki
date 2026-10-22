import {
    compareValues,
    isPhpNumeric,
    looseEqual,
    phpIntCast,
} from "@tolki/utils";

/**
 * A plural rule: the index of the form to use for a number.
 */
type PluralRule = (number: unknown) => number;

/**
 * Select a proper translation string based on the given number.
 *
 * @param line - The line holding the forms, separated by pipes.
 * @param number - The number to choose a form for.
 * @param locale - The locale whose plural rule applies.
 * @returns The chosen form.
 *
 * @example
 *
 * choose("{0} none|one|[2,*] many", 5, "en"); // "many"
 */
export function choose(
    line: string,
    number: number,
    locale: string | null,
): string {
    const segments = line.split("|");

    const value = extract(segments, number);

    if (value !== null) {
        return phpTrim(value);
    }

    const stripped = stripConditions(segments);

    const pluralIndex = getPluralIndex(locale, number);

    // split() always yields a first segment.
    return stripped[pluralIndex] ?? (stripped[0] as string);
}

/**
 * Extract a translation string using inline conditions.
 *
 * @param segments - The pipe-separated segments.
 * @param number - The number the conditions are tested against.
 * @returns The first matching segment's text, or null.
 */
function extract(segments: string[], number: number): string | null {
    for (const part of segments) {
        const line = extractFromString(part, number);

        if (line !== null) {
            return line;
        }
    }

    return null;
}

/**
 * Get the translation string if the condition matches.
 *
 * @param part - One segment.
 * @param number - The number the condition is tested against.
 * @returns The segment's text when its condition matches, otherwise null.
 */
function extractFromString(part: string, number: number): string | null {
    const matches = /^[{[]([-?\d|*,.*]*)[}\]](.*)/s.exec(part);

    if (matches === null) {
        return null;
    }

    const condition = matches[1] as string;

    const value = matches[2] as string;

    if (condition.includes(",")) {
        const comma = condition.indexOf(",");
        const from = condition.slice(0, comma);
        const to = condition.slice(comma + 1);

        if (to === "*" && atMost(from, number)) {
            return value;
        } else if (from === "*" && atMost(number, to)) {
            return value;
        } else if (atMost(from, number) && atMost(number, to)) {
            return value;
        }
    }

    return looseEqual(condition, number) ? value : null;
}

/**
 * Determine if `$left <= $right` holds in PHP, which also reads `$a >= $b` as `$b <= $a`.
 *
 * @param left - The left operand.
 * @param right - The right operand.
 * @returns Whether the left operand is at most the right one.
 */
function atMost(left: unknown, right: unknown): boolean {
    return compareValues(left, right) <= 0;
}

/**
 * Strip the inline conditions from each segment, just leaving the text.
 *
 * @param segments - The pipe-separated segments.
 * @returns The segments without their conditions.
 */
function stripConditions(segments: string[]): string[] {
    return segments.map((part) => {
        return part.replace(/^[{[][-?\d|*,.*]*[}\]]/, "");
    });
}

/**
 * Get the index to use for pluralization.
 *
 * The plural rules are derived from code of the Zend Framework (2010-09-25), which
 * is subject to the new BSD license (https://framework.zend.com/license)
 * Copyright (c) 2005-2010 - Zend Technologies USA Inc. (http://www.zend.com)
 *
 * @param locale - The locale, spelled as Laravel does (`en_US`, not `en-US`).
 * @param number - The number to find the form index for.
 * @returns The index of the form to use; 0 for an unknown or null locale.
 *
 * @example
 *
 * getPluralIndex("ru", 5); // 2
 */
export function getPluralIndex(locale: string | null, number: number): number {
    const value = isPhpNumeric(number) ? Math.abs(Number(number)) : number;

    if (locale === null) {
        return 0;
    }

    return PLURAL_RULES.get(locale)?.(value) ?? 0;
}

/**
 * Cast a number the way PHP's `(int)` does, where null is 0.
 */
function int(number: unknown): number {
    return phpIntCast(Number(number));
}

const first: PluralRule = () => {
    return 0;
};

const pair: PluralRule = (n) => {
    return looseEqual(n, 1) ? 0 : 1;
};

const frenchLike: PluralRule = (n) => {
    return looseEqual(n, 0) || looseEqual(n, 1) ? 0 : 1;
};

const slavic: PluralRule = (n) => {
    if (int(n) % 10 === 1 && int(n) % 100 !== 11) {
        return 0;
    }

    return int(n) % 10 >= 2 &&
        int(n) % 10 <= 4 &&
        (int(n) % 100 < 10 || int(n) % 100 >= 20)
        ? 1
        : 2;
};

const czech: PluralRule = (n) => {
    if (looseEqual(n, 1)) {
        return 0;
    }

    return compareValues(n, 2) >= 0 && compareValues(n, 4) <= 0 ? 1 : 2;
};

const irish: PluralRule = (n) => {
    if (looseEqual(n, 1)) {
        return 0;
    }

    return looseEqual(n, 2) ? 1 : 2;
};

const lithuanian: PluralRule = (n) => {
    if (int(n) % 10 === 1 && int(n) % 100 !== 11) {
        return 0;
    }

    return int(n) % 10 >= 2 && (int(n) % 100 < 10 || int(n) % 100 >= 20)
        ? 1
        : 2;
};

const slovenian: PluralRule = (n) => {
    if (int(n) % 100 === 1) {
        return 0;
    }

    if (int(n) % 100 === 2) {
        return 1;
    }

    return int(n) % 100 === 3 || int(n) % 100 === 4 ? 2 : 3;
};

const macedonian: PluralRule = (n) => {
    return int(n) % 10 === 1 ? 0 : 1;
};

const maltese: PluralRule = (n) => {
    if (looseEqual(n, 1)) {
        return 0;
    }

    if (looseEqual(n, 0) || (int(n) % 100 > 1 && int(n) % 100 < 11)) {
        return 1;
    }

    return int(n) % 100 > 10 && int(n) % 100 < 20 ? 2 : 3;
};

const latvian: PluralRule = (n) => {
    if (looseEqual(n, 0)) {
        return 0;
    }

    return int(n) % 10 === 1 && int(n) % 100 !== 11 ? 1 : 2;
};

const polish: PluralRule = (n) => {
    if (looseEqual(n, 1)) {
        return 0;
    }

    return int(n) % 10 >= 2 &&
        int(n) % 10 <= 4 &&
        (int(n) % 100 < 12 || int(n) % 100 > 14)
        ? 1
        : 2;
};

const welsh: PluralRule = (n) => {
    if (looseEqual(n, 1)) {
        return 0;
    }

    if (looseEqual(n, 2)) {
        return 1;
    }

    return looseEqual(n, 8) || looseEqual(n, 11) ? 2 : 3;
};

const romanian: PluralRule = (n) => {
    if (looseEqual(n, 1)) {
        return 0;
    }

    return looseEqual(n, 0) || (int(n) % 100 > 0 && int(n) % 100 < 20) ? 1 : 2;
};

const arabic: PluralRule = (n) => {
    if (looseEqual(n, 0)) {
        return 0;
    }

    if (looseEqual(n, 1)) {
        return 1;
    }

    if (looseEqual(n, 2)) {
        return 2;
    }

    if (int(n) % 100 >= 3 && int(n) % 100 <= 10) {
        return 3;
    }

    return int(n) % 100 >= 11 && int(n) % 100 <= 99 ? 4 : 5;
};

/**
 * The locales each plural rule covers, in the order of Laravel's `switch`.
 */
const LOCALE_RULES: [string[], PluralRule][] = [
    [
        [
            "az",
            "az_AZ",
            "bo",
            "bo_CN",
            "bo_IN",
            "dz",
            "dz_BT",
            "id",
            "id_ID",
            "ja",
            "ja_JP",
            "jv",
            "ka",
            "ka_GE",
            "km",
            "km_KH",
            "kn",
            "kn_IN",
            "ko",
            "ko_KR",
            "ms",
            "ms_MY",
            "th",
            "th_TH",
            "tr",
            "tr_CY",
            "tr_TR",
            "vi",
            "vi_VN",
            "zh",
            "zh_CN",
            "zh_HK",
            "zh_SG",
            "zh_TW",
        ],
        first,
    ],
    [
        [
            "af",
            "af_ZA",
            "bn",
            "bn_BD",
            "bn_IN",
            "bg",
            "bg_BG",
            "ca",
            "ca_AD",
            "ca_ES",
            "ca_FR",
            "ca_IT",
            "da",
            "da_DK",
            "de",
            "de_AT",
            "de_BE",
            "de_CH",
            "de_DE",
            "de_LI",
            "de_LU",
            "el",
            "el_CY",
            "el_GR",
            "en",
            "en_AG",
            "en_AU",
            "en_BW",
            "en_CA",
            "en_DK",
            "en_GB",
            "en_HK",
            "en_IE",
            "en_IN",
            "en_NG",
            "en_NZ",
            "en_PH",
            "en_SG",
            "en_US",
            "en_ZA",
            "en_ZM",
            "en_ZW",
            "eo",
            "eo_US",
            "es",
            "es_AR",
            "es_BO",
            "es_CL",
            "es_CO",
            "es_CR",
            "es_CU",
            "es_DO",
            "es_EC",
            "es_ES",
            "es_GT",
            "es_HN",
            "es_MX",
            "es_NI",
            "es_PA",
            "es_PE",
            "es_PR",
            "es_PY",
            "es_SV",
            "es_US",
            "es_UY",
            "es_VE",
            "et",
            "et_EE",
            "eu",
            "eu_ES",
            "eu_FR",
            "fa",
            "fa_IR",
            "fi",
            "fi_FI",
            "fo",
            "fo_FO",
            "fur",
            "fur_IT",
            "fy",
            "fy_DE",
            "fy_NL",
            "gl",
            "gl_ES",
            "gu",
            "gu_IN",
            "ha",
            "ha_NG",
            "he",
            "he_IL",
            "hu",
            "hu_HU",
            "is",
            "is_IS",
            "it",
            "it_CH",
            "it_IT",
            "ku",
            "ku_TR",
            "lb",
            "lb_LU",
            "ml",
            "ml_IN",
            "mn",
            "mn_MN",
            "mr",
            "mr_IN",
            "nah",
            "nb",
            "nb_NO",
            "ne",
            "ne_NP",
            "nl",
            "nl_AW",
            "nl_BE",
            "nl_NL",
            "nn",
            "nn_NO",
            "no",
            "om",
            "om_ET",
            "om_KE",
            "or",
            "or_IN",
            "pa",
            "pa_IN",
            "pa_PK",
            "pap",
            "pap_AN",
            "pap_AW",
            "pap_CW",
            "ps",
            "ps_AF",
            "pt",
            "pt_BR",
            "pt_PT",
            "so",
            "so_DJ",
            "so_ET",
            "so_KE",
            "so_SO",
            "sq",
            "sq_AL",
            "sq_MK",
            "sv",
            "sv_FI",
            "sv_SE",
            "sw",
            "sw_KE",
            "sw_TZ",
            "ta",
            "ta_IN",
            "ta_LK",
            "te",
            "te_IN",
            "tk",
            "tk_TM",
            "ur",
            "ur_IN",
            "ur_PK",
            "zu",
            "zu_ZA",
        ],
        pair,
    ],
    [
        [
            "am",
            "am_ET",
            "bh",
            "fil",
            "fil_PH",
            "fr",
            "fr_BE",
            "fr_CA",
            "fr_CH",
            "fr_FR",
            "fr_LU",
            "gun",
            "hi",
            "hi_IN",
            "hy",
            "hy_AM",
            "ln",
            "ln_CD",
            "mg",
            "mg_MG",
            "nso",
            "nso_ZA",
            "ti",
            "ti_ER",
            "ti_ET",
            "wa",
            "wa_BE",
            "xbr",
        ],
        frenchLike,
    ],
    [
        [
            "be",
            "be_BY",
            "bs",
            "bs_BA",
            "hr",
            "hr_HR",
            "ru",
            "ru_RU",
            "ru_UA",
            "sr",
            "sr_ME",
            "sr_RS",
            "uk",
            "uk_UA",
        ],
        slavic,
    ],
    [["cs", "cs_CZ", "sk", "sk_SK"], czech],
    [["ga", "ga_IE"], irish],
    [["lt", "lt_LT"], lithuanian],
    [["sl", "sl_SI"], slovenian],
    [["mk", "mk_MK"], macedonian],
    [["mt", "mt_MT"], maltese],
    [["lv", "lv_LV"], latvian],
    [["pl", "pl_PL"], polish],
    [["cy", "cy_GB"], welsh],
    [["ro", "ro_RO"], romanian],
    [
        [
            "ar",
            "ar_AE",
            "ar_BH",
            "ar_DZ",
            "ar_EG",
            "ar_IN",
            "ar_IQ",
            "ar_JO",
            "ar_KW",
            "ar_LB",
            "ar_LY",
            "ar_MA",
            "ar_OM",
            "ar_QA",
            "ar_SA",
            "ar_SD",
            "ar_SS",
            "ar_SY",
            "ar_TN",
            "ar_YE",
        ],
        arabic,
    ],
];

const PLURAL_RULES = new Map<string, PluralRule>(
    LOCALE_RULES.flatMap(([locales, rule]) => {
        return locales.map((locale): [string, PluralRule] => [locale, rule]);
    }),
);

/**
 * Trim the characters PHP's `trim()` strips by default; `String.prototype.trim` strips more.
 */
function phpTrim(value: string): string {
    const characters = " \t\n\r\0\x0B";

    let start = 0;
    let end = value.length;

    while (start < end && characters.includes(value.charAt(start))) {
        start++;
    }

    while (end > start && characters.includes(value.charAt(end - 1))) {
        end--;
    }

    return value.slice(start, end);
}
