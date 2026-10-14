/**
 * Assembles package README files from VitePress documentation.
 *
 * For each package with a `tolki.docs` field in its package.json, this script:
 * 1. Reads the package's README.md
 * 2. Finds the `<!-- AUTO-GENERATED-DOCS:START -->` sentinel
 * 3. Reads and strips VitePress-specific syntax from the listed doc files
 * 4. Replaces everything between the sentinels with the assembled content
 *
 * Usage:
 *   ts-node scripts/readme-build.ts                    # all packages
 *   ts-node scripts/readme-build.ts --filter @tolki/enum  # single package
 *
 * Configuration:
 *   In each package's package.json, add:
 *   {
 *     "tolki": {
 *       "docs": ["enums/index.md", "enums/enum-utilities-list.md"]
 *     }
 *   }
 *   Paths are relative to docs/vitepress/
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseHeadings } from "./docs-markdown.ts";

/** Absolute path to the monorepo root (one level above scripts/). */
const MONOREPO_ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
);

const SENTINEL_START = "<!-- AUTO-GENERATED-DOCS:START -->";
const SENTINEL_END = "<!-- AUTO-GENERATED-DOCS:END -->";

/** Canonical base URL for the published VitePress docs site. */
const SITE_BASE = "https://tolki.abe.dev";

interface PackageInfo {
    name: string;
    dirName: string;
    packageJsonPath: string;
    readmePath: string;
    docFiles: string[];
}

/**
 * Increase markdown heading levels by one while preserving fenced code blocks.
 *
 * Headings from `#` through `#####` are shifted down one level. Existing
 * `######` headings are clamped at level 6 so the output stays valid markdown.
 * Triple-backtick fenced code blocks are left untouched.
 *
 * @param content - Markdown content to adjust.
 * @returns Markdown content with headings shifted down one level.
 */
export function increaseHeadingLevels(content: string): string {
    let inCodeFence = false;

    return content
        .split(/\r?\n/)
        .map((line) => {
            if (/^ {0,3}```/.test(line)) {
                inCodeFence = !inCodeFence;
                return line;
            }

            if (inCodeFence) {
                return line;
            }

            return line.replace(
                /^( {0,3})(#{1,6})([ \t]+.*)$/u,
                (_match, indent: string, hashes: string, rest: string) => {
                    if (hashes.length >= 6) {
                        return `${indent}######${rest}`;
                    }

                    return `${indent}${"#".repeat(hashes.length + 1)}${rest}`;
                },
            );
        })
        .join("\n");
}

interface GroupFence {
    title: string | null;
    start: number;
    end: number;
}

interface CodeGroup {
    start: number;
    end: number;
    fences: GroupFence[];
}

/**
 * Locate each `::: code-group` and the fenced blocks inside it.
 *
 * @param lines - The page split into lines.
 * @returns Groups with zero-based, inclusive line ranges in document order,
 *   and the indexes of every line that belongs to a fence.
 */
function scanCodeGroups(lines: string[]): {
    groups: CodeGroup[];
    fencedLines: Set<number>;
} {
    const groups: CodeGroup[] = [];
    const fencedLines = new Set<number>();
    let current: CodeGroup | null = null;
    let open: { marker: string; start: number; title: string | null } | null =
        null;

    for (const [index, raw] of lines.entries()) {
        const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
        const trimmed = line.trim();

        if (open !== null) {
            fencedLines.add(index);

            if (
                trimmed.length >= open.marker.length &&
                trimmed === open.marker[0]?.repeat(trimmed.length)
            ) {
                current?.fences.push({
                    title: open.title,
                    start: open.start,
                    end: index,
                });
                open = null;
            }

            continue;
        }

        const fence = /^ {0,3}(`{3,}|~{3,})\s*(.*)$/.exec(line);

        if (fence !== null) {
            fencedLines.add(index);
            open = {
                marker: fence[1] as string,
                start: index,
                title: /\[([^\]]*)\]/.exec(fence[2] as string)?.[1] ?? null,
            };
        } else if (/^:::\s*code-group\b/.test(trimmed)) {
            current = { start: index, end: lines.length - 1, fences: [] };
            groups.push(current);
        } else if (trimmed === ":::" && current !== null) {
            current.end = index;
            current = null;
        }
    }

    return { groups, fencedLines };
}

/**
 * Narrow a shared docs page to one package's own code-group tabs.
 *
 * A group is a variant group when every titled fence in it has a title that
 * starts with `@tolki/`. Such a group keeps only the tab titled `packageName`.
 * When no tab matches, the enclosing section is dropped, along with every
 * `[text](#slug)` link that pointed at it. Other groups are left untouched.
 *
 * @param content - Raw VitePress markdown content.
 * @param packageName - The package whose tab to keep, e.g. "@tolki/arr".
 * @returns The content for that package, or `content` itself when the page
 *   has no variant group.
 */
export function filterPackageVariants(
    content: string,
    packageName: string,
): string {
    const lines = content.split("\n");
    const { groups, fencedLines } = scanCodeGroups(lines);
    const variantGroups = groups.filter((candidate) => {
        const titles = candidate.fences.flatMap((fence) =>
            fence.title === null ? [] : [fence.title],
        );

        return (
            titles.length > 0 &&
            titles.every((title) => title.startsWith("@tolki/"))
        );
    });

    if (variantGroups.length === 0) {
        return content;
    }

    // Slugs and section ends come from the unfiltered page so `-1` suffixes stay right.
    const headings = parseHeadings(content);
    const removed = new Set<number>();
    const droppedSlugs = new Set<string>();

    for (const variantGroup of variantGroups) {
        const keeps = variantGroup.fences.some(
            (fence) => fence.title === packageName,
        );

        if (keeps) {
            for (const fence of variantGroup.fences) {
                if (fence.title !== null && fence.title !== packageName) {
                    for (let at = fence.start; at <= fence.end; at++) {
                        removed.add(at);
                    }
                }
            }

            continue;
        }

        const heading = headings
            .filter((candidate) => candidate.line - 1 < variantGroup.start)
            .at(-1);

        if (heading === undefined) {
            for (let at = variantGroup.start; at <= variantGroup.end; at++) {
                removed.add(at);
            }

            continue;
        }

        const next = headings.find(
            (candidate) =>
                candidate.line - 1 > variantGroup.start &&
                candidate.level <= heading.level,
        );
        const sectionEnd = next === undefined ? lines.length : next.line - 1;

        for (let at = heading.line - 1; at < sectionEnd; at++) {
            removed.add(at);
        }

        droppedSlugs.add(heading.slug);
    }

    const kept: string[] = [];

    for (const [index, line] of lines.entries()) {
        if (removed.has(index)) {
            continue;
        }

        kept.push(
            fencedLines.has(index) || droppedSlugs.size === 0
                ? line
                : removeDroppedLinks(line, droppedSlugs),
        );
    }

    return kept.join("\n");
}

/**
 * Remove `[text](#slug)` links to dropped sections, plus one adjacent space.
 *
 * @param line - A line outside any fence.
 * @param slugs - Anchors of the removed sections.
 * @returns The line without those links.
 */
function removeDroppedLinks(line: string, slugs: Set<string>): string {
    let result = "";
    let cursor = 0;

    for (const link of line.matchAll(/\[[^\]]*\]\(#([^)\s]*)\)/g)) {
        const slug = link[1] as string;
        const start = link.index;
        let end = start + link[0].length;

        if (!slugs.has(slug) || start < cursor) {
            continue;
        }

        let from = start;

        if (line[end] === " ") {
            end++;
        } else if (from > cursor && line[from - 1] === " ") {
            from--;
        }

        result += line.slice(cursor, from);
        cursor = end;
    }

    return result + line.slice(cursor);
}

/**
 * Rewrite relative markdown doc links (`./foo.md`, `../dir/foo.md`, each with
 * an optional `#frag`) to absolute docs-site URLs.
 *
 * Within docs/vitepress, a link like `./analyzer-api.md` resolves fine
 * because VitePress renders it alongside its sibling files. Once the same
 * text is spliced into a package README (npm, GitHub), that relative path
 * points at a `.md` file that doesn't exist there, so the link dangles.
 * Rewriting it to the published site URL (matching the `.html`-suffixed
 * canonical links already hand-written elsewhere in this repo, e.g.
 * `packages/str/src/str.ts`'s `@see` comments) keeps the link resolvable.
 *
 * @param content - Markdown content to rewrite.
 * @param docDir - Directory of the source doc file, relative to
 *   docs/vitepress/ (e.g. "ts"), used as the URL's section segment.
 * @returns Markdown content with relative `./*.md` and `../<dir>/*.md`
 *   links rewritten to absolute docs-site URLs.
 */
export function rewriteRelativeDocLinks(
    content: string,
    docDir: string,
): string {
    return content
        .replace(
            /\]\(\.\/([^)#]+)\.md(#[^)]*)?\)/g,
            (_match, slug: string, fragment: string | undefined) =>
                `](${SITE_BASE}/${docDir}/${slug}.html${fragment ?? ""})`,
        )
        .replace(
            /\]\(\.\.\/([^)#/]+)\/([^)#]+)\.md(#[^)]*)?\)/g,
            (_match, dir: string, slug: string, fragment: string | undefined) =>
                `](${SITE_BASE}/${dir}/${slug}.html${fragment ?? ""})`,
        );
}

/**
 * Strip VitePress-specific syntax from markdown content.
 *
 * Removes:
 * - YAML frontmatter (--- ... ---)
 * - ::: code-group / ::: containers (keeps inner content)
 * - Raw HTML wrappers (<div>, </div>, <script setup>, etc.)
 * - Increases markdown headings by one level for README nesting
 * - Collapses 3+ consecutive blank lines into 2
 * - Rewrites relative `./*.md` doc links to absolute docs-site URLs
 *   (when `docDir` is given)
 *
 * @param content - Raw VitePress markdown content.
 * @param docDir - Directory of the source doc file, relative to
 *   docs/vitepress/, used to resolve relative doc links. Omit to leave
 *   relative doc links untouched.
 * @returns Cleaned markdown suitable for GitHub/npm README rendering.
 */
export function stripVitepressSyntax(content: string, docDir?: string): string {
    let result = content;

    // Remove YAML frontmatter
    result = result.replace(/^---\n[\s\S]*?\n---\n?/, "");

    // Rewrite relative doc links before anything else touches the text.
    if (docDir) {
        result = rewriteRelativeDocLinks(result, docDir);
    }

    // Remove ::: code-group and closing ::: lines (keep inner content)
    result = result.replace(/^:::.*$/gm, "");

    // Remove HTML div wrappers (common in VitePress docs)
    result = result.replace(/^<\/?div[^>]*>$/gm, "");

    // Remove Vue <script setup> blocks
    result = result.replace(/<script setup>[\s\S]*?<\/script>/g, "");

    // Remove standalone Vue component tags (single-line or multi-line, e.g. <FnTry ... />)
    result = result.replace(/^<[A-Z][a-zA-Z]*[\s\S]*?\/>\n?/gm, "");

    // Nest imported docs under the package README heading hierarchy.
    result = increaseHeadingLevels(result);

    // Collapse 3+ consecutive blank lines into 2
    result = result.replace(/\n{3,}/g, "\n\n");

    return result.trim();
}

/**
 * Discover packages that have a `tolki.docs` configuration.
 *
 * @param filterName - Optional package name to filter (e.g. "@tolki/enum").
 * @returns Array of package info objects with doc file lists.
 */
export function discoverPackages(filterName?: string): PackageInfo[] {
    const packagesDir = path.join(MONOREPO_ROOT, "packages");
    const packages: PackageInfo[] = [];

    if (!fs.existsSync(packagesDir)) {
        throw new Error(`Packages directory not found: ${packagesDir}`);
    }

    const dirs = fs.readdirSync(packagesDir).filter((item) => {
        const itemPath = path.join(packagesDir, item);
        return fs.statSync(itemPath).isDirectory();
    });

    for (const dirName of dirs) {
        const packageJsonPath = path.join(packagesDir, dirName, "package.json");

        if (!fs.existsSync(packageJsonPath)) {
            continue;
        }

        const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf-8"),
        );
        const name: string = packageJson.name ?? `@tolki/${dirName}`;

        if (filterName && name !== filterName) {
            continue;
        }

        const docFiles: string[] | undefined = packageJson.tolki?.docs;

        if (!docFiles || docFiles.length === 0) {
            continue;
        }

        const readmePath = path.join(packagesDir, dirName, "README.md");

        packages.push({
            name,
            dirName,
            packageJsonPath,
            readmePath,
            docFiles,
        });
    }

    return packages;
}

/**
 * Turns heading text into the anchor GitHub and npm give it, which drops punctuation instead of hyphenating it.
 *
 * @param text - The heading text.
 * @returns The anchor slug, before any `-N` duplicate suffix.
 */
export function githubSlug(text: string): string {
    return text
        .replace(/`/g, "")
        .replace(/<[A-Za-z/!][^>]*>/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
        .replace(/\s/g, "-");
}

/**
 * Rewrite in-page `](#slug)` links from VitePress slugs to GitHub's, so they scroll on GitHub and npm.
 *
 * @param content - Markdown with VitePress anchors.
 * @returns The content with each matching in-page link pointing at the GitHub slug.
 */
export function rewriteAnchorsForGitHub(content: string): string {
    const slugs = new Map<string, string>();
    const seen = new Map<string, number>();

    for (const heading of parseHeadings(content)) {
        const base = githubSlug(heading.text);
        const count = seen.get(base) ?? 0;

        seen.set(base, count + 1);
        slugs.set(heading.slug, count === 0 ? base : `${base}-${count}`);
    }

    let marker: string | null = null;

    return content
        .split("\n")
        .map((line) => {
            const fence = /^ {0,3}(`{3,}|~{3,})/.exec(line);

            if (marker !== null) {
                const trimmed = line.trim();

                if (
                    fence !== null &&
                    trimmed === marker[0]?.repeat(trimmed.length) &&
                    trimmed.length >= marker.length
                ) {
                    marker = null;
                }

                return line;
            }

            if (fence !== null) {
                marker = fence[1] as string;

                return line;
            }

            return line.replace(/\]\(#([^)\s]+)\)/g, (match, slug: string) => {
                const target = slugs.get(slug);

                return target === undefined ? match : `](#${target})`;
            });
        })
        .join("\n");
}

/**
 * Assemble documentation content from VitePress files.
 *
 * @param docFiles - Array of doc file paths relative to docs/vitepress/.
 * @param packageName - Package whose code-group tabs to keep. Omit to keep
 *   every tab.
 * @param docsRoot - Directory the doc files resolve against. Defaults to
 *   docs/vitepress/.
 * @returns Assembled and cleaned markdown content.
 */
export function assembleDocsContent(
    docFiles: string[],
    packageName?: string,
    docsRoot?: string,
): string {
    const docsDir = docsRoot ?? path.join(MONOREPO_ROOT, "docs", "vitepress");
    const sections: string[] = [];

    for (const docFile of docFiles) {
        const filePath = path.join(docsDir, docFile);

        if (!fs.existsSync(filePath)) {
            console.error(`  ❌ Doc file not found: ${docFile}`);
            continue;
        }

        const source = fs.readFileSync(filePath, "utf-8");
        // Must run before stripping, while the `:::` lines still mark groups.
        const raw = packageName
            ? filterPackageVariants(source, packageName)
            : source;
        const docDir = docFile.includes("/")
            ? docFile.slice(0, docFile.lastIndexOf("/"))
            : "";
        const cleaned = stripVitepressSyntax(
            rewriteAnchorsForGitHub(raw),
            docDir,
        );

        if (cleaned.length > 0) {
            sections.push(cleaned);
        }
    }

    return sections.join("\n\n");
}

/**
 * Build the README for a single package.
 *
 * Reads the existing README, finds the sentinel markers, and replaces
 * the content between them with freshly assembled documentation.
 *
 * @param pkg - The package info to build the README for.
 * @returns true if successful, false if an error occurred.
 */
export function buildReadme(pkg: PackageInfo): boolean {
    console.log(`\n📦 ${pkg.name}`);

    if (!fs.existsSync(pkg.readmePath)) {
        console.error(`  ❌ README.md not found: ${pkg.readmePath}`);
        return false;
    }

    const readme = fs.readFileSync(pkg.readmePath, "utf-8");
    const docsContent = assembleDocsContent(pkg.docFiles, pkg.name);

    if (docsContent.length === 0) {
        console.error(`  ❌ No documentation content assembled`);
        return false;
    }

    const startIndex = readme.indexOf(SENTINEL_START);

    let manualContent: string;
    if (startIndex === -1) {
        // No sentinel found — append at the end
        manualContent = readme.trimEnd();
        console.log(`  ⚠️  No sentinel found — appending at end of README`);
    } else {
        // Keep everything before the sentinel
        manualContent = readme.slice(0, startIndex).trimEnd();
    }

    const assembled = [
        manualContent,
        "",
        SENTINEL_START,
        "",
        docsContent,
        "",
        SENTINEL_END,
        "",
    ].join("\n");

    fs.writeFileSync(pkg.readmePath, assembled, "utf-8");
    console.log(
        `  ✅ README.md updated (${pkg.docFiles.length} doc file${pkg.docFiles.length === 1 ? "" : "s"} assembled)`,
    );

    return true;
}

/**
 * Main entry point for the README build script.
 */
export function main(): void {
    console.log("📝 Building package READMEs from VitePress docs...");

    // Parse --filter argument
    const filterIndex = process.argv.indexOf("--filter");
    const filterName =
        filterIndex !== -1 ? process.argv[filterIndex + 1] : undefined;

    if (filterName) {
        console.log(`  Filtering to: ${filterName}`);
    }

    try {
        const packages = discoverPackages(filterName);

        if (packages.length === 0) {
            console.log('\nNo packages found with "tolki.docs" configuration.');

            if (filterName) {
                console.log(
                    `  Make sure ${filterName} has a "tolki.docs" field in its package.json.`,
                );
            }

            return;
        }

        console.log(
            `\nFound ${packages.length} package${packages.length === 1 ? "" : "s"} with docs config:`,
        );

        for (const pkg of packages) {
            console.log(`  📄 ${pkg.name} (${pkg.docFiles.length} files)`);
        }

        let successCount = 0;
        let errorCount = 0;

        for (const pkg of packages) {
            if (buildReadme(pkg)) {
                successCount++;
            } else {
                errorCount++;
            }
        }

        console.log(`\n${"═".repeat(50)}`);
        console.log(`Summary:`);
        console.log(`  ✅ Updated: ${successCount}`);

        if (errorCount > 0) {
            console.log(`  ❌ Errors: ${errorCount}`);
        }

        console.log("═".repeat(50));

        if (errorCount > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error(
            `\n❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
    }
}

// Export for use in other modules
export { SENTINEL_END, SENTINEL_START };

// Run when invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
