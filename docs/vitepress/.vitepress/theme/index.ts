// https://vitepress.dev/guide/custom-theme
import "./style.css";
import "virtual:group-icons.css";

import type { Theme } from "vitepress";
import { inBrowser, onContentUpdated } from "vitepress";
import DefaultTheme from "vitepress/theme";
import CopyOrDownloadAsMarkdownButtons from "vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue";
import { h, nextTick } from "vue";

import { installCodeGroupSync, restoreSelections } from "./code-group-sync";
import FnTry from "./components/FnTry.vue";
import { labelMarkdownButtons } from "./markdown-buttons";

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
        app.component("FnTry", FnTry);
        if (inBrowser) {
            installCodeGroupSync(window);
        }
    },
    // Runs after VitePress's dev-mode reset of every group to its first tab.
    setup() {
        onContentUpdated(() => {
            void nextTick(() => {
                restoreSelections(document, window);
                labelMarkdownButtons(document);
            });
        });
    },
} satisfies Theme;
