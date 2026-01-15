import { lowerFirst, toLower, toUpper, upperFirst } from "@tolki/utils";

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
 * @param value - The string to convert.
 * @param mode - The case conversion mode to apply. Defaults to 'fold'.
 * @returns The converted string.
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
 * @param value - The string to convert.
 * @returns The upper-case string.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#upper
 */
export function upper(value: string): string {
    return caseConverter(value, CaseTypes.upper);
}

/**
 * Convert the given string to proper case.
 *
 * @param value - The string to convert.
 * @returns The proper-case string.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#title
 */
export function title(value: string): string {
    return caseConverter(value, CaseTypes.title);
}

/**
 * Convert the given string to the specified case.
 *
 * @param value - The string to convert.
 * @param mode - The case conversion mode to apply.
 * @returns The converted string.
 */
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
