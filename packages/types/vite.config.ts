import { defineConfig } from "vite";

import baseViteConfig from "../../vite.config";

const { build: _build, ...restConfig } = baseViteConfig;

export default defineConfig(restConfig);
