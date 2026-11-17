import { describe, expect, it } from "vitest";

import {
    aliasExportsPlugin,
    rewriteAliasExports,
} from "../build/alias-exports.ts";

const ANNOTATION = "/* @__NO_SIDE_EFFECTS__ */";
const IMPL = [
    ANNOTATION,
    "function dataGetImpl(data: unknown, ...rest: readonly unknown[]): unknown {",
    "    return forwardData(arrGet, objGet, data, rest);",
    "}",
].join("\n");

/**
 * Runs the plugin's transform hook the way Vite calls it.
 */
function transform(code: string, id: string): unknown {
    const hook = aliasExportsPlugin().transform as (
        code: string,
        id: string,
    ) => unknown;

    return hook(code, id);
}

describe("rewriteAliasExports", () => {
    it("rewrites an alias of a same-file function declaration", () => {
        const source = [
            "export const dataGet = dataGetImpl as unknown as Dispatched<typeof arrGet, typeof objGet>;",
            "",
            IMPL,
        ].join("\n");

        expect(rewriteAliasExports(source)).toBe(
            ["export { dataGetImpl as dataGet };", "", IMPL].join("\n"),
        );
    });

    it("rewrites a multi-line chain of as casts", () => {
        const source = [
            "export const dataGet = (",
            "    dataGetImpl as unknown",
            ") as Dispatched<",
            "    typeof arrGet,",
            "    typeof objGet",
            ">;",
            "",
            IMPL,
        ].join("\n");

        // The statement's line breaks are kept, so every later line stays where the source map says it is.
        expect(rewriteAliasExports(source)).toBe(
            [
                "export { dataGetImpl as dataGet };",
                "",
                "",
                "",
                "",
                "",
                "",
                IMPL,
            ].join("\n"),
        );
    });

    it("keeps an alias of an imported name", () => {
        const source = [
            'import { get } from "@tolki/arr";',
            "",
            "export const dataGet = get as unknown as typeof get;",
        ].join("\n");

        expect(rewriteAliasExports(source)).toBeNull();
    });

    it("keeps an alias of a nested, bodiless or non-function declaration", () => {
        const source = [
            "declare function ambient(): void;",
            "const value = 1;",
            "{",
            "    function nested(): void {}",
            "}",
            "export const a = ambient as unknown;",
            "export const b = value as unknown;",
            "export const c = nested as unknown;",
            "export let d = (() => 1) as unknown;",
        ].join("\n");

        expect(rewriteAliasExports(source)).toBeNull();
    });

    it("keeps the export's docblock and every other statement byte-identical", () => {
        const before = [
            'import { forwardData } from "./dispatch";',
            "",
            "/** A helper that is not an alias. */",
            "export const plain = 1;",
            "",
            "/**",
            " * Get an item from data.",
            " *",
            " * @param data - The data to get from",
            " */",
            "",
        ].join("\n");
        const after = [
            "",
            "",
            IMPL,
            "",
            "// A trailing comment.",
            "export const other = (data: unknown): unknown => data;",
            "",
        ].join("\n");
        const source = `${before}export const dataGet = dataGetImpl as unknown as Dispatched<typeof arrGet, typeof objGet>;${after}`;

        expect(rewriteAliasExports(source)).toBe(
            `${before}export { dataGetImpl as dataGet };${after}`,
        );
    });

    it("rewrites every alias in one file", () => {
        const source = [
            "export const a = aImpl as unknown as A;",
            "export const b = bImpl satisfies B;",
            "function aImpl(): void {}",
            "function bImpl(): void {}",
        ].join("\n");

        expect(rewriteAliasExports(source)).toBe(
            [
                "export { aImpl as a };",
                "export { bImpl as b };",
                "function aImpl(): void {}",
                "function bImpl(): void {}",
            ].join("\n"),
        );
    });
});

describe("aliasExportsPlugin", () => {
    const source = `export const a = aImpl as unknown as A;\n${IMPL.replace("dataGetImpl", "aImpl")}`;

    it("runs before other transforms", () => {
        expect(aliasExportsPlugin().enforce).toBe("pre");
    });

    it("rewrites a package source file", () => {
        expect(transform(source, "/repo/packages/data/src/data.ts")).toEqual({
            code: source.replace(
                "export const a = aImpl as unknown as A;",
                "export { aImpl as a };",
            ),
            map: null,
        });
    });

    it("rewrites a source file requested with a query", () => {
        expect(
            transform(source, "/repo/packages/data/src/data.ts?v=1"),
        ).toMatchObject({ map: null });
    });

    it.each([
        ["a spec file", "/repo/packages/data/__tests__/data.spec.ts"],
        ["a declaration file", "/repo/packages/data/src/data.d.ts"],
        ["a dependency", "/repo/node_modules/@tolki/arr/src/arr.js"],
    ])("leaves %s alone", (_label, id) => {
        expect(transform(source, id)).toBeNull();
    });

    it("leaves a source file with no alias alone", () => {
        expect(
            transform("export const a = 1;", "/repo/packages/data/src/data.ts"),
        ).toBeNull();
    });
});
