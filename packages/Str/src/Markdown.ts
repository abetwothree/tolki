import MarkdownIt, { type Options as MarkdownItOptions } from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItTaskLists from "markdown-it-task-lists";

export interface MarkDownOptions extends MarkdownItOptions {
    gfm?: boolean;
    anchors?: object | boolean;
    typographer?: boolean;
}

export type MarkDownExtensions = unknown[];

export class MarkdownRenderer {
    constructor(
        private options: MarkDownOptions = { gfm: true, anchors: false },
        private extensions: MarkDownExtensions = [],
    ) {}

    renderer() {
        const {
            html = false,
            linkify = true,
            breaks = true,
            gfm = true,
            anchors = false,
            ...rest
        } = this.options;

        const md = new MarkdownIt({ html, linkify, breaks, ...rest });

        if (gfm) {
            md.use(markdownItTaskLists, { label: true, labelAfter: true });
        }

        if (anchors) {
            md.use(
                markdownItAnchor,
                typeof anchors === "object" ? anchors : {},
            );
        }

        // Support extension array entries either as plugin or [plugin, opts]
        for (const ext of this.extensions) {
            if (Array.isArray(ext)) {
                // @ts-expect-error - markdown-it plugin typing is permissive
                md.use(ext[0], ext[1]);
            } else if (ext) {
                // @ts-expect-error
                md.use(ext);
            }
        }

        return md;
    }
}
