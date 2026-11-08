---
url: /ts/inertia.md
---
# Inertia

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) reads the `share()` method of your `HandleInertiaRequests` middleware and writes `inertia-config.d.ts`. That file declares a global `Inertia.SharedData` type and augments `@inertiajs/core`, so every Inertia page gets typed shared props without a type you maintain by hand.

This page covers shared data, and the API resources that shared data and a route's page props hold. A route's own page props, meaning the `component` field and the page-props type on its route helper, are covered in [Inertia Integration](./routing.md#inertia-integration) on the Routing page.

## How the Augmentation File Is Generated

With `inertia.enabled` on (the default), the package builds the file from your middleware:

* **Finding the middleware**: the package searches `inertia.inertia_middleware_path`, or `app_path()` when that isn't set, for a class that extends `Inertia\Middleware`. If it finds none, it writes no file. If your app has more than one such class, point `inertia.inertia_middleware_path` at the directory that holds the one you want.
* **Reading `share()`**: every key's value is typed from your code, without handling a real request. A `share()` that a trait supplies is read too, even under an alias such as `use SharesProps { base as share; }`, and so is one that builds its array in a variable and returns it. A key that the variable gets on only some paths, such as inside an `if`, is optional.
* **Parent middleware**: a `...parent::share($request)` spread and `array_merge(parent::share($request), [...])` are both read, all the way up your middleware's parent classes. A later key overrides an earlier one and keeps the earlier one's position, as PHP does. A parent's `#[TsCasts]` applies too, as [Type Resolution Priority](#type-resolution-priority) describes.
* **Dotted keys**: Inertia unpacks a top-level dotted key into nested objects, so `'auth.name' => $request->user()?->name` publishes `auth: { name: string | null }`. When the array also holds an `auth` array, `name` is added to it.
* **Integer keys**: Inertia merges shared data and page props with `array_merge()`, which renumbers integer keys from `0`. A top-level `42 => …` key therefore publishes as `"0"`, and `ts:publish` warns that you probably meant a string key. Nested keys keep theirs.
* **The signed-in user**: `$request->user()` is typed through your live auth config, from `auth.defaults.guard` to that guard's provider to the provider's `model`. The prop becomes `User | null`, and the file imports the model's type for you. `auth()->user()`, `Auth::user()`, `request()->user()` and `Auth::guard()->user()` resolve the same way, and so does a read past any of them, such as `auth()->user()?->name`, which publishes `string | null`. `auth()->id()` and `Auth::id()` publish the user's key, as described below.
* **Request helpers**: `$request->url()`, `fullUrl()`, `path()`, `integer()`, `boolean()`, `string()`, `cookie()` and `hasCookie()` are typed from Laravel's own signatures.
* **`config()`**: `config('some.key')` with a literal key is typed from the live config value, since the package runs inside your booted app. A computed key stays `unknown`.
* **Value helpers**: `now()` and `today()` are typed as `string`, or `Date` under [`timestamps_as_date`](./models.md#timestamps-as-date-objects). `str($value)` is typed as `string`, and `str()` with no argument as `Record<string, never>`. `url($path)` is typed as `string` when the path can't be `null`, and stays `unknown` when it can or has no type. `collect([...])` and a bare array literal are both typed as the list or object the array encodes as, such as `string[]` for `['a', 'b']`. `+` on two arrays is typed as PHP's array union, where the left side's keys win.
* **Closures and first-class callables**: Inertia calls a callable prop before it sends it, so closures and first-class callables, such as `fn () => $request->url()` and `now(...)`, are typed from what the call returns. That includes one inside an array that a helper method builds.
* **Inertia v2 prop wrappers**: `Inertia::defer()`, `optional()`, `lazy()`, `always()`, `merge()` and `deepMerge()` type as the value they wrap, and so does a prop class you construct, such as `new OptionalProp(fn () => …)`. The three a partial reload can leave out, `defer`, `optional` and `lazy`, make the key optional.
* **API resources**: a resource or resource collection is typed as the response Inertia sends for it, as [API Resources in Props](#api-resources-in-props) describes.
* **`EnumResource` props**: a prop that wraps an enum in `EnumResource`, such as `'role' => EnumResource::make(Role::Admin)`, becomes `AsEnum<typeof Role>` when `enums.use_tolki_package` is on (the default), the same as in [API Resources](./api-resources.md#enum-properties-with-enumresource). With it off, the key keeps the enum's type alias (`role: RoleType`). The change applies per key, so another key that reads the enum directly keeps `RoleType`.
* **`EnumResource` ternaries and `null`**: each arm of a ternary is typed as Laravel sends it. Wrapping two different enums publishes `AsEnum<typeof Role> | AsEnum<typeof Status>`, and a wrap beside a bare case of the same enum publishes `AsEnum<typeof Status> | StatusType`. A wrap around an enum that may be `null` publishes `AsEnum<typeof Status> | never[]`, because Inertia sends `[]` for it, not `null`. Tell the two apart with `Array.isArray()`.
* **Enum cases**: a bare case, such as `'defaultStatus' => Status::Draft`, is typed as the enum's type alias (`defaultStatus: StatusType`), which matches the value Laravel sends for a backed enum. The file imports the alias for you.
* **Classes with `#[TsType]`**: a value of a class that has or inherits a `#[TsType]` is typed as that type, with its import, in shared data and page props alike. See [Custom Types](./custom-types.md).
* **`errors`**: left out. `@inertiajs/core` already types `page.props.errors` as `Errors & ErrorBag`, and [`errorValueType`](#anatomy-of-the-generated-file) sharpens it. A `#[TsCasts]` or `@return` docblock entry named `errors` still adds one if you want it.
* **The output file**: the result is written to `inertia-config.d.ts`. Set `inertia.augmentation_filename` to change the name.

`auth()->id()` and `Auth::id()` publish the type of the column the auth model identifies users by, with `| null`. That's the model's key, such as `number | null`, unless the model's `getAuthIdentifierName()` returns a literal column name. A model whose `getAuthIdentifierName()` returns `'email'` publishes `string | null`. An identifier column cast to an enum publishes `unknown`.

When the package can't create an instance of the model, it reads the key type from the class, and publishes `unknown` if code works the key out. A `getAuthIdentifierName()` that works the column out in code, such as from config, publishes `unknown` too, and so does an override of `getAuthIdentifier()`, since only running your app shows which value the ID holds.

The signed-in user is typed from the default guard only, so a named guard, such as `auth('admin')->user()` or `Auth::guard('admin')->user()`, publishes `unknown`. When your guards' providers name more than one user model, a route's guard middleware can sign in either one, so `request()->user()`, `Auth::guard()->user()` and a read past `auth()->user()`, `Auth::user()` or `request()->user()` publish `unknown` too. `$request->user()`, a bare `auth()->user()` or `Auth::user()`, `auth()->id()` and `Auth::id()` keep the default guard's model. Type such a key with [`#[TsCasts]`](#type-resolution-priority).

In a route's [page props](./routing.md#inertia-integration), `getKey()` on a route-bound model publishes the model's key type with no `| null`, because Laravel binds only a saved row. With a `Post $post` action parameter, `'post_id' => $post->getKey()` publishes `post_id: number`. A relation read on the parameter is typed by the models it loads, so `'comments' => $post->comments` publishes `comments: Comment[]`.

::: warning Some `EnumResource` Mixes
A few mixes of `EnumResource` arms publish a type that doesn't match what Laravel sends. A wrap beside a bare case of another enum, as in `$cond ? EnumResource::make(Role::Admin) : Status::Draft`, publishes `RoleType | StatusType`, though the first arm sends the `Role` object. A nested ternary over the wraps of three enums can leave a type alias unimported, which fails your build with `TS2304`. Override such a key with a `#[TsCasts]` entry that has an `import`.
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

* **`import type { User } from "./app/models";`**: every model, resource or enum that a prop type names gets an import at the top, with a path relative to the output root. An `EnumResource` prop is the exception under the default `enums.use_tolki_package`. It renders as `AsEnum<typeof Role>`, so the enum's const is imported as a value (`import { Role } from './app/enums';`), under an `import { type AsEnum } from '@tolki/ts';` line, and both come before the `import type` lines. Imports from an `import` key in `#[TsCasts]` join the `import type` lines. Two classes that share a name, such as `App\Enums\Status` and `App\Crm\Enums\Status`, are imported under aliases, as in `StatusType as CrmStatusType`.
* **`declare global { namespace Inertia { type SharedData = ...; } }`**: makes `Inertia.SharedData` available by name in any `.ts` file in your project. That includes the generated route files, which combine it with each page's props, as [Inertia Integration](./routing.md#inertia-integration) shows.
* **`declare module '@inertiajs/core' { ... }`**: augments Inertia's own `InertiaConfig`, so `usePage().props` is typed across your frontend without you writing the augmentation.
* **`errorValueType: string[]`**: added only when the middleware sets `protected $withAllErrors = true;`. It matches the shape Inertia uses for its validation errors in that mode.
* **`export {};`**: TypeScript accepts a `declare global` block only in a module, a file with at least one top-level `import` or `export`. This line makes the file a module even when it has no imports.

The file imports only the names its types use. A key you override with `#[TsCasts]` drops the imports its inferred type needed, but keeps the import of a class the override names and the key's value holds. `'owner' => 'User | null'` over `$request->user()` still imports `User`, with no `import` key.

A key that isn't a plain identifier, such as `'can-edit'` or `42`, is quoted, as in `"can-edit": boolean`. Route files quote a page prop's key the same way.

A value the package can't read stays `unknown`. `'flash' => ['success' => fn () => $request->session()->get('success')]` would publish `flash: { success: unknown }`, because `session()` isn't one of the typed request methods. Give such a key its type with [`#[TsCasts]` or a `@return` docblock](#type-resolution-priority).

## Type Resolution Priority

Each key from `share()` takes its type from the first of these that covers it:

1. **`#[TsCasts]`** on the middleware class or on its `share()` method. When both name a key, the method's entry wins, even when the two spell an index signature's name differently. A parent middleware's entries apply too when your middleware inherits the parent's `share()` or reads it through `parent::share()`, and your class's entries win over the parent's. It's the same attribute [models](./models.md#tscasts), [API resources](./api-resources.md#overriding-property-types-with-tscasts) and [broadcast events](./broadcast-events.md#overriding-property-types-with-tscasts) use.
2. **A `@return array{...}` docblock** on `share()`. You write the shape by hand, for a key the package can't infer, such as a method call whose return type says nothing. A `key?:` entry makes that key optional. A model or enum that a top-level key names, as in `owner: User`, is imported for you.
3. **Inference from your code**, the default. It covers plain values, nested arrays, conditionals, closures, spreads, `array_merge()`, `config()`, the request and auth helpers, and Inertia's prop wrappers.

A key that `#[TsCasts]` or the docblock names but `share()` doesn't return is added to the type.

In a `#[TsCasts]` entry, `'optional' => true` adds a `?` and `'optional' => false` removes one. An entry that leaves out `'optional'` takes the flag from the next source down. For an entry on `share()`, that's first the class's entry for the same key, if it sets `'optional'`. Next comes the docblock, where `key?:` makes the key optional and `key:` makes it required. Inference decides a key neither names.

An entry on a controller method for a route's [page props](./routing.md#overriding-props-with-tscasts) takes `'optional'` the same way. Without it, the prop keeps its own `?`.

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

## API Resources in Props

Inertia sends an API resource prop as the resource's whole response, the same JSON a route that returns the resource sends. That holds at any depth of a route's page props and in `share()`, including props that a helper method or another class's method builds, as in `Inertia::render('Posts/Show', $this->props->build())`. Each prop publishes that response:

```php
return Inertia::render('Posts/Show', [
    'post' => new PostResource($post),
    'comments' => CommentResource::collection($post->comments),
    'tags' => new TagCollection($post->tags),
]);
```

The page-props type matches what Inertia sends:

```typescript
export type ShowPageProps = Inertia.SharedData & {
  post: { data: PostResource };
  comments: AnonymousResourceCollection<CommentResource>;
  tags: TagCollection;
};
```

Each kind of prop follows its own rule:

* **A single resource**, from `new`, `make()`, or `toResource()`, publishes `{ data: PostResource }`, because Laravel sends it under the `data` key. Code that reads `props.post.title` doesn't compile, since Laravel sends the title at `props.post.data.title`. A resource whose `toArray()` already returns its wrap key, such as `data`, isn't wrapped again, and `EnumResource::make()` keeps `AsEnum<typeof Role>`, because `EnumResource` turns wrapping off.
* **`Resource::collection()`** publishes `AnonymousResourceCollection<CommentResource>` from `@tolki/types`, which is `{ data: CommentResource[] }`.
* **A named collection** publishes its own interface, which already holds its wrap key. One whose `toArray()` returns no wrap key publishes `{ data: TagCollection }`, because Laravel nests that body under `data`.
* **`->toResourceCollection()`** with no argument publishes the collection Laravel guesses. Over an empty collection, Laravel skips the guess and sends `{ data: [] }`, so the prop also publishes that empty response, such as `UserCollection | { data: never[] }` or, over `paginate()`, `| JsonResourcePaginator<never>`. A guessed collection whose response is only its `data` list already fits it and gets no extra type.
* **Keys beside `data`**: the keys that a resource's `with()` method or an `->additional([...])` call adds are published beside the body. A single resource merges them into its object, as in `{ data: PostResource; meta: { total: number } }`, and any other response is intersected with them, as in `AnonymousResourceCollection<CommentResource> & { meta: { total: number } }`. A `with()` key that a `when()` call may leave out arrives as `[]`, so it publishes `T | never[]`.
* **A resolved resource**, from `->resolve()`, publishes the resource's own type, with no `data` key. Inertia still sends each API resource inside the resolved body as a response, so a key that holds one publishes that response, as the example below shows. `Resource::collection(...)->resolve()` publishes a list of the same.

Here `PostCardResource` returns `'author' => UserCardResource::make($this->author)` among its keys:

```php
return Inertia::render('Posts/Show', [
    'post' => PostResource::make($post)->additional([
        'meta' => ['total' => $post->comments()->count()],
    ]),
    'card' => PostCardResource::make($post)->resolve(),
]);
```

Both props publish what Inertia sends:

```typescript
export type ShowPageProps = Inertia.SharedData & {
  post: { data: PostResource; meta: { total: number } };
  card: Omit<PostCardResource, "author"> & {
    author: { data: UserCardResource };
  };
};
```

After `->resolve()`, a resource collection class with its own `toArray()` publishes its items bare, though Inertia sends each one under `data`. Pass the collection itself, or type the prop with [`#[TsCasts]`](./routing.md#overriding-props-with-tscasts).

The wrap key is the one your app sets by the time `ts:publish` runs, as [The Wrap Key Your App Sets](./api-resources.md#the-wrap-key-your-app-sets) describes. After `JsonResource::withoutWrapping()`, a single resource publishes the bare `PostResource`, and `Resource::collection()` over items that aren't paginated publishes `CommentResource[]`. Over a paginator, Laravel keeps the `data` key. Keys from `with()` or `additional()` also make Laravel nest the resource under `data`, and the prop publishes it that way. After `JsonResource::wrap('items')`, a single resource publishes `{ items: PostResource }`.

### JSON:API Resources in Props

A [JSON:API resource](./api-resources.md#json-api-resources) prop publishes the document Inertia sends, with the document types from `@tolki/types`. Here `PostResource` extends `JsonApiResource`, and its one relationship, `author`, is a `UserResource`:

```php
return Inertia::render('Posts/Index', [
    'post' => new PostResource($post),
    'posts' => PostResource::collection(Post::all()),
    'paged' => PostResource::collection(Post::query()->paginate(10)),
]);
```

The page-props type names each document:

```typescript
export type IndexPageProps = Inertia.SharedData & {
  post: JsonApiDocument<PostResource, UserResource>;
  posts: JsonApiCollection<PostResource, UserResource>;
  paged: JsonApiPaginator<PostResource, UserResource>;
};
```

The second type parameter lists every resource object that an `?include=` request can add to `included`, a union when there are several, through the relationships of each related resource too. A related model with no JSON:API resource of its own adds Laravel's fallback, such as `JsonApiResourceObject<"reports">`. Over `simplePaginate()` and `cursorPaginate()`, the prop publishes `JsonApiSimplePaginator` and `JsonApiCursorPaginator`. `toResource()` and `toResourceCollection()` publish the same documents.

After `JsonResource::withoutWrapping()`, `PostResource::collection()` over items that aren't paginated publishes the bare `PostResource[]`. A request with `?include=`, or any request once `JsonApiResource::configure()` sets the `jsonapi` member, still sends it under `data`, and the published type doesn't cover that.

## Preserve-Keys Resource Collections in Page Props

This section covers resource collections in a route's page props. A collection that `share()` returns is typed the same way. See [Inertia Integration](./routing.md#inertia-integration) for how page props are typed in general.

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

`JsonResourcePaginator<T>` types its `data` as `T[]` (see [Paginated Collections](./api-resources.md#paginated-collections) on the API Resources page), so a key-preserving collection can't use it as is. The page-props type drops the array `data` with `Omit` and adds a keyed `Record<string, T>` in its place. Over `simplePaginate()` or `cursorPaginate()`, it starts from `JsonResourceSimplePaginator<T>` or `JsonResourceCursorPaginator<T>` instead.

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

`paginate()`, `simplePaginate()`, and `cursorPaginate()` are all recognized, in the `new SomeCollection(...)`, `SomeResource::collection(...)`, and `->toResourceCollection()` forms. The paginator can also come from a query builder held in a variable, or from a controller method or an injected service's method, typed from the method's return type or its body. A call that hands back the same paginator, such as `withQueryString()`, `appends()` or `onEachSide()`, keeps its kind.

Each paginator sends its own `meta` block, so each gets its own type from `@tolki/types`. A named collection adds the pagination type to its own interface. An anonymous collection, from `SomeResource::collection(...)`, publishes the paginator's whole response, and so does a collection with `$wrap = null`, because Laravel sends it under `data` over a paginator. In this list, the named form comes first, and `R` is the collected resource:

* `paginate()`: `TeamCollection & ResourcePagination`, or `JsonResourcePaginator<R>`.
* `simplePaginate()`: `TeamCollection & ResourceSimplePagination`, or `JsonResourceSimplePaginator<R>`.
* `cursorPaginate()`: `TeamCollection & ResourceCursorPagination`, or `JsonResourceCursorPaginator<R>`.

A prop that can hold more than one paginator kind, such as a ternary over `paginate()` and `simplePaginate()`, publishes `TeamCollection & (ResourceSimplePagination | ResourcePagination)`. One that can hold a plain collection or a paginator publishes both shapes, `TeamCollection | (TeamCollection & ResourcePagination)`. A collection that `share()` returns is typed the same way.

::: warning A Missed Paginator Gives a Wrong Type
When the package can't tell which paginator a payload holds, the prop gets the collection's type without the pagination part, a wrong type rather than a missing one. That happens with a method declared to return the `Paginator` contract, which more than one paginator kind implements, or with one that has no return type and a body the package can't read:

```php
// page() is declared to return the Paginator contract
return Inertia::render('Posts/Index', [
    'posts' => new PostCollection($this->posts->page()),
]);
```

Here `posts` types as `PostCollection`, without `& ResourcePagination`. A paginator passed without a resource is typed only from a query chain that starts at a model, or from a method that returns one. From a query builder held in a variable, it publishes `unknown`. Declare the paginator class the method returns, such as `LengthAwarePaginator`, build the paginator in the props, or type the prop with [`#[TsCasts]`](./routing.md#overriding-props-with-tscasts).
:::

## Output Location

The package writes the augmentation file to the first of these directories that's set:

1. `inertia.output_directory`.
2. `routes.output_directory`. Route files reference `Inertia.SharedData`, so when you move them, the augmentation file follows.
3. The global `output_directory`.

## Configuration Reference

The [Configuration Reference](./configuration-reference.md) lists every `inertia.*` key, including `component_casing` and `ui_table_package`, which apply to route page props.
