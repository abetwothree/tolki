import { defineConfig } from "vitepress";
import {
    groupIconMdPlugin,
    groupIconVitePlugin,
} from "vitepress-plugin-group-icons";
import llmstxt from "vitepress-plugin-llms";
import { copyOrDownloadAsMarkdownButtons } from "vitepress-plugin-llms";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    vite: {
        plugins: [llmstxt(), groupIconVitePlugin()],
    },
    markdown: {
        config(md) {
            md.use(copyOrDownloadAsMarkdownButtons);
            md.use(groupIconMdPlugin);

            // Wrap every table in a scrollable container so wide tables
            // (e.g. many columns of code spans) scroll horizontally within
            // their own box instead of overflowing the page layout.
            const defaultTableOpen =
                md.renderer.rules.table_open ||
                ((tokens, idx, options, _env, self) =>
                    self.renderToken(tokens, idx, options));
            const defaultTableClose =
                md.renderer.rules.table_close ||
                ((tokens, idx, options, _env, self) =>
                    self.renderToken(tokens, idx, options));

            md.renderer.rules.table_open = (tokens, idx, options, env, self) =>
                `<div class="table-scroll">${defaultTableOpen(tokens, idx, options, env, self)}`;
            md.renderer.rules.table_close = (tokens, idx, options, env, self) =>
                `${defaultTableClose(tokens, idx, options, env, self)}</div>`;
        },
    },
    lang: "en-US",
    title: "Tolki JS",
    description:
        "Use the PHP Laravel framework support utilities in your JavaScript codebase",
    lastUpdated: true,
    head: [
        [
            "script",
            {
                async: "",
                src: "https://www.googletagmanager.com/gtag/js?id=G-F63Z0VMJJK",
            },
        ],
        [
            "script",
            {},
            `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-F63Z0VMJJK');`,
        ],
    ],
    themeConfig: {
        logo: "/tolki-logo-mark.svg",

        search: {
            provider: "local",
        },

        outline: {
            level: [2, 3],
            label: "On this page",
        },

        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Home", link: "/" },
            { text: "Packages", link: "/packages" },
            { text: "TS & Laravel", link: "/ts/" },
            { text: "Numbers", link: "/numbers/" },
            { text: "Strings", link: "/strings/" },
            { text: "TS Types", link: "/typescript/" },
            // { text: "Arrays", link: "/arrays/" },
            // { text: "Objects", link: "/objects/" },
            // { text: "Collections", link: "/collections/" },
            // { text: "Examples", link: "/markdown-examples" },
        ],

        sidebar: [
            {
                text: "Introduction",
                items: [
                    { text: "Why Tolki JS?", link: "/why-tolki-js" },
                    { text: "Packages", link: "/packages" },
                    { text: "What is Tolki?", link: "/what-is-tolki" },
                ],
            },
            {
                text: "TypeScript & Laravel",
                items: [
                    {
                        text: "Installation & Usage",
                        link: "/ts/",
                    },
                    {
                        text: "Enums",
                        link: "/ts/enums",
                    },
                    {
                        text: "Models",
                        link: "/ts/models",
                    },
                    {
                        text: "API Resources",
                        link: "/ts/api-resources",
                    },
                    {
                        text: "Routing",
                        link: "/ts/routing",
                    },
                    {
                        text: "Form Requests",
                        link: "/ts/form-requests",
                    },
                    {
                        text: "Broadcast Channels",
                        link: "/ts/broadcast-channels",
                    },
                    {
                        text: "Broadcast Events",
                        link: "/ts/broadcast-events",
                    },
                    {
                        text: "Inertia",
                        link: "/ts/inertia",
                    },
                    {
                        text: "Vite Env",
                        link: "/ts/vite-env",
                    },
                    {
                        text: "Extending Interfaces",
                        link: "/ts/extending-interfaces",
                    },
                    {
                        text: "Excluding Content",
                        link: "/ts/excluding-content",
                    },
                    {
                        text: "Casing Configurations",
                        link: "/ts/casing-configuration",
                    },
                    {
                        text: "Enum API Resource",
                        link: "/ts/enum-api-resource",
                    },
                    {
                        text: "Modular Publishing",
                        link: "/ts/modular-publishing",
                    },
                    {
                        text: "Customizing the Pipeline",
                        link: "/ts/customizing-the-pipeline",
                    },
                    {
                        text: "Pre-Command Hook",
                        link: "/ts/pre-command-hook",
                    },
                    {
                        text: "Cache Generation",
                        link: "/ts/generating-cache",
                    },
                    {
                        text: "Configuration Reference",
                        link: "/ts/configuration-reference",
                    },
                    {
                        text: "Vite Plugin",
                        link: "/ts/vite-plugin",
                    },
                    {
                        text: "Troubleshooting Types",
                        link: "/ts/troubleshooting-types",
                    },
                ],
            },
            {
                text: "Numbers",
                items: [
                    {
                        text: "Installation & Usage",
                        link: "/numbers/",
                    },
                    {
                        text: "Number Utilities List",
                        link: "/numbers/number-utilities-list",
                    },
                ],
            },
            {
                text: "Strings",
                items: [
                    {
                        text: "Installation & Usage",
                        link: "/strings/",
                    },
                    {
                        text: "String Utilities List",
                        link: "/strings/string-utilities-list",
                    },
                    {
                        text: "Stringable Utilities List",
                        link: "/strings/stringable-utilities-list",
                    },
                ],
            },
            {
                text: "TypeScript Type Utilities",
                items: [
                    {
                        text: "Installation & Usage",
                        link: "/typescript/",
                    },
                    {
                        text: "TypeScript Type Utilities List",
                        link: "/typescript/typescript-utilities-list",
                    },
                ],
            },
            // {
            //     text: "Array Utilities",
            //     items: [
            //         {
            //             text: "Installation & Usage",
            //             link: "/array-utilities/",
            //         },
            //         {
            //             text: "Documentation",
            //             link: "/arrays/documentation",
            //         },
            //     ],
            // },
            // {
            //     text: "Collection Utilities",
            //     items: [
            //         {
            //             text: "Installation & Usage",
            //             link: "/collections/",
            //         },
            //         {
            //             text: "Documentation",
            //             link: "/collections/documentation",
            //         },
            //     ],
            // },
            // {
            //     text: "Examples",
            //     items: [
            //         { text: "Markdown Examples", link: "/markdown-examples" },
            //         { text: "Runtime API Examples", link: "/api-examples" },
            //     ],
            // },
        ],

        socialLinks: [
            {
                icon: "github",
                link: "https://github.com/abetwothree/tolki",
            },
        ],

        editLink: {
            pattern:
                "https://github.com/abetwothree/tolki/edit/master/docs/vitepress/:path",
            text: "Edit this page on GitHub",
        },

        footer: {
            message: "Released under the MIT License.",
            copyright: "Copyright © 2024–present Abraham Arango",
        },
    },

    // sitemap: { hostname: "https://tolki.abe.dev" },
});
