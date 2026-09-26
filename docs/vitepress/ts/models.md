# Models

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) turns your Eloquent models into TypeScript interfaces for their columns, accessors and relations. The types come from your database schema, casts and docblocks, so you don't keep a second copy of each model up to date by hand.

Model interfaces are plain TypeScript, so they don't need the `@tolki/ts` runtime that [enums](./enums.md) and [routes](./routing.md) use. The one exception is a model with enum-typed columns: its file imports the `AsEnum` type with `import { type AsEnum } from '@tolki/ts';` for its [enum-resolved interfaces](#enum-typed-columns-model-resource).

## How Models Are Generated

The `ts:publish` command publishes each model as follows:

- **One file per model**: `App\Models\User` is written to `app/models/user.ts`, following the model's namespace. Each namespace directory also gets an `index.ts` barrel that re-exports its files (`export * from './user'`), the same as [enums](./enums.md#how-enums-are-generated).
- **Split interfaces**: columns, accessors and relations go into separate interfaces by default. See [Model Templates](#model-templates).
- **Column types**: a column's type comes from the first source that applies. In order, those are a [`#[TsCasts]`](#tscasts) entry, an accessor with the column's name, the model's cast in `casts()` or `$casts`, and the database column type. A custom cast class can set its own type with [`#[TsType]`](#tstype). When the result is still vague, such as `unknown[]`, a class-level `@property` tag refines it. The [Type Mapping Reference](#type-mapping-reference) lists the default types.
- **Accessors**: new-style `Attribute` accessors and old-style `get{Name}Attribute()` methods that aren't columns publish as mutators, typed from their return types, their docblocks or what their getters return.
- **Relations**: each relation publishes, plus a `_count` and an `_exists` property for it.
- **Metadata companions**: an opt-in phase writes a runtime `{model}_meta.ts` file beside the interface. See [Model Metadata](./model-metadata.md).

::: warning Missing Tables
When a model has no attributes at all and its table doesn't exist, `ts:publish` prints a warning after its summary:

```text
App\Models\User: Table [users] does not exist on connection [mysql], so its columns are not published. Run the migrations, then publish again.
```

The interface is still published, with no columns, so the warning is how you tell a missing migration from a model that has no columns. A table that exists but lacks some columns isn't reported, and `--quiet` hides the warning.
:::

## Anatomy of a Generated Model

For a `User` model with enum-cast columns, accessors and relations, the published file looks like this:

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

Each interface holds one part of the model:

- **`User`**: the columns. The enum columns `role` and `membership_level` use the enum's `{Enum}Type` union, which is how Eloquent serializes a backed enum to JSON. `settings` is an inline object type from a [`#[TsCasts]`](#tscasts) override.
- **`UserResource`**: the same columns, with each enum column typed as a resolved enum instance. See [Enum-Typed Columns](#enum-typed-columns-model-resource).
- **`UserMutators`**: the accessors, new-style `Attribute` or old-style `getXAttribute()`. Each accessor's PHPDoc description becomes a JSDoc comment. See [PHPDoc Descriptions](#phpdoc-descriptions).
- **`UserRelations`**: every relation, including polymorphic ones and framework relations such as `notifications`, which is imported from a generated `illuminate/notifications` directory. Each relation also gets a `_count` and an `_exists` property, matching Laravel's [`withCount`](https://laravel.com/docs/eloquent-relationships#counting-related-models) and `withExists`.
- **`UserAll` and `UserAllResource`**: the interfaces combined. They're generated only when the model has accessors or relations, and `UserAllResource` also needs an enum-typed property.

## Model Templates

By default, a model is split into up to four interfaces (`{Model}`, `{Model}Mutators`, `{Model}Relations` and `{Model}All`), so a page imports only the parts it uses. The `model-full` template puts everything in one interface instead:

| Template                          | Description                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `laravel-ts-publish::model-split` | **(Default)** Separate interfaces for columns, mutators and relations, plus an `All` interface that combines them. |
| `laravel-ts-publish::model-full`  | One interface, with `// Columns`, `// Mutators` and `// Relations` comments between the groups.                    |

Set the template in your config:

```php
// config/ts-publish.php
'models' => [
    'template' => 'laravel-ts-publish::model-full',
],
```

::: tip
An accessor listed in the model's `$appends` array publishes in the main `{Model}` interface in both templates, because Laravel includes appended attributes every time it serializes the model to JSON.
:::

To change a template's structure, publish the views with `php artisan vendor:publish --tag="laravel-ts-publish-views"`, then point `models.template` at your view.

### Choosing Between Interfaces in a Form

The split template lets you compose only the pieces a page needs. This Inertia form uses the full `User` shape plus one relation flag:

```typescript
import { useForm } from "@inertiajs/vue3";
import type { User, UserRelations } from "@js/types/data/app/models";

interface UserForm extends User, Pick<UserRelations, "profile_exists"> {
  profile: UserRelations["profile"] | null;
}

const form = useForm<UserForm>({ ...user });
form.profile; // Profile | null
form.posts; // TS error: `posts` isn't part of UserForm
```

With `model-full`, you `Omit` every relation property you don't need, instead of picking the ones you do:

```typescript
import type { User } from "@js/types/data/app/models";

interface UserForm extends Omit<
  User,
  "profile" | "posts" | "profile_count" | "posts_count" | "posts_exists"
> {
  profile: User["profile"] | null;
}
```

Because `model-full` includes every relation, each model also depends on the full interface of every model it relates to. A type error two or three relations deep then surfaces in every model that reaches it. That can help you find models whose types are incomplete, but those errors take longer to trace and fix.

## Nullable Relations

Singular relations get `| null` from their relation type. For `BelongsTo` and `MorphTo`, the package also checks whether the foreign key columns are nullable:

| Relation Type                                                            | Strategy   | Behavior                                                                       |
| ------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------ |
| `HasOne`, `MorphOne`, `HasOneThrough`                                    | `nullable` | Always nullable, because the related record may not exist.                     |
| `BelongsTo`                                                              | `fk`       | Nullable only when the foreign key column is nullable in the database.         |
| `MorphTo`                                                                | `morph`    | Nullable when either the morph type column or the morph id column is nullable. |
| `HasMany`, `HasManyThrough`, `BelongsToMany`, `MorphMany`, `MorphToMany` | `never`    | Never nullable. An empty relation serializes as an empty array, not `null`.    |

For example, the `User` and `Post` relations publish like this:

```typescript
export interface UserRelations {
  profile: Profile | null; // HasOne: always nullable
  posts: Post[]; // HasMany: never nullable
}

export interface PostRelations {
  author: User; // BelongsTo: user_id is NOT NULL
  category_rel: Category | null; // BelongsTo: category_id is nullable
}
```

### Disabling or Overriding the Strategy

Set `models.nullable_relations` to `false` to keep every singular relation non-nullable:

```php
// config/ts-publish.php
'models' => [
    'nullable_relations' => false,
],
```

To change the strategy for one relation type, map its class to `'nullable'`, `'never'`, `'fk'` or `'morph'` in `models.relation_nullability_map`. This works for custom and third-party relation classes too:

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

The table above is the default map. A relation class that isn't in the map is always nullable, so map a custom relation class to give it a stricter strategy.

## What Gets Published: Hidden Attributes, Write-Only Accessors

Not every attribute Eloquent knows about reaches the generated interface. Hidden attributes and write-only accessors follow their own rules.

### Hidden Attributes

`$hidden` attributes publish by default. Set `models.exclude_hidden` to `true` to leave them out, which matches what Laravel's `toArray()` and `toJson()` return:

```php
// config/ts-publish.php
'models' => [
    'exclude_hidden' => true,
],
```

With the setting on, hidden columns such as `password` and `remember_token` also drop out of resource interfaces. That applies to any resource that takes the model's properties implicitly, through whole-model delegation or `except()`. A resource's `only(['password'])` still keeps a hidden column it names. See [API Resources § `exclude_hidden` and Attribute Filters](./api-resources.md#exclude-hidden-and-attribute-filters) for the full rule.

The default is off, so upgrading the package never drops a property your frontend already reads. Turn it on once you've confirmed the frontend doesn't need those columns. The package can't see a runtime `makeVisible()` call, so a hidden column stays out of the model's interface even on requests that reveal it. If the frontend needs a hidden column, remove it from `$hidden`.

### Write-Only Accessors

A write-only accessor has a setter and no getter: `Attribute::set(...)`, or `Attribute::make(set: ...)`. Its type comes from the first of these that applies:

1. The `Get` type of its `@return Attribute<Get, Set>` docblock, when that type is specific and isn't `never`.
2. The database type of a column with the same name.
3. Nothing. The accessor is left out of the interface instead of publishing as `unknown`, unless a class-level `@property` tag types it.

`Attribute<never, string>`, or `Attribute<?never, string>`, is the usual way to document an accessor with no getter. Its `never` records that there is no getter, not what reading the attribute returns, so a column behind it publishes its database type: `subject: string`, not `subject: never`.

Step 2 uses the column's database type and skips its cast. Laravel reports a column that has a mutator as cast by that mutator, so an enum, `integer` or `boolean` cast on the column isn't applied. An old-style `set{Name}Attribute()` method behaves the same way. To publish a more specific type, give the accessor a specific `Get` type, such as `Attribute<Role|null, string>`, which publishes `RoleType | null`, or add a `#[TsCasts]` entry.

In this `Order` model, one write-only accessor documents its `Get` type and one documents nothing:

```php
class Order extends Model
{
    /** @return Attribute<?string, string> */
    protected function trackingCode(): Attribute
    {
        return Attribute::make(set: fn (string $value): string => strtoupper($value));
    }

    // No getter, no docblock generic, no backing column: left out of OrderMutators.
    protected function searchIndex(): Attribute
    {
        return Attribute::make(set: fn (string $value): string => strtolower($value));
    }
}
```

`trackingCode` publishes as `tracking_code: string | null` in `OrderMutators`, and `searchIndex` doesn't appear. A write-only accessor on a real column, such as one that normalizes a value on save, publishes as that column in the main `{Model}` interface, not as a mutator.

## Model Attributes

All attributes live in the `AbeTwoThree\LaravelTsPublish\Attributes` namespace.

| Attribute      | Target                                              | Description                                                          |
| -------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| `#[TsCasts]`   | `casts()` method, `$casts` property, or model class | Override or add TypeScript types for columns, mutators or relations. |
| `#[TsType]`    | Custom cast class                                   | Set the TypeScript type used wherever this cast class is applied.    |
| `#[TsExclude]` | Model class, accessor method, or relation method    | Exclude a whole model, or one accessor or relation.                  |

### `#[TsCasts]`

`#[TsCasts]` takes an array that maps property names to a TypeScript type. A value is either a type string, or an array: `['type' => ..., 'import' => ...]` for a type you import from your own files, and `['type' => ..., 'optional' => true]` to mark the property optional with a `?`:

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

The published interface uses those types and imports `ProductDimensions`:

```typescript
import type { ProductDimensions } from "@js/types/product";

export interface User {
  metadata: { label: string; value: string }[];
  settings: Record<string, unknown>;
  dimensions: ProductDimensions;
}
```

You can put `#[TsCasts]` on the `casts()` method, on the `$casts` property, or on the model class. All three take the same array.

::: tip
Put `#[TsCasts]` on `casts()` or `$casts`, so the TypeScript type sits next to the PHP cast. Put it on the class when you override a mutator or a relation. It's also the right place for a model you extend from the `vendor` directory, since you can override its relation and mutator types without touching the vendor's casts.
:::

### `#[TsType]`

For a custom cast class you use on several models, put `#[TsType]` on the cast class once, instead of repeating `#[TsCasts]` everywhere you use it:

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

Every column that uses the cast publishes with that type:

```typescript
import type { ProductDimensions } from "@js/types/product";

export interface Product {
  dimensions: ProductDimensions;
}
```

`#[TsType]` also takes a plain string, such as `#[TsType('{width: number, height: number}')]`, when the type needs no import. Without `#[TsType]`, a custom cast publishes the return type of its `get()` method, or `unknown` when `get()` declares none.

## Laravel 13 Model Attributes

Laravel 13 added native class attributes for Eloquent models (`Illuminate\Database\Eloquent\Attributes`) and API resources (`Illuminate\Http\Resources\Attributes`). They replace property-based conventions, such as `#[Table]` in place of `protected $table`. These are Laravel's attributes, not this package's, so you don't import anything from `AbeTwoThree\LaravelTsPublish\Attributes` to use them. The package honors the ones that change a model's serialized shape, with no configuration:

| Attribute                                                                                                                                                                                                                                                                                          | Honored? | Notes                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `#[Table('...')]`                                                                                                                                                                                                                                                                                  | Yes      | Selects the table whose columns are published, the same as `protected $table`.                                                                                                                                                                               |
| `#[Hidden(['col'])]`                                                                                                                                                                                                                                                                               | Yes      | Marks columns hidden, the same as `protected $hidden`. See [Hidden Attributes](#hidden-attributes).                                                                                                                                                          |
| `#[Visible(['col'])]`                                                                                                                                                                                                                                                                              | Yes      | An allowlist, the same as `protected $visible`: every column it doesn't list becomes hidden. With `models.exclude_hidden` on, list every column you want published, or most of the model disappears from the interface.                                      |
| `#[Appends(['accessor'])]`                                                                                                                                                                                                                                                                         | Yes      | Adds accessors to the published set, the same as `protected $appends`.                                                                                                                                                                                       |
| `#[Connection('name')]`                                                                                                                                                                                                                                                                            | Yes      | Selects the database connection whose schema the columns come from, the same as `protected $connection`.                                                                                                                                                     |
| `#[Collects(SomeResource::class)]`                                                                                                                                                                                                                                                                 | Yes      | Sets the resource a collection collects. See [API Resources](./api-resources.md).                                                                                                                                                                            |
| `#[UseResource(...)]`, `#[UseResourceCollection(...)]`                                                                                                                                                                                                                                             | Yes      | Link a model to its resource. See [API Resources](./api-resources.md). Available since Laravel 12.29.                                                                                                                                                        |
| `#[PreserveKeys]`                                                                                                                                                                                                                                                                                  | Yes      | Types the collection's `data` as `Record<string, R>` instead of `R[]`, the keyed JSON object Laravel returns. `public $preserveKeys = true;` does the same. See [API Resources § Key-Preserving Collections](./api-resources.md#key-preserving-collections). |
| `#[RouteKey('slug')]`                                                                                                                                                                                                                                                                              | Yes      | A model-bound route argument types `_routeKey` from the attribute's key, even when the model overrides none of `getRouteKeyName()`, `getKeyName()` or `$primaryKey`. See [Routing § Model Binding](./routing.md#model-binding).                              |
| Everything else (`#[DateFormat]`, `#[WithoutTimestamps]`, `#[WithoutIncrementing]`, `#[Fillable]`, `#[Guarded]`, `#[Unguarded]`, `#[Scope]`, `#[ScopedBy]`, `#[ObservedBy]`, `#[Boot]`, `#[Initialize]`, `#[Touches]`, `#[CollectedBy]`, `#[UseEloquentBuilder]`, `#[UseFactory]`, `#[UsePolicy]`) | N/A      | These change querying, events, mass assignment or factories, not the serialized shape, so they don't affect the published types.                                                                                                                             |

::: warning Older Laravel Versions
`#[Table]`, `#[Hidden]`, `#[Visible]`, `#[Appends]`, `#[Connection]`, `#[Collects]` and `#[PreserveKeys]` require Laravel 13. `#[UseResource]` and `#[UseResourceCollection]` require Laravel 12.29. On an older version, using one isn't an error: the model loads normally and the attribute is ignored. Nothing tells you that `#[Table]` didn't take effect, so run a Laravel version that supports each attribute you rely on.
:::

## Typing Attributes Without #[TsCasts]

Most columns and accessors type themselves. When one publishes `unknown` or `unknown[]`, reach for these annotations before `#[TsCasts]`, in this order:

1. A parameterized `Attribute<>`, `@return` or `@phpstan-return` docblock on the accessor, generics included, such as `Attribute<Collection<int, LineItem>, never>`.
2. A class-level `@property` or `@property-read` tag, including one that uses a `@phpstan-type` or `@phpstan-import-type` alias.
3. A `@return MorphTo<A|B, $this>` generic on a `morphTo()` relation.

PHPStan and Larastan read all of them, so the annotation that fixes your TypeScript is also checked by static analysis, and the package reads them with no configuration. `#[TsCasts]` is still the right tool when a shape's keys are built at runtime, or when the type belongs to the frontend and needs its own import. The [Annotation Checklist](#annotation-checklist) lists each case by symptom.

### Accessor Getter Bodies

When an accessor's getter has no specific return type, and its `@return Attribute<Get, Set>` docblock is missing or vague, the package reads what the getter returns. An accessor that would otherwise publish `unknown[]` publishes the shape it builds:

```php
class Release extends Model
{
    protected function versionData(): Attribute
    {
        return Attribute::get(fn () => ['major' => $this->major, 'minor' => $this->minor]);
    }

    protected function tagList(): Attribute
    {
        return Attribute::get(fn (): array => collect(explode(',', $this->tags_csv))
            ->map(fn ($tag) => ['name' => $tag])
            ->values()
            ->all());
    }

    protected function emptyList(): Attribute
    {
        return Attribute::get(fn (): array => []);
    }
}
```

The first two accessors publish the shapes their getters return. The empty list keeps the `unknown[]` of its `: array` signature, because an empty `[]` says nothing about its elements:

```typescript
export interface ReleaseMutators {
  version_data: { major: number; minor: number };
  tag_list: { name: string }[];
  empty_list: unknown[];
  // …
}
```

The package reads `Attribute::make()`, `Attribute::get()`, `new Attribute(get: ...)` and old-style `get{Name}Attribute()` bodies. An accessor declared in a trait is read against the model that uses the trait. A method the getter calls is read the same way: `channelOptions()` returns `static::channelLabels()`, whose signature is a bare `: array`, and still publishes `{ "1": string; "2": string }`. A getter that returns an untyped property is typed from the property's default value, so `channels()`, which returns `protected $allowedChannels`, publishes `string[]`.

A specific return type or `Attribute<Get, Set>` generic is always read first, so the getter body never overrides an accurate annotation. When the getter can't be typed, the accessor keeps the type from its signature or docblock, or publishes `unknown` if it has neither. That happens when the getter:

- Returns an empty `[]` literal, like `empty_list` above
- Builds its keys in a loop, such as `$totals['k'.$index] = $index`
- Calls something whose return type can't be determined
- Reads another accessor that reads it back, in which case both publish `unknown`
- Can only be typed as `null`, because one side of a `??` or a ternary couldn't be typed
- Names two different classes or enums that share a short name, such as `$this->status ?? $this->author?->status` when each `status` is a different `Status` enum
- Returns an API resource

The `null` case keeps a getter from publishing a type that's plainly wrong: `fn ($value, array $attributes) => $attributes['title'] ?? null` publishes `unknown`, not `null`, because its real value is the title.

### Typing `array` Casts With `@property`

A column cast to `'array'`, or to any cast with no more specific type, publishes as `unknown[]`. Instead of `#[TsCasts]`, add a class-level `@property` or `@property-read` tag with the real shape. It's the same tag PHPStan and Larastan read:

```php
/**
 * @property array<int, string>|null $to
 * @property array<string, string>|null $headers
 */
class Message extends Model { ... }
```

`$to` and `$headers` publish as `string[] | null` and `Record<string, string> | null` instead of `unknown[] | null`, and PHPStan and Larastan type the same properties.

A tag applies only when the column's own type is vague. It never overrides a specific type, such as an accessor's return type, an enum cast or a custom `CastsAttributes` class. A subclass's tag wins over its parent's. `@property-write` tags are ignored, because they describe the setter.

A tag that is still partly vague is used when it's more specific than the type it replaces. `@property array<string, mixed>|null $settings` turns a plain `'array'` cast into `Record<string, unknown> | null`: the type still names `unknown`, but it beats `unknown[] | null`. A tag that is exactly as vague as the original is ignored: `unknown`, `unknown[]`, `object`, or the `unknown[] | Record<string, unknown>` of a bare collection.

The package also reads `@property` tags on the traits the model and its parents use, and on the traits those traits use. A trait that supplies an accessor can document it that way. The `$`-less form some packages use, `@property string[] labels`, works as long as nothing follows the property name.

### Typing JSON Columns With `@phpstan-type` Aliases

For a shape that deserves a name, define it once as a `@phpstan-type` on the DTO that owns it, then import it into the model with `@phpstan-import-type`:

```php
/** @phpstan-type PresetConfig array{filters?: array<string, mixed>, sorts?: list<string>} */
final readonly class PresetDto { ... }

/**
 * @phpstan-import-type PresetConfig from PresetDto
 * @property PresetConfig|null $config
 */
class Preset extends Model { ... }
```

`$config` publishes as `{ filters?: Record<string, unknown>; sorts?: string[] } | null`. The alias expands inline, so `PresetDto` isn't imported, optional keys keep their `?`, and PHPStan checks the same alias. The package also reads `@phpstan-import-type ... as Alias`, `@psalm-type` and `@psalm-import-type`. An alias can use another imported alias, and an import cycle publishes `unknown` instead of stalling the run. For a shape that's already worth documenting for static analysis, prefer an alias over `#[TsCasts]`.

### Nullable and Intersection Docblock Types

A nullable alias keeps its `| null`. Here it's written with a trailing `|null`:

```php
/**
 * @phpstan-import-type GridConfig from GridConfigDto
 * @phpstan-import-type GridPreset from GridConfigDto
 *
 * @property GridConfig|null $grid_config
 * @property GridPreset|null $grid_preset
 */
class Team extends Model { ... }
```

Both aliases expand, and both keep `| null`:

```typescript
export interface Team {
  grid_config: {
    filters?: Record<string, unknown>;
    sorts?: string[];
    columns?: string[];
  } | null;
  grid_preset: { name: string; locked?: boolean } | null;
  // …
}
```

A leading `?` works the same way, on a generic and on an alias, so `@property ?GridPreset $grid_preset` also keeps its `| null`. The same goes for an accessor's `@return` docblock:

```php
/** @return Attribute<?array<int, int>, never> */
protected function stateIds(): Attribute

/** @return Attribute<?FlagValue, never> */   // FlagValue is a @phpstan-type alias
protected function flagDefault(): Attribute
```

Each type publishes with `| null`:

```typescript
export interface OrderMutators {
  state_ids: number[] | null;
  // …
}

export interface DocblockGenericsFixtureMutators {
  flag_default: boolean | number | string | null;
  // …
}
```

A docblock intersection resolves each member and joins them with `&`:

```php
/** @return Attribute<Collection<int, User&object{pivot: TaskAssignment}>, never> */
protected function assignedUsers(): Attribute
```

`User` keeps its import, but `pivot` publishes as `unknown`:

```typescript
export interface DocblockGenericsFixtureMutators {
  assigned_users: (User & { pivot: unknown })[];
  // …
}
```

A class named inside an `object{...}` shape always publishes as `unknown`, which is why `TaskAssignment` is lost here. A member that can't be resolved is dropped from the intersection, instead of turning the whole type into `unknown`, since `A & B` is assignable to `A`.

### Trait `@template` Bindings

A generic trait's `@template` parameter is bound by the `@use` tag on the class that uses the trait, so one trait can give many models a correctly typed accessor:

```php
/** @template TChild of Model */
trait AggregatesChildren
{
    /** @return Attribute<EloquentCollection<int, TChild>, never> */
    protected function childItems(): Attribute { ... }
}

class DocblockGenericsFixture extends Model
{
    /** @use AggregatesChildren<Comment> */
    use AggregatesChildren;
}
```

`TChild` becomes `Comment` for this model:

```typescript
export interface DocblockGenericsFixtureMutators {
  child_items: Comment[];
  // …
}
```

PHPStan reads the `@use` tag for the same purpose, so static analysis checks the binding too.

### Typing Castable-With-Arguments Casts

Laravel's built-in `Castable` classes carry their configuration after a colon in the cast string. `AsEnumCollection::of(DayOfWeek::class)`, `AsCollection::of(...)` and `AsCollection::using(...)` all build a `"ClassName:arg1,arg2"` cast string. The package types these with no extra configuration:

```php
protected function casts(): array
{
    return [
        'week_days' => AsEnumCollection::of(DayOfWeek::class),
        'grid_configs' => AsCollection::of(GridConfigDto::class),
    ];
}
```

Each cast publishes the mapped class's type as a list:

- **`AsEnumCollection::of($enum)`**: the enum's type with `[]`, such as `DayOfWeekType[]`. The enum is imported the same way as for an enum-cast column.
- **`AsCollection::of($map)` and `AsCollection::using($collection, $map)`**: the mapped class's shape with `[]`. An `Arrayable` DTO with a documented `toArray()` shape inlines as an object array, such as `{ label: string; config: Record<string, unknown> }[]`, and a mapped enum publishes the same way as `AsEnumCollection`. When the mapped class has no shape the package can read, or the cast is a bare `AsCollection`, the column stays `unknown[]`.
- **Any other `Castable` or `CastsAttributes` class with arguments**: a custom cast or `AsEncryptedCollection`, for example, publishes as if the arguments weren't there.

### Typing `morphTo` Relations

By default, a `morphTo()` relation is typed as the union of every published model that declares a `morphOne()` or `morphMany()` pointing back at it. A relation that returns a custom subclass of `MorphOne` or `MorphMany` counts too. That lookup can only ever build the full union, never narrow it. To type the relation directly, add a `@return MorphTo<A|B, $this>` docblock to the relation method. PHPStan checks the same docblock, and you don't need `#[TsCasts]`:

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

`causer` publishes as `User | null`, even though no model declares a relation pointing back at `Activity`. With neither a docblock nor an inverse relation, a `morphTo()` publishes as `unknown`.

The second generic argument, `$this`, is Laravel's convention for the child model and is ignored. A generic that names the base `Model` class or an abstract class is ignored too, and the relation falls back to the union of its inverse relations. That covers `@phpstan-return MorphTo<Model, $this>`, which is what Larastan expects when a relation's targets aren't known up front, and which would otherwise publish a `Model` type that nothing can import. Each `morphTo()` relation resolves on its own, so two differently named `morphTo` relations on one model get separate types.

#### Parents Found Through a Subclass or a Custom Pivot

The union also picks up two kinds of parent that need no docblock.

A parent can point its relation at a subclass of the model that declares the `morphTo()`. `Venue::reviews()` returns `morphMany(VenueReview::class, 'reviewable')`, where `VenueReview extends Review` and only `Review` declares `reviewable()`, so `Venue` joins `Review`'s union:

```typescript
export interface ReviewRelations {
  reviewable: Artist | Venue;
  // …
}

export interface VenueReviewRelations {
  reviewable: Venue;
  // …
}
```

A subclass never inherits a sibling's parents, so `VenueReview::reviewable` stays `Venue`, and `Artist` never appears there. The union only grows upward. A parent declared against the base `Review` is never added to a subclass, because a row written through that relation stores `Review`'s morph value, not the subclass's.

The second kind is a `morphToMany(...)->using(Pivot::class)` whose custom pivot declares its own `morphTo()`. The pivot row's morph column names the parent directly, so the pivot's relation resolves like any other:

```php
class Venue extends Model
{
    /** Labels attached via the custom Labelable pivot, which itself carries the morphTo back */
    public function labels(): MorphToMany
    {
        return $this->morphToMany(Label::class, 'labelable')->using(Labelable::class);
    }
}
```

With `Artist` declaring the same relation, the pivot's `labelable` covers both parents:

```typescript
export interface LabelableRelations {
  labelable: Artist | Venue;
  // …
}
```

A `morphToMany()` without `->using()` adds no parent, and neither does `morphedByMany()`. That's the inverse side of the relation, so counting it would record the wrong parent.

### DTO-Typed Accessors and Casts

An `Arrayable` DTO whose `toArray()` has no `@return array{...}` shape publishes the shape of its typed public properties, promoted constructor properties included, instead of `unknown[]`:

```php
final readonly class ShippingOptions implements Arrayable
{
    public function __construct(
        public string $carrier,
        public bool $insured,
        public ?string $trackingUrl = null,
    ) {}

    /** @return array<string, bool|string|null> */
    public function toArray(): array
    {
        return (array) $this;
    }
}
```

An accessor or cast that returns this DTO publishes as `{ carrier: string; insured: boolean; trackingUrl: string | null }`. Nullable properties keep their `| null`. Private, protected and static properties are left out, because `(array) $this` doesn't include them. A property typed as a class or an enum, such as a model, publishes as `unknown`, because the inline shape can't import it.

Optional is separate from nullable. A property that is neither promoted nor given a default value publishes as an optional key. Add `public string $summary;` to the class body above, assigned in the constructor, and it publishes as `summary?: string`. PHP leaves an unassigned typed property out of `(array) $this`, and the package can't tell whether the constructor always assigns it. To keep the key required, promote the property, or give it a default value on a DTO that isn't `readonly`. A `@return array{...}` docblock on `toArray()` always wins, so add one when the properties don't tell the whole story.

This only applies to `Arrayable`. A `JsonSerializable` DTO is typed from a `@return array{...}` docblock on `jsonSerialize()` and never from its properties, because `jsonSerialize()` can return anything. Without the docblock, the DTO isn't inlined, and the property publishes by other rules, such as the DTO's class name.

### Annotation Checklist

This table indexes the annotations above by symptom, plus two cases from [API Resources](./api-resources.md). None of them needs `#[TsCasts]`, and PHPStan and Larastan read them all, so the annotation that fixes the TypeScript type is also checked by static analysis:

| Still publishing `unknown`?                                                                                     | Add this                                                                                                                                              | Result                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Attribute<Collection, never>` publishes `unknown[]`, and the getter builds the value in a loop                 | Parameterize the generic: `Attribute<Collection<int, LineItem>, never>`, or `array{...}` for a fixed shape                                            | The element type (`LineItem[]`), imported automatically. Keys built in a loop can't be read from the getter body, so the generic is the fix                                                                      |
| A bare `'array'` or `'collection'` cast with no shape anywhere else                                             | A class-level `@property` or `@property-read` tag, such as `@property array<string, mixed>\|null $settings`                                           | `Record<string, unknown> \| null`, or the tag's more specific type, instead of `unknown[] \| null`. See [Typing `array` Casts With `@property`](#typing-array-casts-with-property)                               |
| A JSON shape you want to name once and reuse                                                                    | `@phpstan-type Name array{...}` on the class that owns it, then `@phpstan-import-type Name from ThatClass` and `@property Name $prop` on the model    | The shape, expanded inline and checked by PHPStan, with no import of the DTO. See [Typing JSON Columns With `@phpstan-type` Aliases](#typing-json-columns-with-phpstan-type-aliases)                             |
| An `AsEnumCollection` or `AsCollection` cast with no argument publishes `unknown[]`                             | Pass the mapped class: `AsEnumCollection::of(Status::class)`, `AsCollection::of(LineItemDto::class)`                                                  | The element's type, an enum or a DTO shape, as a list. See [Typing Castable-With-Arguments Casts](#typing-castable-with-arguments-casts)                                                                         |
| A `morphTo()` publishes `unknown` because no model declares the matching `morphOne()` or `morphMany()`          | `@return MorphTo<A\|B, $this>` on the relation method                                                                                                 | The union, with every member imported. See [Typing `morphTo` Relations](#typing-morphto-relations)                                                                                                               |
| A `morphTo()` whose parents point at a subclass, or reach it through a `->using()` pivot                        | Nothing. The union includes both automatically                                                                                                        | The parent union. See [Parents Found Through a Subclass or a Custom Pivot](#parents-found-through-a-subclass-or-a-custom-pivot)                                                                                  |
| An `Arrayable` DTO accessor or cast publishes `unknown[]`                                                       | Nothing. Typed public properties, promoted constructor properties included, are read automatically when `toArray()` has no `@return array{...}` shape | The DTO's property shape instead of `unknown[]`. See [DTO-Typed Accessors and Casts](#dto-typed-accessors-and-casts)                                                                                             |
| `$this->relation->only([...])` or `->except([...])` loses the related model's `#[TsCasts]` or `@property` types | Nothing. This is automatic when the relation resolves to a single model and every filtered key is a database column                                   | `Pick<Model, 'a' \| 'b'>`, which reuses the model's own interface. `except()` picks every other column. See [API Resources § Relation Filters](./api-resources.md#relation-filters)                              |
| An accessor or relation is missing from an inlined `$this->relation->except([...])`                             | Name it: switch that key to `only([...])`, or give it its own entry in `toArray()`                                                                    | The key comes back. An inlined `except()` expands to database columns only, which matches what `Model::except()` returns at runtime. See [API Resources § Relation Filters](./api-resources.md#relation-filters) |
| An accessor publishes `unknown[]` from a vague `Attribute<array, never>` or a bare `: array` getter             | Nothing. The getter body is read when the signature and the docblock are both vague                                                                   | The shape the getter returns. See [Accessor Getter Bodies](#accessor-getter-bodies)                                                                                                                              |
| A query-selected attribute (`selectRaw('… as rank')`) has no column, cast or accessor behind it                 | A class-level `@property` or `@property-read` tag naming it                                                                                           | The tag's type wherever a resource or another published type reads the attribute. The tag doesn't add the attribute to the model's own interface, which lists only what the schema and casts declare             |
| A nullable docblock generic (`?Alias`, `Attribute<?array<int, int>, never>`) publishes `unknown`                | Nothing. A leading `?` is read as `\| null`                                                                                                           | The type with `\| null`. See [Nullable and Intersection Docblock Types](#nullable-and-intersection-docblock-types)                                                                                               |

If a property still publishes `unknown`, open an issue on the [package's GitHub issue tracker](https://github.com/abetwothree/laravel-ts-publish/issues) with the PHP and the generated TypeScript.

## PHPDoc Descriptions

The package reads doc blocks and turns their descriptions into JSDoc comments:

| Location    | Source                                        | JSDoc Placement                          |
| ----------- | --------------------------------------------- | ---------------------------------------- |
| Model class | Doc block above the class                     | Above the `export interface` declaration |
| Columns     | Doc block above the column's accessor method  | Above the column property                |
| Mutators    | Doc block above the mutator's accessor method | Above the mutator property               |
| Relations   | Doc block above the relation method           | Above the relation property              |

For columns and mutators, the package checks the new-style accessor (`protected function name(): Attribute`) before the old-style one (`public function getNameAttribute()`). Tag lines such as `@param`, `@return` and `@phpstan-type` are removed, so only the prose description carries over. These doc blocks become the JSDoc comments in the [Anatomy of a Generated Model](#anatomy-of-a-generated-model) example:

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

## Enum-Typed Columns (`{Model}Resource`)

A column or accessor typed as a backed or unit enum publishes in two ways:

- **The main interface**: `User` uses the enum's `{Enum}Type` union, which is how Laravel serializes the enum when it converts a model to JSON.
- **A parallel `Resource` interface**: `{Model}Resource` types the same property as [`AsEnum<typeof Enum>`](./enums.md#type-reference), and the split template adds `{Model}MutatorsResource` for accessors and `{Model}AllResource`. `AsEnum` is the shape you get once the raw value is a full enum instance, either from `Status.from(user.status)` or from an API resource that serialized the enum with [`EnumResource`](./enum-api-resource.md).

A property is rewritten only when its type is a single enum or a list of one, either optionally `| null`. A list becomes `AsEnum<typeof Enum>[]`. A shape, or a union with other types, keeps its own type.

This helper resolves the raw `role` value into the type `UserResource` declares:

```typescript
import { Role } from "@js/types/data/app/enums";
import type { User, UserResource } from "@js/types/data/app/models";

function displayRole(user: User) {
  const resolved: UserResource["role"] = user.role
    ? Role.from(user.role)
    : null;
  // resolved?.name, resolved?.value, etc.: a full enum instance, not only the raw value
}
```

::: warning
The `Resource` interfaces, and the `AsEnum` import, are generated only when `enums.use_tolki_package` is `true`, which is the default. Set it to `false` and enum columns use `{Enum}Type` everywhere.
:::

## Timestamps as Date Objects

Date and timestamp columns (`date`, `datetime`, `timestamp` and their immutable variants) publish as `string` by default. Set `timestamps_as_date` to `true` to publish them as `Date`:

```php
// config/ts-publish.php
'timestamps_as_date' => true,
```

The setting changes every date column:

| Config Value      | Generated Type       |
| ----------------- | -------------------- |
| `false` (default) | `created_at: string` |
| `true`            | `created_at: Date`   |

## Custom TypeScript Type Mappings

To change how a type publishes everywhere, add it to `custom_ts_mappings`. Keys are matched case-insensitively, and your entries take precedence over the built-in map:

```php
// config/ts-publish.php
'custom_ts_mappings' => [
    'binary' => 'Blob',
    'json' => 'Record<string, unknown>', // overrides the default 'object' mapping
    'money' => 'number',                  // adds a new mapping
],
```

::: tip
To change one property instead of every column of a type, use [`#[TsCasts]`](#tscasts) or [`#[TsType]`](#tstype).
:::

::: warning A Bare `tinyint` Is Now `number`
Only `tinyint(1)` publishes as `boolean`. It's what Laravel's `boolean()` column creates on MySQL and SQLite, so real boolean columns are unaffected. A column created with `tinyInteger()` used to publish as [`boolean`](#booleans) and now publishes as [`number`](#numbers).

The same change fixes some real boolean columns. Their sized `tinyint(1)` type didn't match the map before, so they published as `number`, and they now publish as `boolean`.

If you compare a `tinyInteger()` column with `=== true`, or use it directly in a condition, compare it with a number instead. TypeScript flags every place that needs the change.
:::

::: warning The `As*ArrayObject` Casts Also Allow Arrays
`AsArrayObject`, `AsEncryptedArrayObject` and `AsEnumArrayObject` publish as [`unknown[] | Record<string, unknown>`](#arrays-objects) instead of `Record<string, unknown>` alone. An `ArrayObject` filled from a list serializes as a JSON array, so the old type rejected valid payloads from your API.

Narrow the value before you treat it as an object: `Object.keys(x.meta)` no longer compiles on its own, so check `Array.isArray(x.meta)` first. You can also pin the property to the shape your column holds with [`#[TsCasts]`](#tscasts).
:::

## Type Mapping Reference

The package maps database column types and casts to these TypeScript types by default.

<div class="collection-method-list" markdown="1">

[Numbers](#numbers) [Booleans](#booleans) [Strings](#strings) [Arrays &amp; Objects](#arrays-objects) [Dates &amp; Times](#dates-times) [Other](#other)

</div>

### Numbers

`bigint`, `decimal`, `double`, `double precision`, `float`, `integer`, `int`, `numeric`, `number`, `mediumint`, `smallint`, `year`, `real`, `money`, `smallmoney`, `serial`, `bigserial`, `smallserial` → **`number`**

A bare `tinyint`, as created by `tinyInteger()` on MySQL and SQL Server, is also **`number`**. Only `tinyint(1)`, the type Laravel's `boolean()` column has on MySQL and SQLite, means boolean. See [Booleans](#booleans).

### Booleans

`bool`, `boolean`, `bit`, `tinyint(1)` → **`boolean`**

### Strings

`char`, `character`, `enum`, `longtext`, `mediumtext`, `string`, `text`, `varchar`, `encrypted`, `uuid`, `guid`, `hashed`, `time`, `timetz`, `timestamptz`, `numeric-string` → **`string`**

Sized, binary and legacy database types publish the same way: `tinytext`, `binary`, `varbinary`, `blob`, `bytea`, `tinyblob`, `mediumblob`, `longblob`, `nvarchar`, `nchar`, `ntext`, `xml`, `interval`, `uniqueidentifier` and `datetimeoffset` → **`string`**. `set(…)` is also a `string`, not an array, because MySQL returns a matched `SET` as a comma-separated string. So are the Postgres and MySQL network and full-text types: `inet`, `cidr`, `macaddr`, `macaddr8` and `tsvector`.

### Arrays & Objects

| Cast                                                               | TypeScript Type                        |
| ------------------------------------------------------------------ | -------------------------------------- |
| `array`, `collection`, `iterable`                                  | `unknown[]`                            |
| `AsCollection`, `AsEncryptedCollection`, `AsEnumCollection` (bare) | `unknown[]`                            |
| `AsArrayObject`, `AsEncryptedArrayObject`, `AsEnumArrayObject`     | `unknown[] \| Record<string, unknown>` |
| `json`, `jsonb`, `object`                                          | `object`                               |
| `Illuminate\Database\Eloquent\Collection`                          | `Record<string, unknown>`              |
| `Illuminate\Support\Collection`                                    | `unknown[] \| Record<string, unknown>` |
| `Illuminate\Database\Eloquent\Casts\AsFluent`                      | `object`                               |

The three `As*ArrayObject` casts hold an `ArrayObject`, which serializes a list as a JSON array and anything else as an object, so the type allows both shapes.

The `unknown[]` collection row is the bare form. `AsEnumCollection::of(...)`, `AsCollection::of(...)` and `AsCollection::using(...)` publish the mapped element's type instead. See [Typing Castable-With-Arguments Casts](#typing-castable-with-arguments-casts).

A parameterized docblock generic in `@return`, `@property` or `Attribute<>` publishes a more specific type, based on its key type. Every container behaves the same way for a given key type:

| Key type             | Emitted                    | Containers                                            |
| -------------------- | -------------------------- | ----------------------------------------------------- |
| `int`, or omitted    | `X[]`                      | `list<X>`, `array<…>`, `iterable<…>`, `Collection<…>` |
| `string`             | `Record<string, X>`        | `array<…>`, `iterable<…>`, `Collection<…>`            |
| `array-key`, `mixed` | `X[] \| Record<string, X>` | `array<…>`, `iterable<…>`, `Collection<…>`            |

`list<X>` has no key type, so it always publishes as `X[]`. A container with no generic at all, such as a bare `Collection`, uses the [Arrays & Objects](#arrays-objects) table above instead.

A collection chain on a relation, such as `->sortBy()`, `->pluck($value, $key)` or `->take()`, publishes as `X[] | Record<string, X>` whatever its declared type, because those methods can leave the keys out of order. It narrows to `X[]` when the chain ends with keys that count up from 0. A trailing `->values()` does that, and so does a `->take()` from the front of a collection whose keys are already sequential.

### Dates & Times

`date`, `immutable_date`, `datetime`, `immutable_datetime`, `immutable_custom_datetime`, `timestamp`, `datetime2`, `smalldatetime`, and `Carbon`, `CarbonImmutable` or `Illuminate\Support\Carbon` casts all follow [`timestamps_as_date`](#timestamps-as-date-objects) → **`string`** (default) or **`Date`**. `datetime2` is what SQL Server's `dateTime($precision)` and `timestamp($precision)` create when you give a precision. It's the same kind of column as a bare `datetime`, so it follows the same setting, and `smalldatetime` does too.

### Other

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

A spatial column's JSON shape depends on how your app reads it. Raw WKB is a binary string, and `ST_AsGeoJSON()` returns an object, so the package publishes `unknown` instead of guessing. MySQL's `geometry(subtype: '...')` reports the subtype as the column type, so `point`, `linestring`, `polygon`, `geometrycollection`, `multipoint`, `multilinestring` and `multipolygon` all publish as **`unknown`** for the same reason. A `vector` column comes from pgvector or MySQL 9, which both serialize it as a JSON array of floats.

## Filtering & Excluding Models

Models use the same include and exclude settings as enums and resources:

```php
// config/ts-publish.php
'models' => [
    'included' => [App\Models\User::class],        // only these (empty = all)
    'excluded' => [App\Models\Pivot::class],         // never publish these
    'additional_directories' => ['modules/Blog/Models'],
],
```

A relation that points at a model outside `included`, or at an `excluded` model, is left out of the relations interface, and a `morphTo()` union drops those models too.

`#[TsExclude]` on the model class excludes the whole model. On an accessor or relation method, it excludes only that property:

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

See [Excluding Content](./excluding-content.md) for how `#[TsExclude]` works across models, enums, resources and routes.

The [model metadata](./model-metadata.md) phase inherits these three settings unless you set the matching `model_metadata.*` key.

## Casing

`models.relationship_case` sets the casing of relation names: `'snake'` (default), `'camel'` or `'pascal'`. The `_count` and `_exists` suffixes are added to the cased name as they are:

| Config Value | Relation (`hasMany(Post::class)`) | Count               | Exists               |
| ------------ | --------------------------------- | ------------------- | -------------------- |
| `'snake'`    | `owned_teams: Team[]`             | `owned_teams_count` | `owned_teams_exists` |
| `'camel'`    | `ownedTeams: Team[]`              | `ownedTeams_count`  | `ownedTeams_exists`  |
| `'pascal'`   | `OwnedTeams: Team[]`              | `OwnedTeams_count`  | `OwnedTeams_exists`  |

## Configuration Reference

The [Configuration Reference](./configuration-reference.md) lists every `models.*` config key, including the pipeline class overrides for advanced customization.
