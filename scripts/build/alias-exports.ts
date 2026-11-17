import ts from "typescript";
import type { Plugin } from "vite";

/**
 * Peels `as`, `satisfies` and parenthesis wrappers off an initializer, as the side-effect scan does.
 *
 * @param expression - The initializer to unwrap.
 * @returns The expression inside every wrapper.
 */
function unwrap(expression: ts.Expression): ts.Expression {
    let current = expression;

    while (
        ts.isAsExpression(current) ||
        ts.isParenthesizedExpression(current) ||
        ts.isSatisfiesExpression(current)
    ) {
        current = current.expression;
    }

    return current;
}

/**
 * Names the function an `export const X = Y as …` statement aliases, when `Y` is a declared function.
 *
 * @param statement - A top-level statement.
 * @param functions - The names of the file's top-level function declarations that have a body.
 * @returns The exported name and the function it aliases, or null when the statement is anything else.
 */
function aliasOf(
    statement: ts.Statement,
    functions: ReadonlySet<string>,
): { name: string; target: string } | null {
    if (
        !ts.isVariableStatement(statement) ||
        !(statement.declarationList.flags & ts.NodeFlags.Const) ||
        statement.declarationList.declarations.length !== 1
    ) {
        return null;
    }

    const modifiers = ts.getModifiers(statement) ?? [];
    const [declaration] = statement.declarationList.declarations;

    if (
        modifiers.length !== 1 ||
        modifiers[0]!.kind !== ts.SyntaxKind.ExportKeyword ||
        !ts.isIdentifier(declaration!.name) ||
        declaration!.initializer === undefined
    ) {
        return null;
    }

    const target = unwrap(declaration!.initializer);

    return ts.isIdentifier(target) && functions.has(target.text)
        ? { name: declaration!.name.text, target: target.text }
        : null;
}

/**
 * Rewrites each `export const X = Y as …;` aliasing a same-file function declaration to `export { Y as X };`.
 *
 * Bundlers read `@__NO_SIDE_EFFECTS__` off a function declaration, and webpack and Rspack lose it through a `const`
 * alias. Exporting the declaration itself keeps it, while the `.d.ts`, emitted from the source, keeps the alias's type.
 *
 * @param code - The TypeScript source of one module.
 * @returns The rewritten source, or null when no statement changed.
 */
export function rewriteAliasExports(code: string): string | null {
    if (!/\bexport\s+const\b/.test(code)) {
        return null;
    }

    const sourceFile = ts.createSourceFile(
        "module.ts",
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    const functions = new Set(
        sourceFile.statements
            .filter(ts.isFunctionDeclaration)
            .filter((statement) => statement.body !== undefined)
            .flatMap((statement) =>
                statement.name ? [statement.name.text] : [],
            ),
    );
    let rewritten = code;
    let changed = false;

    // Back to front, so each earlier statement's offsets still hold after a later one is replaced.
    for (const statement of [...sourceFile.statements].reverse()) {
        const alias = aliasOf(statement, functions);

        if (alias === null) {
            continue;
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
 * Ships each alias export of a package source as the function declaration it aliases.
 *
 * @returns A Vite plugin that runs `rewriteAliasExports` on each TypeScript module under a `src` folder, before
 *     other transforms.
 */
export function aliasExportsPlugin(): Plugin {
    return {
        name: "tolki:alias-exports",
        enforce: "pre",
        transform(code, id) {
            const file = id.split("?")[0]!.replaceAll("\\", "/");

            if (
                !file.includes("/src/") ||
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
