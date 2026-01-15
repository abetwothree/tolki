import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";
import { copyOrDownloadAsMarkdownButtons } from "vitepress-plugin-llms";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    vite: {
        plugins: [llmstxt()],
    },
    markdown: {
        config(md) {
            md.use(copyOrDownloadAsMarkdownButtons);
        },
    },
    lang: "en-US",
    title: "Tolki JS",
    description:
        "Use the PHP Laravel framework support utilities in your JavaScript codebase",
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
        search: {
            provider: "local",
        },

        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Home", link: "/" },
            { text: "Packages", link: "/packages" },
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
                text: "TypeScript",
                items: [
                    {
                        text: "Installation & Usage",
                        link: "/typescript/",
                    },
                    {
                        text: "TypeScript Utilities List",
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

        // socialLinks: [
        // {
        //     icon: "github",
        //     link: "https://github.com/abetwothree/tolki",
        // },
        // ],
    },

    // sitemap: { hostname: "https://tolki.abe.dev" },
});
