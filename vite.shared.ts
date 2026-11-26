/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { UserConfig } from "vite";
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";

import { packageExternals } from "./scripts/build/externals.ts";
import { buildEntries } from "./scripts/entries.ts";
import type { PackageJson } from "./scripts/lib/workspace.ts";

const baseConfig = defineConfig({
    plugins: [
        dts({
            outDirs: "dist",
            entryRoot: "src",
            // The plugin regex-escapes the root tsconfig's relative `include`, which then matches nothing in a package.
            include: ["src"],
            staticImport: true,
            tsconfigPath: path.resolve(__dirname, "tsconfig.json"),
            exclude: ["**/*.spec.ts", "**/__tests__/**"],
            aliasesExclude: [/^@tolki\//],
        }),
    ],
    build: {
        lib: { entry: "src/index.ts", formats: ["es"] },
        emptyOutDir: true,
        outDir: "dist",
    },
    test: {
        environment: "jsdom",
        globals: true,
        typecheck: {
            enabled: true,
            checker: "tsc",
            include: ["**/*.test-d.ts"],
        },
    },
});

export default baseConfig;

/**
 * Builds a package's Vite config from the shared base, its `src` entries and its manifest's externals.
 *
 * @param importMetaUrl - The `import.meta.url` of the package's vite.config.ts.
 * @param overrides - Package-specific config merged over the result.
 * @returns The merged config.
 */
export function definePackageConfig(
    importMetaUrl: string,
    overrides: UserConfig = {},
): UserConfig {
    const dir = path.dirname(fileURLToPath(importMetaUrl));
    const manifest = JSON.parse(
        readFileSync(path.join(dir, "package.json"), "utf8"),
    ) as PackageJson;

    return mergeConfig(
        baseConfig,
        mergeConfig(
            {
                build: {
                    lib: { entry: buildEntries("src/**/*.ts", dir) },
                    rolldownOptions: { external: packageExternals(manifest) },
                },
            },
            overrides,
        ),
    );
}
