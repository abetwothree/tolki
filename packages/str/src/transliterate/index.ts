import anyAscii from "any-ascii";

/**
 * Transliterate a string to its closest ASCII representation.
 *
 * @param value The value to transliterate.
 * @return The transliterated ASCII string.
 *
 * @example
 *
 * transliterate('ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ'); -> 'test@laravel.com'
 */
export function transliterate(value: string): string {
    return anyAscii(value);
}
