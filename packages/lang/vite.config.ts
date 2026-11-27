import vue from "@vitejs/plugin-vue";
import { configDefaults } from "vitest/config";

import { definePackageConfig } from "../../vite.shared.ts";
import { svelteFixtures } from "./__tests__/svelte-fixtures-plugin.ts";

export default definePackageConfig(import.meta.url, {
    plugins: [vue(), svelteFixtures()],
    test: {
        exclude: [...configDefaults.exclude, "__tests__/svelte.spec.ts"],
    },
});
