import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const PACKAGES_DIR = resolve(__dirname, "../../packages");

/**
 * Every .d.ts file under a package's dist directory.
 *
 * @returns Absolute paths, empty when nothing has been built yet.
 */
function builtDeclarationFiles(): string[] {
    const found: string[] = [];

    const walk = (dir: string): void => {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);

            if (statSync(full).isDirectory()) {
                walk(full);
            } else if (entry.endsWith(".d.ts")) {
                found.push(full);
            }
        }
    };

    for (const pkg of readdirSync(PACKAGES_DIR)) {
        const dist = join(PACKAGES_DIR, pkg, "dist");

        try {
            if (statSync(dist).isDirectory()) {
                walk(dist);
            }
        } catch {
            // Package has no dist (types-only, or not built) -- nothing to check.
        }
    }

    return found;
}

describe("built declarations", () => {
    it.skip("emits no relative cross-package type specifiers", () => {
        const files = builtDeclarationFiles();

        // Guards the assertion below against passing vacuously on an unbuilt tree.
        expect(files.length).toBeGreaterThan(0);

        const offenders = files.flatMap((file) =>
            readFileSync(file, "utf8")
                .split("\n")
                .filter((line) => /from ['"]\.\.?\/.*packages\//.test(line))
                .map((line) => `${file}: ${line.trim()}`),
        );

        expect(offenders).toEqual([]);
    })
});
