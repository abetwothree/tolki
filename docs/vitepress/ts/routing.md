# Routing

The [`defineRoute`](#anatomy-of-defineroute) function is the runtime companion to the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish)'s route generation. For every controller with at least one publishable route, the Laravel package writes a single TypeScript file exporting one `defineRoute()` call per action — similar in spirit to [Laravel Wayfinder](https://github.com/laravel/wayfinder), but far more compact: all the URL-building, parameter-binding, query-string, and form-spoofing logic lives inside `defineRoute` itself instead of being generated inline for every single route.

As with [enums](./enums.md), this package is not meant to be used standalone — install it alongside the Laravel package as described in [Installation & Usage](./index.md).

## How Routes Are Generated

- One `.ts` file is generated per controller, at a modular, namespace-derived path (e.g. `App\Http\Controllers\PostController` → `app/http/controllers/post-controller.ts`).
- Each file exports one named `const` per controller action — named after the **controller method**, not the Laravel route name — plus a `default` export containing all of that controller's actions as a single object.
- Barrel `index.ts` files are written per namespace directory, but — unlike models, enums, and resources — route barrels **only re-export each controller's default export**, never named exports:

  ```typescript
  // app/http/controllers/index.ts
  export { default as PostController } from "./post-controller";
  export { default as UserController } from "./user-controller";
  ```

  This avoids collisions between controllers that share method names (`index`, `show`, `store`, ...).

- **Invokable controllers** (a single `__invoke` method) export their one action directly as the default export, so you call the controller itself:

  ```typescript
  import NamedInvokableController from "@js/types/data/app/http/controllers/named-invokable-controller";

  NamedInvokableController(); // { url: '/named-invokable', method: 'get' }
  ```

  If an invokable controller has _additional_ public actions besides `__invoke`, those are attached to the default export via `Object.assign` so you can still call them as properties (`InvokableModelBoundPlusController.extra(...)`).

- Multiple Laravel routes that map to the **same controller method** are de-duplicated into a single export — if one of them is named, the named route wins.
- `HEAD` is always omitted from `methods` (Laravel adds it implicitly to every `GET` route).
- A method decorated with `#[TsExclude]` (or a controller class decorated with it) is skipped entirely — see [Filtering & Excluding Routes](#filtering--excluding-routes).

## Anatomy of `defineRoute`

Every generated action looks like this:

```typescript
export const show = defineRoute({
  name: "posts.show", // Laravel route name, or omitted if unnamed
  url: "/posts/{post}", // URI template (or `{domain}{uri}` for domain routes)
  domain: "api.example.com", // only present for domain-restricted routes
  methods: ["get"] as const,
  args: [{ name: "post", required: true, _routeKey: "id" }] as const,
  component: "PostShow", // only present for Inertia routes, see below
});
```

The value returned by `defineRoute()` is a callable object with:

| Member                                             | Description                                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `route(...)`                                       | Calling it directly returns `{ url, method }`, using the route's primary (first declared) HTTP method.   |
| `route.url(...)`                                   | Same calling conventions as above, returns just the URL string.                                          |
| `route.get(...)`, `route.post(...)`, …             | One method per declared HTTP verb, returning `{ url, method }` for that specific verb.                   |
| `route.form(...)`                                  | Builds `{ action, method }` for an HTML `<form>` — see [Building Forms](#building-forms).                |
| `route.form.put(...)`, `route.form.delete(...)`, … | Per-verb form variants — these add Laravel's `_method` spoofing automatically.                           |
| `route.definition`                                 | The raw metadata object passed to `defineRoute()`.                                                       |
| `route.toString()`                                 | Returns the URL with no parameters substituted — lets you drop a route directly into a template literal. |
| `${route(...)}`                                    | Using a route directly in a template literal calls the route and inserts the URL string.                 |

## Calling a Route

All the conventions below are equivalent — pick whichever reads best at the call site:

```typescript
// Named object
PostController.show({ post: 42 });

// Positional spread
PostController.show(42);

// Positional array
PostController.show([42]);

// A model instance / any object with an `.id` or the bound route key
PostController.show(post); // post = { id: 42, title: '...' }
```

For routes with multiple parameters, the same conventions apply positionally or as named keys:

```typescript
UserPostController.show({ user: 2, post: 42 });
UserPostController.show(2, 42);
UserPostController.show([2, 42]);
UserPostController.show(someUser, somePost);
```

::: tip Naked model/object shortcut
Passing a bare object (`PostController.show(post)`) only works for routes with **exactly one** declared parameter, and only when the object has an `id` property, a `_routeKey` property, or the property named by the route's binding key (e.g. `slug`).
:::

### Trailing query options

Any of the calling conventions above accept a trailing options object for query parameters (see [Query Parameters](#query-parameters)):

```typescript
PostController.show(42, { query: { preview: true } });
PostController.show({ post: 42 }, { query: { preview: true } });
```

A trailing argument is only treated as "options" (rather than a route parameter) when you pass **more arguments than the route declares** and the last one is a plain object that doesn't contain any of the route's parameter names.

## Model Binding

When a route parameter is type-hinted to an Eloquent model, the generated `args` entry includes a `_routeKey` field naming the column used to resolve it (mirroring Laravel's own [route model binding](https://laravel.com/docs/routing#route-model-binding)):

```typescript
// Route::get('/slug-posts/{slugPost:slug}', ...)
args: [{ name: 'slugPost', required: true, _routeKey: 'slug' }] as const,
```

At the call site, you can pass the raw key value or the object itself — `defineRoute` extracts `value[_routeKey]`, falling back to `value.id`:

```typescript
CustomRouteKeyController.show({ slugPost: "hello-world" });
CustomRouteKeyController.show(post); // post = { slug: 'hello-world', ... }
```

Because the binding is resolved structurally (via the `_routeKey` string), **the generated route file never imports the PHP model's TypeScript type** — you get full type inference (`string | number | { slug: string | number }`) without a single model import.

## Enum Binding

Route parameters type-hinted to a [backed enum](https://www.php.net/manual/en/language.enumerations.backed.php) resolve the same way, using the enum's backing values instead of a route key:

```typescript
args: [{ name: 'status', required: true, _enumValues: [0, 1] }] as const,
```

```typescript
EnumBoundController.byStatus({ status: 0 }); // raw backing value
EnumBoundController.byStatus({ status: Status.Active }); // enum case value
EnumBoundController.byStatus({ status: Status.from(0) }); // a defineEnum() instance
```

Just like model binding, no enum import is required — TypeScript infers the union of valid backing values directly from `_enumValues`.

## Optional Parameters & `where` Constraints

Parameters from `{param?}` segments are marked `required: false` and become optional in both the named-object and positional forms:

```typescript
export const show = defineRoute({
  url: "/optional/{param?}",
  methods: ["get"] as const,
  args: [{ name: "param", required: false }] as const,
});

OptionalParamController.show(); // '/optional'
OptionalParamController.show({ param: "x" }); // '/optional/x'
```

Parameters constrained with `->where(...)` in Laravel include a `where` regex, validated at runtime — an invalid value throws:

```typescript
args: ([{ name: "id", required: true, where: "[0-9]+" }] as const,
  TypedParamController.showInt({ id: "abc" }));
// throws: Route error: 'id' parameter 'abc' does not match required format '[0-9]+'.
```

## Domain Routes

Domain-restricted routes include a `domain` field, and their compiled URL is protocol-relative (so it works as-is with `fetch()` or an `<a href>`, resolving against whichever protocol the current page uses):

```typescript
export const index = defineRoute({
  url: "api.example.com/domain",
  domain: "api.example.com",
  methods: ["get"] as const,
});

DomainController.index(); // '//api.example.com/domain'
```

## Query Parameters

Any argument key that doesn't match a declared route parameter becomes a query string parameter:

```typescript
PostController.index({ q: "search", page: 2 }); // '/posts?q=search&page=2'
```

- **Booleans** are encoded as `0`/`1` (matching how Laravel parses query input).
- **Arrays** use indexed notation: `tags[0]=a&tags[1]=b`.
- **`_query` escape hatch** — use this when a query key would otherwise collide with a route parameter name:

  ```typescript
  PostController.index({ sort: "created_at", _query: { sort: "desc" } });
  // '/posts/sort/created_at?sort=desc'
  ```

- **`mergeQuery`** — merges (and can delete, via `null`/`undefined` values) keys into the **current page's** query string, useful for updating one filter without losing the others:

  ```typescript
  // current URL: /posts?sort=name&page=3
  PostController.index({}, { mergeQuery: { page: 1 } });
  // '/posts?sort=name&page=1'
  ```

## Route Defaults

Mirrors Laravel's [`URL::defaults()`](https://laravel.com/docs/urls#default-values) — set values once and they're substituted automatically wherever a matching parameter name is required but not supplied:

```typescript
import { setRouteDefaults, addRouteDefault } from "@tolki/ts";

setRouteDefaults({ locale: "en" });
addRouteDefault("locale", "fr"); // overwrite a single key
```

`getRouteDefaults()` reads the current defaults, and `resetRouteDefaults()` clears them (handy in test setup/teardown).

## Building Forms

`.form(...)` builds `{ action, method, toString() }` for classic HTML `<form>` submissions, where `method` is always `'get'` or `'post'` (the only two methods HTML forms support). This matches [Laravel Wayfinder's](https://github.com/laravel/wayfinder) behavior exactly: the bare call already spoofs the route's primary method for you — there's no need to reach for a per-verb variant unless you want to submit as a _different_ verb than the route's first declared method.

```typescript
const { action, method } = PostController.store.form();
// action: '/posts', method: 'post'

PostController.update.form({ post: 42 });
// { action: '/posts/42?_method=PUT', method: 'post' } — primary method (PUT) spoofed automatically

PostController.destroy.form({ post: 42 });
// { action: '/posts/42?_method=DELETE', method: 'post' } — primary method (DELETE) spoofed automatically
```

Per-verb form methods (`.form.put(...)`, `.form.patch(...)`, `.form.delete(...)`, `.form.get(...)`) are only needed when a route supports multiple verbs and you want to submit as one that isn't the primary one:

```typescript
// A route registered for both PUT and PATCH — primary is 'put'
PostController.update.form(); // spoofs _method=PUT (primary)
PostController.update.form.patch({ post: 42 }); // explicitly spoofs _method=PATCH instead
```

`GET`/`POST` routes never get a spoof added, since HTML forms natively support both.

## Inertia Integration

When `inertia.enabled` is on in the Laravel package's config, each action that renders an Inertia response automatically gets a `component` field and a page-props type — you never call the annotation helpers yourself, they're already applied in the generated file:

```typescript
export type PostPageProps = Inertia.SharedData & { post: Post };

export const post = annotatePageProps<PostPageProps>()(
  defineRoute({
    name: "inertia.post",
    url: "/inertia/post/{post}",
    methods: ["get"] as const,
    args: [{ name: "post", required: true, _routeKey: "id" }] as const,
    component: "PostShow",
  }),
);
```

Use `InferPageProps<typeof route>` on the frontend to read the page-props type back out — handy for typing a page component's props without a separate import:

```typescript
import type { InferPageProps } from "@tolki/ts";
import { post } from "@js/types/data/app/http/controllers/inertia-controller";

type Props = InferPageProps<typeof post>; // PostPageProps
```

### Conditional (multi-component) routes

An action that conditionally renders different Inertia components (e.g. based on auth state) generates a `component` object instead of a string, plus a union page-props type:

```typescript
export type ConditionalAuthenticatedPageProps = Inertia.SharedData & {
  user: unknown;
};
export type ConditionalGuestPageProps = Inertia.SharedData & {
  message: string;
};

export const conditional = annotatePageProps<
  ConditionalAuthenticatedPageProps | ConditionalGuestPageProps
>()(
  defineRoute({
    url: "/inertia/conditional",
    methods: ["get"] as const,
    component: {
      authenticated: "Conditional/Authenticated",
      guest: "Conditional/Guest",
    } as const,
  }),
);
```

`route.component` gives you the whole map, and `route.withComponent(componentValue, ...args)` tags a call result with a specific variant (it accepts one of the _values_ from the map, e.g. `'Conditional/Authenticated'`, not the key) — useful for logging or for selecting which frontend component to render based on which variant a given call represents.

## Inertia UI Table Props

Routes that render an [Inertia UI Table](https://inertiaui.com/) get a typed page prop without the package ever evaluating the table object's `toArray()` method — the prop type is inferred from the table's statically-declared resource model instead.

```php
use App\Tables\MerchandiseTable;
use Inertia\Inertia;

public function index()
{
    return Inertia::render('Merchandise/MerchandiseIndex', [
        'merchandise' => MerchandiseTable::make()->defaultSort('-id'),
    ]);
}
```

When the table declares a static resource model, the generated page prop uses `TableResource<TModel>`, imported directly from the Inertia UI Table package you have installed. The package is auto-detected from your `package.json` (`@inertiaui/table-vue` or `@inertiaui/table-react`):

```typescript
import type { TableResource } from "@inertiaui/table-vue";
import type { Merchandise } from "../models";

export type IndexPageProps = Inertia.SharedData & {
  merchandise: TableResource<Merchandise>;
};
```

If you use the React table package, the import is generated as `@inertiaui/table-react` instead. To force a specific package (or use a custom alias), set `inertia.ui_table_package` in `config/ts-publish.php`.

Supported model inference (all read statically, never instantiating the table):

- `protected ?string $resource = Merchandise::class;` — the model is read from the property's **default value**.
- A `query(): Builder` method returning `Merchandise::query()`, `Merchandise::class`, or a query chain rooted at the model class.
- Service-layer props where the controller passes `$this->resource->index($request)` and the service method returns an array containing table props.

Dynamic/stateful tables whose model only exists in runtime constructor state are not statically inferable; use `#[TsCasts]` on the controller method for fully custom prop typing.

## Table-Tainted Controllers

When a controller (or the resource it delegates to) renders an Inertia UI Table in **any** of its actions — even a sibling action unrelated to the route being published — the entire controller is considered "table-tainted." To avoid autoloading optional export dependencies such as Excel/PhpSpreadsheet during `ts:publish`, deep static analysis is skipped for every action on that controller.

Affected routes still get their route helpers, but they receive no auto-generated page-prop type — the route appears as a helper function without a corresponding `PageProps` type export.

### Why This Happens (It Is Not the Inertia UI Table Package)

This workaround exists because of a bug in [`phpoffice/phpspreadsheet`](https://github.com/PHPOffice/PhpSpreadsheet) — **not** the Inertia UI Table package, and not your code. The dependency chain is:

- The Inertia UI Table package does **not** require any spreadsheet code. It only _optionally_ integrates with [`maatwebsite/excel`](https://github.com/SpartnerNL/Laravel-Excel) — a `suggest`/dev dependency ("To export tables to CSV, Excel, etc.") — so tables can export.
- If your app installs `maatwebsite/excel` to enable those exports, that package requires `phpoffice/phpspreadsheet`.
- `phpoffice/phpspreadsheet` ships a `SimpleCache1` cache shim whose `get()` signature is incompatible with the typed `Psr\SimpleCache\CacheInterface::get()` it implements under newer `psr/simple-cache` (v2/v3). The moment PHP _loads_ that class it raises an uncatchable compile-time (`E_COMPILE_ERROR`) fatal:

  ```text
  Declaration of PhpOffice\PhpSpreadsheet\Collection\Memory\SimpleCache1::get($key, $default = null)
  must be compatible with Psr\SimpleCache\CacheInterface::get(string $key, mixed $default = null): mixed
  ```

A table's `toArray()` builds its `exports` definition, which reaches that Excel/PhpSpreadsheet code path. So when `ts:publish` statically evaluates a table to type a route, it triggers the class load and the fatal — even on a sibling route that has nothing to do with exports. The taint skip simply prevents `ts:publish` from evaluating tables at all, sidestepping the broken transitive dependency. Once `phpoffice/phpspreadsheet` is fixed for your PHP / `psr/simple-cache` version (or the optional Excel integration is not installed), none of this is necessary.

### Opting Back In with `#[TsCasts]`

To get precise page-prop types for a specific method on a table-tainted controller, annotate it with `#[TsCasts([...])]`. This short-circuits the deep analysis for that method and builds the page-prop type directly from your cast map:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

#[TsCasts(['tag' => 'Tag', 'mode' => 'string'])]
public function create(): \Inertia\Response
{
    return Inertia::render('Tags/TagCreate', [
        'tag'  => new Tag,
        'mode' => 'create',
    ]);
}
```

This produces:

```typescript
export type CreatePageProps = Inertia.SharedData & {
  tag: Tag;
  mode: string;
};
```

### Removing the Route Entirely with `#[TsExclude]`

If you don't want a route helper generated at all, annotate the method with `#[TsExclude]`. This removes the route from the published output entirely — no route helper and no page-prop type. Use this only when the route should not appear in the TypeScript output.

### Known Limitation: Taint Detection Depth

Taint is detected when a controller references a table through its own file, through a constructor parameter or typed property whose class file references a table, or through one level of `$this->property->method(...)` resources passed directly as the `Inertia::render()` data argument. Deeper indirection that still reaches a table — for example, a table reached only through `app(...)` / `resolve(...)` inside a method body, a trait method, a global helper, a nested array value, an `array_merge(...)`, or a variable-assigned render argument — may not be auto-detected. In those cases `ts:publish` could still fatal when it attempts to evaluate the table. Use `#[TsCasts]` or `#[TsExclude]` on the method as a manual escape hatch.

### Automatic Taint Skip: The Common CRUD Case

The most common pattern — a CRUD controller that injects a table-bearing resource through a constructor parameter or a typed property — is handled automatically without any restructuring. When `ts:publish` detects that a controller depends on a resource whose file references an Inertia UI Table, it skips deep analysis for every action on that controller. This means all sibling actions (`index`, `create`, `store`, `update`, `destroy`) are covered without annotating each method.

### Dedicated-Controller Escape Hatch

When taint detection cannot reach a table — for example, the table is obtained through `app(...)` / `resolve(...)` inside a method body, a trait method, or a global helper rather than through a typed constructor or property dependency — the **guaranteed fix** is to isolate the table in a dedicated single-action `__invoke` controller marked `#[TsExclude]`, and to remove the table from the shared CRUD resource so the rest of its routes are analyzed normally.

**Example — before (table mixed into CRUD resource, detection may not reach it):**

```php
// app/Http/Resources/MerchandiseResource.php
class MerchandiseResource
{
    public function index(Request $request): array
    {
        return [
            'merchandise' => app(MerchandiseTable::class)->make(),
        ];
    }

    public function store(Request $request): array
    {
        // store merchandise logic here

        return [];
    }
}
```

**Example — after (table isolated, CRUD resource is table-free):**

```php
// app/Http/Controllers/Merchandise/MerchandiseIndexController.php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;
use App\Tables\MerchandiseTable;
use Inertia\Inertia;

#[TsExclude]
class MerchandiseIndexController
{
    public function __invoke(Request $request): \Inertia\Response
    {
        return Inertia::render('Merchandise/MerchandiseIndex', [
            'merchandise' => MerchandiseTable::make(),
        ]);
    }
}

// app/Http/Controllers/Merchandise/MerchandiseController.php
// (resource no longer references the table)
class MerchandiseResource
{
    public function store(Request $request): array
    {
        // store merchandise logic here

        return [];
    }
}
```

```php
// routes/web.php
Route::get('/merchandise', MerchandiseIndexController::class)->name('merchandise.index');
Route::resource('merchandise', MerchandiseController::class)->except('index');
```

With `#[TsExclude]` on the dedicated controller, `ts:publish` skips that route entirely (no route helper, no page-prop type). The remaining CRUD routes — now backed by a table-free resource — type normally. This is the 100% robust fallback: no table class appears in any file that `ts:publish` statically analyzes.

The trade-off is a small per-table restructure: one extra single-action controller per table-rendered page. This is only necessary when the automatic taint skip cannot detect the table dependency. As explained in [Why This Happens](#why-this-happens-it-is-not-the-inertia-ui-table-package) above, the root cause is the `phpoffice/phpspreadsheet` declaration-compatibility fatal — not the Inertia UI Table package — so fixing it upstream (or not installing the optional Excel export integration) eliminates the need for any of this.

## Form Request Payload Types

When a controller action type-hints a Laravel `FormRequest`, the request's generated TypeScript interface is attached the same way — automatically, via `annotateRequestPayload`:

```typescript
export const store = annotateRequestPayload<StorePostRequest>()(
  defineRoute({
    name: "posts.store",
    url: "/posts",
    methods: ["post"] as const,
  }),
);
```

Read it back with `InferRequestPayload<typeof route>`, e.g. to type an Inertia `useForm()` call:

```typescript
import type { InferRequestPayload } from "@tolki/ts";
import { store } from "@js/types/data/app/http/controllers/post-controller";

const form = useForm<InferRequestPayload<typeof store>>({
  title: "",
  body: "",
});
```

`annotatePageProps` and `annotateRequestPayload` are nested together when a single action needs both — again, generated automatically:

```typescript
export const store = annotateRequestPayload<StorePostRequest>()(
  annotatePageProps<StorePageProps>()(
    defineRoute({
      name: "inertia-form-request.store",
      url: "/inertia-form-request",
      methods: ["post"] as const,
      component: "InertiaFormRequest/Success",
    }),
  ),
);
```

## Filtering & Excluding Routes

- **`#[TsExclude]`** on a controller class excludes the whole controller; on a single action method, it excludes just that route.
- **`routes.only` / `routes.except`** — arrays of route-name patterns supporting wildcards (`'posts.*'`) and negation (`'!posts.index'`). Only one of the two should be set.
- **`routes.exclude_middleware`** — skip any route behind the listed middleware.
- **`routes.only_named`** — when `true`, only routes with an explicit `->name(...)` are published.

```php
// config/ts-publish.php
'routes' => [
    'only' => ['posts.*', '!posts.destroy'],
    'exclude_middleware' => ['throttle'],
],
```

## Casing

`routes.method_casing` (`'camel'` (default), `'snake'`, or `'pascal'`) controls the casing of each exported action's identifier — it does not affect the Laravel route name, only the generated variable name.

## Configuration Reference

The full list of `routes.*` and `inertia.*` config keys — including pipeline class overrides for advanced customization — lives in the [Configuration Reference](./configuration-reference.md).

## Type Reference

Exported from `@tolki/ts` (runtime) and `@tolki/types` (types only):

| Export                                                                                    | Description                                                                                          |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `defineRoute()`                                                                           | Builds a route helper from compact metadata.                                                         |
| `annotatePageProps<T>()`                                                                  | Attaches an Inertia page-props phantom type (auto-applied in generated files).                       |
| `annotateRequestPayload<T>()`                                                             | Attaches a FormRequest payload phantom type (auto-applied in generated files).                       |
| `InferPageProps<T>`                                                                       | Reads the page-props type back off a route.                                                          |
| `InferRequestPayload<T>`                                                                  | Reads the request-payload type back off a route.                                                     |
| `setRouteDefaults()`, `addRouteDefault()`, `getRouteDefaults()`, `resetRouteDefaults()`   | Manage global route parameter defaults.                                                              |
| `formSafeOptions()`                                                                       | The `_method`-spoofing helper used internally by `.form.<verb>()` — exposed for advanced manual use. |
| `RouteArgMeta`, `RouteMetadata`, `RouteQueryOptions`                                      | The metadata shapes accepted by `defineRoute()`.                                                     |
| `DefineRouteResult`, `RouteCallResult`, `RouteFormResult`, `RouteCallResultWithComponent` | The shape of a route helper and its call results.                                                    |
