import { describe, expect, it } from "vitest";

import {
    aliasExportsPlugin,
    rewriteAliasExports,
} from "../build/alias-exports.ts";

const ANNOTATION = "/* @__NO_SIDE_EFFECTS__ */";
const SRC = "/repo/packages/data/src";
const IMPL = [
    ANNOTATION,
    "function dataGetImpl(data: unknown, ...rest: readonly unknown[]): unknown {",
    "    return forwardData(arrGet, objGet, data, rest);",
    "}",
].join("\n");

/**
 * Runs the plugin's transform hook the way Vite calls it.
 */
function transform(code: string, id: string, srcDir = SRC): unknown {
    const hook = aliasExportsPlugin(srcDir).transform as (
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

    // Each source differs from a rewritable alias in one way only, so each case fails when its guard is removed.
    it.each([
        [
            "an alias of an imported name",
            'import { aImpl } from "./a";\nexport const a = aImpl as unknown as A;',
        ],
        [
            "an alias of a bodiless function",
            "declare function aImpl(): void;\nexport const a = aImpl as unknown as A;",
        ],
        [
            "an alias of a nested function",
            "{\n    function aImpl(): void {}\n}\nexport const a = aImpl as unknown as A;",
        ],
        [
            "an alias of a const",
            "const aImpl = 1;\nexport const a = aImpl as unknown as A;",
        ],
        [
            "a let alias",
            "export let a = aImpl as unknown as A;\nfunction aImpl(): void {}",
        ],
        [
            "a var alias",
            "export var a = aImpl as unknown as A;\nfunction aImpl(): void {}",
        ],
        [
            "an alias declared beside another const",
            "export const a = aImpl as unknown as A, b = 1;\nfunction aImpl(): void {}",
        ],
        [
            "an alias that is not exported",
            "const a = aImpl as unknown as A;\nfunction aImpl(): void {}",
        ],
        [
            "an ambient alias that is not exported",
            "declare const a = aImpl as unknown as A;\nfunction aImpl(): void {}",
        ],
        [
            "an ambient alias",
            "export declare const a = aImpl as unknown as A;\nfunction aImpl(): void {}",
        ],
        [
            "an ambient declaration",
            "export declare const a: A;\nfunction aImpl(): void {}",
        ],
        [
            "a const with no initializer",
            "export const a: A;\nfunction aImpl(): void {}",
        ],
        [
            "a destructuring export",
            "export const { a } = aImpl as unknown as A;\nfunction aImpl(): void {}",
        ],
    ])("keeps %s", (_label, source) => {
        expect(rewriteAliasExports(source)).toBeNull();
    });

    it("throws when the module uses the alias's own name, which the rewrite would unbind", () => {
        const source = [
            "export const a = aImpl as unknown as A;",
            "function aImpl(): void {}",
            "export function b(): void {",
            "    a();",
            "}",
        ].join("\n");

        expect(() => rewriteAliasExports(source)).toThrow(
            "alias-exports: `a` is used on line 4, and `export { aImpl as a }` declares no local `a`. Use `aImpl` there.",
        );
    });

    it("does not count a property or member named like the alias as a use", () => {
        const source = [
            "export const a = aImpl as unknown as A;",
            "function aImpl(): void {}",
            "export const o = { a: 1 };",
            "export function b(x: { a: number }): number {",
            "    return x.a;",
            "}",
        ].join("\n");

        expect(rewriteAliasExports(source)).toBe(
            source.replace(
                "export const a = aImpl as unknown as A;",
                "export { aImpl as a };",
            ),
        );
    });

    it("rewrites an alias with a comment between its keywords", () => {
        const source =
            "export /* c */ const a = aImpl as unknown as A;\nfunction aImpl(): void {}";

        expect(rewriteAliasExports(source)).toBe(
            "export { aImpl as a };\nfunction aImpl(): void {}",
        );
    });

    it("rewrites an alias whose const is typed", () => {
        const source =
            "export const a: A = aImpl as unknown as B;\nfunction aImpl(): void {}";

        expect(rewriteAliasExports(source)).toBe(
            "export { aImpl as a };\nfunction aImpl(): void {}",
        );
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
        expect(aliasExportsPlugin(SRC).enforce).toBe("pre");
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

    it("rewrites under a Windows source root given with backslashes", () => {
        expect(
            transform(
                source,
                "C:/repo/packages/data/src/data.ts",
                "C:\\repo\\packages\\data\\src\\",
            ),
        ).toMatchObject({ map: null });
    });

    it.each([
        ["a spec file", "/repo/packages/data/__tests__/data.spec.ts"],
        ["a declaration file", "/repo/packages/data/src/data.d.ts"],
        ["a JavaScript module", "/repo/packages/data/src/data.js"],
        ["another package's source", "/repo/packages/arr/src/arr.ts"],
        [
            "a dependency's TypeScript source",
            "/repo/node_modules/@tolki/arr/src/arr.ts",
        ],
        [
            "a folder that only shares the prefix",
            "/repo/packages/data/src-old/data.ts",
        ],
        [
            "a dependency inside the source root",
            "/repo/packages/data/src/node_modules/dep/index.ts",
        ],
    ])("leaves %s alone", (_label, id) => {
        expect(transform(source, id)).toBeNull();
    });

    it("leaves a source file with no alias alone", () => {
        expect(
            transform("export const a = 1;", "/repo/packages/data/src/data.ts"),
        ).toBeNull();
    });
});
