# Inertia

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) reads the `share()` method of your `HandleInertiaRequests` middleware and writes `inertia-config.d.ts`. That file declares a global `Inertia.SharedData` type and augments `@inertiajs/core`, so every Inertia page gets typed shared props without a type you maintain by hand.

This page covers shared data. A route's own page props, meaning the `component` field and the page-props type on its route helper, are covered in [Inertia Integration](./routing.md#inertia-integration) on the Routing page.

## How the Augmentation File Is Generated

With `inertia.enabled` on (the default), the package builds the file from your middleware:

- **Finding the middleware**: the package searches `inertia.inertia_middleware_path`, or `app_path()` when that isn't set, for a class that extends `Inertia\Middleware`. If it finds none, it writes no file. If your app has more than one such class, point `inertia.inertia_middleware_path` at the directory that holds the one you want.
- **Reading `share()`**: every key's value is typed from your code, without handling a real request.
- **Parent middleware**: a `...parent::share($request)` spread and `array_merge(parent::share($request), [...])` are both read, all the way up your middleware's parent classes. A later key overrides an earlier one and keeps the earlier one's position, as PHP does.
- **`$request->user()`**: typed through your live auth config, from `auth.defaults.guard` to that guard's provider to the provider's `model`. The prop becomes `User | null`, and the file imports the model's type for you. `auth()->user()`, `auth()->id()`, `Auth::user()` and `Auth::id()` resolve the same way.
- **Request helpers**: `$request->url()`, `fullUrl()`, `path()`, `integer()`, `boolean()`, `string()`, `cookie()` and `hasCookie()` are typed from Laravel's own signatures.
- **`config()`**: `config('some.key')` with a literal key is typed from the live config value, since the package runs inside your booted app. A computed key stays `unknown`.
- **Inertia v2 prop wrappers**: `Inertia::defer()`, `optional()`, `lazy()`, `always()`, `merge()` and `deepMerge()` type as the value they wrap. The three a partial reload can leave out, `defer`, `optional` and `lazy`, make the key optional.
- **`EnumResource` props**: a prop that wraps an enum in `EnumResource`, such as `'role' => EnumResource::make(Role::Admin)`, becomes `AsEnum<typeof Role>` when `enums.use_tolki_package` is on (the default), the same as in [API Resources](./api-resources.md#enum-properties-with-enumresource). With it off, the key keeps the enum's type alias (`role: RoleType`). The change applies per key, so another key that reads the enum directly keeps `RoleType`.
- **`errors`**: left out. `@inertiajs/core` already types `page.props.errors` as `Errors & ErrorBag`, and [`errorValueType`](#anatomy-of-the-generated-file) sharpens it. A `#[TsCasts]` or `@return` docblock entry named `errors` still adds one if you want it.
- **The output file**: the result is written to `inertia-config.d.ts`. Set `inertia.augmentation_filename` to change the name.

::: warning A Ternary Between Two Different Enums
A key whose ternary arms wrap different enums, such as `$cond ? EnumResource::make(Role::Admin) : EnumResource::make(Status::Draft)`, renders as `RoleType | StatusType` with no import for either name. Your build then fails with a `TS2304` error for each. Give both arms the same enum, or override that key with a `#[TsCasts]` entry that has an `import`.
:::

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
            'ziggy' => fn () => ['location' => $request->url()],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state'),
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
      ziggy: { location: string };
      sidebarOpen: boolean;
      appName: string;
    };
  }
}

declare module "@inertiajs/core" {
  export interface InertiaConfig {
    sharedPageProps: {
      auth: { user: User | null };
      ziggy: { location: string };
      sidebarOpen: boolean;
      appName: string;
    };
    errorValueType: string[];
  }
}

export {};
```

Each part of the file does one job:

- **`import type { User } from "./app/models";`**: every model, resource or enum that a prop type names gets an import at the top, with a path relative to the output root. An `EnumResource` prop is the exception under the default `enums.use_tolki_package`. It renders as `AsEnum<typeof Role>`, so the enum's const is imported as a value (`import { Role } from './app/enums';`), under an `import { type AsEnum } from '@tolki/ts';` line, and both come before the `import type` lines. Imports from an `import` key in `#[TsCasts]` join the `import type` lines.
- **`declare global { namespace Inertia { type SharedData = ...; } }`**: makes `Inertia.SharedData` available by name in any `.ts` file in your project. That includes the generated route files, which combine it with each page's props, as [Inertia Integration](./routing.md#inertia-integration) shows.
- **`declare module '@inertiajs/core' { ... }`**: augments Inertia's own `InertiaConfig`, so `usePage().props` is typed across your frontend without you writing the augmentation.
- **`errorValueType: string[]`**: added only when the middleware sets `protected $withAllErrors = true;`. It matches the shape Inertia uses for its validation errors in that mode.
- **`export {};`**: TypeScript accepts a `declare global` block only in a module, a file with at least one top-level `import` or `export`. This line makes the file a module even when it has no imports.

The file imports only the names its types use. A key you override with `#[TsCasts]` drops the import its inferred type needed.

A value the package can't read stays `unknown`. `'flash' => ['success' => fn () => $request->session()->get('success')]` would publish `flash: { success: unknown }`, because `session()` isn't one of the typed request methods. Give such a key its type with [`#[TsCasts]` or a `@return` docblock](#type-resolution-priority).

## Type Resolution Priority

Each key from `share()` takes its type from the first of these that covers it:

1. **`#[TsCasts]`** on the middleware class or on its `share()` method. When both name a key, the method's entry wins. It's the same attribute [models](./models.md#tscasts), [API resources](./api-resources.md#overriding-property-types-with-tscasts) and [broadcast events](./broadcast-events.md#overriding-property-types-with-tscasts) use.
2. **A `@return array{...}` docblock** on `share()`. You write the shape by hand, for a key the package can't infer, such as a method call whose return type says nothing. A `key?:` entry makes that key optional.
3. **Inference from your code**, the default. It covers plain values, nested arrays, conditionals, closures, spreads, `array_merge()`, `config()`, the request and auth helpers, and Inertia's prop wrappers.

A key that `#[TsCasts]` or the docblock names but `share()` doesn't return is added to the type.

In this middleware, one key takes its type from each override:

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
            'appName' => config('app.name'),
            'flash' => $this->resolveFlashMessages($request), // a method whose return type says nothing
        ];
    }
}
```

Here `appName` takes its type from `#[TsCasts]` and `flash` takes its type from the `@return` docblock. Any other key that `share()` returns falls back to inference.

## Preserve-Keys Resource Collections in Page Props

This section covers a route's page props, not `share()`. See [Inertia Integration](./routing.md#inertia-integration) for how page props are typed in general.

A `ResourceCollection`, or a resource collected with `Resource::collection()`, can keep its source collection's keys through the `#[PreserveKeys]` attribute or the older `public $preserveKeys = true;` property. Laravel then serializes its `data` as a JSON object keyed by those keys, not as an array. A paginated page prop backed by such a collection types `data` to match:

```typescript
import type { JsonResourcePaginator } from "@tolki/types";

// $wrap = null (flat), or Resource::collection($paginator) on a preserve-keys resource:
export type TeamsPageProps = Inertia.SharedData & {
  teams: Omit<JsonResourcePaginator<Team>, "data"> & {
    data: Record<string, Team>;
  };
};
```

`JsonResourcePaginator<T>` types its `data` as `T[]` (see [API Resources](./api-resources.md)), so a key-preserving collection can't use it as is. The page-props type drops the array `data` with `Omit` and adds a keyed `Record<string, T>` in its place.

A named collection that wraps its items in a `data` key, such as `new TeamCollection($paginator)`, doesn't need this. Its page prop is the collection's own interface plus pagination (`TeamCollection & ResourcePagination`), and that interface already types `data` as `Record<string, T>` when the collection keeps keys, paginated or not. Only the flat collection and the anonymous `Resource::collection()` form need the `Omit<...> & { data: Record<...> }` shape.

### Paginating Inline in the Render Call

You don't have to assign a paginator to a variable first. Both of these produce the same page-props type:

```php
// Through a variable
$teams = Team::query()->paginate(10);

return Inertia::render('Teams/Index', [
    'teams' => new TeamCollection($teams),
]);

// Inline, with no variable
return Inertia::render('Teams/Index', [
    'teams' => new TeamCollection(Team::query()->paginate(10)),
]);
```

Both forms give the collection's interface plus pagination:

```typescript
export type IndexPageProps = Inertia.SharedData & {
  teams: TeamCollection & ResourcePagination;
};
```

`paginate()`, `simplePaginate()` and `cursorPaginate()` are all recognized, in both the `new SomeCollection(...)` and `SomeResource::collection(...)` forms.

::: warning A Missed Paginator Gives a Wrong Type
When the package doesn't see a paginator, the prop doesn't lose its type. It gets the collection's type without the pagination part, which is wrong rather than missing. One form isn't followed: a query builder held in a variable before the paginator call. The chain has to start at a static call on the model.

```php
$q = Post::query();

return Inertia::render('Posts/Index', [
    'posts' => new PostCollection($q->paginate(10)), // not detected
]);
```

Here `posts` types as `PostCollection`, without `& ResourcePagination`.
:::

## Output Location

The package writes the augmentation file to the first of these directories that's set:

1. `inertia.output_directory`.
2. `routes.output_directory`. Route files reference `Inertia.SharedData`, so when you move them, the augmentation file follows.
3. The global `output_directory`.

## Configuration Reference

The [Configuration Reference](./configuration-reference.md) lists every `inertia.*` key, including `component_casing` and `ui_table_package`, which apply to route page props.
