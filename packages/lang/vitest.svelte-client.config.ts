import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, mergeConfig } from "vite";

import baseViteConfig from "../../vite.config";

export default defineConfig(
    mergeConfig(baseViteConfig, {
        // Svelte's client runtime resolves only under the browser condition, which the SSR spec must not get.
        // `development` stays listed because setting `conditions` drops Vite's default client conditions.
        plugins: [svelte()],
        resolve: { conditions: ["browser", "development"] },
        test: {
            name: "@tolki/lang:svelte-client",
            environment: "jsdom",
            include: ["__tests__/svelte.spec.ts"],
            typecheck: { enabled: false },
        },
    }),
);
