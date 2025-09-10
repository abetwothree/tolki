import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { configDefaults } from "vitest/config";

export default defineConfig({
    plugins: [
        dts({
            outDir: "dist",
            entryRoot: "src",
            staticImport: true,
        }),
    ],
    build: {
        outDir: "dist",
        rollupOptions: {
            external: [
                "@laravel-js/collection",
                "@laravel-js/str",
                "@laravel-js/num",
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
            reporter: ["text", "html", "lcov", "text-summary"],
            exclude: [...configDefaults.exclude],
        },
        projects: ["packages/*"],
    },
});
