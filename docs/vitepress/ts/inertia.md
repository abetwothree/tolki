# Inertia

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) analyzes your `HandleInertiaRequests` middleware's `share()` method and generates `inertia-config.d.ts` — a module augmentation for `@inertiajs/core` plus a global `Inertia.SharedData` type. Every Inertia page component gets fully-typed shared props automatically, without hand-maintaining a separate type.

This page covers the shared-data analysis and module augmentation file. For per-route page-prop types (the `component` field and `annotatePageProps` threading on individual routes), see [Inertia Integration](./routing.md#inertia-integration) in the Routing docs — that's a related but separate piece of the pipeline.

## How the Augmentation File Is Generated

- The package searches `inertia.inertia_middleware_path` (or `app_path()` when not set) for a class extending `Inertia\Middleware`.
- It statically analyzes that middleware's `share(Request $request): array` method — via [Surveyor](https://github.com/laravel/surveyor) — resolving every key's value to a TypeScript type without running the application.
- The result is rendered into `inertia-config.d.ts` (filename configurable via `inertia.augmentation_filename`).
- If no `Inertia\Middleware` subclass is found, or it returns no shared data, no file is generated.

## Anatomy of the Generated File

Given this middleware:

```php
class HandleInertiaRequests extends Middleware
{
    protected $withAllErrors = true;

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => ['user' => $request->user()],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'appName' => config('app.name'),
        ];
    }
}
```

The package generates `inertia-config.d.ts`:

```typescript
declare global {
    namespace Inertia {
        type SharedData = { auth: { user: { id: number, name: string, email: string } | null }, flash: { success: string | null, error: string | null }, appName: string };
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: { auth: { user: { id: number, name: string, email: string } | null }, flash: { success: string | null, error: string | null }, appName: string };
        errorValueType: string[];
    }
}

export {};
```

- **`declare global { namespace Inertia { type SharedData = ...; } }`** makes `Inertia.SharedData` available by bare name in any `.ts` file in your project — including generated controller files that intersect it with page-specific props (see [Inertia Integration](./routing.md#inertia-integration)).
- **`declare module '@inertiajs/core' { ... InertiaConfig ... }`** augments Inertia's own `usePage<T>()` / shared-data typing so `usePage().props` is typed correctly throughout your frontend, without you writing that augmentation by hand.
- **`errorValueType: string[]`** is only added when the middleware has a `protected $withAllErrors = true;` property — it matches the shape Inertia uses for its validation error bag in that mode.
- **`export {};`** at the end is required — TypeScript only processes a `declare global` block inside a file that's an ES module (i.e., has at least one top-level `import` or `export`). Without it, the `declare global` block would be silently ignored.

## Type Resolution Priority

Each key returned from `share()` resolves to a TypeScript type using this priority order (highest wins):

1. **`#[TsCasts]`** on the middleware class or its `share()` method — the same attribute used by [models](./models.md#tscasts), [resources](./api-resources.md#tscasts-override-property-types), and [broadcast events](./broadcast-events.md#tscasts-overriding-property-types).
2. **`@return array{...}` PHPDoc** on `share()` — a manually-written shape annotation, useful when a key's value can't be statically inferred (e.g. it comes from a closure or a method call Surveyor can't resolve).
3. **Surveyor's static inference** — the default, covering plain values, nested arrays, conditionals, and spreads.

```php
#[TsCasts(['appName' => 'string'])]
class HandleInertiaRequests extends Middleware
{
    /**
     * @return array{flash: array{success: string|null, error: string|null}}
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'flash' => $this->resolveFlashMessages($request), // opaque method call
        ];
    }
}
```

Here, `appName`'s type comes from `#[TsCasts]`, `flash`'s type comes from the `@return` docblock (since `resolveFlashMessages()` isn't itself analyzed), and every other key (like `auth`, from `...parent::share($request)`) falls back to Surveyor's own inference.

## Spread Support (`...parent::share($request)`)

The base `Inertia\Middleware::share()` method's own return type (Laravel's default `errors`/`errors_bag` keys, plus anything your parent middleware layers add) is included automatically when your override spreads it in — same as trait/parent spreading elsewhere in the package.

## Output Location

The augmentation file's output directory is resolved with this priority:

1. `inertia.output_directory`, if set.
2. `routes.output_directory`, if set — since page-prop types generated per-route (see [Inertia Integration](./routing.md#inertia-integration)) reference `Inertia.SharedData`, keeping the augmentation file alongside routes by default means both live in a predictable, related location.
3. The global `output_directory`.

## Configuration Reference

The full list of `inertia.*` config keys — including `component_casing` and `ui_table_package`, which apply to the related per-route page-props feature — lives in the [Configuration Reference](./configuration-reference.md).
