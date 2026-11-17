import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { BundleResult, BundlerName } from "./bundlers.ts";
import { bundle } from "./bundlers.ts";
import type { CheckName, Fixture, Outcome } from "./fixtures.ts";

export interface Finding {
    id: string;
    bundler: BundlerName;
    check: CheckName;
    message: string;
}

export interface DebtEntry {
    id: string;
    bundler: BundlerName;
    issue: string;
    reason: string;
}

export const EXPECTATION_CHANGED =
    "expectation changed: update docs/features/treeshake-check.md and docs/vitepress/tree-shaking.md";

const KEPT = "kept; expected dropped";

/** Writes a fixture's files under `dir` and returns the path of its entry. */
function writeFiles(dir: string, files: Record<string, string>): string {
    for (const [file, content] of Object.entries(files)) {
        const path = join(dir, file);

        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    }

    return join(dir, "entry.js");
}

/** The staged modules that left bytes in a bundle, sorted. */
function keptModules({ ownBytes }: BundleResult): string[] {
    return Object.entries(ownBytes ?? {})
        .filter(([, bytes]) => bytes > 0)
        .map(([module]) => module)
        .sort();
}

type Build = (entry: string, bundler: BundlerName) => Promise<BundleResult>;

/** Bundles entries once per bundler and throws when a bundler reports a missing export. */
function builder(strict: boolean): Build {
    const cache = new Map<string, Promise<BundleResult>>();

    return (entry, bundler) => {
        const key = `${bundler} ${entry}`;
        const cached =
            cache.get(key) ??
            bundle(entry, bundler, { strict }).then((result) => {
                if (result.missingExports.length > 0) {
                    throw new Error(
                        `missing exports: ${result.missingExports.join(", ")}`,
                    );
                }

                return result;
            });

        cache.set(key, cached);

        return cached;
    };
}

/** Runs one bundler's part of a fixture and returns its findings. */
async function check(
    fixture: Fixture,
    bundler: BundlerName,
    entry: string,
    control: string | null,
    workDir: string,
    build: Build,
): Promise<Finding[]> {
    const finding = (message: string): Finding[] => [
        { id: fixture.id, bundler, check: fixture.check, message },
    ];
    const result = await build(entry, bundler);

    switch (fixture.check) {
        case "bare": {
            const kept = keptModules(result).map(
                (module) => `${module} (${result.ownBytes?.[module]} B)`,
            );

            return kept.length > 0 ? finding(`keeps ${kept.join(", ")}`) : [];
        }
        case "surface":
            return [];
        case "parity": {
            const [reference = bundler] = fixture.bundlers;

            if (bundler === reference) {
                return [];
            }

            const allowed = new Set(keptModules(await build(entry, reference)));
            const extra = keptModules(result).filter(
                (module) => !allowed.has(module),
            );

            return extra.length > 0
                ? finding(`keeps ${extra.join(", ")} that ${reference} drops`)
                : [];
        }
        case "namespace": {
            const namespace = keptModules(result).join(", ");
            const named = keptModules(
                await build(control ?? entry, bundler),
            ).join(", ");

            return namespace === named
                ? []
                : finding(
                      `namespace import keeps [${namespace}]; named import keeps [${named}]`,
                  );
        }
        case "drop":
        case "keep":
        case "shape": {
            const { code } = await build(control ?? entry, bundler);
            const outcome: Outcome = result.code === code ? "dropped" : "kept";
            const expected = fixture.expect[bundler];

            if (expected === undefined || outcome === expected) {
                return [];
            }

            if (outcome === "dropped") {
                return finding(EXPECTATION_CHANGED);
            }

            const named: Finding[] = [];

            for (const part of fixture.split ?? []) {
                named.push(
                    ...(await runFixture(
                        { ...part, bundlers: [bundler] },
                        workDir,
                    )),
                );
            }

            return named.length > 0 ? named : finding(KEPT);
        }
    }
}

/**
 * Bundles a fixture with each of its bundlers and checks the result.
 *
 * @param fixture - The fixture to run.
 * @param workDir - A directory whose `node_modules` holds the staged packages.
 * @returns One finding per bundler that failed the fixture's check; a failed `drop` reports each kept name.
 */
export async function runFixture(
    fixture: Fixture,
    workDir: string,
): Promise<Finding[]> {
    const dir = mkdtempSync(
        join(workDir, `${fixture.id.replace(/[^\w.-]+/g, "-")}-`),
    );
    const entry = writeFiles(join(dir, "files"), fixture.files);
    const control =
        fixture.control === null
            ? null
            : writeFiles(join(dir, "control"), fixture.control);
    const build = builder(fixture.strict);
    const findings: Finding[] = [];

    for (const bundler of fixture.bundlers) {
        try {
            findings.push(
                ...(await check(
                    fixture,
                    bundler,
                    entry,
                    control,
                    workDir,
                    build,
                )),
            );
        } catch (error) {
            const message = (error as Error).message.split("\n")[0] ?? "";

            findings.push({
                id: fixture.id,
                bundler,
                check: fixture.check,
                message: message.startsWith("missing exports: ")
                    ? message
                    : `build failed: ${message}`,
            });
        }
    }

    return findings;
}

/**
 * Lets each debt entry excuse one matching finding.
 *
 * @param findings - Every finding of the run.
 * @param debt - The entries of `debt.json`.
 * @returns The unexcused findings, the excused ones, and the entries that excused nothing.
 */
export function applyDebt(
    findings: Finding[],
    debt: DebtEntry[],
): { failures: Finding[]; debtHit: Finding[]; stale: DebtEntry[] } {
    const used = new Set<number>();
    const failures: Finding[] = [];
    const debtHit: Finding[] = [];

    for (const finding of findings) {
        const index = debt.findIndex(
            (entry, at) =>
                !used.has(at) &&
                entry.id === finding.id &&
                entry.bundler === finding.bundler,
        );

        if (index === -1) {
            failures.push(finding);
        } else {
            used.add(index);
            debtHit.push(finding);
        }
    }

    return {
        failures,
        debtHit,
        stale: debt.filter((_, at) => !used.has(at)),
    };
}
