import {
    existsSync,
    lstatSync,
    mkdirSync,
    mkdtempSync,
    realpathSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { exportsBySubpath, importTarget } from "../lib/manifest.ts";
import { linkDependencies, packWorkspace } from "../lib/pack.ts";
import type { WorkspacePackage } from "../lib/workspace.ts";
import { workspacePackages } from "../lib/workspace.ts";

const REPO_ROOT = resolve(__dirname, "../..");

/**
 * Writes a file, creating its directories.
 *
 * @param root - Directory the file lives under.
 * @param file - Path of the file relative to the root.
 * @param content - Text to write.
 */
function put(root: string, file: string, content: string): void {
    const path = join(root, file);

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
}

describe("linkDependencies", () => {
    let repo: string;
    let out: string;
    let pkg: WorkspacePackage;

    beforeAll(() => {
        repo = mkdtempSync(join(tmpdir(), "pack-repo-"));
        out = mkdtempSync(join(tmpdir(), "pack-out-"));

        put(repo, "packages/fake/node_modules/third/index.js", "export {};\n");
        put(
            repo,
            "packages/fake/node_modules/peerdep/index.js",
            "export {};\n",
        );
        put(
            repo,
            "packages/fake/package.json",
            JSON.stringify({
                name: "@tolki/fake",
                scripts: { build: "x" },
                files: ["lib"],
                dependencies: { third: "^1", "@tolki/other": "workspace:^" },
                peerDependencies: { peerdep: "^1", absent: "^1" },
            }),
        );

        [pkg] = workspacePackages(repo) as [WorkspacePackage];
        linkDependencies(pkg, join(out, "node_modules"));
    });

    afterAll(() => {
        rmSync(repo, { recursive: true, force: true });
        rmSync(out, { recursive: true, force: true });
    });

    it("links a third-party dependency to its realpath", () => {
        const link = join(out, "node_modules/third");

        expect(lstatSync(link).isSymbolicLink()).toBe(true);
        expect(realpathSync(link)).toBe(
            realpathSync(join(repo, "packages/fake/node_modules/third")),
        );
    });

    it("does not link a @tolki dependency", () => {
        expect(existsSync(join(out, "node_modules/@tolki/other"))).toBe(false);
    });

    it("links an installed peer and skips a missing one", () => {
        expect(
            lstatSync(join(out, "node_modules/peerdep")).isSymbolicLink(),
        ).toBe(true);
        expect(existsSync(join(out, "node_modules/absent"))).toBe(false);
    });
});

describe("packWorkspace", () => {
    it("throws for a package with a build script and no build output", () => {
        const repo = mkdtempSync(join(tmpdir(), "pack-repo-"));
        const out = mkdtempSync(join(tmpdir(), "pack-out-"));

        try {
            put(
                repo,
                "packages/nobuild/package.json",
                JSON.stringify({
                    name: "@tolki/nobuild",
                    scripts: { build: "x" },
                    files: ["dist"],
                }),
            );

            expect(() => packWorkspace(repo, out)).toThrow(
                /no build output at dist; run pnpm build first/,
            );
        } finally {
            rmSync(repo, { recursive: true, force: true });
            rmSync(out, { recursive: true, force: true });
        }
    });

    it.skipIf(!existsSync(join(REPO_ROOT, "packages/lang/dist")))(
        "packs the real packages",
        () => {
            const out = mkdtempSync(join(tmpdir(), "pack-real-"));

            try {
                const packed = packWorkspace(REPO_ROOT, out);
                const names = packed.map(({ name }) => name);
                const lang = packed.find(({ name }) => name === "@tolki/lang");

                expect(names).toContain("@tolki/lang");
                expect(names).toContain("@tolki/types");
                expect(lang).toBeDefined();
                expect("publishConfig" in (lang?.manifest ?? {})).toBe(false);

                const target = importTarget(
                    exportsBySubpath(lang?.manifest ?? {})["."],
                );

                expect(target).not.toBeNull();
                expect(existsSync(join(lang?.root ?? "", target ?? ""))).toBe(
                    true,
                );
            } finally {
                rmSync(out, { recursive: true, force: true });
            }
        },
        120_000,
    );
});
