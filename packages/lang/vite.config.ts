import vue from "@vitejs/plugin-vue";
import { defineConfig, mergeConfig } from "vite";

import { buildPackageEntries } from "../../scripts/entries";
import baseViteConfig from "../../vite.config";

const entries = buildPackageEntries("src/**/*.ts", import.meta.url);

export default defineConfig(
    mergeConfig(baseViteConfig, {
        plugins: [vue()],
        build: {
            lib: {
                entry: entries,
                name: "Lang",
            },
            rollupOptions: {
                external: ["vue", "react", "react-dom", /^node:/],
            },
        },
    }),
);
