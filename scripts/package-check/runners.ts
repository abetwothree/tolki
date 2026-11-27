import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import ts from "typescript";

import type { Cell } from "./consumer.ts";

export interface SmokeFailure {
    specifier: string;
    mode: "import" | "require";
    error: string;
}

const require = createRequire(import.meta.url);

/**
 * The absolute path of a bin script an installed package declares.
 *
 * @param packageName - The package that declares the bin.
 * @param command - The bin's name.
 * @returns The script's absolute path.
 */
function binPath(packageName: string, command: string): string {
    const manifestPath = require.resolve(`${packageName}/package.json`);
    const { bin } = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        bin?: Record<string, string>;
    };
    const script = bin?.[command];

    if (script === undefined) {
        throw new Error(`${packageName} declares no ${command} bin`);
    }

    return join(dirname(manifestPath), script);
}

/**
 * Runs a Node script with this process's Node.
 *
 * @param script - The script path.
 * @param args - Its arguments.
 * @param cwd - The directory to run in.
 * @returns The exit status (null when the process could not run) and the combined stdout and stderr.
 */
function runNode(
    script: string,
    args: readonly string[],
    cwd: string,
): { status: number | null; stdout: string; output: string } {
    const result = spawnSync(process.execPath, [script, ...args], {
        cwd,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
    });

    return {
        status: result.status,
        stdout: result.stdout,
        output: `${result.stdout}${result.stderr}${result.error?.message ?? ""}`,
    };
}

/**
 * Tells whether a declaration file declares no module of its own, such as a file of `declare module` blocks.
 *
 * @param file - The declaration file.
 * @returns True when the file has no top-level import or export; false when it is missing.
 */
export function isAmbientDeclaration(file: string): boolean {
    // A missing file stays an import, so every cell reports it instead of the check crashing.
    if (!existsSync(file)) {
        return false;
    }

    return !ts.isExternalModule(
        ts.createSourceFile(
            file,
            readFileSync(file, "utf8"),
            ts.ScriptTarget.Latest,
        ),
    );
}

/**
 * Type-checks a cell's files with the repository's TypeScript 7 compiler.
 *
 * @param cell - The cell.
 * @param consumerDir - The consumer directory holding the files and their node_modules.
 * @returns The diagnostics; empty means the cell passes.
 */
export function runCell(cell: Cell, consumerDir: string): string[] {
    const tsconfig = join(consumerDir, `tsconfig.${cell.name}.json`);

    writeFileSync(
        tsconfig,
        JSON.stringify(
            { compilerOptions: cell.compilerOptions, files: cell.files },
            null,
            4,
        ),
    );

    const { status, stdout, output } = runNode(
        binPath("@typescript/native", "tsc"),
        ["-p", tsconfig, "--pretty", "false"],
        consumerDir,
    );
    const diagnostics = stdout
        .split("\n")
        .filter((line) => line.includes(": error TS"));

    return diagnostics.length === 0 && status !== 0
        ? [output.trim()]
        : diagnostics;
}

/**
 * Runs Are the Types Wrong on a tarball as a node16 consumer sees it.
 *
 * @param tarball - The packed tarball.
 * @returns Whether attw passed, and its output.
 */
export function runAttw(tarball: string): { ok: boolean; output: string } {
    const { status, output } = runNode(
        binPath("@arethetypeswrong/cli", "attw"),
        [
            tarball,
            "--profile",
            "node16",
            "--ignore-rules",
            "cjs-resolves-to-esm",
        ],
        dirname(tarball),
    );

    return { ok: status === 0, output };
}

const SMOKE_SCRIPT = `import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const describe = (error) => \`\${error.code ?? error.name}: \${error.message.split("\\n")[0]}\`;
const failures = [];

for (const specifier of SPECIFIERS) {
    try {
        await import(specifier);
    } catch (error) {
        failures.push({ specifier, mode: "import", error: describe(error) });
    }

    try {
        require(specifier);
    } catch (error) {
        failures.push({ specifier, mode: "require", error: describe(error) });
    }
}

console.log(JSON.stringify(failures));
`;

/**
 * Loads every specifier with `import()` and with `require()` from a child Node process in the consumer directory.
 *
 * @param consumerDir - The consumer directory holding the installed packages.
 * @param specifiers - The specifiers to load.
 * @returns One failure per specifier and mode that threw.
 */
export function runSmoke(
    consumerDir: string,
    specifiers: readonly string[],
): SmokeFailure[] {
    const script = join(consumerDir, "smoke.mjs");

    writeFileSync(
        script,
        `const SPECIFIERS = ${JSON.stringify(specifiers)};\n${SMOKE_SCRIPT}`,
    );

    const { status, stdout, output } = runNode(script, [], consumerDir);
    const last = stdout.trim().split("\n").at(-1);

    if (status !== 0 || last === undefined) {
        throw new Error(`the smoke test crashed: ${output}`);
    }

    return JSON.parse(last) as SmokeFailure[];
}
