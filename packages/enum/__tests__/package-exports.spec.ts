import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

interface PackageExportTarget {
    default?: string;
    import?: string;
    require?: string;
    types?: string;
}

interface EnumPackageManifest {
    exports: Record<string, PackageExportTarget>;
    publishConfig: {
        exports: Record<string, PackageExportTarget>;
    };
}

function readPackageManifest(): EnumPackageManifest {
    const currentFilePath = fileURLToPath(import.meta.url);
    const packageJsonPath = path.resolve(
        currentFilePath,
        "../..",
        "package.json",
    );

    return JSON.parse(
        readFileSync(packageJsonPath, "utf-8"),
    ) as EnumPackageManifest;
}

describe("package exports", () => {
    it("uses source fallbacks for the vite subpath during development", () => {
        const manifest = readPackageManifest();

        expect(manifest.exports["./vite"]).toEqual({
            types: "./src/vite-plugin.ts",
            import: "./src/vite-plugin.ts",
            default: "./src/vite-plugin.ts",
        });
    });

    it("publishes the enums subpath to the flat dist output", () => {
        const manifest = readPackageManifest();

        expect(manifest.publishConfig.exports["./enums"]).toEqual({
            types: "./dist/enums.d.ts",
            import: "./dist/enums.js",
            default: "./dist/enums.js",
        });
    });

    it("publishes the vite subpath to the flat dist output", () => {
        const manifest = readPackageManifest();

        expect(manifest.publishConfig.exports["./vite"]).toEqual({
            types: "./dist/vite-plugin.d.ts",
            import: "./dist/vite-plugin.js",
            default: "./dist/vite-plugin.js",
        });
    });
});
