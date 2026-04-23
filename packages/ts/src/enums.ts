import type {
    AsEnum,
    CaseValue,
    DefineEnumResult,
    EnumConst,
    FromResult,
} from "@tolki/types";
import { isArray } from "@tolki/utils";

export type { AsEnum, CaseValue, DefineEnumResult, EnumConst, FromResult };

/**
 * Creates an enum instance from a case value similar to PHP's `BackedEnum::from()`
 *
 * It will remove all the cases and make the matching case's value available as `value`
 *
 * All instance methods will be flattened from an object of case keys & values to a key/value pair for the matched case.
 *
 * The enumObj is the published enum from the Laravel TypeScript Publish package.
 *
 * @see https://github.com/abetwothree/laravel-ts-publish#enum-metadata--tolki-enum-package
 * @see https://tolki.abe.dev/enums/enum-utilities-list.html#from
 *
 * @param enumObj - The enum const object to resolve from.
 * @param value - The case value to resolve. Must be one of the values defined in the enum const's cases.
 * @returns The resolved enum case with its associated methods and properties for the value provided.
 * @throws If the value does not match any case in the enum, an error is thrown.
 */
export function from<
    TEnum extends EnumConst,
    const TValue extends CaseValue<TEnum>,
>(enumObj: TEnum, value: TValue): FromResult<TEnum, TValue> {
    const caseKeys = new Set<string>(enumObj._cases ?? []);

    let matchedCaseName: string | undefined;
    for (const key of caseKeys) {
        if (enumObj[key] === value) {
            matchedCaseName = key;
            break;
        }
    }

    if (!matchedCaseName) {
        const values = Array.from(caseKeys).map((key) => enumObj[key]);
        throw new Error(
            `Value "${String(value)}" does not match any case in the enum. Values: ${values.join(", ")}, Cases: ${[...caseKeys].join(", ")}`,
        );
    }

    const result: Record<string, unknown> = { value };
    const methodKeys = new Set<string>(enumObj._methods ?? []);
    const rawHelpers = enumObj["_helpers"];
    const helperKeys = new Set<string>(
        isArray(rawHelpers) ? (rawHelpers as string[]) : [],
    );
    const ignoredKeys = new Set<string>([
        "_cases",
        "_methods",
        "_helpers",
        "_static",
    ]);

    for (const [key, val] of Object.entries(enumObj)) {
        if (ignoredKeys.has(key) || caseKeys.has(key) || helperKeys.has(key)) {
            continue;
        }

        if (methodKeys.has(key)) {
            result[key] = (val as Record<string, unknown>)[matchedCaseName];
        } else {
            result[key] = val;
        }
    }

    result["name"] = matchedCaseName;

    return result as FromResult<TEnum, TValue>;
}

/**
 * Similar to the {@linkcode from | from} function but returns null instead of throwing an error for invalid values.
 *
 * Mirrors PHP's `BackedEnum::tryFrom()`.
 *
 * @see https://tolki.abe.dev/enums/enum-utilities-list.html#tryfrom
 *
 * @param enumObj - The enum const object to resolve from.
 * @param value - The case value to resolve.
 * @returns The resolved enum case, or null if the value does not match any case.
 */
export function tryFrom<
    TEnum extends EnumConst,
    const TValue extends CaseValue<TEnum>,
>(enumObj: TEnum, value: TValue): FromResult<TEnum, TValue> | null {
    try {
        return from(enumObj, value);
    } catch {
        return null;
    }
}

/**
 * Returns all enum cases as resolved instances by running each case value through the {@linkcode from | from} function.
 *
 * Mirrors PHP's `BackedEnum::cases()`, returning one resolved instance per case defined in the enum const.
 *
 * @see https://tolki.abe.dev/enums/enum-utilities-list.html#cases
 *
 * @param enumObj - The enum const object to resolve all cases from.
 * @returns An array of resolved enum instances, one for each case.
 */
export function cases<TEnum extends EnumConst>(
    enumObj: TEnum,
): Array<FromResult<TEnum, CaseValue<TEnum>>> {
    return (enumObj._cases ?? []).map((caseKey) =>
        from(enumObj, enumObj[caseKey] as CaseValue<TEnum>),
    );
}

/**
 * Factory function that creates an enriched enum object
 *
 * It automatically binds Tolki helper methods {@linkcode from | from}, {@linkcode tryFrom | tryFrom}, and {@linkcode cases | cases}.
 *
 * This allows your published enum to have PHP-like enum behavior with type safety and autocompletion in TypeScript.
 *
 * The original enum data is preserved and the PHP like enum methods are attached directly to the returned object.
 *
 * @see https://tolki.abe.dev/enums/enum-utilities-list.html#defineenum
 *
 * @param enumObj - The raw enum const object to enrich.
 * @returns The enum object with `from`, `tryFrom`, and `cases` methods bound to it.
 */
export function defineEnum<const TEnum extends EnumConst>(
    enumObj: TEnum,
): DefineEnumResult<TEnum> {
    const helpers = {
        from: <const TValue extends CaseValue<TEnum>>(
            value: TValue,
        ): FromResult<TEnum, TValue> => {
            return from(enumObj, value);
        },
        tryFrom: <const TValue extends CaseValue<TEnum>>(
            value: TValue,
        ): FromResult<TEnum, TValue> | null => {
            return tryFrom(enumObj, value);
        },
        cases: (): Array<FromResult<TEnum, CaseValue<TEnum>>> => {
            return cases(enumObj);
        },
    };

    const _helpers = Object.keys(helpers);

    return Object.assign(
        Object.create(null) as Record<string, unknown>,
        enumObj,
        helpers,
        {
            _helpers,
        },
    ) as DefineEnumResult<TEnum>;
}
