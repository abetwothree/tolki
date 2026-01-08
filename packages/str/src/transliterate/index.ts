import anyAscii from "any-ascii";

/**
 * Transliterate a string to its closest ASCII representation.
 *
 * @example
 *
 * transliterate('ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ'); -> 'test@laravel.com'
 */
export function transliterate(value: string): string {
    return anyAscii(value);
}
