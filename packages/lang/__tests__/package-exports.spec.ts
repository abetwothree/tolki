import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

interface PackageExportTarget {
    import?: string;
    require?: string;
    types?: string;
}

interface LangPackageManifest {
    exports: Record<string, string>;
    peerDependenciesMeta: {
        vue?: { optional?: boolean };
        react?: { optional?: boolean };
    };
    publishConfig: {
        exports: Record<string, PackageExportTarget>;
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

    it("publishes the vue subpath to the flat dist output", () => {
        const manifest = readPackageManifest();

        expect(manifest.publishConfig.exports["./vue"]).toEqual({
            import: "./dist/vue.js",
            types: "./dist/vue.d.ts",
        });
    });

    it("publishes the react subpath to the flat dist output", () => {
        const manifest = readPackageManifest();

        expect(manifest.publishConfig.exports["./react"]).toEqual({
            import: "./dist/react.js",
            types: "./dist/react.d.ts",
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
});
