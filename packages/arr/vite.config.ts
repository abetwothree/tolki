import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { glob } from "glob";

const entries = Object.fromEntries(
    glob
        .sync("./src/**/*.ts", {
            ignore: ["src/**/*.d.ts"],
        })
        .map((file) => {
            return [
                file.replace("src/", "").replace(".ts", "").toLowerCase(),
                file,
            ];
        }),
);

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
            entry: entries,
            name: "Arr",
        },
        rollupOptions: {
            external: [
                "@laravel-js/collection",
                "@laravel-js/str",
            ],
        },
        sourcemap: true,
    },
});
