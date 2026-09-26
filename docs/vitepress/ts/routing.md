# Routing

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) generates a TypeScript route helper for every controller action your routes point to. A helper builds the action's URL, binds its parameters, adds query strings and spoofs form methods, so your frontend never hand-writes a URL. The helpers follow [Laravel Wayfinder](https://github.com/laravel/wayfinder)'s conventions and work with Inertia the same way.

The generated files stay small. Each action is one call to [`defineRoute`](#anatomy-of-defineroute), and the URL-building logic lives once in the `@tolki/ts` runtime instead of being repeated for every route. Install `@tolki/ts` alongside the Laravel package, as [Installation & Usage](./index.md) describes.

This is how you call the helper generated for a `PostController`:

```typescript
import { PostController } from "@js/types/data/app/http/controllers";

PostController.update({ post: 42 }); // { url: '/posts/42', method: 'put' }
PostController.update(post); // pass a Post object directly
PostController.update.form({ post: 42 }); // { action: '/posts/42?_method=PUT', method: 'post' }
```

## How Routes Are Generated

The package writes one TypeScript file for each controller that has at least one publishable route. The files follow these rules:

- **One file per controller**: the path comes from the namespace, so `App\Http\Controllers\PostController` becomes `app/http/controllers/post-controller.ts`.
- **One export per action**: each action is a `const` named after the controller method, not the Laravel route name. The file's `default` export holds every action, keyed by method name.
- **Reserved words**: a method named after a JavaScript reserved word, such as `delete`, is exported as `deleteMethod`. The default export still keys it as `delete`, so `ItemController.delete()` works.
- **Duplicate routes**: when several routes point at the same controller method, you get one export. A named route wins over an unnamed one.
- **`HEAD` routes**: Laravel registers `HEAD` for every `GET` route, so a `GET` helper also has `.head()` and `.form.head()`.
- **Skipped routes**: a route defined with a closure has no controller, so it gets no helper. Fallback routes get none either.
- **Excluded actions**: `#[TsExclude]` on a controller or a method leaves it out. See [Filtering & Excluding Routes](#filtering-excluding-routes).

Each namespace directory gets an `index.ts` barrel. Unlike the barrels for models, enums and resources, a route barrel re-exports only each controller's default export. That keeps controllers that share method names, such as `index` and `show`, from colliding:

```typescript
// app/http/controllers/index.ts
export { default as PostController } from "./post-controller";
export { default as UserController } from "./user-controller";
```

An invokable controller exports its `__invoke` action as the default, so you call the controller itself. If other methods on it have routes too, they're properties of that default, such as `DashboardController.refresh()`:

```typescript
import DashboardController from "@js/types/data/app/http/controllers/dashboard-controller";

DashboardController(); // { url: '/dashboard', method: 'get' }
```

## Anatomy of `defineRoute`

Each action in a generated file is one `defineRoute()` call:

```typescript
export const show = defineRoute({
  name: "posts.show", // the Laravel route name, left out when the route has none
  url: "/posts/{post}", // the URI template, or {domain}{uri} for a domain route
  domain: "api.example.com", // only on a domain-restricted route
  methods: ["get", "head"] as const,
  args: [{ name: "post", required: true, _routeKey: "id" }] as const,
  component: "PostShow", // only on an Inertia route
});
```

`defineRoute()` returns a callable object with these members:

| Member                                             | Description                                                                                                                                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `route(...)`                                       | Returns `{ url, method }` for the route's primary (first declared) HTTP method.                                                                                                                           |
| `route.url(...)`                                   | Takes the same arguments and returns only the URL string.                                                                                                                                                 |
| `route.get(...)`, `route.post(...)`, …             | One method per declared HTTP verb, each returning `{ url, method }` for that verb.                                                                                                                        |
| `route.form(...)`                                  | Builds `{ action, method }` for an HTML `<form>`. See [Building Forms](#building-forms).                                                                                                                  |
| `route.form.put(...)`, `route.form.delete(...)`, … | Form variants per verb, with Laravel's `_method` spoofing added.                                                                                                                                          |
| `route.definition`                                 | The metadata object passed to `defineRoute()`.                                                                                                                                                            |
| `route.component`, `route.withComponent(...)`      | On an Inertia route only. See [Inertia Integration](#inertia-integration).                                                                                                                                |
| `route.toString()`                                 | Returns the URL built with no arguments, so `` `${PostController.index}` `` works in a template literal. A route with a required parameter throws, unless a [route default](#route-defaults) supplies it. |
| `route(...).toString()`                            | Returns the call's URL, so `` `${PostController.show(42)}` `` gives `/posts/42`.                                                                                                                          |

## Calling a Route

Every helper accepts the same calling conventions, so use whichever reads best at the call site:

```typescript
// Named object
PostController.show({ post: 42 });

// Positional arguments
PostController.show(42);

// Positional array
PostController.show([42]);

// An object with an `id` or the route's binding key
PostController.show(post); // post = { id: 42, title: '...' }
```

A route with several parameters takes them the same ways, by position or by name:

```typescript
UserPostController.show({ user: 2, post: 42 });
UserPostController.show(2, 42);
UserPostController.show([2, 42]);
UserPostController.show(someUser, somePost);
```

::: tip Passing a Single Object
A lone object such as `PostController.show(post)` works only for a route with exactly one parameter. The object needs an `id`, a `_routeKey`, or the property the route binds by, such as `slug`.
:::

### Trailing Query Options

Every calling convention accepts a trailing object whose keys become query parameters. See [Query Parameters](#query-parameters) for how values are encoded:

```typescript
PostController.show.url(42, { preview: true }); // '/posts/42?preview=1'
PostController.show.url({ post: 42 }, { preview: true }); // '/posts/42?preview=1'
```

A helper treats the last argument as options only when you pass more arguments than the route has parameters. That last argument also has to be a plain object that holds none of the route's parameter names.

## Model Binding

When a route parameter is type-hinted with an Eloquent model, its `args` entry gets a `_routeKey`. That key names the column the model binds by, as in Laravel's [route model binding](https://laravel.com/docs/routing#route-model-binding):

```typescript
// Route::get('/slug-posts/{slugPost:slug}', ...)
args: [{ name: "slugPost", required: true, _routeKey: "slug" }] as const,
```

At the call site, pass the key's value or the model object. The helper reads the property `_routeKey` names, falls back to `id`, and throws when the object has neither:

```typescript
CustomRouteKeyController.show({ slugPost: "hello-world" });
CustomRouteKeyController.show(post); // post = { slug: 'hello-world', ... }
```

The parameter's type comes from the `args` metadata alone. It accepts the key's value, or any object with that key or an `id`, so binding a model never imports the model's TypeScript type into the route file. A route file imports a model type only when an Inertia page prop names it, as [Inertia Integration](#inertia-integration) shows.

The key is the one Laravel binds by. A `{post:slug}` segment names it directly. Otherwise it's whatever the model's `getRouteKeyName()` returns, so overriding `getRouteKeyName()`, `getKeyName()` or `$primaryKey` changes it. So does the Laravel 13 `#[RouteKey('slug')]` attribute on its own. See [Laravel 13 Model Attributes](./models.md#laravel-13-model-attributes).

## Enum Binding

A route parameter type-hinted with a [backed enum](https://www.php.net/manual/en/language.enumerations.backed.php) gets the enum's backing values instead of a route key:

```typescript
args: [{ name: "status", required: true, _enumValues: [0, 1] }] as const,
```

Pass a backing value, or any object with a `value` property, such as a case resolved from a `defineEnum()` enum:

```typescript
EnumBoundController.byStatus({ status: 0 }); // a backing value
EnumBoundController.byStatus({ status: Status.Active }); // an enum case value
EnumBoundController.byStatus({ status: Status.from(0) }); // a defineEnum() instance
```

As with model binding, the route file imports no enum, because TypeScript infers the allowed values from `_enumValues`. A parameter typed with a pure enum, one with no backing values, is a plain parameter that takes any string or number.

## Optional Parameters & `where` Constraints

A `{param?}` segment becomes an optional parameter in both the named and positional forms:

```typescript
export const show = defineRoute({
  url: "/optional/{param?}",
  methods: ["get", "head"] as const,
  args: [{ name: "param", required: false }] as const,
});

OptionalParamController.show.url(); // '/optional'
OptionalParamController.show.url({ param: "x" }); // '/optional/x'
```

A parameter constrained with `->where(...)` carries its pattern, and the helper throws when a value doesn't match:

```typescript
// args: [{ name: "id", required: true, where: "[0-9]+" }]
TypedParamController.showInt({ id: "abc" });
// Error: Route error: 'id' parameter 'abc' does not match required format '[0-9]+'.
```

## Domain Routes

A route restricted to a domain gets a `domain` field. Its URL is protocol-relative, so it works in `fetch()` or an `<a href>` with whatever protocol the current page uses:

```typescript
export const index = defineRoute({
  url: "api.example.com/domain",
  domain: "api.example.com",
  methods: ["get", "head"] as const,
});

DomainController.index.url(); // '//api.example.com/domain'
```

## Query Parameters

An argument key that doesn't match a route parameter becomes a query parameter:

```typescript
PostController.index.url({ q: "search", page: 2 }); // '/posts?q=search&page=2'
```

Values are encoded the way Laravel reads query input:

- **Booleans**: `true` and `false` become `1` and `0`.
- **Arrays**: indexed keys, as in `tags[0]=a&tags[1]=b`.
- **Objects**: bracketed keys, as in `filter[status]=active`.
- **`null` and `undefined`**: left out of the query string.

When a query key has the same name as a route parameter, put it under `_query`:

```typescript
PostController.index.url({ sort: "created_at", _query: { sort: "desc" } });
// '/posts/sort/created_at?sort=desc'
```

To change one key of the current page's query string and keep the rest, pass `mergeQuery`. A `null` or `undefined` value removes that key. On a route with parameters, pass `mergeQuery` in the trailing options object:

```typescript
// current URL: /posts?sort=name&page=3
PostController.index.url({ mergeQuery: { page: 1 } });
// '/posts?sort=name&page=1'

PostController.show.url({ post: 42 }, { mergeQuery: { tab: "comments" } });
```

## Route Defaults

As with Laravel's [`URL::defaults()`](https://laravel.com/docs/urls#default-values), you can set a parameter value once. Every helper then uses it wherever that parameter is required but not passed:

```typescript
import { setRouteDefaults, addRouteDefault } from "@tolki/ts";

setRouteDefaults({ locale: "en" });
addRouteDefault("locale", "fr"); // overwrite a single key
```

`setRouteDefaults()` also accepts a function, which runs each time a helper builds a URL. `getRouteDefaults()` returns the current defaults, and `resetRouteDefaults()` clears them, which helps in test setup and teardown.

## Building Forms

`.form(...)` builds `{ action, method, toString() }` for a classic HTML `<form>`. HTML forms submit only `GET` and `POST`, so `method` is always `'get'` or `'post'`. As in Wayfinder, the bare call spoofs the route's primary method for you:

```typescript
const { action, method } = PostController.store.form();
// action: '/posts', method: 'post'

PostController.update.form({ post: 42 });
// { action: '/posts/42?_method=PUT', method: 'post' }, spoofing the primary PUT

PostController.destroy.form({ post: 42 });
// { action: '/posts/42?_method=DELETE', method: 'post' }, spoofing the primary DELETE
```

Use a per-verb variant only when a route accepts several verbs and you want to submit as one that isn't its primary. The variants are `.form.put(...)`, `.form.patch(...)`, `.form.delete(...)`, `.form.get(...)` and `.form.head(...)`:

```typescript
// A route registered for PUT and PATCH, with PUT as its primary method
PostController.update.form(); // spoofs _method=PUT
PostController.update.form.patch({ post: 42 }); // spoofs _method=PATCH instead
```

`GET` and `POST` never get a `_method`, since HTML forms support both. `.form.head(...)` submits as a `'get'` form with `_method=HEAD`, because a form can't send `HEAD`.

## Inertia Integration

With `inertia.enabled` on (the default), each action that renders an Inertia page gets a `component` field and a page-props type. The generated file applies the typing helpers for you:

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

The package reads `Inertia::render()`, the `inertia()` helper and `inertia()->render()`. The component name has to be a string literal, so a render call that builds the name at runtime gets no `component` field or page-props type. Only Inertia responses are typed. An action that returns JSON or a view gets a route helper with no response type.

`Inertia.SharedData` holds the props your middleware shares with every page. See [Inertia](./inertia.md) for how the package types it.

Read the page-props type back with `InferPageProps<typeof route>`, for example to type a page component's props without a separate import:

```typescript
import type { InferPageProps } from "@tolki/ts";
import { post } from "@js/types/data/app/http/controllers/inertia-controller";

type Props = InferPageProps<typeof post>; // PostPageProps
```

### Conditional (Multi-Component) Routes

An action that renders different components on different branches, for example by auth state, gets a `component` map and a union of page-props types:

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

Each map key is the component's last path segment, cased by `inertia.component_casing` (camel by default). When two components share a last segment, the keys take in more of the path until they differ.

`route.component` holds the whole map. `route.withComponent(component, ...args)` returns the call result with a `component` key. Use it to record which variant a call represents, for logging or for picking the frontend component to render. It takes a value from the map, such as `'Conditional/Authenticated'`, not a key. On a single-component route, `route.component` is the name, and `route.withComponent(...args)` takes only the route arguments.

Two renders of the same component merge into one page-props type instead of a union. A key that only one of them sets becomes optional, since that branch leaves it out.

### What the Props Expression Can Be

The package reads the props argument as an expression, not only as an array literal, so common controller code types without annotations:

```php
public function show(Post $post, Request $request): Response
{
    return Inertia::render('Posts/Show', [
        'post' => $post,
        'comments' => Comment::query()->latest()->get(),
        'author' => $request->user(),
        'page' => $request->integer('page'),
        'related' => Post::query()->paginate(10),
        'tally' => Inertia::defer(fn () => Comment::query()->count()),
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

These expressions are typed:

- **Eloquent finders and collections**, typed from the model the chain starts at. `find()`, `first()` and `firstWhere()` are `Model | null`. `findOrFail()`, `firstOrFail()`, `sole()`, `create()`, `make()`, `firstOrCreate()`, `firstOrNew()` and `updateOrCreate()` are `Model`. `all()` and `get()` are `Model[]`. `paginate()`, `simplePaginate()` and `cursorPaginate()` are `LengthAwarePaginator<Model>`, `SimplePaginator<Model>` and `CursorPaginator<Model>`, imported from `@tolki/types`. `count()` is `number` and `exists()` is `boolean`.
- **Route-bound model parameters**: a `Post $post` parameter is `Post` wherever a prop uses it.
- **PHP enums**: a prop holding an enum is the enum's `{Name}Type` alias, imported from the generated [enums](./enums.md). A rename with [`#[TsEnum]`](./enums.md#tsenum) carries over, so `#[TsEnum(name: 'Size')] enum ShirtSize` gives you `size: SizeType`.
- **`$request->user()`**, typed through your `auth` config the same way [shared data](./inertia.md) is, and the typed `Request` reads such as `integer()`, `boolean()`, `string()` and `url()`.
- **`compact()` and `array_merge()`**: passed as the whole props argument, as in `Inertia::render('Posts/Show', compact('post', 'comments'))` or `array_merge($base, [...])`, each types the same as the array literal it builds.
- **Inertia v2 prop wrappers**: `defer()`, `optional()` and `lazy()` type as the value they wrap and make the key optional, since a partial reload can leave it out. `always()`, `merge()` and `deepMerge()` type as the value they wrap.
- **API resources and resource collections**, typed from what they wrap, including a `#[PreserveKeys]` collection's keyed `data` member.
- **A props array assigned from a ternary**, or props built whole by a method on an injected service, as in `Inertia::render('Posts/Show', $this->service->build())`.

::: warning Two Enums With the Same Class Name
If two enums in different namespaces share a class name, such as `App\Enums\Status` and `App\Billing\Status`, both publish as `StatusType`. A route file whose props use both imports `StatusType` twice, and TypeScript rejects it as a duplicate identifier. Rename one with `#[TsEnum]` to keep them apart.
:::

A prop the package can't read is typed `unknown`, and the run carries on. Use [`#[TsCasts]`](#overriding-props-with-tscasts) to set its type.

Sometimes the package can't analyze an action at all, for example because a class the action depends on fails to load. That route then publishes as a plain helper with no page-props type, and `ts:publish` names the action in a warning after the run. The rest of the run still finishes.

### Overriding Props With `#[TsCasts]`

When the package can't see the type you want, add `#[TsCasts]` to the controller method. Each key replaces that prop's type, and a key the render call doesn't set is added. The other props keep their inferred types:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

#[TsCasts([
    'stats' => '{ views: number; likes: number }',
    'meta' => ['type' => 'PageMeta', 'import' => '@/types/pages'],
])]
public function index(): Response
{
    return Inertia::render('Dashboard', [
        'title' => 'Dashboard',
        'stats' => $this->legacyStats(),
    ]);
}
```

The `import` key writes the import line into the route file:

```typescript
import type { PageMeta } from "@/types/pages";

export type IndexPageProps = Inertia.SharedData & {
  title: string;
  stats: { views: number; likes: number };
  meta: PageMeta;
};
```

## Inertia UI Table Props

A route that renders an [Inertia UI Table](https://inertiaui.com/) gets a typed page prop. The package reads the table's model from the table class itself, and never creates the table or calls its `toArray()`:

```php
use App\Tables\PostTable;
use Inertia\Inertia;

public function index()
{
    return Inertia::render('Posts/Index', [
        'posts' => PostTable::make()->defaultSort('-id'),
    ]);
}
```

The page prop is `TableResource<TModel>` for the table's model:

```typescript
import type { TableResource } from "@inertiaui/table-vue";
import type { Post } from "../models";

export type IndexPageProps = Inertia.SharedData & {
  posts: TableResource<Post>;
};
```

`TableResource` is imported from whichever Inertia UI Table package your `package.json` lists, `@inertiaui/table-vue` or `@inertiaui/table-react`. If neither is listed, the import uses `@inertiaui/table-vue`. To force a package, or to use an alias, set `inertia.ui_table_package` in `config/ts-publish.php`.

The package finds a table's model in any of these places:

- A `$resource` property default, as in `protected ?string $resource = Post::class;`.
- A `query(): Builder` method that returns `Post::query()`, `Post::class`, or a query chain that starts at the model.
- A service method: when the controller passes `$this->tables->index($request)`, the array that method returns can hold table props.

A table whose model exists only at runtime, for example one set in its constructor, gets no table type. Use [`#[TsCasts]`](#overriding-props-with-tscasts) on the controller method to type its props.

## Sibling Actions on a Table Controller

A controller that renders a table needs no special handling, and neither do its other actions. Each action, such as `create`, `store`, `edit` or `update`, gets its page-props type from its own render call, the same as on a controller with no table.

Because the package never creates a table or calls its `toArray()`, publishing never reaches the table's optional Excel (PhpSpreadsheet) export.

## Form Request Payload Types

With `form_requests.enabled` on (the default), an action whose method type-hints a `FormRequest` gets that request's [generated interface](./form-requests.md) attached with `annotateRequestPayload`:

```typescript
export const store = annotateRequestPayload<StorePostRequest>()(
  defineRoute({
    name: "posts.store",
    url: "/posts",
    methods: ["post"] as const,
  }),
);
```

Read it back with `InferRequestPayload<typeof route>`, for example to type an Inertia `useForm()` call:

```typescript
import type { InferRequestPayload } from "@tolki/ts";
import { store } from "@js/types/data/app/http/controllers/post-controller";

const form = useForm<InferRequestPayload<typeof store>>({
  title: "",
  body: "",
});
```

When an action has both a page-props type and a request payload, the generated file nests the two helpers:

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

These settings leave routes out of the published output:

- **`#[TsExclude]`**: on a controller class it excludes every action. On a method it removes that one route, with no helper and no page-props type.
- **`routes.only` and `routes.except`**: route-name patterns with wildcards (`'posts.*'`) and negation (`'!posts.index'`). A negated pattern beats a matching one, and a list of negations alone matches every name it doesn't negate. `routes.only` matches names, so it never includes an unnamed route. If you set both, `routes.only` wins and `routes.except` is ignored.
- **`routes.exclude_middleware`**: skips every route that uses one of the listed middleware. An entry has to match the middleware exactly as the route declares it, so `'throttle'` doesn't match `'throttle:api'`.
- **`routes.only_named`**: when `true`, publishes only the routes that have a `->name(...)`.

This config publishes the `posts.*` routes except `posts.destroy`, and skips any route behind the `internal` middleware:

```php
// config/ts-publish.php
'routes' => [
    'only' => ['posts.*', '!posts.destroy'],
    'exclude_middleware' => ['internal'],
],
```

See [Excluding Content](./excluding-content.md) for `#[TsExclude]` across every feature.

## Casing

`routes.method_casing` sets the casing of each action's exported name: `'camel'` (the default), `'snake'` or `'pascal'`. Any other value keeps the method name as written. The setting changes only the generated name, never the Laravel route name, and the default export still keys each action by its PHP method name.

## Configuration Reference

The [Configuration Reference](./configuration-reference.md) lists every `routes.*` and `inertia.*` key, including the class overrides for customizing the pipeline.

## Type Reference

The functions come from `@tolki/ts`. The types come from `@tolki/ts` or the types-only `@tolki/types`:

| Export                                                                                    | Description                                                                                                             |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `defineRoute()`                                                                           | Builds a route helper from route metadata.                                                                              |
| `annotatePageProps<T>()`                                                                  | Attaches an Inertia page-props type to a route. Generated files apply it for you.                                       |
| `annotateRequestPayload<T>()`                                                             | Attaches a form request payload type to a route. Generated files apply it for you.                                      |
| `InferPageProps<T>`                                                                       | Reads a route's page-props type.                                                                                        |
| `InferRequestPayload<T>`                                                                  | Reads a route's request payload type.                                                                                   |
| `setRouteDefaults()`, `addRouteDefault()`, `getRouteDefaults()`, `resetRouteDefaults()`   | Manage the global route parameter defaults.                                                                             |
| `formSafeOptions()`                                                                       | Adds `_method` spoofing to a set of query options. `.form()` uses it, and you can call it for a form you build by hand. |
| `RouteArgMeta`, `RouteMetadata`, `RouteQueryOptions`, `RouteComponentType`                | The metadata shapes `defineRoute()` accepts.                                                                            |
| `DefineRouteResult`, `RouteCallResult`, `RouteFormResult`, `RouteCallResultWithComponent` | The shapes of a route helper and its call results.                                                                      |
