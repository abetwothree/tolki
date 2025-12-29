import { format as numberFormat } from "@laravel-js/num";
import { isUndefined } from "@laravel-js/utils";
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
 * Get the plural form of an English word.
 *
 * @example
 *
 * plural("child"); -> "children"
 * plural("apple", 1); -> "apple"
 * plural("apple", 2, true); -> "2 apples"
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
 */
export function singular(value: string): string {
    const single = inflector().singular(value);

    return matchCase(single, value);
}

/**
 * Determine if the given value is uncountable.
 */
export function uncountable(value: string): boolean {
    return rules.uncountable.includes(value.toLowerCase());
}

/**
 * Determine if the given value is plural.
 */
export function isPlural(value: string = ""): boolean {
    return inflector().isPlural(value);
}

/**
 * Determine if the given value is singular.
 */
export function isSingular(value: string = ""): boolean {
    return inflector().isSingular(value);
}

/**
 * Attempt to match the case on two strings
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
