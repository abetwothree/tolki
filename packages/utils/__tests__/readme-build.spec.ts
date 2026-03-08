import { describe, expect, it } from "vitest";

import {
    increaseHeadingLevels,
    stripVitepressSyntax,
} from "../../../scripts/readme-build";

describe("increaseHeadingLevels", () => {
    it("shifts markdown headings down by one level", () => {
        const content = [
            "# Title",
            "## Section",
            "### Subsection",
            "Text",
        ].join("\n");

        const result = increaseHeadingLevels(content);

        expect(result).toBe([
            "## Title",
            "### Section",
            "#### Subsection",
            "Text",
        ].join("\n"));
    });

    it("clamps level six headings", () => {
        const result = increaseHeadingLevels("###### Deep Heading");

        expect(result).toBe("###### Deep Heading");
    });

    it("leaves fenced code blocks unchanged", () => {
        const content = [
            "# Outside",
            "```md",
            "# Inside code",
            "## Still code",
            "```",
            "## After",
        ].join("\n");

        const result = increaseHeadingLevels(content);

        expect(result).toBe([
            "## Outside",
            "```md",
            "# Inside code",
            "## Still code",
            "```",
            "### After",
        ].join("\n"));
    });
});

describe("stripVitepressSyntax", () => {
    it("removes VitePress syntax and nests headings for README output", () => {
        const content = [
            "---",
            'title: "Example"',
            "---",
            "",
            "<div>",
            "# Title",
            "::: code-group",
            "",
            "```ts",
            "# not a heading in code",
            "```",
            "",
            "<DemoBlock />",
            "</div>",
        ].join("\n");

        const result = stripVitepressSyntax(content);

        expect(result).toBe([
            "## Title",
            "",
            "```ts",
            "# not a heading in code",
            "```",
        ].join("\n"));
    });
});