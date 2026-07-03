# Excluding Content

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can exclude a specific enum, model, resource, form request, broadcast event, or controller — or one of their individual methods, accessors, relations, or actions — from the TypeScript output entirely, using the `#[TsExclude]` attribute.

As mentioned in [Installation & Usage](./index.md), this is a lightweight, attribute-only mechanism — there's no runtime component from `@tolki/ts` involved.

## `#[TsExclude]` Attribute

```php
namespace AbeTwoThree\LaravelTsPublish\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class TsExclude {}
```

It takes no parameters — applying it to a class or method is enough to exclude that target. It can be placed on:

| Target                 | Effect                                                             |
|------------------------|-----------------------------------------------------------------------|
| Enum class             | Entire enum is excluded from collection and publishing                |
| Enum method            | Method is excluded from the TypeScript output                         |
| Model class            | Entire model is excluded from collection and publishing               |
| Model accessor         | Mutator/accessor is excluded from the TypeScript output                |
| Model relation         | Relation is excluded from the TypeScript output                        |
| Resource class         | Entire resource is excluded from collection and publishing             |
| Form Request class     | Entire form request is excluded from collection and publishing         |
| Broadcast Event class  | Entire broadcast event is excluded from collection and publishing      |
| Controller class       | Entire controller is excluded from collection and publishing           |
| Controller action      | The action is excluded from the generated route file                   |

> [!NOTE]
> `#[TsExclude]` always wins. Even when an explicit inclusion attribute like `#[TsEnumMethod]` or `#[TsEnumStaticMethod]` is also present, or when `enums.auto_include_methods` / `enums.auto_include_static_methods` would otherwise include a method automatically, `#[TsExclude]` takes priority and the member is left out.

## How It's Enforced

Every collector for a per-class type (enums, models, resources, form requests, broadcast events, controllers) extends the shared `CoreCollector`, which filters out any class carrying `#[TsExclude]` **before** it's ever handed to a transformer — an excluded class is never analyzed, never written to disk, and never appears in a barrel `index.ts`. This is why class-level exclusion has no config equivalent: there's nothing partial about it.

Method/accessor/relation/action-level exclusion is checked independently by each transformer, on the specific reflected method — this is what allows the rest of the class to publish normally while one member is omitted.

Broadcast Channels is the one feature that does **not** support `#[TsExclude]` — it collects plain channel-name strings from `routes/channels.php` rather than reflecting PHP classes, so there's no class or method to attach the attribute to. See [Broadcast Channels](./broadcast-channels.md#no-per-channel-attributes) for how to omit a channel instead.

## Excluding an Entire Class

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

#[TsExclude]
enum ExcludedEnum: string
{
    case Foo = 'foo';
    case Bar = 'bar';
}
```

`ExcludedEnum` is skipped entirely during collection — it never appears in any generated `.ts` file, and it's absent from the enums barrel `index.ts`. The same applies to models, resources, form requests, broadcast events, and controllers:

```php
#[TsExclude]
class ExcludedModel extends Model
{
    // Entirely excluded from collection and publishing.
}

#[TsExclude]
class InternalResource extends JsonResource
{
    // Entirely excluded from collection and publishing.
}

#[TsExclude]
class InternalRequest extends FormRequest
{
    // Entirely excluded from collection and publishing.
}

#[TsExclude]
class InternalDebugEvent implements ShouldBroadcast
{
    // Entirely excluded from collection and publishing.
}

#[TsExclude]
class ExcludedController
{
    public function index(): void {}

    // No routes for this controller are published, regardless of this method.
}
```

## Excluding Enum Methods

`#[TsExclude]` on a method wins even when the method also carries an explicit inclusion attribute:

```php
enum ExcludableEnum: string
{
    case Alpha = 'alpha';
    case Beta = 'beta';

    /** Included — no exclusion attribute */
    public function label(): string
    {
        return match ($this) {
            self::Alpha => 'Alpha Label',
            self::Beta => 'Beta Label',
        };
    }

    /** Excluded via #[TsExclude] — should not appear in TS output */
    #[TsExclude]
    public function secret(): string
    {
        return 'hidden';
    }

    /** Excluded — #[TsExclude] wins over #[TsEnumMethod] */
    #[TsEnumMethod]
    #[TsExclude]
    public function overridden(): string
    {
        return 'should not appear';
    }

    /** Excluded via #[TsExclude] — should not appear in TS output */
    #[TsExclude]
    public static function internalOnly(): array
    {
        return ['internal'];
    }

    /** Excluded — #[TsExclude] wins over #[TsEnumStaticMethod] */
    #[TsEnumStaticMethod]
    #[TsExclude]
    public static function overriddenStatic(): array
    {
        return ['should not appear'];
    }
}
```

Generates (with `enums.auto_include_methods` off, the default):

```typescript
import { defineEnum } from '@tolki/ts';

export const ExcludableEnum = defineEnum({
    Alpha: 'alpha',
    Beta: 'beta',
    backed: true,
    _cases: ['Alpha', 'Beta'],
} as const);

export type ExcludableEnumType = 'alpha' | 'beta';
export type ExcludableEnumKind = 'Alpha' | 'Beta';
```

`overridden()` and `overriddenStatic()` both carry an explicit `#[TsEnumMethod]` / `#[TsEnumStaticMethod]` attribute — which would normally include them regardless of the `auto_include` config — but since they're *also* decorated with `#[TsExclude]`, neither appears in the output at all. See [Enums](./enums.md) for the full method-inclusion behavior.

## Excluding Model Accessors and Relations

```php
class ExcludableModel extends Model
{
    /** Included mutator — should appear in TS output */
    protected function displayName(): Attribute
    {
        return Attribute::make(get: fn (): string => strtoupper($this->name ?? ''));
    }

    /** Excluded mutator — should NOT appear in TS output */
    #[TsExclude]
    protected function secretToken(): Attribute
    {
        return Attribute::make(get: fn (): string => 'hidden-token');
    }

    /** Included relation — should appear in TS output */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'user_id');
    }

    /** Excluded relation — should NOT appear in TS output */
    #[TsExclude]
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'user_id');
    }

    /** Excluded old-style mutator — should NOT appear in TS output */
    #[TsExclude]
    public function getLegacyTokenAttribute(): string
    {
        return 'old-style-hidden';
    }
}
```

Generates:

```typescript
export interface ExcludableModel
{
    id: number;
    name: string;
    // ... remaining database columns
}

export interface ExcludableModelMutators
{
    /** Included mutator — should appear in TS output */
    display_name: string;
}

export interface ExcludableModelRelations
{
    // Relations
    /** Included relation — should appear in TS output */
    posts: Post[];
    // Counts
    posts_count: number;
    // Exists
    posts_exists: boolean;
}
```

`secretToken` and `comments` are both absent from `ExcludableModelMutators` / `ExcludableModelRelations`, and `getLegacyTokenAttribute` — the **old-style** `get{Name}Attribute()` accessor convention — is excluded the same way as the modern `Attribute::make()` style. See [Models](./models.md) for the full accessor/relation resolution rules.

## Excluding Controller Actions

```php
class ExcludableController
{
    /** This action is included */
    public function show(): void
    {
        // ...
    }

    /** This action is excluded */
    #[TsExclude]
    public function secret(): void
    {
        // ...
    }
}
```

Generates:

```typescript
import { defineRoute } from '@tolki/ts';

/** This action is included */
export const show = defineRoute({
    name: 'excludable.show',
    url: '/excludable/{id}',
    methods: ['get'] as const,
    args: [{ name: 'id', required: true }] as const,
});

/** @see Workbench\App\Http\Controllers\ExcludableController */
const ExcludableController = {
    show,
};

export default ExcludableController;
```

The `secret` action is entirely absent from the generated controller file, while `show` publishes normally. See [Routing](./routing.md#filtering--excluding-routes) for the full route-filtering reference (name patterns, middleware exclusion, and named-routes-only mode).

## Configuration Reference

`#[TsExclude]` has no config equivalent — it's an attribute-only mechanism. For the broader `included` / `excluded` / `additional_directories` filtering options available per feature, see that feature's own documentation ([Enums](./enums.md), [Models](./models.md), [API Resources](./api-resources.md), [Form Requests](./form-requests.md), [Broadcast Events](./broadcast-events.md), [Routing](./routing.md#filtering--excluding-routes)) or the [Configuration Reference](./configuration-reference.md).
