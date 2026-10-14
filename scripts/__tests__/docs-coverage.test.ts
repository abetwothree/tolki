import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
    brokenAnchors,
    brokenCrossPageAnchors,
    type CoverageIssue,
    coverageReport,
    importedNames,
    listCollectionMembers,
    listPackageExports,
    mismatchedVariantFences,
} from "../docs-coverage.ts";
import { parseFences, parseHeadings } from "../docs-markdown.ts";

const fixture = readFileSync(
    path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "fixtures",
        "docs-coverage.md",
    ),
    "utf8",
);

describe("listPackageExports", () => {
    it("reads obj exports", () => {
        const names = listPackageExports("obj");

        expect(names).toContain("objectItem");
        expect(names).toContain("flattenDot");
        expect(names).not.toContain("arrayItem");
    });

    it("reads data exports", () => {
        const names = listPackageExports("data");

        expect(names).toContain("dataGet");
        expect(names).toContain("dataCount");
    });

    it("lists an overloaded function once", () => {
        const names = listPackageExports("obj");

        expect(names.filter((name) => name === "accessible")).toHaveLength(1);
    });
});

describe("listCollectionMembers", () => {
    it("lists public members only", () => {
        const names = listCollectionMembers();

        for (const name of ["make", "toJSON", "length", "Symbol.iterator"]) {
            expect(names).toContain(name);
        }

        expect(names).not.toContain("newInstance");
        expect(names).not.toContain("castToItems");
        expect(names).not.toContain("constructor");
    });
});

describe("importedNames", () => {
    it("maps a tab title to the names it imports from its own package", () => {
        const names = importedNames(fixture);

        expect(names.get("@tolki/obj")).toEqual(new Set(["get"]));
        expect(names.get("@tolki/arr")).toEqual(new Set(["get"]));
    });
});

describe("brokenAnchors", () => {
    it("flags a link with no heading and accepts a numbered duplicate", () => {
        const issues = brokenAnchors(fixture, "page.md");

        expect(issues).toEqual([
            { kind: "anchor", page: "page.md", slug: "nope", line: 7 },
        ]);
    });
});

describe("brokenCrossPageAnchors", () => {
    const docsRoot = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "fixtures",
        "docs-coverage-root",
    );
    const page = "arrays-objects/links.md";
    const links = readFileSync(path.join(docsRoot, page), "utf8");

    it("reports a cross-page anchor with no matching heading", () => {
        expect(brokenCrossPageAnchors(links, page, docsRoot)).toEqual([
            {
                kind: "anchor",
                page,
                slug: "arrays-objects/other.md#nope",
                line: 3,
            },
        ]);
    });

    it("accepts a cross-page anchor that matches a heading", () => {
        expect(
            brokenCrossPageAnchors(
                "[a](./other.md#real-heading)",
                page,
                docsRoot,
            ),
        ).toEqual([]);
    });

    it("resolves parent-relative links", () => {
        expect(
            brokenCrossPageAnchors(
                "[a](../collections/target.md#good)\n[b](../collections/target.md#bad)",
                page,
                docsRoot,
            ),
        ).toEqual([
            {
                kind: "anchor",
                page,
                slug: "collections/target.md#bad",
                line: 2,
            },
        ]);
    });

    it("ignores links inside fences", () => {
        expect(
            brokenCrossPageAnchors(
                "```md\n[a](./other.md#nope)\n```",
                page,
                docsRoot,
            ),
        ).toEqual([]);
    });

    it("ignores a missing target page", () => {
        expect(
            brokenCrossPageAnchors("[a](./ghost.md#x)", page, docsRoot),
        ).toEqual([]);
    });

    it("uses VitePress slugs, including -1 suffixes", () => {
        expect(
            brokenCrossPageAnchors(
                "[a](./other.md#tojson)\n[b](./other.md#tojson-1)\n[c](./other.md#tojson-2)",
                page,
                docsRoot,
            ).map((issue) => (issue.kind === "anchor" ? issue.slug : "")),
        ).toEqual(["arrays-objects/other.md#tojson-2"]);
    });
});

describe("mismatchedVariantFences", () => {
    it("flags a tab that imports from another package", () => {
        expect(mismatchedVariantFences(fixture, "page.md")).toEqual([
            {
                kind: "fence",
                page: "page.md",
                title: "@tolki/obj",
                module: "@tolki/arr",
                line: 25,
            },
        ]);
    });
});

describe("coverageReport", () => {
    const docsRoot = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "fixtures",
        "docs-coverage-root",
    );
    const ids = (issues: CoverageIssue[]): string[] =>
        issues.flatMap((issue) =>
            issue.kind === "missing" ? [`${issue.owner}:${issue.name}`] : [],
        );

    it("does not report a documented name and reports an undocumented one", () => {
        const found = ids(coverageReport({ docsRoot }));

        expect(found).not.toContain("arr:get");
        expect(found).not.toContain("obj:get");
        expect(found).not.toContain("data:dataGet");
        expect(found).toContain("arr:first");
        expect(found).toContain("data:dataFirst");
    });

    it("limits missing issues to the requested names", () => {
        expect(ids(coverageReport({ docsRoot, only: ["get"] }))).toEqual([
            "collection:get",
        ]);
        expect(ids(coverageReport({ docsRoot, only: ["first"] }))).toEqual([
            "arr:first",
            "obj:first",
            "data:dataFirst",
            "collection:first",
        ]);
    });

    it("scopes to the arrays-objects page", () => {
        const issues = coverageReport({
            docsRoot,
            only: ["first"],
            page: "arrays-objects",
        });

        expect(ids(issues)).toEqual([
            "arr:first",
            "obj:first",
            "data:dataFirst",
        ]);
    });

    it("scopes to the collections page", () => {
        const issues = coverageReport({
            docsRoot,
            only: ["get"],
            page: "collections",
        });

        expect(issues).toEqual([
            {
                kind: "missing",
                page: "collections/methods-list.md",
                owner: "collection",
                name: "get",
            },
        ]);
    });

    it("includes cross-page anchors, scoped by page", () => {
        const expected = {
            kind: "anchor",
            page: "arrays-objects/links.md",
            slug: "arrays-objects/other.md#nope",
            line: 3,
        };

        expect(coverageReport({ docsRoot, only: [] })).toContainEqual(expected);
        expect(
            coverageReport({ docsRoot, only: [], page: "arrays-objects" }),
        ).toContainEqual(expected);
        expect(
            coverageReport({ docsRoot, only: [], page: "collections" }),
        ).not.toContainEqual(expected);
    });

    it("reports every collection member for a missing page", () => {
        const found = ids(coverageReport({ docsRoot, page: "collections" }));

        expect(found).toEqual(
            listCollectionMembers().map((name) => `collection:${name}`),
        );
    });
});

const DOCS_ROOT = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "docs",
    "vitepress",
);
const UTILITIES = "arrays-objects/utilities-list.md";
const METHODS = "collections/methods-list.md";
const CITATION = /<!--[^>]*docs\/php-parity\/[^>]*-->/;

interface Section {
    heading: string;
    line: number;
    text: string;
    outsideCode: string;
    fences: ReturnType<typeof parseFences>;
}

/**
 * Reads a real docs page.
 *
 * @param page - The page path relative to `docs/vitepress`.
 * @returns The page source.
 */
function readDoc(page: string): string {
    return readFileSync(path.join(DOCS_ROOT, page), "utf8");
}

/**
 * Splits a page into its `###` sections, each with its fences and its text outside fences.
 *
 * @param markdown - The page source.
 * @returns The sections in document order.
 */
function referenceSections(markdown: string): Section[] {
    const lines = markdown.split("\n");
    const headings = parseHeadings(markdown);
    const sections: Section[] = [];

    for (const [index, heading] of headings.entries()) {
        if (heading.level !== 3) {
            continue;
        }

        const end = headings[index + 1]?.line ?? lines.length + 1;
        const body = lines.slice(heading.line - 1, end - 1);
        const fences = parseFences(body.join("\n"));
        const covered = new Set<number>();

        for (const fence of fences) {
            const count = fence.code === "" ? 0 : fence.code.split("\n").length;

            for (let n = fence.line; n <= fence.line + count + 1; n++) {
                covered.add(n);
            }
        }

        sections.push({
            heading: heading.text,
            line: heading.line,
            text: body.join("\n"),
            outsideCode: body.filter((_, i) => !covered.has(i + 1)).join("\n"),
            fences,
        });
    }

    return sections;
}

/**
 * Lists the top-level bullets under a `##` heading, with the line each one starts on.
 *
 * @param markdown - The page source.
 * @param heading - The `##` heading text.
 * @returns Each bullet's 1-based line, its first line, and the line before it.
 */
function topLevelBullets(
    markdown: string,
    heading: string,
): { line: number; first: string; before: string }[] {
    const lines = markdown.split("\n");
    const headings = parseHeadings(markdown);
    const start = headings.findIndex(
        (h) => h.level === 2 && h.text === heading,
    );

    if (start === -1) {
        throw new Error(`no "## ${heading}" heading`);
    }

    const from = (headings[start] as { line: number }).line;
    const to = headings[start + 1]?.line ?? lines.length + 1;
    const bullets: { line: number; first: string; before: string }[] = [];

    for (let n = from + 1; n < to; n++) {
        const text = lines[n - 1] as string;

        if (text.startsWith("- ")) {
            bullets.push({
                line: n,
                first: text,
                before: lines[n - 2] ?? "",
            });
        }
    }

    return bullets;
}

describe("documentation is complete", () => {
    const issues = coverageReport();

    it("every arr, obj and data export has a tab", () => {
        expect(
            issues.filter(
                (i) =>
                    i.kind === "missing" && i.page.startsWith("arrays-objects"),
            ),
        ).toEqual([]);
    });

    it("every public Collection member has a section", () => {
        expect(
            issues.filter(
                (i) => i.kind === "missing" && i.page.startsWith("collections"),
            ),
        ).toEqual([]);
    });

    it("every in-page anchor resolves", () => {
        expect(issues.filter((i) => i.kind === "anchor")).toEqual([]);
    });

    it("every variant tab imports its own package", () => {
        expect(issues.filter((i) => i.kind === "fence")).toEqual([]);
    });

    it("every reference section has a checked example", () => {
        const unchecked: string[] = [];

        for (const page of [UTILITIES, METHODS]) {
            for (const section of referenceSections(readDoc(page))) {
                if (
                    !["random", "shuffle"].includes(section.heading) &&
                    !section.fences.some((f) => f.code.includes("// =>"))
                ) {
                    unchecked.push(`${page} ### ${section.heading}`);
                }
            }
        }

        expect(unchecked).toEqual([]);
    });

    it("every utilities-list section names its exports outside code", () => {
        const unnamed: string[] = [];

        for (const section of referenceSections(readDoc(UTILITIES))) {
            const imported = importedNames(section.text);

            for (const [title, names] of imported) {
                for (const name of names) {
                    if (!section.outsideCode.includes(`\`${name}\``)) {
                        unnamed.push(
                            `### ${section.heading}: ${title} ${name}`,
                        );
                    }
                }
            }
        }

        expect(unnamed).toEqual([]);
    });

    it("every parity claim cites a transcript", () => {
        const uncited: string[] = [];

        for (const page of [UTILITIES, METHODS]) {
            const lines = readDoc(page).split("\n");

            for (const [index, text] of lines.entries()) {
                if (!text.startsWith("::: info")) {
                    continue;
                }

                let before = index - 1;

                while (before >= 0 && lines[before]?.trim() === "") {
                    before--;
                }

                if (!CITATION.test(lines[before] ?? "")) {
                    uncited.push(`${page}:${index + 1} ::: info`);
                }
            }
        }

        const bulletPages: [string, string[]][] = [
            [
                "arrays-objects/differences.md",
                [
                    "Return values instead of references",
                    "Behaviour differences",
                ],
            ],
            ["collections/differences.md", ["Keys and order", "Values"]],
        ];

        for (const [page, headings] of bulletPages) {
            const markdown = readDoc(page);

            for (const heading of headings) {
                for (const bullet of topLevelBullets(markdown, heading)) {
                    if (
                        !CITATION.test(bullet.first) &&
                        !CITATION.test(bullet.before)
                    ) {
                        uncited.push(`${page}:${bullet.line} ${heading}`);
                    }
                }
            }
        }

        expect(uncited).toEqual([]);
    });
});
