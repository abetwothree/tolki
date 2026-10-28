import type {
    LangLines,
    LangOptions,
    LocaleLines,
    LocaleModule,
} from "@tolki/types";
import { isPlainObject, isString, isUndefined } from "@tolki/utils";

import { createHelpers } from "./helpers";
import { assertLocale } from "./locale-guard";
import { Translator } from "./translator";
import type {
    Lang,
    LangReader,
    RegisteredLines,
    TranslationHelpers,
} from "./types";

/**
 * Take a locale's lines out of what a loader answered.
 *
 * @param locale - The locale that was loaded
 * @param loaded - The lines, or the module namespace `import()` answers
 * @returns The locale's lines
 * @throws TypeError when the answer is not an object of lines
 */
function linesOf(
    locale: string,
    loaded: LocaleLines | LocaleModule,
): LocaleLines {
    // A module namespace has no prototype, so only its tag tells it from a locale with a group named `default`.
    const lines =
        Object.prototype.toString.call(loaded) === "[object Module]"
            ? (loaded as LocaleModule).default
            : loaded;

    if (!isPlainObject(lines)) {
        throw new TypeError(
            `The lines loaded for locale "${locale}" are not an object.`,
        );
    }

    return lines as LocaleLines;
}

/**
 * Create a translator that loads locales on demand and tells subscribers when its answers change.
 *
 * @param options - The starting locale and fallback, the lines at hand, and how to fetch more
 * @returns The translator with its reads, its loaders and a way to subscribe
 * @throws InvalidArgumentException when the locale or fallback holds a path character
 * @throws Error when a synchronous loader throws
 *
 * @example
 *
 * const lang = createLang({ locale: "en", lines: { en: { Hello: "Hello" } } });
 * lang.__("Hello"); // "Hello"
 */
export function createLang<TLines extends LangLines = RegisteredLines>(
    options: LangOptions<TLines>,
): Lang<TLines> {
    assertLocale(options.locale);

    if (!isUndefined(options.fallback) && options.fallback !== null) {
        assertLocale(options.fallback);
    }

    const translator = new Translator<TLines>(
        options.lines ?? ({} as TLines),
        options.locale,
    );

    translator.setFallback(options.fallback ?? null);

    const helpers = createHelpers(translator);
    const loaded = new Set(Object.keys(options.lines ?? {}));
    const inFlight = new Map<string, Promise<void>>();
    const listeners = new Set<() => void>();
    let version = 0;
    let latestSwitch = 0;

    /**
     * Add a loaded locale's lines to the translator, keeping the lines the app added itself.
     *
     * @param locale - The locale the lines belong to
     * @param answer - What the loader answered
     */
    function apply(locale: string, answer: LocaleLines | LocaleModule): void {
        for (const [key, value] of Object.entries(linesOf(locale, answer))) {
            // addLines reads a key without a dot as an item of the group "", so a group goes in item by item.
            const entries = isString(value)
                ? { [`*.${key}`]: value }
                : Object.fromEntries(
                      Object.entries(value).map(([item, line]) => {
                          return [`${key}.${item}`, line];
                      }),
                  );

            translator.addLines(entries, locale);
        }

        loaded.add(locale);
    }

    /**
     * Wait for a loader's promise, then apply its lines.
     *
     * @param locale - The locale being loaded
     * @param pending - The loader's promise
     */
    async function settle(
        locale: string,
        pending: Promise<LocaleLines | LocaleModule>,
    ): Promise<void> {
        try {
            apply(locale, await pending);
        } finally {
            inFlight.delete(locale);
        }
    }

    /**
     * Start loading a locale unless it is loaded, loading or unloadable.
     *
     * @param locale - The locale to load
     * @returns The pending load, or null when there is nothing to wait for
     */
    function request(locale: string): Promise<void> | null {
        if (loaded.has(locale) || isUndefined(options.load)) {
            return null;
        }

        const running = inFlight.get(locale);

        if (!isUndefined(running)) {
            return running;
        }

        const answer = options.load(locale);

        if (!(answer instanceof Promise)) {
            apply(locale, answer);

            return null;
        }

        const pending = settle(locale, answer);

        inFlight.set(locale, pending);

        return pending;
    }

    /**
     * Count a change and tell the subscribers.
     */
    function changed(): void {
        version += 1;

        for (const listener of [...listeners]) {
            listener();
        }
    }

    /**
     * Tell the subscribers once the pending loads are done.
     *
     * @param pending - The loads the starting locale and fallback need
     */
    async function announce(pending: (Promise<void> | null)[]): Promise<void> {
        await Promise.all(pending);

        if (pending.some((entry) => entry !== null)) {
            changed();
        }
    }

    const ready = announce([
        request(options.locale),
        request(options.fallback ?? options.locale),
    ]);

    return {
        ...helpers,
        translator,
        ready,
        has: (key, locale, fallback) => {
            return translator.has(key, locale, fallback);
        },
        hasForLocale: (key, locale) => {
            return translator.hasForLocale(key, locale);
        },
        getLocale: () => translator.getLocale(),
        getFallback: () => translator.getFallback(),
        isLocale: (locale) => translator.getLocale() === locale,
        isLoaded: (locale) => loaded.has(locale ?? translator.getLocale()),
        getVersion: () => version,
        subscribe: (listener) => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },
        load: async (locale) => {
            await request(locale);

            changed();
        },
        setLocale: async (locale) => {
            assertLocale(locale);

            latestSwitch += 1;

            const token = latestSwitch;

            await request(locale);

            if (token !== latestSwitch) {
                return;
            }

            translator.setLocale(locale);
            changed();
        },
        setFallback: async (fallback) => {
            if (fallback !== null) {
                assertLocale(fallback);
                await request(fallback);
            }

            translator.setFallback(fallback);
            changed();
        },
    };
}

/**
 * Wrap a lang's reads so each one reports to a tracker first.
 *
 * @param lang - The lang to read
 * @param track - Called before every read, so a view can subscribe to what it reads
 * @returns Reads that answer what the lang answers
 */
export function bindLang<TLines extends LangLines>(
    lang: LangReader<TLines>,
    track: () => void,
): LangReader<TLines> {
    return {
        __: ((key, replace, locale) => {
            track();

            return lang.__(key, replace, locale);
        }) as TranslationHelpers<TLines>["__"],
        trans: ((key, replace, locale) => {
            track();

            return lang.trans(key, replace, locale);
        }) as TranslationHelpers<TLines>["trans"],
        transChoice: (key, number, replace, locale) => {
            track();

            return lang.transChoice(key, number, replace, locale);
        },
        has: (key, locale, fallback) => {
            track();

            return lang.has(key, locale, fallback);
        },
        hasForLocale: (key, locale) => {
            track();

            return lang.hasForLocale(key, locale);
        },
        getLocale: () => {
            track();

            return lang.getLocale();
        },
        getFallback: () => {
            track();

            return lang.getFallback();
        },
        isLocale: (locale) => {
            track();

            return lang.isLocale(locale);
        },
        isLoaded: (locale) => {
            track();

            return lang.isLoaded(locale);
        },
    };
}
