# API Resources

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can generate TypeScript interfaces from your Laravel [API Resources](https://laravel.com/docs/eloquent-resources) (`JsonResource` classes). It statically analyzes the `toArray()` method to extract property names, types, and optionality — producing a TypeScript interface that matches the shape of your API responses, without running the application.

As mentioned in [Installation & Usage](./index.md), resources only need the `@tolki/ts` runtime package when they use `EnumResource::make()`, which generates `AsEnum<typeof Enum>` — backed by the runtime's `AsEnum` utility type (see [Enums](./enums.md)).

By default, the package looks for resources in the `app/Http/Resources` directory. See [Filtering & Excluding](#filtering--excluding) to customize this.

## How the Backing Model Is Resolved

The analyzer resolves property types by inspecting the backing Eloquent model's database schema and cast definitions. The backing model is determined from, in priority order:

1. The `#[TsResource(model:)]` attribute
2. The `@mixin` PHPDoc tag (resolved via use statements)
3. Convention-based guess — reverses Laravel's naming convention (`App\Http\Resources\UserResource` → `App\Models\User`)
4. `#[UseResource]` attribute scan — checks all collected models for a `#[UseResource(ResourceClass::class)]` attribute pointing to this resource (Laravel 12+ only)

Most resources only need `@mixin` or the naming convention. The `#[TsResource(model:)]` attribute is useful when the resource name doesn't match the model, and `#[UseResource]` handles cases where the resource lives outside the standard `Http\Resources` namespace.

## Supported `toArray()` Patterns

The analyzer recognizes the following patterns inside `toArray()`:

### Direct Property Access

```php
'id' => $this->id,
'name' => $this->name,
'status' => $this->status,       // Enum cast → generates enum type
```

Types are resolved from the model's database columns and cast definitions.

### Local Variables

A variable assigned once from a model property and returned directly carries that type into the generated interface — you don't need to inline the property access:

```php
public function toArray(Request $request): array
{
    $slug = $this->slug;

    return [
        'slug' => $slug,   // string — same as returning `$this->slug` directly
    ];
}
```

This still works even if the same name is reused as a closure or arrow-function parameter elsewhere in the method. The parameter only shadows the variable for its own closure body — it no longer degrades the outer property to `unknown`:

```php
public function toArray(Request $request): array
{
    $member = $this->slug;

    return [
        'outer_member' => $member, // string
        'mapped_members' => $this->members->map(fn ($member) => $member), // User[] — this $member is the map's own element
    ];
}
```

If you see a property come out as `unknown` when it looks like it should resolve, check whether the backing variable is reassigned more than once, or reassigned inside a conditional branch — the analyzer can't tell which write is live at return time, so it deliberately falls back to `unknown` rather than guessing.

### Conditional Methods

All conditional methods produce **optional** properties (with `?` in TypeScript) by default. Every one of
them, though, accepts a trailing default argument — and passing it explicitly makes the property
**required**, because the key can no longer be missing. `whenNotNull()`/`whenNull()`'s default argument is
covered just below the table; the rest of the family is covered right after that.

| Method                                              | Description                                    | Generated Type            |
| ---------------------------------------------------- | ----------------------------------------------- | ------------------------- |
| `$this->when(cond, value)`                          | Include when condition is true                 | Inferred from value       |
| `$this->unless(cond, value)`                        | Include when condition is false                | Inferred from value       |
| `$this->whenHas('attr')`                            | Include when attribute is present               | From model column type    |
| `$this->whenAppended('attr')`                       | Include when accessor has been appended         | From model column type    |
| `$this->whenNotNull($this->attr)`                   | Include when not null                           | From model column type    |
| `$this->whenNull($this->attr)`                      | Include when null                               | `null`                    |
| `$this->whenLoaded('relation')`                     | Include when relation is loaded                 | From model relation type  |
| `$this->whenCounted('relation')`                    | Include when count is loaded                    | `number`                  |
| `$this->whenAggregated('rel', 'col', 'fn')`         | Include when aggregate is loaded                | `number`                  |
| `$this->whenExistsLoaded('relation')`               | Include when existence flag is loaded           | `boolean`                 |
| `$this->whenPivotLoaded('table')`                   | Include when pivot is loaded                    | `unknown`                 |
| `$this->whenPivotLoadedAs('accessor', 'table')`     | Include when pivot (custom accessor) is loaded  | `unknown`                 |
| `$this->transform($value, $callback)`               | Transform `$value` via `$callback` when filled  | Inferred from `$callback` |

See [Nullable Relations](#nullable-relations) for `whenLoaded` nullability handling.

#### `unless()` is `when()` with the condition negated

`unless($condition, $value, $default)` runs `$value` when `$condition` is **false** — everything else about
how it's typed is identical to `when()`, including the default-argument rule covered below:

```php
'status' => $this->unless($this->is_draft, $this->status),          // optional
'status' => $this->unless($this->is_draft, $this->status, 'draft'), // required
```

#### `whenNotNull()` / `whenNull()` and their optional second argument

`whenNotNull($value, $default)` and `whenNull($value, $default)` read their arguments positionally — the
second argument is Laravel's fallback value, never a callback bound to the first. `whenNotNull()`'s guard
proves the value non-null on the success arm, so its `null` possibility is removed from the generated type:

```php
'line_2' => $this->whenNotNull($this->line_2), // string | null column
```

generates `line_2?: string`, not `line_2?: string | null`.

Passing a second argument changes both `optional` and the type: Laravel never omits the key once a default
is supplied, so the property becomes **required**, and its type becomes the union of the value and default
arms:

```php
'discount' => $this->whenNotNull($this->discount_percent, 0), // discount_percent: number | null
```

generates `discount: number` (required) — the default's type merges with, and here fully overlaps, the
value's own type. A default of a different type (e.g. a string fallback for a numeric column) produces a
union of both, still required.

#### The rest of the conditional family and their default argument

The same rule applies to every other conditional method: pass a default and the property stops being
optional, because it can no longer be missing.

```php
'status' => $this->when($this->is_published, $this->status),          // optional
'status' => $this->when($this->is_published, $this->status, 'draft'), // required
```

When the method resolves its type from the value expression directly — as `when()` does — the type widens
too, unioning the default's type in alongside the value's:

```php
'discount' => $this->when($this->has_discount, $this->discount_percent),        // discount?: number
'discount' => $this->when($this->has_discount, $this->discount_percent, 'n/a'), // discount: number | string
```

An explicit `null` still counts as a default — Laravel distinguishes an omitted argument from a passed-in
one, not a `null` value from a non-null one — so `$this->whenLoaded('user', fn ($user) => $user, null)`
is required too, even though the default itself is `null`.

### Enum Properties with `EnumResource`

Use `EnumResource::make()` to expose enum-cast properties as rich enum objects:

```php
'status' => EnumResource::make($this->status),
'currency' => EnumResource::make($this->currency),
```

When `enums.use_tolki_package` is enabled (the default), these generate `AsEnum<typeof EnumName>` types with automatic imports. When disabled, they generate the enum's `Type` alias (e.g., `StatusType`).

### Nested Resources

Reference other resources using `::make()`, `::collection()`, or `new`:

```php
// Single nested resource (optional when inside whenLoaded)
'author' => UserResource::make($this->whenLoaded('user')),

// Using new instead of ::make() — works identically
'author' => new UserResource($this->whenLoaded('user')),

// Collection of nested resources
'tags' => TagResource::collection($this->whenLoaded('tags')),

// Non-conditional nested resource
'owner' => UserResource::make($this->user),
```

Both `SomeResource::make(...)` and `new SomeResource(...)` are fully supported and behave identically — the analyzer resolves the resource type, tracks the FQCN for imports, and detects conditional arguments for optionality.

Self-referencing resources are also supported:

```php
'parent' => CategoryResource::make($this->whenLoaded('parent')),
'children' => CategoryResource::collection($this->whenLoaded('children')),
```

### Merge Operations

Use `merge`, `mergeWhen`, and `mergeUnless` to spread additional properties into the response:

```php
// Unconditional merge — properties are required (not optional)
$this->merge([
    'full_name' => $this->first_name . ' ' . $this->last_name,
    'total_display' => $this->total,
]),

// Conditional merge — properties are optional
$this->mergeWhen($this->is_featured, [
    'weight' => $this->weight,
    'dimensions' => $this->dimensions,
]),
```

Both `merge` and `mergeWhen` also accept closures and arrow functions instead of array literals:

```php
// merge with closure
$this->merge(fn () => [
    'currency_label' => $this->currency,
]),

// mergeWhen with closure
$this->mergeWhen($this->paid_at !== null, fn () => [
    'shipped_at' => $this->shipped_at,
    'tracking' => $this->tracking_number,
]),
```

| Method                             | Optionality    | Description                                    |
| ---------------------------------- | -------------- | ----------------------------------------------- |
| `$this->merge([...])`              | Required       | Properties are always present                  |
| `$this->mergeWhen(cond, [...])`    | Optional (`?`) | Properties included conditionally              |
| `$this->mergeUnless(cond, [...])`  | Optional (`?`) | Properties included when `cond` is false        |

### Closure & Arrow Function Values

The analyzer resolves closures and arrow functions used as value arguments. Simple closures that return a single expression are analyzed recursively:

```php
// Arrow function — return expression analyzed directly
'status' => $this->when(true, fn () => $this->status),

// Arrow function returning a nested resource
'user' => $this->when(true, fn () => UserResource::make($this->user)),

// Full closure — first return statement is analyzed
'notes' => $this->when(true, function () {
    return $this->notes;
}),
```

This works anywhere a value expression is expected — including `when`, `whenLoaded`, `whenNotNull`, `merge`, and `mergeWhen`.

### Parent `toArray()` Spread

Extend a parent resource using `...parent::toArray($request)`. Parent properties appear first, and the child can override any key:

```php
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => EnumResource::make($this->status),
        ];
    }
}

class ApiPostResource extends PostResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'status' => $this->status,       // Overrides parent's EnumResource type
        ];
    }
}
```

The child `ApiPostResource` inherits all parent properties (`id`, `title`, `status`), with `status` overridden to use the plain enum value instead of `EnumResource::make()`.

If the parent itself extends `JsonResource` (the base class), the spread automatically delegates to the model's database attributes — see [JsonResource Base Delegation](#jsonresource-base-delegation).

### Trait Method Spread

Spread trait method return values into `toArray()` with `...$this->traitMethod()`. The analyzer reads `@return array{key: type}` PHPDoc annotations to resolve property types:

```php
trait IncludesMorphValue
{
    /**
     * @return array{morphValue: string}
     */
    protected function includeMorphValue(): array
    {
        return ['morphValue' => $this->resource->getMorphClass()];
    }
}

class PostResource extends JsonResource
{
    use IncludesMorphValue;

    public function toArray(Request $request): array
    {
        return [
            ...$this->includeMorphValue(),
            'id' => $this->id,
            'title' => $this->title,
        ];
    }
}
```

Generates:

```typescript
export interface Post {
  morphValue: string; // From trait PHPDoc
  id: number;
  title: string;
}
```

Multiline `@return` shapes are also supported:

```php
/**
 * @return array{
 *     firstName: string,
 *     lastName: string,
 *     isActive: bool,
 * }
 */
protected function includeProfile(): array
{
    // ...
}
```

Another option for defining the return types of a trait method is to use the `#[TsCasts]` attribute on the trait method itself with the same syntax as the `#[TsCasts]` attribute for models:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

trait IncludesExtras
{
    #[TsCasts([
        'location' => ['type' => 'GeoPoint', 'import' => '@/types/geo'],
        'flag' => ['type' => 'string | null', 'optional' => true],
        'extra' => 'Record<string, unknown>',
    ])]
    protected function includeCastedExtras(): array
    {
        return [
            'location' => strtoupper('x'),
            'flag' => strtolower('y'),
        ];
    }
}
```

> [!TIP]
> Trait spreads also flow through parent inheritance. If a parent resource spreads a trait method and a child extends it with `...parent::toArray($request)`, the child inherits the trait-contributed properties.

> [!NOTE]
> When a trait method has no `@return array{...}` PHPDoc or `#[TsCasts]` attribute, its properties will be typed as `unknown`.

### Bare Method-Call Return

`toArray()` doesn't have to spread a method's return value into an array literal — returning the method call directly is supported too:

```php
public function toArray(Request $request): array
{
    return $this->data();          // now supported
    // return [...$this->data()];  // already supported
}
```

This resolves transitively: if `data()` itself returns another method call, the analyzer keeps following the chain until it reaches an array literal (or an `only()`/`except()` filter — see [Attribute Filters](#attribute-filters-only--except) below):

```php
class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $this->data();
    }

    protected function data(): array
    {
        return $this->nested();
    }

    protected function nested(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
        ];
    }
}
```

Generates:

```typescript
export interface TeamResource {
  id: number;
  slug: string;
}
```

The chain can pass through trait- and parent-declared methods the same way a `...$this->method()` spread does — see [Trait Method Spread](#trait-method-spread) above.

### JsonResource Base Delegation

Resources that have **no `toArray()` method** or whose `toArray()` simply returns `parent::toArray($request)` automatically generate properties from the backing model's database schema:

```php
/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    // No toArray() — properties auto-generated from User model
}
```

You can also spread the base properties and add computed keys:

```php
/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'full_name' => strtoupper($this->name),
        ];
    }
}
```

The model is resolved from `#[TsResource(model:)]`, `@mixin` PHPDoc, or use statements. When no model can be detected, the resource produces an empty interface.

### Attribute Filters (`only` / `except`)

Resources that use `$this->only([...])` or `$this->except([...])` to filter model attributes are supported — both as a direct return value and as a spread:

```php
// As the return value
public function toArray(Request $request): array
{
    return $this->only(['id', 'name', 'email']);
}

// As a spread in a return array
public function toArray(Request $request): array
{
    return [
        ...$this->except(['password', 'remember_token']),
        'role' => EnumResource::make($this->role),
    ];
}
```

Both methods delegate to the backing model's full database schema and filter by the listed keys. Properties retain their original types from the model.

> [!NOTE]
> Currently only `only` and `except` are supported as attribute filter methods. Other collection-style methods are not analyzed. If you find you need additional methods, open an issue, or better yet, submit a PR with the added functionality! See [`FiltersModelAttributes`](https://github.com/abetwothree/laravel-ts-publish/blob/main/src/Analyzers/Concerns/FiltersModelAttributes.php).

### `exclude_hidden` and attribute filters

`ts-publish.models.exclude_hidden` (see [Models § What gets published](./models.md#what-gets-published-hidden-attributes-write-only-accessors)) governs resources too, not just the model's own interface — but asymmetrically:

```php
$this->only(['password'])   // kept: you named it
$this->except(['id'])       // password dropped: the set is derived
```

That split isn't arbitrary — it mirrors what `Model::only()` versus `toArray()`/`except()` already do at runtime. `Model::only()` resolves each key through `getAttribute()`, which returns a `$hidden` attribute regardless of visibility; `toArray()` and `Model::except()` both go through `getArrayableItems()`, which strips `$hidden` attributes before your excluded keys are even considered. This package's analyzer follows the same split:

| Pattern | Property set | A `$hidden` column, with `exclude_hidden` enabled |
| --- | --- | --- |
| `'password' => $this->password` | the property you wrote by hand | **kept** — you named it |
| `$this->only(['id', 'password'])` | exactly the keys you named | **kept** — you named it |
| `$this->relation->only(['id', 'password'])` | exactly the keys you named | **kept** — you named it |
| `$this->whenHas('password')` | the attribute you named | **kept** — you named it |
| `$this->except(['id'])` | every model attribute minus the named keys | **dropped** — the set is derived |
| `$this->relation->except(['id'])` | every attribute minus the named keys | **dropped** — the set is derived |
| `parent::toArray($request)`, `[...parent::toArray($request)]`, or no `toArray()` at all | every model attribute | **dropped** — the set is derived |

`'password' => $this->password` is worth calling out on its own: it's the plainest, most common way to expose a column, and it behaves exactly like a named `only()` key — a `$hidden` column you access directly is never silently dropped.

If you want a `$hidden` column published through one of the derived paths, name it explicitly — switch that property to `only([...])`, access it directly as `$this->column`, or drop it from the model's `$hidden` array entirely if it no longer needs to be hidden.

### Resource Collections

`ResourceCollection` subclasses are supported. The analyzer resolves `$this->collection` to the singular resource type as an array:

```php
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'has_admin' => true,
        ];
    }
}
```

Generates:

```typescript
import type { UserResource } from "./";

export interface UserCollection {
  data: UserResource[];
  has_admin: unknown;
}
```

The singular resource is resolved from:

1. **Explicit `$collects` property** — if defined on the collection class
2. **Naming convention** — `UserCollection` → `UserResource` (strips "Collection", appends "Resource")

```php
class OrderCollection extends ResourceCollection
{
    // Explicit: use OrderResource as the singular resource
    public $collects = OrderResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
        ];
    }
}
```

When the singular resource cannot be resolved (e.g., `MiscCollection` with no matching `MiscResource`), `$this->collection` falls back to `unknown`.

Larger support for `ResourceCollection` features (e.g., pagination metadata, `additional()` method, etc.) may be added in a future release.

## Anatomy of a Generated Resource

Given this resource:

```php
/**
 * User account resource.
 *
 * @mixin User
 */
#[TsResource(model: User::class)]
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => EnumResource::make($this->role),
            'profile' => $this->whenLoaded('profile'),
            'posts' => PostResource::collection($this->whenLoaded('posts')),
            'phone' => $this->whenHas('phone'),
            'avatar' => $this->whenNotNull($this->avatar),
            'posts_count' => $this->whenCounted('posts'),
            'comments_count' => $this->whenCounted('comments'),
        ];
    }
}
```

The package generates the following TypeScript interface:

```typescript
import { type AsEnum } from "@tolki/ts";

import { Role } from "../../enums";
import type { Profile } from "../../models";
import type { PostResource } from ".";

/**
 * User account resource.
 *
 * @see Workbench\App\Http\Resources\UserResource
 */
export interface UserResource {
  id: number;
  name: string;
  email: string;
  role: AsEnum<typeof Role> | null;
  profile?: Profile | null;
  posts?: PostResource[];
  phone?: string | null;
  avatar?: string;
  posts_count?: number;
  comments_count?: number;
}
```

Notice how:

- Direct properties (`id`, `name`, `email`) are **required**
- `whenLoaded`, `whenHas`, `whenNotNull`, and `whenCounted` properties are **optional** (`?`)
- `EnumResource::make()` generates `AsEnum<typeof Role>` with the proper import, and `| null` since the underlying column is nullable
- `PostResource::collection()` is typed as `PostResource[]`, imported from the same directory's barrel
- Bare `whenLoaded('profile')` resolves to the model relation type (`Profile | null`)
- PHPDoc class descriptions are preserved as JSDoc comments, alongside an auto-added `@see` back-reference to the PHP class

## Resource Attributes

Three attributes are available for configuring resource TypeScript generation. See [Excluding Content](./excluding-content.md) for the full `#[TsExclude]` reference.

| Attribute       | Target                   | Description                                                                  |
| --------------- | ------------------------ | ---------------------------------------------------------------------------- |
| `#[TsResource]` | Resource class           | Override the interface name, specify the backing model, or add a description |
| `#[TsCasts]`    | Resource class or method | Override or add property types with custom TypeScript types                  |
| `#[TsExclude]`  | Resource class           | Exclude the entire resource from the TypeScript output.                      |

### `#[TsResource]` — Configure Resource Generation

Use this attribute to override the generated interface name, explicitly specify the backing model, or add a description:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsResource;
use App\Models\User;

#[TsResource(name: 'UserData', model: User::class, description: 'User API response')]
class UserResource extends JsonResource
{
    // ...
}
```

| Parameter     | Type            | Default       | Description                                   |
| ------------- | --------------- | ------------- | --------------------------------------------- |
| `name`        | `?string`       | Class name    | Override the TypeScript interface name        |
| `model`       | `?class-string` | Auto-detected | Explicitly specify the backing Eloquent model |
| `description` | `string`        | `''`          | Added as a JSDoc comment above the interface  |

> [!TIP]
> When `name` is set, it also affects the output filename. For example, `#[TsResource(name: 'Address')]` generates `address.ts` instead of `address-resource.ts`.

### `#[TsCasts]` — Override Property Types

Use this attribute to override inferred types or add virtual properties with custom TypeScript types:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

#[TsCasts([
    'metadata' => 'Record<string, unknown>',
    'coordinates' => ['type' => 'GeoPoint', 'import' => '@/types/geo'],
    'flagged_at' => ['type' => 'string | null', 'optional' => true],
])]
class CommentResource extends JsonResource
{
    // ...
}
```

Each entry can be:

| Format                | Example                                             | Description                            |
| --------------------- | --------------------------------------------------- | -------------------------------------- |
| Plain string          | `'Record<string, unknown>'`                         | Override the type only                 |
| Array with `import`   | `['type' => 'GeoPoint', 'import' => '@/types/geo']` | Custom type with an import statement   |
| Array with `optional` | `['type' => 'string', 'optional' => true]`          | Override the type and mark as optional |

Properties defined in `#[TsCasts]` that don't exist in `toArray()` are appended to the generated interface. Properties that do exist have their types overridden.

Generated TypeScript with the `coordinates` example:

```typescript
import type { GeoPoint } from "@/types/geo";

export interface CommentResource {
  id: number;
  content: string;
  is_flagged: boolean;
  flagged_at?: string | null;
  metadata: Record<string, unknown>;
  author?: UserResource;
  post?: PostResource;
  coordinates: GeoPoint;
}
```

#### On Trait Methods

`#[TsCasts]` can also be applied to **trait methods** that are spread into `toArray()`. This lets you control types for trait-contributed properties without modifying the resource class — see [Trait Method Spread](#trait-method-spread) above.

The attribute works identically to the class-level version — overriding types, marking properties optional, adding imports, and appending new properties.

> [!NOTE]
> `#[TsCasts]` replaces the former `#[TsResourceCasts]` attribute, which was removed. If you were using `TsResourceCasts`, replace it with `TsCasts` — the syntax is identical.

## Nullable Relations

When `whenLoaded('relation')` resolves a relation type, the package determines whether it should include `| null` based on the relation kind and the database schema.

This is controlled by the `nullable_relations` config option (enabled by default). The strategy for each relation type is:

| Relation Type                         | Strategy   | Description                                          |
| ------------------------------------- | ---------- | ---------------------------------------------------- |
| `HasOne`, `MorphOne`, `HasOneThrough` | `nullable` | Always nullable — the related record may not exist   |
| `BelongsTo`                           | `fk`       | Checks the foreign key column's DB-level nullability |
| `MorphTo`                             | `morph`    | Checks both the morph type and FK column nullability |
| `HasMany`, `BelongsToMany`, etc.      | `never`    | Collection relations — typed as arrays, never null   |

For example, a `BelongsTo` relation with a nullable foreign key:

```php
// Migration: $table->foreignId('user_id')->nullable();

// Resource:
'user' => UserResource::make($this->whenLoaded('user')),
```

Generates `user?: UserResource | null` — optional (from `whenLoaded`) and nullable (from the nullable FK).

You can disable nullable relation detection globally:

```php
// config/ts-publish.php
'models' => [
    'nullable_relations' => false,
],
```

Or override the strategy for specific relation types using `models.relation_nullability_map`:

```php
// config/ts-publish.php
'models' => [
    'relation_nullability_map' => [
        \Illuminate\Database\Eloquent\Relations\HasOne::class => 'never',
    ],
],
```

Valid strategies are `'nullable'`, `'never'`, `'fk'`, and `'morph'`.

> [!NOTE]
> This is the same `models.*` nullability configuration used by [Models](./models.md) — resources and models share one nullability-detection strategy since resources ultimately resolve relation types from the same backing model.

## Filtering & Excluding

You can customize which resources are discovered using the same include/exclude pattern as [enums](./enums.md) and [models](./models.md):

```php
// config/ts-publish.php

'resources' => [
    // Only publish these specific resources (leave empty to include all)
    'included' => [
        App\Http\Resources\UserResource::class,
        App\Http\Resources\PostResource::class,
    ],

    // Exclude specific resources from publishing
    'excluded' => [
        App\Http\Resources\InternalResource::class,
    ],

    // Search additional directories for resources
    'additional_directories' => [
        'modules/Blog/Http/Resources',
    ],
],
```

> [!TIP]
> Like models and enums, include and exclude settings accept both fully-qualified class names and directory paths.

`#[TsExclude]` also works at the class level — see [Resource Attributes](#resource-attributes) above and [Excluding Content](./excluding-content.md).

You can disable resource publishing entirely in the config file:

```php
// config/ts-publish.php

'resources' => [
    'enabled' => false,
],
```

Or publish only resources for a single run using the command flag:

```bash
php artisan ts:publish --only-resources
```

The `--only-resources` flag cannot be combined with any other `--only-*` flag (`--only-enums`, `--only-models`, `--only-routes`, `--only-form-requests`, `--only-broadcast-channels`, `--only-broadcast-events`).

## Configuration Reference

The full list of `resources.*` config keys lives in the [Configuration Reference](./configuration-reference.md).
