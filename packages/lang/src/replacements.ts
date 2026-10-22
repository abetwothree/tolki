import { swap, ucfirst, upper } from "@tolki/str";
import type { Replacements, StringableHandlers } from "@tolki/types";
import {
    hasOwnToString,
    isBoolean,
    isEnumCase,
    isFunction,
    isNull,
    isObject,
    isString,
    isUndefined,
    phpDebugType,
    phpStringCast,
    typeOf,
} from "@tolki/utils";

/**
 * Cast a replacement as PHP's string functions would.
 *
 * @param value - The replacement
 * @returns The string PHP would print
 * @throws TypeError when PHP cannot cast the value
 */
function castReplacement(value: unknown): string {
    if (isNull(value) || isUndefined(value)) {
        return "";
    }

    if (isString(value)) {
        return value;
    }

    // typeOf() keeps NaN, which PHP prints as NAN, where isNumber() would leave it to throw.
    if (
        typeOf(value) === "number" ||
        isBoolean(value) ||
        hasOwnToString(value)
    ) {
        return phpStringCast(value);
    }

    throw new TypeError(
        `mb_ucfirst(): Argument #1 ($string) must be of type string, ${phpDebugType(value)} given`,
    );
}

/**
 * Make the place-holder replacements on a line.
 *
 * @param line - The translation line
 * @param replace - The placeholder values, or tag callbacks keyed by tag name
 * @param handlers - Handlers keyed by the exact class of an object value
 * @returns The line with every placeholder replaced
 * @throws TypeError when a value is an array or an object with no string form
 *
 * @example
 *
 * makeReplacements("Hello :name", { name: "ann" }); -> "Hello ann"
 * makeReplacements(":Name :NAME", { name: "ann" }); -> "Ann ANN"
 * makeReplacements("<b>hi</b>", { b: (c) => `[${c}]` }); -> "[hi]"
 */
export function makeReplacements(
    line: string,
    replace: Replacements,
    handlers?: StringableHandlers,
): string {
    const entries = Object.entries(replace);

    if (entries.length === 0) {
        return line;
    }

    let result = phpStringCast(line);
    const shouldReplace: Record<string, string> = Object.create(null) as Record<
        string,
        string
    >;

    for (const [key, entry] of entries) {
        if (isFunction(entry)) {
            // PCRE's dot stops only at a newline, and a key is literal text.
            const escaped = key.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

            result = result.replace(
                new RegExp(`<${escaped}>([^\\n]*?)</${escaped}>`, "g"),
                (_match, children: string) => phpStringCast(entry(children)),
            );

            continue;
        }

        let value: unknown = entry;

        if (isObject(value)) {
            const handler = handlers?.get(
                Object.getPrototypeOf(value)?.constructor,
            );

            if (handler) {
                value = handler(value as never);
            } else if (isEnumCase(value)) {
                value = value.value;
            }
        }

        const cast = castReplacement(value);

        shouldReplace[":" + ucfirst(key)] = ucfirst(cast);
        shouldReplace[":" + upper(key)] = upper(cast);
        shouldReplace[":" + key] = cast;
    }

    return swap(shouldReplace, result);
}
