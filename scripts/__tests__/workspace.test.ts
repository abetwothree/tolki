import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
    hasBuild,
    isPublished,
    type WorkspacePackage,
    workspacePackages,
} from "../lib/workspace.ts";
import { findStubFiles } from "../stubs-function-list-create.ts";

const REPO_ROOT = resolve(import.meta.dirname, "../..");

let repo: string;

/**
 * Writes a package manifest under the temp repo.
 *
 * @param dirName - Directory below `packages`.
 * @param manifest - Manifest content.
 */
function writeManifest(dirName: string, manifest: object): void {
    const dir = join(repo, "packages", dirName);

    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify(manifest));
}

/**
 * Builds a package fixture around a manifest.
 *
 * @param manifest - Manifest content.
 * @returns A workspace package pointing nowhere.
 */
function pkgWith(manifest: WorkspacePackage["manifest"]): WorkspacePackage {
    return { dirName: "x", dir: "/x", name: "@tolki/x", manifest };
}

beforeAll(() => {
    repo = mkdtempSync(join(tmpdir(), "workspace-"));
    writeManifest("b-lib", { scripts: { build: "vite build" } });
    writeManifest("a-private", { name: "@tolki/a-private", private: true });
    mkdirSync(join(repo, "packages", "c-empty"), { recursive: true });
    writeFileSync(join(repo, "packages", "README.md"), "");
});

afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
});

describe("workspacePackages", () => {
    it("lists directories with a package.json, sorted", () => {
        expect(workspacePackages(repo).map((p) => p.dirName)).toEqual([
            "a-private",
            "b-lib",
        ]);
    });

    it("falls back to @tolki/<dir> when the manifest has no name", () => {
        expect(
            workspacePackages(repo).find((p) => p.dirName === "b-lib")?.name,
        ).toBe("@tolki/b-lib");
    });

    it("throws when there is no packages directory", () => {
        expect(() => workspacePackages(join(repo, "missing"))).toThrow(
            /Packages directory not found/,
        );
    });

    it("finds @tolki/types in the real repo as published without a build", () => {
        const types = workspacePackages(REPO_ROOT).find(
            (p) => p.name === "@tolki/types",
        );

        expect(types && isPublished(types)).toBe(true);
        expect(types && hasBuild(types)).toBe(false);
    });
});

describe("isPublished", () => {
    it("is false for a private package", () => {
        expect(isPublished(pkgWith({ private: true }))).toBe(false);
    });

    it("is true when the manifest is not private", () => {
        expect(isPublished(pkgWith({}))).toBe(true);
    });
});

describe("hasBuild", () => {
    it("is true only with a scripts.build string", () => {
        expect(hasBuild(pkgWith({ scripts: { build: "vite build" } }))).toBe(
            true,
        );
        expect(hasBuild(pkgWith({ scripts: {} }))).toBe(false);
        expect(hasBuild(pkgWith({}))).toBe(false);
    });
});

describe("findStubFiles", () => {
    it("returns the PHP stubs of packages that have a stubs directory", () => {
        const root = mkdtempSync(join(tmpdir(), "stubs-"));

        try {
            for (const name of ["str", "obj"]) {
                mkdirSync(join(root, "packages", name), { recursive: true });
                writeFileSync(
                    join(root, "packages", name, "package.json"),
                    "{}",
                );
            }

            mkdirSync(join(root, "packages", "str", "stubs"));
            writeFileSync(
                join(root, "packages", "str", "stubs", "Str.php"),
                "",
            );

            const found = findStubFiles(root);

            expect(found).toHaveLength(1);
            expect(found[0]).toMatchObject({
                packageName: "str",
                fileName: "Str.php",
            });
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});
