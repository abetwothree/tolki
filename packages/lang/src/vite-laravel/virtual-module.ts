import { assertLocale } from "../locale-guard";

export const VIRTUAL_MODULE_ID = "virtual:tolki-lang";

export const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

/**
 * Check that a locale cannot walk out of the output directory.
 *
 * @param locale - The manifest locale.
 * @returns Whether it holds no `/`, `\`, `..` or NUL.
 */
function isSafeLocale(locale: string): boolean {
    try {
        assertLocale(locale);

        return true;
    } catch {
        return false;
    }
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
    const failure = [
        "    if (!Object.hasOwn(%TABLE%, locale)) {",
        `        throw new Error(\`[@tolki/lang] No exported lines for locale "\${locale}". Exported: \` + ${JSON.stringify(`${safe.join(", ")}.`)});`,
        "    }",
    ].join("\n");
    const header = `export const locales = [${names.join(", ")}];`;

    if (ssr) {
        const imports = files.map((file, i) => `import l${i} from ${file};`);
        const entries = names.map((name, i) => `${name}: l${i}`);

        return [
            ...imports,
            header,
            `const lines = { ${entries.join(", ")} };`,
            "export function load(locale) {",
            failure.replace("%TABLE%", "lines"),
            "    return lines[locale];",
            "}",
            "",
        ].join("\n");
    }

    const loaders = names.map(
        (name, i) => `${name}: () => import(${files[i]})`,
    );

    return [
        header,
        `const loaders = { ${loaders.join(", ")} };`,
        "export async function load(locale) {",
        failure.replace("%TABLE%", "loaders"),
        "    const module = await loaders[locale]();",
        "    return module.default;",
        "}",
        "",
    ].join("\n");
}
