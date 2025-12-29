import path from "node:path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { configDefaults } from "vitest/config";

export default defineConfig({
    plugins: [
        dts({
            outDir: "dist",
            entryRoot: "src",
            staticImport: true,
            tsconfigPath: path.resolve(__dirname, "tsconfig.json"),
            exclude: ["**/*.spec.ts", "**/__tests__/**"],
        }),
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            formats: ["es"],
        },
        emptyOutDir: true,
        outDir: "dist",
        rollupOptions: {
            external: [
                "@laravel-js/all",
                "@laravel-js/arr",
                "@laravel-js/collection",
                "@laravel-js/data",
                "@laravel-js/num",
                "@laravel-js/obj",
                "@laravel-js/path",
                "@laravel-js/str",
                "@laravel-js/types",
                "@laravel-js/utils",
                "@types/pluralize",
                "any-ascii",
                "markdown-it",
                "markdown-it-anchor",
                "markdown-it-task-lists",
                "pluralize",
                "transliteration",
                "ulid",
                "uuid",
            ],
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        coverage: {
            provider: "istanbul",
            reporter: [
                "text",
                "text-summary",
                ...(process.env.CI ? ["json-summary", "json"] : ["lcov"]),
                ...(process.argv.includes("--ui") ? ["html"] : []),
            ],
            reportOnFailure: true,
            exclude: [...configDefaults.exclude, "./scripts/**", "./docs/**"],
            thresholds: {
                autoUpdate: true,
                statements: 95.95,
                branches: 89.25,
                functions: 98.98,
                lines: 96.22,
            },
        },
        projects: ["packages/*"],
    },
});
