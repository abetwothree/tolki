# Models

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) converts Eloquent models into TypeScript interfaces for their columns, mutators, and relations — resolved via a reflection + database-schema waterfall so the generated types stay accurate without you hand-maintaining them.

As mentioned in [Installation & Usage](./index.md), models don't need the `@tolki/ts` runtime package at all (unlike [enums](./enums.md) and [routes](./routing.md)) — the output is plain TypeScript interfaces, with one exception: enum-typed columns optionally use the `AsEnum<>` type from `@tolki/types` (see [Enum-Typed Columns](#enum-typed-columns-modelresource)).

## How Models Are Generated

- One `.ts` file is generated per model, at a modular, namespace-derived path (e.g. `App\Models\User` → `app/models/user.ts`).
- Barrel `index.ts` files re-export everything (`export * from './user'`) per namespace directory, the same as [enums](./enums.md#how-enums-are-generated).
- Optionally, a runtime companion `{model}_meta.ts` is published beside the interface, exporting `{Model}ModelMetadata` (the morph class by default). It is a separate, opt-in phase — see [Model Metadata](./model-metadata.md).
- Each column's type is resolved through a waterfall: an explicit [`#[TsCasts]`](#tscasts) override first, then the model's cast (`casts()` method or `$casts` property, including a [`#[TsType]`](#tstype) on a custom cast class), then the raw database column type — see the [Type Mapping Reference](#type-mapping-reference) for the full default table.
- Mutators (new-style `Attribute` accessors and old-style `getXAttribute()` methods) and relations are inspected the same way, and split into their own interfaces by default — see [Model Templates](#model-templates).

## Anatomy of a Generated Model

```typescript
import { type AsEnum } from "@tolki/ts";

import { MembershipLevel, Role } from "../enums";
import type { DatabaseNotification } from "../../illuminate/notifications";
import type { MembershipLevelType, RoleType } from "../enums";
import type { Address, Comment, Image, Order, Post, Profile, Team } from ".";

/**
 * Application user account
 *
 * @see App\Models\User
 */
export interface User {
  id: number;
  /** User name formatted with first letter capitalized */
  name: string;
  email: string;
  email_verified_at: string | null;
  password: string;
  options: Record<string, unknown> | null;
  remember_token: string | null;
  created_at: string | null;
  updated_at: string | null;
  role: RoleType | null;
  membership_level: MembershipLevelType | null;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  settings: {
    theme: "light" | "dark";
    notifications: boolean;
    locale: string;
  } | null;
  last_login_at: string | null;
  last_login_ip: string | null;
}

export interface UserResource extends Omit<User, "role" | "membership_level"> {
  role: AsEnum<typeof Role> | null;
  membership_level: AsEnum<typeof MembershipLevel> | null;
}

export interface UserMutators {
  /** User initials (e.g. "JD" for "John Doe") */
  initials: string;
  /** Whether the user is a premium member */
  is_premium: boolean;
}

export interface UserRelations {
  // Relations
  profile: Profile | null;
  posts: Post[];
  comments: Comment[];
  orders: Order[];
  addresses: Address[];
  teams: Team[];
  owned_teams: Team[];
  /** Polymorphic images (avatar gallery, etc.) */
  images: Image[];
  /** Get the entity's notifications. */
  notifications: DatabaseNotification[];
  // Counts
  profile_count: number;
  posts_count: number;
  // ...one `_count` per relation
  // Exists
  profile_exists: boolean;
  posts_exists: boolean;
  // ...one `_exists` per relation
}

export interface UserAll extends User, UserMutators, UserRelations {}

export interface UserAllResource
  extends UserResource, UserMutators, UserRelations {}
```

- `User` holds the raw columns — enum columns (`role`, `membership_level`) are typed with the plain `{Enum}Type` union, matching how Eloquent serializes a `BackedEnum` to JSON.
- `UserResource` is the enum-_resolved_ variant — see [Enum-Typed Columns](#enum-typed-columns-modelresource).
- `settings` shows an inline object type — the result of a [`#[TsCasts]`](#tscasts) override.
- `UserMutators` holds accessor-based properties (new-style `Attribute` or old-style `getXAttribute()`), each with its PHPDoc description carried over as a JSDoc comment — see [PHPDoc Descriptions](#phpdoc-descriptions).
- `UserRelations` includes every relation plus a generated `_count` and `_exists` property per relation (mirroring Laravel's [`withCount`](https://laravel.com/docs/eloquent-relationships#counting-related-models) / `withExists`) — including polymorphic relations and framework-provided ones (`notifications`, imported from a generated `illuminate/notifications` namespace).
- `UserAll` / `UserAllResource` are convenience interfaces combining all three — only generated when there's more than one non-empty interface to combine.

## Model Templates

By default, a model is split into up to four interfaces (`{Model}`, `{Model}Mutators`, `{Model}Relations`, `{Model}All`) so a given page only needs to import what it actually uses. Switch to a single combined interface with the `model-full` template:

| Template                          | Description                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `laravel-ts-publish::model-split` | **(Default)** Separate interfaces for properties, mutators, and relations, plus an `All` interface combining them.                     |
| `laravel-ts-publish::model-full`  | Combines properties, mutators, and relations into one interface (grouped with `// Columns` / `// Mutators` / `// Relations` comments). |

```php
// config/ts-publish.php
'models' => [
    'template' => 'laravel-ts-publish::model-full',
],
```

::: tip
Any mutator listed in the model's `$appends` array is always included in the properties interface (even in the split template), since Laravel always includes appended attributes when serializing a model to JSON.
:::

Publish the views (`php artisan vendor:publish --tag="laravel-ts-publish-views"`) if you want to customize either template's structure, then point `models.template` at your published/custom view.

### Choosing between interfaces in a form

The split template lets you compose only the pieces a page needs. For example, an Inertia form that needs the full `User` shape plus just one relation flag:

```typescript
import { useForm } from "@inertiajs/vue3";
import type { User, UserRelations } from "@js/types/data/models";

interface UserForm extends User, Pick<UserRelations, "profile_exists"> {
  profile: UserRelations["profile"] | null;
}

const form = useForm<UserForm>({ ...user });
form.profile; // Profile | null
form.posts; // TS error — `posts` isn't part of UserForm
```

With `model-full`, the equivalent requires `Omit`-ing every relation property you don't need instead of only picking what you want:

```typescript
import type { User } from "@js/types/data/models";

interface UserForm extends Omit<
  User,
  | "admin"
  | "profile"
  | "posts"
  | "profile_count"
  | "posts_count"
  | "posts_exists"
> {
  profile: User["profile"] | null;
}
```

Additionally, when using the `model-full` template, since all relations are included, it creates deeply dependent types where errors in a relation 2, 3 or more levels deep can propagate and cause TypeScript to raise errors. It can be good way to make sure all your models have proper TypeScript types for forms and other contexts where you only need a subset of the model's relations, but it can be a bit annoying to track down and fix.

## Nullable Relations

Singular relations are automatically typed with `| null` based on the relation type and, where relevant, whether the underlying foreign key column is nullable:

| Relation Type                                          | Strategy   | Behavior                                                                 |
| ------------------------------------------------------ | ---------- | ------------------------------------------------------------------------ |
| `HasOne`                                               | `nullable` | Always add `null` — the related record may not exist.                    |
| `MorphOne`                                             | `nullable` | Always add `null`.                                                       |
| `HasOneThrough`                                        | `nullable` | Always add `null`.                                                       |
| `BelongsTo`                                            | `fk`       | Add `null` only when the foreign key column is nullable in the database. |
| `MorphTo`                                              | `morph`    | Add `null` when either the morph type or morph id column is nullable.    |
| `HasMany`, `BelongsToMany`, `MorphMany`, `MorphToMany` | `never`    | Never nullable (returns an empty array, not null).                       |

```typescript
export interface UserRelations {
  profile: Profile | null; // HasOne — always nullable
  posts: Post[]; // HasMany — never nullable
}

export interface PostRelations {
  author: User; // BelongsTo — user_id is NOT NULL
  category_rel: Category | null; // BelongsTo — category_id is nullable
}
```

### Disabling or overriding the strategy

```php
// config/ts-publish.php
'models' => [
    'nullable_relations' => false, // keep all singular relations non-nullable
],
```

Override the strategy per relation type (including custom third-party relation classes) via `models.relation_nullability_map` — keys are FQCNs, values are `'nullable'`, `'never'`, `'fk'`, or `'morph'`:

```php
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use SomePackage\Relations\BelongsToTenant;

'models' => [
    'relation_nullability_map' => [
        BelongsTo::class => 'nullable', // make all BelongsTo always nullable
        HasOne::class => 'never',       // make HasOne never nullable
        BelongsToTenant::class => 'fk', // custom relation type, checked like BelongsTo
    ],
],
```

See `AbeTwoThree\LaravelTsPublish\RelationMap` for the full default map.

## Model Attributes

All attributes live under the `AbeTwoThree\LaravelTsPublish\Attributes` namespace.

| Attribute      | Target                                              | Description                                                        |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| `#[TsCasts]`   | `casts()` method, `$casts` property, or model class | Override/add TypeScript types for columns, mutators, or relations. |
| `#[TsType]`    | Custom cast class                                   | Set the TypeScript type used wherever this cast class is applied.  |
| `#[TsExclude]` | Model class, accessor method, or relation method    | Exclude an entire model, or a specific accessor/relation.          |

### `#[TsCasts]`

Takes an array mapping property names to either a raw TypeScript type string, or `['type' => ..., 'import' => ...]` for a type that needs importing from your own files:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

class User extends Model
{
    #[TsCasts([
        'metadata' => '{label: string, value: string}[]',
        'settings' => 'Record<string, unknown>',
        'dimensions' => ['type' => 'ProductDimensions', 'import' => '@js/types/product'],
    ])]
    public function casts(): array
    {
        return [
            'metadata' => 'array',
            'settings' => 'array',
            'dimensions' => 'array',
        ];
    }
}
```

```typescript
import { ProductDimensions } from "@js/types/product";

export interface User {
  metadata: { label: string; value: string }[];
  settings: Record<string, unknown>;
  dimensions: ProductDimensions;
}
```

`#[TsCasts]` can be placed on the `casts()` method, the `$casts` property, or the model class itself — all three accept the same array shape.

::: tip
Prefer placing `#[TsCasts]` on `casts()` / `$casts` so the TypeScript override sits next to the actual PHP cast. Since it can also override mutator and relation types, place it on the class itself when you need to override those instead.

However, when extending models from the `vendor` directory, it can be useful to place `#[TsCasts]` on the class itself to override types for relations or mutators without modifying the original vendor cast definitions.
:::

### `#[TsType]`

For a **custom cast class** used across multiple models/properties, put `#[TsType]` on the cast class once instead of repeating `#[TsCasts]` everywhere it's used:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsType;

#[TsType(['type' => 'ProductDimensions', 'import' => '@js/types/product'])]
class ProductDimensionsCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes) { /* ... */ }
}

class Product extends Model
{
    public function casts(): array
    {
        return ['dimensions' => ProductDimensionsCast::class];
    }
}
```

```typescript
import { ProductDimensions } from "@js/types/product";

export interface Product {
  dimensions: ProductDimensions;
}
```

`#[TsType]` also accepts a plain string (`#[TsType('{width: number, height: number}')]`) when the type doesn't need an import.

## Laravel 13 Model Attributes

Laravel 13 shipped a set of native class attributes across Eloquent models (`Illuminate\Database\Eloquent\Attributes`) and API resources (`Illuminate\Http\Resources\Attributes`) that replace older property-based conventions (`#[Table]` instead of `protected $table`, and so on). These are **not** attributes from this package — no `use AbeTwoThree\LaravelTsPublish\Attributes\...` needed — and most of them are honored automatically, with no configuration and no code change on your end, because Laravel resolves them into the model's ordinary instance state before this package ever reads the model:

| Attribute                                                                                                                                                                                                                                                                                          | Honored? | Notes                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `#[Table('...')]`                                                                                                                                                                                                                                                                                  | Yes      | Changes which table columns are read from, same as `protected $table`.                                                                                                                                                                                             |
| `#[Hidden(['col'])]`                                                                                                                                                                                                                                                                               | Yes      | Feeds the same `hidden` flag `protected $hidden` does — see [What gets published: hidden attributes](#what-gets-published-hidden-attributes-write-only-accessors).                                                                                                 |
| `#[Visible(['col'])]`                                                                                                                                                                                                                                                                              | Yes      | An **allowlist** — every column _not_ listed becomes hidden, same as `protected $visible`. List every column meant to stay published, or most of the model will disappear from the generated interface.                                                            |
| `#[Appends(['accessor'])]`                                                                                                                                                                                                                                                                         | Yes      | Adds accessors to the published set, same as `protected $appends`.                                                                                                                                                                                                 |
| `#[Connection('name')]`                                                                                                                                                                                                                                                                            | Yes      | Selects which database connection's schema the columns are read from, same as `protected $connection`.                                                                                                                                                             |
| `#[Collects(SomeResource::class)]`                                                                                                                                                                                                                                                                 | Yes      | Which resource a collection collects — see [API Resources](./api-resources.md).                                                                                                                                                                                    |
| `#[UseResource(...)]` / `#[UseResourceCollection(...)]`                                                                                                                                                                                                                                            | Yes      | Associates a model with its resource — see [API Resources](./api-resources.md). Available since Laravel 12.29, not just 13.                                                                                                                                        |
| `#[PreserveKeys]`                                                                                                                                                                                                                                                                                  | Not yet  | Would make a resource collection emit a keyed object instead of an array. No effect on generated output currently.                                                                                                                                                 |
| `#[RouteKey('slug')]`                                                                                                                                                                                                                                                                              | Yes      | A model-bound route argument now generates `_routeKey` from the attribute's key even when the model carries only `#[RouteKey]` and overrides none of `getRouteKeyName()`/`getKeyName()`/`$primaryKey` — see [Routing § Model Binding](./routing.md#model-binding). |
| Everything else (`#[DateFormat]`, `#[WithoutTimestamps]`, `#[WithoutIncrementing]`, `#[Fillable]`, `#[Guarded]`, `#[Unguarded]`, `#[Scope]`, `#[ScopedBy]`, `#[ObservedBy]`, `#[Boot]`, `#[Initialize]`, `#[Touches]`, `#[CollectedBy]`, `#[UseEloquentBuilder]`, `#[UseFactory]`, `#[UsePolicy]`) | N/A      | These affect querying, events, mass assignment, or factories — not the serialized shape — so there's nothing for the TypeScript generator to do either way.                                                                                                        |

Most of these attribute classes (`#[Table]`, `#[Hidden]`, `#[Visible]`, `#[Appends]`, `#[Connection]`, `#[Collects]`, `#[PreserveKeys]`) require Laravel 13; `#[UseResource]`/`#[UseResourceCollection]` only require 12.29+. On an older floor, using one isn't a hard error — a `use` import of a nonexistent class doesn't fail until something actually resolves it, and nothing in this package or in Laravel itself does for a class-level attribute on a model that floor doesn't know about. The model loads and instantiates normally; the attribute is just silently ignored, which is a more dangerous failure mode than an error, since nothing tells you `#[Table]` didn't take effect. Stay on the version each attribute actually needs if you rely on it.

## Typing Attributes Without #[TsCasts]

### Typing `array` casts with `@property`

A column cast to `'array'` (or any other cast the accessor → cast → DB waterfall can't type more precisely) generates as `unknown[]`. Rather than reaching for `#[TsCasts]`, add a class-level `@property`/`@property-read` docblock tag naming the real shape — the same convention PHPStan/Larastan already read — and it wins wherever the resolved type would otherwise stay vague:

```php
/**
 * @property array<int, string>|null $to
 * @property array<string, string>|null $headers
 */
class Message extends Model { ... }
```

`$to` and `$headers` now generate as `string[] | null` and `Record<string, string> | null` instead of `unknown[] | null` — and it types the same property for PHPStan/Larastan too. The tag only takes effect when the waterfall's own result is vague, so it never overrides a type already resolved specifically (an accessor's return type, an enum cast, a custom `CastsAttributes` class, etc.), and a subclass's own tag wins over one declared on a parent.

A refinement that's still partly vague is accepted as long as it's more structured than a bare untyped array/collection/object — `@property array<string, mixed>|null $settings` refines a plain `'array'` cast to `Record<string, unknown> | null` even though `Record<string, unknown>` itself still names `unknown`, because it beats the `unknown[]` it replaces. A refinement that's exactly as vague as the original (`unknown`, `unknown[]`, `object`, or the `unknown[] | Record<string, unknown>` Collection fallback) is still rejected.

The `@property` walk also covers every **trait** used by the class or its parents (recursively), so a trait supplying an accessor can carry its own class-level tag — including the non-standard `@property string[] labels` form some packages use without the `$` sigil.

### Typing json columns with `@phpstan-type` aliases

For a shape complex enough to deserve a name, define it once as a `@phpstan-type` on the DTO that owns it, then pull it into the model with `@phpstan-import-type`:

```php
/** @phpstan-type PresetConfig array{filters?: array<string, mixed>, sorts?: list<string>} */
final readonly class PresetDto { ... }

/**
 * @phpstan-import-type PresetConfig from PresetDto
 * @property PresetConfig|null $config
 */
class Preset extends Model { ... }
```

`$config` generates as `{ filters?: Record<string, unknown>; sorts?: string[] } | null` — the alias expands inline (no import of `PresetDto` itself is emitted, since only its shape is used), optional keys keep their `?`, and PHPStan validates the same alias. `@phpstan-import-type ... as Alias` and `@psalm-type`/`@psalm-import-type` are both recognized, an alias may reference another imported alias, and a cyclical import degrades to `unknown` rather than hanging the publish run. This is the preferred path over `#[TsCasts]` for a shape that's already worth documenting for static analysis.

### Typing castable-with-arguments casts

Laravel's built-in `Castable` classes carry their configuration after a colon — `AsEnumCollection::of(DayOfWeek::class)` and `AsCollection::of(...)`/`::using(...)` all build a `"ClassName:arg1,arg2"` cast string. These are resolved without any extra config:

```php
protected function casts(): array
{
    return [
        'week_days' => AsEnumCollection::of(DayOfWeek::class),
        'grid_configs' => AsCollection::of(GridConfigDto::class),
    ];
}
```

- **`AsEnumCollection::of($enum)`** generates as the enum's TypeScript type suffixed `[]` — `DayOfWeekType[]` — with the enum's import wired exactly like a scalar enum-typed column.
- **`AsCollection::of($map)` / `::using($collection, $map)`** resolves the mapped class's element shape and appends `[]`. An `Arrayable` DTO with a documented `toArray()` shape inlines as an object array (`{ label: string; config: Record<string, unknown> }[]`); a mapped enum resolves the same way `AsEnumCollection` does. Without a resolvable map (or a bare `AsCollection`/`AsCollection::class`), it stays `unknown[]` — the same fallback as today.
- **Any other `Castable`/`CastsAttributes` class carrying arguments** — a custom cast, `AsEncryptedCollection`, etc. — resolves as if the arguments weren't there, i.e. exactly like the bare class.

::: tip
Before reaching for `#[TsCasts]`, prefer — in this order — a parameterized `Attribute<>`/`@return`/`@phpstan-return` docblock on an accessor (generics included, e.g. `Attribute<Collection<int, LineItem>, never>`), a class-level `@property`/`@property-read` tag (including a `@phpstan-type`/`@phpstan-import-type` alias, as above), or a `@return MorphTo<A|B, $this>` generic on a `morphTo()` relation. All of these are read by PHPStan/Larastan too, so they're checked by static analysis in a way a package-specific attribute isn't — and every one is honored by the generator with no extra configuration. See the [annotation checklist](#annotation-checklist) below for the full symptom-first list.

`#[TsCasts]` is still the right tool when a shape is genuinely dynamic (keys built at runtime) or the type is owned by the frontend and needs its own import.
:::

### Typing `morphTo` relations

A `morphTo()` relation's target union is normally inferred in reverse — by scanning every other model for a `morphOne`/`morphMany` pointing back at it — which can only ever find a union, never narrow one. A `@return MorphTo<A|B, $this>` docblock generic on the relation method overrides that scan and types the relation directly, PHPStan-checked, no `#[TsCasts]` needed:

```php
class Activity extends Model
{
    /** @return MorphTo<User, $this> */
    public function causer(): MorphTo
    {
        return $this->morphTo();
    }
}
```

`causer` generates as `User | null` even though no other model declares a reverse relation pointing at `Activity`. The second generic argument (`$this`, Laravel's own convention for the child) carries no target information and is ignored. A generic naming the base `Model` class (`MorphTo<Model, $this>`) isn't narrowing — it's the common, useless case (`@phpstan-return MorphTo<Model, $this>` is what Larastan itself expects when a relation's targets aren't known upfront) — so it falls through to the reverse scan exactly as if no generic were present, rather than emitting a `Model` token nothing can import. Two differently-named `morphTo` relations on the same model resolve independently either way, since both the docblock generic and the reverse scan are read per relation, not per model.

### DTO-typed accessors and casts

An `Arrayable` DTO whose `toArray()` carries no `@return array{...}` shape now infers its shape from its own typed public properties — promoted constructor properties included — instead of falling back to `unknown[]`:

```php
final readonly class OrderTypeCapabilities implements Arrayable
{
    public function __construct(
        public string $typeName,
        public bool $tracksSteelDetails,
        public ?string $warehouseDocsKey = null,
    ) {}

    /** @return array<string, bool|string|null> */
    public function toArray(): array
    {
        return (array) $this;
    }
}
```

generates as `{ typeName: string; tracksSteelDetails: boolean; warehouseDocsKey: string | null }`. Nullable properties keep their `| null`; private, protected, and static properties are excluded, since they aren't part of `(array) $this`; and a property typed as a class with no import channel (a Model, for example) degrades to `unknown` the same way an unimportable docblock shape value does. Reach for a `@return array{...}` docblock instead only when the properties alone don't tell the whole story — it still wins whenever present.

This is `Arrayable`-only. A `JsonSerializable` DTO's `jsonSerialize()` still only resolves from a `@return array{...}` docblock and otherwise falls through to later resolution steps (e.g. its class basename), rather than inferring from properties — `(array) $this` is a real contract tying `toArray()` to a DTO's own properties, but `jsonSerialize()` can return anything, so inferring its shape from properties could produce a confidently wrong type.

### What gets published: hidden attributes, write-only accessors

Not every attribute Eloquent knows about ends up in the generated interface:

- **`$hidden` attributes are published by default.** Setting `ts-publish.models.exclude_hidden` to `true` excludes them instead, matching Laravel's own `toArray()`/`toJson()` serialization — the rule that would then keep a `password` or `remember_token` column out of the model's own interface, and out of any resource property set that derives from the model implicitly (whole-model delegation, `except()` — see [API Resources § `exclude_hidden` and attribute filters](./api-resources.md#exclude-hidden-and-attribute-filters) for the full, deliberately asymmetric rule, since a resource's `only(['password'])` keeps a hidden column it named explicitly). The default is permissive (`false`, hidden attributes shown) so upgrading the package never silently drops a property a consuming app already relies on; opt in once you've confirmed the frontend doesn't need those columns. When the setting is enabled, an app that still needs a hidden column client-side should either drop it from `$hidden` or call `makeVisible()` before returning the model — the generator has no way to see a runtime `makeVisible()` call, so a hidden column drops from the model's own published interface regardless of any particular request.
- **Write-only mutators** — `Attribute::make(set: ...)` with no `get:` — resolve in this order: (1) the method's own `@return Attribute<Get, Set>` docblock, when the `Get` type is present and isn't itself vague; (2) a same-named database column, if one exists; (3) otherwise the mutator is omitted from the interface entirely, rather than emitted as `unknown`.

```php
class Order extends Model
{
    /** @return Attribute<?string, string> */
    protected function trackingCode(): Attribute
    {
        return Attribute::make(set: fn (string $value): string => strtoupper($value));
    }

    // No getter, no docblock generic, no backing column — omitted from OrderMutators entirely.
    protected function searchIndex(): Attribute
    {
        return Attribute::make(set: fn (string $value): string => strtolower($value));
    }
}
```

`trackingCode` generates as `tracking_code: string | null` in `OrderMutators`; `searchIndex` doesn't appear there at all. A write-only mutator backed by a real column (e.g. one that normalizes a value on save) resolves through the normal column waterfall instead, and is published as a column rather than a mutator.

### Annotation checklist

A symptom-first index of the annotations above (plus one from [API Resources](./api-resources.md) on the API Resources page) — none of these need `#[TsCasts]`, and every one is read by PHPStan/Larastan too, so the annotation that unlocks the TypeScript type is also checked by static analysis:

| Still generating `unknown`?                                                                                          | Add this                                                                                                                                                                | Unlocks                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Attribute<Collection, never>` / `Attribute<array, never>` resolving to `unknown[]`                                  | Parameterize the generic: `Attribute<Collection<int, LineItem>, never>` / `Attribute<array<int, string>, never>` (or `array{...}` for a fixed shape)                    | The real element type (`LineItem[]` / `string[]`), imported automatically                                                                                                                                     |
| A bare `'array'`/`'collection'` cast with no shape anywhere else                                                     | A class-level `@property`/`@property-read` tag, e.g. `@property array<string, mixed>\|null $settings`                                                                   | `Record<string, unknown> \| null` (or more specific, if the tag is) instead of `unknown[] \| null` — see [Typing `array` casts with `@property`](#typing-array-casts-with-property)                           |
| A JSON shape worth naming once and reusing                                                                           | `@phpstan-type Name array{...}` on the class that owns it, `@phpstan-import-type Name from ThatClass` + `@property Name $prop` on the model                             | A named, PHPStan-checked object shape expanded inline, no import of the DTO itself — see [Typing json columns with `@phpstan-type` aliases](#typing-json-columns-with-phpstan-type-aliases)                   |
| `AsEnumCollection`/`AsCollection` cast with no argument, resolving to `unknown[]`                                    | Pass the mapped class: `AsEnumCollection::of(Status::class)`, `AsCollection::of(LineItemDto::class)`                                                                    | The mapped element's real type (enum or DTO shape), suffixed `[]` — see [Typing castable-with-arguments casts](#typing-castable-with-arguments-casts)                                                         |
| `morphTo()` typed `unknown \| null` even though the app knows the possible targets                                   | `@return MorphTo<A\|B, $this>` on the relation method                                                                                                                   | The narrowed union, every member imported — see [Typing `morphTo` relations](#typing-morphto-relations)                                                                                                       |
| An `Arrayable` DTO accessor/cast generating `unknown[]`                                                              | Nothing extra — typed public properties (promoted constructor properties included) are read automatically once `toArray()` has no `@return array{...}` shape of its own | A property-derived object shape instead of `unknown[]` — see [DTO-typed accessors and casts](#dto-typed-accessors-and-casts)                                                                                  |
| `$this->relation->only([...])`/`->except([...])` losing the related model's own `#[TsCasts]`/`@property` refinements | Nothing extra — automatic whenever the relation resolves to a single model and every filtered key is a real database column                                             | `Pick<Model, 'a' \| 'b'>` referencing the model's own generated interface — `except()` picks the complement, every other column — see [API Resources § Relation Filters](./api-resources.md#relation-filters) |
| An accessor or relation missing from an inlined `$this->relation->except([...])`                                     | Name it explicitly — switch that key to `only([...])`, or give it its own entry in `toArray()`                                                                          | The key back. An inlined `except()` expands to database columns only, matching what `Model::except()` returns at runtime — see [API Resources § Relation Filters](./api-resources.md#relation-filters)        |

## PHPDoc Descriptions

Doc blocks are read automatically and converted to JSDoc comments:

| Location    | Source                                        | JSDoc Placement                          |
| ----------- | --------------------------------------------- | ---------------------------------------- |
| Model class | Doc block above the class                     | Above the `export interface` declaration |
| Columns     | Doc block above the column's accessor method  | Above the column property                |
| Mutators    | Doc block above the mutator's accessor method | Above the mutator property               |
| Relations   | Doc block above the relation method           | Above the relation property              |

For columns and mutators, the new-style accessor (`protected function name(): Attribute`) is checked before the old-style one (`public function getNameAttribute()`). `@`-prefixed lines (`@param`, `@return`, `@phpstan-type`, ...) are stripped — only the prose description carries over.

```php
/** Application user account */
class User extends Model
{
    /** User initials (e.g. "JD" for "John Doe") */
    protected function initials(): Attribute
    {
        return Attribute::make(get: fn (): string => /* ... */);
    }

    /** Polymorphic images (avatar gallery, etc.) */
    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }
}
```

## Timestamps as Date Objects

Timestamp columns (`date`, `datetime`, `timestamp`, and their immutable variants) map to `string` by default:

```php
// config/ts-publish.php
'timestamps_as_date' => true,
```

| Config Value      | Generated Type       |
| ----------------- | -------------------- |
| `false` (default) | `created_at: string` |
| `true`            | `created_at: Date`   |

## Custom TypeScript Type Mappings

The default PHP-to-TypeScript mapping is intentionally broad. Override or extend it with `custom_ts_mappings` (keys are matched case-insensitively):

```php
// config/ts-publish.php
'custom_ts_mappings' => [
    'binary' => 'Blob',
    'json' => 'Record<string, unknown>', // overrides the default 'object' mapping
    'money' => 'number',                  // adds a new mapping
],
```

::: tip
Custom mappings are merged with the built-in map and take precedence. For a _per-property_ override instead of a global one, use [`#[TsCasts]`](#tscasts) or [`#[TsType]`](#tstype) instead.
:::

::: warning A bare `tinyint` is now `number`
Only the display-width-1 form stays boolean. `tinyint(1)` is what Laravel's `boolean()` emits on
MySQL and SQLite, so genuine boolean columns are unaffected — but a column declared with
`tinyInteger()` was previously typed [`boolean`](#booleans) and is now [`number`](#numbers).

Previously, a sized native type never matched the map at all and fell through to a substring scan,
which matched `int` inside `tinyint(1)` before reaching `tinyint`. That is why some genuinely boolean
columns were also mistyped before this change.

**What to do:** anywhere you compared a `tinyInteger()` column with `===  true` or used it directly in
a conditional, compare against the number instead. TypeScript will point at every site.
:::

::: warning The `As*ArrayObject` casts gained an array arm
`AsArrayObject`, `AsEncryptedArrayObject` and `AsEnumArrayObject` now emit
[`unknown[] | Record<string, unknown>`](#arrays-objects) rather than `Record<string, unknown>` alone.

An `ArrayObject` hydrated from a list serializes as a JSON **array**, so the old type rejected a
payload the API genuinely returns.

**What to do:** narrow before treating the value as an object. `Object.keys(x.meta)` no longer
compiles on its own; guard with `Array.isArray(x.meta)` first, or use
[`#[TsCasts]`](#tscasts) to pin the property to whichever half your column actually produces.
:::

### Type Mapping Reference

<div class="collection-method-list" markdown="1">

[Numbers](#numbers) [Booleans](#booleans) [Strings](#strings) [Arrays &amp; Objects](#arrays-objects) [Dates &amp; Times](#dates-times) [Other](#other)

</div>

#### Numbers

`bigint`, `decimal`, `double`, `double precision`, `float`, `integer`, `int`, `numeric`, `number`, `mediumint`, `smallint`, `year`, `real`, `money`, `smallmoney`, `serial`, `bigserial`, `smallserial` → **`number`**

A bare `tinyint` (MySQL/SQL Server `tinyInteger()`) is also **`number`** — only the display-width-1 form (`tinyint(1)`, Laravel's `boolean()` column on MySQL/SQLite) means boolean; see [Booleans](#booleans).

#### Booleans

`bool`, `boolean`, `bit`, `tinyint(1)` → **`boolean`**

#### Strings

`char`, `character`, `enum`, `longtext`, `mediumtext`, `string`, `text`, `varchar`, `encrypted`, `uuid`, `guid`, `hashed`, `time`, `timetz`, `timestamptz`, `numeric-string` → **`string`**

Sized, binary, and legacy DB native types resolve the same way: `tinytext`, `binary`, `varbinary`, `blob`, `bytea`, `tinyblob`, `mediumblob`, `longblob`, `nvarchar`, `nchar`, `ntext`, `xml`, `interval`, `uniqueidentifier`, `datetimeoffset` → **`string`**. `set(…)` also resolves to `string`, not an array — MySQL returns a matched `SET` as a comma-joined string. So do Postgres/MySQL's network and full-text types: `inet`, `cidr`, `macaddr`, `macaddr8`, `tsvector`.

#### Arrays & Objects

| Cast                                                               | TypeScript Type                        |
| ------------------------------------------------------------------ | -------------------------------------- |
| `array`, `collection`, `iterable`                                  | `unknown[]`                            |
| `AsCollection`, `AsEncryptedCollection`, `AsEnumCollection` (bare) | `unknown[]`                            |
| `AsArrayObject`, `AsEncryptedArrayObject`, `AsEnumArrayObject`     | `unknown[] \| Record<string, unknown>` |
| `json`, `jsonb`, `object`                                          | `object`                               |
| `Illuminate\Database\Eloquent\Collection`                          | `Record<string, unknown>`              |
| `Illuminate\Support\Collection`                                    | `unknown[] \| Record<string, unknown>` |
| `Illuminate\Database\Eloquent\Casts\AsFluent`                      | `object`                               |

The three `As*ArrayObject` casts hydrate an `ArrayObject`, whose `jsonSerialize()` returns the underlying array verbatim — a list payload serializes as a JSON array, not an object, so the type admits both shapes rather than claiming `Record<string, unknown>` alone.

The `unknown[]` collection row above is the **bare** form. `AsEnumCollection::of(...)` and `AsCollection::of(...)` / `::using(...)` carry their mapped class in the cast string and resolve to that element's real type instead — see [Typing castable-with-arguments casts](#typing-castable-with-arguments-casts).

A parameterized docblock generic (`@return`, `@property`, `Attribute<>`) narrows further, based on its declared key type. The container and the key type are resolved independently, so every container behaves identically for a given key type:

| Key type             | Emitted                    | Containers                                            |
| -------------------- | -------------------------- | ----------------------------------------------------- |
| `int`, or omitted    | `X[]`                      | `list<X>`, `array<…>`, `iterable<…>`, `Collection<…>` |
| `string`             | `Record<string, X>`        | `array<…>`, `iterable<…>`, `Collection<…>`            |
| `array-key`, `mixed` | `X[] \| Record<string, X>` | `array<…>`, `iterable<…>`, `Collection<…>`            |

(`list<X>` has no key-type slot at all — a `list<X>` docblock generic always resolves to the first row, `X[]`.) A container with **no generic at all** — a bare `Collection`, unparameterized — doesn't reach this table: it resolves through the [Arrays & Objects](#arrays-objects) table above, via `TypeScriptMap`, not through the docblock generic resolver.

A collection _chain_ on a relation (`->sortBy()`, `->pluck($value, $key)`, `->take()`, …) is analyzed separately from its declared type: it keeps the `X[] | Record<string, X>` union unless the chain provably ends with sequential, 0-indexed keys — e.g. a trailing `->values()`, or `->take()` anchored at the front of an already-sequential collection — in which case it narrows to `X[]`.

#### Dates & Times

`date`, `immutable_date`, `datetime`, `immutable_datetime`, `immutable_custom_datetime`, `timestamp`, `datetime2`, `smalldatetime`, and `Carbon`/`CarbonImmutable`/`Illuminate\Support\Carbon` casts all resolve through [`timestamps_as_date`](#timestamps-as-date-objects) → **`string`** (default) or **`Date`**. `datetime2` is what SQL Server's `dateTime($precision)`/`timestamp($precision)` actually emit once a precision is given — the same logical column as bare `datetime`, so it follows the same toggle; `smalldatetime` is kept consistent with it.

#### Other

| Cast                                | TypeScript Type               |
| ----------------------------------- | ----------------------------- |
| `AsStringable`, `AsUri`, `AsBinary` | `string`                      |
| `null`                              | `null`                        |
| `mixed`                             | `unknown`                     |
| `never` (PHPStan)                   | `never`                       |
| `void` (PHPStan)                    | `void`                        |
| `true` / `false` (PHPStan)          | `true` / `false`              |
| `array-key` (PHPStan)               | `string \| number`            |
| `scalar` (PHPStan)                  | `string \| number \| boolean` |
| `geometry`, `geography`             | `unknown`                     |
| `vector`                            | `number[]`                    |

A spatial column's serialized shape depends entirely on how the app reads it — raw WKB is a binary
string, `ST_AsGeoJSON()` is an object — so `unknown` is the honest type rather than a guess. `vector`
is a pgvector/MySQL 9 column, which both serialize as a JSON array of floats.

MySQL's `geometry(subtype: '...')` writes the subtype itself as the column's native type instead of
`geometry` — `point`, `linestring`, `polygon`, `geometrycollection`, `multipoint`, `multilinestring`,
and `multipolygon` all resolve to **`unknown`** too, for the same reason as `geometry` above.

## Enum-Typed Columns (`{Model}Resource`)

A column, mutator, or relation typed to a `BackedEnum` or `UnitEnum` gets two representations:

- The base interface (`User`) types it as the plain `{Enum}Type` union — matching how Laravel serializes a `BackedEnum` when a model is cast to JSON.
- A parallel `{Model}Resource` / `{Model}MutatorsResource` / `{Model}AllResource` interface types the same property with [`AsEnum<typeof Enum>`](./enums.md#type-reference) instead — the shape you get once you've resolved the raw value to a full enum instance (e.g. `Status.from(user.status)`, or a Laravel API Resource that already serialized the enum via [`EnumResource`](./enum-api-resource.md)).

```typescript
import { Role } from "@data/enums";
import type { User, UserResource } from "@data/models";

function displayRole(user: User) {
  const resolved: UserResource["role"] = user.role
    ? Role.from(user.role)
    : null;
  // resolved?.label, resolved?.value, etc. — full enum instance, not just the raw value
}
```

::: warning
The `{Model}Resource` variants (and the `AsEnum` import) are only generated when `enums.use_tolki_package` is `true` (the default). Set it to `false` and enum columns are typed with `{Enum}Type` only, everywhere.
:::

## Filtering & Excluding Models

Same include/exclude pattern used by enums and resources:

```php
// config/ts-publish.php
'models' => [
    'included' => [App\Models\User::class],        // only these (empty = all)
    'excluded' => [App\Models\Pivot::class],         // never publish these
    'additional_directories' => ['modules/Blog/Models'],
],
```

`#[TsExclude]` on the model class excludes the whole model; on an accessor or relation method, it excludes just that property:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

class User extends Model
{
    #[TsExclude]
    protected function secretToken(): Attribute
    {
        return Attribute::make(get: fn (): string => 'hidden');
    }

    #[TsExclude]
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}
```

See [Excluding Content](./excluding-content.md) for the full attribute behavior shared across models, enums, resources, and routes.

The [model metadata](./model-metadata.md) phase inherits these three settings unless the matching `model_metadata.*` key is set.

## Casing

`models.relationship_case` (`'snake'` (default), `'camel'`, or `'pascal'`) controls the casing of relation names and their generated `_count` / `_exists` properties:

| Config Value | Relation (`hasMany(Post::class)`) | Count         | Exists         |
| ------------ | --------------------------------- | ------------- | -------------- |
| `'snake'`    | `posts: Post[]`                   | `posts_count` | `posts_exists` |
| `'camel'`    | `posts: Post[]`                   | `postsCount`  | `postsExists`  |
| `'pascal'`   | `Posts: Post[]`                   | `PostsCount`  | `PostsExists`  |

## Configuration Reference

The full list of `models.*` config keys — including pipeline class overrides for advanced customization — lives in the [Configuration Reference](./configuration-reference.md).
