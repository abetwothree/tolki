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

### Conditional Methods

All conditional methods produce **optional** properties (with `?` in TypeScript):

| Method                                      | Description                       | Generated Type           |
| ------------------------------------------- | --------------------------------- | ------------------------ |
| `$this->when(cond, value)`                  | Include when condition is true    | Inferred from value      |
| `$this->whenHas('attr')`                    | Include when attribute is present | From model column type   |
| `$this->whenNotNull($this->attr)`           | Include when not null             | From model column type   |
| `$this->whenLoaded('relation')`             | Include when relation is loaded   | From model relation type |
| `$this->whenCounted('relation')`            | Include when count is loaded      | `number`                 |
| `$this->whenAggregated('rel', 'col', 'fn')` | Include when aggregate is loaded  | `number`                 |
| `$this->whenPivotLoaded('table')`           | Include when pivot is loaded      | `unknown`                |

See [Nullable Relations](#nullable-relations) for `whenLoaded` nullability handling.

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

Use `merge` and `mergeWhen` to spread additional properties into the response:

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

| Method                          | Optionality    | Description                       |
| ------------------------------- | -------------- | --------------------------------- |
| `$this->merge([...])`           | Required       | Properties are always present     |
| `$this->mergeWhen(cond, [...])` | Optional (`?`) | Properties included conditionally |

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
  avatar?: string | null;
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
