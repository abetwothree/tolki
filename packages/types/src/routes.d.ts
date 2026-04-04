/**
 * Metadata for a single route argument.
 *
 * - `_routeKey` indicates model binding (extract `value[_routeKey]` from objects).
 * - `_enumValues` indicates enum binding (restrict to backing values).
 * - Plain scalar args have only `name` and `required`.
 */
export type RouteArgMeta = {
    readonly name: string;
    readonly required?: boolean;
    readonly _routeKey?: string;
    readonly _enumValues?: readonly (string | number)[];
    readonly where?: string;
};

/**
 * Resolve the TypeScript input type for a single route arg from its metadata.
 *
 * - Model-bound (`_routeKey`): accepts scalar or object with the route key field.
 * - Enum-bound (`_enumValues`): accepts a backing value or object with `.value`.
 * - Plain scalar: accepts `string | number`.
 */
export type ResolveArgInputType<TArg extends RouteArgMeta> = TArg extends {
    readonly _routeKey: infer TKey extends string;
}
    ?
          | string
          | number
          | ({ readonly [K in TKey]: string | number } & Record<
                string,
                unknown
            >)
          | ({ readonly id: string | number } & Record<string, unknown>)
    : TArg extends {
            readonly _enumValues: infer TValues extends readonly (
                | string
                | number
            )[];
        }
      ? TValues[number] | { readonly value: TValues[number] }
      : string | number;

/**
 * Required args from the tuple — properties that must be provided.
 */
type RequiredArgsObject<TArgs extends readonly RouteArgMeta[]> = {
    [TArg in TArgs[number] as TArg extends { readonly required: false }
        ? never
        : TArg["name"]]: ResolveArgInputType<TArg>;
};

/**
 * Optional args from the tuple — properties that can be omitted.
 */
type OptionalArgsObject<TArgs extends readonly RouteArgMeta[]> = {
    [TArg in TArgs[number] as TArg extends { readonly required: false }
        ? TArg["name"]
        : never]?: ResolveArgInputType<TArg> | null;
};

/**
 * Build the named args object from a const-tuple of arg metas.
 * Required args must be provided; optional args (required: false) can be omitted.
 */
export type ArgsObject<TArgs extends readonly RouteArgMeta[]> =
    RequiredArgsObject<TArgs> & OptionalArgsObject<TArgs>;

/**
 * Positional tuple — each index maps to the resolved type of the arg at that position.
 */
export type PositionalTuple<TArgs extends readonly RouteArgMeta[]> = {
    [I in keyof TArgs]: TArgs[I] extends RouteArgMeta
        ? ResolveArgInputType<TArgs[I]>
        : TArgs[I];
};

/**
 * All valid ways to pass args to a route — named object or positional array.
 */
export type RouteInput<TArgs extends readonly RouteArgMeta[]> =
    | ArgsObject<TArgs>
    | PositionalTuple<TArgs>;

/**
 * Options for query string and other route call extras.
 */
export type RouteQueryOptions = {
    readonly _query?: Record<string, unknown>;
    readonly [key: string]: unknown;
};

/**
 * The result of calling a route — contains url, method, and toString().
 */
export type RouteCallResult<TMethod extends string = string> = {
    readonly url: string;
    readonly method: TMethod;
    toString(): string;
};

/**
 * Route metadata shape as passed to `defineRoute`.
 */
export type RouteMetadata<
    TMethods extends readonly string[] = readonly string[],
    TArgs extends readonly RouteArgMeta[] = readonly RouteArgMeta[],
> = {
    readonly name?: string | null;
    readonly url: string;
    readonly domain?: string | null;
    readonly methods: TMethods;
    readonly args?: TArgs;
};

/**
 * Helper type: extract names of all args from a tuple that have `required: false`.
 */
type OptionalArgNames<TArgs extends readonly RouteArgMeta[]> = {
    [I in keyof TArgs]: TArgs[I] extends { readonly required: false }
        ? TArgs[I] extends { readonly name: infer N extends string }
            ? N
            : never
        : never;
}[number];

/**
 * Helper type: check if all args in a tuple are optional.
 */
type AllArgsOptional<TArgs extends readonly RouteArgMeta[]> = {
    [I in keyof TArgs]: TArgs[I] extends { readonly required: false }
        ? true
        : false;
}[number] extends true
    ? true
    : false;

/**
 * Callable signatures for routes with args.
 */
type RouteCallableWithArgs<
    TMethod extends string,
    TArgs extends readonly RouteArgMeta[],
> =
    AllArgsOptional<TArgs> extends true
        ? {
              (
                  args?: ArgsObject<TArgs> & Record<string, unknown>,
                  options?: RouteQueryOptions,
              ): RouteCallResult<TMethod>;
              (
                  args: (string | number | Record<string, unknown>)[],
                  options?: RouteQueryOptions,
              ): RouteCallResult<TMethod>;
              (
                  ...args: [...PositionalTuple<TArgs>, RouteQueryOptions]
              ): RouteCallResult<TMethod>;
              (...args: PositionalTuple<TArgs>): RouteCallResult<TMethod>;
          }
        : {
              (
                  args: ArgsObject<TArgs> & Record<string, unknown>,
                  options?: RouteQueryOptions,
              ): RouteCallResult<TMethod>;
              (
                  args: (string | number | Record<string, unknown>)[],
                  options?: RouteQueryOptions,
              ): RouteCallResult<TMethod>;
              (
                  ...args: [...PositionalTuple<TArgs>, RouteQueryOptions]
              ): RouteCallResult<TMethod>;
              (...args: PositionalTuple<TArgs>): RouteCallResult<TMethod>;
          };

/**
 * Callable signatures for routes without args.
 */
type RouteCallableNoArgs<TMethod extends string> = {
    (options?: RouteQueryOptions): RouteCallResult<TMethod>;
};

/**
 * URL method signatures for routes with args.
 */
type RouteUrlWithArgs<TArgs extends readonly RouteArgMeta[]> =
    AllArgsOptional<TArgs> extends true
        ? {
              (
                  args?: ArgsObject<TArgs> & Record<string, unknown>,
                  options?: RouteQueryOptions,
              ): string;
              (
                  args: (string | number | Record<string, unknown>)[],
                  options?: RouteQueryOptions,
              ): string;
              (...args: [...PositionalTuple<TArgs>, RouteQueryOptions]): string;
              (...args: PositionalTuple<TArgs>): string;
          }
        : {
              (
                  args: ArgsObject<TArgs> & Record<string, unknown>,
                  options?: RouteQueryOptions,
              ): string;
              (
                  args: (string | number | Record<string, unknown>)[],
                  options?: RouteQueryOptions,
              ): string;
              (...args: [...PositionalTuple<TArgs>, RouteQueryOptions]): string;
              (...args: PositionalTuple<TArgs>): string;
          };

/**
 * URL method signatures for routes without args.
 */
type RouteUrlNoArgs = {
    (options?: RouteQueryOptions): string;
};

/**
 * Per-verb method types for routes with args.
 */
type VerbMethodsWithArgs<
    TMethods extends readonly string[],
    TArgs extends readonly RouteArgMeta[],
> = {
    [K in TMethods[number]]: RouteCallableWithArgs<K, TArgs>;
};

/**
 * Per-verb method types for routes without args.
 */
type VerbMethodsNoArgs<TMethods extends readonly string[]> = {
    [K in TMethods[number]]: RouteCallableNoArgs<K>;
};

/**
 * The full return type of `defineRoute` for routes with args.
 */
export type DefineRouteResultWithArgs<
    TMethods extends readonly string[],
    TArgs extends readonly RouteArgMeta[],
> = RouteCallableWithArgs<TMethods[0], TArgs> & {
    url: RouteUrlWithArgs<TArgs>;
    definition: RouteMetadata<TMethods, TArgs>;
    toString(): string;
} & VerbMethodsWithArgs<TMethods, TArgs>;

/**
 * The full return type of `defineRoute` for routes without args.
 */
export type DefineRouteResultNoArgs<TMethods extends readonly string[]> =
    RouteCallableNoArgs<TMethods[0]> & {
        url: RouteUrlNoArgs;
        definition: RouteMetadata<TMethods>;
        toString(): string;
    } & VerbMethodsNoArgs<TMethods>;

/**
 * The full return type of `defineRoute`.
 * Discriminates on whether `args` is present in metadata.
 */
export type DefineRouteResult<
    TMethods extends readonly string[] = readonly string[],
    TArgs extends readonly RouteArgMeta[] = readonly RouteArgMeta[],
> = [TArgs] extends [readonly []] | [readonly never[]]
    ? DefineRouteResultNoArgs<TMethods>
    : DefineRouteResultWithArgs<TMethods, TArgs>;
