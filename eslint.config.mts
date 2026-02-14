import css from "@eslint/css";
import js from "@eslint/js";
import json from "@eslint/json";
// TODO: re-enable when @eslint/markdown fixes getLoc() compatibility with @eslint/plugin-kit 0.4.x
// import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";
import oxlint from "eslint-plugin-oxlint";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    {
        ignores: [
            "**/dist/**",
            "coverage/**",
            "docs/vitepress/vitepress/dist/**",
            "docs/vitepress/.vitepress/cache/**",
        ],
    },
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: { globals: globals.browser },
    },
    tseslint.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
    {
        files: ["**/*.json"],
        ignores: [".agents/**/*", ".claude/**/*", ".github/**/*"],
        plugins: { json },
        language: "json/json",
        extends: ["json/recommended"],
    },
    {
        files: ["**/*.jsonc"],
        plugins: { json },
        language: "json/jsonc",
        extends: ["json/recommended"],
    },
    {
        files: ["**/*.json5"],
        plugins: { json },
        language: "json/json5",
        extends: ["json/recommended"],
    },
    // TODO: re-enable when @eslint/markdown fixes getLoc() compatibility with @eslint/plugin-kit 0.4.x
    // {
    //     files: ["**/*.md"],
    //     plugins: { markdown },
    //     language: "markdown/gfm",
    //     extends: ["markdown/recommended"],
    // },
    {
        files: ["**/*.css"],
        plugins: { css },
        language: "css/css",
        extends: ["css/recommended"],
    },

    {
        plugins: {
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
        },
    },

    ...oxlint.buildFromOxlintConfigFile("./.oxlintrc.json"),
]);
