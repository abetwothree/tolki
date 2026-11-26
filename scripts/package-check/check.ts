/**
 * Packs every published `@tolki/*` package and checks it as node16, nodenext, CommonJS and bundler consumers do:
 * a type-check per cell, attw on each tarball and a runtime load of every value entry.
 */
import {
    appendFileSync,
    copyFileSync,
    mkdtempSync,
    realpathSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { packWorkspace } from "../lib/pack.ts";
import type { Cell } from "./consumer.ts";
import {
    CELLS,
    consumerEntries,
    consumerFiles,
    emptyPackages,
    filterEntries,
    staleExclusions,
} from "./consumer.ts";
import { isAmbientDeclaration, runAttw, runCell, runSmoke } from "./runners.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const FIXED_INPUTS = ["repro.mts", "augment.mts"];
const USAGE = "usage: package:check [--filter <specifier text>]";

interface Row {
    check: string;
    ok: boolean;
    detail: string;
    failures: string[];
}

/**
 * The cells to run: a filtered run drops the fixed inputs, which import packages the filter may leave out.
 *
 * @param filtered - Whether `--filter` narrowed the entries.
 * @returns The cells with their files.
 */
function cellsFor(filtered: boolean): Cell[] {
    return CELLS.map((cell) =>
        filtered
            ? {
                  ...cell,
                  files: cell.files.filter(
                      (file) => !FIXED_INPUTS.includes(file),
                  ),
              }
            : cell,
    );
}

/**
 * Prints the rows as a table, then every failing row's details.
 *
 * @param rows - The report rows.
 */
function printReport(rows: readonly Row[]): void {
    const width = Math.max(...rows.map(({ check }) => check.length)) + 2;

    console.log(`${"check".padEnd(width)}${"result".padEnd(8)}detail`);

    for (const { check, ok, detail } of rows) {
        console.log(
            `${check.padEnd(width)}${(ok ? "pass" : "FAIL").padEnd(8)}${detail}`,
        );
    }

    for (const { check, failures } of rows.filter(({ ok }) => !ok)) {
        console.log(`\n${check}:`);

        for (const failure of failures) {
            console.log(failure.replace(/^/gm, "  "));
        }
    }
}

/**
 * Appends the rows to the GitHub job summary as a markdown table.
 *
 * @param path - The summary file.
 * @param rows - The report rows.
 */
function writeSummary(path: string, rows: readonly Row[]): void {
    const lines = [
        "### Package check",
        "",
        "| Check | Result | Detail |",
        "| --- | --- | --- |",
        ...rows.map(
            ({ check, ok, detail }) =>
                `| ${check} | ${ok ? "pass" : "FAIL"} | ${detail} |`,
        ),
    ];

    appendFileSync(path, `${lines.join("\n")}\n\n`);
}

/**
 * Runs the check: packs the packages, writes the consumer, runs the cells, attw and the smoke test.
 *
 * @param argv - The arguments after the script path.
 * @returns The exit code: 0 when every check passes, 1 on any failure, 2 on a usage error.
 */
function main(argv: string[]): number {
    let filter: string | undefined;

    try {
        ({
            values: { filter },
        } = parseArgs({ args: argv, options: { filter: { type: "string" } } }));
    } catch {
        console.error(USAGE);

        return 2;
    }

    // tsc prints paths relative to the real cwd, so a symlinked tmpdir (macOS) would print them through `../`.
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "package-check-")));

    try {
        const packages = packWorkspace(ROOT, dir);

        writeFileSync(
            join(dir, "package.json"),
            JSON.stringify({
                name: "tolki-package-check-consumer",
                private: true,
                type: "module",
            }),
        );

        const declared = consumerEntries(packages, isAmbientDeclaration);
        const entries = filterEntries(declared, filter);

        if (filter !== undefined && entries.length === 0) {
            console.error(`package:check: no entry matches --filter ${filter}`);

            return 2;
        }

        // A filtered run leaves packages out on purpose, so only a full run can call one empty.
        const problems = [
            ...staleExclusions(declared).map(
                (specifier) =>
                    `NO_DOM_EXCLUDED lists ${specifier}, which no manifest declares`,
            ),
            ...(filter === undefined
                ? emptyPackages(packages, declared).map(
                      (name) => `${name} contributes no entry`,
                  )
                : []),
            ...(entries.length === 0 ? ["no manifest declares an entry"] : []),
        ];
        const rows: Row[] = [
            {
                check: "entries",
                ok: problems.length === 0,
                detail: `${entries.length} from ${packages.length} packed packages`,
                failures: problems,
            },
        ];

        for (const [file, text] of Object.entries(consumerFiles(entries))) {
            writeFileSync(join(dir, file), text);
        }

        if (filter === undefined) {
            for (const file of FIXED_INPUTS) {
                copyFileSync(
                    join(HERE, "fixtures/consumer", file),
                    join(dir, file),
                );
            }
        }

        for (const cell of cellsFor(filter !== undefined)) {
            const diagnostics = runCell(cell, dir);

            rows.push({
                check: cell.name,
                ok: diagnostics.length === 0,
                detail: `${diagnostics.length} diagnostics`,
                failures: diagnostics,
            });
        }

        for (const pkg of packages.filter(({ name }) =>
            entries.some(({ pkg: entryPkg }) => entryPkg === name),
        )) {
            const { ok, output } = runAttw(pkg.tarball);

            rows.push({
                check: `attw ${pkg.name}`,
                ok,
                detail: "",
                failures: [output.trim()],
            });
        }

        const values = entries
            .filter(({ kind }) => kind === "value")
            .map(({ specifier }) => specifier);
        const smoke = runSmoke(dir, values);

        rows.push({
            check: "smoke",
            ok: smoke.length === 0,
            detail: `${smoke.length} of ${values.length * 2} loads failed`,
            failures: smoke.map(
                ({ specifier, mode, error }) =>
                    `${specifier} (${mode}): ${error}`,
            ),
        });

        printReport(rows);

        const summary = process.env["GITHUB_STEP_SUMMARY"];

        if (summary) {
            writeSummary(summary, rows);
        }

        return rows.every(({ ok }) => ok) ? 0 : 1;
    } catch (error) {
        console.error(`package:check: ${(error as Error).message}`);

        return 1;
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
    process.exitCode = main(process.argv.slice(2));
}
