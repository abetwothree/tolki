import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it } from "vitest";

import { labelMarkdownButtons } from "../markdown-buttons";

describe("labelMarkdownButtons", () => {
    beforeEach(() => {
        document.body.innerHTML =
            '<div class="markdown-copy-buttons"><button class="copy-page">Copy page</button>' +
            '<button class="chevron-wrapper"><svg></svg></button>' +
            '<button class="download-btn"><svg></svg></button></div>' +
            '<button class="other"></button>';
    });

    it("names the icon-only chevron and download buttons", () => {
        labelMarkdownButtons(document);

        expect(
            document
                .querySelector(".chevron-wrapper")
                ?.getAttribute("aria-label"),
        ).toBe("More copy options");
        expect(
            document.querySelector(".download-btn")?.getAttribute("aria-label"),
        ).toBe("Download page as Markdown");
    });

    it("leaves other buttons and an existing label alone", () => {
        document
            .querySelector(".download-btn")
            ?.setAttribute("aria-label", "Custom");

        labelMarkdownButtons(document);

        expect(
            document.querySelector(".download-btn")?.getAttribute("aria-label"),
        ).toBe("Custom");
        expect(
            document.querySelector(".copy-page")?.hasAttribute("aria-label"),
        ).toBe(false);
        expect(
            document.querySelector(".other")?.hasAttribute("aria-label"),
        ).toBe(false);
    });

    it("targets class names the installed vitepress-plugin-llms component still renders", () => {
        const component = readFileSync(
            fileURLToPath(
                import.meta
                    .resolve("vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue"),
            ),
            "utf8",
        );

        for (const name of [
            "markdown-copy-buttons",
            "chevron-wrapper",
            "download-btn",
        ]) {
            expect(component).toContain(name);
        }
    });
});
