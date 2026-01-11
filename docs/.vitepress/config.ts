import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Tolki JS",
    description:
        "Use the PHP Laravel framework support utilities in your JavaScript codebase",
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
                ],
            },
            {
                text: "String Utilities",
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
                text: "Number Utilities",
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
                text: "TypeScript Utilities",
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
            {
                text: "Examples",
                items: [
                    { text: "Markdown Examples", link: "/markdown-examples" },
                    { text: "Runtime API Examples", link: "/api-examples" },
                ],
            },
        ],

        socialLinks: [
            {
                icon: "github",
                link: "https://github.com/abetwothree/tolki",
            },
        ],
    },
});
