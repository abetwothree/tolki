import { isArray } from "@zinaid/utils";
import { optionalRequire } from "@zinaid/utils";
import type {
    Options as MarkdownItOptions,
    PluginSimple,
    PluginWithOptions,
} from "markdown-it";

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
 * Lazily load markdown-it and throw helpful error if not installed
 */
function loadMarkdownIt(): typeof import("markdown-it").default {
    return optionalRequire<typeof import("markdown-it").default>(
        "markdown-it",
        'The "markdown-it" package is required for markdown functions. ' +
            "Please install it: npm install markdown-it",
    );
}

/**
 * Lazily load markdown-it-anchor and throw helpful error if not installed
 */
function loadMarkdownItAnchor(): typeof import("markdown-it-anchor").default {
    return optionalRequire<typeof import("markdown-it-anchor").default>(
        "markdown-it-anchor",
        'The "markdown-it-anchor" package is required for anchor support. ' +
            "Please install it: npm install markdown-it-anchor",
    );
}

/**
 * Lazily load markdown-it-task-lists and throw helpful error if not installed
 */
function loadMarkdownItTaskLists(): typeof import("markdown-it-task-lists").default {
    const mod = optionalRequire<
        | typeof import("markdown-it-task-lists")
        | { default: typeof import("markdown-it-task-lists").default }
    >(
        "markdown-it-task-lists",
        'The "markdown-it-task-lists" package is required for GFM task list support. ' +
            "Please install it: npm install markdown-it-task-lists",
    );

    // Handle both ESM default export and CommonJS module.exports
    return "default" in mod ? mod.default : mod;
}

/**
 * Converts GitHub flavored Markdown into HTML.
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

    const MarkdownIt = loadMarkdownIt();
    const md = new MarkdownIt({ html, linkify, breaks, ...rest });

    if (gfm) {
        const markdownItTaskLists = loadMarkdownItTaskLists();
        md.use(markdownItTaskLists, { label: true, labelAfter: true });
    }

    if (anchors) {
        const markdownItAnchor = loadMarkdownItAnchor();
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
