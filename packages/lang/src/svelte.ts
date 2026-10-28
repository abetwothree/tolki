import type { LangLines } from "@tolki/types";
import { getContext, hasContext, setContext } from "svelte";
import { createSubscriber } from "svelte/reactivity";

import { bindLang } from "./lang";
import type { Lang, LangReader, RegisteredLines } from "./types";

export { createLang } from "./lang";

/** The reads of a lang, tracked by Svelte, with a locale to read, assign and set. */
export interface SvelteLang<
    TLines extends LangLines = RegisteredLines,
> extends LangReader<TLines> {
    /** The current locale; assigning it loads the locale, then switches. */
    locale: string;

    /**
     * Load a locale, then make it the current locale.
     *
     * @param locale - The locale to switch to
     * @returns A promise that settles once the switch happened or failed
     */
    setLocale(locale: string): Promise<void>;

    /** The framework-agnostic lang behind the reads. */
    readonly lang: Lang<TLines>;
}

const KEY = Symbol("@tolki/lang");

/**
 * Wrap a lang in reads that Svelte tracks.
 *
 * @param lang - The lang to wrap
 * @returns The tracked reads, the locale accessor and the lang itself
 */
function createSvelteLang<TLines extends LangLines>(
    lang: Lang<TLines>,
): SvelteLang<TLines> {
    const subscribe = createSubscriber((update) => lang.subscribe(update));
    const reader = bindLang(lang, subscribe);

    return {
        ...reader,
        get locale(): string {
            subscribe();

            return lang.getLocale();
        },
        set locale(value: string) {
            void lang.setLocale(value);
        },
        setLocale: (locale) => lang.setLocale(locale),
        lang,
    };
}

/**
 * Build the context to pass to `mount()`, `hydrate()` or `render()`.
 *
 * @param lang - The lang the components read
 * @returns A context map that `getLang()` finds
 */
export function langContext<TLines extends LangLines>(
    lang: Lang<TLines>,
): Map<symbol, SvelteLang<TLines>> {
    return new Map([[KEY, createSvelteLang(lang)]]);
}

/**
 * Hand a lang to every component below; call it while a component initializes.
 *
 * @param lang - The lang the components below read
 * @returns The tracked reads, the locale accessor and the lang itself
 */
export function setLang<TLines extends LangLines>(
    lang: Lang<TLines>,
): SvelteLang<TLines> {
    return setContext(KEY, createSvelteLang(lang));
}

/**
 * Read the lang of a parent's `setLang()` or of the `langContext()` passed to `mount()`.
 *
 * @returns The tracked reads, the locale accessor and the lang itself
 * @throws Error when no lang is in context
 */
export function getLang<
    TLines extends LangLines = RegisteredLines,
>(): SvelteLang<TLines> {
    if (!hasContext(KEY)) {
        throw new Error(
            "getLang() found no lang: call setLang(lang) in a parent component, or pass context: langContext(lang) to mount().",
        );
    }

    return getContext<SvelteLang<TLines>>(KEY);
}
