---
url: /ts/api-resources.md
---
# API Resources

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) generates a TypeScript interface for each of your Laravel [API resources](https://laravel.com/docs/eloquent-resources), the `JsonResource` classes that shape your API's JSON. It reads each resource's `toArray()` method without calling it, and publishes the name, type, and optionality of every property the method returns.

Use it when your frontend reads JSON from API resources. Each publish regenerates the interface from `toArray()`, so you don't maintain a second, hand-written type.

By default, the package looks for resources in the `app/Http/Resources` directory. To change that, see [Filtering & Excluding](#filtering-excluding).

Resources need the `@tolki/ts` runtime package only when they use `EnumResource::make()`, which publishes that package's `AsEnum<typeof Enum>` type. See [Installing `@tolki/ts`](./index.md#installing-tolki-ts) and [Enums](./enums.md).

## Anatomy of a Generated Resource

This resource reads columns, an enum, relations, and counts from its `User` model:

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

The package generates this interface:

```typescript
import { type AsEnum } from "@tolki/ts";

import { Role } from "../../enums";
import type { Profile } from "../../models";
import type { PostResource } from ".";

/**
 * User account resource.
 *
 * @see App\Http\Resources\UserResource
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

The output shows how each kind of value is typed:

* Direct properties, such as `id`, `name`, and `email`, are required.
* `whenLoaded()`, `whenHas()`, `whenNotNull()`, and `whenCounted()` make their properties optional (`?`).
* `EnumResource::make()` publishes `AsEnum<typeof Role>` and imports it. It adds `| null` because the `role` column is nullable.
* `PostResource::collection()` publishes `PostResource[]`, imported from the barrel file in the same directory.
* A bare `whenLoaded('profile')` publishes the model's relation type, `Profile | null`.
* The class docblock becomes a JSDoc comment, with a `@see` tag that points back to the PHP class.

### Classes Sharing a Name Across Namespaces

When two classes in different namespaces share a name, such as `App\Models\User` and `Crm\Models\User`, the generated file imports each one under its own alias. Every occurrence of the name inside a property's type uses the alias of the class it refers to, in source order:

```typescript
import type { User as CrmUser } from "../../../crm/models";
import type { User as ModelsUser } from "../../models";

export interface WarehouseResource {
  regional_hub_contacts: {
    primaryContact: CrmUser | null;
    manager: ModelsUser | null;
    secondaryContact: CrmUser | null;
  } | null;
}
```

## How the Backing Model Is Resolved

The package types most properties from the resource's backing Eloquent model, using its database columns, casts, accessors, and relations. It looks for that model in this order:

1. The `#[TsResource(model: User::class)]` attribute.
2. A `@mixin` or `@extends` tag in the resource's own docblock. The class name resolves through the file's `use` imports.
3. The nearest parent class whose docblock has a `@mixin` or `@extends` tag.
4. A `$resource` property redeclared with a `@var` type, such as `/** @var User */ public $resource;`.
5. Laravel's naming convention in reverse, so `App\Http\Resources\UserResource` maps to `App\Models\User`.
6. A model whose `#[UseResource(UserResource::class)]` attribute names the resource. This attribute needs Laravel 12.29 or later.

Most resources need only a `@mixin` tag or the naming convention. Use `#[TsResource(model:)]` when the resource name doesn't match the model, and `#[UseResource]` when the resource lives outside an `Http\Resources` namespace.

Step 3 lets a subclass use its parent's model without repeating the docblock, whether or not the subclass declares its own `toArray()`. See [Inheriting a Parent `toArray()`](#inheriting-a-parent-toarray).

If no model resolves, a property read from the model, such as `$this->id`, publishes `unknown`.

`$this->resource` holds the backing model, so a key that returns it whole publishes the model's interface. `'post' => $this->resource` publishes `post: Post`. If the resource redeclares `$resource` as nullable, such as `/** @var Post|null */ public $resource;` or `?Post`, the key keeps that `null`: `post: Post | null`.

A `ResourceCollection` is backed by no model, whatever its docblock or `#[TsResource(model:)]` names, because its `$this->resource` holds the collected items. A model read in a collection, such as `$this->title`, publishes `unknown`. See [Reading `$this->resource`](#reading-this-resource).

## Supported `toArray()` Patterns

These sections cover the Laravel resource features you use in `toArray()`. Each one shows the PHP you write and the TypeScript it produces.

### Direct Property Access

A property read from the model takes its type from the database column and its cast:

```php
'id' => $this->id,
'name' => $this->name,
'status' => $this->status, // an enum cast
```

The three properties publish these types:

```typescript
id: number;
name: string;
status: StatusType;
```

`$this->resource->name` reads the same attribute, so it publishes the same type. A property you declare on the resource class itself, such as a promoted constructor parameter, takes its type from that declaration. It wins over a model attribute with the same name, as it does in PHP.

An untyped property that nothing in the class, its parents, or its traits writes takes its default's type, so `protected $stage = Status::Draft;` publishes `StatusType`. A protected or private one declared without a value, such as `protected $name;`, publishes `null`.

### Conditional Methods

Laravel's conditional methods publish optional properties (`?`), because the key can be missing from the response. Passing a default argument makes the property required, because the key is then always present. The exception is a value or a default that is itself a conditional value, such as `$this->whenLoaded('author')`. See [Passing a Default Argument](#passing-a-default-argument).

| Method                                                    | Includes the key when                       | Published type                                                                                                                         |
| --------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `$this->when($condition, $value)`                         | `$condition` is true                        | `$value`'s type                                                                                                                        |
| `$this->unless($condition, $value)`                       | `$condition` is false                       | `$value`'s type                                                                                                                        |
| `$this->whenHas('attribute', $value)`                     | The attribute is present                    | `$value`'s type, or `unknown` when the package can't type it                                                                           |
| `$this->whenAppended('attribute', $value)`                | The accessor is appended                    | `$value`'s type, or `unknown` when the package can't type it                                                                           |
| `$this->whenNotNull($value)`                              | `$value` isn't `null`                       | `$value`'s type without `null`                                                                                                         |
| `$this->whenNull($value)`                                 | `$value` is `null`                          | `null`                                                                                                                                 |
| `$this->whenLoaded('relation')`                           | The relation is loaded                      | The relation's type                                                                                                                    |
| `$this->whenCounted('relation')`                          | The count is loaded                         | `number`                                                                                                                               |
| `$this->whenAggregated('relation', 'column', 'function')` | The aggregate is loaded                     | The aggregate's type. It adds `\| null` except for a count and the other cases in [Typing `whenAggregated()`](#typing-whenaggregated). |
| `$this->whenExistsLoaded('relation', $value)`             | The existence flag is loaded                | `$value`'s type, else `boolean`                                                                                                        |
| `$this->whenPivotLoaded('table')`                         | The pivot is loaded                         | `unknown`                                                                                                                              |
| `$this->whenPivotLoadedAs('accessor', 'table')`           | The pivot is loaded under a custom accessor | `unknown`                                                                                                                              |
| `$this->transform($value, $callback)`                     | `$value` is filled                          | `$callback`'s return type                                                                                                              |

To see when `whenLoaded()` or a resource built around a relation adds `| null`, read [Nullable Relations](#nullable-relations).

#### `unless()` Is `when()` With the Condition Negated

`unless($condition, $value, $default)` includes `$value` when `$condition` is false. It publishes exactly what `when()` would, including with a default argument:

```php
'status' => $this->unless($this->is_draft, $this->status),          // optional
'status' => $this->unless($this->is_draft, $this->status, 'draft'), // required
```

#### Passing a Default Argument

Every conditional method accepts a trailing default argument. When you pass one, Laravel includes the key whether or not the condition holds, so the property is required, unless the value or the default can itself be missing. The default's type joins the value's type:

```php
'discount' => $this->when($this->has_discount, $this->discount_percent),        // discount?: number
'discount' => $this->when($this->has_discount, $this->discount_percent, 'n/a'), // discount: number | string
'reviews'  => $this->whenCounted('reviews', null, 'n/a'),                       // reviews: number | string
'address'  => $this->whenHas('full_address', $this->full_address, 0),           // address: string | number
```

For `whenNotNull()` and `whenNull()`, the second argument is that default value, not a callback. `whenNotNull()` includes the key only when its value isn't `null`, so it removes `null` from the type:

```php
'line_2'   => $this->whenNotNull($this->line_2),              // line_2?: string, from a string | null column
'discount' => $this->whenNotNull($this->discount_percent, 0), // discount: number
```

A closure or a first-class callable is never `null`, so `whenNotNull()` always includes the key and sends what the call returns, `null` included. Over a nullable `rating` column, `'rating' => $this->whenNotNull(fn () => $this->rating)` publishes `rating: string | null`.

A default of the value's own type makes the property required without widening it. A default of another type, such as a string fallback for a number column, publishes a union of both.

An explicit `null` counts as a default, because Laravel checks whether you passed the argument, not what it holds. So `$this->whenLoaded('user', fn ($user) => $user, null)` is required, and it publishes `User | null` instead of `User`.

A value or a default that is itself a conditional value keeps the property optional, because Laravel still drops the key when that value is missing:

```php
'author' => $this->when($flag, $this->whenLoaded('author'), 'none'), // author?: User | string
'author' => $this->when($flag, 'none', $this->whenLoaded('author')), // author?: string | User
```

Any other default makes the property required, but two cases leave its type as it was:

* **A default the package can't type**: the value's type stands alone. This covers an expression or closure the package can't read.
* **A value the package can't type**: for `when()`, `unless()`, `whenHas()`, `whenAppended()`, `whenPivotLoaded()`, and `whenPivotLoadedAs()`, the property publishes `unknown`, which already covers any default.

`whenExistsLoaded()`, `whenCounted()`, and `whenAggregated()` keep their `boolean` or aggregate type for such a value instead, and the default joins that type.

Laravel calls a default closure with no arguments, except in `transform()`. A closure default that requires a parameter would throw if it ran, so the package leaves it out of the type:

```php
'notes' => $this->whenNotNull($this->notes, fn ($notes) => strlen($notes)), // notes: string
```

A closure whose parameter has its own default, such as `fn ($notes = '') => strlen($notes)`, runs without arguments, and the parameter holds its default's type. Its return type joins the union as usual, and the property publishes `string | number`.

On PHP 8.5 the default can also be a static closure or a first-class callable, such as `fn ($notes = strlen(...)) => $notes`. The parameter then holds `Record<string, never>`, because Laravel sends a `Closure` as `{}`.

`transform()` calls its default with the blank value, so a one-parameter default runs, and its parameter holds the value's full type, `null` included. `$this->transform($this->rating, fn ($r) => 'x', fn ($r) => $r)` publishes `string | number | null`.

#### Closure Parameters

When you pass a closure as the value, its first parameter holds whatever Laravel calls it with:

| Method                                                            | The closure's first parameter holds                                                                                                                              |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `whenLoaded()`                                                    | The loaded relation, never `null`: a model, a list of models, or the models a `morphTo` can hold                                                                 |
| `whenHas()`                                                       | The attribute's value                                                                                                                                            |
| `whenExistsLoaded()`                                              | The relation's `{relation}_exists` flag, a `boolean`                                                                                                             |
| `whenCounted()`, and `whenAggregated()` with the `count` function | The count, a `number`                                                                                                                                            |
| `whenAggregated()` with any other function                        | The aggregate, never `null`                                                                                                                                      |
| `transform()`                                                     | The value you pass as its first argument, without `null`, since Laravel calls the closure only for a filled value                                                |
| `when()`, `unless()`, `whenNotNull()`                             | No value, since Laravel passes none. A closure that requires a parameter throws `ArgumentCountError` whenever Laravel calls it, and `ts:publish` warns about it. |
| `whenAppended()`                                                  | No value, since Laravel passes none                                                                                                                              |

When Laravel passes no value, a parameter with a default holds that default's type. A default that builds a model holds that model, so `fn ($post = new Post) => $post->author?->name` publishes `string | null`.

The closure's return type becomes the property's type:

```php
'author_name' => $this->whenLoaded('author', fn ($author) => $author->name),     // author_name?: string
'has_comments' => $this->whenExistsLoaded('comments', fn ($exists) => $exists), // has_comments?: boolean
```

Here `author` is a relation that can't load `null`. When a relation is loaded as `null`, Laravel returns `null` without calling the closure, so a relation that can load `null` publishes `author_name?: string | null`. A `whenAggregated()` closure works the same way when its function is a string literal other than `'count'`, because SQL returns `NULL` for that aggregate over no rows. So `fn ($max) => ['max' => $max]` publishes `{ max: number } | null`, unless an accessor or `@property` on your model types the attribute without `null`. A closure that hands the relation to a resource's `collection()` adds `| null` only for a to-one relation that can load `null`. See [Nullable Relations](#nullable-relations) for which relations can load `null`.

#### `whenHas()`, `whenAppended()`, and `whenExistsLoaded()` Type From the Value You Pass

All three return Laravel's `value($value, ...)`, so the property takes the type of the value you pass, not of the attribute you name. `whenHas()` and `whenExistsLoaded()` pass the attribute to the closure's first parameter, and `whenAppended()` passes nothing:

```php
return [
    'has_title' => $this->whenHas('title', fn ($title): bool => $title !== ''),
    'title_length' => $this->whenHas('title', fn ($title) => strlen($title)),
    'appended_label' => $this->whenAppended('title_display', fn () => 'label'),
    'comments_flag' => $this->whenExistsLoaded('comments', fn ($exists) => $exists ? 'yes' : 'no'),
    'title_unresolvable' => $this->whenHas('title', fn ($title) => json_decode($title)),
];
```

The resource publishes these properties:

```typescript
export interface PostResource {
  has_title?: boolean;
  title_length?: number;
  appended_label?: string;
  comments_flag?: string;
  title_unresolvable?: unknown;
  // …
}
```

When the package can't type the value of `whenHas()` or `whenAppended()`, the property publishes `unknown`, not the attribute's type, because the value replaces the attribute in the response. `json_decode()` returns `mixed`, and a plain title decodes to `null`, so `title_unresolvable` is `unknown`. To type it, give the closure a native return type: `fn ($title): ?string => json_decode($title)` publishes `string | null`. A `@return` docblock on the closure doesn't type it.

`whenExistsLoaded()` keeps `boolean` for a value it can't type. Without a value argument, `whenHas('phone')` types from its column, and `whenExistsLoaded('user')` publishes `boolean`.

#### An Explicit `null` in the Value Slot

Laravel's `value()` helper returns a plain `null` unchanged. So a literal `null` as the value of `whenHas()`, `whenAppended()`, or `whenExistsLoaded()` publishes `null`, and the attribute's type never reaches the property. A default still joins the type:

```php
'address'  => $this->whenHas('full_address', null, 0),         // address: number | null
'appended' => $this->whenAppended('full_address', null, 0),    // appended: number | null
'exists'   => $this->whenExistsLoaded('user', null, 'absent'), // exists: string | null
```

This happens only when Laravel receives a `null` in that slot: a literal `null`, or a named `default:` argument that skips the value, since PHP fills the skipped argument with `null`. So `whenHas('phone', default: 0)` publishes `number | null`. Leaving both arguments out is different: `whenHas('phone')` still types from the column, and `whenExistsLoaded('user')` is still `boolean`.

`whenCounted()`, `whenAggregated()`, and `whenLoaded()` treat a `null` value as no value, so the count, the aggregate, or the relation still comes through. That's why `whenCounted('reviews', null, 'n/a')` publishes `number | string`. An aggregate other than a count keeps its own `| null`, so `whenAggregated('items', 'price', 'sum', null, 'none')` publishes `number | string | null`. For a `parent` relation that can load `null`, `whenLoaded('parent', null, 'absent')` publishes `Category | string | null`.

#### Typing `whenAggregated()`

`whenAggregated('relation', 'column', 'function')` reads the `{relation}_{function}_{column}` attribute that a query such as `withSum('orderItems', 'total_price')` loads, here `order_items_sum_total_price`. The package types that attribute from the first of these that applies:

1. An accessor or a `@property` tag that your model declares for the attribute.
2. A built-in cast that your model declares for the attribute.
3. What your database driver returns for the related column.

Most aggregates add `| null`, because SQL returns `NULL` for an aggregate over no rows. Three cases publish without it:

* **A count**: `whenAggregated()` with `'count'` publishes `number`, as `whenCounted()` does.
* **A function that isn't a string literal**: a function the call passes in a variable or a constant publishes `number`.
* **A declaration without `null`**: an accessor or `@property` whose type leaves out `null`, such as a getter that returns `$value ?? 0`, publishes that type.

On SQLite, for example:

```php
'last_sold_at' => $this->whenAggregated('orderItems', 'created_at', 'max'),  // last_sold_at?: string | null
'average_quantity' => $this->whenAggregated('orderItems', 'quantity', 'avg'), // average_quantity?: number | null
'revenue' => $this->whenAggregated('orderItems', 'total_price', 'sum', null, 0), // revenue: number | null
```

The published type follows the database connection of the machine that runs `ts:publish`. A `SUM()` of a decimal column publishes `number | null` from SQLite and `string | null` from MySQL. Publish against the database driver your app runs in production. The [generation cache](./generating-cache.md) rebuilds everything when `database.default` or a connection's driver changes, including a driver that the connection's `url` names.

To publish one type on every driver, cast the attribute on the parent model:

```php
class Product extends Model
{
    protected function casts(): array
    {
        return [
            'order_items_sum_total_price' => 'float', // number | null on every driver
        ];
    }
}
```

Laravel applies your model's casts to an aggregate attribute, but it never applies the related model's casts there. It casts no aggregate on its own except `withExists()`.

A cast publishes the type Laravel returns for it, so `integer` and `float` publish `number`, and `decimal:2` publishes `string`. The package can't see a cast you add at query time with `withCasts()`.

### Nested Resources

Reference another resource with `::make()`, `::collection()`, or `new`. The property takes that resource's interface, and the package imports it:

```php
// Optional, because whenLoaded() is conditional
'author' => UserResource::make($this->whenLoaded('user')),

// new works the same as ::make()
'author' => new UserResource($this->whenLoaded('user')),

// A list of resources
'tags' => TagResource::collection($this->whenLoaded('tags')),

// Required, because the argument isn't conditional
'owner' => UserResource::make($this->user),
```

Here `user` is a `BelongsTo` relation with a nullable foreign key, so `author` and `owner` add `| null`. The `author`, `tags`, and `owner` properties publish:

```typescript
author?: UserResource | null;
tags?: TagResource[];
owner: UserResource | null;
```

Inside another resource, Laravel sends a nested resource whose payload is `null` as `null`. So a resource built around a relation that can load `null` adds `| null`, as [Nullable Relations](#nullable-relations) describes. When the foreign key isn't nullable, `author` and `owner` publish `UserResource` without it. A list of resources, such as `tags`, never adds `| null`.

A resource built around a literal `null`, such as `new UserResource(null)`, publishes `null`.

A resource can reference itself:

```php
'parent' => CategoryResource::make($this->whenLoaded('parent')),
'children' => CategoryResource::collection($this->whenLoaded('children')),
```

Calling `resolve()` on a nested resource, as in `new UserResource($this->author)->resolve($request)`, publishes the same interface.

A named collection nests the same way, with `new` or `::make()`. Inside another resource, Laravel sends what the collection's `toArray()` returns, so a collection with a `toArray()` of its own publishes its interface:

```php
'staff' => new UserCollection($this->staff),
```

With the `UserCollection` from [Resource Collections](#resource-collections), whose `toArray()` returns `data` and `has_admin`, `staff` publishes `staff: UserCollection;`. A collection with no `toArray()`, or one whose `toArray()` returns the collected list, sends the bare list, so it publishes `UserResource[]`. An argument-less `toResourceCollection()` that finds a collection by name follows the same rule. Over an empty collection, Laravel skips the guess and sends `[]`, so when the guess would find `UserCollection`, the property publishes `UserCollection | never[]`.

A [JSON:API resource](#json-api-resources) nests differently. See [Nesting a JSON:API Resource](#nesting-a-json-api-resource).

### `toResource()` and `toResourceCollection()`

Laravel's `Model::toResource()` and `Collection::toResourceCollection()` find their resource three ways, and the package follows each one:

```php
// 1. An explicit class argument
'owner' => $this->owner->toResource(UserResource::class),

// 2. #[UseResource] or #[UseResourceCollection] on the model
'owner' => $this->owner->toResource(),

// 3. Laravel's naming convention: {Model}Resource, then {Model}
'owner_guessed' => $this->whenLoaded('owner', fn ($m) => $m->toResource()),
'attachment' => $this->whenLoaded('attachment', fn ($m) => $m->toResource()),
```

The naming convention is the only route that guesses a class name, and the package accepts the guess only when it publishes that resource. If the guessed class comes from another package, has `#[TsExclude]`, or sits outside the scanned directories, the property publishes `unknown` instead of importing a file that doesn't exist:

```typescript
owner_guessed?: UserResource; // the guessed UserResource is published
attachment?: unknown; // AttachmentResource exists, but has #[TsExclude]
```

Here `owner` can't load `null`. On a relation that can, `owner_guessed` publishes `UserResource | null`, as does `$this->owner?->toResource()`. See [Nullable Relations](#nullable-relations).

A resource you name yourself is always used, even when this package doesn't publish it. That covers a class argument, `#[UseResource]` or `#[UseResourceCollection]`, and a collection's `#[Collects]` or `$collects`. When no resource matches at all, the property publishes `unknown`.

A `?->` earlier in the same chain adds `| null` too, because PHP ends the whole chain with `null` when that step is `null`. A local variable ends the chain, so a call on it keeps the bare resource type:

```php
public function toArray(Request $request): array
{
    $grandparent = $this->parent?->parent;

    return [
        'grandparent' => $this->parent?->parent->toResource(),
        'siblings' => $this->parent?->children->toResourceCollection(),
        'local_grandparent' => $grandparent->toResource(),
    ];
}
```

On a `Category` resource, these keys publish:

```typescript
grandparent: CategoryResource | null;
siblings: CategoryResource[] | null;
local_grandparent: CategoryResource;
```

`$grandparent` can hold `null`, but calling `toResource()` on a `null` local throws instead of returning `null`, so `local_grandparent` never sends `null`.

### Enum Properties With `EnumResource`

Wrap an enum-cast property in `EnumResource::make()` to send the enum as an object instead of its bare value:

```php
'status' => EnumResource::make($this->status),
'currency' => EnumResource::make($this->currency),
```

See [Response Shape](./enum-api-resource.md#response-shape) on the Enum API Resource page for what the object holds. With `enums.use_tolki_package` enabled, which is the default, these publish `AsEnum<typeof Status>` and `AsEnum<typeof Currency>`, and the package imports each enum. With it disabled, they publish the enum's type alias, such as `StatusType`.

`EnumResource::collection()` does the same for a list, and publishes `AsEnum<typeof Status>[]`.

The enum can also come from a local variable, and the whole `EnumResource` can come from a helper method on the resource. Both publish the same `AsEnum` type:

```php
public function toArray(Request $request): array
{
    $status = $this->status;

    return [
        'status_from_local' => EnumResource::make($status),
        'status_from_helper' => $this->statusResource(),
        'visibility_from_helper' => $this->visibilityResource(),
    ];
}

public function statusResource(): EnumResource
{
    return EnumResource::make($this->status);
}

public function visibilityResource(): ?EnumResource
{
    return $this->visibility === null ? null : new EnumResource($this->visibility);
}
```

A helper that can return `null` adds `| null`:

```typescript
status_from_local: AsEnum<typeof Status>;
status_from_helper: AsEnum<typeof Status>;
visibility_from_helper: AsEnum<typeof Visibility> | null;
```

Wrapping a conditional value, as in `EnumResource::make($this->whenHas('status'))`, makes the property optional, as the conditional method alone would.

A ternary that wraps only one of its arms keeps both shapes. The property publishes a union, with the import each side needs, even inside an inline array:

```php
'audit' => [
    'status' => $request->boolean('wrap')
        ? EnumResource::collection($this->status_history)
        : $this->status_history,
],
```

The ternary publishes both arms:

```typescript
import { type AsEnum } from "@tolki/ts";

import { Status } from "../../enums";
import type { StatusType } from "../../enums";

export interface TeamResource {
  audit: { status: AsEnum<typeof Status>[] | StatusType[] };
}
```

Without the wrapper, a bare case such as `'status' => Status::Active` publishes the enum's type alias, `StatusType`, which matches the value Laravel sends for a backed enum. A pure enum's case publishes its alias too.

### Merge Operations

Use `merge()`, `mergeWhen()`, and `mergeUnless()` to add properties to the response:

```php
// Unconditional: the properties are required
$this->merge([
    'full_name' => $this->first_name . ' ' . $this->last_name,
    'total_display' => $this->total,
]),

// Conditional: the properties are optional
$this->mergeWhen($this->is_featured, [
    'weight' => $this->weight,
    'dimensions' => $this->dimensions,
]),
```

`merge()` and `mergeWhen()` also accept a closure or an arrow function instead of an array:

```php
$this->merge(fn () => [
    'currency_label' => $this->currency,
]),

$this->mergeWhen($this->paid_at !== null, fn () => [
    'shipped_at' => $this->shipped_at,
    'tracking' => $this->tracking_number,
]),
```

Each method decides whether its properties are required:

| Method                                       | Merged properties                                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `$this->merge([...])`                        | Required                                                                                                                            |
| `$this->mergeWhen($condition, [...])`        | Optional (`?`), included when `$condition` is true                                                                                  |
| `$this->mergeUnless($condition, [...])`      | Optional (`?`), included when `$condition` is false                                                                                 |
| `$this->mergeWhen($condition, [...], [...])` | The second array merges when `$condition` is false. A key both arrays set is required, with both types. A key one sets is optional. |

`mergeUnless()` takes a default the same way. Either array can be a closure instead, which Laravel calls with no arguments.

```php
$this->mergeWhen($this->paid_at !== null, [
    'state' => 'paid',
    'paid_by' => $this->user_id,
], [
    'state' => 0,
    'awaiting_payment' => true,
]),
```

`state` is in both arrays, so the response always has it:

```typescript
state: string | number;
paid_by?: number;
awaiting_payment?: boolean;
```

When the package can't type a key's value in one array, the key takes its type from the other array, as a ternary does. That holds even when the other array's value is a plain `null`.

A closure can return a different array on each path. A `return []` inside a `merge()` closure merges nothing, so the keys its other returns set publish optional:

```php
$this->merge(function () {
    if (! $this->user) {
        return [];
    }

    return [
        'user_name' => $this->user->name,
        'user_email' => $this->user->email,
    ];
}),
```

The closure publishes `user_name?: string` and `user_email?: string`.

A closure can also build its array in a variable and return it. The merge then publishes the keys that the variable's writes set, as [Building the Array in a Variable](#building-the-array-in-a-variable) describes. If an `unset()` that the package can't follow may remove one of its keys, the merge adds none of them. A variable the closure assigns is its own, even when the method has one with the same name.

A merge can also take the resource's own model, `$this->resource`, or a call to one of the resource's methods, such as `$this->labelFields()`, passed as it is or returned from a closure:

```php
return [
    'id' => $this->id,
    $this->merge(fn () => $this->labelFields()),
    $this->mergeWhen($this->color !== null, $this->resource),
];
```

A method call merges the keys the method returns. The model merges the keys its `toArray()` writes, with the model's own `#[TsCasts]` applied. That's the same set a resource with no `toArray()` publishes, as [JsonResource Base Delegation](#jsonresource-base-delegation) describes. Behind `mergeWhen()` or `mergeUnless()`, each merged key is optional.

A key the array sets before a merge publishes as it would without the merge, because Laravel doesn't let a merged key replace it. Here `id` stays a required `number`, though the model also has an `id`.

### Closure & Arrow Function Values

A closure or an arrow function in value position is typed from what it returns:

```php
// An arrow function: its expression is the value
'status' => $this->when(true, fn () => $this->status),

// An arrow function that returns a nested resource
'user' => $this->when(true, fn () => UserResource::make($this->user)),

// A full closure: the types of all its return statements are unioned
'notes' => $this->when(true, function () {
    return $this->notes;
}),
```

This works wherever a value goes, including `when()`, `whenLoaded()`, `whenNotNull()`, `merge()`, and `mergeWhen()`.

A closure that builds an array in a variable and returns it publishes the keys its writes set, as [Building the Array in a Variable](#building-the-array-in-a-variable) describes:

```php
'summary' => $this->when($this->published_at !== null, function () {
    $summary = ['id' => $this->id];

    if ($this->is_pinned) {
        $summary['flag'] = 'pinned';
    } else {
        $summary['flag'] = 0;
    }

    return $summary;
}),
```

The property publishes `summary?: { id: number; flag: string | number }`.

A first-class callable, such as `$this->label(...)` or `UserResource::make(...)`, creates a closure. Where Laravel calls the value, as `when()`, `whenLoaded()`, `mergeWhen()` and the other conditional methods do, it publishes what the call returns, whether you pass the callable directly or through a local:

```php
public function toArray(Request $request): array
{
    $label = $this->label(...);

    return [
        'label' => $this->when($request->has('label'), $label),                  // label?: string
        'supervisor' => $this->whenLoaded('supervisor', UserResource::make(...)), // supervisor?: UserResource | null
        'length' => strlen(...),                                                  // length: Record<string, never>
        $this->mergeWhen($request->has('stats'), $this->statFields(...)),         // views?: number
    ];
}

/** @return array{views: int} */
public function statFields(): array
{
    return ['views' => 1];
}
```

As a plain value, nothing calls it, and Laravel sends the `Closure` as `{}`, so a first-class callable there, like `length` above, publishes `Record<string, never>`. `ts:publish` warns about such a callable and names its line. Call the function instead, as in `'length' => strlen($this->name)`.

### Values Left Out of a Union

When the package can't type one value of a union, it leaves that value out and publishes the others. Here `opaqueTags()` and `opaqueNote()` declare no return type and return something the package can't type:

```php
'tags' => $this->is_published ? $this->opaqueTags() : [],   // tags: never[]
'note' => $this->is_published ? $this->opaqueNote() : null, // note: null
```

The same happens to a `??`, a `match`, a write to a closure's or helper's parameter inside a block, and a key that one branch of a returned array writes, where the writes join, as [Local Variables and Narrowing](#local-variables-and-narrowing) describes. Some unions widen to `unknown` instead, such as a method you read as a value when one of its returns can't be typed.

When what's left is only `null`, an empty array, or both, the published type claims the value is always that. `ts:publish` prints a warning after its summary, naming the class, the line, and the value it left out:

```text
App\Http\Resources\PostResource: The value on line 24 publishes `never[]`, an array that is always empty, because `$this->opaqueTags()` could not be typed and was left out of its union. Give what it reads a return type or a `@return` docblock.
```

For a value left as `null`, the message reads "publishes `null`, as if it were always null", and for both, "publishes `null | never[]`, as if it were always null or an empty array".

A ternary or a `??` that leaves out a value beside a typed one raises no warning. A value left out where a parameter's writes, a returned array's branches, a merge's two sides or a spread helper's returns join raises one, because the published type may not cover everything Laravel sends:

```text
App\Http\Resources\PostResource: The value on line 31 leaves out `$this->opaqueTitle()`, which could not be typed, so its published type may not admit every value it sends. Give what it reads a return type or a `@return` docblock.
```

Give the method a return type or a `@return` docblock, and its value joins the union again. An inline [`@var`](#typing-a-variable-with-var) that types the variable also removes the warning. `--quiet` hides every warning.

`ts:publish` doesn't analyze a class again while the [generation cache](./generating-cache.md) holds it. A class the cache serves prints none of these warnings, nor the first-class callable warning above, so run `php artisan ts:publish --fresh` to see every one.

## Method Calls, Variables, and Collections

Values you compute in `toArray()` get types too: method calls, property reads on other objects, local variables, and collection chains.

### Method Return Types

A method call takes its type from the called method's signature: its native return type, or its `@return` docblock when the native type is missing or vague. This works for calls on enum casts, date casts, models, Eloquent collections, value objects, and services resolved from the container:

```php
public function toArray(Request $request): array
{
    $record = $this->resource;

    return [
        'priority_label' => $this->priority->label(),                                 // enum cast
        'published_date' => $this->published_at->setTimezone('UTC')->toDateString(),  // date cast
        'from_label' => Priority::from(1)->label(),                                   // enum constructor
        'record_class' => $record::className(),                                       // static call on a variable's class
        'author_fresh' => $this->author->fresh(),                                     // model
        'comment_ids' => $this->comments->modelKeys(),                                // Eloquent collection
    ];
}
```

Each call publishes its method's return type:

```typescript
export interface PostResource {
  priority_label: string;
  published_date: string;
  from_label: string;
  record_class: string;
  author_fresh: User | null;
  comment_ids: number[];
  // …
}
```

A property read works the same way. Once `$post` holds a `Post`, `$post?->author?->name` publishes `string | null`. A value object's public property takes its declared type, so `$this->stats?->views` publishes `number | null`. A `?->` adds `| null` to the result once, however many steps use it.

When the declaration says too little, as with no return type, `mixed`, or a bare `array`, the method's own `return` statements set the type:

```php
public function toArray(Request $request): array
{
    return [
        'headline' => $this->headline(),
        'size' => $this->size(),
    ];
}

private function headline()
{
    return strtoupper($this->title);
}

private function size(): mixed
{
    if ($this->word_count > 1000) {
        return 'long';
    }

    return 1.5;
}
```

Each key publishes what its method's returns hold:

```typescript
headline: string;
size: string | number;
```

Every `return` counts, so one the package can't type leaves the key `unknown`. A method that yields or returns a closure publishes `unknown` too. A method with no return type that can end without returning a value adds `| null`. This reading applies to the methods in your app, not to a vendor package's methods.

A call to a method the resource declares takes that method's type, even when the backing model declares a method with the same name, because PHP runs the resource's method. Here the `Invoice` model declares `total(): string`, which formats the amount:

```php
'total' => $this->total(),                     // total: number
'formatted_total' => $this->resource->total(), // formatted_total: string

public function total(): mixed
{
    return (float) $this->resource->total;
}
```

`$this->resource->total()` calls the model's method directly, so it publishes the model's type. When neither the resource method's declaration nor its body types the call, the key publishes `unknown`, never the model method's type. Give the method a return type to fix it. The same holds for a `$resource` redeclared as a class other than a model, such as `/** @var CartTotals */ public $resource;`. If `CartTotals` doesn't declare the method you call, the key publishes `unknown`, because Laravel throws there.

Some of Laravel's own methods declare loose types, so the package reads the model instead. `getKey()` publishes the model's key type, `number` or `string`, and `modelKeys()` publishes a list of it. That's why `comment_ids` above is `number[]`. `resolveRouteBinding()` publishes the model you call it on, or `null`, so `$this->author?->resolveRouteBinding($this->user_id)` publishes `User | null`.

`getKey()` publishes the key type on any model the package can name, including one a variable holds, such as a `whenLoaded()` closure parameter, a `map()` element, or a helper's `Post $post` parameter. So `$this->comments->map(fn ($comment) => $comment->getKey())` publishes `number[]`.

A model that no database row backs yet has no key, so its `getKey()` adds `| null`. That covers a model you build with `new`, `replicate()`, `replicateQuietly()` or `newInstance()`, and one that a query, a relation or a factory builds without saving it:

```php
'draft_id' => Post::make(['title' => 'Draft'])->getKey(),       // number | null
'found_id' => Post::firstOrNew(['title' => 'Draft'])->getKey(), // number | null
'reply_id' => $this->resource->comments()->make()->getKey(),    // number | null
'fake_user_id' => User::factory()->make()->getKey(),            // number | null
'created_id' => Post::create(['title' => 'Draft'])->getKey(),   // number
```

A call that returns the same model, such as `(new Post)->fill([...])`, keeps the `| null`. A helper's `Post $post` parameter adds it only where the call passes a model no row backs yet. The package doesn't follow `save()`, so a model you save after `new` still publishes `number | null`. On a model whose `$primaryKey` is `null`, `getKey()` publishes `null`.

A model you build with `new` and no attributes holds no columns either, so Laravel sends `null` for each one, and a column read on it adds `| null`. `(new Post)->title` publishes `string | null`. A column you set keeps its type, whether you pass it to the constructor, `fill()` it, or write it, as in `$post->title = 'Draft'`. So does every column of a model from `replicate()`, `firstOrNew()` or a factory's `make()`. A relation, an accessor, and a column your model's `$attributes` gives a default publish their types as usual.

On an abstract model, `getKey()` publishes the key type the class declares, through `$keyType`, `HasUuids`, `HasUlids` or Laravel 13's `#[Table]`, joined with the key type of each published model that extends it. So a base whose subclasses key by integer and by UUID publishes `number | string`. When the abstract model works its key out in code, such as in an overridden `getKeyType()`, `getKey()` publishes `unknown`.

`getAuthIdentifier()` on an authenticatable model publishes the type of the column the model identifies users by. That's the key type, or the type of the column a literal `getAuthIdentifierName()` returns, so a model whose `getAuthIdentifierName()` returns `'email'` publishes `string`. A model no row backs yet adds `| null`, and a model that overrides `getAuthIdentifier()` publishes the return type it declares.

A method that returns a plain PHP `DateTime` or `DateTimeImmutable` publishes `{ date: string; timezone_type: number; timezone: string }`, the object `json_encode()` writes for it. A Carbon date publishes `string`, or `Date` under `timestamps_as_date`, and so do the `now()` and `today()` helpers, which return one. A `DateTimeInterface` can hold either kind, so it publishes the Carbon date's type or that object, and a `CarbonPeriod` publishes a list of the Carbon date's type. A `CarbonInterval` publishes the `DateInterval` fields `json_encode()` writes for it, such as `y`, `m`, `d` and `days`. `str($value)` publishes `string`, and `str()` with no argument publishes `Record<string, never>`. `url($path)` publishes `string` when the path can't be `null`, and `unknown` when it can or has no type.

A value built in place publishes what `json_encode()` writes for it as well, so `new DateTime()` publishes that date object and `new RuntimeException('x')` publishes `Record<string, never>`. `new Collection($items)` publishes as `collect($items)` does. `new stdClass`, and a method declared to return `stdClass`, publish `Record<string, unknown>`, because a `stdClass` can gain properties at run time.

These values stay `unknown` when built in place:

* An `Arrayable` or a `Responsable`
* An Inertia `ProvidesInertiaProperty` class
* A model
* A class with no public property and no `__toString()`

Type such a key with [`#[TsCasts]`](#overriding-property-types-with-tscasts), or give the class a [`#[TsType]`](./custom-types.md). A `new` of a class that has or inherits one publishes that type, unless the class is a model.

`array_values()` keeps the element type and publishes a list. An `(object)` cast publishes the object `json_encode()` writes: a shape keeps its keys, a list becomes a `Record` keyed by its indexes, and `(object) []` publishes `Record<string, never>`. An `(array)` cast of an array keeps the array's type:

```php
public function toArray(Request $request): array
{
    return [
        'tags' => array_values(array_filter($this->tags())),
        'count_list' => array_values($this->tagCounts()),
        'tag_counts' => (object) $this->tagCounts(),
        'tag_object' => (object) $this->tags(),
        'size' => (object) ['width' => 640, 'label' => 'large'],
        'counts' => (array) $this->tagCounts(),
    ];
}

/** @return list<string> */
private function tags(): array
{
    return explode(',', $this->title);
}

/** @return array<string, int> */
private function tagCounts(): array
{
    return array_count_values($this->tags());
}
```

Each key publishes the list or object PHP sends:

```typescript
export interface PostTagsResource {
  tags: string[];
  count_list: number[];
  tag_counts: Record<string, number>;
  tag_object: Record<string, string>;
  size: { width: number; label: string };
  counts: Record<string, number>;
}
```

A method that returns the base `Model` class, `Illuminate\Foundation\Auth\User`, an abstract model, or a model that isn't published, such as one in `models.excluded`, publishes `unknown`, because no published file has a type for it. Declare the concrete model as the return type, such as `: Order`, to type the value.

#### Methods Declared as a Bare `array`

A method declared `: array` with no `@return` docblock says nothing about its keys. For these methods, the array the body returns sets the type:

```php
final class PriceQuoteService
{
    public const int TIER_BASIC = 1;

    public const int TIER_PRO = 2;

    public function quote(): array
    {
        return ['unit' => '1.00', 'minimum' => 10, 'discounted' => ['unit' => '0.90']];
    }

    public static function tierLabels(): array
    {
        return [self::TIER_BASIC => 'Basic', self::TIER_PRO => 'Pro'];
    }
}

// in toArray():
'quote' => resolve(PriceQuoteService::class)->quote(),
'tiers' => PriceQuoteService::tierLabels(),
```

Both properties publish the returned array as the resource sends it:

```typescript
export interface QuoteResource {
  quote: { unit: string; minimum: number; discounted: { unit: string } };
  tiers: string[];
}
```

Integer keys, written literally or as a constant such as `self::TIER_BASIC`, publish as Laravel sends them. A resource sends an array whose keys are all numeric as a list, so `tiers` publishes `string[]`. A numeric key beside a named key stays, as in `{ name: string; "42": boolean }`, and a resource with `$preserveKeys`, or `#[PreserveKeys]` on Laravel 13, keeps every key.

Outside a resource, such as in an Inertia page prop, `tiers` publishes `{ "1": string; "2": string }`, because JSON encodes such an array as an object. In a resource, `collect([...])` keeps its keys as the value of a top-level key, so `'codes' => collect([200 => 'OK', 404 => 'Not Found'])` publishes `{ "200": string; "404": string }`.

A `?array` declaration keeps its `null`, so the method publishes the shape `| null`. An `array|false` declaration keeps its `false` the same way.

What the body reads from the method's parameters is typed too, whether you use its result as a value or spread it. Each parameter holds its declared type, from the signature, or from a `@param` tag when the signature's type is missing or vague, such as `array`. A parameter with no type, or only `mixed`, holds what each call passes, and a collection you pass keeps its model, so a read such as `$comments->first()?->content` is typed. A closure you pass is the exception: in `$this->hold(fn () => 5)`, the parameter holds `unknown`, because a resource sends a closure as `{}`. A first-class callable that Laravel calls gets the value Laravel calls it with, as in `whenLoaded()`:

```php
'card' => $this->card($this->resource),                              // card: { id: number; title: string }
'author_card' => $this->authorCard($this->author),                    // author_card: { name: string }
'loaded_card' => $this->whenLoaded('author', $this->authorCard(...)), // loaded_card?: { name: string }
'first_comment' => $this->firstContent($this->comments),             // first_comment: { first: string | null }

private function card(Post $post): array
{
    return ['id' => $post->id, 'title' => $post->title];
}

private function authorCard($author): array
{
    return ['name' => $author->name];
}

private function firstContent($comments): array
{
    return ['first' => $comments->first()?->content];
}
```

When the method can return something other than an array literal, apart from a `null`, boolean, string, or number literal its declaration allows, the package reads each `return` as a value instead, as [Method Return Types](#method-return-types) describes. So a method that returns a collection pipeline publishes its list:

```php
'contents' => $this->contents(), // contents: string[]

private function contents(): array
{
    return $this->comments->map(fn ($comment) => $comment->content)->values()->all();
}
```

The pipeline can also start at a relation of a model parameter, at a query's `get()`, or at a local holding either:

```php
final class CommentRowsService
{
    public function forPost(Post $post): array
    {
        return $post->comments->map(fn ($comment) => ['id' => $comment->id])->values()->all();
    }

    public function unflagged(): array
    {
        $rows = Comment::query()->where('is_flagged', false)->get();

        return $rows->map(fn ($comment) => ['id' => $comment->id])->all();
    }
}

// in toArray():
'post_rows' => resolve(CommentRowsService::class)->forPost($this->resource), // post_rows: { id: number }[]
'unflagged_rows' => resolve(CommentRowsService::class)->unflagged(),        // unflagged_rows: { id: number }[]
```

A method that builds its array in a variable and returns it publishes the keys its writes set. Beside a `return` of another array, each `return` is one shape of a union:

```php
'summary' => $this->summary($request), // summary: { id: number } | { id: number; title: string }

private function summary(Request $request): array
{
    if ($request->boolean('short')) {
        return ['id' => $this->id];
    }

    $data = ['id' => $this->id];
    $data['title'] = $this->title;

    return $data;
}
```

If one `return` can't be typed, or the method yields, the property publishes `unknown`.

When you use the method's result as a value, a value in the array that is an enum or a model publishes `unknown`, because a method body can't supply the import it needs. The rest of the shape keeps its types, and an enum's `->value` or `->name` publishes the literal union of its values or names, as [Reading `->value` and `->name`](./enums.md#reading-value-and-name) describes. Spreading the same method keeps an enum's type. To type that value, build the array in `toArray()` itself, or override the property with [`#[TsCasts]`](#overriding-property-types-with-tscasts) and a type your frontend exports, as in `['type' => 'StatusPayload', 'import' => '@/types/payloads']`. An entry imports only a type it names whole, so a type named inside a shape you write in the entry isn't imported.

Here a `Post` casts `status` to the int-backed `PostStatus` enum, whose cases are `Draft = 0` and `Published = 1`. The resource uses `statusLabel()` as a value, then spreads it:

```php
public function toArray(Request $request): array
{
    return [
        'label' => $this->statusLabel($this->status),
        ...$this->statusLabel($this->status),
    ];
}

private function statusLabel(PostStatus $status): array
{
    return ['name' => $status->name, 'value' => $status->value];
}
```

`label` publishes the literal unions, and the spread keys publish the enum's aliases:

```typescript
import type { PostStatusKind, PostStatusType } from "../../enums";

export interface PostLabelResource {
  label: { name: "Draft" | "Published"; value: 0 | 1 };
  name: PostStatusKind;
  value: PostStatusType;
}
```

A model's own `toArray()`, called as a value, publishes `Record<string, unknown>`, because the relations it includes depend on what's loaded at runtime. A relation's collection, as in `$this->comments->toArray()`, publishes `Record<string, unknown>[]`. To publish the model's keys, spread it instead, as [Model `toArray()` Spread](#model-toarray-spread) shows.

An `only()` or `except()` call names no class, so its result keeps its shape:

* A literal key list publishes its inline shape, with any enum- or model-typed member left `unknown`.
* A runtime key list publishes `Record<string, unknown>`.
* A to-many relation publishes `unknown[]`.

The same applies when the method reads an accessor whose getter calls `only()` or `except()`. A model that overrides `only()` or `except()` with a declared return type publishes that type instead. A model return, such as `: static`, becomes an object with the model's columns and appended accessors, narrowed to the literal keys. An enum or other class return leaves the value `unknown`.

This `Comment` method shows each case:

```php
// On Comment, read from a resource as 'summary' => $this->relationSummary()
public function relationSummary(): array
{
    return [
        'id' => $this->id,
        'author' => $this->user->only(['id', 'name']),
        'author_role' => $this->user?->only(['id', 'role']),
        'replies' => $this->replies->only([1, 2]),
    ];
}
```

The `role` column is an enum, so it's left `unknown`, and the to-many `replies` publishes `unknown[]`:

```typescript
summary: { id: number; author: { id: number; name: string }; author_role: { id: number; role: unknown } | null; replies: unknown[] };
```

#### Resource Macros

Laravel runs a macro you register on `JsonResource` before it forwards a call to the model, so a call the macro answers publishes what the macro returns, never the type of a model method with the same name:

```php
// In a service provider's boot() method
JsonResource::macro('label', function (): string {
    return strtoupper($this->resource->title);
});

// In a Post resource, where the Post model declares label(): int
'label' => $this->label(),                 // label: string
'model_label' => $this->resource->label(), // model_label: number
```

`$this->resource->label()` calls the model directly, so it keeps the model's type. `$this?->label()`, `static::label()`, `self::label()` and `$this::label()` reach the macro, as `$this->label()` does. A method the resource declares or inherits, such as `whenLoaded()`, runs before any macro with its name, so a macro never changes it.

The package types a macro from its native return type, then its `@return` docblock, then its body. It reads the body without the values the call passes, so a body whose result depends on its arguments publishes `unknown`. It doesn't read the body of a closure declared outside a class method, such as in `bootstrap/app.php`. To type such a macro, give the closure a return type. A `@return` docblock works only on a closure declared inside a class, such as in a service provider's `boot()` method.

The package sees the macros your app registers while it boots. It doesn't see a macro registered later, or by a deferred service provider, so a call to that macro publishes as if the macro didn't exist.

Registering, removing, or re-pointing a macro makes the next `ts:publish` rebuild every class instead of reusing the [generation cache](./generating-cache.md).

### Local Variables and Narrowing

A variable keeps the type of the value you assign it, so you don't need to inline the expression:

```php
public function toArray(Request $request): array
{
    $slug = $this->slug;

    return [
        'slug' => $slug, // string, as if you returned $this->slug
    ];
}
```

A variable assigned inside an `if`, a loop, or a `try` block keeps that type for the reads after it in the same block:

```php
'title_or_count' => $this->when($request->has('title'), function () {
    if ($this->is_pinned) {
        $title = $this->title;

        return $title;
    }

    return 7;
}), // title_or_count?: string | number
```

A conditional value keeps its `?` through the variable, and through a `??` or a ternary. With `$loaded = $this->whenLoaded('author')`, `'author' => $loaded ?? 'none'` publishes `author?: User | string`: a missing value isn't `null`, so `??` returns it, and Laravel drops the key.

A closure or arrow-function parameter with the same name doesn't affect the outer variable. Inside its own closure, the parameter holds its own value:

```php
public function toArray(Request $request): array
{
    $member = $this->slug;

    return [
        'outer_member' => $member, // string
        'mapped_members' => $this->members->map(fn ($member) => $member), // User[], since this $member is the map's element
    ];
}
```

A closure that captures the variable by value, with `use ($member)`, and reassigns it doesn't change the outer variable either. Only `use (&$member)` does. An arrow function never does.

A variable you write more than once publishes every value that can reach the read. A write that always runs replaces the value before it, and a write inside an `if`, a loop, a `try`, or a `catch` joins it:

```php
public function toArray(Request $request): array
{
    $status = 'draft';

    if ($this->is_pinned) {
        $status = 1;
    }

    $first = null;

    foreach ($this->comments as $comment) {
        if ($comment->content !== '') {
            $first = $comment->content;

            break;
        }
    }

    return [
        'status' => $status, // status: string | number
        'first' => $first,   // first: string | null
    ];
}
```

Each read sees only the writes that reach it. After `$x = $this->notes;`, a guard that returns `['early' => $x]` publishes `early: string | null`, and a later `$x = $this->resource->getKey(); return ['late' => $x];` publishes `late: number`. A write that reads the variable itself, as in `$label = $label.$this->title` or `$row = ['v' => $row]`, builds on the value before it.

A closure's or a helper's parameter follows the same rules. A write that always runs replaces the value the parameter was passed. A write inside a block is what later reads in that block see, and past the block it joins the value the parameter was passed. Here `$this->labelFor($this->title)` publishes `string | number`:

```php
private function labelFor(string $label)
{
    if ($this->is_pinned) {
        $label = $this->id;
    }

    return $label;
}
```

A write to a closure's or helper's parameter inside a block, or a key one branch writes, that the package can't type is left out of the join, as [Values Left Out of a Union](#values-left-out-of-a-union) describes. On a plain local, such a write makes the read publish `unknown`.

A check that rules out `null` drops it from the reads it covers. With `$score = $this->rating` on a nullable column, `$score !== null ? $score : 'none'` publishes `string`, and so does `$this->when($score, fn () => $score)`, as an optional property.

Some variables still publish `unknown`:

* One a reference can write, through `use (&$x)`, `$alias = &$x`, `global` or `static`
* One you change with `.=`, `++` or another compound assignment, apart from adding an array with `+=` as described below
* One an `unset()` may remove
* One you pass to a by-reference parameter that can change the value's form, such as `settype()`, `parse_str()`, or one of your own methods

Variables assigned inside a closure body follow the same rules within that closure. A reassignment inside an `if` branch that ends in `return` or `throw` applies only inside that branch, so the code after it keeps reading the original variable.

`preg_match()` writes its `$matches` as a list of strings. After `preg_match('/(\w+)-(\d+)/', $this->slug, $matches)`, both `$matches` and `$matches ?? []` publish `string[]`. A pattern with a named group, or a call that passes flags such as `PREG_OFFSET_CAPTURE`, writes the groups keyed by name or nested. The package doesn't type those groups, so `$matches ?? []` publishes `never[]`. A call that may not run, such as one inside an `if`, types `$matches` only when nothing else writes the variable.

A literal key read on a variable that holds an array shape takes that key's type. With `$row = ['a' => 1, 'b' => 'x']`, `$row['b']` publishes `string`, and `$row['c'] ?? null`, a key the shape lacks, publishes `null`. A `map()` parameter and a method whose `@return` declares a shape work the same way, so `$this->pair()[1]` on a method declared `@return array{int, string}` publishes `string`.

A by-reference built-in that keeps the value's form keeps its type:

* `ksort()` keeps any array. With flags that compare keys as strings, such as `SORT_STRING`, it keeps only an array that publishes as an object.
* `uksort()`, `krsort()`, `asort()`, `arsort()`, `uasort()`, `natsort()` and `natcasesort()` keep only an array that publishes as an object, such as `{ b: number; a: number }`.
* `sort()`, `rsort()`, `usort()` and `shuffle()` keep a list, such as `string[]`. They re-index an array that publishes as an object, so such a variable publishes `unknown`.
* `array_pop()` and `array_shift()` keep a list. On an array that publishes as an object the variable publishes `unknown`, because a key the shape requires may be gone.
* `array_push()`, `array_unshift()` and `array_splice()` keep a list when each value you add fits its element type.
* The `$count` argument of `str_replace()`, `str_ireplace()`, `preg_replace()` and `preg_replace_callback()` keeps `number`.
* `array_walk()` and a `foreach` by reference keep the type when each write in the callback or the loop fits the element's type. `array_walk_recursive()` keeps a nested array's type when each write fits the leaves it visits.

A key-keeping sort on a list reorders its keys, so what it publishes depends on where the value goes. In an API resource it still publishes the list, because Laravel re-indexes the result. In Inertia props and other places that send the value as-is, it publishes `Record<number, T>`.

In an `array_walk()` callback, a compound write counts as the operation it performs: `.=` writes a string, and `+=`, `-=`, `*=`, `/=`, `%=`, `**=` and `++` write a number. The callback sees only its own parameters and its `use` imports. An arrow function also sees the outer scope.

A copy taken before the call keeps the type the variable had, and a copy taken after it reads what the call left:

```php
$copy = $original;
sort($original); // $copy keeps the type $original had before the sort
```

A call on one of a local's keys, such as `sort($groups['x'])`, keeps the local's type when it keeps that key's form.

A variable you build with key writes or `+=` and read as a value publishes the keys written before the read:

```php
$meta = ['id' => $this->id];
$meta['name'] = $this->name;
$early = ['meta' => $meta];
$meta['late'] = true;

return [
    'meta' => $meta,   // meta: { id: number; name: string; late: boolean }
    'early' => $early, // early: { meta: { id: number; name: string } }
];
```

For a variable that `toArray()` returns, the package follows each write the same way, as [Building the Array in a Variable](#building-the-array-in-a-variable) describes.

To type a variable the package can't read, annotate its assignment. See [Typing a Variable With `@var`](#typing-a-variable-with-var).

#### Narrowing With `instanceof`

An early-exit `instanceof` guard narrows a variable for the statements after it, up to the end of the block it sits in. Here `attachable` is a `morphTo`, so `$parent` can hold several models until the guard proves it holds a `Post`:

```php
$record = $this->attachable;

return [
    'parent' => $this->whenLoaded('attachable', function () {
        $parent = $this->attachable;

        if (! $parent || ! $parent instanceof Post) {
            return null;
        }

        return [
            'title' => $parent->title,
            'class' => $parent::className(),
            'morph' => $parent->getMorphClass(),
        ];
    }),
    'record_title' => $record instanceof Post ? $record->title : null,
];
```

In both properties, the reads resolve against `Post`:

```typescript
export interface AttachmentResource {
  parent?: { title: string; class: string; morph: string } | null;
  record_title: string | null;
}
```

An `if` narrows a variable wherever its test is proven:

* **After a guard**: an `if` whose body ends in `return` or `throw` narrows the reads after it, up to the end of the block it sits in. Inside a loop, so does one whose body ends in `continue` or `break`. A guard nested in a loop or in another `if` narrows only the rest of that block.
* **Inside a positive test**: `if ($parent instanceof Post) { ... }` narrows the reads in its block. An `elseif` or `else` sees the earlier tests fail, so the `else` of `if (! $parent instanceof Post) { ... }` reads `Post`.

```php
$owner = $this->imageable;
$data = [];

if ($owner instanceof Post) {
    $data['post_title'] = $owner->title;
} elseif ($owner instanceof User) {
    $data['user_email'] = $owner->email;
}

return $data; // post_title?: string; user_email?: string
```

The test can be one `instanceof`, negated or not, or an `||` chain of tests on the same variable, which narrows to any of their classes. A positive test can also join tests with `&&`. A positive test whose `||` joins two different variables narrows neither. A guard whose negated tests are joined with `||` narrows each, and one joined with `&&` narrows none. The test must read a local variable, a closure parameter, or a `foreach` value variable, not a property such as `$this->author`.

A write to the variable between the test and the end of what it narrows cancels the narrowing, even for the reads before that write. A write through one of its members keeps the narrowing when it stores a literal the member's column holds, such as `$parent->title = 'Draft'`, or names no column or relation, such as `$parent->touched = true`. A write before the test doesn't matter, since the test checks the value it leaves.

A read in a guard's own body, in a `return` placed before the guard, or in the `if` condition itself still sees every class the variable can hold.

Narrowing applies to reads through the variable, such as `$parent->title`. A local's own value, as in `'parent' => $parent`, keeps its full union type. A closure parameter bound to one model is the exception: under a test for a published subclass of that model, its own value publishes the subclass, so `$this->whenLoaded('post', fn ($post) => $post instanceof DraftPost ? $post : null)` publishes `DraftPost | null`.

An `instanceof` ternary on a variable narrows its true arm the same way, as `record_title` above shows, and so does an `||` chain of tests on that variable. A negated test, such as `! $post instanceof Post ? null : $post->title`, narrows the false arm instead. A ternary that tests a chain of property reads on `$this` narrows reads through the same chain in its arm, so `$this->imageable instanceof Post ? $this->imageable->getKey() : null` publishes `number | null`.

A test that checks `$this->resource` against one model narrows the backing model wherever it's proven: in a ternary's arm, in an `if` block, or after a guard. So a relation that only a subclass declares resolves there. On a `Team` resource, `$this->resource instanceof SubscribedTeam ? $this->resource->subscriber?->name : null` publishes `string | null`. A method of the resource that the proven code calls reads the narrowed model too, so `$this->resource instanceof SubscribedTeam ? $this->subscriberName() : null` publishes `string | null` when `subscriberName()` returns `$this->resource->subscriber?->name`. In a resource collection, the same test narrows the collected items to the paginator it names, as [Reading `$this->resource`](#reading-this-resource) shows.

A variable assigned from an `instanceof` ternary keeps the narrowing for every read through it. The test can be an `||` chain of `instanceof` checks. Here `imageable` is a `morphTo` whose possible models include one with a string key:

```php
$either = $this->imageable instanceof Post || $this->imageable instanceof User ? $this->imageable : null;

return [
    'either_id' => $either?->getKey(),          // number | null
    'open_id' => $this->imageable?->getKey(),   // number | string | null
];
```

The same holds when the proven arm reads through the tested variable or `$this->resource`:

```php
$subscriber = $this->resource instanceof SubscribedTeam ? $this->resource->subscriber : null;

return [
    'subscriber_name' => $subscriber?->name, // string | null
];
```

These forms don't narrow:

* **The ternary's own value**: `'either' => $either` publishes the whole union. Only reads through the variable narrow.
* **An `if` that tests a property**: inside `if ($this->imageable instanceof Post) { ... }`, `$this->imageable` still reads every model the `morphTo` can hold. Assign it to a local and test that instead.
* **A test on a different spelling of the arm's value**: a variable bound to a ternary that tests `$this->resource->imageable` against a `$this->imageable` arm isn't narrowed.
* **Mixed conditions in a ternary**: a test joined with `&&`, or an `||` chain that mixes negated and plain tests.
* **The arm the test doesn't prove**: `$this->resource instanceof SubscribedTeam ? null : $this->resource->subscriber` publishes `unknown`, since `Team` has no `subscriber` relation.

#### Typing a Variable With `@var`

When the package can't type a variable's value, an inline `@var` on its assignment types it. This resource wraps a `CartTotals` value object instead of a model:

```php
/** @var CartTotals $totals */
$totals = $this->resource;

return [
    'subtotal' => $totals->subtotal, // number, from CartTotals' declared property
    'totals' => $totals,             // { subtotal: number; chargeable: boolean; count: number; hasExtras: boolean }
];
```

It also restores a value the package would otherwise drop. Without the annotation, `$picked` below publishes `null`, because the package [leaves out a ternary arm it can't type](#values-left-out-of-a-union):

```php
/** @var string|null $picked */
$picked = $this->id > 0 ? json_decode('"x"') : null; // string | null
```

The annotation follows these rules:

* **Placement**: it sits on a `$x = ...;` statement anywhere in the method or closure body, including inside an `if` or a loop. It names the variable, as in `/** @var CartTotals $totals */`, or names none, as in `/** @var CartTotals */`.
* **Span**: it types the reads after that statement, up to the next statement that writes the variable. A loop that writes the variable ends the span where the loop starts. So an annotation also types a variable you reassign, until its next write. Inside a block, it types the reads after it in that block. Past the block, where the variable held a value before it, the annotated type joins that value. Where the variable held none, reads past the block aren't typed. With `$post = null;` before an `if` whose annotated assignment reads `/** @var Post|null $post */`, `$post?->title` after the `if` publishes `string | null`.
* **Precedence**: it applies only where the package's own reading of the value is `unknown`, or is only the `null` left after an arm it can't type was dropped. Any other reading stands, whatever the annotation says: `/** @var int $n */ $n = $this->title;` still publishes `string`. To override a type the package got wrong, use [`#[TsCasts]`](#overriding-property-types-with-tscasts).

A conditional value stays optional, so `/** @var User $reviewer */ $reviewer = $this->whenLoaded('reviewer');` publishes `reviewer?: User`.

A closure parameter you reassign reads the new value from that statement on, when the value or an annotation names its class. In `function (User $author)`, `$author = $author->profile;` makes the reads after it use `Profile`. `find()` with one literal key returns one of the collection's models or `null`. After `$author = $author->comments->find(1);`, `$author?->content` publishes `string | null`, and `$author->name` publishes `unknown`, since a comment has no `name`. A read of the variable itself after that write publishes `unknown`, as `first()` does.

A write the package can't type keeps a model parameter's model, so after `$author = $this->normalize($author);`, where `normalize()` declares no return type, both `$author->name` and `return $author;` still read `User`. Annotate such an assignment, as in `/** @var Comment $author */`, and the reads follow the annotation. A write of a typed value is read as that value, so after `$author = $author->name;`, `return $author;` publishes `string`. A parameter that holds a plain value takes what any write returns, so after `$title = json_decode($title);`, `return $title;` publishes `unknown`. A `foreach` variable bound to a model keeps reading that model.

The annotation's type counts only when it's built from these forms, and when every part of it resolves:

* Scalars: `int`, `string`, `bool`, `float`, `null`, `true`, and `false`
* A class, interface, or enum that the file imports or writes in full
* `list<X>`, `array<int, X>`, `array<string, X>`, and `array<'a'|'b', X>`
* `array{...}` and `object{...}` shapes with plain or quoted keys, and `list{...}` tuples
* `Collection<K, X>`, for both Laravel's support collection and its Eloquent collection
* A `callable` as a shape's member, which publishes `unknown`
* Unions of these forms, such as `Comment|User|null` or `list<User>|User`, and `?` before any form

Any other type is ignored, so write `list<int>` instead of `int[]`. A model or enum inside a shape is ignored too. A `?` before a shape adds `| null` even when a member already holds `null`, so `?array{a: ?int}` publishes `{ a: number | null } | null`.

### Collection Pipelines

A chain of collection methods keeps its element type to the end, whether it starts at a relation, a local, a query, or `collect()`:

```php
return [
    'comment_ids' => $this->comments->map(fn ($comment) => $comment->id)->values()->all(),
    'title_words' => collect(explode(' ', $this->title))->map(fn ($word) => ['word' => $word])->values()->all(),
    'author_name' => data_get($this->author, 'name'),
    'author_name_or_guest' => data_get($this->author, 'name', 'guest'),
    'doubled' => $this->comments->concat($this->comments)->values(),
];
```

Each chain publishes its element type:

```typescript
export interface PostResource {
  comment_ids: number[];
  title_words: { word: string }[];
  author_name: string | null;
  author_name_or_guest: string | null;
  doubled: Comment[];
  // …
}
```

These helpers and methods publish as follows:

* **`all()` and `values()`**: a collection and the array behind it both publish `X[]`, so `all()` changes nothing. A method that breaks sequential keys, such as `filter()`, `sortBy()`, or `keyBy()`, adds a `Record<string, X>` arm, because `json_encode()` writes such a collection as an object. The arm stays through a local and through a later `map()`. `values()` restores sequential keys and removes that arm.
* **`collect()`**: the element type comes from the argument, and the `map()` parameter holds that element, which is why `$word` above is a `string`. On its own, `collect([...])` publishes the list or object its array encodes as, such as `number[]` for `collect([1, 2])` or `{ title: string }` for `collect(['title' => $this->title])`. `collect()` with no argument publishes `never[]`. A bare array literal publishes the same way, so `['a', 'b']` publishes `string[]`. A list holding an element the package can't type publishes `unknown[]`.
* **`data_get()`**: `data_get($target, 'a.b')` publishes what `$target?->a?->b` would. A default joins the type instead of removing `null`, because `data_get()` returns the default only when the key is missing, not when its value is `null`.
* **`map()` parameters**: the callback's parameter holds the collection's element, with or without a type hint, whether the collection comes from a relation, a local, a `whenLoaded()` parameter, `getRelation()`, a query's `get()`, or `collect()`. Every read through it is typed, chained and nullsafe reads included. A class type hint, such as `fn (Comment $comment)` or a value object's class, types the parameter whatever the collection holds. A write that replaces the parameter is followed into the body.

Here `PromoCode` is a value object with a `string` property `code`:

```php
public function toArray(Request $request): array
{
    $rows = $this->comments;
    $byContent = $this->comments->keyBy('content');

    return [
        'collected_reads' => collect($this->comments)->map(fn ($comment) => ['content' => $comment->content, 'who' => $comment->user?->name])->all(),
        'local_rows' => $rows->map(fn ($comment) => ['who' => $comment->user?->name]),
        'author_names' => $rows->map(function (Comment $comment) {
            $comment = $comment->user;

            return $comment->name;
        }),
        'keyed_rows' => $byContent->map(fn (Comment $comment) => ['id' => $comment->id])->all(),
        'query_rows' => Comment::query()->get()->map(fn (Comment $comment) => ['id' => $comment->id])->all(),
        'codes' => collect([new PromoCode('a')])->map(fn (PromoCode $code) => ['id' => $code->code])->all(),
    ];
}
```

Each map publishes its callback's shape:

```typescript
collected_reads: { content: string; who: string | null }[];
local_rows: { who: string | null }[];
author_names: string[];
keyed_rows: { id: number }[] | Record<string, { id: number }>;
query_rows: { id: number }[];
codes: { id: string }[];
```

`Model::all()` names its model the same way, so `Post::all()->toResourceCollection()` publishes `PostResource[]`. `map()` on a paginator maps the models on its page, so with `$page = Post::query()->paginate();`, `$page->map(fn (Post $post) => ['id' => $post->id])` publishes `{ id: number }[]`.

`concat($other)` keeps the type only when `$other` is exactly the same collection type. Concatenating `Comment[]` and `Tag[]` publishes `unknown`, since the result is a different collection, not a longer one. A `data_get()` key with a `*` segment also publishes `unknown`.

A chain can start at `$this->resource` too. `$this->resource->comments->map(fn ($comment) => $comment->id)` publishes `number[]`, as `$this->comments->map(...)` does. A `?->` on `$this->resource` adds `| null` once, since a resource can wrap `null`. `$this->resource?->comments->map(fn ($comment) => $comment->id)` publishes `number[] | null`.

`first()`, `last()` and `firstWhere()` on a collection of models return one of its models or `null`, so a read through them with `?->` is typed. That covers a relation's collection, a local holding one, and a variable an inline `@var Collection<int, Comment>` declares. `$this->comments->first()?->content` publishes `string | null`, and so does the same read after `last()`, `firstWhere('is_flagged', true)`, or `find()` with one literal key, such as `find(1)`. After a `first()` or `last()` call that passes a default, such as `first(null, 'none')`, the read publishes `unknown`, because Laravel returns that default when no model matches.

## Spreads and Inheritance

A resource can build its array from its parent class, its traits, and its own helper methods. Each one adds its properties to the interface.

### Parent `toArray()` Spread

Extend a parent resource with `...parent::toArray($request)`. The parent's properties come first, and the child can override any key:

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
            'status' => $this->status, // overrides the parent's EnumResource type
        ];
    }
}
```

`ApiPostResource` gets `id`, `title`, and `status` from `PostResource`, and its own `status` replaces the `EnumResource` type with the plain enum.

When the parent is `JsonResource` itself, the spread publishes the model's properties. See [JsonResource Base Delegation](#jsonresource-base-delegation).

Both spellings work: `...parent::toArray($request)` inside an array literal, and a bare `return parent::toArray($request);`. A child that declares no `toArray()` at all inherits the parent's. See [Inheriting a Parent `toArray()`](#inheriting-a-parent-toarray).

### Inheriting a Parent `toArray()`

A resource that extends another resource and declares no `toArray()` of its own publishes its parent's shape:

```php
/**
 * @mixin Order
 */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => EnumResource::make($this->status),
        ];
    }
}

// No toArray() and no @mixin: both come from OrderResource
class BodylessOrderResource extends OrderResource {}
```

The child publishes the parent's properties:

```typescript
export interface BodylessOrderResource {
  id: number;
  status: AsEnum<typeof OrderStatus>;
}
```

The nearest class up the parent chain that declares a `toArray()` provides the shape, so inheritance several levels deep works. The backing model comes from the parent chain too: a resource with no `@mixin` or `@extends` tag of its own uses the nearest ancestor's, as step 3 of [How the Backing Model Is Resolved](#how-the-backing-model-is-resolved) describes. That keeps the inherited properties typed from their columns.

The package reads the inherited body as PHP runs it for the child:

* `$this->` and `static::` reach the child, so a method, constant, or property the child overrides publishes the child's type. That includes a helper that `toArray()` spreads.
* `self::` reaches the class that declares the body, and `parent::` reaches that class's parent.
* A `private` member stays the one in the class that declares `toArray()`, because PHP never overrides one.

```php
class BaseCardResource extends JsonResource
{
    public const KIND = 'card';

    public function toArray(Request $request): array
    {
        return [
            'title' => $this->title(),
            'kind' => static::KIND,
            'label' => self::label(),
            'weight' => $this->weight(),
        ];
    }

    public function title(): int|string
    {
        return 0;
    }

    public static function label(): int|string
    {
        return 0;
    }

    private function weight(): int
    {
        return 1;
    }
}

class NoticeCardResource extends BaseCardResource
{
    public const KIND = 7;

    public function title(): string
    {
        return 'Notice';
    }

    public static function label(): string
    {
        return 'notice';
    }

    public function weight(): string
    {
        return 'heavy';
    }
}
```

`title` and `kind` come from `NoticeCardResource`. `label` keeps the parent's `string | number`, because `self::label()` calls `BaseCardResource::label()`, and `weight` keeps `number`, because `weight()` is private to `BaseCardResource`:

```typescript
export interface NoticeCardResource {
  title: string;
  kind: number;
  label: string | number;
  weight: number;
}
```

`self::make()` and `self::collection()` in the inherited body build the child, as they do in PHP. So a `FeaturedCategoryResource` that inherits `'children' => self::collection($this->whenLoaded('children'))` from `CategoryResource` publishes `children?: FeaturedCategoryResource[]`. A method that returns `static`, called through `self::` or `parent::`, returns the child too.

If no class in the chain declares a `toArray()`, the resource publishes the model's properties, as [JsonResource Base Delegation](#jsonresource-base-delegation) describes. With no model either, the interface is empty, apart from any types `#[TsExtends]` adds. A `ResourceCollection` subclass with no `toArray()` still finds its element type as [Resource Collections](#resource-collections) describes.

### A `toArray()` From a Trait

A `toArray()` that a trait supplies is the resource's own method, as it is in PHP. The package reads the trait's method body, wherever the trait is declared:

```php
trait ShapesPayload
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'shaped_by' => 'trait',
        ];
    }
}

/**
 * @mixin Label
 */
class LabelResource extends JsonResource
{
    use ShapesPayload;
}
```

The resource publishes the keys the trait's `toArray()` returns:

```typescript
export interface LabelResource {
  id: number;
  name: string;
  shaped_by: string;
}
```

A subclass of `LabelResource` with no `toArray()` of its own publishes the same keys. A `ResourceCollection` can take its `toArray()` from a trait the same way.

In the trait's `toArray()`, `self::` reaches the class that uses the trait, and `parent::` reaches that class's parent. `$this->` and `static::` reach the resource, as they do in an [inherited `toArray()`](#inheriting-a-parent-toarray). Here `TagCardResource` extends the `BaseCardResource` above:

```php
trait ShapesCard
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'label' => self::label(),
            'kind' => static::KIND,
        ];
    }
}

class TagCardResource extends BaseCardResource
{
    use ShapesCard;

    public const KIND = 'tag';

    public static function label(): string
    {
        return 'tag';
    }
}
```

`parent::toArray()` spreads `BaseCardResource`'s keys, and `label` and `kind` take `TagCardResource`'s types:

```typescript
export interface TagCardResource {
  title: string | number;
  kind: string;
  label: string;
  weight: number;
}
```

### JsonResource Base Delegation

A resource with no `toArray()`, or whose `toArray()` returns `parent::toArray($request)`, publishes the backing model's columns, its appended accessors, and its relations, each relation an optional key. These follow the keys Laravel's `Model::toArray()` writes, with the differences below. A subclass of Laravel's `JsonApiResource` is the exception: it publishes the resource object it sends, as [JSON:API Resources](#json-api-resources) describes. This resource has no `toArray()`:

```php
/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    // No toArray(): the properties come from the User model
}
```

The interface lists the model's columns and appended accessors, then its relations:

```typescript
export interface UserResource {
  id: number;
  name: string;
  email: string;
  password: string;
  // … the other columns
  profile?: Profile | null;
  posts?: Post[];
  owned_teams?: Team[];
}
```

Each kind of property follows its own rule:

* **Columns**: every column, typed from its database type and cast.
* **Accessors**: only the accessors the model lists in `$appends`. An accessor it doesn't append never reaches the response, so it isn't published.
* **Relations**: each relation is optional, because Laravel writes it only once it's loaded. Its key follows the model's `$snakeAttributes` setting, snake_case by default, so `ownedTeams()` publishes `owned_teams`. The [`models.relationship_case`](./casing-configuration.md#models-relationship-case) setting doesn't apply here. The package leaves out a relation to a model it doesn't publish, and a `morphTo` it can't type.
* **A key a relation shares with a column**: a loaded relation replaces the column's value, so the key is required, and its type is the union of both.

`$hidden` and `$visible` follow the `models.exclude_hidden` setting, as [`exclude_hidden` and Attribute Filters](#exclude-hidden-and-attribute-filters) describes. With it off, the default, `$hidden` columns such as `password` still publish, and `$visible` is ignored. With it on, the resource follows Laravel's rule. When `$visible` lists anything, only those keys stay, and then anything `$hidden` lists drops out. In both lists, Laravel matches a relation by its method name, such as `ownedTeams`, not by its `owned_teams` key.

The package reads your model's class, not a request. A change you make for one request, such as `makeHidden()`, `makeVisible()`, `setAppends()`, or a `select()` that loads fewer columns, doesn't reach the interface.

A delegated resource doesn't always match the model's own interface. A key that a relation shares with a column has both types here, and a relation you mark `#[TsExclude]` still publishes here, though the model's interface leaves it out.

You can also spread the base properties and add your own keys:

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

A variable that starts from `parent::toArray($request)` works the same way. See [Building the Array in a Variable](#building-the-array-in-a-variable).

[How the Backing Model Is Resolved](#how-the-backing-model-is-resolved) describes how the package finds the model. When no model resolves, the resource publishes an empty interface.

### Trait Method Spread

Spread a trait method's return into `toArray()` with `...$this->method()`. Its body publishes the same types it would in `toArray()`, and its `@return array{...}` docblock types the keys the body can't:

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

The trait's keys come first:

```typescript
export interface PostResource {
  morphValue: string;
  id: number;
  title: string;
}
```

Multi-line `@return` shapes work too:

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

You can also put `#[TsCasts]` on the trait method, with the same syntax as on a resource class. It overrides types, marks keys optional, adds imports, and appends keys the method doesn't return:

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

A key the body can't type, and that neither the `@return` docblock nor `#[TsCasts]` covers, publishes `unknown`.

::: tip
Trait spreads carry through inheritance. When a parent resource spreads a trait method and a child spreads `...parent::toArray($request)`, the child gets the keys the trait contributed.
:::

### Bare Method-Call Return

`toArray()` can return a method call directly, instead of spreading it into an array:

```php
public function toArray(Request $request): array
{
    return $this->data(); // the same as return [...$this->data()];
}
```

A chain of several calls works too, as long as it ends at an array literal, or at an `only()` or `except()` filter as described in [Attribute Filters](#attribute-filters-only-except):

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

The resource publishes the innermost array:

```typescript
export interface TeamResource {
  id: number;
  slug: string;
}
```

The chain can pass through trait and parent methods, as a `...$this->method()` spread can. See [Trait Method Spread](#trait-method-spread).

### Building the Array in a Variable

`toArray()` can build its array in a variable and return it. The package follows each write to the variable, and a key written on only some paths publishes optional:

```php
public function toArray(Request $request): array
{
    $data = [
        'id' => $this->id,
        'name' => $this->name,
    ];

    if ($request->boolean('with_slug')) {
        $data['slug'] = $this->slug;
    }

    $data['posts_count'] = $this->whenCounted('posts');

    return $data;
}
```

The variable's keys become the interface:

```typescript
export interface TagResource {
  id: number;
  name: string;
  slug?: string;
  posts_count?: number;
}
```

The variable can start from an array literal, as above, or from any of these:

* `parent::toArray($request)`, which on a `JsonResource` parent holds the model's properties, as [JsonResource Base Delegation](#jsonresource-base-delegation) describes
* `parent::with($request)`, which holds the keys of the resource's `$with` property
* `$this->only([...])` with a literal list of keys
* `array_merge()` of array literals and `parent::toArray($request)` calls
* A helper method on the resource that returns an array
* A local you assign one of these once, as in `$data = $defaults;`

A spread of `...$this->with($request)` or `...parent::with($request)` in `toArray()` adds the `$with` keys too.

These rules decide each key:

* **Branches**: each branch of an `if` chain holds its own value for a key. A key that every branch of a chain ending in `else` writes is required, with each branch's type. A key that only some branches write publishes optional, and a key set before the chain keeps that value as one more type. A branch that ends in `throw`, or in a `return` of anything but the variable, stays out.
* **Loops**: a loop may run no times, so a key it first writes publishes optional, and a key it re-sets keeps the value it held before the loop as one more type.
* **`try`, `catch`, and `switch`**: their bodies are read in order. A key first written in one publishes optional, and a key re-set in one takes its last write's type.
* **A key written more than once in a row**: the key takes the type of its last write. `+=` adds only the keys the array doesn't have yet. Assigning a whole new array drops the keys written before it. Inside one branch, it replaces them for that branch only, so a key that one side lacks publishes optional.
* **An `unset()`**: `unset($data['slug'])` removes the key, and so does `unset($data[$key])` when `$key` is a local you assign a string literal once. Inside a block, it makes the key optional instead. In `unset($data['name'], $data[$hidden])`, the package removes `name` but can't follow `$data[$hidden]`. An index signature from an [interpolated key](#interpolated-keys) stays after an `unset()` of a literal key it matches, since its value already admits `undefined`.
* **Other `return` statements**: the variable counts as one branch beside the method's other returns, so a `return []` guard, or a returned array literal that leaves a key out, makes that key optional.

Here each key holds the value of every branch that can write it:

```php
public function toArray(Request $request): array
{
    $data = ['id' => $this->id, 'label' => $this->sort_order];

    if ($this->is_active) {
        $data['mode'] = 1;
    } else {
        $data['mode'] = 'off';
    }

    if ($this->sort_order === 1) {
        $data['tier'] = 'first';
        $data['first_only'] = true;
    } elseif ($this->sort_order === 2) {
        $data['tier'] = 2;
    } else {
        $data['tier'] = false;
    }

    if ($this->description !== null) {
        $data['label'] = $this->name;
        $data['described'] = true;
    }

    return $data;
}
```

On a `Category` resource, the variable publishes:

```typescript
export interface CategorySummaryResource {
  id: number;
  label: number | string;
  mode: number | string;
  tier: string | number | boolean;
  first_only?: boolean;
  described?: boolean;
}
```

A value one branch writes that the package can't type is left out of the key's type, as [Values Left Out of a Union](#values-left-out-of-a-union) describes.

The package doesn't follow `$data[] = ...`, a key computed at runtime, such as `$data[$key]` where `$key` isn't a local holding one string literal, or a nested key such as `$data['meta']['label']`, whether written or passed to `unset()`. It also reads the method in one pass. A key written after an early `return $data;` publishes required when that write always runs, though the early return sends the array without it. A `continue` or `break` isn't followed either, so in a loop body, a write after an `if` that ends in `continue` replaces the `if`'s write, though Laravel can send the `if`'s value. In each case, return an array literal on each path, or list the keys with [`#[TsCasts]`](#overriding-property-types-with-tscasts), which can also mark a key optional.

`+` publishes PHP's array union, where the left side's keys win and the right side adds the keys it lacks. That holds in a key's value, so `['code' => 'in'] + ['code' => 0, 'lane' => 2]` publishes `{ code: string; lane: number }`, and in a whole return, such as `return parent::toArray($request) + ['note' => 'none'];`. Either side can be a local holding an array: with `$defaults = ['note' => 'none', 'id' => 'x']`, `return ['id' => $this->id] + $defaults;` publishes `id: number` and `note: string`.

A helper that you pass the array to, and that returns it, keeps the array's keys and adds the keys it writes. A vague `@return array<string, mixed>` on the helper doesn't hide them:

```php
public function toArray(Request $request): array
{
    $data = [
        'id' => $this->id,
        'title' => $this->title,
        'url' => url("/posts/{$this->id}"),
        'disabled' => false,
    ];

    return $this->guard($data);
}

/**
 * @param  array<string, mixed>  $data
 * @return array<string, mixed>
 */
private function guard(array $data): array
{
    if ($this->trashed()) {
        $data['url'] = null;
        $data['disabled'] = true;
    }

    return $data;
}
```

The resource publishes the array's keys, with the helper's writes joined in:

```typescript
export interface PostLinkResource {
  id: number;
  title: string;
  url: string | null;
  disabled: boolean;
}
```

The same holds when you use the helper's result as a value, so `'link' => $this->guard(['url' => url('/posts'), 'disabled' => false])` publishes `link: { url: string | null; disabled: boolean }`.

When a helper's array starts from a value the package can't read, such as `$request->all()`, a key that holds the helper's result publishes the keys the helper writes, plus an index signature for the rest. When all the package can read of a helper's array is its `@return array<string, mixed>`, such a key publishes `Record<string, unknown>`:

```php
public function toArray(Request $request): array
{
    return [
        'filters' => $this->filters($request),
        'options' => $this->options(),
    ];
}

/** @return array<string, mixed> */
private function filters(Request $request): array
{
    $filters = $request->all();
    $filters['page'] = 1;

    return $filters;
}

/** @return array<string, mixed> */
private function options(): array
{
    return json_decode($this->content, true);
}
```

`filters` keeps the key the helper writes, and `options` publishes a record:

```typescript
export interface PostFiltersResource {
  filters: { page: number; [key: string]: unknown };
  options: Record<string, unknown>;
}
```

### Return Branches and `@return` Shapes

Every `return` in a spread method counts, not only the first. A branch that returns `[]` leaves its keys out, so the keys the other branches return become optional. The method's own `@return` types what its body can't:

```php
trait GathersPermissions
{
    /**
     * @return array{permissions?: array<string, bool>, links?: array{self: string, related: array<string, array{name: string}>}}
     */
    public function gatherPermissions(): array
    {
        if (! $this->resource instanceof Model) {
            return [];
        }

        return ['permissions' => $this->opaque(), 'links' => $this->opaque()];
    }

    /** @return array<string, string> */
    public function gatherLabels(): array
    {
        $data = [];
        $data['main_label'] = $this->opaque();

        if ($this->resource->exists) {
            $data['extra_label'] = $this->opaque();
        }

        return $data;
    }

    /** Untyped, so only the docblocks above can type what it returns. */
    protected function opaque()
    {
        return $this->resource->getAttribute('title');
    }
}
```

A resource that spreads both methods publishes:

```typescript
export interface PostPermissionsResource {
  permissions?: Record<string, boolean>;
  links?: { self: string; related: Record<string, { name: string }> };
  main_label: string;
  extra_label?: string;
  // …
}
```

Both forms of `@return` count:

* **An `array{...}` shape**: each key gets its own type, and a key written `key?:` also becomes optional. A string or number literal type, such as `'draft'|'live'` or `1|2|3`, publishes as written.
* **`array<string, V>`**: `V` types every key the body left `unknown`.

`toArray()`'s own `@return array{...}` fills keys the same way.

The body always wins. The docblock fills only a key the body left `unknown`, or an [interpolated key's](#interpolated-keys) value that the body left `unknown | undefined`, so a stale `@return` can't overwrite a type the package already knows.

A shape value that names a PHP class or enum is skipped, because a docblock can't carry its import. Type that key with `#[TsCasts]` and an `import` instead. A name that isn't a PHP class, such as a type you declare only in TypeScript, publishes as written in a spread method's `@return`. In `toArray()`'s own `@return`, the key stays `unknown`, so type it with `#[TsCasts]`.

In a spread method, the branches count only while every `return` is an array literal, `[]`, or a variable the method builds. Otherwise, only the spread method's first `return` counts.

### Interpolated Keys

A key built from literal text around a variable can't become a fixed property name, because it changes on each pass of the loop. Both the interpolated and the concatenated spelling publish a template-literal index signature. These methods belong to the same resource as the ones above:

```php
/** @return array<string, string> */
public function gatherChannelLabels(): array
{
    $data = ['primary_label' => 'Primary'];

    foreach (['email', 'sms'] as $name) {
        $data["{$name}_label"] = 'Channel';
    }

    return $data;
}

/** @return array<string, string> */
public function gatherRegionLabels(): array
{
    $data = [];

    foreach (['east', 'west'] as $name) {
        $data[$name.'_region'] = 'Region';
    }

    return $data;
}
```

Each loop key becomes an index signature:

```typescript
export interface PostPermissionsResource {
  primary_label: string;
  [key: `${string}_label`]: string | undefined;
  [key: `${string}_region`]: string | undefined;
  // …
}
```

The value type carries `| undefined` instead of the signature carrying a `?`, because `[key: T]?:` isn't valid TypeScript, and a key that matches the pattern may be absent.

When the body can't type the value, the method's `@return array<string, V>` does, as it does for a named key. A third method on the same resource, `gatherOpaqueTags()`, declares `@return array<string, string>` and assigns `$data["{$name}_tag"] = $this->opaque()`:

```typescript
[key: `${string}_tag`]: string | undefined;
```

The key doesn't need a loop. A key written straight into the returned array, into an array a merge adds, or into a nested array publishes a signature too. In a nested array, the signature becomes part of that property's object type:

```php
return [
    'tag_'.$this->id => true,
    'box' => ["{$this->id}_inner" => 5, 'x' => 1],
];
```

Both keys become signatures:

```typescript
export interface TagBoxResource {
  [key: `tag_${string}`]: boolean | undefined;
  box: { [key: `${string}_inner`]: number | undefined; x: number };
}
```

A backslash in the literal text is doubled, because TypeScript reads a single one as an escape. `$data["{$name}\\unit"]`, whose keys end in `\unit`, publishes ``[key: `${string}\\unit`]``.

A literal key whose text reads as an index signature, such as `'[key: string]'`, is left out, and `ts:publish` warns. Printed as written, it would type every other key, so rename it.

To retype a signature with `#[TsCasts]`, use its published name as the key. Write it in single quotes, because PHP reads `${string}` inside double quotes as a variable. You can paste the name straight from the published file. PHP reads each `\\` in single quotes as one backslash, but the entry still finds its signature.

A pasted key that could name two signatures retypes neither, and `ts:publish` warns. Write each one exactly instead, such as ``'[key: `${string}\\\\unit`]'`` for ``[key: `${string}\\unit`]``. On a resource, the entry still adds its key as a new property, like any entry for a key `toArray()` doesn't return.

TypeScript checks an index signature against every named key its pattern matches, and against every signature whose pattern contains its own. So each named key the pattern matches, `#[TsCasts]` keys included, joins the signature's value type, and so does another signature with the same pattern. Beside `price_tag: number`, the `_tag` signature publishes `string | number | undefined`.

A signature keeps only the value its body gives it, which is `unknown | undefined` when only the docblock typed it, in these cases:

* **A key that can't join**: a key the pattern matches, or one of the signature's own entries, can't join the union when any of these holds:
  * its type has a top-level `unknown`, or is a template literal type
  * its type names a class, or any type other than a primitive, `Record`, or `Date`
  * its type holds a string literal with a backslash
  * it brings a class import, unless the import comes from `#[TsCasts]`
* **An overlapping pattern**: another signature's pattern may overlap its own. A plain `[key: string]` or `[key: number]` signature always counts as overlapping.
* **An extends clause**: the interface extends a type, through `#[TsExtends]` or a `ts_extends` config entry, whose keys the package can't see.

When a key the pattern matches is all that stops the union, `ts:publish` warns and names the key and the signature.

A signature needs both a literal part and a variable part. A fully literal key publishes as a named property, and a fully dynamic key, such as `$data[$name]`, isn't published. A key whose literal text contains a backtick isn't published either.

A value the body typed itself stands, even beside a key it can't take in, an overlapping pattern, or an extends clause. So ``[key: `${string}_tag`]: string | undefined`` beside `main_tag: PostResource` still fails `tsc` with TS2411, and a pattern contained in another one can fail with TS2413. Type the key, or rename it out of the pattern.

### Model `toArray()` Spread

Spreading a model's own `toArray()` into an array literal with other keys intersects the model's interface with those keys, instead of publishing `Record<string, unknown>`:

```php
'members' => $this->whenLoaded('members', fn ($members) => $members->map(
    fn (User $member) => [...$member->toArray(), 'flag' => true]
)),
```

The spread and the extra key become an intersection:

```typescript
members?: (Omit<User, "flag"> & { flag: boolean })[];
```

The `Omit<>` matters. In PHP the later key wins, so `'flag'` replaces whatever the spread contributed. TypeScript's `&` would instead intersect both, and turn a conflicting key into `never`. When one literal holds several spreads, each spread's `Omit<>` removes every key that a later spread or an explicit key overwrites, in source order.

The spread uses the model the variable holds, on any collection a `map()` runs over. `collect($this->comments)->map(fn (Comment $comment) => [...$comment->toArray(), 'flag' => true])->all()` publishes `(Omit<Comment, "flag"> & { flag: boolean })[]`. A local inside the callback spreads its own model, so `$author = $comment->user;` followed by `[...$author->toArray(), 'x' => 1]` publishes `Omit<User, "x"> & { x: number }` for each comment.

At the top level of `toArray()`, a spread with no key flattens into the resource's own properties instead. `...$this->user->toArray()` adds the user's properties to the interface, and `...PostResource::make($this->post)->resolve()` adds the post resource's. A collection's `...$this->tags->toArray()` adds a `[key: number]` index signature.

::: info
The intersection references the `{Model}` interface instead of copying its shape. That comes close to what `toArray()` returns at runtime, with two differences:

* **Relations are missing**: a relation loaded before the spread is in the JSON but not in the type, since the package can't know what's loaded. Under the [`model-split` template](./models.md#model-templates), relations live in `{Model}Relations`, which the spread doesn't reference.
* **`$hidden` columns are extra**: Laravel strips them at runtime, but they stay in `{Model}` unless [`models.exclude_hidden`](./models.md#what-gets-published-hidden-attributes-write-only-accessors) is enabled.

Appended accessors aren't a difference: `toArray()` includes them, and they're part of `{Model}`. `{Model}Mutators` holds only the accessors a model doesn't append.

Spreading a resource, as in `...UserResource::make($m)->resolve($request)`, works the same way without either difference, because the resource interface is the response shape.
:::

## Attribute Filters (`only` / `except`)

`$this->only([...])` and `$this->except([...])` filter the backing model's attributes. Both work as the return value and as a spread:

```php
// As the return value
public function toArray(Request $request): array
{
    return $this->only(['id', 'name', 'email']);
}

// As a spread in the returned array
public function toArray(Request $request): array
{
    return [
        ...$this->except(['password', 'remember_token']),
        'role' => EnumResource::make($this->role),
    ];
}
```

The two methods build different property sets:

* **`only([...])`**: exactly the keys you name, each typed from the model, including accessors and relations. A key the model types outside its schema, such as a `withCount()` count (`comments_count: number`) or an `@property` tag, is kept. A key that the model doesn't define and nothing can type is dropped.
* **`except([...])`**: the model's columns, accessors, and relations, minus the keys you name.

A model that declares its own typed `only()` or `except()` publishes that method's return instead, such as the model itself for `: static`.

`$this->resource->only([...])` and `$this->resource->except([...])` are the same calls, so they publish the same types, spread or not. The same holds for every relation filter below: `$this->resource->author->only([...])` publishes what `$this->author->only([...])` does.

::: tip
`only()` and `except()` are the only attribute filters the package reads. If you need another method, [open an issue](https://github.com/abetwothree/laravel-ts-publish/issues) or send a pull request.
:::

### Relation Filters

`only()` and `except()` work on a related model too, as in `$this->author->only([...])` or `$this->post?->except([...])`. A to-many relation and a collection member filter differently, as [To-Many Relations and Collection Members](#to-many-relations-and-collection-members) describes.

When the relation holds a single model and every key you name is one of its database columns, the property references the related model's interface with `Pick<>`. `only()` picks the keys you name, and `except()` picks every other column:

```php
'author' => $this->author->only(['id', 'name']),
'post' => $this->post?->except(['created_at', 'updated_at']),
```

Both properties reference the model's interface:

```typescript
author: Pick<User, "id" | "name">;
post: Pick<Post, "id" | "title" | "content" | "user_id"> | null;
```

This keeps the model's own `#[TsCasts]` and `@property` types. Both methods publish `Pick<>`, never `Omit<>`, so the type names exactly the columns it holds, whatever mutators, relations, or counts the model's interface also carries.

::: tip
`except()` picks your model's columns minus the named keys. When the model gains a column, an existing `except([...])` includes it without any change to your resource.
:::

When a key isn't a column, the package writes the shape inline, and the two methods differ the way they do in Eloquent:

* **`only([...])`**: expands exactly the keys you name. Eloquent's `only()` calls `getAttribute()` for each key, which reads accessors and relations too. So `$this->author->only(['name', 'initials', 'posts'])` publishes `{ name: string; initials: string; posts: Post[] }`.
* **`except([...])`**: expands the related model's database columns minus the named keys, never an accessor or a relation. Eloquent's `except()` reads only the stored attributes, and a model keeps its relations apart from those.

So for `'author' => $this->author?->except(['id', 'name'])`, where `User` has the accessors `initials` and `is_premium` and the relations `profile` and `posts`, the type holds columns only:

```typescript
author: { email: string; phone: string | null } | null;
```

Naming a relation or an accessor in `except()` changes nothing, since that key was never in the set. To publish one, switch to `only([...])`, or give the key its own entry in `toArray()`.

An accessor typed as a union of models, such as `@return Attribute<Contact|User|null, never>`, is filtered one model at a time. Each model gets its own `Pick<>` when every key is one of its columns, and an inline shape otherwise. When `Contact` has no `phone` column, `$this->last_active_by?->only(['id', 'phone'])` publishes `{ id: number } | Pick<User, "id" | "phone"> | null`.

#### To-Many Relations and Collection Members

On a to-many relation, `only()` and `except()` select models, not attributes. Eloquent's collection `only()` and `except()` keep the models whose primary key you list and return them whole, so the property publishes the relation's own type, whatever the key list holds:

```php
'replies' => $this->comments->only([1, 2]),
'kept' => $this->comments?->except($request->input('ids')),
```

Both keep the relation's type:

```typescript
replies: Comment[];
kept: Comment[] | null;
```

A `?->` on `$this->resource` adds `| null` once, because a resource can wrap `null`. `$this->resource?->comments->only([1, 2])` publishes `Comment[] | null`. A variable that holds the relation's collection filters the same way, so `'picked' => $this->whenLoaded('comments', fn ($comments) => $comments->only([1, 2]))` publishes `picked?: Comment[]`.

An accessor that returns an Eloquent collection of models filters the same way. It publishes a list of those models, such as `Comment[]`, whatever key type the accessor declares.

A member holding a support `Collection` selects entries by key: `only()` keeps the listed keys, and `except()` drops them. Its filter publishes `Record<string, unknown>`, whatever the collection holds. This covers these members:

* A column cast with `'collection'`, `'encrypted:collection'`, `AsCollection`, or `AsEncryptedCollection`
* An accessor, cast getter, or method that returns a `Collection`

These members publish `unknown` instead:

* An `AsEnumCollection` column
* A collection-cast column read through anything other than `$this` or `$this->resource`, such as a relation's column in `$this->author->options->only([...])`, or a local variable that holds the model
* A collection class that overrides `only()` or `except()`, such as:
  * a class you pass to `AsCollection::using()`
  * a returned subclass that overrides them
  * a cast that builds an Eloquent collection
  * a method that returns an Eloquent collection

A single relation filtered by a runtime key list, such as `$this->author->only($request->input('fields'))`, names nothing to pick, so it publishes `Record<string, unknown>`.

### Attribute Filters on Any Model

`only([...])` and `except([...])` work on any value that holds a model, not only a relation. The same types come from a bare `$this->only([...])`, which the resource forwards to its model, from a `whenLoaded()` closure parameter, and from a local variable that holds a model:

```php
return [
    ...$this->only(['id', 'comments_count']),
    'summary' => $this->when(true, fn () => $this->only(['id', 'title'])),
    'category' => $this->whenLoaded('category', fn ($category) => $category->only(['id', 'name'])),
    'dynamic' => $this->only($request->input('fields')),
];
```

Each filter publishes a `Pick<>` or a record:

```typescript
export interface PostResource {
  id: number;
  comments_count: number;
  summary?: Pick<Post, "id" | "title">;
  category?: Pick<Category, "id" | "name">;
  dynamic: Record<string, unknown>;
  // …
}
```

The `Pick<>` reference needs a literal key list. `$this->only($request->input('fields'))` has none, so it publishes `Record<string, unknown>` instead of guessing which keys arrive.

### `exclude_hidden` and Attribute Filters

The `ts-publish.models.exclude_hidden` setting, described in [Models](./models.md#what-gets-published-hidden-attributes-write-only-accessors), applies to resources as well as to model interfaces. A `$hidden` column you name is kept, and a derived property set leaves it out, as Laravel's `toArray()` does:

```php
$this->only(['password'])   // kept: you named it
$this->except(['id'])       // password dropped: the property set is derived
```

With `exclude_hidden` enabled, each pattern treats a `$hidden` column this way:

| Pattern                                                                          | Property set                                     | A `$hidden` column                  |
| -------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------- |
| `'password' => $this->password`                                                  | The property you wrote                           | Kept, because you named it          |
| `$this->only(['id', 'password'])`                                                | Exactly the keys you named                       | Kept, because you named it          |
| `$this->relation->only(['id', 'password'])`                                      | Exactly the keys you named                       | Kept, because you named it          |
| `$this->whenHas('password')`                                                     | The attribute you named                          | Kept, because you named it          |
| `$this->except(['id'])`                                                          | The model's properties minus the named keys      | Dropped, because the set is derived |
| `$this->relation->except(['id'])`                                                | The related model's columns minus the named keys | Dropped, because the set is derived |
| `parent::toArray($request)`, `[...parent::toArray($request)]`, or no `toArray()` | The model's properties                           | Dropped, because the set is derived |

Reading a column directly, as in `'password' => $this->password`, is the most common way to expose one, and it behaves like a named `only()` key: a `$hidden` column you read yourself is never dropped.

To publish a `$hidden` column through a derived set, name it. Switch the property to `only([...])`, read it as `$this->column`, or remove it from the model's `$hidden` array if it no longer needs hiding.

## Resource Collections

`ResourceCollection` subclasses publish an interface too. `$this->collection` becomes a list of the singular resource:

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

The collection's interface imports the singular resource:

```typescript
import type { UserResource } from ".";

export interface UserCollection {
  data: UserResource[];
  has_admin: boolean;
}
```

The singular resource comes from the first of these that names a class, in the order Laravel's `collects()` reads them:

1. The `#[Collects(UserResource::class)]` attribute on the collection. This attribute needs Laravel 13.
2. The `$collects` property.
3. The naming convention: `UserCollection` collects `User` when a class of that name exists in the same namespace, or else `UserResource`. The package uses the convention's pick only when it publishes that class.

When the class it names isn't an API resource, Laravel throws a `LogicException` instead of trying the next step. The collection then publishes an empty interface, and `ts:publish` warns.

The `$collects` property works on every supported Laravel version:

```php
class OrderCollection extends ResourceCollection
{
    public $collects = OrderResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
        ];
    }
}
```

On Laravel 12, use the `$collects` property or the naming convention. The `#[Collects]` attribute doesn't exist there, so the package can't find the resource of a collection that relies on it.

A collection that names its resource only through an overridden `collects()` method, or by assigning `$this->collects` in its constructor, publishes an empty interface. Declare `public $collects` instead.

When no singular resource matches, such as for a `MiscCollection` with no `MiscResource`, `$this->collection` publishes `unknown[]`.

A collection with no `toArray()` publishes Laravel's default shape, `{ data: R[] }`. So does a `toArray()` that returns the collected list: the `return parent::toArray($request);` stub that `php artisan make:resource` writes, `$this->collection`, or `$this->resource`. Over a paginator, `return $this->resource;` sends more than that, as [Paginated Collections](#paginated-collections) describes. With `public static $wrap = null;`, the collection is the list itself, so the package publishes a type alias instead of an interface:

```php
#[Collects(PostResource::class)] // Laravel 13+
class PostFlatCollection extends ResourceCollection
{
    public static $wrap = null;
}
```

The unwrapped collection becomes an alias:

```typescript
export type PostFlatCollection = PostResource[];
```

A collection with no `toArray()` that extends another collection applies the list above to its own class, and inherits the parent's `$collects` property and `$wrap`, but no PHP attribute, such as `#[Collects]` or `#[PreserveKeys]`. When the parent names its resource with `#[Collects]` or by its class name, a child that doesn't name one itself makes Laravel send the plain models. The package then publishes the model behind the parent's resource, such as `handovers: Handover[]` for a child of a `HandoverCollection` with `#[Collects(HandoverResource::class)]`, or the parent's resource when it doesn't publish that model. Set `$collects` on the child to name its resource, as `HandoverDigestCollection` does:

```php
class HandoverCollection extends ResourceCollection
{
    public static $wrap = 'handovers';

    public $collects = HandoverResource::class;
}

class HandoverDigestCollection extends HandoverCollection
{
    public $collects = HandoverSummaryResource::class;
}
```

`HandoverDigestCollection` collects its own resource, under the `handovers` key it inherits:

```typescript
export interface HandoverDigestCollection {
  handovers: HandoverSummaryResource[];
}
```

A child that inherits its parent's own `toArray()` runs it as itself, so `$this->collection` in that method lists the child's resource.

### The Wrap Key Your App Sets

The package reads the wrap key your app has set by the time `ts:publish` runs, so a call in a service provider's `boot()` method reaches the published types:

```php
use Illuminate\Http\Resources\Json\JsonResource;

public function boot(): void
{
    JsonResource::withoutWrapping();
}
```

After `JsonResource::withoutWrapping()`, every collection that publishes Laravel's default shape is the list itself, so it publishes a type alias instead of an interface with a `data` key. A `PostCollection` with no `toArray()` publishes `export type PostCollection = PostResource[];`. Code that reads its `data` key then fails to compile, since Laravel no longer sends that key. After `JsonResource::wrap('items')`, the same collections publish `{ items: PostResource[] }`.

A class that redeclares `$wrap` keeps its own key through `withoutWrapping()`, and so do its subclasses. `HandoverDigestCollection` above keeps `handovers`. Calling `HandoverCollection::wrap('crew')` changes the key for that class and its subclasses only.

Call these methods unconditionally in a provider's `boot()`. A wrap set anywhere else, such as in middleware, in a controller, or behind a `runningInConsole()` check, isn't in place when `ts:publish` runs, so the published types miss it. A change to the wrap key rebuilds every cached file on the next run. Inertia props follow the same key, as [API Resources in Props](./inertia.md#api-resources-in-props) describes.

### Key-Preserving Collections

A `ResourceCollection` normally serializes as a JSON array, so the generated type is `R[]`. Laravel can keep the collection's original keys instead, which makes the payload a JSON object. The package reads both ways to opt in:

```php
use Illuminate\Http\Resources\Attributes\PreserveKeys;
use Illuminate\Http\Resources\Json\ResourceCollection;

#[PreserveKeys] // Laravel 13+
class TeamCollection extends ResourceCollection
{
    public $collects = TeamResource::class;
}
```

The property form works on every supported Laravel version:

```php
use Illuminate\Http\Resources\Json\ResourceCollection;

class TeamCollection extends ResourceCollection
{
    public $preserveKeys = true;

    public $collects = TeamResource::class;
}
```

Either form generates:

```typescript
export interface TeamCollection {
  data: Record<string, TeamResource>;
}
```

With `public static $wrap = null;` as well, the collection publishes the alias `export type TeamCollection = Record<string, TeamResource>;`.

The type follows `#[PreserveKeys]` or `$preserveKeys`, not the keys of the items you pass, which the package can't see. A collection without either that you give items keyed by `keyBy()` sends an object, while its type says `TeamResource[]`. One with either that you give a plain list sends an array, while its type says `Record<string, TeamResource>`. In your own `toArray()`, `$this->collection` and `$this->resource` keep the keys of the items you pass, whatever the class declares, so items that `filter()` left with gaps are sent as an object. Give `#[PreserveKeys]` to a collection that receives keyed items, and call `values()` on filtered items before you pass them in.

### Reading `$this->resource`

Inside a collection, `$this->resource` holds the collected items, which are a collection of the singular resource or the paginator you passed in. A key that returns it, or its `toArray()`, publishes every shape Laravel can send, with the paginator types from `@tolki/types`:

```php
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'page' => $this->resource,
            'first_user' => $this->resource->first(),
            'user_count' => $this->resource->count(),
        ];
    }
}
```

The collection publishes:

```typescript
import type {
  CursorPaginator,
  LengthAwarePaginator,
  SimplePaginator,
} from "@tolki/types";
import type { UserResource } from ".";

export interface UserCollection {
  data: UserResource[];
  page:
    | UserResource[]
    | LengthAwarePaginator<UserResource>
    | SimplePaginator<UserResource>
    | CursorPaginator<UserResource>;
  first_user: UserResource | null;
  user_count: number;
}
```

These calls on `$this->resource` publish a type of their own:

* `first()` and `last()` publish `UserResource | null`.
* `count()` publishes `number`, and `isEmpty()` publishes `boolean`.
* `only()` and `except()` publish `UserResource[] | Record<string, UserResource>`, since the items they keep come back under their own keys.
* A paginator method, such as `total()`, `perPage()` or `nextPageUrl()`, publishes its return type, such as `number` or `string | null`.

Laravel throws when the items are a plain collection, or a paginator without that method, so the type covers only the paginators that have it. `total()` exists only on the paginator `paginate()` returns, so call it only in a collection you always build from `paginate()`.

If the collection always receives one kind of paginator, redeclare `$resource` with it. With `/** @var LengthAwarePaginator<int, UserResource> */ public $resource;`, `page` publishes `LengthAwarePaginator<UserResource>`.

An `instanceof` test on `$this->resource` narrows the items to the paginator it names, in a ternary's arm, inside an `if` block, or after a guard. A read outside what the test proves keeps every shape:

```php
public function toArray(Request $request): array
{
    if ($this->resource instanceof LengthAwarePaginator) {
        return ['pager' => $this->resource];
    }

    return ['pager' => null];
}
```

Here `pager` publishes `LengthAwarePaginator<UserResource> | null`.

A call the collection forwards to `$this->resource`, such as `$this->first()` or `$this->total()`, publishes the same type. In a [key-preserving collection](#key-preserving-collections), the list type is `Record<string, UserResource>`. When no singular resource matches, each type holds `unknown`, such as `unknown[]` and `LengthAwarePaginator<unknown>`.

The package doesn't follow a collection pipeline on `$this->resource`, such as `map()`, `pluck()` or `values()`, or a read on the item `first()` returns, such as `$this->resource->first()?->name`. Each publishes `unknown`. Type such a key with [`#[TsCasts]`](#overriding-property-types-with-tscasts).

### Paginated Collections

A collection's interface covers what its `toArray()` returns. The `links` and `meta` keys Laravel adds to a paginated response, and any data you add with `with()` or `additional()`, aren't part of it. An Inertia page prop that passes a paginator to a resource collection gets its pagination members from the page prop's type instead, with the `meta` block of each paginator kind. See [Paginating Inline in the Render Call](./inertia.md#paginating-inline-in-the-render-call) on the Inertia page.

Over a paginator, Laravel merges a `meta` or `links` key that your `toArray()` returns beside `data` into its own pagination block with `array_merge_recursive()`, and it merges the `with()` and `additional()` data the same way. A key your `toArray()` adds, such as `links.self`, is in the page prop's type. A key that two of these name, such as `meta.total`, is sent as a list of both values, such as `[3, 3]`, while the type still says `number`. Give your key another name, or remove from `paginationInformation()` only the key your `toArray()` also sends. The package doesn't read `paginationInformation()`, so any other change there leaves the published pagination type wrong.

Over a paginator, `$this->resource` holds the paginator itself. A `toArray()` that returns it sends the paginator's own array, with `current_page`, `first_page_url`, and its other keys, beside `links` and `meta`, and the page prop's type covers only `data`, `links`, and `meta`. Return `$this->collection` in a collection you paginate.

## JSON:API Resources

Laravel's [`JsonApiResource`](https://laravel.com/docs/eloquent-resources#jsonapi-resources), added in Laravel 12.45, sends a model as a [JSON:API](https://jsonapi.org/format/) document. The package publishes a subclass as the resource object it sends under `data`, and `@tolki/types` provides the document types around it:

```php
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

/**
 * @mixin Post
 */
class PostResource extends JsonApiResource
{
    public $attributes = ['title', 'word_count', 'published_at'];

    public $relationships = [
        'author' => UserResource::class,
        'comments' => CommentResource::class,
    ];
}
```

Here `UserResource` and `CommentResource` are JSON:API resources too. The package generates:

```typescript
import type {
  JsonApiToManyRelationship,
  JsonApiToOneRelationship,
} from "@tolki/types";

export interface PostResource {
  id: string;
  type: "posts";
  attributes: {
    title: string;
    word_count: number | null;
    published_at: string | null;
  };
  relationships?: {
    author?: JsonApiToOneRelationship<"users">;
    comments?: JsonApiToManyRelationship<"comments">;
  };
}
```

Each member follows what Laravel sends:

* **`id`**: always `string`, because Laravel sends the model's key as a string, even an integer one.
* **`type`**: the type Laravel works out for the resource when `ts:publish` runs, such as `"posts"` for `PostResource`, or the string literal your `toType()` returns.
* **`attributes`**: taken from the first source the resource declares, in the order Laravel reads them:
  1. A `toAttributes()` method. A key that `when()` or another conditional method wraps is optional, and an attribute name listed without a key, such as `'title'`, reads that model attribute.
  2. The `$attributes` property, a list of model attribute names.
  3. A `toArray()` method. Its keys become the attributes, not the whole response.
  4. With none of these, every key of the model's own `toArray()`, as [JsonResource Base Delegation](#jsonresource-base-delegation) describes.
* **`relationships`**: one key per relationship that `$relationships` or `toRelationships()` declares, named after its relation method. The member and each key are optional, because Laravel sends a relationship only when the request asks for it with `?include=`, or when you call `includePreviouslyLoadedRelationships()` on the resource and the relation is already loaded. A to-one relationship publishes `JsonApiToOneRelationship<"users">`, and a to-many one `JsonApiToManyRelationship<"comments">`.
* **`links` and `meta`**: optional members, published from `toLinks()` and `toMeta()`, or from the `$jsonApiLinks` and `$jsonApiMeta` properties.

`attributes` is required while at least one attribute is always sent. A `#[TsCasts]` entry on the resource or on its model retypes a key inside `attributes`, and never `id` or `type`.

### Fetching a Document

The package doesn't type the response of a route, so type what `fetch()` returns with the document types from `@tolki/types`. The second type parameter lists the resource objects that `included` can hold:

```typescript
import type { JsonApiDocument } from "@tolki/types";
import type {
  CommentResource,
  PostResource,
  UserResource,
} from "@js/types/data/app/http/resources";

type Included = UserResource | CommentResource;

const res = await fetch(`/api/posts/${id}?include=author,comments`);
const doc: JsonApiDocument<PostResource, Included> = await res.json();

doc.data.attributes.title; // string
doc.included; // Included[] | undefined
```

`JsonApiCollection<PostResource>` types what `PostResource::collection()` sends, and `JsonApiPaginator`, `JsonApiSimplePaginator`, and `JsonApiCursorPaginator` type it over each paginator. [JSON:API Utilities Types](../typescript/typescript-utilities-list.md#json-api-utilities-types) lists every type.

As an Inertia prop, a JSON:API resource publishes its whole document for you. See [JSON:API Resources in Props](./inertia.md#json-api-resources-in-props).

### Sparse Fieldsets

Every attribute the resource always sends is required. A request with a sparse fieldset, such as `?fields[posts]=title`, sends only the attributes it names. Read such a response through `JsonApiSparse` from `@tolki/types`, which makes the `attributes` member optional, and every attribute in it:

```typescript
import type { JsonApiDocument, JsonApiSparse } from "@tolki/types";
import type { PostResource } from "@js/types/data/app/http/resources";

type SparsePost = JsonApiSparse<PostResource>;

const res = await fetch(`/api/posts/${id}?fields[posts]=title`);
const doc: JsonApiDocument<SparsePost> = await res.json();

doc.data.attributes?.title; // string | undefined
```

### Nesting a JSON:API Resource

Inside a plain API resource, Laravel sends a JSON:API resource without `included` or `jsonapi`:

```php
'author' => new UserResource($this->author),
'comments' => CommentResource::collection($this->comments),
'related' => new PostCollection($this->related),
```

Here `PostCollection` is a `ResourceCollection` that collects `PostResource`. The keys publish:

```typescript
author: { data: UserResource };
comments: CommentResource[];
related: { data: PostResource }[];
```

* A single resource, from `new`, `make()`, or `toResource()`, sends its resource object under `data`, and adds `| null` where its model can be `null`.
* `collection()` sends a list of resource objects.
* A named collection sends each item under its own `data` key.

### What Isn't Typed

* A `toType()` that returns anything other than one string literal publishes `type: string`. The type is worked out when `ts:publish` runs, so a morph map or `Pluralizer::useLanguage()` call your app makes only later doesn't reach it.
* Keys that `additional()` adds beside `data` aren't published.
* A relationship whose resource is a plain `JsonResource` publishes `type: string`. Laravel throws when a request includes it.

## Resource Attributes

Four attributes configure how a resource is published:

| Attribute       | Target                                              | Use it to                                                                                                           |
| --------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `#[TsResource]` | Resource class                                      | Set the interface name, the backing model, or a description                                                         |
| `#[TsCasts]`    | Resource class, `toArray()`, or a method it spreads | Override property types, or add properties                                                                          |
| `#[TsExtends]`  | Resource class                                      | Extend the interface with your own TypeScript types, as [Extending Interfaces](./extending-interfaces.md) describes |
| `#[TsExclude]`  | Resource class                                      | Leave the resource out of the output, as [Excluding Content](./excluding-content.md) describes                      |

### Configuring Resource Generation With `#[TsResource]`

Use `#[TsResource]` to set the generated interface's name, the backing model, or a description:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsResource;
use App\Models\User;

#[TsResource(name: 'UserData', model: User::class, description: 'User API response')]
class UserResource extends JsonResource
{
    // ...
}
```

The attribute takes three optional parameters:

| Parameter     | Type            | Default                | Description                         |
| ------------- | --------------- | ---------------------- | ----------------------------------- |
| `name`        | `?string`       | Class name             | The TypeScript interface name       |
| `model`       | `?class-string` | Resolved automatically | The backing Eloquent model          |
| `description` | `string`        | `''`                   | A JSDoc comment above the interface |

::: tip
`name` also sets the output file's name. For example, `#[TsResource(name: 'Address')]` generates `address.ts` instead of `address-resource.ts`.
:::

### Overriding Property Types With `#[TsCasts]`

::: tip Before You Add `#[TsCasts]`
The package already types these shapes without an override:

* A method call on an enum, a date, a model, or a service, and a property read on any of those or on a value object. See [Method Return Types](#method-return-types).
* A value behind a local variable, a closure-local variable, or an `instanceof` guard. See [Local Variables and Narrowing](#local-variables-and-narrowing).
* A collection chain, `data_get()`, and `only([...])` on any model. See [Collection Pipelines](#collection-pipelines) and [Attribute Filters on Any Model](#attribute-filters-on-any-model).
* A key that only some branches return, or one that a spread method's `@return` describes. See [Return Branches and `@return` Shapes](#return-branches-and-return-shapes).

`#[TsCasts]` is the right tool when the frontend owns the type and it needs its own import, or when a shape is dynamic. To type every value of a class that way, put [`#[TsType]`](./custom-types.md) on the class instead.
:::

Use `#[TsCasts]` to override a property's type, or to add a property that `toArray()` doesn't return:

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

Each entry takes one of these forms:

| Form                     | Example                                             | Effect                                             |
| ------------------------ | --------------------------------------------------- | -------------------------------------------------- |
| A string                 | `'Record<string, unknown>'`                         | Overrides the type                                 |
| An array with `import`   | `['type' => 'GeoPoint', 'import' => '@/types/geo']` | Uses a custom type and imports it                  |
| An array with `optional` | `['type' => 'string', 'optional' => true]`          | Overrides the type and marks the property optional |

An entry for a key that `toArray()` returns overrides that key's type. An entry for any other key adds a property to the interface. With the `coordinates` entry above, the resource generates:

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

An entry publishes its type exactly as you write it, and the file imports only the types its interface names. So an entry over a key that wraps an enum in [`EnumResource::make()`](#enum-properties-with-enumresource), such as `'status' => 'StatusType'`, publishes `status: StatusType` instead of `AsEnum<typeof Status>`. To keep the wrap, write it in the entry, as in `'status' => 'AsEnum<typeof Status>'`. The package then imports `AsEnum` and `Status` for that key.

Entries also work on two less common kinds of key:

* **An index signature**: use its published name as the key, such as ``'[key: `${string}_tag`]' => 'string'``. `'optional' => true` adds `| undefined` to its value instead of a `?`, because `[key: T]?:` isn't valid TypeScript. [Interpolated Keys](#interpolated-keys) covers how to write the key.
* **A numeric key**: `'42' => 'boolean'` publishes `"42": boolean`.

You can put `#[TsCasts]` on the resource class, on `toArray()` itself, or on a trait or helper method that `toArray()` spreads. On a method, it works the same way as on the class, including on a `toArray()` that returns `parent::toArray($request)`. See [Trait Method Spread](#trait-method-spread).

The backing model's own `#[TsCasts]` applies here too. An entry on the model retypes the resource property with the same name, including its `optional` flag. For example, an `Address` model entry `'latitude' => ['type' => 'number | null', 'optional' => true]` makes a resource's `'latitude' => $this->whenNotNull($this->latitude)` publish `latitude?: number | null`. A model entry never adds a property.

When more than one place names a key, the place lower in this list wins:

1. The backing model's entries: on its class, then on `$casts`, then on `casts()`.
2. A method that `toArray()` spreads.
3. `toArray()`.
4. The resource class.

So the resource's own entries, on the class or on a method, take precedence over the model's. The order holds even when two places spell an index signature's name differently.

An entry that leaves out `'optional'` keeps the flag of the nearest place above it in the list that sets one, or else the inferred one. Over the `Address` entry above, a `toArray()` entry `'latitude' => 'Latitude'` on a plain `'latitude' => $this->latitude` publishes `latitude?: Latitude`.

## Nullable Relations

A to-one relation loads `null` when its related record doesn't exist. Wherever Laravel can send that `null`, the property adds `| null`. The package decides whether a relation can load `null` from the relation type and your database schema. The `models.nullable_relations` setting controls this, and it's enabled by default. Each relation type has a strategy:

| Relation type                                           | Strategy   | Result                                                           |
| ------------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `HasOne`, `MorphOne`, `HasOneThrough`                   | `nullable` | Always nullable, since the related record may not exist          |
| `BelongsTo`                                             | `fk`       | Nullable when the foreign key column is nullable in the database |
| `MorphTo`                                               | `morph`    | Nullable when the morph type or ID column is nullable            |
| `HasMany`, `BelongsToMany`, and other to-many relations | `never`    | A list, never `null`                                             |

For example, a `BelongsTo` relation with a nullable foreign key:

```php
// Migration: $table->foreignId('user_id')->nullable();

// Resource:
'user' => $this->whenLoaded('user'),
```

The property publishes `user?: User | null`: optional because of `whenLoaded()`, and nullable because of the foreign key.

The `| null` also applies to the other ways you can send the relation. Here `parent` is a `BelongsTo` relation with a nullable `parent_id`, and `children` is a `HasMany` relation:

```php
'parent_name' => $this->whenLoaded('parent', fn ($parent) => $parent->name),
'parent_label' => $this->whenLoaded('parent', 'loaded'),
'parent_resource' => CategoryResource::make($this->whenLoaded('parent')),
'parent_direct' => CategoryResource::make($this->parent),
'parent_nullsafe' => $this->parent?->toResource(),
'parent_in_array' => ['parent' => CategoryResource::make($this->parent)],
'children_names' => $this->whenLoaded('children', fn ($children) => $children->pluck('name')),
```

Each `parent` property adds `| null`, and the to-many `children_names` doesn't:

```typescript
parent_name?: string | null;
parent_label?: string | null;
parent_resource?: CategoryResource | null;
parent_direct: CategoryResource | null;
parent_nullsafe: CategoryResource | null;
parent_in_array: { parent: CategoryResource | null };
children_names?: string[];
```

Each `| null` comes from what Laravel does at runtime:

* **A `whenLoaded()` value or closure**: when the relation is loaded as `null`, Laravel returns `null` without reading the value or calling the closure.
* **A resource built around the relation**: inside another resource, Laravel sends a nested resource whose payload is `null` as `null`.
* **A nullsafe call**: `?->` returns `null` when the relation is `null`.

`$this->parent->toResource()`, without the `?`, publishes `CategoryResource` with no `| null`, because PHP throws an error when `parent` is `null`.

A `when()`, ternary, `mergeWhen()`, `transform()`, `if` block or earlier `return` that rules out a `null` `parent` by testing `$this->parent` itself, for truthiness, against `null`, with `isset()` or with one `instanceof`, drops the `| null` from what it guards, so `$this->when($this->parent, fn () => CategoryResource::make($this->parent))` publishes `CategoryResource`, while a check on `parent_id` keeps it, because a soft-deleted parent still loads as `null`.

A resource built directly around a relation gets the `| null` only when the package can type that relation. A relation the model doesn't declare, a relation to a model the package doesn't publish, and a `morphTo` with no resolvable target publish without it. Inside a `whenLoaded()` closure, the relation's own rule applies instead, so `$this->whenLoaded('parent', fn ($parent) => CategoryResource::make($parent))` publishes `CategoryResource | null` whenever `parent` can load `null`. In that closure, a relation the model doesn't declare counts as one that can load `null` while `nullable_relations` is on.

A `whenLoaded()` value that hands the relation to a resource's `collection()` is the exception. Only a to-many relation, which loads as a list, fits there, so `$this->whenLoaded('branches', CategoryResource::collection(...))` publishes `branches?: CategoryResource[]` even when the package can't read `branches`.

Inside a `map()`, Laravel turns a nested resource with a `null` payload into `null` only where it reaches the mapped items as an array, so the `| null` depends on how the chain ends. On a `Team` resource, where `members` holds users and `profile` is a `HasOne` relation:

```php
'profiles' => $this->members->map(fn (User $member) => ['profile' => new ProfileResource($member->profile)]),
'profiles_all' => $this->members->map(fn (User $member) => ['profile' => new ProfileResource($member->profile)])->all(),
```

Only the chain that ends in `->all()` adds `| null`:

```typescript
interface TeamResource {
  profiles: { profile: ProfileResource }[];
  profiles_all: { profile: ProfileResource | null }[];
}
```

Without `->all()`, or through `->values()`, a member with no profile makes Laravel throw instead of sending `null`.

To turn off nullable relation detection everywhere:

```php
// config/ts-publish.php
'models' => [
    'nullable_relations' => false,
],
```

To change the strategy for a relation type, use `models.relation_nullability_map`:

```php
// config/ts-publish.php
'models' => [
    'relation_nullability_map' => [
        \Illuminate\Database\Eloquent\Relations\HasOne::class => 'never',
    ],
],
```

The valid strategies are `'nullable'`, `'never'`, `'fk'`, and `'morph'`.

::: info
Resources and models share these `models.*` settings, because a resource takes its relation types from its backing model. See [Nullable Relations](./models.md#nullable-relations) on the Models page.
:::

## Filtering & Excluding

Choose which resources are published with the same include and exclude settings that [enums](./enums.md#filtering-excluding-enums) and [models](./models.md#filtering-excluding-models) use:

```php
// config/ts-publish.php

'resources' => [
    // Publish only these resources (leave empty to publish all)
    'included' => [
        App\Http\Resources\UserResource::class,
        App\Http\Resources\PostResource::class,
    ],

    // Leave these resources out
    'excluded' => [
        App\Http\Resources\InternalResource::class,
    ],

    // Search these directories for resources too
    'additional_directories' => [
        'modules/Blog/Http/Resources',
    ],
],
```

::: tip
As with models and enums, `included` and `excluded` accept both class names and directory paths.
:::

`#[TsExclude]` on a resource class also leaves it out. See [Resource Attributes](#resource-attributes) and [Excluding Content](./excluding-content.md).

To turn off resource publishing entirely, set `enabled` to `false`:

```php
// config/ts-publish.php

'resources' => [
    'enabled' => false,
],
```

To publish only resources for a single run, pass the `--only-resources` flag:

```bash
php artisan ts:publish --only-resources
```

`--only-resources` fails when you combine it with another `--only-*` flag, such as `--only-enums` or `--only-models`. `--only-functional` is the exception: it overrides every other `--only-*` flag, and it skips resources.

## Configuration Reference

The [Configuration Reference](./configuration-reference.md) lists every `resources.*` config key.
