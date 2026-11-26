import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { bundle, BUNDLERS } from "../treeshake/bundlers.ts";

const REPO_ROOT = resolve(__dirname, "../..");

/** Writes a file, creating its directories. */
function put(root: string, file: string, content: string): void {
    const path = join(root, file);

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
}

/** Writes a minimal ESM package under `<root>/node_modules/<name>`. */
function putPackage(
    root: string,
    name: string,
    files: Record<string, string>,
    manifest: Record<string, unknown> = {},
): void {
    const dir = `node_modules/${name}`;

    put(
        root,
        `${dir}/package.json`,
        JSON.stringify({
            name,
            version: "1.0.0",
            type: "module",
            main: "index.js",
            sideEffects: false,
            ...manifest,
        }),
    );

    for (const [file, content] of Object.entries(files)) {
        put(root, `${dir}/${file}`, content);
    }
}

const MAKE =
    "export function make(value) { globalThis.made = value; return { value }; }\n";

describe("bundle", () => {
    let app: string;
    let counter = 0;

    beforeAll(() => {
        app = mkdtempSync(join(tmpdir(), "treeshake-app-"));
        put(app, "package.json", JSON.stringify({ type: "module" }));

        putPackage(app, "fx-annotated", {
            "index.js": `/* @__NO_SIDE_EFFECTS__ */\n${MAKE}`,
        });
        putPackage(
            app,
            "fx-plain",
            {
                "index.js": MAKE,
                "setup.js":
                    'import { make } from "./index.js";\nmake({ boot: true });\n',
            },
            { exports: { ".": "./index.js", "./setup": "./setup.js" } },
        );
        putPackage(
            app,
            "@tolki/fx-own",
            {
                "index.js": MAKE,
                "setup.js":
                    'import { make } from "./index.js";\nglobalThis.x = make({ a: 1 });\n',
            },
            {
                sideEffects: true,
                exports: { ".": "./index.js", "./setup": "./setup.js" },
            },
        );
    });

    afterAll(() => {
        rmSync(app, { recursive: true, force: true });
    });

    /** Bundles an entry made of `mod` (the app module) and an entry that imports only `used`. */
    async function build(
        mod: string,
        bundler: (typeof BUNDLERS)[number],
        entrySource = 'import { used } from "./mod.js";\nconsole.log(used);\n',
    ): Promise<string> {
        const dir = join(app, `case-${counter++}`);

        put(dir, "mod.js", mod);
        put(dir, "entry.js", entrySource);

        return (await bundle(join(dir, "entry.js"), bundler)).code;
    }

    const CONTROL = "export const used = 1;\n";

    const callMod = (pkg: string, prefix = ""): string =>
        `import { make } from "${pkg}";\nexport const unused = ${prefix}make({ a: 1 });\nexport const used = 1;\n`;

    it.each(BUNDLERS)(
        "drops an unused annotated call in %s like its control",
        async (bundler) => {
            const control = await build(CONTROL, bundler);
            const code = await build(callMod("fx-annotated"), bundler);

            if (bundler === "esbuild") {
                expect(code).not.toBe(control);
            } else {
                expect(code).toBe(control);
            }
        },
    );

    it.each(BUNDLERS)("keeps an unannotated call in %s", async (bundler) => {
        const control = await build(CONTROL, bundler);
        const code = await build(callMod("fx-plain"), bundler);

        expect(code).not.toBe(control);
    });

    it("drops a call-site PURE call in esbuild", async () => {
        // esbuild stops inlining constants from a module that has any import, so the control keeps the import.
        const control = await build(
            'import { make } from "fx-plain";\nexport const used = 1;\nvoid make;\n',
            "esbuild",
        );
        const code = await build(
            callMod("fx-plain", "/* @__PURE__ */ "),
            "esbuild",
        );

        expect(code).toBe(control);
    });

    it("keeps a dropped call's text from renaming esbuild's output", async () => {
        const control = await build(
            'import { make } from "fx-plain";\nexport const used = 1;\n',
            "esbuild",
        );
        const code = await build(
            'import { make } from "fx-plain";\nexport const unused = /* @__PURE__ */ make({ zzzzzz: "zzzzzzzzzzzzzzzzz" });\nexport const used = 1;\n',
            "esbuild",
        );

        expect(code).toBe(control);
    });

    it.each(BUNDLERS)(
        "leaves vite and Node built-ins external in %s",
        async (bundler) => {
            const dir = join(app, `case-${counter++}`);

            put(
                dir,
                "entry.js",
                'import { normalizePath } from "vite";\nimport { join } from "node:path";\nconsole.log(normalizePath, join);\n',
            );

            const { missingExports } = await bundle(
                join(dir, "entry.js"),
                bundler,
            );

            expect(missingExports).toEqual([]);
        },
    );

    it("reports own bytes for a top-level call in strict mode", async () => {
        const dir = join(app, `case-${counter++}`);

        put(dir, "entry.js", 'import "@tolki/fx-own/setup";\n');

        for (const bundler of ["rollup", "rolldown"] as const) {
            const { ownBytes } = await bundle(join(dir, "entry.js"), bundler, {
                strict: true,
            });

            expect(ownBytes).not.toBeNull();
            expect(
                Object.entries(ownBytes ?? {}).some(
                    ([key, bytes]) =>
                        key.startsWith("@tolki/fx-own/") && bytes > 0,
                ),
            ).toBe(true);
        }

        await expect(
            bundle(join(dir, "entry.js"), "esbuild", { strict: true }),
        ).rejects.toThrow("strict mode needs rollup or rolldown");
    });

    it.each(["webpack", "rspack"] as const)(
        "reports null own bytes in %s",
        async (bundler) => {
            const dir = join(app, `case-${counter++}`);

            put(dir, "entry.js", 'import "@tolki/fx-own/setup";\n');

            expect(
                (await bundle(join(dir, "entry.js"), bundler)).ownBytes,
            ).toBeNull();
        },
    );

    it("reports own bytes in esbuild", async () => {
        const dir = join(app, `case-${counter++}`);

        put(dir, "entry.js", 'import "@tolki/fx-own/setup";\n');

        const { ownBytes } = await bundle(join(dir, "entry.js"), "esbuild");

        expect(Object.keys(ownBytes ?? {})).toContain("@tolki/fx-own/setup.js");
    });

    it.each(["webpack", "rspack"] as const)(
        "rejects a real error beside a missing-export warning in %s",
        async (bundler) => {
            const dir = join(app, `case-${counter++}`);

            put(
                dir,
                "entry.js",
                'import { nope } from "fx-plain";\nimport "./gone.js";\nconsole.log(nope);\n',
            );

            await expect(
                bundle(join(dir, "entry.js"), bundler),
            ).rejects.toThrow(/gone/);
        },
    );

    it.each(BUNDLERS)("reports a missing export in %s", async (bundler) => {
        const dir = join(app, `case-${counter++}`);

        put(
            dir,
            "entry.js",
            'import { nope } from "fx-plain";\nconsole.log(nope);\n',
        );

        const result = await bundle(join(dir, "entry.js"), bundler);

        expect(result.missingExports).toContain("nope");
    });
});
