import { format as numberFormat } from "@tolki/num";
import { isUndefined } from "@tolki/utils";
import pluralize from "pluralize";

export interface PluralizerRules {
    uncountable: string[];
}

let inflection: typeof pluralize;

const rules: PluralizerRules = {
    uncountable: [
        "audio",
        "bison",
        "cattle",
        "chassis",
        "compensation",
        "coreopsis",
        "data",
        "deer",
        "education",
        "emoji",
        "equipment",
        "evidence",
        "feedback",
        "firmware",
        "fish",
        "furniture",
        "gold",
        "hardware",
        "information",
        "jedi",
        "kin",
        "knowledge",
        "love",
        "metadata",
        "money",
        "moose",
        "news",
        "nutrition",
        "offspring",
        "plankton",
        "pokemon",
        "police",
        "rain",
        "recommended",
        "related",
        "rice",
        "series",
        "sheep",
        "software",
        "species",
        "swine",
        "traffic",
        "wheat",
    ],
};

/**
 * Pluralize the last word of an English, studly caps case string.
 *
 * @param value - The studly caps case string to pluralize
 * @param count - The count to determine pluralization (default: 2)
 * @returns The pluralized studly caps case string
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#pluralstudly
 *
 * @requires {@link https://www.npmjs.com/package/pluralize pluralize package}
 */
export function pluralStudly(value: string, count: number = 2): string {
    const parts = value.split(/(?=[A-Z])/);
    const lastWord = String(parts.pop());

    return parts.join("") + plural(lastWord, count);
}

/**
 * Pluralize the last word of an English, Pascal caps case string.
 *
 * @param value - The Pascal caps case string to pluralize
 * @param count - The count to determine pluralization (default: 2)
 * @returns The pluralized Pascal caps case string
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#pluralpascal
 *
 * @requires {@link https://www.npmjs.com/package/pluralize pluralize package}
 */
export function pluralPascal(value: string, count: number = 2): string {
    return pluralStudly(value, count);
}

/**
 * Get the plural form of an English word.
 *
 * @param value - The word to pluralize.
 * @param count - The count to determine pluralization (default: 2)
 * @param prependCount - Whether to prepend the count to the result (default: false)
 * @returns The pluralized word, optionally with the count prepended.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#plural
 *
 * @requires {@link https://www.npmjs.com/package/pluralize pluralize package}
 */
export function plural(
    value: string,
    count: number = 2,
    prependCount: boolean = false,
): string {
    return (
        (prependCount ? numberFormat(count) + " " : "") +
        pluralValue(value, count)
    );
}

/**
 * Get the plural form of an English word.
 *
 * @param value - The word to pluralize.
 * @param count - The count to determine pluralization.
 * @returns The pluralized word.
 *
 * @requires {@link https://www.npmjs.com/package/pluralize pluralize package}
 */
function pluralValue(value: string, count: number): string {
    if (Math.abs(count) === 1 || uncountable(value)) {
        return value;
    }

    const plural = inflector().plural(value);

    return matchCase(plural, value);
}

/**
 * Get the singular form of an English word.
 *
 * @param value - The word to singularize.
 * @returns The singular form of the word.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#singular
 *
 * @requires {@link https://www.npmjs.com/package/pluralize pluralize package}
 */
export function singular(value: string): string {
    const single = inflector().singular(value);

    return matchCase(single, value);
}

/**
 * Determine if the given value is uncountable.
 *
 * @param value - The word to check.
 * @returns True if the word is uncountable, false otherwise.
 *
 * @requires {@link https://www.npmjs.com/package/pluralize pluralize package}
 */
export function uncountable(value: string): boolean {
    return rules.uncountable.includes(value.toLowerCase());
}

/**
 * Determine if the given value is plural.
 *
 * @param value - The word to check.
 * @returns True if the word is plural, false otherwise.
 *
 * @requires {@link https://www.npmjs.com/package/pluralize pluralize package}
 */
export function isPlural(value: string = ""): boolean {
    return inflector().isPlural(value);
}

/**
 * Determine if the given value is singular.
 *
 * @param value - The word to check.
 * @returns True if the word is singular, false otherwise.
 *
 * @requires {@link https://www.npmjs.com/package/pluralize pluralize package}
 */
export function isSingular(value: string = ""): boolean {
    return inflector().isSingular(value);
}

/**
 * Attempt to match the case on two strings
 *
 * @param value - The string to adjust.
 * @param comparison - The string to match the case against.
 * @returns The adjusted string with matched case.
 */
export function matchCase(value: string, comparison: string): string {
    if (comparison.toLowerCase() === comparison) {
        return value.toLowerCase();
    }

    if (comparison.toUpperCase() === comparison) {
        return value.toUpperCase();
    }

    if (
        comparison[0] &&
        comparison[0].toUpperCase() + comparison.slice(1) === comparison
    ) {
        return (value[0] ?? "").toUpperCase() + value.slice(1);
    }

    return value;
}

/**
 * Get the pluralize instance
 *
 * @returns The pluralize instance.
 */
export function inflector(): typeof pluralize {
    if (isUndefined(inflection)) {
        inflection = pluralize;

        rules.uncountable.forEach((uncountable) =>
            inflection.addUncountableRule(uncountable),
        );
    }

    return inflection;
}
