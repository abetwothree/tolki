import { lowerFirst, toLower, toUpper, upperFirst } from "@zinaid/utils";

export const CaseTypes = {
    upper: "upper",
    lower: "lower",
    title: "title",
    fold: "fold",
    simple: "simple",
    lower_simple: "lower_simple",
    title_simple: "title_simple",
    fold_simple: "fold_simple",
} as const;

export type ConvertCaseMode = (typeof CaseTypes)[keyof typeof CaseTypes];

/**
 * Convert the case of a string.
 *
 * @example
 *
 * convertCase('hello', CaseTypes.upper); -> 'HELLO'
 */
export function convertCase(
    value: string,
    mode: ConvertCaseMode = CaseTypes.fold,
): string {
    return caseConverter(value, mode);
}

/**
 * Convert the given string to upper-case.
 *
 * @example
 *
 * upper("foo bar baz"); -> "FOO BAR BAZ"
 * upper("foO bAr BaZ"); -> "FOO BAR BAZ"
 */
export function upper(value: string): string {
    return caseConverter(value, CaseTypes.upper);
}

/**
 * Convert the given string to proper case.
 *
 * @example
 *
 * title("foo bar baz"); -> "Foo Bar Baz"
 * title("foO bAr BaZ"); -> "Foo Bar Baz"
 */
export function title(value: string): string {
    return caseConverter(value, CaseTypes.title);
}

function caseConverter(value: string, mode: ConvertCaseMode): string {
    switch (mode) {
        case CaseTypes.upper:
            return toUpper(value);
        case CaseTypes.lower:
            return toLower(value);
        case CaseTypes.title:
            return value.replace(
                /\p{L}[\p{L}\p{M}\p{N}]*/gu,
                (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            );
        case CaseTypes.fold:
            return value.normalize("NFKD").toLowerCase();
        case CaseTypes.simple:
            return value.replace(/[^a-z0-9]+/g, " ").trim();
        case CaseTypes.lower_simple:
            return lowerFirst(value)
                .replace(/[^a-z0-9]+/g, " ")
                .trim();
        case CaseTypes.title_simple:
            return value
                .split(/[^a-z0-9]+/g)
                .map((word) => upperFirst(word))
                .join(" ");
        case CaseTypes.fold_simple:
            return value
                .normalize("NFKD")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .trim();
    }
}
