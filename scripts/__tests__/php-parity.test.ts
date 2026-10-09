import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const PROBE_DIR = join(ROOT, "scripts/php-parity");
const TRANSCRIPT_DIR = join(ROOT, "docs/php-parity");
const PROBE_PATH =
    /^(Arr|Collection|Helpers|LazyCollection|Number|Php|Str|Stringable)\/[A-Za-z_][\w-]*\.php$/;

/**
 * Every file under a directory, as forward-slash paths relative to it.
 *
 * @param dir - The directory to walk.
 * @returns The relative paths, sorted.
 */
function filesUnder(dir: string): string[] {
    const found: string[] = [];

    const walk = (relative: string): void => {
        for (const entry of readdirSync(join(dir, relative))) {
            const path = relative === "" ? entry : `${relative}/${entry}`;

            if (statSync(join(dir, path)).isDirectory()) {
                walk(path);
            } else {
                found.push(path);
            }
        }
    };

    walk("");

    return found.sort();
}

/**
 * The labels a transcript records, in order.
 *
 * @param path - The transcript's path relative to docs/php-parity.
 * @returns Each probe's label.
 */
function labelsOf(path: string): string[] {
    const { probes } = JSON.parse(
        readFileSync(join(TRANSCRIPT_DIR, path), "utf8"),
    ) as { probes: { label: string }[] };

    return probes.map(({ label }) => label);
}

describe("php-parity layout", () => {
    it("keeps each probe script in a class or topic folder", () => {
        const scripts = filesUnder(PROBE_DIR).filter(
            (path) =>
                path.endsWith(".php") &&
                path !== "bootstrap.php" &&
                path !== "shared.php",
        );

        expect(scripts.length).toBeGreaterThan(0);
        expect(scripts.filter((path) => !PROBE_PATH.test(path))).toEqual([]);
    });

    it("records one transcript per probe script, and none without a script", () => {
        const scripts = filesUnder(PROBE_DIR)
            .filter((path) => PROBE_PATH.test(path))
            .map((path) => path.replace(/\.php$/, ""));
        const transcripts = filesUnder(TRANSCRIPT_DIR)
            .filter((path) => path !== ".gitkeep")
            .map((path) => path.replace(/\.json$/, ""));

        expect(transcripts).toEqual(scripts);
    });

    it("gives each probe in a transcript its own label", () => {
        const repeated = filesUnder(TRANSCRIPT_DIR)
            .filter((path) => path.endsWith(".json"))
            .flatMap((path) => {
                const labels = labelsOf(path);

                return labels
                    .filter((label, i) => labels.indexOf(label) !== i)
                    .map((label) => `${path}: ${label}`);
            });

        expect(repeated).toEqual([]);
    });
});
