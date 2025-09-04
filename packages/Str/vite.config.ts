import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

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
        lib: {
            entry: "src/index.ts",
            name: "Str",
            fileName: "str",
        },
        rollupOptions: {
            external: [
                "any-ascii",
                "lodash-es",
                "transliteration",
                "uuid",
                "markdown-it",
                "markdown-it-anchor",
                "markdown-it-task-lists",
            ],
        },
    },
});
