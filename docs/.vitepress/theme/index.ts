// https://vitepress.dev/guide/custom-theme
import "./style.css";

import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import CopyOrDownloadAsMarkdownButtons from "vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue";
import { h } from "vue";

export default {
    extends: DefaultTheme,
    Layout: () => {
        return h(DefaultTheme.Layout, null, {
            // https://vitepress.dev/guide/extending-default-theme#layout-slots
        });
    },
    enhanceApp({ app }) {
        app.component(
            "CopyOrDownloadAsMarkdownButtons",
            CopyOrDownloadAsMarkdownButtons,
        );
    },
} satisfies Theme;
