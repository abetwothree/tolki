/**
 * Dynamically require a module in a way that works in both Node.js and bundled environments.
 * The module name is passed as a variable to prevent static analysis by bundlers.
 *
 * @param moduleName - The name of the module to require
 * @param errorMessage - Custom error message if module is not found
 * @returns The required module
 * @throws Error with helpful message if the module is not installed
 *
 * @example
 * // Load an optional dependency at runtime
 * const pluralize = optionalRequire<typeof import('pluralize')>(
 *     'pluralize',
 *     'The "pluralize" package is required. Please install it: npm install pluralize'
 * );
 */
export function optionalRequire<T>(
    moduleName: string,
    errorMessage?: string,
): T {
    try {
        // The module name as a variable prevents bundlers from statically analyzing this require.
        // Bundlers like Webpack won't try to bundle these modules since the path is dynamic.
        // The actual resolution happens at runtime in the consumer's environment.
        const name = moduleName;
        return require(name) as T;
    } catch {
        throw new Error(
            errorMessage ??
                `The "${moduleName}" package is required. Please install it: npm install ${moduleName}`,
        );
    }
}
