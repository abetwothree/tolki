import pluralize from "pluralize";

export interface PluralizerRules {
    plural: Record<string, string>;
    singular: Record<string, string>;
    irregular: Record<string, string>;
    uncountable: string[];
}

export class Pluralizer {
    static inflection: typeof pluralize;

    static rules: PluralizerRules = {
        plural: {},
        singular: {},
        irregular: {},
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
     */
    static plural(value: string, count: number = 2): string {
        if (Math.abs(count) === 1 || Pluralizer.uncountable(value)) {
            return value;
        }

        const plural = Pluralizer.inflector().plural(value);

        return Pluralizer.matchCase(plural, value);
    }

    /**
     * Get the singular form of an English word.
     */
    static singular(value: string): string {
        const single = Pluralizer.inflector().singular(value);

        return Pluralizer.matchCase(single, value);
    }

    /**
     * Determine if the given value is uncountable.
     */
    static uncountable(value: string): boolean {
        return Pluralizer.rules.uncountable.includes(value.toLowerCase());
    }

    /**
     * Determine if the given value is plural.
     */
    static isPlural(value: string = ""): boolean {
        return Pluralizer.inflector().isPlural(value);
    }

    /**
     * Determine if the given value is singular.
     */
    static isSingular(value: string = ""): boolean {
        return Pluralizer.inflector().isSingular(value);
    }

    /**
     * Attempt to match the case on two strings
     */
    static matchCase(value: string, comparison: string): string {
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
    static inflector(): typeof pluralize {
        if (typeof Pluralizer.inflection === "undefined") {
            Pluralizer.inflection = pluralize;

            Pluralizer.rules.uncountable.forEach((uncountable) =>
                Pluralizer.inflection.addUncountableRule(uncountable),
            );
            Object.entries(Pluralizer.rules.plural).forEach(([plural, rule]) =>
                Pluralizer.inflection.addIrregularRule(rule, plural),
            );
            Object.entries(Pluralizer.rules.singular).forEach(
                ([singular, rule]) =>
                    Pluralizer.inflection.addIrregularRule(rule, singular),
            );
            Object.entries(Pluralizer.rules.irregular).forEach(
                ([irregularity, rule]) =>
                    Pluralizer.inflection.addIrregularRule(rule, irregularity),
            );
        }

        return Pluralizer.inflection;
    }
}
