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
            ".agents/**/*",
            "**/dist/**",
            "coverage/**",
            "docs/vitepress/vitepress/dist/**",
            "docs/vitepress/.vitepress/cache/**",
            ".agents/**",
            ".claude/**",
            ".github/**",
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
        // PHP's own JSON_PRETTY_PRINT transcripts (see
        // scripts/php-parity/README.md) — left byte-for-byte as emit()
        // wrote them, same reasoning as .prettierignore. Only
        // json/no-empty-keys is disabled here, not the whole ruleset -
        // review round 1, Minor 6: a wholesale directory ignore also drops
        // JSON parse and duplicate-key validation, the only automated
        // guard against a corrupted transcript (e.g. an unsuppressed PHP
        // deprecation notice leaking onto stdout ahead of emit()'s JSON).
        // A captured value can legitimately be an empty string key (e.g.
        // task-10-pluck-sort.json's null-array-key probe).
        files: ["docs/php-parity/**/*.json"],
        plugins: { json },
        language: "json/json",
        rules: {
            "json/no-empty-keys": "off",
        },
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
        // VitePress theme overrides intentionally reference VitePress's own
        // CSS custom properties (--vp-c-*), which this linter can't resolve
        // since they're defined in VitePress's own bundled theme CSS rather
        // than this file, and commonly need `!important` to reliably win
        // against VitePress's default theme styles. `:has()` is safe here
        // since the docs site is only ever viewed in modern evergreen
        // browsers.
        files: ["docs/vitepress/.vitepress/theme/**/*.css"],
        rules: {
            "css/no-invalid-properties": "off",
            "css/no-important": "off",
            "css/use-baseline": "off",
        },
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
