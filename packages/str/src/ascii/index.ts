import { transliterate as transliteration } from "transliteration";

/**
 * Transliterate a UTF-8 value to ASCII.
 *
 * @param value The value to transliterate.
 * @return The transliterated ASCII string.
 *
 * @requires {@link https://www.npmjs.com/package/transliteration transliteration package}
 *
 * @example
 *
 * ascii('Héllo Wörld'); -> 'Hello World'
 */
export function ascii(value: string): string {
    return transliteration(value);
}
