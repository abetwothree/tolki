export const VIRTUAL_MODULE_ID = "virtual:tolki-lang";

export const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

const SAFE_LOCALE = /^[\w-]+$/;

/**
 * Check that a locale is a plain name that cannot walk out of the output directory.
 *
 * @param locale - The manifest locale.
 * @returns Whether it holds only letters, digits, `_` and `-`.
 */
function isSafeLocale(locale: string): boolean {
    return SAFE_LOCALE.test(locale);
}

/**
 * Generate the check that refuses a locale the table does not hold.
 *
 * @param table - The name of the generated `Map`.
 * @param locales - The locales the module exports.
 * @returns The statements to place at the top of `load`.
 */
function missingLocaleGuard(table: string, locales: readonly string[]): string {
    const exported =
        locales.length === 0
            ? "No locales were exported."
            : `Exported: ${locales.join(", ")}.`;

    return [
        `    if (!${table}.has(locale)) {`,
        `        throw new Error(\`[@tolki/lang] No exported lines for locale "\${locale}". \` + ${JSON.stringify(exported)});`,
        "    }",
    ].join("\n");
}

/**
 * Generate the source of `virtual:tolki-lang`.
 *
 * @param locales - The manifest's locales; unsafe ones are left out.
 * @param outputDir - The absolute, normalized export directory.
 * @param ssr - Whether to import every locale eagerly.
 * @returns The module source.
 */
export function virtualModuleCode(
    locales: readonly string[],
    outputDir: string,
    ssr: boolean,
): string {
    const safe = locales.filter(isSafeLocale);
    const files = safe.map((locale) =>
        JSON.stringify(`${outputDir}/${locale}.json`),
    );
    const names = safe.map((locale) => JSON.stringify(locale));
    const header = `export const locales = [${names.join(", ")}];`;

    if (ssr) {
        const imports = files.map((file, i) => `import l${i} from ${file};`);
        const entries = names.map((name, i) => `[${name}, l${i}]`);

        return [
            ...imports,
            header,
            `const lines = new Map([${entries.join(", ")}]);`,
            "export function load(locale) {",
            missingLocaleGuard("lines", safe),
            "    return lines.get(locale);",
            "}",
            "",
        ].join("\n");
    }

    const loaders = names.map(
        (name, i) => `[${name}, () => import(${files[i]})]`,
    );

    return [
        header,
        `const loaders = new Map([${loaders.join(", ")}]);`,
        "export async function load(locale) {",
        missingLocaleGuard("loaders", safe),
        "    const module = await loaders.get(locale)();",
        "    return module.default;",
        "}",
        "",
    ].join("\n");
}
