import { defineConfig, mergeConfig } from "vite";
import { glob } from "glob";

import baseViteConfig from "../../vite.config";

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

export default defineConfig(mergeConfig(baseViteConfig, {
    build: {
        lib: {
            entry: entries,
            name: "Collection",
        },
    },
}));
