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
                "@types/lodash-es",
                "@types/pluralize",
                "any-ascii",
                "lodash-es",
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
                "text", "text-summary",
                ...(process.env.CI ? ["json-summary", "json"] : ["html", "lcov"]),
            ],
            reportOnFailure: true,
            exclude: [...configDefaults.exclude, "./scripts/**", "./docs/**"],
        },
        projects: ["packages/*"],
    },
});
