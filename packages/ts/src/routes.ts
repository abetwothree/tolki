import type {
    DefineRouteResult,
    RouteArgMeta,
    RouteCallResult,
    RouteMetadata,
    RouteQueryOptions,
} from "@tolki/types";
import {
    isArray,
    isBoolean,
    isNull,
    isNumber,
    isObject,
    isString,
    isUndefined,
} from "@tolki/utils";

export type {
    DefineRouteResult,
    RouteArgMeta,
    RouteCallResult,
    RouteMetadata,
    RouteQueryOptions,
};

/**
 * Module-level defaults store for global route parameter substitution.
 * Set via `setRouteDefaults()` — values are substituted into URL segments
 * before any caller-provided arguments.
 */
let routeDefaults: Record<string, string> = {};

/**
 * Set global default route parameter values.
 *
 * These values are substituted into URL segments automatically when
 * the caller doesn't provide them. Mirrors Laravel's `URL::defaults()`.
 *
 * @param defaults - A record of parameter names to default values.
 */
export function setRouteDefaults(defaults: Record<string, string>): void {
    routeDefaults = { ...defaults };
}

/**
 * Get the current route defaults (useful for testing).
 *
 * @returns The current route defaults record.
 */
export function getRouteDefaults(): Record<string, string> {
    return { ...routeDefaults };
}

/**
 * Reset route defaults to an empty object (useful for testing).
 */
export function resetRouteDefaults(): void {
    routeDefaults = {};
}

/**
 * Resolve a single parameter value by handling model binding (_routeKey),
 * enum binding (_enumValues), and plain scalars.
 *
 * @param value - The raw parameter value from the caller.
 * @param argMeta - The metadata for this argument.
 * @returns The resolved scalar value for URL substitution.
 */
function resolveParamValue(
    value: unknown,
    argMeta: RouteArgMeta | undefined,
): string {
    if (isUndefined(value) || isNull(value)) {
        return "";
    }

    if (isObject(value)) {
        if (argMeta?._routeKey) {
            const key = argMeta._routeKey;
            if (key in value) {
                return String(value[key]);
            }
            if ("id" in value) {
                return String(value["id"]);
            }
            throw new Error(
                `Route error: object passed as '${argMeta.name}' parameter is missing route model binding key '${key}'.`,
            );
        }

        if (argMeta?._enumValues) {
            if ("value" in value) {
                return String(value["value"]);
            }
            throw new Error(
                `Route error: object passed as '${argMeta.name}' parameter is missing enum '.value' property.`,
            );
        }

        if ("id" in value) {
            return String(value["id"]);
        }

        return String(value);
    }

    return String(value);
}

/**
 * Encode a query string value following Laravel conventions.
 *
 * - Booleans → `0`/`1`
 * - Arrays → indexed format `key[0]=a&key[1]=b`
 * - Null/undefined → skipped
 *
 * @param key - The query parameter key.
 * @param value - The query parameter value.
 * @returns An array of `key=value` pair strings.
 */
function encodeQueryPairs(key: string, value: unknown): string[] {
    if (isNull(value) || isUndefined(value)) {
        return [];
    }

    if (isBoolean(value)) {
        return [`${encodeURIComponent(key)}=${value ? "1" : "0"}`];
    }

    if (isArray(value)) {
        const pairs: string[] = [];
        for (let i = 0; i < value.length; i++) {
            pairs.push(
                ...encodeQueryPairs(`${key}[${i}]`, value[i] as unknown),
            );
        }
        return pairs;
    }

    if (isObject(value)) {
        const pairs: string[] = [];
        for (const [subKey, subValue] of Object.entries(value)) {
            pairs.push(
                ...encodeQueryPairs(`${key}[${subKey}]`, subValue as unknown),
            );
        }
        return pairs;
    }

    return [`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`];
}

/**
 * Build a query string from an object of parameters following Laravel conventions.
 *
 * @param params - The query parameters object.
 * @returns The query string with leading `?`, or empty string if no params.
 */
function buildQueryString(params: Record<string, unknown>): string {
    const pairs: string[] = [];
    for (const [key, value] of Object.entries(params)) {
        pairs.push(...encodeQueryPairs(key, value));
    }
    if (pairs.length === 0) {
        return "";
    }
    return `?${pairs.join("&")}`;
}

/**
 * Normalize raw arguments into a named parameters object and optional query options.
 *
 * Handles all 6 calling conventions:
 * 1. Spread scalars: `fn(42)` or `fn(2, 42)`
 * 2. Array form: `fn([42])` or `fn([2, 42])`
 * 3. Positional → named: map index i to args[i].name
 * 4. Named object: first arg is plain object with declared arg names
 * 5. Naked model shortcut: first arg has _routeKey field or id but not param name
 * 6. Trailing options: last arg is RouteQueryOptions → query string
 *
 * @param rawArgs - The raw arguments passed to the route callable.
 * @param argsMeta - The route argument metadata tuple.
 * @returns A tuple of [namedParams, queryOptions].
 */
function normalizeArgs(
    rawArgs: unknown[],
    argsMeta: readonly RouteArgMeta[],
): [Record<string, unknown>, RouteQueryOptions | undefined] {
    if (rawArgs.length === 0) {
        return [{}, undefined];
    }

    const segments = argsMeta;
    let options: RouteQueryOptions | undefined;

    if (segments.length === 0) {
        if (rawArgs.length === 1 && isObject(rawArgs[0])) {
            return [{}, rawArgs[0] as RouteQueryOptions];
        }
        return [{}, undefined];
    }

    const segmentNames = new Set(segments.map((s) => s.name));

    // Extract trailing options before other parsing
    if (rawArgs.length >= 2) {
        const lastArg = rawArgs[rawArgs.length - 1];
        const hasTrailingOptions =
            isObject(lastArg) &&
            !Object.keys(lastArg as Record<string, unknown>).some((k) =>
                segmentNames.has(k),
            ) &&
            rawArgs.length > segments.length;

        if (hasTrailingOptions) {
            options = lastArg as RouteQueryOptions;
            rawArgs = rawArgs.slice(0, -1);
        }
    }

    // Array form: fn([42]) or fn([2, 42]) or fn([42], { page: 2 })
    if (rawArgs.length === 1 && isArray(rawArgs[0])) {
        const arr = rawArgs[0] as unknown[];
        const named: Record<string, unknown> = {};
        for (let i = 0; i < arr.length && i < segments.length; i++) {
            named[segments[i]!.name] = arr[i];
        }
        return [named, options];
    }

    // Single plain object: named object, naked model, or query options
    if (rawArgs.length === 1 && isObject(rawArgs[0])) {
        const obj = rawArgs[0] as Record<string, unknown>;
        const hasSegmentKey = Object.keys(obj).some((k) => segmentNames.has(k));

        if (hasSegmentKey) {
            const named: Record<string, unknown> = {};
            const queryExtra: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(obj)) {
                if (segmentNames.has(key)) {
                    named[key] = val;
                } else if (key === "_query") {
                    options = {
                        ...options,
                        _query: val as Record<string, unknown>,
                    };
                } else {
                    queryExtra[key] = val;
                }
            }
            if (Object.keys(queryExtra).length > 0) {
                options = { ...options, ...queryExtra };
            }
            return [
                named,
                Object.keys(options ?? {}).length > 0 ? options : undefined,
            ];
        }

        if (segments.length === 1) {
            const segment = segments[0]!;
            const paramName = segment.name;
            const binding = segment._routeKey;
            if (
                (binding && binding in obj) ||
                "id" in obj ||
                "_routeKey" in obj
            ) {
                return [{ [paramName]: obj }, options];
            }
        }

        return [{}, { ...options, ...(obj as RouteQueryOptions) }];
    }

    // Spread/positional: fn(42) or fn(2, 42) or fn({ id: 2 }, { id: 42 })
    if (
        rawArgs.length >= 1 &&
        rawArgs.every((arg) => isString(arg) || isNumber(arg) || isObject(arg))
    ) {
        const named: Record<string, unknown> = {};
        for (let i = 0; i < rawArgs.length && i < segments.length; i++) {
            named[segments[i]!.name] = rawArgs[i];
        }
        return [named, options];
    }

    return [{}, options];
}

/**
 * Build the full URL from a route template, named parameters, defaults, and query options.
 *
 * @param urlTemplate - The URL template with `{param}` and `{param?}` placeholders.
 * @param namedParams - The resolved named parameters.
 * @param argsMeta - Route argument metadata for resolving bindings.
 * @param queryOptions - Optional query string parameters.
 * @returns The compiled URL string.
 */
function buildUrl(
    urlTemplate: string,
    namedParams: Record<string, unknown>,
    argsMeta: readonly RouteArgMeta[],
    queryOptions?: RouteQueryOptions,
): string {
    let template = urlTemplate;
    if (
        !template.startsWith("/") &&
        !template.startsWith("//") &&
        !template.includes("://")
    ) {
        template = `//${template}`;
    }

    const argsMap = new Map(argsMeta.map((a) => [a.name, a]));

    const mergedParams: Record<string, unknown> = {};
    for (const seg of argsMeta) {
        if (seg.name in routeDefaults && !(seg.name in namedParams)) {
            mergedParams[seg.name] = routeDefaults[seg.name];
        }
    }
    for (const [key, val] of Object.entries(namedParams)) {
        mergedParams[key] = val;
    }

    for (const arg of argsMeta) {
        if (arg.where && arg.name in mergedParams) {
            const resolved = resolveParamValue(mergedParams[arg.name], arg);
            if (resolved !== "") {
                let pattern: RegExp;
                try {
                    pattern = new RegExp(`^${arg.where}$`);
                } catch {
                    throw new Error(
                        `Route error: '${arg.name}' has invalid 'where' constraint pattern '${arg.where}'.`,
                    );
                }
                if (!pattern.test(resolved)) {
                    throw new Error(
                        `Route error: '${arg.name}' parameter '${resolved}' does not match required format '${arg.where}'.`,
                    );
                }
            }
        }
    }

    let url = template.replace(
        /{([^}?]+)(\??)}/g,
        (_, segment: string, optional: string) => {
            const value = mergedParams[segment];
            const argMeta = argsMap.get(segment);

            if (!optional && (isUndefined(value) || isNull(value))) {
                throw new Error(
                    `Route error: '${segment}' parameter is required.`,
                );
            }

            const resolved = resolveParamValue(value, argMeta);
            return encodeURI(resolved)
                .replace(/%7C/g, "|")
                .replace(/%25/g, "%")
                .replace(/\$/g, "%24");
        },
    );

    url = url.replace(/([^:])\/{2,}/g, "$1/").replace(/\/+$/, "") || "/";

    const extraParams: Record<string, unknown> = {};

    if (queryOptions) {
        for (const [key, val] of Object.entries(queryOptions)) {
            if (key === "_query" && isObject(val)) {
                for (const [qk, qv] of Object.entries(
                    val as Record<string, unknown>,
                )) {
                    extraParams[qk] = qv;
                }
            } else if (key !== "_query") {
                extraParams[key] = val;
            }
        }
    }

    const queryString = buildQueryString(extraParams);
    return url + queryString;
}

/**
 * Create a RouteCallResult with a toString() that returns the URL.
 *
 * @param url - The compiled URL string.
 * @param method - The HTTP method string.
 * @returns A RouteCallResult object.
 */
function makeCallResult<TMethod extends string>(
    url: string,
    method: TMethod,
): RouteCallResult<TMethod> {
    return {
        url,
        method,
        toString() {
            return url;
        },
    };
}

/**
 * Define a Laravel route in TypeScript using compact metadata.
 *
 * Returns a callable object with:
 * - Direct invocation returning `{ url, method }` with `toString()`
 * - `.url(...)` returning just the URL string
 * - `.definition` — the raw metadata passthrough
 * - Per-verb methods (`.get(...)`, `.post(...)`, etc.)
 * - `toString()` returning the URL with no params
 *
 * Supports 6 calling conventions:
 * 1. Named object: `fn({ post: 42 })`
 * 2. Spread scalars: `fn(42)` or `fn(2, 42)`
 * 3. Array form: `fn([42])` or `fn([2, 42])`
 * 4. Positional → named mapping
 * 5. Naked model shortcut: `fn({ id: 42 })`
 * 6. Trailing query options: `fn(42, { _query: { page: 2 } })`
 *
 * @param metadata - The route metadata object with url, methods, and optional args.
 * @returns A defineRoute result — callable with per-verb methods, .url(), and .definition.
 */
export function defineRoute<
    const TMethods extends readonly string[],
    const TArgs extends readonly RouteArgMeta[] = readonly [],
>(
    metadata: RouteMetadata<TMethods, TArgs>,
): DefineRouteResult<TMethods, TArgs> {
    const argsMeta: readonly RouteArgMeta[] = metadata.args ?? [];
    const primaryMethod = metadata.methods[0] ?? "get";

    const invoke = (...rawArgs: unknown[]): RouteCallResult => {
        const [named, options] = normalizeArgs(rawArgs, argsMeta);
        const url = buildUrl(metadata.url, named, argsMeta, options);
        return makeCallResult(url, primaryMethod);
    };

    const urlFn = (...rawArgs: unknown[]): string => {
        const [named, options] = normalizeArgs(rawArgs, argsMeta);
        return buildUrl(metadata.url, named, argsMeta, options);
    };

    const result = Object.assign(invoke, {
        url: urlFn,
        definition: metadata,
        toString() {
            return buildUrl(metadata.url, {}, argsMeta);
        },
    });

    for (const method of metadata.methods) {
        Object.assign(result, {
            [method]: (...rawArgs: unknown[]): RouteCallResult => {
                const [named, options] = normalizeArgs(rawArgs, argsMeta);
                const url = buildUrl(metadata.url, named, argsMeta, options);
                return makeCallResult(url, method);
            },
        });
    }

    return result as DefineRouteResult<TMethods, TArgs>;
}
