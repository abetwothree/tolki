import { act, render } from "@testing-library/react";
import type { ReactLang } from "@tolki/lang/react";
import { createLang, LangProvider, useLang } from "@tolki/lang/react";
import type { ReactElement } from "react";
import { createElement, memo } from "react";
import { hydrateRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LINES } from "./fixtures/lines";
import { Greeting } from "./fixtures/react-greeting";
import { REACT_SSR_HTML } from "./fixtures/ssr-html";

afterEach(() => {
    vi.restoreAllMocks();
});

/**
 * Create a lang that starts in Spanish with every fixture locale loaded.
 *
 * @param locale - The locale to start in
 * @returns The lang
 */
function makeLang(locale = "es"): ReturnType<typeof createLang> {
    return createLang({ locale, fallback: "en", lines: LINES });
}

/**
 * Read the paragraphs a rendered greeting holds.
 *
 * @param container - The element the greeting rendered into
 * @returns The text of each paragraph
 */
function paragraphs(container: HTMLElement): string[] {
    return [...container.querySelectorAll("p")].map((p) => p.textContent);
}

describe("LangProvider", () => {
    it("renders translations below it", () => {
        const { container } = render(
            createElement(
                LangProvider,
                { lang: makeLang() },
                createElement(Greeting),
            ),
        );

        expect(paragraphs(container)).toEqual(["Bienvenido", "2 apples", "es"]);
    });

    it("re-renders when the locale changes", async () => {
        const lang = makeLang();
        const { container } = render(
            createElement(LangProvider, { lang }, createElement(Greeting)),
        );

        await act(() => lang.setLocale("en"));

        expect(paragraphs(container)[0]).toBe("Welcome");
    });

    it("unsubscribes when it unmounts", () => {
        const lang = makeLang();
        const unsubscribe = vi.fn();
        const subscribe = lang.subscribe;

        vi.spyOn(lang, "subscribe").mockImplementation((listener) => {
            const stop = subscribe(listener);

            return () => {
                unsubscribe();
                stop();
            };
        });

        const { unmount } = render(
            createElement(LangProvider, { lang }, createElement(Greeting)),
        );

        expect(unsubscribe).not.toHaveBeenCalled();

        unmount();

        expect(unsubscribe).toHaveBeenCalled();
    });
});

describe("useLang", () => {
    it("hands memoized children a new __ after a change", async () => {
        const lang = makeLang();
        const renders: string[] = [];
        const Probe = memo(function Probe(props: {
            translate: ReactLang<typeof LINES>["__"];
        }): ReactElement {
            const text = props.translate("Welcome");

            renders.push(text);

            return createElement("p", null, text);
        });
        const Parent = (): ReactElement => {
            const { __ } = useLang<typeof LINES>();

            return createElement(Probe, { translate: __ });
        };

        render(createElement(LangProvider, { lang }, createElement(Parent)));
        await act(() => lang.setLocale("en"));

        expect(renders).toEqual(["Bienvenido", "Welcome"]);
    });

    it("switches through setLocale and exposes the lang", async () => {
        const lang = makeLang();
        let reader: ReactLang | undefined;
        const Probe = (): null => {
            reader = useLang();

            return null;
        };

        render(createElement(LangProvider, { lang }, createElement(Probe)));
        await act(async () => {
            await reader?.setLocale("en");
        });

        expect(reader?.locale).toBe("en");
        expect(reader?.lang).toBe(lang);
    });

    it("throws without a provider", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        expect(() => render(createElement(Greeting))).toThrow(/LangProvider/);
    });
});

describe("hydration", () => {
    it("hydrates the server's markup without a mismatch", async () => {
        const container = document.createElement("div");

        container.innerHTML = REACT_SSR_HTML;

        const first = container.querySelector("p");
        const onRecoverableError = vi.fn();

        await act(async () => {
            hydrateRoot(
                container,
                createElement(
                    LangProvider,
                    { lang: makeLang() },
                    createElement(Greeting),
                ),
                { onRecoverableError },
            );
        });

        expect(onRecoverableError).not.toHaveBeenCalled();
        expect(container.querySelector("p")).toBe(first);
    });

    it("reports a mismatch when the client starts in another locale", async () => {
        const container = document.createElement("div");

        container.innerHTML = REACT_SSR_HTML;
        vi.spyOn(console, "error").mockImplementation(() => {});

        const onRecoverableError = vi.fn();

        await act(async () => {
            hydrateRoot(
                container,
                createElement(
                    LangProvider,
                    { lang: makeLang("en") },
                    createElement(Greeting),
                ),
                { onRecoverableError },
            );
        });

        expect(onRecoverableError).toHaveBeenCalled();
    });
});
