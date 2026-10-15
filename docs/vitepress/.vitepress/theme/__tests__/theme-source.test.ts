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
});
