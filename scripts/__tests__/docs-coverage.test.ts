import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
    brokenAnchors,
    coverageReport,
    importedNames,
    listCollectionMembers,
    listPackageExports,
    mismatchedVariantFences,
} from "../docs-coverage.ts";

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
    it("limits missing issues to the requested names", () => {
        const issues = coverageReport({ only: ["get"] });
        const missing = issues.filter((issue) => issue.kind === "missing");

        expect(missing.map((issue) => `${issue.owner}:${issue.name}`)).toEqual([
            "arr:get",
            "obj:get",
            "data:dataGet",
            "collection:get",
        ]);
        expect(missing.every((issue) => issue.page.endsWith("-list.md"))).toBe(
            true,
        );
    });

    it("scopes to the arrays-objects page", () => {
        const issues = coverageReport({
            only: ["get"],
            page: "arrays-objects",
        });

        expect(
            issues.map((issue) =>
                issue.kind === "missing" ? `${issue.owner}:${issue.name}` : "",
            ),
        ).toEqual(["arr:get", "obj:get", "data:dataGet"]);
    });

    it("scopes to the collections page", () => {
        const issues = coverageReport({ only: ["get"], page: "collections" });

        expect(issues).toEqual([
            {
                kind: "missing",
                page: "collections/methods-list.md",
                owner: "collection",
                name: "get",
            },
        ]);
    });

    it("reports every collection member for a missing page", () => {
        const missing = coverageReport({ only: ["toJSON"] }).filter(
            (issue) => issue.kind === "missing" && issue.owner === "collection",
        );

        expect(missing).toHaveLength(1);
    });
});
