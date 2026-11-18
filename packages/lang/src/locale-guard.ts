import { contains } from "@tolki/str";
import { InvalidArgumentException } from "@tolki/utils";

/**
 * Refuse a locale that could walk out of the lang directory.
 *
 * @sideEffects asserts called to throw on a locale holding a path character
 *
 * @param locale - The locale to check
 * @throws InvalidArgumentException when the locale holds `/`, `\`, `..` or a NUL byte
 */
export function assertLocale(locale: string): void {
    if (contains(locale, ["/", "\\", "..", "\0"])) {
        throw new InvalidArgumentException(
            "Invalid characters present in locale.",
        );
    }
}
