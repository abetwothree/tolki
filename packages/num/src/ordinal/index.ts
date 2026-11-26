import { isInteger, isString, isUndefined } from "@tolki/utils";

import {
    type IndicatorName,
    type IndicatorRule,
    INDICATORS,
    type OrdinalRule,
    ordinalRule,
    type OrdinalText,
} from "./rules";

/**
 * The minus sign ICU's ordinal rules write, U+2212 rather than a hyphen.
 */
const MINUS = "\u2212";

/**
 * The largest 32-bit int, where ICU's cast of a larger double stops.
 */
const INT32_MAX = 2147483647;

/**
 * Convert a number to ordinal form the way PHP's `NumberFormatter::ORDINAL` does for a locale.
 *
 * @param value - The number to convert.
 * @param tag - A canonical BCP 47 tag the runtime supports.
 * @returns The ordinal, such as `1st`, `1º` or `第1`.
 */
/* @__NO_SIDE_EFFECTS__ */
export function formatOrdinal(value: number, tag: string): string {
    const rule = ordinalRule(tag);

    return writeOrdinal(
        rule.indirect === true && Object.is(value, -0) ? 0 : value,
        tag,
        rule,
    );
}

/**
 * Write a number with a rule set.
 *
 * @param value - The number to convert.
 * @param tag - The locale.
 * @param rule - The locale's rule set.
 * @returns The ordinal.
 */
function writeOrdinal(value: number, tag: string, rule: OrdinalRule): string {
    if (Number.isNaN(value) || value === Infinity) {
        return new Intl.NumberFormat(tag).format(value);
    }

    if (value === -Infinity) {
        const infinity = new Intl.NumberFormat(tag).format(Infinity);

        // A rule set reached through another drops the sign; PHP crashes on the `negative` rule sets.
        return rule.indirect === true
            ? infinity
            : `${rule.negative ?? MINUS}${infinity}`;
    }

    if (value < 0) {
        return isUndefined(rule.negative)
            ? `${MINUS}${writeOrdinal(-value, tag, rule)}`
            : `${rule.negative}${formatDigits(-value, tag, rule, 0)}`;
    }

    if (rule.fraction === true && !isInteger(value)) {
        return formatDigits(value, tag, rule, 1);
    }

    const whole = rule.whole?.[roundHalfUp(value)];

    if (!isUndefined(whole)) {
        return whole;
    }

    return `${rule.prefix ?? ""}${formatDigits(value, tag, rule, 0)}${ordinalText(rule.suffix, value, tag)}`;
}

/**
 * Pick the text beside the number.
 *
 * @param text - The rule set's text.
 * @param value - The number, zero or more.
 * @param tag - The locale.
 * @returns The text to write.
 */
function ordinalText(
    text: OrdinalText | undefined,
    value: number,
    tag: string,
): string {
    if (isUndefined(text)) {
        return "";
    }

    if (isString(text)) {
        return text;
    }

    if ("plural" in text) {
        return text.plural[ordinalCategory(value, tag)] ?? text.plural.other;
    }

    return indicatorText(text.indicator, value);
}

/**
 * Read an indicator rule set the way ICU's RBNF does.
 *
 * @param name - The rule set.
 * @param value - The number, zero or more.
 * @returns The rule's text.
 */
function indicatorText(name: IndicatorName, value: number): string {
    let rules = INDICATORS[name];
    let current = value;

    for (;;) {
        const rounded = roundHalfUp(current);
        const [base, text] = rules.findLast(
            ([from]) => from <= rounded,
        ) as IndicatorRule;

        if (isString(text)) {
            return text;
        }

        const divisor = 10 ** Math.floor(Math.log10(base));

        // ICU takes the remainder of the unrounded value; one that rounded up past the divisor makes ICU fail.
        current = current < divisor ? rounded % divisor : current % divisor;
        rules = INDICATORS[text.remainder];
    }
}

/**
 * Pick a number's ordinal plural category the way ICU's RBNF does.
 *
 * @param value - The number, zero or more.
 * @param tag - The locale.
 * @returns The category; `other` when the runtime has no ordinal rules for the locale, as ICU's root has none.
 */
function ordinalCategory(value: number, tag: string): Intl.LDMLPluralRule {
    if (Intl.PluralRules.supportedLocalesOf(tag).length === 0) {
        return "other";
    }

    return new Intl.PluralRules(tag, { type: "ordinal" }).select(
        pluralOperand(value),
    );
}

/**
 * Read the number ICU's RBNF picks a plural category by.
 *
 * @param value - The number, zero or more.
 * @returns A fraction below 1 rounded half up, any other number cast to a 32-bit int as ICU casts it.
 */
function pluralOperand(value: number): number {
    if (value < 1) {
        return roundHalfUp(value);
    }

    // A whole number reaches ICU's int32 cast through int64, which wraps; a fraction's cast from a double saturates.
    return isInteger(value)
        ? value | 0
        : Math.min(Math.trunc(value), INT32_MAX);
}

/**
 * Format the digits of a number with a rule's pattern, `#,##0` or `#,##,##0`.
 *
 * @param value - The number, zero or more.
 * @param tag - The locale, which gives the digits and the group separator.
 * @param rule - The rule set, which gives the grouping.
 * @param fractionDigits - The decimals to write.
 * @returns The digits.
 */
function formatDigits(
    value: number,
    tag: string,
    rule: OrdinalRule,
    fractionDigits: number,
): string {
    const parts = new Intl.NumberFormat(tag, {
        useGrouping: false,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
        roundingMode: "halfEven",
    }).formatToParts(value);

    // A pattern groups every number, where Intl's own grouping skips four-digit ones in some locales.
    const separator = (
        new Intl.NumberFormat(tag, { useGrouping: "always" })
            .formatToParts(1234567)
            .find((part) => part.type === "group") as Intl.NumberFormatPart
    ).value;

    return parts
        .map((part) => {
            return part.type === "integer"
                ? groupDigits(part.value, separator, rule.indian === true)
                : part.value;
        })
        .join("");
}

/**
 * Group a run of digits in threes, or in twos above the thousands.
 *
 * @param digits - The digits, which may be outside the Basic Multilingual Plane.
 * @param separator - The group separator.
 * @param indian - Whether to group in twos above the thousands.
 * @returns The grouped digits.
 */
function groupDigits(
    digits: string,
    separator: string,
    indian: boolean,
): string {
    const remaining = Array.from(digits);
    const groups: string[] = [];
    let size = 3;

    while (remaining.length > size) {
        groups.unshift(remaining.splice(-size).join(""));
        size = indian ? 2 : 3;
    }

    groups.unshift(remaining.join(""));

    return groups.join(separator);
}

/**
 * Round half up, as ICU picks a rule for a fraction.
 *
 * @param value - The number, zero or more.
 * @returns The rounded number.
 */
function roundHalfUp(value: number): number {
    return Math.floor(value + 0.5);
}
