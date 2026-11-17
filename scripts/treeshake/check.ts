/**
 * Bundles the built `@tolki/*` packages, staged as they publish, with five bundlers and fails on any
 * tree-shaking regression that `debt.json` does not excuse.
 */
import {
    appendFileSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { scanPublishedSources } from "../side-effects/scan.ts";
import { BUNDLERS } from "./bundlers.ts";
import type { DebtEntry, Finding } from "./checks.ts";
import { applyDebt, runFixture, selectFixtures } from "./checks.ts";
import type { CheckName, Fixture } from "./fixtures.ts";
import {
    buildFixtures,
    declarationConflicts,
    readSubpathExports,
} from "./fixtures.ts";
import { stagePackages } from "./stage.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const DEBT_FILE = join(HERE, "debt.json");
const CHECKS: readonly CheckName[] = [
    "bare",
    "parity",
    "surface",
    "namespace",
    "drop",
    "keep",
    "shape",
];
const USAGE =
    "usage: treeshake:check [--check bare,parity,surface,namespace,drop,keep,shape] [--filter <id text>]";

/** Reads `debt.json`, rejecting an entry without an id, a known bundler, an issue or a reason. */
function readDebt(): DebtEntry[] {
    const entries = JSON.parse(readFileSync(DEBT_FILE, "utf8")) as unknown;

    if (!Array.isArray(entries)) {
        throw new Error("debt.json must hold an array");
    }

    return entries.map((entry: Partial<DebtEntry>, index) => {
        const valid =
            typeof entry.id === "string" &&
            BUNDLERS.includes(entry.bundler as never) &&
            typeof entry.issue === "string" &&
            entry.issue !== "" &&
            typeof entry.reason === "string" &&
            entry.reason !== "";

        if (!valid) {
            throw new Error(
                `debt.json entry ${index} needs an id, a bundler, an issue and a reason`,
            );
        }

        return entry as DebtEntry;
    });
}

/** Runs every fixture, at most `limit` at a time, and returns their findings in fixture order. */
async function runAll(
    fixtures: Fixture[],
    workDir: string,
    limit: number,
): Promise<Finding[]> {
    const results: Finding[][] = [];
    let next = 0;

    const worker = async (): Promise<void> => {
        while (next < fixtures.length) {
            const index = next++;

            results[index] = await runFixture(
                fixtures[index] as Fixture,
                workDir,
            );
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(limit, fixtures.length) }, worker),
    );

    return results.flat();
}

/** The `id [bundler]` label of a finding or debt entry; a source-scan finding shows `[scan]`. */
function label({
    id,
    bundler,
}: {
    id: string;
    bundler: string | null;
}): string {
    return `${id} [${bundler ?? "scan"}]`;
}

interface Report {
    fixtures: Fixture[];
    failures: Finding[];
    debtHit: Finding[];
    stale: DebtEntry[];
    seconds: number;
}

/** One row per check: fixtures, failures and excused findings. */
function rows({ fixtures, failures, debtHit }: Report): string[][] {
    const count = (list: { check: CheckName }[], name: CheckName): string =>
        String(list.filter(({ check }) => check === name).length);

    return CHECKS.map((name) => [
        name,
        count(fixtures, name),
        count(failures, name),
        count(debtHit, name),
    ]);
}

/** Prints the report to the console. */
function printReport(report: Report): void {
    const table = [["check", "fixtures", "failures", "debt"], ...rows(report)];

    for (const row of table) {
        console.log(
            row
                .map((cell, index) =>
                    index === 0 ? cell.padEnd(10) : cell.padStart(9),
                )
                .join(""),
        );
    }

    const sections: [string, string[]][] = [
        [
            "Failures",
            report.failures.map((item) => `${label(item)} ${item.message}`),
        ],
        [
            "Debt (excused)",
            report.debtHit.map((item) => `${label(item)} ${item.message}`),
        ],
        [
            "Stale debt (remove from scripts/treeshake/debt.json)",
            report.stale.map(
                (entry) => `${label(entry)} ${entry.issue}: ${entry.reason}`,
            ),
        ],
    ];

    for (const [title, lines] of sections.filter(([, list]) => list.length)) {
        console.log(`\n${title}:`);

        for (const line of lines) {
            console.log(`  ${line}`);
        }
    }

    console.log(
        `\n${report.fixtures.length} fixtures in ${report.seconds.toFixed(1)}s`,
    );
}

/** Appends the report to the GitHub job summary as markdown. */
function writeSummary(path: string, report: Report): void {
    const problems = [
        ...report.failures.map(
            (item) => `- Failure: \`${label(item)}\` ${item.message}`,
        ),
        ...report.stale.map((entry) => `- Stale debt: \`${label(entry)}\``),
    ];
    const lines = [
        "### Tree-shake check",
        "",
        "| Check | Fixtures | Failures | Debt |",
        "| --- | ---: | ---: | ---: |",
        ...rows(report).map((row) => `| ${row.join(" | ")} |`),
        "",
        ...(problems.length > 0 ? [...problems, ""] : []),
        `${report.fixtures.length} fixtures in ${report.seconds.toFixed(1)}s.`,
    ];

    appendFileSync(path, `${lines.join("\n")}\n\n`);
}

/**
 * Runs the check: stages the packages, bundles every fixture, applies the debt and prints the result.
 *
 * @param argv - The arguments after the script path.
 * @returns The exit code: 0 when clean, 1 on any failure or stale debt, 2 on a usage error.
 */
async function main(argv: string[]): Promise<number> {
    let values: { check?: string; filter?: string };

    try {
        ({ values } = parseArgs({
            args: argv,
            options: {
                check: { type: "string" },
                filter: { type: "string" },
            },
        }));
    } catch {
        console.error(USAGE);

        return 2;
    }

    const only = values.check?.split(",") ?? CHECKS;

    if (only.some((name) => !CHECKS.includes(name as CheckName))) {
        console.error(USAGE);

        return 2;
    }

    const started = performance.now();
    const workDir = mkdtempSync(join(tmpdir(), "treeshake-check-"));

    try {
        // No `sideEffects`: `false` makes webpack and Rspack drop every app-module call, so drops pass vacuously.
        writeFileSync(
            join(workDir, "package.json"),
            JSON.stringify({ private: true, type: "module" }),
        );

        const staged = stagePackages(ROOT, workDir);
        const scan = scanPublishedSources(ROOT);
        const subpaths = await readSubpathExports(staged, scan);
        const selected = ({ check, id }: { check: CheckName; id: string }) =>
            only.includes(check) &&
            (values.filter === undefined || id.includes(values.filter));
        const fixtures = selectFixtures(
            buildFixtures(subpaths, scan),
            only,
            values.filter,
        );
        const filtered =
            values.check !== undefined || values.filter !== undefined;

        if (filtered && fixtures.length === 0) {
            console.error(
                `treeshake:check: no fixture matches ${JSON.stringify(values)}`,
            );

            return 1;
        }

        const ran = new Set(
            fixtures.flatMap((fixture) =>
                [fixture, ...(fixture.split ?? [])].flatMap((part) =>
                    fixture.bundlers.map((bundler) =>
                        label({ id: part.id, bundler }),
                    ),
                ),
            ),
        );
        // A filtered run cannot tell whether an entry for a fixture it skipped is stale.
        const debt = readDebt().filter(
            (entry) => !filtered || ran.has(label(entry)),
        );
        // webpack and Rspack fixtures run longest, so they start first.
        const order = [...fixtures].sort(
            (a, b) => b.bundlers.length - a.bundlers.length,
        );
        const findings = [
            ...declarationConflicts(subpaths, scan).filter(selected),
            ...(await runAll(order, workDir, availableParallelism())),
        ];
        const report: Report = {
            fixtures,
            ...applyDebt(findings, debt),
            seconds: (performance.now() - started) / 1000,
        };

        printReport(report);

        if (process.env.GITHUB_STEP_SUMMARY) {
            writeSummary(process.env.GITHUB_STEP_SUMMARY, report);
        }

        return report.failures.length > 0 || report.stale.length > 0 ? 1 : 0;
    } catch (error) {
        console.error(`treeshake:check: ${(error as Error).message}`);

        return 1;
    } finally {
        rmSync(workDir, { recursive: true, force: true });
    }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
    process.exitCode = await main(process.argv.slice(2));
}
