import { isArray } from "@zinaid/utils";
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

/**
 * Converts GitHub flavored Markdown into HTML.
 *
 * @param value - The markdown string to convert.
 * @param options - Options to customize the markdown rendering. Defaults to GFM enabled and no anchors.
 * @param extensions - An array of markdown-it extensions to apply during rendering.
 * @returns The resulting HTML string.
 *
 * @example
 *
 * markdown('# Hello World'); -> '<h1>Hello World</h1>\n'
 */
export function markdown(
    value: string,
    options: MarkDownOptions = { gfm: true, anchors: false },
    extensions: MarkDownExtensions = [],
): string {
    return markDownRenderer(options, extensions).render(value);
}

/**
 * Converts inline Markdown into HTML.
 *
 * @param value - The inline markdown string to convert.
 * @param options - Options to customize the markdown rendering. Defaults to GFM enabled.
 * @param extensions - An array of markdown-it extensions to apply during rendering.
 * @returns The resulting HTML string.
 *
 * @example
 *
 * inlineMarkdown("Hello *World*"); -> "<p>Hello <em>World</em></p>"
 */
export function inlineMarkdown(
    value: string,
    options: MarkDownOptions = { gfm: true },
    extensions: MarkDownExtensions = [],
): string {
    return markDownRenderer(options, extensions).renderInline(value);
}

/**
 * Creates and configures a MarkdownIt renderer with the specified options and extensions.
 *
 * @param options - Options to customize the markdown rendering. Defaults to GFM enabled and no anchors.
 * @param extensions - An array of markdown-it extensions to apply during rendering.
 * @returns A configured MarkdownIt instance.
 */
export function markDownRenderer(
    options: MarkDownOptions = { gfm: true, anchors: false },
    extensions: MarkDownExtensions = [],
) {
    const {
        html = false,
        linkify = true,
        breaks = true,
        gfm = true,
        anchors = false,
        ...rest
    } = options;

    const md = new MarkdownIt({ html, linkify, breaks, ...rest });

    if (gfm) {
        md.use(markdownItTaskLists, { label: true, labelAfter: true });
    }

    if (anchors) {
        md.use(markdownItAnchor, typeof anchors === "object" ? anchors : {});
    }

    // Support extension array entries either as plugin or [plugin, opts]
    for (const ext of extensions) {
        if (isArray(ext)) {
            const [plugin, opts] = ext as [PluginWithOptions<unknown>, unknown];
            md.use(plugin, opts);
        } else if (ext) {
            md.use(ext as PluginSimple | PluginWithOptions<unknown>);
        }
    }

    return md;
}
