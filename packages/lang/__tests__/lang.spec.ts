import { bindLang, createLang } from "@tolki/lang";
import { InvalidArgumentException } from "@tolki/utils";
import { describe, expect, it, vi } from "vitest";

import { createDeferredLoader, LINES, syncLoad } from "./fixtures/lines";

describe("createLang", () => {
    it("translates with the lines it was given", () => {
        const lang = createLang({
            locale: "es",
            fallback: "en",
            lines: { en: LINES.en, es: LINES.es },
        });

        expect(lang.__("Welcome")).toBe("Bienvenido");
        expect(lang.transChoice("messages.apples", 2)).toBe("2 apples");
        expect(lang.trans("courier::mail.sent")).toBe("Enviado.");
    });

    it("applies a synchronous loader's lines before it returns", () => {
        expect(createLang({ locale: "de", load: syncLoad }).__("0")).toBe(
            "Null",
        );
    });

    it("loads the locale and the fallback before ready resolves", async () => {
        const loader = createDeferredLoader();
        const lang = createLang({
            locale: "es",
            fallback: "en",
            load: loader.load,
        });

        // The key: nothing is loaded yet.
        expect(lang.__("Welcome")).toBe("Welcome");

        loader.settle("es");
        loader.settle("en");
        await lang.ready;

        expect(lang.transChoice("messages.apples", 2)).toBe("2 apples");
        expect(loader.calls).toEqual(["es", "en"]);
    });

    it("unwraps the module namespace import() answers", async () => {
        const lang = createLang({
            locale: "es",
            load: () => import("./fixtures/lang/es.json"),
        });

        await lang.ready;

        expect(lang.__("Welcome")).toBe("Bienvenido");
    });

    it("keeps a group named default when the object is not a module", async () => {
        const lang = createLang({
            locale: "en",
            load: () => ({ default: { a: "A" } }),
        });

        await lang.ready;

        expect(lang.__("default.a")).toBe("A");
    });

    it("throws for a locale holding a path character before loading", () => {
        const load = vi.fn(syncLoad);

        expect(() => createLang({ locale: "../x", load })).toThrow(
            InvalidArgumentException,
        );
        expect(load).not.toHaveBeenCalled();
    });

    it("throws for a fallback holding a path character", () => {
        expect(() => createLang({ locale: "en", fallback: "a/b" })).toThrow(
            InvalidArgumentException,
        );
    });

    it("throws when a synchronous loader throws", () => {
        expect(() => createLang({ locale: "xx", load: syncLoad })).toThrow(
            "no lines for xx",
        );
    });

    it("rejects ready when an asynchronous loader fails", async () => {
        const lang = createLang({
            locale: "es",
            load: () => Promise.reject(new Error("boom")),
        });

        await expect(lang.ready).rejects.toThrow("boom");
    });

    it("rejects lines that are not an object", async () => {
        const lang = createLang({
            locale: "es",
            load: () => Promise.resolve(JSON.parse("null")),
        });

        await expect(lang.ready).rejects.toThrow(TypeError);
    });

    it("answers the loaded locales through isLoaded", () => {
        const lang = createLang({ locale: "en", lines: { en: LINES.en } });

        expect(lang.isLoaded()).toBe(true);
        expect(lang.isLoaded("en")).toBe(true);
        expect(lang.isLoaded("es")).toBe(false);
    });

    it("answers has, hasForLocale and getFallback from the translator", () => {
        const lang = createLang({
            locale: "es",
            fallback: "en",
            lines: { en: LINES.en, es: LINES.es },
        });

        expect(lang.has("messages.apples")).toBe(true);
        expect(lang.hasForLocale("messages.apples")).toBe(false);
        expect(lang.getFallback()).toBe("en");
    });

    it("starts at version zero", () => {
        expect(createLang({ locale: "en" }).getVersion()).toBe(0);
    });
});

describe("setLocale", () => {
    it("loads, then switches and notifies once", async () => {
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load: syncLoad,
        });
        const listener = vi.fn();
        const before = lang.getVersion();

        lang.subscribe(listener);
        await lang.setLocale("es");

        expect(listener).toHaveBeenCalledTimes(1);
        expect(lang.getLocale()).toBe("es");
        expect(lang.getVersion()).toBeGreaterThan(before);
    });

    it("keeps the current locale while the next one loads", async () => {
        const loader = createDeferredLoader();
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load: loader.load,
        });

        const pending = lang.setLocale("es");

        expect(lang.getLocale()).toBe("en");
        expect(lang.__("Welcome")).toBe("Welcome");

        loader.settle("es");
        await pending;

        expect(lang.getLocale()).toBe("es");
    });

    it("keeps the locale and notifies nobody when loading fails", async () => {
        const loader = createDeferredLoader();
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load: loader.load,
        });
        const listener = vi.fn();

        lang.subscribe(listener);

        const pending = lang.setLocale("es");

        loader.fail("es", new Error("offline"));

        await expect(pending).rejects.toThrow("offline");
        expect(lang.getLocale()).toBe("en");
        expect(listener).not.toHaveBeenCalled();
    });

    it("lets the last call win", async () => {
        const loader = createDeferredLoader();
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load: loader.load,
        });
        const toEs = lang.setLocale("es");
        const toDe = lang.setLocale("de");

        loader.settle("de");
        await toDe;
        loader.settle("es");
        await toEs;

        expect(lang.getLocale()).toBe("de");
    });

    it("loads a locale once for concurrent calls", async () => {
        const loader = createDeferredLoader();
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load: loader.load,
        });
        const first = lang.setLocale("es");
        const second = lang.setLocale("es");

        loader.settle("es");
        await Promise.all([first, second]);

        expect(loader.calls).toEqual(["es"]);
    });

    it("does not load a locale again once it is loaded", async () => {
        const load = vi.fn(syncLoad);
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load,
        });

        await lang.setLocale("es");
        await lang.setLocale("en");
        await lang.setLocale("es");

        expect(load).toHaveBeenCalledTimes(1);
    });

    it("rejects a locale holding a path character without loading", async () => {
        const load = vi.fn(syncLoad);
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load,
        });

        await expect(lang.setLocale("../x")).rejects.toThrow(
            InvalidArgumentException,
        );
        expect(load).not.toHaveBeenCalled();
    });

    it("switches without a loader", async () => {
        const lang = createLang({ locale: "en", lines: { en: LINES.en } });

        await expect(lang.setLocale("es")).resolves.toBeUndefined();
        expect(lang.getLocale()).toBe("es");
    });

    it("keeps lines added on the translator when it loads a locale", async () => {
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load: syncLoad,
        });

        lang.translator.addLines({ "extra.x": "X" }, "es");
        await lang.setLocale("es");

        expect(lang.__("extra.x")).toBe("X");
        expect(lang.__("Welcome")).toBe("Bienvenido");
    });

    it("loads a locale again after its load failed", async () => {
        let attempts = 0;
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load: (locale) => {
                attempts += 1;

                return attempts === 1
                    ? Promise.reject(new Error("offline"))
                    : syncLoad(locale);
            },
        });

        await expect(lang.setLocale("es")).rejects.toThrow("offline");
        await lang.setLocale("es");

        expect(lang.getLocale()).toBe("es");
    });
});

describe("setFallback", () => {
    it("loads the fallback before reading it", async () => {
        const lang = createLang({
            locale: "es",
            lines: { es: LINES.es },
            load: syncLoad,
        });

        await lang.setFallback("en");

        expect(lang.transChoice("messages.apples", 2)).toBe("2 apples");
        expect(lang.getFallback()).toBe("en");
    });

    it("accepts null", async () => {
        const load = vi.fn(syncLoad);
        const lang = createLang({
            locale: "es",
            fallback: "en",
            lines: { en: LINES.en, es: LINES.es },
            load,
        });

        await lang.setFallback(null);

        expect(lang.getFallback()).toBeNull();
        expect(load).not.toHaveBeenCalled();
    });

    it("notifies the listeners", async () => {
        const lang = createLang({ locale: "en", lines: { en: LINES.en } });
        const listener = vi.fn();

        lang.subscribe(listener);
        await lang.setFallback(null);

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("rejects a fallback holding a path character", async () => {
        const lang = createLang({ locale: "en", lines: { en: LINES.en } });

        await expect(lang.setFallback("a/b")).rejects.toThrow(
            InvalidArgumentException,
        );
        expect(lang.getFallback()).toBeNull();
    });
});

describe("load", () => {
    it("preloads a locale without switching", async () => {
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load: syncLoad,
        });

        await lang.load("de");

        expect(lang.isLoaded("de")).toBe(true);
        expect(lang.getLocale()).toBe("en");
        expect(lang.__("Welcome", {}, "de")).toBe("Willkommen");
    });

    it("rejects when a synchronous loader throws", async () => {
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load: syncLoad,
        });

        await expect(lang.load("xx")).rejects.toThrow("no lines for xx");
    });

    it("resolves without a loader", async () => {
        const lang = createLang({ locale: "en", lines: { en: LINES.en } });

        await expect(lang.load("es")).resolves.toBeUndefined();
        expect(lang.isLoaded("es")).toBe(false);
    });

    it("lets lines loaded for a locale reach the version", async () => {
        const lang = createLang({
            locale: "en",
            lines: { en: LINES.en },
            load: syncLoad,
        });
        const before = lang.getVersion();

        await lang.load("es");

        expect(lang.getVersion()).toBeGreaterThan(before);
    });
});

describe("subscribe", () => {
    it("stops calling a listener after it unsubscribes", async () => {
        const lang = createLang({ locale: "en", lines: { en: LINES.en } });
        const listener = vi.fn();
        const unsubscribe = lang.subscribe(listener);

        await lang.setLocale("es");
        unsubscribe();
        await lang.setLocale("en");

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("lets a listener unsubscribe while being notified", async () => {
        const lang = createLang({ locale: "en", lines: { en: LINES.en } });
        const second = vi.fn();
        const unsubscribe = lang.subscribe(() => {
            unsubscribe();
        });

        lang.subscribe(second);
        await lang.setLocale("es");

        expect(second).toHaveBeenCalledTimes(1);
    });
});

describe("isLocale", () => {
    it("compares with the current locale", () => {
        const lang = createLang({ locale: "en", lines: { en: LINES.en } });

        expect(lang.isLocale("en")).toBe(true);
        expect(lang.isLocale("es")).toBe(false);
    });
});

describe("bindLang", () => {
    it("tracks before every read and answers what the lang answers", () => {
        const lang = createLang({ locale: "es", lines: { es: LINES.es } });
        const track = vi.fn();
        const reader = bindLang(lang, track);

        expect(reader.__("Welcome")).toBe("Bienvenido");
        expect(reader.getLocale()).toBe("es");
        expect(track).toHaveBeenCalledTimes(2);
    });

    it("tracks trans", () => {
        const lang = createLang({ locale: "es", lines: { es: LINES.es } });
        const track = vi.fn();

        expect(bindLang(lang, track).trans("courier::mail.sent")).toBe(
            "Enviado.",
        );
        expect(track).toHaveBeenCalledTimes(1);
    });

    it("tracks transChoice", () => {
        const lang = createLang({ locale: "en", lines: { en: LINES.en } });
        const track = vi.fn();

        expect(bindLang(lang, track).transChoice("messages.apples", 2)).toBe(
            "2 apples",
        );
        expect(track).toHaveBeenCalledTimes(1);
    });

    it("tracks has and hasForLocale", () => {
        const lang = createLang({
            locale: "es",
            fallback: "en",
            lines: { en: LINES.en, es: LINES.es },
        });
        const track = vi.fn();
        const reader = bindLang(lang, track);

        expect(reader.has("messages.apples")).toBe(true);
        expect(reader.hasForLocale("messages.apples")).toBe(false);
        expect(track).toHaveBeenCalledTimes(2);
    });

    it("tracks getFallback, isLocale and isLoaded", () => {
        const lang = createLang({
            locale: "es",
            fallback: "en",
            lines: { en: LINES.en, es: LINES.es },
        });
        const track = vi.fn();
        const reader = bindLang(lang, track);

        expect(reader.getFallback()).toBe("en");
        expect(reader.isLocale("es")).toBe(true);
        expect(reader.isLoaded("en")).toBe(true);
        expect(track).toHaveBeenCalledTimes(3);
    });
});
