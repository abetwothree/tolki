import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { scanFile, scanPublishedSources } from "../side-effects/scan.ts";

const ROOT = resolve(__dirname, "../..");
const ANNOTATION = "/* @__NO_SIDE_EFFECTS__ */";

/**
 * Packages whose exports are not yet all classified.
 */
const PENDING_PACKAGES: ReadonlySet<string> = new Set([
    "@tolki/arr",
    "@tolki/collection",
    "@tolki/data",
    "@tolki/enum",
    "@tolki/lang",
    "@tolki/num",
    "@tolki/obj",
    "@tolki/path",
    "@tolki/str",
    "@tolki/ts",
    "@tolki/utils",
]);

/**
 * Scans one inline source as a file of package `@tolki/x`.
 */
function scan(source: string) {
    return scanFile("src/x.ts", source, "@tolki/x");
}

describe("scanFile", () => {
    it("classifies an annotated implementation as pure", () => {
        const result = scan(
            `/** Doc. */\n${ANNOTATION}\nexport function a(): number { return 1; }`,
        );

        expect(result.exports).toMatchObject([
            { pkg: "@tolki/x", file: "src/x.ts", name: "a", kind: "pure" },
        ]);
        expect(result.placement).toEqual([]);
        expect(result.moduleScope).toEqual([]);
    });

    it("reads the annotation on an overloaded implementation", () => {
        const result = scan(
            [
                "/** Doc. */",
                "export function a(x: string): string;",
                "export function a(x: number): number;",
                ANNOTATION,
                "export function a(x: unknown): unknown { return x; }",
            ].join("\n"),
        );

        expect(result.exports).toMatchObject([{ name: "a", kind: "pure" }]);
        expect(result.placement).toEqual([]);
    });

    it("rejects an annotation above the first overload", () => {
        const result = scan(
            [
                "/** Doc. */",
                ANNOTATION,
                "export function a(x: string): string;",
                "export function a(x: unknown): unknown { return x; }",
            ].join("\n"),
        );

        expect(result.exports).toMatchObject([
            { name: "a", kind: "unclassified" },
        ]);
        expect(result.placement).toMatchObject([
            { name: "a", kind: "annotation-on-overload" },
        ]);
    });

    it("rejects an annotation written inside a docblock", () => {
        const result = scan(
            `/**\n * Doc.\n * @__NO_SIDE_EFFECTS__\n */\nexport function a(): number { return 1; }`,
        );

        expect(result.exports).toMatchObject([
            { name: "a", kind: "unclassified" },
        ]);
        expect(result.placement).toMatchObject([
            { name: "a", kind: "annotation-in-jsdoc" },
        ]);
    });

    it("rejects an annotation separated from the declaration by the docblock", () => {
        const result = scan(
            `${ANNOTATION}\n/** Doc. */\nexport function a(): number { return 1; }`,
        );

        expect(result.exports).toMatchObject([
            { name: "a", kind: "unclassified" },
        ]);
        expect(result.placement).toMatchObject([
            { name: "a", kind: "annotation-not-adjacent" },
        ]);
    });

    it("rejects an annotated arrow const", () => {
        const result = scan(
            `/** Doc. */\n${ANNOTATION}\nexport const a = (): number => 1;`,
        );

        expect(result.exports).toMatchObject([
            { name: "a", kind: "unclassified" },
        ]);
        expect(result.placement).toMatchObject([
            { name: "a", kind: "annotated-arrow" },
        ]);
    });

    it("reads @sideEffects from the first declaration's docblock", () => {
        const result = scan(
            [
                "/**",
                " * Doc.",
                " *",
                " * @sideEffects mutates - Pops in place.",
                " */",
                "export function a(x: string): string;",
                "export function a(x: unknown): unknown { return x; }",
            ].join("\n"),
        );

        expect(result.exports).toMatchObject([
            { name: "a", kind: "impure", category: "mutates" },
        ]);
        expect(result.placement).toEqual([]);
    });

    it("rejects an unknown category", () => {
        const result = scan(
            `/**\n * Doc.\n * @sideEffects maybe\n */\nexport function a(): number { return 1; }`,
        );

        expect(result.exports).toMatchObject([
            { name: "a", kind: "unclassified" },
        ]);
        expect(result.placement).toMatchObject([
            { name: "a", kind: "unknown-category" },
        ]);
    });

    it("rejects both markers on one function", () => {
        const result = scan(
            `/**\n * Doc.\n * @sideEffects state\n */\n${ANNOTATION}\nexport function a(): number { return 1; }`,
        );

        expect(result.placement).toMatchObject([
            { name: "a", kind: "annotated-and-tagged" },
        ]);
    });

    it("exempts classes", () => {
        const result = scan("export class A {}");

        expect(result.exports).toMatchObject([{ name: "A", kind: "class" }]);
        expect(result.placement).toEqual([]);
    });

    it("classifies an alias export through its same-file declaration", () => {
        const pure = scan(
            `${ANNOTATION}\nfunction aImpl(): unknown { return 1; }\nexport const a = aImpl as unknown as () => number;`,
        );
        const tagged = scan(
            `/**\n * Doc.\n * @sideEffects state\n */\nfunction aImpl(): unknown { return 1; }\nexport const a = aImpl as unknown as () => number;`,
        );
        const aliasTagged = scan(
            `function aImpl(): unknown { return 1; }\n/**\n * Doc.\n * @sideEffects io\n */\nexport const a = aImpl as unknown as () => number;`,
        );
        const imported = scan(
            `import { b } from "./b.ts";\nexport const a = b as unknown as () => number;`,
        );

        expect(pure.exports).toMatchObject([{ name: "a", kind: "pure" }]);
        expect(pure.placement).toEqual([]);
        expect(tagged.exports).toMatchObject([
            { name: "a", kind: "impure", category: "state" },
        ]);
        expect(aliasTagged.exports).toMatchObject([
            { name: "a", kind: "impure", category: "io" },
        ]);
        expect(imported.exports).toMatchObject([
            { name: "a", kind: "unclassified" },
        ]);
    });

    it("leaves an unmarked function unclassified", () => {
        const result = scan(
            "/** Doc. */\nexport function a(): number { return 1; }",
        );

        expect(result.exports).toMatchObject([
            { name: "a", line: 2, kind: "unclassified", category: null },
        ]);
        expect(result.placement).toEqual([]);
    });

    it("ignores re-exports and non-function consts", () => {
        const result = scan(
            `export { b } from "./b.ts";\nexport const n = 1;\nexport type T = string;`,
        );

        expect(result.exports).toEqual([]);
    });
});

describe("published sources", () => {
    const scanResult = scanPublishedSources(ROOT);

    it("has no placement problems", () => {
        expect(scanResult.placement).toEqual([]);
    });

    it("classifies every export of non-pending packages", () => {
        const missing = scanResult.exports
            .filter(
                (entry) =>
                    entry.kind === "unclassified" &&
                    !PENDING_PACKAGES.has(entry.pkg),
            )
            .map((entry) => `${entry.file}:${entry.line} ${entry.name}`);

        expect(missing).toEqual([]);
    });

    it("has no stale pending packages", () => {
        const stale = [...PENDING_PACKAGES].filter(
            (pkg) =>
                !scanResult.exports.some(
                    (entry) =>
                        entry.pkg === pkg && entry.kind === "unclassified",
                ),
        );

        expect(stale).toEqual([]);
    });
});
