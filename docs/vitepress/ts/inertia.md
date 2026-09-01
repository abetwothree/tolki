# Inertia

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) analyzes your `HandleInertiaRequests` middleware's `share()` method and generates `inertia-config.d.ts` — a module augmentation for `@inertiajs/core` plus a global `Inertia.SharedData` type. Every Inertia page component gets fully-typed shared props automatically, without hand-maintaining a separate type.

This page covers the shared-data analysis and module augmentation file. For per-route page-prop types (the `component` field and `annotatePageProps` threading on individual routes), see [Inertia Integration](./routing.md#inertia-integration) in the Routing docs — that's a related but separate piece of the pipeline.

## How the Augmentation File Is Generated

- The package searches `inertia.inertia_middleware_path` (or `app_path()` when not set) for a class extending `Inertia\Middleware`.
- It statically analyzes that middleware's `share(Request $request): array` method with the package's own AST engine, resolving every key's value to a TypeScript type without running the application.
- Both composition forms are read, up the whole middleware inheritance chain: a `...parent::share($request)` spread and `array_merge(parent::share($request), [...])`. A later key overrides an earlier one and keeps the earlier one's position, exactly as PHP does.
- `$request->user()` is typed through your live auth configuration — `auth.defaults.guard` → that guard's provider → the provider's `model` — so the prop becomes `User | null` and the model's type import is written into the file for you. `auth()->user()`, `auth()->id()`, `Auth::user()` and `Auth::id()` resolve the same way, and `$request->url()`, `->fullUrl()`, `->path()`, `->integer()`, `->boolean()`, `->string()`, `->cookie()` and `->hasCookie()` are typed from Laravel's own signatures.
- `config('some.key')` with a literal key is typed from the live configuration value, since the package runs inside your booted application; a computed key stays `unknown`.
- Inertia v2's prop wrappers — `Inertia::defer()`, `optional()`, `lazy()`, `always()`, `merge()`, `deepMerge()` — are typed as the value they wrap. The three a partial reload can omit (`defer`, `optional`, `lazy`) produce an optional key.
- `errors` is deliberately left out of the inferred shape: `@inertiajs/core` already declares `page.props.errors` as `Errors & ErrorBag`, and `errorValueType` below is this package's channel for sharpening it. A `#[TsCasts]` or `@return` docblock entry named `errors` still wins if you want one.
- The result is rendered into `inertia-config.d.ts` (filename configurable via `inertia.augmentation_filename`).
- If no `Inertia\Middleware` subclass is found, no file is generated.

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
import type { User } from "./app/models";

declare global {
  namespace Inertia {
    type SharedData = {
      auth: { user: User | null };
      flash: { success: string | null; error: string | null };
      appName: string;
    };
  }
}

declare module "@inertiajs/core" {
  export interface InertiaConfig {
    sharedPageProps: {
      auth: { user: User | null };
      flash: { success: string | null; error: string | null };
      appName: string;
    };
    errorValueType: string[];
  }
}

export {};
```

- **`import type { User } from './app/models';`** — every model, resource or enum an inferred prop type names gets its import written above the declarations, resolved relative to the output root. Imports supplied by `#[TsCasts(import: ...)]` are rendered below these. A key whose type an override replaces drops the import that type kept alive.
- **`declare global { namespace Inertia { type SharedData = ...; } }`** makes `Inertia.SharedData` available by bare name in any `.ts` file in your project — including generated controller files that intersect it with page-specific props (see [Inertia Integration](./routing.md#inertia-integration)).
- **`declare module '@inertiajs/core' { ... InertiaConfig ... }`** augments Inertia's own `usePage<T>()` / shared-data typing so `usePage().props` is typed correctly throughout your frontend, without you writing that augmentation by hand.
- **`errorValueType: string[]`** is only added when the middleware has a `protected $withAllErrors = true;` property — it matches the shape Inertia uses for its validation error bag in that mode.
- **`export {};`** at the end is required — TypeScript only processes a `declare global` block inside a file that's an ES module (i.e., has at least one top-level `import` or `export`). Without it, the `declare global` block would be silently ignored.

## Type Resolution Priority

Each key returned from `share()` resolves to a TypeScript type using this priority order (highest wins):

1. **`#[TsCasts]`** on the middleware class or its `share()` method — the same attribute used by [models](./models.md#tscasts), [resources](./api-resources.md#tscasts-override-property-types), and [broadcast events](./broadcast-events.md#tscasts-overriding-property-types).
2. **`@return array{...}` PHPDoc** on `share()` — a manually-written shape annotation, useful when a key's value can't be statically inferred (e.g. it comes from a method call whose return type says nothing).
3. **The AST engine's inference** — the default, covering plain values, nested arrays, conditionals, closures, spreads, `array_merge()`, `config()`, the request/auth helpers, and Inertia's prop wrappers.

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

Here, `appName`'s type comes from `#[TsCasts]`, `flash`'s type comes from the `@return` docblock (since `resolveFlashMessages()` isn't itself analyzed), and every other key (like `auth`, from `...parent::share($request)`) falls back to the engine's own inference.

## Preserve-Keys Resource Collections in Page Props

This is about per-route page props (see [Inertia Integration](./routing.md#inertia-integration)), not `share()` — noted here because it's the same paginated-collection typing this page's other sections describe.

A `ResourceCollection` (or a resource collected via `Resource::collection()`) that opts into Laravel's key-preserving behavior — the `#[PreserveKeys]` attribute or the older `public $preserveKeys = true;` property — serializes its `data` as a JSON object keyed by the source collection's own keys, not a JSON array. A paginated page prop backed by such a collection types its `data` member to match:

```typescript
import type { JsonResourcePaginator } from "@tolki/types";

// $wrap = null (flat) or Resource::collection($paginator) on a preserve-keys resource:
export type TeamsPageProps = Inertia.SharedData & {
  teams: Omit<JsonResourcePaginator<Team>, "data"> & {
    data: Record<string, Team>;
  };
};
```

`JsonResourcePaginator<T>`'s own `data` is `T[]` (see [API Resources § Pagination](./api-resources.md)), so a key-preserving collection can't use it unmodified — the page prop type `Omit`s the array-typed `data` and replaces it with a keyed `Record<string, T>`.

A **named**, non-flat collection (`new TeamCollection($paginator)`, wrapped in a `data` key) doesn't need this rewrite at all: its page prop already references the collection's own generated interface (`TeamCollection & ResourcePagination`), and that interface's `data` member is generated as `Record<string, T>` directly whenever the collection preserves keys — paginated or not. Only the two shapes that would otherwise degrade to a paginator utility type with an array-typed `data` — the flat collection and the anonymous `Resource::collection()` case — need the `Omit<...> & { data: Record<...> }` rewrite.

### Paginating Inline in the Render Call

A paginator does **not** have to be assigned to a variable first. Both of these produce the same page-prop type:

```php
// Via an intermediate variable
$teams = Team::query()->paginate(10);

return Inertia::render('Teams/Index', [
    'teams' => new TeamCollection($teams),
]);

// Inline, with no intermediate variable
return Inertia::render('Teams/Index', [
    'teams' => new TeamCollection(Team::query()->paginate(10)),
]);
```

```typescript
export type IndexPageProps = Inertia.SharedData & {
  teams: TeamCollection & ResourcePagination;
};
```

`paginate()`, `simplePaginate()`, and `cursorPaginate()` are all recognized, in both the `new SomeCollection(...)` and `SomeResource::collection(...)` forms.

> [!WARNING]
> An unrecognized paginator does not produce a _missing_ type — it produces a **wrong** one. The analyzer defaults an unresolved prop to "not paginated", so the prop still gets a type from the ordinary resource/collection analysis, just without the pagination wrapper. Before inline detection, the second form above typed as a bare `TeamCollection`, silently omitting `ResourcePagination`.

One form is still not followed: a query builder assigned to a variable _before_ the paginator call. The chain has to reach a static call on the model directly.

```php
$q = Post::query();

return Inertia::render('Posts/Index', [
    'posts' => new PostCollection($q->paginate(10)), // not detected
]);
```

## Spread Support (`...parent::share($request)`)

The base `Inertia\Middleware::share()` method's own return type (Laravel's default `errors`/`errors_bag` keys, plus anything your parent middleware layers add) is included automatically when your override spreads it in — same as trait/parent spreading elsewhere in the package.

## Output Location

The augmentation file's output directory is resolved with this priority:

1. `inertia.output_directory`, if set.
2. `routes.output_directory`, if set — since page-prop types generated per-route (see [Inertia Integration](./routing.md#inertia-integration)) reference `Inertia.SharedData`, keeping the augmentation file alongside routes by default means both live in a predictable, related location.
3. The global `output_directory`.

## Configuration Reference

The full list of `inertia.*` config keys — including `component_casing` and `ui_table_package`, which apply to the related per-route page-props feature — lives in the [Configuration Reference](./configuration-reference.md).
