import type { CaseValue, EnumConst, ToEnumResult } from "@tolki/types";

/**
 * Resolves an enum case from a given value.
 * 
 * The enumObj is the published version from the Laravel TypeScript Publish package.
 * 
 * @see https://github.com/abetwothree/laravel-ts-publish#enum-metadata--tolki-enum-package
 * 
 * @param enumObj - The enum const object to resolve from.
 * @param value - The case value to resolve. Must be one of the values defined in the enum const's cases.
 * @returns The resolved enum case with its associated methods and properties for the value provided.
 * @throws If the value does not match any case in the enum, an error is thrown.
 */
export function from<
    TEnum extends EnumConst,
    const TValue extends CaseValue<TEnum>,
>(enumObj: TEnum, value: TValue): ToEnumResult<TEnum, TValue> {
    const caseKeys = new Set<string>(enumObj._cases);

    let matchedCaseName: string | undefined;
    for (const key of caseKeys) {
        if (enumObj[key] === value) {
            matchedCaseName = key;
            break;
        }
    }

    if (!matchedCaseName) {
        throw new Error(
            `Value "${String(value)}" does not match any case in the enum. Cases: ${[...caseKeys].join(", ")}`,
        );
    }

    const result: Record<string, unknown> = { value };
    const methodKeys = new Set<string>(enumObj._methods);

    for (const [key, val] of Object.entries(enumObj)) {
        if (key === "_cases" || key === "_methods" || caseKeys.has(key)) {
            continue;
        }

        if (methodKeys.has(key)) {
            result[key] = (val as Record<string, unknown>)[matchedCaseName];
        } else {
            result[key] = val;
        }
    }

    return result as ToEnumResult<TEnum, TValue>;
}
