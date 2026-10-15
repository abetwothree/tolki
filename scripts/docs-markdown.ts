/**
 * Reads the parts of a Markdown page the docs tests care about: fenced code and headings.
 *
 * A line scanner rather than a full parser, so it needs no dependency and stays fence-aware.
 */

export interface MarkdownFence {
    lang: string;
    title: string | null;
    code: string;
    line: number;
    codeGroup: number | null;
}

export interface MarkdownHeading {
    level: number;
    text: string;
    slug: string;
    line: number;
}

const FENCE_OPEN = /^( {0,3})(`{3,}|~{3,})\s*(.*)$/;
const SLUG_SEPARATORS = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g;
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Turns heading text into the anchor VitePress gives it.
 *
 * @param text - The heading text, without Markdown or HTML.
 * @returns The anchor slug.
 */
export function slugify(text: string): string {
    const dashed = [...text.normalize("NFKD")]
        .filter((char) => char.charCodeAt(0) > 31)
        .join("")
        .replace(COMBINING_MARKS, "")
        .replace(SLUG_SEPARATORS, "-");
    let start = 0;
    let end = dashed.length;

    while (start < end && dashed[start] === "-") {
        start++;
    }

    while (end > start && dashed[end - 1] === "-") {
        end--;
    }

    return dashed.slice(start, end).replace(/^(\d)/, "_$1").toLowerCase();
}

/**
 * Removes inline code ticks and HTML tags from heading text.
 *
 * @param text - The raw heading text.
 * @returns The text a reader sees.
 */
function plainText(text: string): string {
    let result = "";
    let index = 0;

    while (index < text.length) {
        const char = text[index] as string;
        const next = text[index + 1] ?? "";
        const close = text.indexOf(">", index);

        if (char === "<" && /[A-Za-z/!]/.test(next) && close !== -1) {
            index = close + 1;
        } else {
            result += char === "`" ? "" : char;
            index++;
        }
    }

    return result.trim();
}

/**
 * Builds a fence from its opening line and body lines.
 *
 * @param open - The fence being read.
 * @param open.info - The text after the opening marker.
 * @param open.line - The 1-based line of the opening marker.
 * @param open.body - The body lines.
 * @param group - The code group the fence sits in, if any.
 * @returns The fence.
 */
function fenceFrom(
    open: { info: string; line: number; body: string[] },
    group: number | null,
): MarkdownFence {
    const [lang = "", ...rest] = open.info.split(/\s+/);
    const title = /\[([^\]]*)\]/.exec(rest.join(" "))?.[1] ?? null;

    return {
        lang: lang.replace(/\{.*$/, ""),
        title,
        code: open.body.join("\n"),
        line: open.line,
        codeGroup: group,
    };
}

/**
 * Finds each fenced code block and the `::: code-group` it sits in.
 *
 * @param markdown - The page source.
 * @returns The fences in document order.
 */
export function parseFences(markdown: string): MarkdownFence[] {
    const fences: MarkdownFence[] = [];
    let groups = 0;
    let group: number | null = null;
    let open: {
        marker: string;
        indent: number;
        info: string;
        line: number;
        body: string[];
    } | null = null;

    for (const [index, raw] of markdown.split("\n").entries()) {
        const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;

        if (open !== null) {
            const trimmed = line.trim();

            if (
                trimmed.length >= open.marker.length &&
                trimmed === open.marker[0]?.repeat(trimmed.length)
            ) {
                fences.push(fenceFrom(open, group));
                open = null;
            } else {
                open.body.push(
                    line.slice(Math.min(open.indent, indentOf(line))),
                );
            }

            continue;
        }

        const trimmed = line.trim();
        const fence = FENCE_OPEN.exec(line);

        if (fence !== null) {
            open = {
                marker: fence[2] as string,
                indent: (fence[1] as string).length,
                info: (fence[3] as string).trim(),
                line: index + 1,
                body: [],
            };
        } else if (/^:::\s*code-group\b/.test(trimmed)) {
            group = groups++;
        } else if (trimmed === ":::") {
            group = null;
        }
    }

    if (open !== null) {
        fences.push(fenceFrom(open, group));
    }

    return fences;
}

/**
 * Counts a line's leading spaces.
 *
 * @param line - The line.
 * @returns The number of leading spaces.
 */
function indentOf(line: string): number {
    return line.length - line.trimStart().length;
}

/**
 * Finds each ATX heading outside a fence, with the anchor VitePress gives it.
 *
 * @param markdown - The page source.
 * @returns The headings in document order.
 */
export function parseHeadings(markdown: string): MarkdownHeading[] {
    const headings: MarkdownHeading[] = [];
    const used = new Set<string>();
    let marker: string | null = null;

    for (const [index, raw] of markdown.split("\n").entries()) {
        const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
        const fence = FENCE_OPEN.exec(line);

        if (marker !== null) {
            const trimmed = line.trim();

            if (
                fence !== null &&
                trimmed === marker[0]?.repeat(trimmed.length) &&
                trimmed.length >= marker.length
            ) {
                marker = null;
            }

            continue;
        }

        if (fence !== null) {
            marker = fence[2] as string;

            continue;
        }

        const heading = /^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*$/.exec(line);

        if (heading === null) {
            continue;
        }

        const text = plainText((heading[2] as string).replace(/[ \t]+#+$/, ""));
        const base = slugify(text);
        let slug = base;

        for (let count = 1; used.has(slug); count++) {
            slug = `${base}-${count}`;
        }

        used.add(slug);
        headings.push({
            level: (heading[1] as string).length,
            text,
            slug,
            line: index + 1,
        });
    }

    return headings;
}
