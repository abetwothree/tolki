import MarkdownIt, {
    type Options as MarkdownItOptions,
    type PluginSimple,
    type PluginWithOptions,
} from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItTaskLists from "markdown-it-task-lists";

export interface MarkDownOptions extends MarkdownItOptions {
    gfm?: boolean;
    anchors?: object | boolean;
    typographer?: boolean;
}

export type MarkDownExtension =
    | PluginSimple
    | PluginWithOptions<unknown>
    | [PluginWithOptions<unknown>, unknown];

export type MarkDownExtensions = MarkDownExtension[];

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
                const [plugin, opts] = ext as [
                    PluginWithOptions<unknown>,
                    unknown,
                ];
                md.use(plugin, opts);
            } else if (ext) {
                md.use(ext as PluginSimple | PluginWithOptions<unknown>);
            }
        }

        return md;
    }
}
