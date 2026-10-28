import { escapeShellArg } from "@tolki/utils";

export interface ExportFlags {
    /** The directory the exporter writes to, relative to the Laravel base path. */
    readonly output?: string;
    /** The locales to export; empty means every locale. */
    readonly locales?: readonly string[];
    /** Group patterns to export; everything else is left out. */
    readonly only?: readonly string[];
    /** Group patterns to leave out. */
    readonly except?: readonly string[];
}

/**
 * Append the exporter flags to a command, `--quiet` last and only once.
 *
 * @param command - The command to extend.
 * @param base - The part of the command that may already hold `--quiet`.
 * @param flags - The flags that shape the export.
 * @param quiet - Whether to silence the exporter's console output.
 * @returns The command with its flags.
 */
function withFlags(
    command: string,
    base: string,
    flags: ExportFlags,
    quiet: boolean,
): string {
    let result = command;

    if (flags.output !== undefined) {
        result += ` --output=${escapeShellArg(flags.output)}`;
    }

    for (const locale of flags.locales ?? []) {
        result += ` --locale=${escapeShellArg(locale)}`;
    }

    for (const pattern of flags.only ?? []) {
        result += ` --only=${escapeShellArg(pattern)}`;
    }

    for (const pattern of flags.except ?? []) {
        result += ` --except=${escapeShellArg(pattern)}`;
    }

    if (quiet && !base.includes("--quiet")) {
        result += " --quiet";
    }

    return result;
}

/**
 * Build the command for a full export.
 *
 * @param base - The configured export command.
 * @param flags - The flags that shape the export.
 * @param quiet - Whether to silence the exporter's console output.
 * @returns The shell command to run.
 */
export function exportCommand(
    base: string,
    flags: ExportFlags,
    quiet: boolean,
): string {
    return withFlags(base, base, flags, quiet);
}

/**
 * Build the command that patches the export for one changed lang file.
 *
 * @param template - The command template holding the `{file}` placeholder.
 * @param file - The changed file, as the manifest lists it.
 * @param flags - The same flags the full export uses.
 * @param quiet - Whether to silence the exporter's console output.
 * @returns The shell command to run.
 */
export function sourceExportCommand(
    template: string,
    file: string,
    flags: ExportFlags,
    quiet: boolean,
): string {
    // A function replacer keeps `$&` and friends in the path literal; the template decides --quiet.
    return withFlags(
        template.replaceAll("{file}", () => escapeShellArg(file)),
        template,
        flags,
        quiet,
    );
}
