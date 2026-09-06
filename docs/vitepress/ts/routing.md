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
- Every `GET` route also carries `HEAD` in `methods` (Laravel registers `HEAD` implicitly for every `GET` route), so `.head(...)` and `.form.head(...)` are generated alongside `.get(...)` and `.form.get(...)`.
- A method decorated with `#[TsExclude]` (or a controller class decorated with it) is skipped entirely — see [Filtering & Excluding Routes](#filtering--excluding-routes).

## Anatomy of `defineRoute`

Every generated action looks like this:

```typescript
export const show = defineRoute({
  name: "posts.show", // Laravel route name, or omitted if unnamed
  url: "/posts/{post}", // URI template (or `{domain}{uri}` for domain routes)
  domain: "api.example.com", // only present for domain-restricted routes
  methods: ["get", "head"] as const,
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

The column named by `_routeKey` comes from whatever `getRouteKeyName()` returns for that model,
whether that's the method itself overridden, `getKeyName()`/`$primaryKey` overridden, or (Laravel 13+)
a model carrying only the `#[RouteKey('slug')]` class attribute with no method override at all — see
[Models § Laravel 13 Model Attributes](./models.md#laravel-13-model-attributes).

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
  methods: ["get", "head"] as const,
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
  methods: ["get", "head"] as const,
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

Per-verb form methods (`.form.put(...)`, `.form.patch(...)`, `.form.delete(...)`, `.form.get(...)`, `.form.head(...)`) are only needed when a route supports multiple verbs and you want to submit as one that isn't the primary one:

```typescript
// A route registered for both PUT and PATCH — primary is 'put'
PostController.update.form(); // spoofs _method=PUT (primary)
PostController.update.form.patch({ post: 42 }); // explicitly spoofs _method=PATCH instead
```

`GET`/`POST` routes never get a spoof added, since HTML forms natively support both. `HEAD` submits as a `'get'` form action with `_method=HEAD` injected, since HTML forms can't submit `HEAD` directly.

## Inertia Integration

When `inertia.enabled` is on in the Laravel package's config, each action that renders an Inertia response automatically gets a `component` field and a page-props type — you never call the annotation helpers yourself, they're already applied in the generated file:

```typescript
export type PostPageProps = Inertia.SharedData & { post: Post };

export const post = annotatePageProps<PostPageProps>()(
  defineRoute({
    name: "inertia.post",
    url: "/inertia/post/{post}",
    methods: ["get", "head"] as const,
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
  user: User | null;
};
export type ConditionalGuestPageProps = Inertia.SharedData & {
  message: string;
};

export const conditional = annotatePageProps<
  ConditionalAuthenticatedPageProps | ConditionalGuestPageProps
>()(
  defineRoute({
    url: "/inertia/conditional",
    methods: ["get", "head"] as const,
    component: {
      authenticated: "Conditional/Authenticated",
      guest: "Conditional/Guest",
    } as const,
  }),
);
```

`route.component` gives you the whole map, and `route.withComponent(componentValue, ...args)` tags a call result with a specific variant (it accepts one of the _values_ from the map, e.g. `'Conditional/Authenticated'`, not the key) — useful for logging or for selecting which frontend component to render based on which variant a given call represents.

Two renders of the **same** component are merged into one page-props type instead of a union, and a key that only one of them sets becomes optional — which is what you want, since a partial branch really can omit it.

### What the props expression can be

The props argument is read as an expression, not just as a literal array, so the common controller shapes type without an annotation:

```php
public function show(Post $post, Request $request): Response
{
    $comments = Comment::query()->latest()->get();

    return Inertia::render('Posts/Show', [
        ...compact('post', 'comments'),
        'author'  => $request->user(),
        'page'    => $request->integer('page'),
        'related' => Post::query()->paginate(10),
        'tally'   => Inertia::defer(fn () => Comment::query()->count()),
    ]);
}
```

```typescript
export type ShowPageProps = Inertia.SharedData & {
  post: Post;
  comments: Comment[];
  author: User | null;
  page: number;
  related: LengthAwarePaginator<Post>;
  tally?: number;
};
```

- **Eloquent finders and collections** from the model their chain is rooted at: `find()`, `first()` and `firstWhere()` are `Model | null`; `findOrFail()`, `sole()`, `create()` and friends are `Model`; `all()` and `get()` are `Model[]`; `paginate()`, `simplePaginate()` and `cursorPaginate()` are the matching paginator generic; `count()` and `exists()` are `number` and `boolean`.
- **Route-bound model parameters** — a `Post $post` parameter is `Post` wherever the props name it.
- **`$request->user()`**, resolved through your `auth` config the same way [shared data](./inertia.md) resolves it, plus the typed `Request` reads (`integer()`, `boolean()`, `string()`, `url()`, …).
- **`compact('post', 'comments')`** and **`array_merge($base, [...])`**, each read as the array literal it is equivalent to.
- **The Inertia v2 prop wrappers** — `defer()`, `optional()` and `lazy()` type as the value they wrap and mark the key optional, since a partial reload can omit it; `always()`, `merge()` and `deepMerge()` type as the value they wrap.
- **API resources and resource collections**, typed from what they wrap, including a `#[PreserveKeys]` collection's keyed `data` member.
- **A props array assigned from a ternary**, and props delegated whole to a collaborator (`Inertia::render('X', $this->service->build())`).

An expression the analyzer cannot resolve types as `unknown` rather than failing the run; reach for `#[TsCasts]` when you want to say what it is.

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

## Sibling Actions on a Table Controller

A controller that renders a table needs no special handling, and neither do its other actions. Table
props are read by reflection and AST alone — the table class's `$resource` default or its `query()`
method — so `ts:publish` never instantiates a table or calls its `toArray()`, which is what builds the
export definition that reaches the optional Excel/PhpSpreadsheet integration. Every action on the
controller (`create`, `store`, `edit`, `update`) gets its page-prop type inferred from its own
`Inertia::render()` call, exactly like a controller with no table in it.

Earlier releases were not able to do this. A controller that mentioned a table anywhere — even in an
unrelated sibling action — had deep analysis skipped for all of its actions, so those routes got a
route helper but no `PageProps` type. That fallback is gone.

### Overriding Props with `#[TsCasts]`

Whenever the analyzer cannot see the shape you want — a dynamic table whose model only exists in
runtime constructor state, a prop assembled somewhere the static read cannot follow — annotate the
method with `#[TsCasts([...])]` and the page-prop type is built from your cast map instead:

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

If you don't want a route helper generated at all, annotate the method with `#[TsExclude]`. This
removes the route from the published output entirely — no route helper and no page-prop type. Use this
only when the route should not appear in the TypeScript output.

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
