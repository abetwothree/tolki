import type {
    ChoiceNumber,
    LangLines,
    Replacements,
    TranslationKey,
    TranslationResult,
} from "@tolki/types";

import type { Translator } from "./translator";

export type {
    ChoiceNumber,
    LangCountable as Countable,
    LangGroup,
    LangLines,
    LangValue,
    LocaleLines,
    LocalesResolver,
    MissingKeyHandler,
    Replacements,
    ReplacementValue,
    StringableHandlers,
    StringableType,
    TagCallback,
    TranslationArray,
    TranslationKey,
    TranslationResult,
    TranslationValue,
} from "@tolki/types";

/** The `__`, `trans` and `transChoice` helpers, bound to one translator. */
export interface TranslationHelpers<TLines extends LangLines = LangLines> {
    /**
     * Translate the given message.
     *
     * @param key - The key to look up; null answers null
     * @returns The null, or the translation
     */
    __(key?: null): null;
    __<TKey extends TranslationKey<TLines> | (string & {})>(
        key: TKey,
        replace?: Replacements,
        locale?: string | null,
    ): TranslationResult<TLines, TKey>;
    __<TKey extends TranslationKey<TLines> | (string & {})>(
        key?: TKey | null,
        replace?: Replacements,
        locale?: string | null,
    ): TranslationResult<TLines, TKey> | null;

    /**
     * Translate the given message.
     *
     * @param key - The key to look up; none answers the translator
     * @returns The translator, or the translation
     */
    trans(key?: null): Translator<TLines>;
    trans<TKey extends TranslationKey<TLines> | (string & {})>(
        key: TKey,
        replace?: Replacements,
        locale?: string | null,
    ): TranslationResult<TLines, TKey>;
    trans<TKey extends TranslationKey<TLines> | (string & {})>(
        key?: TKey | null,
        replace?: Replacements,
        locale?: string | null,
    ): Translator<TLines> | TranslationResult<TLines, TKey>;

    /**
     * Translates the given message based on a count.
     *
     * @param key - The key to look up
     * @param number - The number to choose a form for; a countable is counted
     * @returns The chosen form
     */
    transChoice(
        key: string,
        number: ChoiceNumber,
        replace?: Replacements,
        locale?: string | null,
    ): string;
}
