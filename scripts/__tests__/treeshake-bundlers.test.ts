import {
    existsSync,
    lstatSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    realpathSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { bundle, BUNDLERS } from "../treeshake/bundlers.ts";
import {
    publishedManifest,
    publishedSubpaths,
    stagePackages,
} from "../treeshake/stage.ts";

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

describe("publishedManifest", () => {
    it("applies publishConfig over the top-level fields and drops it", () => {
        const manifest = publishedManifest({
            name: "pkg",
            main: "src/index.ts",
            types: "src/index.ts",
            exports: { ".": "./src/index.ts" },
            publishConfig: {
                main: "dist/index.js",
                types: "dist/index.d.ts",
                exports: { ".": "./dist/index.js" },
            },
        });

        expect(manifest).toEqual({
            name: "pkg",
            main: "dist/index.js",
            types: "dist/index.d.ts",
            exports: { ".": "./dist/index.js" },
        });
        expect("publishConfig" in manifest).toBe(false);
    });

    it("returns a manifest without publishConfig unchanged", () => {
        expect(publishedManifest({ name: "pkg" })).toEqual({ name: "pkg" });
    });
});

describe("publishedSubpaths", () => {
    it("lists lang's code subpaths", () => {
        const manifest = publishedManifest(
            JSON.parse(
                readFileSync(
                    join(REPO_ROOT, "packages/lang/package.json"),
                    "utf8",
                ),
            ) as Record<string, unknown>,
        );
        const subpaths = publishedSubpaths(manifest);

        expect(subpaths).toContain(".");
        expect(subpaths).toContain("./helpers");
        expect(subpaths).toContain("./vue");
        expect(subpaths).not.toContain("./*");
        expect(subpaths).not.toContain("./client");
        expect(subpaths).not.toContain("./package.json");
    });

    it("reads a string or condition-less exports field", () => {
        expect(publishedSubpaths({ exports: "./index.js" })).toEqual(["."]);
        expect(publishedSubpaths({})).toEqual(["."]);
        expect(
            publishedSubpaths({
                exports: { import: "./i.js", types: "./i.d.ts" },
            }),
        ).toEqual(["."]);
    });
});

describe("stagePackages", () => {
    let repo: string;
    let out: string;

    beforeAll(() => {
        repo = mkdtempSync(join(tmpdir(), "treeshake-repo-"));
        out = mkdtempSync(join(tmpdir(), "treeshake-out-"));

        const dep = join(repo, "packages/fake/node_modules/third");
        const peer = join(repo, "packages/fake/node_modules/peerdep");

        put(dep, "index.js", "export default 1;\n");
        put(peer, "index.js", "export default 2;\n");

        put(
            repo,
            "packages/fake/package.json",
            JSON.stringify({
                name: "@tolki/fake",
                scripts: { build: "x" },
                files: ["lib"],
                main: "src/index.ts",
                dependencies: { third: "^1", "@tolki/other": "workspace:^" },
                peerDependencies: { peerdep: "^1", absent: "^1" },
                publishConfig: { main: "lib/index.js" },
            }),
        );
        put(repo, "packages/fake/lib/index.js", "export const a = 1;\n");
        put(repo, "packages/fake/src/index.ts", "export const a = 1;\n");

        put(
            repo,
            "packages/nobuild/package.json",
            JSON.stringify({
                name: "@tolki/nobuild",
                scripts: { build: "x" },
                files: ["dist"],
            }),
        );
        put(
            repo,
            "packages/skipped/package.json",
            JSON.stringify({
                name: "@tolki/skipped",
                private: true,
                scripts: { build: "x" },
            }),
        );
    });

    afterAll(() => {
        rmSync(repo, { recursive: true, force: true });
        rmSync(out, { recursive: true, force: true });
    });

    it("stages only the manifest's files and links third-party deps", () => {
        rmSync(join(repo, "packages/nobuild"), { recursive: true });

        const staged = stagePackages(repo, out);
        const root = join(out, "node_modules/@tolki/fake");

        expect(staged).toEqual([
            { name: "@tolki/fake", root, subpaths: ["."] },
        ]);
        expect(existsSync(join(root, "lib/index.js"))).toBe(true);
        expect(existsSync(join(root, "src"))).toBe(false);

        const link = join(out, "node_modules/third");

        expect(lstatSync(link).isSymbolicLink()).toBe(true);
        expect(realpathSync(link)).toBe(
            realpathSync(join(repo, "packages/fake/node_modules/third")),
        );
        expect(existsSync(join(out, "node_modules/@tolki/other"))).toBe(false);
    });

    it("links an installed peer dependency and skips a missing one", () => {
        expect(
            lstatSync(join(out, "node_modules/peerdep")).isSymbolicLink(),
        ).toBe(true);
        expect(existsSync(join(out, "node_modules/absent"))).toBe(false);
    });

    it("throws when a package has no build output", () => {
        put(
            repo,
            "packages/nobuild/package.json",
            JSON.stringify({
                name: "@tolki/nobuild",
                scripts: { build: "x" },
                files: ["dist"],
            }),
        );

        expect(() => stagePackages(repo, out)).toThrow(/no build output/);
    });

    it.skipIf(!existsSync(join(REPO_ROOT, "packages/lang/dist")))(
        "stages the real packages",
        () => {
            const real = mkdtempSync(join(tmpdir(), "treeshake-real-"));

            try {
                const staged = stagePackages(REPO_ROOT, real);

                expect(staged.map((p) => p.name)).toContain("@tolki/lang");
                expect(
                    readdirSync(join(real, "node_modules/@tolki")),
                ).not.toContain("types");
            } finally {
                rmSync(real, { recursive: true, force: true });
            }
        },
    );
});

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
