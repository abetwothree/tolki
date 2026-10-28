import type { LocaleLines, LocaleLinesLoader } from "@tolki/types";
import { isUndefined } from "@tolki/utils";

import de from "./lang/de.json";
import en from "./lang/en.json";
import es from "./lang/es.json";

export const LINES = { en, es, de };

/** Lines the loader answers, by locale. */
const BY_LOCALE: Readonly<Record<string, LocaleLines>> = LINES;

interface DeferredLoader {
    load: LocaleLinesLoader;
    calls: string[];
    settle(locale: string): void;
    fail(locale: string, error: Error): void;
}

/**
 * Create a loader whose promises stay pending until the test settles them.
 *
 * @returns The loader, the locales it was asked for, and the two ways to end a pending load
 */
export function createDeferredLoader(): DeferredLoader {
    const calls: string[] = [];
    const resolvers = new Map<string, () => void>();
    const rejecters = new Map<string, (error: Error) => void>();

    return {
        calls,
        load(locale) {
            calls.push(locale);

            return new Promise((resolve, reject) => {
                resolvers.set(locale, () => {
                    resolve(BY_LOCALE[locale] ?? {});
                });
                rejecters.set(locale, reject);
            });
        },
        settle(locale) {
            resolvers.get(locale)?.();
        },
        fail(locale, error) {
            rejecters.get(locale)?.(error);
        },
    };
}

/**
 * Answer a locale's lines at once.
 *
 * @param locale - The locale to load
 * @returns The locale's lines
 * @throws Error when the fixtures hold no lines for the locale
 */
export function syncLoad(locale: string): LocaleLines {
    const lines = BY_LOCALE[locale];

    if (isUndefined(lines)) {
        throw new Error(`no lines for ${locale}`);
    }

    return lines;
}
