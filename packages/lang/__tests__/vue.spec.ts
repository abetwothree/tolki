import type { VueLang } from "@tolki/lang/vue";
import { createLang, useLang } from "@tolki/lang/vue";
import { isUndefined } from "@tolki/utils";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createApp, createSSRApp, defineComponent, nextTick } from "vue";

import Greeting from "./fixtures/Greeting.vue";
import { createDeferredLoader, LINES } from "./fixtures/lines";
import { VUE_SSR_HTML } from "./fixtures/ssr-html";

/**
 * Read the three paragraphs a mounted greeting renders.
 *
 * @param wrapper - The mounted greeting
 * @returns The text of each paragraph
 */
function paragraphs(wrapper: ReturnType<typeof mount>): string[] {
    return wrapper.findAll("p").map((p) => p.text());
}

describe("createLang", () => {
    it("gives templates __, trans and transChoice", () => {
        const wrapper = mount(Greeting, {
            global: {
                plugins: [
                    createLang({
                        locale: "es",
                        fallback: "en",
                        lines: LINES,
                    }),
                ],
            },
        });

        expect(paragraphs(wrapper)).toEqual(["Bienvenido", "2 apples", "es"]);
    });

    it("gives templates trans", () => {
        const Probe = defineComponent({
            template: "<p>{{ trans('Welcome') }}</p>",
        });
        const wrapper = mount(Probe, {
            global: {
                plugins: [
                    createLang({
                        locale: "es",
                        fallback: "en",
                        lines: LINES,
                    }),
                ],
            },
        });

        expect(wrapper.text()).toBe("Bienvenido");
    });

    it("re-renders when the locale changes", async () => {
        const plugin = createLang({
            locale: "es",
            fallback: "en",
            lines: LINES,
        });
        const wrapper = mount(Greeting, { global: { plugins: [plugin] } });

        await plugin.setLocale("en");
        await nextTick();

        expect(paragraphs(wrapper)[0]).toBe("Welcome");
    });

    it("stops listening when the app unmounts", () => {
        const plugin = createLang({
            locale: "es",
            fallback: "en",
            lines: LINES,
        });
        const unsubscribe = vi.fn();
        const subscribe = plugin.subscribe;

        vi.spyOn(plugin, "subscribe").mockImplementation((listener) => {
            const stop = subscribe(listener);

            return () => {
                unsubscribe();
                stop();
            };
        });

        const app = createApp(Greeting).use(plugin);

        app.mount(document.createElement("div"));
        expect(unsubscribe).not.toHaveBeenCalled();

        app.unmount();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it("keeps two apps' locales apart", async () => {
        const first = createLang({
            locale: "es",
            fallback: "en",
            lines: LINES,
        });
        const second = createLang({
            locale: "es",
            fallback: "en",
            lines: LINES,
        });
        const one = mount(Greeting, { global: { plugins: [first] } });
        const two = mount(Greeting, { global: { plugins: [second] } });

        await first.setLocale("en");
        await nextTick();

        expect(paragraphs(one)[0]).toBe("Welcome");
        expect(paragraphs(two)[0]).toBe("Bienvenido");
    });
});

describe("useLang", () => {
    it("loads, then switches when locale is set", async () => {
        const loader = createDeferredLoader();
        const plugin = createLang({
            locale: "es",
            fallback: "en",
            lines: { es: LINES.es, en: LINES.en },
            load: loader.load,
        });
        const wrapper = mount(Greeting, { global: { plugins: [plugin] } });
        let lang: VueLang | undefined;
        const Probe = defineComponent({
            setup() {
                lang = useLang();

                return () => null;
            },
        });

        mount(Probe, { global: { plugins: [plugin] } });

        if (isUndefined(lang)) {
            throw new Error("useLang() did not run");
        }

        lang.locale.value = "de";
        await nextTick();

        expect(paragraphs(wrapper)[0]).toBe("Bienvenido");

        loader.settle("de");
        await vi.waitFor(() => {
            expect(paragraphs(wrapper)[0]).toBe("Willkommen");
        });
    });

    it("switches through setLocale", async () => {
        const plugin = createLang({
            locale: "es",
            fallback: "en",
            lines: LINES,
        });
        let lang: VueLang | undefined;
        const Probe = defineComponent({
            setup() {
                lang = useLang();

                return () => null;
            },
        });

        mount(Probe, { global: { plugins: [plugin] } });
        await lang?.setLocale("en");

        expect(lang?.locale.value).toBe("en");
        expect(lang?.lang.getLocale()).toBe("en");
    });

    it("throws without the plugin", () => {
        const error = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(() => mount(Greeting)).toThrow(/createLang/);

        error.mockRestore();
    });
});

describe("hydration", () => {
    it("hydrates the server's markup without a mismatch", () => {
        const container = document.createElement("div");
        container.innerHTML = VUE_SSR_HTML;
        const first = container.querySelector("p");
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const error = vi.spyOn(console, "error").mockImplementation(() => {});

        createSSRApp(Greeting)
            .use(createLang({ locale: "es", fallback: "en", lines: LINES }))
            .mount(container);

        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
        expect(container.querySelector("p")).toBe(first);

        warn.mockRestore();
        error.mockRestore();
    });

    it("reports a mismatch when the client starts in another locale", () => {
        const container = document.createElement("div");
        container.innerHTML = VUE_SSR_HTML;
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const error = vi.spyOn(console, "error").mockImplementation(() => {});

        createSSRApp(Greeting)
            .use(createLang({ locale: "en", fallback: "en", lines: LINES }))
            .mount(container);

        const logged = [...warn.mock.calls, ...error.mock.calls]
            .flat()
            .join(" ");

        expect(logged).toMatch(/Hydration/);

        warn.mockRestore();
        error.mockRestore();
    });
});
