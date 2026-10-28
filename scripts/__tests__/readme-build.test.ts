import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
    assembleDocsContent,
    filterPackageVariants,
    githubSlug,
    parseReadmeArgs,
    rewriteAnchorsForGitHub,
    rewriteRelativeDocLinks,
    stripVitepressSyntax,
} from "../readme-build.ts";

const DOCS_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "docs",
    "vitepress",
);

const FIXTURE_ROOT = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "fixtures",
    "readme-build-root",
);

const FENCE = "```";

/**
 * Builds a code group whose tabs are the given titles.
 *
 * @param titles - Tab titles in order.
 * @returns The group as VitePress source.
 */
function group(...titles: string[]): string {
    const tabs = titles.map(
        (title) => `${FENCE}ts [${title}]\nuse("${title}");\n${FENCE}`,
    );

    return `::: code-group\n\n${tabs.join("\n\n")}\n\n:::`;
}

const THREE = group("@tolki/arr", "@tolki/obj", "@tolki/data");

describe("filterPackageVariants", () => {
    it("keeps only the package's tab", () => {
        const result = filterPackageVariants(
            `### get\n\nRead a value.\n\n${THREE}\n`,
            "@tolki/obj",
        );

        expect(result).toContain('use("@tolki/obj");');
        expect(result).not.toContain('use("@tolki/arr");');
        expect(result).not.toContain('use("@tolki/data");');
        expect(result).not.toContain("[@tolki/arr]");
    });

    it("drops a section the package lacks", () => {
        const doc = [
            "[count](#count) [get](#get)",
            "",
            "### count",
            "",
            "Count items.",
            "",
            group("@tolki/data"),
            "",
            "### get",
            "",
            "Read a value.",
            "",
            group("@tolki/arr", "@tolki/data"),
            "",
        ].join("\n");
        const result = filterPackageVariants(doc, "@tolki/arr");

        expect(result).not.toContain("### count");
        expect(result).not.toContain("Count items.");
        expect(result).not.toContain("[count](#count)");
        expect(result).toContain("[get](#get)");
        expect(result.startsWith("[get](#get)\n")).toBe(true);
        expect(result).toContain("### get");
    });

    it("removes one space beside a dropped chip wherever it sits", () => {
        const doc = [
            "[a](#a) [count](#count) [b](#b) [count](#count)",
            "",
            "### a",
            "",
            group("@tolki/arr"),
            "",
            "### count",
            "",
            group("@tolki/data"),
            "",
            "### b",
            "",
            group("@tolki/arr"),
            "",
        ].join("\n");

        expect(filterPackageVariants(doc, "@tolki/arr").split("\n")[0]).toBe(
            "[a](#a) [b](#b)",
        );
    });

    it("keeps a section shared by all three", () => {
        const result = filterPackageVariants(
            `### get\n\nRead a value.\n\n${THREE}\n`,
            "@tolki/arr",
        );

        expect(result).toContain("### get");
        expect(result).toContain("Read a value.");
        expect(result).toContain('use("@tolki/arr");');
    });

    it("ends a section at the next heading of the same or a higher level", () => {
        const doc = [
            "## Group",
            "",
            "### count",
            "",
            group("@tolki/data"),
            "",
            "#### detail",
            "",
            "Detail text.",
            "",
            "### get",
            "",
            group("@tolki/arr"),
            "",
        ].join("\n");
        const result = filterPackageVariants(doc, "@tolki/arr");

        expect(result).toContain("## Group");
        expect(result).not.toContain("### count");
        expect(result).not.toContain("#### detail");
        expect(result).not.toContain("Detail text.");
        expect(result).toContain("### get");
    });

    it("computes dropped slugs on the unfiltered document", () => {
        const doc = [
            "[x](#dup) [y](#dup-1)",
            "",
            "### dup",
            "",
            group("@tolki/arr"),
            "",
            "### dup",
            "",
            group("@tolki/data"),
            "",
        ].join("\n");

        expect(filterPackageVariants(doc, "@tolki/arr").split("\n")[0]).toBe(
            "[x](#dup)",
        );
    });

    it("ignores headings and chips inside fences", () => {
        const doc = [
            `${FENCE}md`,
            "### literal",
            "[count](#count)",
            FENCE,
            "",
            "### count",
            "",
            group("@tolki/data"),
            "",
        ].join("\n");
        const result = filterPackageVariants(doc, "@tolki/arr");

        expect(result).toContain("### literal");
        expect(result).toContain("[count](#count)");
        expect(result).not.toContain("### count\n");
    });

    it("leaves package-manager groups alone", () => {
        const doc = `### Install\n\n${group("npm", "yarn", "pnpm")}\n`;

        expect(filterPackageVariants(doc, "@tolki/arr")).toBe(doc);
    });

    it("leaves a group that mixes package and other titles alone", () => {
        const doc = `### Mixed\n\n${group("@tolki/obj", "npm")}\n`;

        expect(filterPackageVariants(doc, "@tolki/arr")).toBe(doc);
    });

    it("drops only the group when no heading encloses it", () => {
        const doc = `Intro.\n\n${group("@tolki/data")}\n\nOutro.\n`;
        const result = filterPackageVariants(doc, "@tolki/arr");

        expect(result).toContain("Intro.");
        expect(result).toContain("Outro.");
        expect(result).not.toContain("@tolki/data");
    });

    it("keeps untitled fences inside a variant group", () => {
        const doc = [
            "### get",
            "",
            "::: code-group",
            "",
            `${FENCE}ts`,
            "plain();",
            FENCE,
            "",
            `${FENCE}ts [@tolki/obj]`,
            "other();",
            FENCE,
            "",
            ":::",
            "",
        ].join("\n");
        const result = filterPackageVariants(doc, "@tolki/obj");

        expect(result).toContain("### get");
        expect(result).toContain("other();");
        expect(result).toContain("plain();");
    });

    it("keeps a section when every tab matches", () => {
        const doc = `### get\n\n${group("@tolki/arr")}\n`;

        expect(filterPackageVariants(doc, "@tolki/arr")).toBe(
            `### get\n\n::: code-group\n\n${FENCE}ts [@tolki/arr]\nuse("@tolki/arr");\n${FENCE}\n\n:::\n`,
        );
    });

    it("is the identity for pages without variant groups", () => {
        for (const page of [
            "strings/string-utilities-list.md",
            "numbers/number-utilities-list.md",
            "typescript/typescript-utilities-list.md",
            "ts/index.md",
        ]) {
            const raw = fs.readFileSync(path.join(DOCS_DIR, page), "utf-8");

            expect(filterPackageVariants(raw, "@tolki/arr")).toBe(raw);
        }
    });
});

describe("rewriteRelativeDocLinks", () => {
    it("leaves a link that climbs out of the docs root alone", () => {
        expect(rewriteRelativeDocLinks("[x](../../a/b.md)", "ts")).toBe(
            "[x](../../a/b.md)",
        );
    });

    it("rewrites sibling doc links", () => {
        expect(
            rewriteRelativeDocLinks("[x](./foo.md#bar) [y](./baz.md)", "ts"),
        ).toBe(
            "[x](https://tolki.abe.dev/ts/foo.html#bar) [y](https://tolki.abe.dev/ts/baz.html)",
        );
    });

    it("rewrites parent-relative doc links", () => {
        expect(
            rewriteRelativeDocLinks(
                "[x](../collections/methods-list.md#pluck)",
                "arrays-objects",
            ),
        ).toBe(
            "[x](https://tolki.abe.dev/collections/methods-list.html#pluck)",
        );
    });

    it("rewrites a parent-relative link without a fragment", () => {
        expect(
            rewriteRelativeDocLinks("[x](../collections/differences.md)", "a"),
        ).toBe("[x](https://tolki.abe.dev/collections/differences.html)");
    });
});

describe("parseReadmeArgs", () => {
    it("refuses a filter with no value", () => {
        expect(parseReadmeArgs(["--filter"])).toBeNull();
        expect(parseReadmeArgs(["--filter", "@tolki/arr"])).toEqual({
            filter: "@tolki/arr",
        });
    });
});

describe("stripVitepressSyntax", () => {
    it("strips CRLF frontmatter", () => {
        expect(
            stripVitepressSyntax("---\r\ntitle: X\r\n---\r\n# Hi"),
        ).not.toContain("title");
    });

    it("strips a script setup block that starts a line", () => {
        expect(
            stripVitepressSyntax(
                '# T\n\n<script setup>\nimport X from "x";\n</script>\n\nBody',
            ),
        ).toBe("## T\n\nBody");
    });

    it("keeps prose that mentions script setup mid-line", () => {
        const prose =
            "Use `<script setup>` or a plain block, then close with `</script>` here.";

        expect(stripVitepressSyntax(prose)).toBe(prose);
    });

    it("strips a self-closing component tag inside a line", () => {
        expect(
            stripVitepressSyntax(
                'Reads files <Badge type="info" text="JS only" /> and more.',
            ),
        ).toBe("Reads files and more.");
    });

    it("strips a component tag that ends a heading", () => {
        expect(stripVitepressSyntax('# Title <Badge text="x" />\n\nBody')).toBe(
            "## Title\n\nBody",
        );
    });

    it("keeps component-like tags in fences and inline code", () => {
        const text = "```tsx\n  <App {...props} />\n```\n\nUse `<App />` here.";

        expect(stripVitepressSyntax(text)).toBe(text);
    });

    it("strips inline components in linear time on a long space run", () => {
        const start = performance.now();
        const result = stripVitepressSyntax(`${" ".repeat(100_000)}x`);

        expect(result).toBe("x");
        expect(performance.now() - start).toBeLessThan(100);
    });

    it("leaves a component tag in an indented code block", () => {
        const text = "Text:\n\n    <App />\n\nAfter.";

        expect(stripVitepressSyntax(text)).toBe(text);
    });

    it("keeps a fence open until a matching marker closes it", () => {
        const text = "```tsx\n~~~\n  <App />\n```\n\nTitle <Badge />";

        expect(stripVitepressSyntax(text)).toBe(
            "```tsx\n~~~\n  <App />\n```\n\nTitle",
        );
    });

    it("still strips a component tag that starts a line", () => {
        expect(stripVitepressSyntax('<Badge text="x" />\nBody')).toBe("Body");
    });
});

describe("githubSlug", () => {
    it("hyphenates spaces only, as github-slugger does", () => {
        expect(githubSlug("a\tb")).toBe("ab");
        expect(githubSlug("a b")).toBe("a-b");
    });

    it("drops punctuation and hyphenates whitespace", () => {
        expect(githubSlug("Symbol.iterator")).toBe("symboliterator");
        expect(githubSlug("toJSON")).toBe("tojson");
        expect(githubSlug("Loose and strict comparison")).toBe(
            "loose-and-strict-comparison",
        );
        expect(githubSlug("a_b c")).toBe("a_b-c");
    });
});

describe("rewriteAnchorsForGitHub", () => {
    it("numbers a repeated slug past one that is already taken", () => {
        const doc = "# a\n\n# a-1\n\n# a\n\n[1](#a) [2](#a-1) [3](#a-2)";

        expect(rewriteAnchorsForGitHub(doc)).toBe(doc);
    });

    it("keeps duplicate-heading suffixes that already agree", () => {
        const doc =
            "#### toJson\n\n#### toJSON\n\n[toJson](#tojson) [toJSON](#tojson-1)";

        expect(rewriteAnchorsForGitHub(doc)).toBe(doc);
    });

    it("rewrites a VitePress slug to GitHub's", () => {
        const doc =
            "#### Symbol.iterator\n\n[Symbol.iterator](#symbol-iterator)";

        expect(rewriteAnchorsForGitHub(doc)).toBe(
            "#### Symbol.iterator\n\n[Symbol.iterator](#symboliterator)",
        );
    });

    it("slugs a heading's text without its backticks and HTML tags", () => {
        const heading = '## `get` <Badge text="x" /> value';

        expect(rewriteAnchorsForGitHub(`${heading}\n\n[v](#get-value)`)).toBe(
            `${heading}\n\n[v](#get--value)`,
        );
    });

    it("leaves links inside fences and unknown slugs alone", () => {
        const doc = [
            "#### Symbol.iterator",
            "",
            "~~~md",
            "[x](#symbol-iterator)",
            "~~~",
            "",
            "[y](#nowhere)",
        ].join("\n");

        expect(rewriteAnchorsForGitHub(doc)).toBe(doc);
    });
});

describe("assembleDocsContent", () => {
    it("rewrites a Symbol.iterator chip to GitHub's slug", () => {
        const result = assembleDocsContent(
            ["arrays-objects/symbols.md"],
            "@tolki/arr",
            FIXTURE_ROOT,
        );

        expect(result).toContain("[Symbol.iterator](#symboliterator)");
        expect(result).not.toContain("#symbol-iterator");
    });

    it("keeps only the package's tab, sections and links from a shared page", () => {
        const pages = ["arrays-objects/shared.md"];
        const result = assembleDocsContent(pages, "@tolki/arr", FIXTURE_ROOT);

        expect(result).toContain("arrGet();");
        expect(result).not.toContain("objGet();");
        expect(result).not.toContain("dataGet();");
        expect(result).not.toContain("dataCount();");
        expect(result).not.toContain("#### count");
        expect(result).not.toContain("Count items.");
        expect(result).not.toContain("[count](#count)");
        expect(result).toContain("[get](#get)");
        expect(result).toContain("#### get");
        expect(result).toContain(
            "https://tolki.abe.dev/collections/methods-list.html#pluck",
        );
        expect(result).not.toContain(":::");

        const unfiltered = assembleDocsContent(pages, undefined, FIXTURE_ROOT);

        expect(unfiltered).toContain("arrGet();");
        expect(unfiltered).toContain("objGet();");
        expect(unfiltered).toContain("dataGet();");
        expect(unfiltered).toContain("dataCount();");
    });

    it("skips a missing doc file", () => {
        expect(assembleDocsContent(["does/not-exist.md"], "@tolki/arr")).toBe(
            "",
        );
    });
});
