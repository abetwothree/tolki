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

- Direct properties, such as `id`, `name`, and `email`, are required.
- `whenLoaded()`, `whenHas()`, `whenNotNull()`, and `whenCounted()` make their properties optional (`?`).
- `EnumResource::make()` publishes `AsEnum<typeof Role>` and imports it. It adds `| null` because the `role` column is nullable.
- `PostResource::collection()` publishes `PostResource[]`, imported from the barrel file in the same directory.
- A bare `whenLoaded('profile')` publishes the model's relation type, `Profile | null`.
- The class docblock becomes a JSDoc comment, with a `@see` tag that points back to the PHP class.

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

### Conditional Methods

Laravel's conditional methods publish optional properties (`?`), because the key can be missing from the response. Passing a default argument makes the property required, because the key is then always present. See [Passing a Default Argument](#passing-a-default-argument).

| Method                                                    | Includes the key when                       | Published type                        |
| --------------------------------------------------------- | ------------------------------------------- | ------------------------------------- |
| `$this->when($condition, $value)`                         | `$condition` is true                        | `$value`'s type                       |
| `$this->unless($condition, $value)`                       | `$condition` is false                       | `$value`'s type                       |
| `$this->whenHas('attribute', $value)`                     | The attribute is present                    | `$value`'s type, else the attribute's |
| `$this->whenAppended('attribute', $value)`                | The accessor is appended                    | `$value`'s type, else the accessor's  |
| `$this->whenNotNull($value)`                              | `$value` isn't `null`                       | `$value`'s type without `null`        |
| `$this->whenNull($value)`                                 | `$value` is `null`                          | `null`                                |
| `$this->whenLoaded('relation')`                           | The relation is loaded                      | The relation's type                   |
| `$this->whenCounted('relation')`                          | The count is loaded                         | `number`                              |
| `$this->whenAggregated('relation', 'column', 'function')` | The aggregate is loaded                     | `number`                              |
| `$this->whenExistsLoaded('relation', $value)`             | The existence flag is loaded                | `$value`'s type, else `boolean`       |
| `$this->whenPivotLoaded('table')`                         | The pivot is loaded                         | `unknown`                             |
| `$this->whenPivotLoadedAs('accessor', 'table')`           | The pivot is loaded under a custom accessor | `unknown`                             |
| `$this->transform($value, $callback)`                     | `$value` is filled                          | `$callback`'s return type             |

To see when `whenLoaded()` adds `| null`, read [Nullable Relations](#nullable-relations).

#### `unless()` Is `when()` With the Condition Negated

`unless($condition, $value, $default)` includes `$value` when `$condition` is false. It publishes exactly what `when()` would, including with a default argument:

```php
'status' => $this->unless($this->is_draft, $this->status),          // optional
'status' => $this->unless($this->is_draft, $this->status, 'draft'), // required
```

#### Passing a Default Argument

Every conditional method accepts a trailing default argument. When you pass one, Laravel always includes the key, so the property is required. The default's type joins the value's type:

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

A default of the value's own type makes the property required without widening it. A default of another type, such as a string fallback for a number column, publishes a union of both.

An explicit `null` counts as a default, because Laravel checks whether you passed the argument, not what it holds. So `$this->whenLoaded('user', fn ($user) => $user, null)` is required, and it publishes `User | null` instead of `User`.

A default always makes the property required, but two cases leave its type as it was:

- **A default the package can't type**: the value's type stands alone. This covers an expression or closure the package can't read.
- **A value the package can't type**: `whenPivotLoaded()` and `whenPivotLoadedAs()` publish `unknown`, which already covers any default.

Laravel calls a default closure with no arguments, except in `transform()`. A closure default that requires a parameter would throw if it ran, so the package leaves it out of the type:

```php
'notes' => $this->whenNotNull($this->notes, fn ($notes) => strlen($notes)), // notes: string
```

A closure whose parameter has its own default, such as `fn ($notes = '') => strlen($notes)`, runs without arguments, and the parameter holds its default's type. Its return type joins the union as usual, and the property publishes `string | number`.

`transform()` calls its default with the blank value, so a one-parameter default runs, and its parameter holds the value's full type, `null` included. `$this->transform($this->rating, fn ($r) => 'x', fn ($r) => $r)` publishes `string | number | null`.

#### Closure Parameters

When you pass a closure as the value, its first parameter holds whatever Laravel calls it with:

| Method                                                            | The closure's first parameter holds                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `whenLoaded()`                                                    | The loaded relation: a model, a list of models, or the models a `morphTo` can hold         |
| `whenHas()`                                                       | The attribute's value                                                                      |
| `whenExistsLoaded()`                                              | The relation's `{relation}_exists` flag, a `boolean`                                       |
| `whenCounted()`, and `whenAggregated()` with the `count` function | The count, a `number`                                                                      |
| `transform()`                                                     | The value you pass as its first argument                                                   |
| `when()`, `unless()`, `whenAppended()`                            | No value, since Laravel passes none. A parameter with a default holds that default's type. |

The closure's return type becomes the property's type:

```php
'author_name' => $this->whenLoaded('author', fn ($author) => $author->name),     // author_name?: string
'has_comments' => $this->whenExistsLoaded('comments', fn ($exists) => $exists), // has_comments?: boolean
```

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
  title_unresolvable?: string;
  // …
}
```

When the package can't type the value, the attribute's own type stands instead of `unknown`. `json_decode()` returns `mixed`, so `title_unresolvable` keeps the `title` column's `string`. Without a value argument, `whenHas('phone')` types from its column, and `whenExistsLoaded('user')` publishes `boolean`.

#### An Explicit `null` in the Value Slot

Laravel's `value()` helper returns a plain `null` unchanged. So a literal `null` as the value of `whenHas()`, `whenAppended()`, or `whenExistsLoaded()` publishes `null`, and the attribute's type never reaches the property. A default still joins the type:

```php
'address'  => $this->whenHas('full_address', null, 0),         // address: number | null
'appended' => $this->whenAppended('full_address', null, 0),    // appended: number | null
'exists'   => $this->whenExistsLoaded('user', null, 'absent'), // exists: string | null
```

This happens only when Laravel receives a `null` in that slot: a literal `null`, or a named `default:` argument that skips the value, since PHP fills the skipped argument with `null`. So `whenHas('phone', default: 0)` publishes `number | null`. Leaving both arguments out is different: `whenHas('phone')` still types from the column, and `whenExistsLoaded('user')` is still `boolean`.

`whenCounted()` and `whenAggregated()` treat a `null` value as no value, so the count still comes through. That's why `whenCounted('reviews', null, 'n/a')` publishes `number | string`.

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

The `author`, `tags`, and `owner` properties publish:

```typescript
author?: UserResource;
tags?: TagResource[];
owner: UserResource;
```

A resource can reference itself:

```php
'parent' => CategoryResource::make($this->whenLoaded('parent')),
'children' => CategoryResource::collection($this->whenLoaded('children')),
```

Calling `resolve()` on a nested resource, as in `new UserResource($this->author)->resolve($request)`, publishes the same interface.

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

A resource you name yourself is always used, even when this package doesn't publish it. That covers a class argument, `#[UseResource]` or `#[UseResourceCollection]`, and a collection's `#[Collects]` or `$collects`. When no resource matches at all, the property publishes `unknown`.

### Enum Properties With `EnumResource`

Wrap an enum-cast property in `EnumResource::make()` to send the enum as an object instead of its bare value:

```php
'status' => EnumResource::make($this->status),
'currency' => EnumResource::make($this->currency),
```

See [Response Shape](./enum-api-resource.md#response-shape) on the Enum API Resource page for what the object holds. With `enums.use_tolki_package` enabled, which is the default, these publish `AsEnum<typeof Status>` and `AsEnum<typeof Currency>`, and the package imports each enum. With it disabled, they publish the enum's type alias, such as `StatusType`.

`EnumResource::collection()` does the same for a list, and publishes `AsEnum<typeof Status>[]`.

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

| Method                                  | Merged properties                                   |
| --------------------------------------- | --------------------------------------------------- |
| `$this->merge([...])`                   | Required                                            |
| `$this->mergeWhen($condition, [...])`   | Optional (`?`), included when `$condition` is true  |
| `$this->mergeUnless($condition, [...])` | Optional (`?`), included when `$condition` is false |

::: warning
A `return []` inside a `merge()` closure doesn't make its keys optional, so they publish as required even though the response can leave them out. To publish them as optional, move the closure's body into a method and spread it, as [Return Branches and `@return` Shapes](#return-branches-and-return-shapes) describes. You can also mark each key `'optional' => true` with [`#[TsCasts]`](#overriding-property-types-with-tscasts).
:::

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

Some of Laravel's own methods declare loose types, so the package reads the model instead. `getKey()` publishes the model's key type, `number` or `string`, and `modelKeys()` publishes a list of it. That's why `comment_ids` above is `number[]`.

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

Both properties publish the shape of the returned array:

```typescript
export interface QuoteResource {
  quote: { unit: string; minimum: number; discounted: { unit: string } };
  tiers: { "1": string; "2": string };
}
```

Integer keys, written literally or as a constant such as `self::TIER_BASIC`, publish quoted, because JSON encodes such an array as an object. Resources drop integer keys from their own arrays and methods, so this applies only to classes that aren't resources.

A `?array` declaration keeps its `null`, so the method publishes the shape `| null`. An `array|false` declaration keeps its `false` the same way.

In these cases, the package can't use the method body, and the property publishes `unknown`:

- The method can return something other than an array literal, apart from a `null`, boolean, string, or number literal its declaration allows. Returning another method call, a generator, or a bare `return;` all count.
- A value in the array is an enum or a model. A method body can't supply the import these need. Give the method a native return type, or a `@return array{...}` docblock, to type it.

A model's own `toArray()`, called as a value, also publishes `unknown`, because the relations it includes depend on what's loaded at runtime. Spread it instead, as [Model `toArray()` Spread](#model-toarray-spread) shows.

An `only()` or `except()` call is the exception to the enum-and-model rule. Its result names no class, so the rest of the shape survives:

- A literal key list publishes its inline shape, with any enum- or model-typed member left `unknown`.
- A runtime key list publishes `Record<string, unknown>`.
- A to-many relation publishes `unknown[]`.

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

### Local Variables and Narrowing

A variable you assign once keeps the type of its value, so you don't need to inline the expression. Assign it in a statement at the top level of the method or of a closure body:

```php
public function toArray(Request $request): array
{
    $slug = $this->slug;

    return [
        'slug' => $slug, // string, as if you returned $this->slug
    ];
}
```

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

A variable you write more than once publishes `unknown`, because the package can't tell which value reaches the response. That includes a second assignment inside an `if` or a loop, a `foreach` that assigns it, and changes through `.=`, `++`, or a reference. A variable assigned only inside an `if`, a loop, or another block also publishes `unknown`. Variables assigned inside a closure body follow the same rules within that closure.

To type a variable the package can't read, annotate its assignment. See [Typing a Variable With `@var`](#typing-a-variable-with-var).

#### Narrowing With `instanceof`

An early-exit `instanceof` guard narrows a variable for every statement after it. Here `attachable` is a `morphTo`, so `$parent` can hold several models until the guard proves it holds a `Post`:

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

A guard narrows a variable only when all of these hold:

- The `if` sits at the top level of the method or closure body.
- The `if` has no `else` or `elseif`, and its body ends with `return` or `throw`.
- The condition is a negated test such as `! $parent instanceof Post`, alone or in an `||` chain. A chain joined with `&&` narrows nothing.
- The test reads a local variable or a closure parameter, not a property such as `$this->author`.
- Nothing writes the variable after the guard. A write before the guard doesn't matter, since the guard tests the value it leaves.

The guard narrows only the reads after it. A read in the guard's own body, or in a `return` placed before the guard, still sees every class the variable can hold. A positive test, such as `if ($parent instanceof Post) { ... }`, narrows nothing, not even inside its own body.

Narrowing applies to reads through the variable, such as `$parent->title`. The variable's own value, as in `'parent' => $parent`, keeps its full union type.

An `instanceof` ternary on a variable narrows its true arm the same way, as `record_title` above shows, and so does an `||` chain of tests on that variable. A negated test, such as `! $post instanceof Post ? null : $post->title`, narrows the false arm instead.

A ternary that tests `$this->resource` against one model narrows the backing model for its proven arm, so a relation that only a subclass declares resolves there. On a `Team` resource, `$this->resource instanceof SubscribedTeam ? $this->resource->subscriber?->name : null` publishes `string | null`.

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

- **The ternary's own value**: `'either' => $either` publishes the whole union. Only reads through the variable narrow.
- **A read inside the arm when the test is on a property**: `$this->imageable instanceof Post ? $this->imageable->getKey() : null` stays `number | string | null`. Assign the ternary to a variable, and read through that variable instead.
- **A test on a different spelling of the arm's value**: a variable bound to a ternary that tests `$this->resource->imageable` against a `$this->imageable` arm isn't narrowed.
- **Mixed conditions**: a test joined with `&&`, or an `||` chain that mixes negated and plain tests.
- **The arm the test doesn't prove**: `$this->resource instanceof SubscribedTeam ? null : $this->resource->subscriber` publishes `unknown`, since `Team` has no `subscriber` relation.

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

It also restores a value the package would otherwise drop. Without the annotation, `$picked` below publishes `null`, because the package leaves out a ternary arm it can't type:

```php
/** @var string|null $picked */
$picked = $this->id > 0 ? json_decode('"x"') : null; // string | null
```

The annotation follows these rules:

- **Placement**: it sits on a `$x = ...;` statement at the top level of the method or closure body. It names the variable, as in `/** @var CartTotals $totals */`, or names none, as in `/** @var CartTotals */`.
- **Span**: it types the reads after that statement, up to the next statement that writes the variable. A loop that writes the variable ends the span where the loop starts. So an annotation also types a variable you reassign, until its next write.
- **Precedence**: it applies only where the package's own reading of the value is `unknown`, or is only the `null` left after an arm it can't type was dropped. Any other reading stands, whatever the annotation says: `/** @var int $n */ $n = $this->title;` still publishes `string`. To override a type the package got wrong, use [`#[TsCasts]`](#overriding-property-types-with-tscasts).

A conditional value stays optional, so `/** @var User $reviewer */ $reviewer = $this->whenLoaded('reviewer');` publishes `reviewer?: User`. When `$x` is a closure parameter or a `foreach` variable bound to a model, `$x->prop` and `$x->m()` keep reading that model, even after an annotated reassignment.

The annotation's type counts only when it's built from these forms, and when every part of it resolves:

- Scalars: `int`, `string`, `bool`, `float`, `null`, `true`, and `false`
- A class, interface, or enum that the file imports or writes in full
- Unions of these, such as `Comment|User|null`, and `?` before a scalar or a class
- `list<X>`, `array<int, X>`, and `array<string, X>`
- `array{...}` shapes with plain identifier keys
- `Collection<K, X>`, for both Laravel's support collection and its Eloquent collection

Any other type is ignored. Write `array{a: int}|null` instead of `?array{a: int}`, and `list<int>` instead of `int[]`. A union that names a class both alone and inside a list, such as `list<User>|User`, is ignored too, and so is a model inside a shape.

### Collection Pipelines

A chain of collection methods keeps its element type to the end, whether it starts at a relation or at `collect()`:

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

- **`all()` and `values()`**: a collection and the array behind it both publish `X[]`, so `all()` changes nothing. A method that breaks sequential keys, such as `filter()`, `sortBy()`, or `keyBy()`, adds a `Record<string, X>` arm, because `json_encode()` writes such a collection as an object. `values()` restores sequential keys and removes that arm.
- **`collect()`**: the element type comes from the argument, and the `map()` parameter holds that element, which is why `$word` above is a `string`.
- **`data_get()`**: `data_get($target, 'a.b')` publishes what `$target?->a?->b` would. A default joins the type instead of removing `null`, because `data_get()` returns the default only when the key is missing, not when its value is `null`.
- **Typed `map()` parameters**: a model type hint on a `map()` parameter types every read through it, chained and nullsafe reads included, when you call `map()` on a variable such as a local or a `whenLoaded()` parameter. With `$rows = $this->resource->getRelation('comments')`, `$rows->map(fn (Comment $comment) => $comment->user?->name ?: null)->all()` publishes `(string | null)[]`. A relation chain such as `$this->comments->map(...)` uses the relation's model the same way. On a `collect(...)` root, or on a `map()` called straight on a method's result, such as `$this->resource->getRelation('comments')->map(...)`, the parameter holds no model, so reads through it publish `unknown`.

`concat($other)` keeps the type only when `$other` is exactly the same collection type. Concatenating `Comment[]` and `Tag[]` publishes `unknown`, since the result is a different collection, not a longer one. A `data_get()` key with a `*` segment also publishes `unknown`.

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

If no class in the chain declares a `toArray()`, the resource publishes the model's properties, as [JsonResource Base Delegation](#jsonresource-base-delegation) describes. With no model either, the interface is empty, apart from any types `#[TsExtends]` adds. A `ResourceCollection` subclass with no `toArray()` still finds its element type as [Resource Collections](#resource-collections) describes.

### JsonResource Base Delegation

A resource with no `toArray()`, or whose `toArray()` returns `parent::toArray($request)`, publishes the backing model's columns, accessors, and relations:

```php
/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    // No toArray(): the properties come from the User model
}
```

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

- **An `array{...}` shape**: each key gets its own type, and a key written `key?:` also becomes optional. A string or number literal type, such as `'draft'|'live'` or `1|2|3`, publishes as written.
- **`array<string, V>`**: `V` types every key the body left `unknown`.

`toArray()`'s own `@return array{...}` fills keys the same way.

The body always wins. The docblock fills only a key the body left `unknown`, or an [interpolated key's](#interpolated-keys) value that the body left `unknown | undefined`, so a stale `@return` can't overwrite a type the package already knows.

A shape value that names a PHP class or enum is skipped, because a docblock can't carry its import. Type that key with `#[TsCasts]` and an `import` instead. A name that isn't a PHP class, such as a type you declare only in TypeScript, publishes as written in a spread method's `@return`. In `toArray()`'s own `@return`, the key stays `unknown`, so type it with `#[TsCasts]`.

The branches count only while every `return` in the method is an array literal, `[]`, or a variable the method builds. Otherwise, only the method's first `return` counts.

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

A backslash in the literal text is doubled, because TypeScript reads a single one as an escape. `$data["{$name}\\unit"]`, whose keys end in `\unit`, publishes ``[key: `${string}\\unit`]``.

TypeScript checks an index signature against every named key its pattern matches, and against every signature whose pattern contains its own. So each named key the pattern matches, `#[TsCasts]` keys included, joins the signature's value type, and so does another signature with the same pattern. Beside `price_tag: number`, the `_tag` signature publishes `string | number | undefined`.

A signature keeps only the value its body gives it, which is `unknown | undefined` when only the docblock typed it, in these cases:

- **A key that can't join**: a key the pattern matches, or one of the signature's own entries, can't join the union when any of these holds:
  - its type has a top-level `unknown`, or is a template literal type
  - its type names a class, or any type other than a primitive, `Record`, or `Date`
  - its type holds a string literal with a backslash
  - it brings a class import, unless the import comes from `#[TsCasts]`
- **An overlapping pattern**: another signature's pattern may overlap its own. A plain `[key: string]` or `[key: number]` signature always counts as overlapping.
- **An extends clause**: the interface extends a type, through `#[TsExtends]` or a `ts_extends` config entry, whose keys the package can't see.

A signature needs both a literal part and a variable part. A fully literal key publishes as a named property, and a fully dynamic key, such as `$data[$name]`, isn't published. A key whose literal text contains a backtick isn't published either.

A value the body typed itself stands, even beside a key it can't take in, an overlapping pattern, or an extends clause. So ``[key: `${string}_tag`]: string | undefined`` beside `main_tag: PostResource` still fails `tsc` with TS2411, and a pattern contained in another one can fail with TS2413. Type the key, or rename it out of the pattern.

### Model `toArray()` Spread

Spreading a model's own `toArray()` into an array literal with other keys intersects the model's interface with those keys, instead of publishing `unknown[]`:

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

At the top level of `toArray()`, a spread with no key flattens into the resource's own properties instead. `...$this->user->toArray()` adds the user's properties to the interface, and `...PostResource::make($this->post)->resolve()` adds the post resource's. A collection's `...$this->tags->toArray()` adds a `[key: number]` index signature.

::: info
The intersection references the `{Model}` interface instead of copying its shape. That comes close to what `toArray()` returns at runtime, with two differences:

- **Relations are missing**: a relation loaded before the spread is in the JSON but not in the type, since the package can't know what's loaded. Under the [`model-split` template](./models.md#model-templates), relations live in `{Model}Relations`, which the spread doesn't reference.
- **`$hidden` columns are extra**: Laravel strips them at runtime, but they stay in `{Model}` unless [`models.exclude_hidden`](./models.md#what-gets-published-hidden-attributes-write-only-accessors) is enabled.

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

- **`only([...])`**: exactly the keys you name, each typed from the model, including accessors and relations. A key the model types outside its schema, such as a `withCount()` count (`comments_count: number`) or an `@property` tag, is kept. A key that the model doesn't define and nothing can type is dropped.
- **`except([...])`**: the model's columns, accessors, and relations, minus the keys you name.

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

- **`only([...])`**: expands exactly the keys you name. Eloquent's `only()` calls `getAttribute()` for each key, which reads accessors and relations too. So `$this->author->only(['name', 'initials', 'posts'])` publishes `{ name: string; initials: string; posts: Post[] }`.
- **`except([...])`**: expands the related model's database columns minus the named keys, never an accessor or a relation. Eloquent's `except()` reads only the stored attributes, and a model keeps its relations apart from those.

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

An accessor that returns an Eloquent collection of models filters the same way. It publishes a list of those models, such as `Comment[]`, whatever key type the accessor declares.

A member holding a support `Collection` selects entries by key: `only()` keeps the listed keys, and `except()` drops them. Its filter publishes `Record<string, unknown>`, whatever the collection holds. This covers these members:

- A column cast with `'collection'`, `'encrypted:collection'`, `AsCollection`, or `AsEncryptedCollection`
- An accessor, cast getter, or method that returns a `Collection`

These members publish `unknown` instead:

- An `AsEnumCollection` column
- A collection-cast column read through anything other than `$this` or `$this->resource`, such as a relation's column in `$this->author->options->only([...])`, or a local variable that holds the model
- A collection class that overrides `only()` or `except()`, such as:
  - a class you pass to `AsCollection::using()`
  - a returned subclass that overrides them
  - a cast that builds an Eloquent collection
  - a method that returns an Eloquent collection

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

The singular resource comes from the first of these that applies:

1. The `#[Collects(UserResource::class)]` attribute on the collection. This attribute needs Laravel 13.
2. The `$collects` property.
3. Laravel's naming convention: `UserCollection` collects `UserResource`, or else `User` from the same namespace, when the package publishes that resource.

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

When no singular resource matches, such as for a `MiscCollection` with no `MiscResource`, `$this->collection` publishes `unknown`.

A collection with no `toArray()` publishes Laravel's default shape, `{ data: R[] }`. With `public static $wrap = null;`, the collection is the list itself, so the package publishes a type alias instead of an interface:

```php
#[Collects(PostResource::class)]
class PostFlatCollection extends ResourceCollection
{
    public static $wrap = null;
}
```

The unwrapped collection becomes an alias:

```typescript
export type PostFlatCollection = PostResource[];
```

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

### Paginated Collections

A collection's interface covers what its `toArray()` returns. The `links` and `meta` keys Laravel adds to a paginated response, and any data you add with `additional()`, aren't part of it. An Inertia page prop that passes a paginator to a resource collection gets its pagination members from the page prop's type instead. See [Paginating Inline in the Render Call](./inertia.md#paginating-inline-in-the-render-call) on the Inertia page.

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

- A method call on an enum, a date, a model, or a service, and a property read on any of those or on a value object. See [Method Return Types](#method-return-types).
- A value behind a local variable, a closure-local variable, or an `instanceof` guard. See [Local Variables and Narrowing](#local-variables-and-narrowing).
- A collection chain, `data_get()`, and `only([...])` on any model. See [Collection Pipelines](#collection-pipelines) and [Attribute Filters on Any Model](#attribute-filters-on-any-model).
- A key that only some branches return, or one that a spread method's `@return` describes. See [Return Branches and `@return` Shapes](#return-branches-and-return-shapes).

`#[TsCasts]` is the right tool when the frontend owns the type and it needs its own import, or when a shape is dynamic.
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

You can put `#[TsCasts]` on the resource class, on `toArray()` itself, or on a trait or helper method that `toArray()` spreads. On a method, it works the same way as on the class. See [Trait Method Spread](#trait-method-spread).

The backing model's own `#[TsCasts]` applies here too. An entry on the model retypes the resource property with the same name, including its `optional` flag. For example, an `Address` model entry `'latitude' => ['type' => 'number | null', 'optional' => true]` makes a resource's `'latitude' => $this->whenNotNull($this->latitude)` publish `latitude?: number | null`. The resource's own entries take precedence, and a model entry never adds a property.

## Nullable Relations

When `whenLoaded('relation')` publishes a relation's type, the package decides whether to add `| null` from the relation type and your database schema. The `models.nullable_relations` setting controls this, and it's enabled by default. Each relation type has a strategy:

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

::: warning
The `| null` belongs to the relation's own type. When you wrap the relation in a resource, as in `UserResource::make($this->whenLoaded('user'))`, the property publishes `user?: UserResource` without `| null`, even though Laravel sends `null` when the related record is missing. Add `| null` with [`#[TsCasts]`](#overriding-property-types-with-tscasts) if your frontend needs it.
:::

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
