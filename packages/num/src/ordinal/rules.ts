import { isUndefined } from "@tolki/utils";

/**
 * The text an ordinal rule writes beside the number.
 *
 * A string is written as is, `plural` picks by the number's ordinal plural category, and `indicator` by its value.
 */
export type OrdinalText =
    | string
    | { readonly plural: OrdinalPlural }
    | { readonly indicator: IndicatorName };

/**
 * The text for each ordinal plural category, as ICU's `$(ordinal,…)$` holds it.
 */
export type OrdinalPlural = Readonly<
    Partial<Record<Intl.LDMLPluralRule, string>>
> & { readonly other: string };

/**
 * The name of an RBNF indicator rule set.
 */
export type IndicatorName = "af" | "bg" | "bg-larger" | "ee";

/**
 * One rule of an indicator set: from `base` up, its text, or the set that reads the remainder by its power of ten.
 */
export type IndicatorRule = readonly [
    base: number,
    text: string | { readonly remainder: IndicatorName },
];

/**
 * ICU's default `%digits-ordinal` rule set for a locale, as the parts this port writes.
 */
export interface OrdinalRule {
    /** The text before the number. */
    readonly prefix?: string;
    /** The text after the number. */
    readonly suffix?: OrdinalText;
    /** The whole ordinal for a value that rounds to the key, as `ms` writes `No. 1`. */
    readonly whole?: Readonly<Record<number, string>>;
    /** Group digits in twos above the thousands, as `#,##,##0` does. */
    readonly indian?: true;
    /** Write a fraction with one decimal and no ordinal text, as an `x.x` rule does. */
    readonly fraction?: true;
    /** The text before a negative number written without its ordinal text; without it, U+2212 precedes the ordinal. */
    readonly negative?: string;
    /** The default rule hands the value to another rule set, which drops the sign of `-0` and `-INF`. */
    readonly indirect?: true;
}

/**
 * The indicator rule sets, each sorted by base. `bg` writes its `-` here, where ICU writes it in the rule.
 */
export const INDICATORS: Readonly<
    Record<IndicatorName, readonly IndicatorRule[]>
> = {
    af: [
        [0, "ste"],
        [1, "ste"],
        [2, "de"],
        [20, "ste"],
        [100, { remainder: "af" }],
    ],
    bg: [
        [0, "-и"],
        [1, "-ви"],
        [2, "-ри"],
        [3, "-ти"],
        [5, "-и"],
        [20, { remainder: "bg" }],
        [100, { remainder: "bg-larger" }],
        [1000, { remainder: "bg" }],
    ],
    "bg-larger": [
        [0, "-тен"],
        [1, { remainder: "bg" }],
        [100, { remainder: "bg-larger" }],
    ],
    ee: [
        [0, " lia"],
        [1, " tɔ"],
        [2, " lia"],
    ],
};

/**
 * ICU's root rule set, which every language without its own uses.
 */
export const ROOT_ORDINAL: OrdinalRule = {
    suffix: { plural: { one: "st", two: "nd", few: "rd", other: "th" } },
};

/**
 * The rule set that writes a period after the number.
 */
export const DOT_ORDINAL: OrdinalRule = { suffix: "." };

/**
 * The rule set of Arabic, Greek and Hebrew, which writes the number alone.
 */
const BARE_ORDINAL: OrdinalRule = {};

/**
 * The rule set of Chinese, Japanese and Cantonese, which writes `第` before the number.
 */
const CJK_ORDINAL: OrdinalRule = { prefix: "第", negative: "第\u2212" };

/**
 * The rule set of Spanish outside Spain, which writes `º.` where Spain writes `.º`.
 */
export const LATIN_AMERICAN_SPANISH_ORDINAL: OrdinalRule = {
    suffix: "º.",
    indirect: true,
};

/**
 * ICU's default ordinal rule sets other than the root, the period and Latin American Spanish, keyed like `DOT_KEYS`.
 */
export const ORDINAL_RULES: Readonly<Record<string, OrdinalRule>> = {
    af: { suffix: { indicator: "af" } },
    am: { suffix: "ኛ" },
    ar: BARE_ORDINAL,
    az: { suffix: "'inci" },
    bg: { suffix: { indicator: "bg" }, indirect: true },
    ca: {
        suffix: { plural: { one: "r", two: "n", few: "t", other: "è" } },
        indirect: true,
    },
    ee: { suffix: { indicator: "ee" } },
    el: BARE_ORDINAL,
    es: { suffix: ".º", indirect: true },
    fil: { prefix: "ika" },
    fr: { suffix: { plural: { one: "er", other: "e" } }, indirect: true },
    ga: { suffix: "ú" },
    gu: {
        suffix: {
            plural: {
                one: "લા",
                two: "જા",
                few: "થા",
                many: "્ઠા",
                other: "મા",
            },
        },
        indian: true,
        fraction: true,
        indirect: true,
    },
    he: BARE_ORDINAL,
    hi: {
        suffix: {
            plural: {
                one: "ला",
                two: "रा",
                few: "था",
                many: "ठा",
                other: "वाँ",
            },
        },
        indian: true,
        fraction: true,
        indirect: true,
    },
    "hi-Latn": ROOT_ORDINAL,
    id: { prefix: "ke-", negative: "\u2212ke-" },
    it: { suffix: "º", indirect: true },
    ja: CJK_ORDINAL,
    kk: { suffix: { plural: { many: "-шы", other: "-ші" } } },
    km: { prefix: "ទី" },
    ko: { suffix: "번째" },
    ky: { suffix: "'инчи" },
    lo: { prefix: "ที่\u200B", negative: "ที่\u2212" },
    ms: { prefix: "ke-", whole: { 1: "No. 1" }, negative: "\u2212ke-" },
    nl: { suffix: "e" },
    pt: { suffix: "º", indirect: true },
    ro: { suffix: "a" },
    ru: {},
    sv: { suffix: { plural: { one: ":a", other: ":e" } }, indirect: true },
    ta: { suffix: ".", indian: true },
    th: { prefix: "ที่\u00A0", negative: "ที่\u00A0\u2212" },
    uk: { suffix: { plural: { few: "-ій", other: "-ий" } }, indirect: true },
    vi: { prefix: "thứ " },
    yue: CJK_ORDINAL,
    zh: CJK_ORDINAL,
};

/**
 * The languages and script variants whose rule set writes a period after the number.
 */
export const DOT_KEYS: readonly string[] = [
    "ak",
    "az-Cyrl",
    "be",
    "bs",
    "ccp",
    "chr",
    "cs",
    "cy",
    "da",
    "de",
    "eo",
    "et",
    "fa",
    "ff",
    "fi",
    "fo",
    "hr",
    "hu",
    "hy",
    "is",
    "ka",
    "kk-Arab",
    "kl",
    "kok-Latn",
    "ks-Deva",
    "kxv-Deva",
    "kxv-Orya",
    "kxv-Telu",
    "lb",
    "lrc",
    "lt",
    "lv",
    "mk",
    "mt",
    "my",
    "ne",
    "nb",
    "nn",
    "no",
    "pa-Arab",
    "pl",
    "qu",
    "sd-Deva",
    "se",
    "shi-Latn",
    "sk",
    "sl",
    "sq",
    "sr",
    "su",
    "sw",
    "tr",
    "uz-Arab",
    "uz-Cyrl",
    "vai-Latn",
    "vec",
];

/**
 * The regions whose Spanish uses the Latin American rule set.
 */
export const LATIN_AMERICAN_REGIONS: readonly string[] = [
    "419",
    "AR",
    "BO",
    "BR",
    "BZ",
    "CL",
    "CO",
    "CR",
    "CU",
    "DO",
    "EC",
    "GT",
    "HN",
    "MX",
    "NI",
    "PA",
    "PE",
    "PR",
    "PY",
    "SV",
    "US",
    "UY",
    "VE",
];

/**
 * Find ICU's default ordinal rule set for a locale, reading its longest listed key as ICU's locale fallback does.
 *
 * @param tag - A canonical BCP 47 tag.
 * @returns The locale's rule set, or the root rule set.
 */
/* @__NO_SIDE_EFFECTS__ */
export function ordinalRule(tag: string): OrdinalRule {
    const { language, script, region } = new Intl.Locale(tag);

    if (
        language === "es" &&
        !isUndefined(region) &&
        LATIN_AMERICAN_REGIONS.includes(region)
    ) {
        return LATIN_AMERICAN_SPANISH_ORDINAL;
    }

    const keys = [
        [language, script, region],
        [language, script],
        [language, region],
        [language],
    ].map((parts) => parts.filter((part) => !isUndefined(part)).join("-"));

    for (const key of keys) {
        if (Object.hasOwn(ORDINAL_RULES, key)) {
            return ORDINAL_RULES[key] as OrdinalRule;
        }

        if (DOT_KEYS.includes(key)) {
            return DOT_ORDINAL;
        }
    }

    return ROOT_ORDINAL;
}
