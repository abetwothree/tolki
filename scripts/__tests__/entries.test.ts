import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildEntries } from "../entries.ts";

/**
 * Writes an empty file, creating its directories.
 *
 * @param root - Directory the file lives under.
 * @param file - Path of the file relative to the root.
 */
function touch(root: string, file: string): void {
    const path = join(root, file);

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, "export {};\n");
}

describe("buildEntries", () => {
    let root: string;

    beforeAll(() => {
        root = mkdtempSync(join(tmpdir(), "entries-"));

        touch(root, "src/index.ts");
        touch(root, "src/sub/index.ts");
        touch(root, "src/types.d.ts");
    });

    afterAll(() => {
        rmSync(root, { recursive: true, force: true });
    });

    it("keys nested files with forward slashes and skips declaration files", () => {
        const entries = buildEntries("src/**/*.ts", root);

        expect(Object.keys(entries).sort()).toEqual(["index", "sub/index"]);
    });

    it("points every value at the source file", () => {
        const entries = buildEntries("src/**/*.ts", root);

        expect(entries["index"]).toBe(join(root, "src/index.ts"));
        expect(entries["sub/index"]).toBe(join(root, "src", "sub", "index.ts"));
    });
});
