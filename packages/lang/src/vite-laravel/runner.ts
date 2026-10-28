import { exec } from "node:child_process";
import { promisify } from "node:util";

import { isObject, isString } from "@tolki/utils";
import type { Logger } from "vite";

const execAsync = promisify(exec);

const LABEL = "[@tolki/lang]";

export interface ExportRunnerOptions {
    /** The command of a full export. */
    readonly fullCommand: string;
    /** Builds the command of a one-file export, or `null` to always run the full one. */
    readonly sourceCommand: ((file: string) => string) | null;
    /** The directory the commands run in. */
    readonly cwd: string;
    /** The Vite logger. */
    readonly logger: Logger;
    /** Whether a failed run rejects instead of only logging. */
    readonly shouldThrow: () => boolean;
    /** Called after each successful run. */
    readonly onSuccess: () => void;
}

export interface ExportRunner {
    /** Run a full export, queued behind a running one. */
    full(): Promise<void>;
    /** Run the export for one changed file, queued behind a running one. */
    source(file: string): Promise<void>;
}

interface Waiter {
    resolve: () => void;
    reject: (reason: unknown) => void;
}

/**
 * Read one captured stream off an exec error.
 *
 * @param error - The caught value.
 * @param stream - The stream to read.
 * @returns The trimmed stream, or an empty string.
 */
function capturedOutput(error: unknown, stream: "stdout" | "stderr"): string {
    if (!isObject(error)) {
        return "";
    }

    const value = (error as Record<string, unknown>)[stream];

    return isString(value) ? value.trim() : "";
}

/**
 * Format a failed run: the error message plus any output it does not hold.
 *
 * @param error - The caught value.
 * @returns The message to log or throw.
 */
function failureMessage(error: unknown): string {
    const baseMessage = error instanceof Error ? error.message : String(error);

    // Node embeds stderr in the error message, but artisan reports most failures on stdout.
    const output = [
        capturedOutput(error, "stderr"),
        capturedOutput(error, "stdout"),
    ]
        .filter((part) => part !== "" && !baseMessage.includes(part))
        .join("\n");

    return `${LABEL} Command failed: ${baseMessage}${output === "" ? "" : `\n${output}`}`;
}

/**
 * Create a runner that serializes exports and coalesces the ones queued behind a run.
 *
 * @param options - The commands, working directory and callbacks.
 * @returns The runner.
 */
export function createExportRunner(options: ExportRunnerOptions): ExportRunner {
    const { fullCommand, sourceCommand, cwd, logger, shouldThrow, onSuccess } =
        options;

    let running = false;
    let pendingFull = false;
    let pendingFiles = new Set<string>();
    let pendingWaiters: Waiter[] = [];

    /**
     * Run one command, throwing or logging its failure as configured.
     *
     * @param command - The shell command.
     */
    async function execute(command: string): Promise<void> {
        try {
            logger.info(`${LABEL} Running: ${command}`, { timestamp: true });
            await execAsync(command, { cwd });
        } catch (error) {
            const message = failureMessage(error);

            if (shouldThrow()) {
                throw new Error(message, { cause: error });
            }

            logger.error(message);

            return;
        }

        logger.info(`${LABEL} Lang files exported`, { timestamp: true });
        onSuccess();
    }

    /**
     * Take everything queued, leaving the queue empty.
     *
     * @returns The requested files, whether a full export was asked for, and the requests to settle.
     */
    function takeBatch(): {
        files: string[];
        full: boolean;
        waiters: Waiter[];
    } {
        const batch = {
            files: [...pendingFiles],
            full: pendingFull,
            waiters: pendingWaiters,
        };

        pendingFull = false;
        pendingFiles = new Set();
        pendingWaiters = [];

        return batch;
    }

    /**
     * Pick the one command that covers a batch.
     *
     * @param files - The changed files in the batch.
     * @param full - Whether the batch holds a full request.
     * @returns The shell command.
     */
    function commandFor(files: string[], full: boolean): string {
        const [only, ...rest] = files;

        return sourceCommand === null ||
            full ||
            only === undefined ||
            rest.length > 0
            ? fullCommand
            : sourceCommand(only);
    }

    /**
     * Run what is queued, then whatever queues up behind it, until nothing is left.
     */
    async function drain(): Promise<void> {
        do {
            const { files, full, waiters } = takeBatch();

            try {
                await execute(commandFor(files, full));

                for (const waiter of waiters) {
                    waiter.resolve();
                }
            } catch (error) {
                for (const waiter of waiters) {
                    waiter.reject(error);
                }
            }
        } while (pendingWaiters.length > 0);

        running = false;
    }

    /**
     * Queue a request and start draining unless a run is in flight.
     *
     * @param file - The changed file, or `null` for a full export.
     * @returns A promise that settles with the run covering this request.
     */
    function request(file: string | null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (file === null) {
                pendingFull = true;
            } else {
                pendingFiles.add(file);
            }

            pendingWaiters.push({ resolve, reject });

            if (!running) {
                running = true;
                void drain();
            }
        });
    }

    return {
        full: () => request(null),
        source: (file) => request(file),
    };
}
