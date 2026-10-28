import { svelte } from "@sveltejs/vite-plugin-svelte";
import vue from "@vitejs/plugin-vue";
import { defineConfig, mergeConfig } from "vite";
import { configDefaults } from "vitest/config";

import { buildPackageEntries } from "../../scripts/entries";
import baseViteConfig from "../../vite.config";

const entries = buildPackageEntries("src/**/*.ts", import.meta.url);

export default defineConfig(
    mergeConfig(baseViteConfig, {
        plugins: [vue(), svelte()],
        test: {
            exclude: [...configDefaults.exclude, "__tests__/svelte.spec.ts"],
        },
        build: {
            lib: {
                entry: entries,
                name: "Lang",
            },
            rollupOptions: {
                external: [
                    "vue",
                    "react",
                    "react-dom",
                    "svelte",
                    /^svelte\//,
                    "vite",
                    /^node:/,
                ],
            },
        },
    }),
);
