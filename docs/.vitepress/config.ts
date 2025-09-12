import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Laravel JavaScript Utilities",
    description:
        "Use the PHP Laravel framework support utilities in your JavaScript codebase",
    themeConfig: {
        search: {
            provider: "local",
        },

        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Home", link: "/" },
            { text: "Examples", link: "/markdown-examples" },
        ],

        sidebar: [
            {
                text: "Introduction",
                items: [
                    { text: "Why Laravel JS?", link: "/why-laravel-js" },
                    { text: "Packages", link: "/packages" },
                ],
            },
            {
                text: "Array Utilities",
                items: [
                    {
                        text: "Installation",
                        link: "/array-utilities/",
                    },
                    {
                        text: "Documentation",
                        link: "/array-utilities/documentation",
                    },
                ],
            },
            {
                text: "Collection Utilities",
                items: [
                    {
                        text: "Installation",
                        link: "/collection-utilities/",
                    },
                    {
                        text: "Documentation",
                        link: "/collection-utilities/documentation",
                    },
                ],
            },
            {
                text: "Number Utilities",
                items: [
                    {
                        text: "Installation",
                        link: "/number-utilities/",
                    },
                    {
                        text: "Documentation",
                        link: "/number-utilities/documentation",
                    },
                ],
            },
            {
                text: "String Utilities",
                items: [
                    {
                        text: "Installation",
                        link: "/string-utilities/",
                    },
                    {
                        text: "Documentation",
                        link: "/string-utilities/documentation",
                    },
                ],
            },
            {
                text: "TypeScript Utilities",
                items: [
                    {
                        text: "Installation",
                        link: "/typescript-utilities/",
                    },
                    {
                        text: "Documentation",
                        link: "/typescript-utilities/documentation",
                    },
                ],
            },
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
                link: "https://github.com/abetwothree/laravel-js",
            },
        ],
    },
});
