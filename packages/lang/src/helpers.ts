import type {
    ChoiceNumber,
    LangLines,
    Replacements,
    TranslationKey,
    TranslationResult,
    TranslationValue,
} from "@tolki/types";

import type { Translator } from "./translator";
import type { TranslationHelpers } from "./types";

/**
 * Create `__`, `trans` and `transChoice` bound to one translator.
 *
 * @param translator - The translator the helpers read
 * @returns The three helpers; none keeps state of its own
 *
 * @example
 *
 * const { __ } = createHelpers(new Translator({ en: { g: { a: "A" } } }, "en"));
 * __("g.a"); // "A"
 */
export function createHelpers<TLines extends LangLines>(
    translator: Translator<TLines>,
): TranslationHelpers<TLines> {
    /**
     * Translate the given message.
     *
     * @param key - The key to look up; null answers null
     * @param replace - The placeholder values
     * @param locale - The locale to read
     * @returns The translation, or null for a null key
     */
    function __(key?: null): null;
    function __<TKey extends TranslationKey<TLines> | (string & {})>(
        key: TKey,
        replace?: Replacements,
        locale?: string | null,
    ): TranslationResult<TLines, TKey>;
    function __<TKey extends TranslationKey<TLines> | (string & {})>(
        key?: TKey | null,
        replace?: Replacements,
        locale?: string | null,
    ): TranslationResult<TLines, TKey> | null;
    function __(
        key?: string | null,
        replace: Replacements = {},
        locale: string | null = null,
    ): TranslationValue | null {
        if (key === null || key === undefined) {
            return null;
        }

        return translator.get(key, replace, locale);
    }

    /**
     * Translate the given message.
     *
     * @param key - The key to look up; none answers the translator
     * @param replace - The placeholder values
     * @param locale - The locale to read
     * @returns The translator, or the translation
     */
    function trans(key?: null): Translator<TLines>;
    function trans<TKey extends TranslationKey<TLines> | (string & {})>(
        key: TKey,
        replace?: Replacements,
        locale?: string | null,
    ): TranslationResult<TLines, TKey>;
    function trans<TKey extends TranslationKey<TLines> | (string & {})>(
        key?: TKey | null,
        replace?: Replacements,
        locale?: string | null,
    ): Translator<TLines> | TranslationResult<TLines, TKey>;
    function trans(
        key?: string | null,
        replace: Replacements = {},
        locale: string | null = null,
    ): Translator<TLines> | TranslationValue {
        if (key === null || key === undefined) {
            return translator;
        }

        return translator.get(key, replace, locale);
    }

    /**
     * Translates the given message based on a count.
     *
     * @param key - The key to look up
     * @param number - The number to choose a form for; a countable is counted
     * @param replace - The placeholder values
     * @param locale - The locale to read
     * @returns The chosen form
     */
    function transChoice(
        key: string,
        number: ChoiceNumber,
        replace: Replacements = {},
        locale: string | null = null,
    ): string {
        return translator.choice(key, number, replace, locale);
    }

    return { __, trans, transChoice };
}
