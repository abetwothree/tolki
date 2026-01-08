import { transliterate as transliteration } from "transliteration";

/**
 * Transliterate a UTF-8 value to ASCII.
 *
 * @example
 *
 * ascii('Héllo Wörld'); -> 'Hello World'
 */
export function ascii(value: string): string {
    return transliteration(value);
}
