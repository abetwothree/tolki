import type {
    LangLines,
    LangOptions,
    LocaleLines,
    LocaleModule,
} from "@tolki/types";
import {
    isFunction,
    isNull,
    isObject,
    isPlainObject,
    isUndefined,
} from "@tolki/utils";

import { createHelpers } from "./helpers.js";
import { assertLocale } from "./locale-guard.js";
import { mergeLocaleLines, Translator } from "./translator.js";
import type {
    Lang,
    LangReader,
    RegisteredLines,
    TranslationHelpers,
} from "./types.js";

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
 * Tell a loader's pending answer, any thenable, from lines.
 *
 * @param answer - What the loader answered
 * @returns True when the answer is still to be awaited
 */
function isPending(
    answer:
        | LocaleLines
        | LocaleModule
        | PromiseLike<LocaleLines | LocaleModule>,
): answer is PromiseLike<LocaleLines | LocaleModule> {
    return isObject<unknown>(answer) && isFunction(answer["then"]);
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
/* @__NO_SIDE_EFFECTS__ */
export function createLang<TLines extends LangLines = RegisteredLines>(
    options: LangOptions<TLines>,
): Lang<TLines> {
    const normalizer = options.normalizeLocalesUsing ?? null;

    /**
     * Convert a locale with the lang's `normalizeLocalesUsing` callback.
     *
     * @param locale - The locale
     * @returns The converted locale, or the locale itself when no callback is set
     */
    function normalize(locale: string): string {
        return isNull(normalizer) ? locale : normalizer(locale);
    }

    const locale = normalize(options.locale);
    const fallback =
        isUndefined(options.fallback) || isNull(options.fallback)
            ? null
            : normalize(options.fallback);

    assertLocale(locale);

    if (!isNull(fallback)) {
        assertLocale(fallback);
    }

    const translator = new Translator<TLines>(
        options.lines ?? ({} as TLines),
        locale,
    );

    translator.normalizeLocalesUsing(normalizer);
    translator.setFallback(fallback);

    const helpers = createHelpers(translator);
    const loaded = new Set(Object.keys(options.lines ?? {}).map(normalize));
    // Guards only the window where two load() calls for one locale overlap, since `loaded` never shrinks.
    const announcedLoads = new Set<string>();
    const inFlight = new Map<string, Promise<void>>();
    const listeners = new Set<() => void>();
    let version = 0;
    let latestSwitch = 0;
    let latestFallback = 0;

    /**
     * Add a loaded locale's lines to the translator, keeping the lines the app added itself.
     *
     * @param locale - The locale the lines belong to
     * @param answer - What the loader answered
     */
    function apply(locale: string, answer: LocaleLines | LocaleModule): void {
        mergeLocaleLines(translator, locale, linesOf(locale, answer));

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
        pending: PromiseLike<LocaleLines | LocaleModule>,
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

        if (!isPending(answer)) {
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
            if (!listeners.has(listener)) {
                continue;
            }

            try {
                listener();
            } catch (error) {
                // Rethrown off this stack, so one failing listener neither stops the rest nor fails the switch.
                queueMicrotask(() => {
                    throw error;
                });
            }
        }
    }

    /**
     * Tell the subscribers once the pending loads are done.
     *
     * @param pending - The loads the starting locale and fallback need
     */
    async function announce(pending: (Promise<void> | null)[]): Promise<void> {
        await Promise.all(pending);

        if (pending.some((entry) => !isNull(entry))) {
            changed();
        }
    }

    const starting = request(locale);
    let fallbackLoad: Promise<void> | null;

    try {
        fallbackLoad = request(fallback ?? locale);
    } catch (error) {
        // The locale's load is already running; without a handler its failure would go unhandled.
        starting?.catch(() => {});

        throw error;
    }

    const ready = announce([starting, fallbackLoad]);

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
        isLocale: (other) => translator.getLocale() === normalize(other),
        isLoaded: (other) => {
            return loaded.has(normalize(other ?? translator.getLocale()));
        },
        getVersion: () => version,
        subscribe: (listener) => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },
        load: async (wanted) => {
            const target = normalize(wanted);

            assertLocale(target);

            const wasLoaded = loaded.has(target);

            await request(target);

            if (
                !wasLoaded &&
                loaded.has(target) &&
                !announcedLoads.has(target)
            ) {
                announcedLoads.add(target);
                changed();
            }
        },
        setLocale: async (wanted) => {
            const target = normalize(wanted);

            assertLocale(target);

            latestSwitch += 1;

            const token = latestSwitch;

            await request(target);

            if (token !== latestSwitch) {
                return;
            }

            translator.setLocale(target);
            changed();
        },
        setFallback: async (wanted) => {
            const target = isNull(wanted) ? null : normalize(wanted);

            if (!isNull(target)) {
                assertLocale(target);
            }

            latestFallback += 1;

            const token = latestFallback;

            if (!isNull(target)) {
                await request(target);
            }

            if (token !== latestFallback) {
                return;
            }

            translator.setFallback(target);
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
/* @__NO_SIDE_EFFECTS__ */
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
