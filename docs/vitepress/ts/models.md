# Models

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) converts Eloquent models into TypeScript interfaces for their columns, mutators, and relations — resolved via a reflection + database-schema waterfall so the generated types stay accurate without you hand-maintaining them.

As mentioned in [Installation & Usage](./index.md), models don't need the `@tolki/ts` runtime package at all (unlike [enums](./enums.md) and [routes](./routing.md)) — the output is plain TypeScript interfaces, with one exception: enum-typed columns optionally use the `AsEnum<>` type from `@tolki/types` (see [Enum-Typed Columns](#enum-typed-columns-modelresource)).

## How Models Are Generated

- One `.ts` file is generated per model, at a modular, namespace-derived path (e.g. `App\Models\User` → `app/models/user.ts`).
- Barrel `index.ts` files re-export everything (`export * from './user'`) per namespace directory, the same as [enums](./enums.md#how-enums-are-generated).
- Each column's type is resolved through a waterfall: an explicit [`#[TsCasts]`](#tscasts) override first, then the model's cast (`casts()` method or `$casts` property, including a [`#[TsType]`](#tstype) on a custom cast class), then the raw database column type — see the [Type Mapping Reference](#type-mapping-reference) for the full default table.
- Mutators (new-style `Attribute` accessors and old-style `getXAttribute()` methods) and relations are inspected the same way, and split into their own interfaces by default — see [Model Templates](#model-templates).

## Anatomy of a Generated Model

```typescript
import { type AsEnum } from '@tolki/ts';

import { MembershipLevel, Role } from '../enums';
import type { DatabaseNotification } from '../../illuminate/notifications';
import type { MembershipLevelType, RoleType } from '../enums';
import type { Address, Comment, Image, Order, Post, Profile, Team } from '.';

/**
 * Application user account
 *
 * @see App\Models\User
 */
export interface User
{
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
    settings: { theme: "light" | "dark"; notifications: boolean; locale: string } | null;
    last_login_at: string | null;
    last_login_ip: string | null;
}

export interface UserResource extends Omit<User, 'role' | 'membership_level'>
{
    role: AsEnum<typeof Role> | null;
    membership_level: AsEnum<typeof MembershipLevel> | null;
}

export interface UserMutators
{
    /** User initials (e.g. "JD" for "John Doe") */
    initials: string;
    /** Whether the user is a premium member */
    is_premium: boolean;
}

export interface UserRelations
{
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

export interface UserAllResource extends UserResource, UserMutators, UserRelations {}
```

- `User` holds the raw columns — enum columns (`role`, `membership_level`) are typed with the plain `{Enum}Type` union, matching how Eloquent serializes a `BackedEnum` to JSON.
- `UserResource` is the enum-*resolved* variant — see [Enum-Typed Columns](#enum-typed-columns-modelresource).
- `settings` shows an inline object type — the result of a [`#[TsCasts]`](#tscasts) override.
- `UserMutators` holds accessor-based properties (new-style `Attribute` or old-style `getXAttribute()`), each with its PHPDoc description carried over as a JSDoc comment — see [PHPDoc Descriptions](#phpdoc-descriptions).
- `UserRelations` includes every relation plus a generated `_count` and `_exists` property per relation (mirroring Laravel's [`withCount`](https://laravel.com/docs/eloquent-relationships#counting-related-models) / `withExists`) — including polymorphic relations and framework-provided ones (`notifications`, imported from a generated `illuminate/notifications` namespace).
- `UserAll` / `UserAllResource` are convenience interfaces combining all three — only generated when there's more than one non-empty interface to combine.

## Model Templates

By default, a model is split into up to four interfaces (`{Model}`, `{Model}Mutators`, `{Model}Relations`, `{Model}All`) so a given page only needs to import what it actually uses. Switch to a single combined interface with the `model-full` template:

| Template | Description |
|---|---|
| `laravel-ts-publish::model-split` | **(Default)** Separate interfaces for properties, mutators, and relations, plus an `All` interface combining them. |
| `laravel-ts-publish::model-full` | Combines properties, mutators, and relations into one interface (grouped with `// Columns` / `// Mutators` / `// Relations` comments). |

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
import { useForm } from '@inertiajs/vue3';
import type { User, UserRelations } from '@js/types/data/models';

interface UserForm extends User, Pick<UserRelations, 'profile_exists'> {
    profile: UserRelations['profile'] | null;
}

const form = useForm<UserForm>({ ...user });
form.profile;  // Profile | null
form.posts;    // TS error — `posts` isn't part of UserForm
```

With `model-full`, the equivalent requires `Omit`-ing every relation property you don't need instead of only picking what you want:

```typescript
import type { User } from '@js/types/data/models';

interface UserForm extends Omit<User, 'admin' | 'profile' | 'posts' | 'profile_count' | 'posts_count' | 'posts_exists'> {
    profile: User['profile'] | null;
}
```

Additionally, when using the `model-full` template, since all relations are included, it creates deeply dependent types where errors in a relation 2, 3 or more levels deep can propagate and cause TypeScript to raise errors. It can be good way to make sure all your models have proper TypeScript types for forms and other contexts where you only need a subset of the model's relations, but it can be a bit annoying to track down and fix.

## Nullable Relations

Singular relations are automatically typed with `| null` based on the relation type and, where relevant, whether the underlying foreign key column is nullable:

| Relation Type | Strategy | Behavior |
|---|---|---|
| `HasOne` | `nullable` | Always add `null` — the related record may not exist. |
| `MorphOne` | `nullable` | Always add `null`. |
| `HasOneThrough` | `nullable` | Always add `null`. |
| `BelongsTo` | `fk` | Add `null` only when the foreign key column is nullable in the database. |
| `MorphTo` | `morph` | Add `null` when either the morph type or morph id column is nullable. |
| `HasMany`, `BelongsToMany`, `MorphMany`, `MorphToMany` | `never` | Never nullable (returns an empty array, not null). |

```typescript
export interface UserRelations {
    profile: Profile | null;  // HasOne — always nullable
    posts: Post[];             // HasMany — never nullable
}

export interface PostRelations {
    author: User;                    // BelongsTo — user_id is NOT NULL
    category_rel: Category | null;   // BelongsTo — category_id is nullable
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

| Attribute | Target | Description |
|---|---|---|
| `#[TsCasts]` | `casts()` method, `$casts` property, or model class | Override/add TypeScript types for columns, mutators, or relations. |
| `#[TsType]` | Custom cast class | Set the TypeScript type used wherever this cast class is applied. |
| `#[TsExclude]` | Model class, accessor method, or relation method | Exclude an entire model, or a specific accessor/relation. |

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
import { ProductDimensions } from '@js/types/product';

export interface User {
    metadata: {label: string, value: string}[];
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
import { ProductDimensions } from '@js/types/product';

export interface Product {
    dimensions: ProductDimensions;
}
```

`#[TsType]` also accepts a plain string (`#[TsType('{width: number, height: number}')]`) when the type doesn't need an import.

## PHPDoc Descriptions

Doc blocks are read automatically and converted to JSDoc comments:

| Location | Source | JSDoc Placement |
|---|---|---|
| Model class | Doc block above the class | Above the `export interface` declaration |
| Columns | Doc block above the column's accessor method | Above the column property |
| Mutators | Doc block above the mutator's accessor method | Above the mutator property |
| Relations | Doc block above the relation method | Above the relation property |

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

| Config Value | Generated Type |
|---|---|
| `false` (default) | `created_at: string` |
| `true` | `created_at: Date` |

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
Custom mappings are merged with the built-in map and take precedence. For a *per-property* override instead of a global one, use [`#[TsCasts]`](#tscasts) or [`#[TsType]`](#tstype) instead.
:::

### Type Mapping Reference

<div class="collection-method-list" markdown="1">

[Numbers](#numbers) [Booleans](#booleans) [Strings](#strings) [Arrays &amp; Objects](#arrays-objects) [Dates &amp; Times](#dates-times) [Other](#other)

</div>

#### Numbers

`bigint`, `decimal`, `double`, `float`, `integer`, `int`, `numeric`, `number`, `mediumint`, `smallint`, `year`, `real` → **`number`**

#### Booleans

`bool`, `boolean`, `tinyint` → **`boolean`**

#### Strings

`char`, `character`, `enum`, `longtext`, `mediumtext`, `string`, `text`, `varchar`, `encrypted`, `uuid`, `guid`, `hashed`, `time`, `timetz`, `timestamptz`, `numeric-string` → **`string`**

#### Arrays & Objects

| Cast | TypeScript Type |
|---|---|
| `array`, `collection` | `unknown[]` |
| `AsArrayObject`, `AsCollection`, `AsEncryptedArrayObject`, `AsEncryptedCollection`, `AsEnumArrayObject`, `AsEnumCollection` | `unknown[]` |
| `json`, `jsonb`, `object` | `object` |
| `Illuminate\Database\Eloquent\Collection` | `Record<string, unknown>` |
| `Illuminate\Support\Collection` | `unknown[] \| Record<string, unknown>` |
| `Illuminate\Database\Eloquent\Casts\AsFluent` | `object` |

#### Dates & Times

`date`, `immutable_date`, `datetime`, `immutable_datetime`, `immutable_custom_datetime`, `timestamp`, and Carbon/`CarbonImmutable` casts all resolve through [`timestamps_as_date`](#timestamps-as-date-objects) → **`string`** (default) or **`Date`**.

#### Other

| Cast | TypeScript Type |
|---|---|
| `AsStringable`, `AsUri`, `AsBinary` | `string` |
| `null` | `null` |
| `mixed` | `unknown` |
| `never` (PHPStan) | `never` |
| `void` (PHPStan) | `void` |
| `true` / `false` (PHPStan) | `true` / `false` |
| `array-key` (PHPStan) | `string \| number` |
| `scalar` (PHPStan) | `string \| number \| boolean` |

## Enum-Typed Columns (`{Model}Resource`)

A column, mutator, or relation typed to a `BackedEnum` or `UnitEnum` gets two representations:

- The base interface (`User`) types it as the plain `{Enum}Type` union — matching how Laravel serializes a `BackedEnum` when a model is cast to JSON.
- A parallel `{Model}Resource` / `{Model}MutatorsResource` / `{Model}AllResource` interface types the same property with [`AsEnum<typeof Enum>`](./enums.md#type-reference) instead — the shape you get once you've resolved the raw value to a full enum instance (e.g. `Status.from(user.status)`, or a Laravel API Resource that already serialized the enum via [`EnumResource`](https://github.com/abetwothree/laravel-ts-publish#json-enum-http-api-resource)).

```typescript
import { Role } from '@js/types/data/enums';
import type { User, UserResource } from '@js/types/data/models';

function displayRole(user: User) {
    const resolved: UserResource['role'] = user.role ? Role.from(user.role) : null;
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

See [Excluding with `#[TsExclude]`](https://github.com/abetwothree/laravel-ts-publish#excluding-with-tsexclude) in the main README for the full attribute behavior shared across models, enums, resources, and routes.

## Casing

`models.relationship_case` (`'snake'` (default), `'camel'`, or `'pascal'`) controls the casing of relation names and their generated `_count` / `_exists` properties:

| Config Value | Relation (`hasMany(Post::class)`) | Count | Exists |
|---|---|---|---|
| `'snake'` | `posts: Post[]` | `posts_count` | `posts_exists` |
| `'camel'` | `posts: Post[]` | `postsCount` | `postsExists` |
| `'pascal'` | `Posts: Post[]` | `PostsCount` | `PostsExists` |

## Configuration Reference

The full list of `models.*` config keys — including pipeline class overrides for advanced customization — lives in the Laravel package's [Configuration Reference](https://github.com/abetwothree/laravel-ts-publish#configuration-reference).
