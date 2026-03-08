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

/** Absolute path to the monorepo root (one level above scripts/). */
const MONOREPO_ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
);

const SENTINEL_START = "<!-- AUTO-GENERATED-DOCS:START -->";
const SENTINEL_END = "<!-- AUTO-GENERATED-DOCS:END -->";

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

/**
 * Strip VitePress-specific syntax from markdown content.
 *
 * Removes:
 * - YAML frontmatter (--- ... ---)
 * - ::: code-group / ::: containers (keeps inner content)
 * - Raw HTML wrappers (<div>, </div>, <script setup>, etc.)
 * - Increases markdown headings by one level for README nesting
 * - Collapses 3+ consecutive blank lines into 2
 *
 * @param content - Raw VitePress markdown content.
 * @returns Cleaned markdown suitable for GitHub/npm README rendering.
 */
export function stripVitepressSyntax(content: string): string {
    let result = content;

    // Remove YAML frontmatter
    result = result.replace(/^---\n[\s\S]*?\n---\n?/, "");

    // Remove ::: code-group and closing ::: lines (keep inner content)
    result = result.replace(/^:::.*$/gm, "");

    // Remove HTML div wrappers (common in VitePress docs)
    result = result.replace(/^<\/?div[^>]*>$/gm, "");

    // Remove Vue <script setup> blocks
    result = result.replace(/<script setup>[\s\S]*?<\/script>/g, "");

    // Remove standalone Vue component tags (single-line)
    result = result.replace(/^<[A-Z][a-zA-Z]*[^>]*\/>$/gm, "");

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
 * Assemble documentation content from VitePress files.
 *
 * @param docFiles - Array of doc file paths relative to docs/vitepress/.
 * @returns Assembled and cleaned markdown content.
 */
export function assembleDocsContent(docFiles: string[]): string {
    const docsDir = path.join(MONOREPO_ROOT, "docs", "vitepress");
    const sections: string[] = [];

    for (const docFile of docFiles) {
        const filePath = path.join(docsDir, docFile);

        if (!fs.existsSync(filePath)) {
            console.error(`  ❌ Doc file not found: ${docFile}`);
            continue;
        }

        const raw = fs.readFileSync(filePath, "utf-8");
        const cleaned = stripVitepressSyntax(raw);

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
    const docsContent = assembleDocsContent(pkg.docFiles);

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
