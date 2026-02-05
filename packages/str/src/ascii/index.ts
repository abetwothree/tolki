import { lower } from "@tolki/str";
import { transliterate as transliteration } from "transliteration";

/**
 * Transliterate a UTF-8 value to ASCII.
 *
 * @param value The value to transliterate.
 * @return The transliterated ASCII string.
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#afterLast
 *
 * @requires {@link https://www.npmjs.com/package/transliteration transliteration package}
 */
export function ascii(value: string): string {
    return transliteration(value);
}

/**
 * Generate a URL friendly "slug" from a given string.
 *
 * @param title - The string to convert to a slug
 * @param separator - The word separator to use (default: "-")
 * @param dictionary - An optional dictionary of replacements
 * @returns The generated slug string
 *
 * @see https://tolki.abe.dev/strings/string-utilities-list.html#slug
 *
 * @requires {@link https://www.npmjs.com/package/transliteration transliteration package}
 */
export function slug(
    title: string,
    separator: string = "-",
    dictionary: Record<string, string> = { "@": "at" },
): string {
    const sep = separator;

    const escapeForCharClass = (s: string) =>
        s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");

    const escapeForLiteral = (s: string) =>
        s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const process = (input: string): string => {
        let out = input;

        // Convert all dashes/underscores into the configured separator
        const flip = sep === "-" ? "_" : "-";
        const flipRe = new RegExp(`[${escapeForCharClass(flip)}]+`, "gu");
        out = out.replace(flipRe, sep);

        // Replace dictionary words (surrounded by separators per Laravel)
        const replaced: Record<string, string> = {};
        for (const [key, value] of Object.entries(dictionary)) {
            replaced[key] = sep + value + sep;
        }

        for (const [key, value] of Object.entries(replaced)) {
            if (key === "") {
                continue;
            }
            out = out.split(key).join(value);
        }

        // Lowercase then remove all characters that are not the separator, letters, numbers, or whitespace
        out = lower(out);

        if (sep === "") {
            out = out.replace(/[^\p{L}\p{N}\s]+/gu, "");
            out = out.replace(/[\s]+/gu, "");
            return out;
        } else {
            const notAllowed = new RegExp(
                `[^${escapeForCharClass(sep)}\\p{L}\\p{N}\\s]+`,
                "gu",
            );
            out = out.replace(notAllowed, "");

            const collapse = new RegExp(
                `[${escapeForCharClass(sep)}\\s]+`,
                "gu",
            );
            out = out.replace(collapse, sep);

            const trimEdges = new RegExp(
                `^${escapeForLiteral(sep)}+|${escapeForLiteral(sep)}+$`,
                "gu",
            );
            out = out.replace(trimEdges, "");

            return out;
        }
    };

    // Compute both variants: keep script vs ASCII transliteration
    const nonAscii = process(title);
    const asciiVariant = process(ascii(title));

    // Heuristic: If any dictionary key (likely ASCII) appears in the ASCII transliteration,
    // prefer the ASCII variant so that replacements like 'llh' => 'allah' can take effect.
    const keys = Object.keys(dictionary);
    const hasAlphaNumKey = keys.some((k) => /[A-Za-z0-9]/.test(k));

    return hasAlphaNumKey ? asciiVariant : nonAscii;
}
