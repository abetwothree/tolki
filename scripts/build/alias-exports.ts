import ts from "typescript";
import type { Plugin } from "vite";

import { aliasExportOf, localFunctionNames } from "../side-effects/alias.ts";

/**
 * Tells whether an identifier names a member rather than a binding of the module.
 *
 * @param node - The identifier to place.
 * @returns True for a property, method or enum member name, or the imported name of an import specifier.
 */
function isMemberName(node: ts.Identifier): boolean {
    const parent = node.parent;

    if (ts.isPropertyAccessExpression(parent) || ts.isQualifiedName(parent)) {
        return (
            (ts.isPropertyAccessExpression(parent)
                ? parent.name
                : parent.right) === node
        );
    }

    if (ts.isImportSpecifier(parent)) {
        return parent.propertyName === node;
    }

    return (
        (ts.isPropertyAssignment(parent) ||
            ts.isPropertyDeclaration(parent) ||
            ts.isPropertySignature(parent) ||
            ts.isMethodDeclaration(parent) ||
            ts.isMethodSignature(parent) ||
            ts.isGetAccessorDeclaration(parent) ||
            ts.isSetAccessorDeclaration(parent) ||
            ts.isEnumMember(parent)) &&
        parent.name === node
    );
}

/**
 * Collects every identifier of a module that may refer to one of its bindings.
 *
 * @param sourceFile - The parsed module.
 * @returns The identifiers, grouped by name.
 */
function bindingReferences(
    sourceFile: ts.SourceFile,
): Map<string, ts.Identifier[]> {
    const references = new Map<string, ts.Identifier[]>();
    const visit = (node: ts.Node): void => {
        if (ts.isIdentifier(node) && !isMemberName(node)) {
            references.set(node.text, [
                ...(references.get(node.text) ?? []),
                node,
            ]);
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return references;
}

/**
 * Rewrites each `export const X = Y as …;` aliasing a same-file function declaration to `export { Y as X };`.
 *
 * Bundlers read `@__NO_SIDE_EFFECTS__` off a function declaration, and Rolldown, webpack and Rspack keep calls through
 * a `const` alias. Exporting the declaration itself keeps the mark, while the `.d.ts`, emitted from the source, keeps
 * the alias's type.
 *
 * @param code - The TypeScript source of one module.
 * @returns The rewritten source, or null when no statement changed.
 * @throws Error when the module uses an alias's own name, which the rewrite would leave unbound.
 */
export function rewriteAliasExports(code: string): string | null {
    const sourceFile = ts.createSourceFile(
        "module.ts",
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    const functions = localFunctionNames(sourceFile);
    let references: Map<string, ts.Identifier[]> | undefined;
    let rewritten = code;
    let changed = false;

    // Back to front, so each earlier statement's offsets still hold after a later one is replaced.
    for (const statement of [...sourceFile.statements].reverse()) {
        const alias = aliasExportOf(statement, functions);

        if (alias === null) {
            continue;
        }

        references ??= bindingReferences(sourceFile);

        // The declarator's own name is the one reference the rewrite removes on purpose.
        const [use] = (references.get(alias.name) ?? []).filter(
            (node) =>
                node.getStart(sourceFile) < statement.getStart(sourceFile) ||
                node.end > statement.end,
        );

        if (use !== undefined) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(
                use.getStart(sourceFile),
            );

            throw new Error(
                `alias-exports: \`${alias.name}\` is used on line ${line + 1}, and \`export { ${alias.target} as ${alias.name} }\` declares no local \`${alias.name}\`. Use \`${alias.target}\` there.`,
            );
        }

        const start = statement.getStart(sourceFile);
        const lineBreaks =
            code.slice(start, statement.end).split("\n").length - 1;

        // The statement's line breaks are kept, so every later line keeps the line number `map: null` promises.
        rewritten = `${rewritten.slice(0, start)}export { ${alias.target} as ${alias.name} };${"\n".repeat(lineBreaks)}${rewritten.slice(statement.end)}`;
        changed = true;
    }

    return changed ? rewritten : null;
}

/**
 * Ships each alias export of one package's sources as the function declaration it aliases.
 *
 * @param srcDir - Absolute path of the package's `src` directory; no module outside it is touched.
 * @returns A Vite plugin that runs `rewriteAliasExports` on the TypeScript modules under `srcDir`, before other
 *     transforms.
 */
export function aliasExportsPlugin(srcDir: string): Plugin {
    const root = `${srcDir.replaceAll("\\", "/").replace(/\/+$/, "")}/`;

    return {
        name: "tolki:alias-exports",
        enforce: "pre",
        transform(code, id) {
            const file = id.split("?")[0]!.replaceAll("\\", "/");

            if (
                !file.startsWith(root) ||
                file.includes("/node_modules/") ||
                !file.endsWith(".ts") ||
                file.endsWith(".d.ts")
            ) {
                return null;
            }

            const rewritten = rewriteAliasExports(code);

            return rewritten === null ? null : { code: rewritten, map: null };
        },
    };
}
