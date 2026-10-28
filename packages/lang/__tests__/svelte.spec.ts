import { render } from "@testing-library/svelte";
import { createLang, langContext } from "@tolki/lang/svelte";
import { flushSync, hydrate, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import Greeting from "./fixtures/Greeting.svelte";
import { createDeferredLoader, LINES } from "./fixtures/lines";
import Root from "./fixtures/Root.svelte";
import { SVELTE_SSR_HTML } from "./fixtures/ssr-html";

/**
 * Read the paragraphs a rendered greeting shows.
 *
 * @param container - The element the component rendered into
 * @returns The text of each paragraph
 */
function paragraphs(container: HTMLElement): string[] {
    return [...container.querySelectorAll("p")].map((p) => p.textContent);
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("langContext", () => {
    it("lets a component render translations", () => {
        const lang = createLang({ locale: "es", fallback: "en", lines: LINES });
        const view = render(Greeting, { context: langContext(lang) });

        expect(paragraphs(view.container)).toEqual([
            "Bienvenido",
            "2 apples",
            "es",
        ]);

        view.unmount();
    });
});

describe("setLang", () => {
    it("shares the lang with child components", () => {
        const lang = createLang({ locale: "es", fallback: "en", lines: LINES });
        const view = render(Root, { props: { lang } });

        expect(paragraphs(view.container)).toEqual([
            "Bienvenido",
            "2 apples",
            "es",
        ]);

        view.unmount();
    });
});

describe("getLang", () => {
    it("re-renders, the destructured __ included, when the locale changes", async () => {
        const lang = createLang({ locale: "es", fallback: "en", lines: LINES });
        const view = render(Greeting, { context: langContext(lang) });

        await lang.setLocale("en");
        flushSync();

        expect(paragraphs(view.container)).toEqual([
            "Welcome",
            "2 apples",
            "en",
        ]);

        view.unmount();
    });

    it("loads, then switches when locale is assigned", async () => {
        const deferred = createDeferredLoader();
        const lang = createLang({
            locale: "es",
            fallback: "en",
            lines: LINES,
            load: deferred.load,
        });
        const context = langContext(lang);
        const reader = [...context.values()][0];
        const view = render(Greeting, { context });

        if (reader === undefined) {
            throw new Error("langContext answered no reader");
        }

        reader.locale = "de";
        flushSync();

        expect(paragraphs(view.container)[2]).toBe("es");

        deferred.settle("de");
        await vi.waitFor(() => {
            flushSync();

            expect(paragraphs(view.container)[2]).toBe("de");
        });

        view.unmount();
    });

    it("exposes setLocale and the lang behind the reads", async () => {
        const lang = createLang({ locale: "es", fallback: "en", lines: LINES });
        const reader = [...langContext(lang).values()][0];

        await reader?.setLocale("de");

        expect(lang.getLocale()).toBe("de");
        expect(reader?.lang).toBe(lang);
    });

    it("throws without a lang in context", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        expect(() => render(Greeting)).toThrow(/setLang|langContext/);
    });
});

describe("hydration", () => {
    it("hydrates the server's markup without a mismatch", () => {
        const container = document.createElement("div");
        container.innerHTML = SVELTE_SSR_HTML;
        const first = container.querySelector("p");
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const component = hydrate(Greeting, {
            target: container,
            context: langContext(
                createLang({ locale: "es", fallback: "en", lines: LINES }),
            ),
        });
        flushSync();

        expect(warn).not.toHaveBeenCalled();
        expect(container.querySelector("p")).toBe(first);
        expect(container.textContent).toContain("Bienvenido");

        void unmount(component);
    });
});
