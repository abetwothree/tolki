// @vitest-environment node
import { virtualModuleCode } from "@tolki/lang/vite-laravel/virtual-module";
import { describe, expect, it } from "vitest";

const OUTPUT = "/project/resources/js/lang";

/**
 * Evaluate a generated client module with nothing to import.
 *
 * @param code - The generated source
 * @returns The module's exports
 */
async function evaluate(code: string) {
    return (await import(
        `data:text/javascript,${encodeURIComponent(code)}`
    )) as {
        locales: string[];
        load: (locale: string) => Promise<unknown>;
    };
}

describe("virtualModuleCode", () => {
    it.each([["en?raw"], [""], ["a b"], ["en.json"], ["../x"]])(
        "leaves the locale %j out of both modules",
        (locale) => {
            for (const ssr of [false, true]) {
                const code = virtualModuleCode(["en", locale], OUTPUT, ssr);

                expect(code).toContain('export const locales = ["en"];');
                expect(code).not.toContain(`"${locale}"`);
            }
        },
    );

    it("keeps letters, digits, underscores and dashes", () => {
        const code = virtualModuleCode(
            ["pt-BR", "zh_CN", "es419"],
            OUTPUT,
            false,
        );

        expect(code).toContain(
            'export const locales = ["pt-BR", "zh_CN", "es419"];',
        );
    });

    it("keys the tables by locale in a Map, so __proto__ stays an ordinary key", () => {
        const client = virtualModuleCode(["__proto__"], OUTPUT, false);
        const server = virtualModuleCode(["__proto__"], OUTPUT, true);

        expect(client).toContain('new Map([["__proto__", () => import(');
        expect(server).toContain('new Map([["__proto__", l0]])');
        expect(client).not.toContain('{ "__proto__"');
        expect(server).not.toContain('{ "__proto__"');
    });

    it.each([["__proto__"], ["constructor"], ["toString"], ["xx"]])(
        "rejects %s from the client load as an unknown locale",
        async (locale) => {
            const mod = await evaluate(
                virtualModuleCode(["en"], OUTPUT, false),
            );

            await expect(mod.load(locale)).rejects.toThrow(
                `No exported lines for locale "${locale}". Exported: en.`,
            );
        },
    );

    it("keeps a __proto__ locale as a plain entry in locales", async () => {
        const mod = await evaluate(
            virtualModuleCode(["__proto__"], OUTPUT, false),
        );

        expect(mod.locales).toEqual(["__proto__"]);
        expect(Object.getPrototypeOf(mod.locales)).toBe(Array.prototype);
    });

    it.each([false, true])(
        "says no locales were exported when the list is empty (ssr %s)",
        async (ssr) => {
            const code = virtualModuleCode([], OUTPUT, ssr);
            const mod = (await evaluate(code)) as unknown as {
                load: (locale: string) => unknown;
            };

            await expect(async () => mod.load("en")).rejects.toThrow(
                'No exported lines for locale "en". No locales were exported.',
            );
        },
    );
});
