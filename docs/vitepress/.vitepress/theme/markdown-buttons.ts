const LABELS: Record<string, string> = {
    ".markdown-copy-buttons .chevron-wrapper": "More copy options",
    ".markdown-copy-buttons .download-btn": "Download page as Markdown",
};

/**
 * Names the icon-only buttons of the "Copy page" widget, which ships them without a label.
 *
 * @param root - The document or element holding the widget.
 * @returns Nothing.
 */
export function labelMarkdownButtons(root: ParentNode): void {
    for (const [selector, label] of Object.entries(LABELS)) {
        for (const button of Array.from(root.querySelectorAll(selector))) {
            if (!button.hasAttribute("aria-label")) {
                button.setAttribute("aria-label", label);
            }
        }
    }
}
