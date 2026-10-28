import type { LangLines } from "@tolki/types";
import { isNull } from "@tolki/utils";
import type { ReactElement, ReactNode } from "react";
import {
    createContext,
    createElement,
    use,
    useMemo,
    useSyncExternalStore,
} from "react";

import { bindLang } from "./lang";
import type { Lang, LangReader, RegisteredLines } from "./types";

export { createLang } from "./lang";

/** The props of the provider that hands a lang to the tree below it. */
export interface LangProviderProps {
    /** The lang the tree below reads. */
    readonly lang: Lang<LangLines>;
    readonly children?: ReactNode;
}

/** The reads of a lang, rebuilt on every change, with the locale to read and set. */
export interface ReactLang<
    TLines extends LangLines = RegisteredLines,
> extends LangReader<TLines> {
    /** The current locale. */
    readonly locale: string;

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

/** Do nothing; the version snapshot tracks changes, so reads need no tracker. */
function noop(): void {}

const LangContext = createContext<Lang<LangLines> | null>(null);

/**
 * Hand a lang to every component below.
 *
 * @param props - The lang and the tree that reads it
 * @returns The provider element
 */
export function LangProvider(props: LangProviderProps): ReactElement {
    return createElement(LangContext, { value: props.lang }, props.children);
}

/**
 * Read the lang of the nearest provider; the component renders again when the lang changes.
 *
 * @returns The reads, the locale, `setLocale` and the lang itself
 * @throws Error when no provider is above the component
 */
export function useLang<
    TLines extends LangLines = RegisteredLines,
>(): ReactLang<TLines> {
    const lang = use(LangContext);

    if (isNull(lang)) {
        throw new Error(
            "useLang() found no lang: wrap the tree in <LangProvider lang={…}>.",
        );
    }

    // The server snapshot is required during SSR; the version is the same on both sides.
    const version = useSyncExternalStore(
        lang.subscribe,
        lang.getVersion,
        lang.getVersion,
    );

    // version is the invalidation key: a new snapshot hands memoized children a new __.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(
        () =>
            ({
                ...bindLang(lang, noop),
                locale: lang.getLocale(),
                setLocale: lang.setLocale,
                lang,
            }) as unknown as ReactLang<TLines>,
        [lang, version],
    );
}
