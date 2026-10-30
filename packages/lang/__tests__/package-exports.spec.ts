import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

interface PackageExportTarget {
    import?: string;
    require?: string;
    default?: string;
    types?: string;
}

interface LangPackageManifest {
    $schema?: string;
    compatiblePackages?: unknown;
    keywords: string[];
    exports: Record<string, string | { types?: string }>;
    files: string[];
    peerDependencies: Record<string, string>;
    peerDependenciesMeta: {
        vue?: { optional?: boolean };
        react?: { optional?: boolean };
        svelte?: { optional?: boolean };
        vite?: { optional?: boolean };
    };
    publishConfig: {
        exports: Record<string, PackageExportTarget | string>;
    };
}

/**
 * Read the package manifest next to the tests.
 *
 * @returns The parsed package.json
 */
function readPackageManifest(): LangPackageManifest {
    const currentFilePath = fileURLToPath(import.meta.url);
    const packageJsonPath = path.resolve(
        currentFilePath,
        "../..",
        "package.json",
    );

    return JSON.parse(
        readFileSync(packageJsonPath, "utf-8"),
    ) as LangPackageManifest;
}

describe("package exports", () => {
    it("points the development entries at the sources", () => {
        const { exports } = readPackageManifest();

        expect(exports["."]).toBe("./src/index.ts");
        expect(exports["./*"]).toBe("./src/*.ts");
    });

    it("points the vite-laravel entry at its own source", () => {
        const { exports } = readPackageManifest();

        expect(exports["./vite-laravel"]).toBe("./src/vite-laravel/index.ts");
    });

    it("publishes the vite-laravel subpath to its dist folder", () => {
        const manifest = readPackageManifest();

        expect(manifest.publishConfig.exports["./vite-laravel"]).toEqual({
            import: "./dist/vite-laravel/index.js",
            default: "./dist/vite-laravel/index.js",
            types: "./dist/vite-laravel/index.d.ts",
        });
    });

    it("publishes the five pre-existing subpaths to the flat dist output", () => {
        const { publishConfig } = readPackageManifest();

        for (const subpath of [
            "helpers",
            "locale",
            "message-selector",
            "replacements",
            "translator",
        ]) {
            expect(publishConfig.exports[`./${subpath}`]).toEqual({
                import: `./dist/${subpath}.js`,
                default: `./dist/${subpath}.js`,
                types: `./dist/${subpath}.d.ts`,
            });
        }
    });

    it("gives every runtime subpath a default for require-based loaders", () => {
        const { publishConfig } = readPackageManifest();

        for (const [subpath, target] of Object.entries(publishConfig.exports)) {
            if (typeof target === "object" && target.import) {
                expect(target.default ?? target.require, subpath).toBe(
                    target.import,
                );
            }
        }
    });

    it("exports package.json", () => {
        const { exports, publishConfig } = readPackageManifest();

        expect(exports["./package.json"]).toBe("./package.json");
        expect(publishConfig.exports["./package.json"]).toBe("./package.json");
    });

    it("exports the client types from the package root folder", () => {
        const manifest = readPackageManifest();

        expect(manifest.exports["./client"]).toEqual({
            types: "./client.d.ts",
        });
        expect(manifest.publishConfig.exports["./client"]).toEqual({
            types: "./client.d.ts",
        });
        expect(manifest.files).toContain("client.d.ts");
    });

    it("keeps vite an optional peer", () => {
        const manifest = readPackageManifest();

        expect(manifest.peerDependenciesMeta.vite?.optional).toBe(true);
    });

    it("declares the Vite plugin registry metadata", () => {
        const manifest = readPackageManifest();

        expect(manifest.$schema).toBe(
            "https://raw.githubusercontent.com/vitejs/vite-plugin-registry/refs/heads/main/data/schema/extended-package-json.schema.json",
        );
        expect(manifest.compatiblePackages).toEqual({
            schemaVersion: 1,
            vite: { type: "compatible", versions: "^7.0.0||^8.0.0" },
        });
    });

    it("lists the vite keywords", () => {
        const manifest = readPackageManifest();

        expect(manifest.keywords).toEqual(
            expect.arrayContaining(["vite", "vite-plugin"]),
        );
    });

    it("publishes the vue subpath to the flat dist output", () => {
        const manifest = readPackageManifest();

        expect(manifest.publishConfig.exports["./vue"]).toEqual({
            import: "./dist/vue.js",
            default: "./dist/vue.js",
            types: "./dist/vue.d.ts",
        });
    });

    it("publishes the react subpath to the flat dist output", () => {
        const manifest = readPackageManifest();

        expect(manifest.publishConfig.exports["./react"]).toEqual({
            import: "./dist/react.js",
            default: "./dist/react.js",
            types: "./dist/react.d.ts",
        });
    });

    it("publishes the svelte subpath to the flat dist output", () => {
        const manifest = readPackageManifest();

        expect(manifest.publishConfig.exports["./svelte"]).toEqual({
            import: "./dist/svelte.js",
            default: "./dist/svelte.js",
            types: "./dist/svelte.d.ts",
        });
    });

    it("keeps vue an optional peer", () => {
        const manifest = readPackageManifest();

        expect(manifest.peerDependenciesMeta.vue?.optional).toBe(true);
    });

    it("keeps react an optional peer", () => {
        const manifest = readPackageManifest();

        expect(manifest.peerDependenciesMeta.react?.optional).toBe(true);
    });

    it("keeps svelte an optional peer", () => {
        const manifest = readPackageManifest();

        expect(manifest.peerDependenciesMeta.svelte?.optional).toBe(true);
    });

    it("pins the range of every peer", () => {
        const manifest = readPackageManifest();

        expect(manifest.peerDependencies).toEqual({
            react: "^19.0.0",
            svelte: "^5.7.0",
            vite: "^7.0.0||^8.0.0",
            vue: "^3.5.0",
        });
    });
});
