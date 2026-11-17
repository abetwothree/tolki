import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { BundleResult, BundlerName } from "./bundlers.ts";
import { bundle } from "./bundlers.ts";
import { KEPT_DROPS } from "./expectations.ts";
import type { CheckName, Fixture, Outcome } from "./fixtures.ts";

export interface Finding {
    id: string;
    /** `null` for a finding of the source scan rather than of a bundle. */
    bundler: BundlerName | null;
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

export const KEPT_DROP_CHANGED =
    "expectation changed: update scripts/treeshake/expectations.ts and the Bundling sections of docs/vitepress/strings/index.md, collections/index.md, numbers/index.md and localization/index.md";

const KEPT = "kept; expected dropped";

/** The expectation-changed message for a fixture: a kept drop points at its table and docs, the rest at the shape docs. */
export function expectationChangedMessage(fixture: Fixture): string {
    const listed = Object.keys(KEPT_DROPS).some(
        (key) =>
            fixture.id === `drop:${key}` ||
            fixture.id === `drop:${key.replace(":", ":call-site-pure:")}`,
    );

    return listed ? KEPT_DROP_CHANGED : EXPECTATION_CHANGED;
}
const UNEXCUSABLE = /^(build failed|missing exports): /;
const COMPARED: ReadonlySet<CheckName> = new Set(["drop", "keep", "shape"]);

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

    if (fixture.expect[bundler] !== undefined) {
        return compare(fixture, bundler, result, control, workDir, build);
    }

    switch (fixture.check) {
        case "bare": {
            const kept = keptModules(result).map(
                (module) => `${module} (${result.ownBytes?.[module]} B)`,
            );

            return kept.length > 0 ? finding(`keeps ${kept.join(", ")}`) : [];
        }
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
        default:
            // `surface` passes once the bundle builds; compared checks returned above.
            return [];
    }
}

/** Judges a fixture's bundle against its control: byte-identical is `dropped`, anything else `kept`. */
async function compare(
    fixture: Fixture,
    bundler: BundlerName,
    result: BundleResult,
    control: string | null,
    workDir: string,
    build: Build,
): Promise<Finding[]> {
    const finding = (message: string): Finding[] => [
        { id: fixture.id, bundler, check: fixture.check, message },
    ];
    const { code } = await build(control as string, bundler);
    const outcome: Outcome = result.code === code ? "dropped" : "kept";

    if (outcome === fixture.expect[bundler]) {
        return [];
    }

    if (outcome === "dropped") {
        return finding(expectationChangedMessage(fixture));
    }

    const named: Finding[] = [];

    for (const part of fixture.split ?? []) {
        named.push(
            ...(await runFixture({ ...part, bundlers: [bundler] }, workDir)),
        );
    }

    if (named.length > 0) {
        return named;
    }

    return finding(
        fixture.check === "bare"
            ? `${KEPT} (${result.code.length} B after minify)`
            : KEPT,
    );
}

/** Throws when a fixture lacks the control build or an expectation its check compares against. */
function assertComplete(fixture: Fixture): void {
    const compared = COMPARED.has(fixture.check);
    const needsControl =
        compared ||
        fixture.check === "namespace" ||
        Object.keys(fixture.expect).length > 0;

    if (needsControl && fixture.control === null) {
        throw new Error(`${fixture.id} needs a control build`);
    }

    const missing = compared
        ? fixture.bundlers.find((bundler) => !fixture.expect[bundler])
        : undefined;

    if (missing !== undefined) {
        throw new Error(`${fixture.id} has no expectation for ${missing}`);
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
    assertComplete(fixture);

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
        // A broken build or a missing export is never known debt: it would hide every check of that bundle.
        const index = UNEXCUSABLE.test(finding.message)
            ? -1
            : debt.findIndex(
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
