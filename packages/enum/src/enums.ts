import type { CaseValue, EnumConst, ToEnumResult } from "@tolki/types";

export function toEnum<
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
