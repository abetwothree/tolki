import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
    exportEntries,
    exportsBySubpath,
    importTarget,
    publishedSubpaths,
} from "../lib/manifest.ts";
import type { PackageJson } from "../lib/workspace.ts";

const REPO_ROOT = resolve(__dirname, "../..");

describe("publishedSubpaths", () => {
    it("lists lang's code subpaths", () => {
        const manifest = JSON.parse(
            readFileSync(join(REPO_ROOT, "packages/lang/package.json"), "utf8"),
        ) as PackageJson;
        const { publishConfig, ...rest } = manifest;
        const subpaths = publishedSubpaths({ ...rest, ...publishConfig });

        expect(subpaths).toContain(".");
        expect(subpaths).toContain("./helpers");
        expect(subpaths).toContain("./vue");
        expect(subpaths).not.toContain("./*");
        expect(subpaths).not.toContain("./client");
        expect(subpaths).not.toContain("./package.json");
    });

    it("reads a string or condition-less exports field", () => {
        expect(publishedSubpaths({ exports: "./index.js" })).toEqual(["."]);
        expect(publishedSubpaths({})).toEqual(["."]);
        expect(
            publishedSubpaths({
                exports: { import: "./i.js", types: "./i.d.ts" },
            }),
        ).toEqual(["."]);
    });

    it("returns no subpaths for a types-only package", () => {
        expect(
            publishedSubpaths({
                exports: {
                    ".": { types: "./src/index.d.ts" },
                    "./arrays": { types: "./src/arrays.d.ts" },
                },
            }),
        ).toEqual([]);
    });
});

describe("exportsBySubpath", () => {
    it("returns a subpath map as it is", () => {
        const exportsField = { ".": "./a.js", "./b": "./b.js" };

        expect(exportsBySubpath({ exports: exportsField })).toEqual(
            exportsField,
        );
    });

    it("wraps a condition map under the root subpath", () => {
        expect(exportsBySubpath({ exports: { import: "./i.js" } })).toEqual({
            ".": { import: "./i.js" },
        });
    });

    it("falls back to main, then to index.js", () => {
        expect(exportsBySubpath({ main: "./m.js" })).toEqual({ ".": "./m.js" });
        expect(exportsBySubpath({})).toEqual({ ".": "./index.js" });
    });
});

describe("exportEntries", () => {
    it("lists every subpath but package.json with its types and import target", () => {
        expect(
            exportEntries({
                exports: {
                    ".": { types: "./a.d.ts", default: "./a.js" },
                    "./*": { types: "./dist/*", default: "./dist/*" },
                    "./client": { types: "./client.d.ts" },
                    "./plain": "./plain.js",
                    "./package.json": "./package.json",
                },
            }),
        ).toEqual([
            { subpath: ".", types: "./a.d.ts", target: "./a.js" },
            { subpath: "./*", types: "./dist/*", target: "./dist/*" },
            { subpath: "./client", types: "./client.d.ts", target: null },
            { subpath: "./plain", types: null, target: "./plain.js" },
        ]);
    });

    it("wraps a condition map under the root subpath", () => {
        expect(
            exportEntries({ exports: { types: "./i.d.ts", import: "./i.js" } }),
        ).toEqual([{ subpath: ".", types: "./i.d.ts", target: "./i.js" }]);
    });
});

describe("importTarget", () => {
    it("skips types and takes default", () => {
        expect(importTarget({ types: "./a.d.ts", default: "./a.js" })).toBe(
            "./a.js",
        );
    });

    it("prefers a nested node import over default", () => {
        expect(
            importTarget({ node: { import: "./n.js" }, default: "./d.js" }),
        ).toBe("./n.js");
    });

    it("returns null when only types is present", () => {
        expect(importTarget({ types: "./a.d.ts" })).toBeNull();
    });

    it("returns a string target as it is and null for a non-object", () => {
        expect(importTarget("./a.js")).toBe("./a.js");
        expect(importTarget(null)).toBeNull();
        expect(importTarget(1)).toBeNull();
    });
});
