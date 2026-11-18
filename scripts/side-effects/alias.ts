import ts from "typescript";

/**
 * Peels `as`, `satisfies` and parenthesis wrappers off an expression.
 *
 * @param expression - The expression to unwrap.
 * @returns The expression inside every wrapper.
 */
export function unwrapAliasTarget(expression: ts.Expression): ts.Expression {
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
 * Names the top-level function declarations of a file that have a body.
 *
 * @param sourceFile - The parsed file.
 * @returns The names an alias export may point at.
 */
export function localFunctionNames(sourceFile: ts.SourceFile): Set<string> {
    return new Set(
        sourceFile.statements
            .filter(ts.isFunctionDeclaration)
            .filter((statement) => statement.body !== undefined)
            .flatMap((statement) =>
                statement.name ? [statement.name.text] : [],
            ),
    );
}

/**
 * Reads an alias export the data build ships as its declaration: `export const X = Y as …;`, where `Y` is a local
 * function. The side-effect scan classifies an alias through `Y` only in this shape, so the two never disagree.
 *
 * @param statement - A top-level statement.
 * @param functions - The file's `localFunctionNames`.
 * @returns The exported name and the function it aliases, or null for any other statement.
 */
export function aliasExportOf(
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

    const target = unwrapAliasTarget(declaration!.initializer);

    return ts.isIdentifier(target) && functions.has(target.text)
        ? { name: declaration!.name.text, target: target.text }
        : null;
}
