import { describe, expect, it } from "vitest";

import { parseFences, parseHeadings, slugify } from "../docs-markdown.ts";

describe("slugify", () => {
    it("keeps a plain word", () => {
        expect(slugify("get")).toBe("get");
    });

    it("turns punctuation into dashes", () => {
        expect(slugify("Symbol.iterator")).toBe("symbol-iterator");
    });

    it("lowercases camelCase without splitting it", () => {
        expect(slugify("toCssClasses")).toBe("tocssclasses");
    });

    it("prefixes a leading digit with an underscore", () => {
        expect(slugify("1st")).toBe("_1st");
    });
});

describe("parseHeadings", () => {
    it("skips # lines inside fences", () => {
        const markdown = [
            "# Real",
            "```bash",
            "# comment",
            "```",
            "## Next",
        ].join("\n");

        expect(parseHeadings(markdown).map(({ text }) => text)).toEqual([
            "Real",
            "Next",
        ]);
    });

    it("strips backticks and HTML tags before slugging", () => {
        const [heading] = parseHeadings('## `get` <Badge text="x" /> value');

        expect(heading).toEqual({
            level: 2,
            text: "get  value",
            slug: "get-value",
            line: 1,
        });
    });

    it("suffixes a repeated slug the way VitePress does", () => {
        const slugs = parseHeadings("## toJson\n\n## toJSON\n").map(
            ({ slug }) => slug,
        );

        expect(slugs).toEqual(["tojson", "tojson-1"]);
    });
});

describe("parseFences", () => {
    it("reads the language and the tab title", () => {
        const [fence] = parseFences("```js [@tolki/arr]\nget();\n```\n");

        expect(fence).toMatchObject({
            lang: "js",
            title: "@tolki/arr",
            code: "get();",
        });
    });

    it("gives every fence in one code group the same index", () => {
        const markdown = [
            "::: code-group",
            "```js [@tolki/arr]",
            "a;",
            "```",
            "```js [@tolki/obj]",
            "b;",
            "```",
            ":::",
            "```js",
            "c;",
            "```",
            "::: code-group",
            "```js [@tolki/arr]",
            "d;",
            "```",
            ":::",
        ].join("\n");

        expect(parseFences(markdown).map(({ codeGroup }) => codeGroup)).toEqual(
            [0, 0, null, 1],
        );
    });

    it("records the 1-based line of the opening fence", () => {
        const fences = parseFences("text\n\n~~~ts\nx;\n~~~\n");

        expect(fences.map(({ line, lang }) => ({ line, lang }))).toEqual([
            { line: 3, lang: "ts" },
        ]);
    });

    it("keeps a longer fence open past a shorter fence line", () => {
        const fences = parseFences("````md\n```js\nx;\n```\n````\n");

        expect(fences).toHaveLength(1);
        expect(fences[0]?.code).toBe("```js\nx;\n```");
    });
});
