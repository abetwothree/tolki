import type { LangLines, LangOptions } from "@tolki/types";
import type { App, InjectionKey, Plugin, WritableComputedRef } from "vue";
import { computed, inject, shallowRef } from "vue";

import { bindLang, createLang as createCoreLang } from "./lang";
import type {
    Lang,
    LangReader,
    RegisteredLines,
    TranslationHelpers,
} from "./types";

declare module "vue" {
    interface ComponentCustomProperties {
        __: TranslationHelpers<RegisteredLines>["__"];
        trans: TranslationHelpers<RegisteredLines>["trans"];
        transChoice: TranslationHelpers<RegisteredLines>["transChoice"];
    }
}

/** A lang that installs itself into a Vue app with `app.use()`. */
export type LangPlugin<TLines extends LangLines = RegisteredLines> =
    Lang<TLines> & Plugin<[]>;

/** The reads of a lang, tracked by Vue, with a locale to bind and set. */
export interface VueLang<
    TLines extends LangLines = RegisteredLines,
> extends LangReader<TLines> {
    /** The current locale; setting it loads the locale, then switches. */
    readonly locale: WritableComputedRef<string>;

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

const LANG_KEY: InjectionKey<VueLang<LangLines>> = Symbol("tolki-lang");

/**
 * Create a lang that installs into a Vue app and re-renders templates when its locale changes.
 *
 * @param options - The locale, fallback and where the lines come from
 * @returns The lang, usable as a plugin
 */
export function createLang<TLines extends LangLines = RegisteredLines>(
    options: LangOptions<TLines>,
): LangPlugin<TLines> {
    const lang = createCoreLang<TLines>(options);

    const plugin: LangPlugin<TLines> = {
        ...lang,
        install(app: App): void {
            const version = shallowRef(lang.getVersion());
            const unsubscribe = plugin.subscribe(() => {
                version.value = lang.getVersion();
            });
            const reader = bindLang(lang, () => version.value);
            const vueLang: VueLang<TLines> = {
                ...reader,
                locale: computed({
                    get: () => reader.getLocale(),
                    set: (value) => {
                        void lang.setLocale(value);
                    },
                }),
                setLocale: (locale) => lang.setLocale(locale),
                lang,
            };

            app.provide(LANG_KEY, vueLang as unknown as VueLang<LangLines>);
            app.config.globalProperties.__ = vueLang.__;
            app.config.globalProperties.trans = vueLang.trans;
            app.config.globalProperties.transChoice = vueLang.transChoice;
            app.onUnmount(unsubscribe);
        },
    };

    return plugin;
}

/**
 * Read the lang that `app.use(createLang(…))` installed.
 *
 * @returns The tracked reads, the locale ref and the lang itself
 * @throws Error when no lang was installed
 */
export function useLang<
    TLines extends LangLines = RegisteredLines,
>(): VueLang<TLines> {
    const vueLang = inject(LANG_KEY, null);

    if (vueLang === null) {
        throw new Error(
            "useLang() found no lang: install it with app.use(createLang(…)).",
        );
    }

    return vueLang as unknown as VueLang<TLines>;
}
