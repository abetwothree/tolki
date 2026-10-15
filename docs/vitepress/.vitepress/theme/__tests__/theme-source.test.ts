import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (file: string) =>
    readFileSync(resolve(import.meta.dirname, "..", file), "utf8");

describe("theme source", () => {
    it("loads the custom stylesheet after VitePress's, so equal-specificity overrides win", () => {
        const index = read("index.ts");

        expect(index.indexOf('import "./style.css"')).toBeGreaterThan(
            index.indexOf('from "vitepress/theme"'),
        );
    });

    it("links the logo mark as the favicon", () => {
        expect(read("../config.ts")).toContain('href: "/tolki-logo-mark.svg"');
    });

    it("mutes a Laravel line linking one or two helpers, on the list pages only", () => {
        const head = read("style.css")
            .split("}")
            .map((block) => block.slice(0, block.indexOf("{")))
            .find((block) => block.includes("laravel.com/docs"));
        const link = (name: string) =>
            `<a href="https://laravel.com/docs/helpers#${name}"><code>${name}</code></a>`;

        expect(head).toBeDefined();
        document.body.innerHTML = `
            <div class="vp-doc _arrays-objects_utilities-list">
                <p id="one">Laravel: ${link("get")}</p>
                <p id="two">Laravel: ${link("get")} · ${link("data_get")}</p>
                <p id="prose">Reads <code>items</code> as ${link("get")} does.</p>
            </div>
            <div class="vp-doc _collections_methods-list"><p id="method">Laravel: ${link("all")}</p></div>
            <div class="vp-doc _ts_routing"><p id="routing">As with Laravel's ${link("defaults")}, set it once.</p></div>
        `;

        const muted = document.querySelectorAll(
            String(head?.split("*/").at(-1)),
        );

        expect(Array.from(muted, (paragraph) => paragraph.id)).toEqual([
            "one",
            "two",
            "method",
        ]);
    });
});
