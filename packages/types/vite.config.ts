import { defineConfig } from "vite";

import baseViteConfig from "../../vite.shared.ts";

const { build: _build, ...restConfig } = baseViteConfig;

export default defineConfig(restConfig);
