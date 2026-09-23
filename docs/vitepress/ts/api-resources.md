# API Resources

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can generate TypeScript interfaces from your Laravel [API Resources](https://laravel.com/docs/eloquent-resources) (`JsonResource` classes). It statically analyzes the `toArray()` method to extract property names, types, and optionality — producing a TypeScript interface that matches the shape of your API responses, without running the application.

As mentioned in [Installation & Usage](./index.md), resources only need the `@tolki/ts` runtime package when they use `EnumResource::make()`, which generates `AsEnum<typeof Enum>` — backed by the runtime's `AsEnum` utility type (see [Enums](./enums.md)).

By default, the package looks for resources in the `app/Http/Resources` directory. See [Filtering & Excluding](#filtering--excluding) to customize this.

## How the Backing Model Is Resolved

The analyzer resolves property types by inspecting the backing Eloquent model's database schema and cast definitions. The backing model is determined from, in priority order:

1. The `#[TsResource(model:)]` attribute
2. The resource's own `@mixin` / `@extends` PHPDoc tag (resolved via use statements)
3. The nearest ancestor's `@mixin` / `@extends` — climbs the parent chain until one resolves
4. A typed `$resource` property
5. Convention-based guess — reverses Laravel's naming convention (`App\Http\Resources\UserResource` → `App\Models\User`)
6. `#[UseResource]` attribute scan — checks all collected models for a `#[UseResource(ResourceClass::class)]` attribute pointing to this resource (Laravel 12+ only)

Most resources only need `@mixin` or the naming convention. The `#[TsResource(model:)]` attribute is useful when the resource name doesn't match the model, and `#[UseResource]` handles cases where the resource lives outside the standard `Http\Resources` namespace.

Step 3 is what lets a subclass inherit its parent's model without repeating the docblock — see [Inheriting a Parent `toArray()`](#inheriting-a-parent-toarray). It applies to every resource missing its own tag, not only to body-less ones.

## Supported `toArray()` Patterns

The analyzer recognizes the following patterns inside `toArray()`:

### Direct Property Access

```php
'id' => $this->id,
'name' => $this->name,
'status' => $this->status,       // Enum cast → generates enum type
```

Types are resolved from the model's database columns and cast definitions.

### Method Return Types

A method call types from the called method's own signature — its native return type first, then its `@return` docblock. The receiver can be an enum cast, a Carbon cast, a model, an Eloquent collection, or a service resolved out of the container:

```php
public function toArray(Request $request): array
{
    $record = $this->resource;

    return [
        'priority_label' => $this->priority->label(),                                 // enum cast
        'published_date' => $this->published_at->setTimezone('UTC')->toDateString(),  // Carbon cast
        'from_label' => Priority::from(1)->label(),                                   // enum static constructor
        'record_class' => $record::className(),                                       // static call on a variable's class
        'author_fresh' => $this->author->fresh(),                                     // model
        'comment_ids' => $this->comments->modelKeys(),                                // Eloquent collection
    ];
}
```

```typescript
export interface ReceiverMethodResource {
  priority_label: string;
  published_date: string;
  from_label: string;
  record_class: string;
  author_fresh: User | null;
  comment_ids: number[];
  // …
}
```

A property read on the same receiver resolves the same way, so `$post?->author?->name` is `string | null` once `$post` is known to hold a `Post`. That is also how a value object is read: `$this->stats?->views` publishes `number | null` off the object's own declared property. Nullsafe steps add `| null` to the result, and never add it twice.

#### A bare `array` signature falls back to the body

Reflection alone turns a bare `: array` into `unknown[]`, which claims a list where an associative array is a JSON object. The method body's literal shape answers instead:

```php
final class PriceQuoteService
{
    public function quote(): array
    {
        return ['unit' => '1.00', 'minimum' => 10, 'discounted' => ['unit' => '0.90']];
    }
}

// in toArray():
'quote' => resolve(PriceQuoteService::class)->quote(),
```

```typescript
export interface ServiceReturnResource {
  quote: { unit: string; minimum: number; discounted: { unit: string } };
  tiers: { "1": string; "2": string };
}
```

The limit: the body fallback carries no import channel, so a body whose shape names an enum or a model is discarded whole and the vague declaration stands — give the method a native return type or a `@return array{...}` docblock when you need that token. `Model::toArray()` is declined on any receiver, since which relations are loaded is runtime state no declaration describes; use the [Model `toArray()` Spread](#model-toarray-spread) form instead.

An `only()`/`except()` filter in that body is the exception: there it publishes an answer that names no class, so the shape survives. A literal key list gives its inline shape, with a member typed by an enum or a model left `unknown`; a runtime key list gives `Record<string, unknown>`; a to-many relation gives `unknown[]`. The same holds when the body reads an accessor whose type comes from a getter body that filters. A model whose own `only()`/`except()` override declares a return publishes that return instead: a model return such as `: static` becomes the object that model serializes (its columns and appended accessors) narrowed to the literal keys, and an enum or other class return leaves the value `unknown`.

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

```typescript
summary: { id: number; author: { id: number; name: string }; author_role: { id: number; role: unknown } | null; replies: unknown[] };
```

### Local Variables and Narrowing

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

#### Narrowing with `instanceof`

An early-exit guard narrows a variable for every statement after it, so a read through it on a `morphTo` union (`$parent->title`) resolves against the one class the guard proves, though the variable's own value (`'parent' => $parent`) keeps its un-narrowed type:

```php
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
```

```typescript
export interface NarrowedParentResource {
  parent?: { title: string; class: string; morph: string } | null;
  record_title: string | null;
}
```

An `instanceof` ternary narrows its true arm the same way. A ternary testing `$this->resource` goes one further and narrows the *backing model* for that arm, so a relation only the subclass declares resolves there — `$this->resource instanceof SubscribedTeam ? $this->resource->subscriber?->name : null` publishes `string | null` on a `Team`-backed resource.

A variable bound to an `instanceof` ternary carries the narrowing into every read made through it, and the test can be an `||` chain of `instanceof` checks on the true arm's own expression. Here `imageable` is a `morphTo` whose targets include a string-keyed model:

```php
$either = $this->imageable instanceof Post || $this->imageable instanceof User ? $this->imageable : null;

return [
    'either_id' => $either?->getKey(),          // number | null
    'open_id' => $this->imageable?->getKey(),   // number | string | null
];
```

The limit: the statement form and the ternary form of the *same* positive test disagree. A positive `if ($parent instanceof Post) { … }` body binds nothing — only the negated early-exit `if` narrows the statements that follow — while the positive ternary above does narrow its true arm. The early-exit form also binds a variable only when nothing writes it after the guard, and only for the reads after the guard (a write before the guard does not matter, since the guard tests the value it leaves): a `return` placed before it, or the guard's own body, still reads the variable unnarrowed. A ternary narrows reads — inside its true arm when a single `instanceof` tests a variable or `$this->resource`, or through a variable bound to it — and never its own value, so a bare `$either` is not narrowed. An `||` chain, or a test on another subject such as `$this->imageable`, narrows only reads made through the ternary's value, such as a variable bound to it: `$this->imageable instanceof Post ? $this->imageable->getKey() : null` stays `number | string | null`. A variable bound to it narrows only when the test reads the true arm's exact expression: `&&`, a negation, or a test on another spelling of the same value (`$this->resource->imageable` against a `$this->imageable` arm) leaves the arm as it was.

### Conditional Methods

All conditional methods produce **optional** properties (with `?` in TypeScript) by default. Every one of
them, though, accepts a trailing default argument — and passing it explicitly makes the property
**required**, because the key can no longer be missing. `whenNotNull()`/`whenNull()`'s default argument is
covered just below the table; the rest of the family is covered right after that.

| Method                                          | Description                                    | Generated Type            |
| ----------------------------------------------- | ---------------------------------------------- | ------------------------- |
| `$this->when(cond, value)`                      | Include when condition is true                 | Inferred from value       |
| `$this->unless(cond, value)`                    | Include when condition is false                | Inferred from value       |
| `$this->whenHas('attr', $value)`                | Include when attribute is present              | From `$value`, else the column |
| `$this->whenAppended('attr', $value)`           | Include when accessor has been appended        | From `$value`, else the column |
| `$this->whenNotNull($this->attr)`               | Include when not null                          | From model column type    |
| `$this->whenNull($this->attr)`                  | Include when null                              | `null`                    |
| `$this->whenLoaded('relation')`                 | Include when relation is loaded                | From model relation type  |
| `$this->whenCounted('relation')`                | Include when count is loaded                   | `number`                  |
| `$this->whenAggregated('rel', 'col', 'fn')`     | Include when aggregate is loaded               | `number`                  |
| `$this->whenExistsLoaded('relation', $value)`   | Include when existence flag is loaded          | From `$value`, else `boolean` |
| `$this->whenPivotLoaded('table')`               | Include when pivot is loaded                   | `unknown`                 |
| `$this->whenPivotLoadedAs('accessor', 'table')` | Include when pivot (custom accessor) is loaded | `unknown`                 |
| `$this->transform($value, $callback)`           | Transform `$value` via `$callback` when filled | Inferred from `$callback` |

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
second argument is Laravel's fallback value, never a callback bound to the first argument. `whenNotNull()`'s guard
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

The type widens too, whenever the generator can resolve the default: its type is unioned in alongside the
value's, so the property covers both arms rather than only the one the value expression named.

```php
'discount' => $this->when($this->has_discount, $this->discount_percent),        // discount?: number
'discount' => $this->when($this->has_discount, $this->discount_percent, 'n/a'), // discount: number | string
'reviews'  => $this->whenCounted('reviews', null, 'n/a'),                       // reviews: number | string
'address'  => $this->whenHas('full_address', $this->full_address, 0),           // address: string | number
```

An explicit `null` still counts as a default — Laravel distinguishes an omitted argument from a passed-in
one, not a `null` value from a non-null one — so
`$this->whenLoaded('user', fn ($user) => $user, null)` is required, and typed `User | null` rather than a
bare `User` you could dereference on the not-loaded path.

The property is required either way — passing a default means the key is always there. Only the _type_
depends on what the generator could resolve, and two cases can't be widened:

- **The default's own type can't be resolved** (an unanalyzable expression or closure). There is nothing to
  union in, so the value's type stands alone.
- **The value's type can't be resolved** — `whenPivotLoaded()` and `whenPivotLoadedAs()`, whose pivot
  payload the generator never inspects. The property stays `unknown`, since `unknown` already admits the
  default.

A closure default that declares a required parameter goes a step further than merely unresolvable: Laravel
invokes every conditional default but `transform()`'s via `value($default)`, calling it with zero arguments, so a closure
requiring a parameter would throw if it ever ran. The generator treats that arm as unreachable and never
lets it widen the type:

```php
'notes' => $this->whenNotNull($this->notes, fn ($notes) => strlen($notes)), // notes: string, not string | number
```

A parameter with its own default (`fn ($notes = '') => strlen($notes)`) still runs cleanly with zero
arguments, so that arm keeps widening the type as usual, and the parameter holds its default's type.

`transform()` is the exception: it calls its default with the blank value, so a one-parameter default does run,
and its parameter holds the value's full type, `null` included —
`$this->transform($this->rating, fn ($r) => 'x', fn ($r) => $r)` publishes `string | number | null`.

#### `whenHas()`, `whenAppended()` and `whenExistsLoaded()` type from the value you pass

All three end in Laravel's `value()` helper, so the value argument — not the attribute you named — is what the property carries whenever the analyzer can type it. `whenHas()` and `whenExistsLoaded()` forward the attribute into the closure's first parameter; `whenAppended()` invokes its value with no arguments at all:

```php
return [
    'has_title' => $this->whenHas('title', fn ($title): bool => $title !== ''),
    'title_length' => $this->whenHas('title', fn ($title) => strlen($title)),
    'appended_label' => $this->whenAppended('title_display', fn () => 'label'),
    'comments_flag' => $this->whenExistsLoaded('comments', fn ($exists) => $exists ? 'yes' : 'no'),
    'title_unresolvable' => $this->whenHas('title', fn ($title) => json_decode($title)),
];
```

```typescript
export interface WhenHasValueResource {
  has_title?: boolean;
  title_length?: number;
  appended_label?: string;
  comments_flag?: string;
  title_unresolvable?: string;
  // …
}
```

The limit, and the useful half of it: a value the analyzer can't type leaves the named attribute's own type standing rather than trading it for `unknown` — `json_decode()` returns `mixed`, so `title_unresolvable` keeps the column's `string`. Omitting the value argument entirely still types from the attribute, so `whenHas('phone')` and `whenExistsLoaded('user')` are unchanged.

#### An explicit `null` in the value slot

`whenHas()`, `whenAppended()`, and `whenExistsLoaded()` hand their value argument to Laravel's `value()`
helper, which passes a plain `null` straight back instead of returning the attribute. So a literal `null`
there collapses the value arm: the default still unions in as usual, but the attribute's own type never
reaches the property at all.

```php
'address'  => $this->whenHas('full_address', null, 0),         // address: number | null
'appended' => $this->whenAppended('full_address', null, 0),    // appended: number | null
'exists'   => $this->whenExistsLoaded('user', null, 'absent'), // exists: string | null
```

Omitting the value argument is a different thing entirely: `whenHas('phone')` still types the column, and
`whenExistsLoaded('user')` is still `boolean`. The arm collapses only when Laravel actually receives a `null` in that slot — a literal `null`, or a named `default:` that skips past it (`whenHas('phone', default: 0)` is `number | null`), since PHP fills the skipped slot with `null` and Laravel counts it as passed.

`whenCounted()` and `whenAggregated()` substitute the `value()` helper themselves when their value argument
is `null`, so the count still comes through — which is why `whenCounted('reviews', null, 'n/a')` above stays
`number | string`.

### Enum Properties with `EnumResource`

Use `EnumResource::make()` to expose enum-cast properties as rich enum objects:

```php
'status' => EnumResource::make($this->status),
'currency' => EnumResource::make($this->currency),
```

When `enums.use_tolki_package` is enabled (the default), these generate `AsEnum<typeof EnumName>` types with automatic imports. When disabled, they generate the enum's `Type` alias (e.g., `StatusType`).

`EnumResource::collection()` does the same for a list-shaped value, producing `AsEnum<typeof EnumName>[]`.

Wrapping only one arm of a ternary keeps both arms. Wrap on one side, read the property directly on the other, and the two shapes come through as a union with the import each one needs — including nested inside an inline array:

```php
'audit' => [
    'status' => $request->boolean('wrap')
        ? EnumResource::collection($this->status_history)
        : $this->status_history,
],
```

```typescript
import { type AsEnum } from "@tolki/ts";

import { Status } from "../../enums";
import type { StatusType } from "../../enums";

export interface TeamStatusAuditResource {
  audit: { status: AsEnum<typeof Status>[] | StatusType[] };
}
```

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

### `toResource()` and `toResourceCollection()`

Laravel's `Model::toResource()` and `Collection::toResourceCollection()` are resolved too, three ways:

```php
// 1. Explicit class argument
'owner' => $this->owner->toResource(UserResource::class),

// 2. #[UseResource] / #[UseResourceCollection] on the model
'owner' => $this->owner->toResource(),

// 3. Laravel's naming convention — tries {Model}Resource, then bare {Model}
'owner_guessed' => $this->whenLoaded('owner', fn ($m) => $m->toResource()),
'attachment' => $this->whenLoaded('attachment', fn ($m) => $m->toResource()),
```

Only the third route _invents_ a class name, and it is accepted only when this package will actually emit that resource. If the guessed class is third-party, carries [`#[TsExclude]`](./excluding-content.md), or lives outside the scanned directories, the property falls back to `unknown` rather than referencing a module that is never written:

```typescript
owner_guessed?: UserResource; // guessed UserResource is published
attachment?: unknown; // AttachmentResource exists, but is #[TsExclude]d
```

> [!NOTE]
> This gate applies to the naming-convention guess only. A resource you named explicitly — as a class argument, via `#[UseResource]`/`#[UseResourceCollection]`, or through a collection's `#[Collects]`/`$collects` — is a declaration rather than a guess and is always honored, even if this package doesn't publish it. Previously a guessed-but-unpublished resource produced an import of a file that did not exist, which surfaced as a `TS2307 Cannot find module` in the consuming app.

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

| Method                            | Optionality    | Description                              |
| --------------------------------- | -------------- | ---------------------------------------- |
| `$this->merge([...])`             | Required       | Properties are always present            |
| `$this->mergeWhen(cond, [...])`   | Optional (`?`) | Properties included conditionally        |
| `$this->mergeUnless(cond, [...])` | Optional (`?`) | Properties included when `cond` is false |

### Closure & Arrow Function Values

The analyzer resolves closures and arrow functions used as value arguments. Simple closures that return a single expression are analyzed recursively:

```php
// Arrow function — return expression analyzed directly
'status' => $this->when(true, fn () => $this->status),

// Arrow function returning a nested resource
'user' => $this->when(true, fn () => UserResource::make($this->user)),

// Full closure — every return statement is analyzed, and their types are unioned
'notes' => $this->when(true, function () {
    return $this->notes;
}),
```

This works anywhere a value expression is expected — including `when`, `whenLoaded`, `whenNotNull`, `merge`, and `mergeWhen`.

### Collection Pipelines

A chain of collection operations keeps its element type to the end, whether it's rooted at a relation or at `collect()`:

```php
return [
    'comment_ids' => $this->comments->map(fn ($comment) => $comment->id)->values()->all(),
    'title_words' => collect(explode(' ', $this->title))->map(fn ($word) => ['word' => $word])->values()->all(),
    'author_name' => data_get($this->author, 'name'),
    'author_name_or_guest' => data_get($this->author, 'name', 'guest'),
    'doubled' => $this->comments->concat($this->comments)->values(),
];
```

```typescript
export interface CollectionPipelineResource {
  comment_ids: number[];
  title_words: { word: string }[];
  author_name: string | null;
  author_name_or_guest: string | null;
  doubled: Comment[];
  // …
}
```

- A trailing `->all()` is identity on the published type, since a `Collection<X>` and the `array<X>` behind it both render `X[]`, and `->values()` restores sequential keys. An op that breaks `0..n-1` keys (`filter`, `sortBy`, `keyBy`, …) adds the `Record<string, X>` arm that `json_encode()` really emits.
- A `collect()` root takes its element type from its argument and binds the `map()` parameter to that value, which is why `$word` above is `string`.
- `data_get($target, 'a.b')` is the nullsafe chain `$target?->a?->b`. A default unions its own type in rather than removing the `null` arm, because `data_get()` returns the default only when the key is **missing**, never when a present value is null.
- A `map()` closure parameter's model type hint binds for every read through it, multi-step and nullsafe chains included, when `map()` is called on a variable, such as a local or a `whenLoaded()` closure's parameter. With `$rows = $this->resource->getRelation('comments')`, `$rows->map(fn (Comment $comment) => $comment->user?->name ?: null)->all()` publishes `(string | null)[]`. A relation chain (`$this->comments->map(...)`) binds the relation's own element model to the same effect. A `collect(...)` root, or a `map()` called straight on a method's result (`$this->resource->getRelation('comments')->map(...)`), binds no model, so a read through the parameter there is `unknown`.

The limit: `concat($source)` is identity **only** when `$source` resolves to exactly the receiver's own collection type. Anything else declines the whole chain, since a concat of `Comment[]` and `Tag[]` is a different collection rather than a longer one. A `data_get()` key containing a `*` segment declines too.

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

Writing the spread out by hand remains the idiomatic form, and both spellings — `...parent::toArray($request)` inside an array literal, and a bare `return parent::toArray($request);` — are fully supported. A child that declares **no** `toArray()` at all now inherits the parent's as well; see [Inheriting a Parent `toArray()`](#inheriting-a-parent-toarray).

### Inheriting a Parent `toArray()`

A resource that extends another resource and declares no `toArray()` of its own inherits the parent's shape:

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

// No toArray(), no @mixin — both are inherited from OrderResource
class BodylessOrderResource extends OrderResource {}
```

```typescript
export interface BodylessOrderResource {
  id: number;
  status: AsEnum<typeof OrderStatus>;
}
```

The lookup walks up the parent chain and stops at the nearest ancestor that actually declares a `toArray()` body, so multi-level inheritance works too. The backing model is inherited alongside it — a resource with no `@mixin`/`@extends` of its own falls back to the nearest ancestor that has one (step 3 of [How the Backing Model Is Resolved](#how-the-backing-model-is-resolved)). Without that, the inherited shape would resolve no model and every column would degrade to `unknown`.

If **no** class in the chain declares a `toArray()`, nothing changes: the resource still falls back to [JsonResource Base Delegation](#jsonresource-base-delegation), or to `#[TsExtends]`-only output when no model resolves either. Body-less `ResourceCollection` subclasses are likewise unaffected and still resolve their element type through `$collects` or the naming convention.

> [!NOTE]
> Previously, a child resource with no `toArray()` of its own produced an empty interface whenever no model could be resolved for it either. If you added a pass-through `toArray()` purely to work around that, you can now delete it.

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

### Return Branches and `@return` Shapes

Every `return` in a spread method counts, not only the first. A guard branch returning `[]` really does omit its keys, so the keys the other branches publish become optional — and the method's own `@return` types what its body could not:

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

    /** Deliberately untyped so only the docblocks above can type what it returns. */
    protected function opaque()
    {
        return $this->resource->getAttribute('title');
    }
}
```

```typescript
export interface PermissionsSpreadResource {
  permissions?: Record<string, boolean>;
  links?: { self: string; related: Record<string, { name: string }> };
  main_label: string;
  extra_label?: string;
  // …
}
```

Both `@return` forms are read: an `array{…}` shape per key, and an `array<string, V>` value type applied to every key the body left `unknown`. A key the shape spells `key?:` marks the property optional as well.

The limit: **the body always wins.** The docblock only ever fills a property the analyzer left `unknown`, or an [interpolated key's](#interpolated-keys) index signature it left `unknown | undefined`, so a stale `@return` can't overwrite a resolved type. A shape value naming a class is skipped, since the map is string-only and can't carry that import.

### Interpolated Keys

A key built from literal text around a variable can't become a fixed property name, because the runtime key varies per iteration. Both the interpolated and the concatenated spelling publish a template-literal index signature — these are the remaining members of the same `PermissionsSpreadResource` above:

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

```typescript
export interface PermissionsSpreadResource {
  primary_label: string;
  [key: `${string}_label`]: string | undefined;
  [key: `${string}_region`]: string | undefined;
  // …
}
```

The value type carries `| undefined` rather than the signature carrying a `?`, since `[key: T]?:` is a TypeScript syntax error and a key matching the pattern isn't guaranteed present.

When the body can't type the value, the method's `@return array<string, V>` does, as it does for a named key. A third method on the same resource, `gatherOpaqueTags()`, is declared `@return array<string, string>` and assigns `$data["{$name}_tag"] = $this->opaque()`:

```typescript
[key: `${string}_tag`]: string | undefined;
```

TypeScript checks a signature against every named key its pattern matches, and against any signature whose pattern contains its own, so the generator reconciles each signature with the keys that will be published beside it, `#[TsCasts]` keys included. A named key the pattern matches joins the signature's value as a union, and so does another signature with the same pattern: beside `price_tag: number`, the `_tag` signature publishes `string | number | undefined`. A value the docblock filled, or a union, goes back to the value the body gives it (`unknown | undefined` where only the docblock typed it) when:

- a key the pattern matches, or one of the signature's own entries, can't join, because its type has a top-level `unknown` arm, names a class or any type name other than a primitive, `Record` or `Date`, is a template literal type, or holds a string literal with a backslash, or because it carries a class import (a `#[TsCasts]` key's doesn't count);
- another signature's pattern may overlap its own, which a plain `[key: string]` or `[key: number]` signature always counts as;
- the interface has an extends clause, from `#[TsExtends]` or a `ts_extends` config entry, whose keys the generator can't see.

The limit: a purely dynamic key (`$data[$name]`) or a purely literal one is left to the ordinary handling — the shape needs both a literal and a dynamic segment. A literal segment containing a backtick declines the whole key, since an escaped backtick couldn't be read back. A value the body typed itself stands even beside a key it can't take in, beside an overlapping pattern, or under an extends clause, so ``[key: `${string}_tag`]: string | undefined`` beside `main_tag: PostResource` still fails `tsc` with TS2411, and a pattern contained in another's can fail TS2413 — type the key, or rename it out of the pattern.

### Model `toArray()` Spread

Spreading a **model's** own `toArray()` inside an array literal — alongside the literal's other keys — intersects the model's generated interface with those keys instead of collapsing to `unknown[]`:

```php
'members' => $this->whenLoaded('members', fn ($members) => $members->map(
    fn (User $member) => [...$member->toArray(), 'flag' => true]
)),
```

```typescript
members?: (Omit<User, "flag"> & { flag: boolean })[];
```

The `Omit<>` is not cosmetic. PHP lets the later assignment win, so `'flag'` overwrites anything the spread contributed; TypeScript's `&` would instead intersect both and collapse a conflicting key to `never`. Subtracting the overridden keys from the earlier arm is what makes the emitted type mean what the PHP means. Several spreads in one literal are each `Omit<>`'d against every key a later arm or an explicit sibling key will overwrite, in source order.

> [!NOTE]
> The arm emits a **reference** to the `{Model}` interface rather than a re-derived shape, which is the honest floor rather than an exact match for `toArray()`'s runtime output. `Model::toArray()` is `attributesToArray()` merged with `relationsToArray()`, and bare `{Model}` covers only the first of those two — so two gaps, one in each direction:
>
> - **Relations are missing.** A relation loaded on the model before the spread is in the JSON payload but not in the type. That isn't knowable statically, and under the [`model-split` template](./models.md#model-templates) relations live in `{Model}Relations`, which the arm doesn't reference.
> - **`$hidden` columns are extra.** They're stripped at runtime but remain in `{Model}` unless [`models.exclude_hidden`](./models.md#what-gets-published-hidden-attributes-write-only-accessors) is enabled.
>
> `$appends` are **not** a gap: an appended accessor is part of `attributesToArray()` at runtime and is generated into bare `{Model}` alongside the columns, so the two agree. (`{Model}Mutators` holds the accessors a model did _not_ append.)
>
> Spreading a **resource** (`...UserResource::make($m)->resolve($request)`) works the same way and has neither gap, since the resource interface is the response shape.

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

The chain can pass through a trait and parent-declared methods the same way a `...$this->method()` spread does — see [Trait Method Spread](#trait-method-spread) above.

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

Both methods delegate to the backing model's full database schema and filter by the listed keys. Properties retain their original types from the model, and `only()` also keeps a named key the model types outside its schema, such as a `withCount()` virtual (`comments_count: number`). A model that declares its own typed `only()`/`except()` publishes that method's return instead, on its own resource or behind a relation — the model itself for `: static`.

`$this->resource->only([...])` and `$this->resource->except([...])` are the same calls, so they publish exactly what `$this->only([...])` and `$this->except([...])` do, spread or not. The same holds for every relation filter below: `$this->resource->author->only([...])` publishes what `$this->author->only([...])` does.

> [!NOTE]
> Currently only `only` and `except` are supported as attribute filter methods. Other collection-style methods are not analyzed. If you find you need additional methods, open an issue, or better yet, submit a PR with the added functionality! See [`FiltersModelAttributes`](https://github.com/abetwothree/laravel-ts-publish/blob/main/src/Analyzers/Concerns/FiltersModelAttributes.php).

### Relation Filters

The same two methods work on a **related** model — `$this->author->only([...])`, `$this->post?->except([...])` — and are typed one of two ways. A to-many relation and a collection-holding member filter differently — see [To-Many Relations and Collection Members](#to-many-relations-and-collection-members).

Two conditions have to hold for that reference form, not one: the relation must resolve to a **single** model, _and_ every filtered key must be a real database column. When both hold, the property references the related model's own generated interface with `Pick<>` — `only()` picks the keys you named, `except()` picks their **complement**, every other column on the model:

```php
'author' => $this->author->only(['id', 'name']),
'post' => $this->post?->except(['created_at', 'updated_at']),
```

```typescript
author: Pick<User, "id" | "name">;
post: Pick<Post, "id" | "title" | "content" | "user_id"> | null;
```

That is the preferred shape: it keeps the model's own `#[TsCasts]` and `@property` refinements authoritative instead of re-deriving them into a detached inline object. Both branches emit `Pick<>`, never `Omit<>` — naming the surviving columns instead of the excluded ones keeps the reference accurate regardless of how many other members (mutators, relations, counts) the model's generated interface happens to carry beyond its columns.

> [!TIP]
> `except()`'s complement is always your model's columns minus the named keys — so this reference form is exactly as wide as `only()` naming every other column by hand, and no wider. If your model gains a column, an existing `except([...])` picks it up automatically; nothing needs regenerating by hand.

When the reference can't be used — a filter key that isn't a column, or an accessor typed as a union of two or more models — the shape is expanded inline instead, and the two methods deliberately produce **different** property sets:

- **`only([...])`** expands exactly the keys you named. `HasAttributes::only()` calls `getAttribute()` per key, which resolves accessors and relations alike, so naming either one works: `$this->author->only(['name', 'initials', 'posts'])` emits `{ name: string; initials: string; posts: Post[] }`.
- **`except([...])`** expands the related model's **database columns** minus the named keys — never an accessor, never a relation. `HasAttributes::except()` iterates `getAttributes()`, which holds stored column values only; a get-only `Attribute` accessor is never merged back into it, and relations live in a separate bag entirely.

An accessor that union-types two or more models — `@return Attribute<Image|User|null, never>` — never reaches the reference form at all, so every arm is expanded inline even when every key you named is a real column.

> [!NOTE]
> The split mirrors Eloquent rather than inventing a rule. `HasAttributes::except()` iterates `getAttributes()`, the raw stored-attribute bag, and reads `getAttribute()` only for keys already in it, so a get-only `Attribute` accessor is never merged back in and relations live in a separate bag entirely. `HasAttributes::only()` iterates the names _you_ passed and calls `getAttribute()` on each, which does resolve accessors and relations. Typing the two the same way would promise members the JSON payload never carries.

So for `'author' => $this->author?->except(['id', 'name'])`, where `User` declares the accessors
`initials`/`is_premium` and the relations `profile`/`posts`, the emitted type is columns only:

```typescript
author: { email: string; phone: string | null } | null;
```

Naming a relation or an accessor in the exclusion list is a no-op, since that key was never in the
set being subtracted from. Reach for `only([...])` when you want one, or give it its own entry in
`toArray()`.

::: details Upgrading from an earlier version
`except()`'s reference form used to name the excluded keys with `Omit<>` — `Omit<Post, "created_at" | "updated_at">` — rather than picking the survivors. That was accurate under the default model template, but re-widened under a template where the model's bare interface carries mutators, relations, counts, and exists alongside its columns, since `Omit<>` only ever subtracts from whatever `keyof Model` happens to be:

```typescript
// Before: Omit<> — width depends on the model template
post: Omit<Post, "created_at" | "updated_at"> | null;

// After: Pick<> of the complement — the same columns regardless of template
post: Pick<Post, "id" | "title" | "content" | "user_id"> | null;
```

No action needed — the two forms carry the same columns under the default template, and the picked
member list is now visible directly in the type instead of needing to be worked out from what the
model interface excludes.
:::

::: details Upgrading from an earlier version
`except()` used to expand to every attribute **and** every relation on the related model, minus the
excluded keys, which is a shape `Model::except()` never returns at runtime. Accessors and relations
that appeared in an `except()`-filtered type are gone:

```typescript
// Before: every attribute and every relation, minus the named keys
author: {
  email: string;
  phone: string | null;
  initials: string; // accessor
  is_premium: boolean; // accessor
  profile: Profile | null; // relation
  posts: Post[]; // relation
} | null;

// After: database columns only
author: { email: string; phone: string | null } | null;
```

If you relied on one of those arriving through an `except()`-filtered relation, name it explicitly.
Switch the property to `only([...])`, or add the key as its own entry in `toArray()`. TypeScript
will point at every site that reads a now-missing key.
:::

#### To-Many Relations and Collection Members

A **to-many** relation's filter selects models, not attributes. `Eloquent\Collection::only()` and `except()` keep the models whose **primary key** is listed and return them whole, so the property publishes the relation's own type, whatever the key list holds:

```php
'replies' => $this->comments->only([1, 2]),
'kept' => $this->comments?->except($request->input('ids')),
```

```typescript
replies: Comment[];
kept: Comment[] | null;
```

An accessor returning an `Eloquent\Collection` of models filters the same way and publishes a list of those models.

A member holding an `Illuminate\Support\Collection` — a `'collection'`, `'encrypted:collection'`, `AsCollection` or `AsEncryptedCollection` column, or an accessor, cast getter or method returning a `Collection` — selects entries by **key** (`only()` keeps the listed keys, `except()` drops them), so its filter publishes `Record<string, unknown>` whatever the collection holds. Three members stay `unknown`: an `AsEnumCollection` column, a collection-cast column read through a receiver other than `$this` or `$this->resource`, such as a relation (`$this->relation->column->only([...])`) or a local variable holding the model, and any member other than the accessor above whose collection class overrides `only()`/`except()`, such as a method returning an `Eloquent\Collection`.

A single relation's filter with a runtime key list, `$this->author->only($request->input('fields'))`, names nothing to pick, so it publishes `Record<string, unknown>`.

#### Attribute Filters on Any Model

`only([...])` and `except([...])` type against **any** receiver holding a model, not only a relation. A bare `$this->only([...])` the resource forwards to its backing model, a `whenLoaded` closure parameter's `$category->only([...])`, and a local variable holding a model all build the same answer:

```php
return [
    ...$this->only(['id', 'comments_count']),
    'summary' => $this->when(true, fn () => $this->only(['id', 'title'])),
    'category' => $this->whenLoaded('categoryRel', fn ($category) => $category->only(['id', 'name'])),
    'dynamic' => $this->only($request->input('fields')),
];
```

```typescript
export interface OnlyValueResource {
  id: number;
  comments_count: number;
  summary?: Pick<Post, 'id' | 'title'>;
  category?: Pick<Category, 'id' | 'name'>;
  dynamic: Record<string, unknown>;
  // …
}
```

The limit: the `Pick<>` reference needs a **literal** key list to read. `$this->only($request->input('fields'))` carries none, so it keeps the vague `Record<string, unknown>` instead of guessing a member list.

### `exclude_hidden` and attribute filters

`ts-publish.models.exclude_hidden` (see [Models § What gets published](./models.md#what-gets-published-hidden-attributes-write-only-accessors)) governs resources too, not just the model's own interface:

```php
$this->only(['password'])   // kept: you named it
$this->except(['id'])       // password dropped: the set is derived
```

That split isn't arbitrary — it mirrors what `Model::only()` versus `toArray()`/`except()` already do at runtime. `Model::only()` resolves each key through `getAttribute()`, which returns a `$hidden` attribute regardless of visibility; `toArray()` and `Model::except()` both go through `getArrayableItems()`, which strips `$hidden` attributes before your excluded keys are even considered. This package's analyzer follows the same split:

| Pattern                                                                                 | Property set                               | A `$hidden` column, with `exclude_hidden` enabled |
| --------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| `'password' => $this->password`                                                         | the property you wrote by hand             | **kept** — you named it                           |
| `$this->only(['id', 'password'])`                                                       | exactly the keys you named                 | **kept** — you named it                           |
| `$this->relation->only(['id', 'password'])`                                             | exactly the keys you named                 | **kept** — you named it                           |
| `$this->whenHas('password')`                                                            | the attribute you named                    | **kept** — you named it                           |
| `$this->except(['id'])`                                                                 | every model attribute minus the named keys | **dropped** — the set is derived                  |
| `$this->relation->except(['id'])`                                                       | every database column minus the named keys | **dropped** — the set is derived                  |
| `parent::toArray($request)`, `[...parent::toArray($request)]`, or no `toArray()` at all | every model attribute                      | **dropped** — the set is derived                  |

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
  has_admin: boolean;
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

#### Key-Preserving Collections

A `ResourceCollection` normally serializes as a JSON array, so the generated type is `R[]`. Laravel
supports opting a collection out of that and keeping its original keys instead, which makes the
payload a JSON object — two ways to opt in, both recognized:

```php
use Illuminate\Http\Resources\Attributes\PreserveKeys;
use Illuminate\Http\Resources\Json\ResourceCollection;

#[PreserveKeys] // Laravel 13+
class TeamCollection extends ResourceCollection
{
    public $collects = TeamResource::class;
}
```

```php
use Illuminate\Http\Resources\Json\ResourceCollection;

class TeamCollection extends ResourceCollection
{
    public $preserveKeys = true; // works on every supported Laravel version

    public $collects = TeamResource::class;
}
```

Either form generates:

```typescript
export interface TeamCollection {
  data: Record<string, TeamResource>;
}
```

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

### Classes Sharing a Name Across Namespaces

When two classes in different namespaces share a class name — `App\Models\User` and `Crm\Models\User` — the generated file imports both under distinct aliases, and each occurrence of the name inside a property's type resolves to its own alias, in source order:

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

> [!NOTE]
> Previously, a property naming the same class name more times than it had **distinct** classes could alias an arm to the wrong class, or leave the final occurrence as a bare `User` that matched no import — a `TS2304 Cannot find name`. Both are fixed; the interleaved case above (`Crm`, `App`, `Crm`) is the shape that pins it.

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

::: tip Before reaching for `#[TsCasts]`
Several shapes that used to need an override now resolve on their own. Check these first:

- A method call on an enum, Carbon, a model, or a service — or a property read on any of those, or on a value object — see [Method Return Types](#method-return-types).
- A value behind a local variable, a closure-local, or an `instanceof` guard — see [Local Variables and Narrowing](#local-variables-and-narrowing).
- A collection chain, `data_get()`, or `only([...])` on any model receiver — see [Collection Pipelines](#collection-pipelines) and [Attribute Filters on Any Model](#attribute-filters-on-any-model).
- A key only some branches return, or one a spread method's `@return` describes — see [Return Branches and `@return` Shapes](#return-branches-and-return-shapes).

`#[TsCasts]` is still the right tool when the type is owned by the frontend and needs its own import, or when a shape is genuinely dynamic.
:::

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
