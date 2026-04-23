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
 * Recursively builds a positional tuple, making args with `required: false`
 * into optional tuple elements (`[req, opt?]`) via variadic tuple spread.
 */
type BuildPositionalTuple<
    TArgs extends readonly RouteArgMeta[],
    TAcc extends readonly unknown[] = [],
> = TArgs extends readonly []
    ? TAcc
    : TArgs extends readonly [
            infer TFirst extends RouteArgMeta,
            ...infer TRest extends readonly RouteArgMeta[],
        ]
      ? TFirst extends { readonly required: false }
          ? BuildPositionalTuple<TRest, [...TAcc, ResolveArgInputType<TFirst>?]>
          : BuildPositionalTuple<TRest, [...TAcc, ResolveArgInputType<TFirst>]>
      : TAcc;

/**
 * Positional tuple — each index maps to the resolved type of the arg at that position.
 * Args with `required: false` become optional tuple elements.
 */
export type PositionalTuple<TArgs extends readonly RouteArgMeta[]> =
    BuildPositionalTuple<TArgs>;

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
    readonly mergeQuery?: Record<string, unknown>;
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
 * Valid component types for route metadata.
 * - `string` for single-component routes (e.g. `'Dashboard'`).
 * - `Readonly<Record<string, string>>` for multi-component routes
 *   (e.g. `{ authenticated: 'Auth/Dashboard', guest: 'Guest/Welcome' } as const`).
 */
export type RouteComponentType = string | Readonly<Record<string, string>>;

/**
 * Route metadata shape as passed to `defineRoute`.
 */
export type RouteMetadata<
    TMethods extends readonly string[] = readonly string[],
    TArgs extends readonly RouteArgMeta[] = readonly RouteArgMeta[],
    TComponent extends RouteComponentType | undefined = undefined,
> = {
    readonly name?: string | null;
    readonly url: string;
    readonly domain?: string | null;
    readonly methods: TMethods;
    readonly args?: TArgs;
    readonly component?: TComponent;
};

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
    TComponent extends RouteComponentType | undefined = undefined,
> = RouteCallableWithArgs<TMethods[0], TArgs> & {
    url: RouteUrlWithArgs<TArgs>;
    definition: RouteMetadata<TMethods, TArgs, TComponent>;
    form: FormWithArgs<TMethods, TArgs>;
    toString(): string;
} & VerbMethodsWithArgs<TMethods, TArgs> &
    ComponentMixin<TComponent, TMethods, TArgs>;

/**
 * The full return type of `defineRoute` for routes without args.
 */
export type DefineRouteResultNoArgs<
    TMethods extends readonly string[],
    TComponent extends RouteComponentType | undefined = undefined,
> = RouteCallableNoArgs<TMethods[0]> & {
    url: RouteUrlNoArgs;
    definition: RouteMetadata<TMethods, readonly [], TComponent>;
    form: FormNoArgs<TMethods>;
    toString(): string;
} & VerbMethodsNoArgs<TMethods> &
    ComponentMixin<TComponent, TMethods, readonly []>;

/**
 * The full return type of `defineRoute`.
 * Discriminates on whether `args` is present in metadata.
 */
export type DefineRouteResult<
    TMethods extends readonly string[] = readonly string[],
    TArgs extends readonly RouteArgMeta[] = readonly RouteArgMeta[],
    TComponent extends RouteComponentType | undefined = undefined,
> = [TArgs] extends [readonly []] | [readonly never[]]
    ? DefineRouteResultNoArgs<TMethods, TComponent>
    : DefineRouteResultWithArgs<TMethods, TArgs, TComponent>;

/**
 * The result of calling `.form()` — contains action (URL), method, and toString().
 */
export type RouteFormResult<TMethod extends string = string> = {
    readonly action: string;
    readonly method: TMethod extends "get" | "head" ? "get" : "post";
    toString(): string;
};

/**
 * The result of calling `.withComponent()` — route call result enriched with a component.
 */
export type RouteCallResultWithComponent<
    TComponent extends string = string,
    TMethod extends string = string,
> = RouteCallResult<TMethod> & {
    readonly component: TComponent;
};

/**
 * WithComponent callable for single-component routes without args.
 */
type WithComponentSingleNoArgs<
    TComponent extends string,
    TMethod extends string,
> = {
    (
        options?: RouteQueryOptions,
    ): RouteCallResultWithComponent<TComponent, TMethod>;
};

/**
 * WithComponent callable for single-component routes with args.
 */
type WithComponentSingleWithArgs<
    TComponent extends string,
    TMethod extends string,
    TArgs extends readonly RouteArgMeta[],
> =
    AllArgsOptional<TArgs> extends true
        ? {
              (
                  args?: ArgsObject<TArgs> & Record<string, unknown>,
                  options?: RouteQueryOptions,
              ): RouteCallResultWithComponent<TComponent, TMethod>;
              (
                  args: (string | number | Record<string, unknown>)[],
                  options?: RouteQueryOptions,
              ): RouteCallResultWithComponent<TComponent, TMethod>;
              (
                  ...args: [...PositionalTuple<TArgs>, RouteQueryOptions]
              ): RouteCallResultWithComponent<TComponent, TMethod>;
              (
                  ...args: PositionalTuple<TArgs>
              ): RouteCallResultWithComponent<TComponent, TMethod>;
          }
        : {
              (
                  args: ArgsObject<TArgs> & Record<string, unknown>,
                  options?: RouteQueryOptions,
              ): RouteCallResultWithComponent<TComponent, TMethod>;
              (
                  args: (string | number | Record<string, unknown>)[],
                  options?: RouteQueryOptions,
              ): RouteCallResultWithComponent<TComponent, TMethod>;
              (
                  ...args: [...PositionalTuple<TArgs>, RouteQueryOptions]
              ): RouteCallResultWithComponent<TComponent, TMethod>;
              (
                  ...args: PositionalTuple<TArgs>
              ): RouteCallResultWithComponent<TComponent, TMethod>;
          };

/**
 * WithComponent callable for multi-component routes without args.
 * First argument selects which component to use.
 */
type WithComponentMultiNoArgs<
    TComponent extends Readonly<Record<string, string>>,
    TMethod extends string,
> = {
    (
        component: TComponent[keyof TComponent],
        options?: RouteQueryOptions,
    ): RouteCallResultWithComponent<TComponent[keyof TComponent], TMethod>;
};

/**
 * WithComponent callable for multi-component routes with args.
 * First argument selects which component, followed by the same calling
 * conventions as the route itself (named object, array, positional spread).
 */
type WithComponentMultiWithArgs<
    TComponent extends Readonly<Record<string, string>>,
    TMethod extends string,
    TArgs extends readonly RouteArgMeta[],
> =
    AllArgsOptional<TArgs> extends true
        ? {
              (
                  component: TComponent[keyof TComponent],
                  args?: ArgsObject<TArgs> & Record<string, unknown>,
                  options?: RouteQueryOptions,
              ): RouteCallResultWithComponent<
                  TComponent[keyof TComponent],
                  TMethod
              >;
              (
                  component: TComponent[keyof TComponent],
                  args: (string | number | Record<string, unknown>)[],
                  options?: RouteQueryOptions,
              ): RouteCallResultWithComponent<
                  TComponent[keyof TComponent],
                  TMethod
              >;
              (
                  component: TComponent[keyof TComponent],
                  ...args: [...PositionalTuple<TArgs>, RouteQueryOptions]
              ): RouteCallResultWithComponent<
                  TComponent[keyof TComponent],
                  TMethod
              >;
              (
                  component: TComponent[keyof TComponent],
                  ...args: PositionalTuple<TArgs>
              ): RouteCallResultWithComponent<
                  TComponent[keyof TComponent],
                  TMethod
              >;
          }
        : {
              (
                  component: TComponent[keyof TComponent],
                  args: ArgsObject<TArgs> & Record<string, unknown>,
                  options?: RouteQueryOptions,
              ): RouteCallResultWithComponent<
                  TComponent[keyof TComponent],
                  TMethod
              >;
              (
                  component: TComponent[keyof TComponent],
                  args: (string | number | Record<string, unknown>)[],
                  options?: RouteQueryOptions,
              ): RouteCallResultWithComponent<
                  TComponent[keyof TComponent],
                  TMethod
              >;
              (
                  component: TComponent[keyof TComponent],
                  ...args: [...PositionalTuple<TArgs>, RouteQueryOptions]
              ): RouteCallResultWithComponent<
                  TComponent[keyof TComponent],
                  TMethod
              >;
              (
                  component: TComponent[keyof TComponent],
                  ...args: PositionalTuple<TArgs>
              ): RouteCallResultWithComponent<
                  TComponent[keyof TComponent],
                  TMethod
              >;
          };

/**
 * Mixin that conditionally adds `.component` and `.withComponent` to a route result.
 *
 * - When TComponent is `string`: single-component route with typed `.component` and `.withComponent`.
 * - When TComponent is `Record<string, string>`: multi-component route with component map and selector.
 * - When TComponent is `undefined`: no component properties added (empty intersection).
 */
type ComponentMixin<
    TComponent extends RouteComponentType | undefined,
    TMethods extends readonly string[],
    TArgs extends readonly RouteArgMeta[],
> = TComponent extends string
    ? {
          readonly component: TComponent;
          withComponent: [TArgs] extends [readonly []] | [readonly never[]]
              ? WithComponentSingleNoArgs<TComponent, TMethods[0]>
              : WithComponentSingleWithArgs<TComponent, TMethods[0], TArgs>;
      }
    : TComponent extends Readonly<Record<string, string>>
      ? {
            readonly component: TComponent;
            withComponent: [TArgs] extends [readonly []] | [readonly never[]]
                ? WithComponentMultiNoArgs<TComponent, TMethods[0]>
                : WithComponentMultiWithArgs<TComponent, TMethods[0], TArgs>;
        }
      : Record<never, never>;

/**
 * Form callable signatures for routes with args.
 */
type FormCallableWithArgs<
    TMethod extends string,
    TArgs extends readonly RouteArgMeta[],
> =
    AllArgsOptional<TArgs> extends true
        ? {
              (
                  args?: ArgsObject<TArgs> & Record<string, unknown>,
                  options?: RouteQueryOptions,
              ): RouteFormResult<TMethod>;
              (
                  args: (string | number | Record<string, unknown>)[],
                  options?: RouteQueryOptions,
              ): RouteFormResult<TMethod>;
              (
                  ...args: [...PositionalTuple<TArgs>, RouteQueryOptions]
              ): RouteFormResult<TMethod>;
              (...args: PositionalTuple<TArgs>): RouteFormResult<TMethod>;
          }
        : {
              (
                  args: ArgsObject<TArgs> & Record<string, unknown>,
                  options?: RouteQueryOptions,
              ): RouteFormResult<TMethod>;
              (
                  args: (string | number | Record<string, unknown>)[],
                  options?: RouteQueryOptions,
              ): RouteFormResult<TMethod>;
              (
                  ...args: [...PositionalTuple<TArgs>, RouteQueryOptions]
              ): RouteFormResult<TMethod>;
              (...args: PositionalTuple<TArgs>): RouteFormResult<TMethod>;
          };

/**
 * Form callable signatures for routes without args.
 */
type FormCallableNoArgs<TMethod extends string> = {
    (options?: RouteQueryOptions): RouteFormResult<TMethod>;
};

/**
 * Per-verb form method types for routes with args.
 */
type FormVerbMethodsWithArgs<
    TMethods extends readonly string[],
    TArgs extends readonly RouteArgMeta[],
> = {
    [K in TMethods[number]]: FormCallableWithArgs<K, TArgs>;
};

/**
 * Per-verb form method types for routes without args.
 */
type FormVerbMethodsNoArgs<TMethods extends readonly string[]> = {
    [K in TMethods[number]]: FormCallableNoArgs<K>;
};

/**
 * The `.form` property on a route with args — callable + per-verb sub-methods.
 */
type FormWithArgs<
    TMethods extends readonly string[],
    TArgs extends readonly RouteArgMeta[],
> = FormCallableWithArgs<TMethods[0], TArgs> &
    FormVerbMethodsWithArgs<TMethods, TArgs>;

/**
 * The `.form` property on a route without args — callable + per-verb sub-methods.
 */
type FormNoArgs<TMethods extends readonly string[]> = FormCallableNoArgs<
    TMethods[0]
> &
    FormVerbMethodsNoArgs<TMethods>;
