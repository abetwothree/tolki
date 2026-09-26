# Excluding Content

Add the `#[TsExclude]` attribute to keep a class out of the TypeScript output, or to leave out one of its methods, accessors, relations, or controller actions. It works on enums, models, resources, form requests, broadcast events, and controllers. It's a PHP attribute only. It has no config key, and there's nothing to set up in `@tolki/ts`.

## `#[TsExclude]` Attribute

The attribute takes no arguments, and it goes on a class or a method:

```php
namespace AbeTwoThree\LaravelTsPublish\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class TsExclude {}
```

This table shows what the attribute does on each target:

| Target                | Effect                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| Enum class            | The enum isn't published                                               |
| Enum method           | The method is left out of the enum's output                            |
| Model class           | The model isn't published, and neither is its model metadata companion |
| Model accessor        | The accessor is left out of the model's interfaces                     |
| Model relation        | The relation and its `_count` and `_exists` properties are left out    |
| Resource class        | The resource isn't published                                           |
| Form request class    | The form request isn't published                                       |
| Broadcast event class | The event isn't published                                              |
| Controller class      | None of the controller's routes are published                          |
| Controller action     | The action is left out of the controller's route file                  |

::: tip `#[TsExclude]` Always Wins
A method with `#[TsExclude]` is left out even when it also has `#[TsEnumMethod]` or `#[TsEnumStaticMethod]`. The same goes for a method that `enums.auto_include_methods` or `enums.auto_include_static_methods` would include.
:::

## What Gets Removed

A class with `#[TsExclude]` is skipped before anything else happens. The package never analyzes it and writes no file for it. It's also left out of barrel `index.ts` files and combined files, such as `broadcast-events.ts`. On a model, that includes the model's [model metadata](./model-metadata.md) companion.

On a method, accessor, relation, or action, the attribute removes only that member. The rest of the class publishes as usual.

To leave out classes without adding the attribute, use the feature's filtering config instead, such as `models.excluded`. See [Configuration Reference](#configuration-reference) below.

Broadcast channels don't support `#[TsExclude]`. A channel is a name string from `routes/channels.php`, not a PHP class, so there's nothing to put the attribute on. See [Broadcast Channels](./broadcast-channels.md#no-per-channel-attributes) for how to leave a channel out.

## Excluding an Entire Class

Put `#[TsExclude]` on the class:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

#[TsExclude]
enum ExcludedEnum: string
{
    case Foo = 'foo';
    case Bar = 'bar';
}
```

`ExcludedEnum` never appears in a generated file, and the enums barrel `index.ts` doesn't export it. Models, resources, form requests, broadcast events, and controllers work the same way:

```php
#[TsExclude]
class ExcludedModel extends Model
{
    // ...
}

#[TsExclude]
class InternalResource extends JsonResource
{
    // ...
}

#[TsExclude]
class InternalRequest extends FormRequest
{
    // ...
}

#[TsExclude]
class InternalDebugEvent implements ShouldBroadcast
{
    // ...
}

#[TsExclude]
class ExcludedController
{
    // None of this controller's routes are published, whatever its methods.
    public function index(): void {}
}
```

## Excluding Enum Methods

A method-level `#[TsExclude]` matters in two cases. With `enums.auto_include_methods` or `enums.auto_include_static_methods` on, public methods publish automatically, and the attribute opts one method back out. On a method that also has `#[TsEnumMethod]` or `#[TsEnumStaticMethod]`, the exclusion still wins:

```php
enum ExcludableEnum: string
{
    case Alpha = 'alpha';
    case Beta = 'beta';

    public function label(): string
    {
        return match ($this) {
            self::Alpha => 'Alpha Label',
            self::Beta => 'Beta Label',
        };
    }

    #[TsExclude]
    public function secret(): string
    {
        return 'hidden';
    }

    #[TsEnumMethod]
    #[TsExclude]
    public function overridden(): string
    {
        return 'should not appear';
    }

    #[TsEnumStaticMethod]
    #[TsExclude]
    public static function overriddenStatic(): array
    {
        return ['should not appear'];
    }
}
```

With `enums.auto_include_methods` off, which is the default, this generates:

```typescript
import { defineEnum } from "@tolki/ts";

export const ExcludableEnum = defineEnum({
  Alpha: "alpha",
  Beta: "beta",
  backed: true,
  _cases: ["Alpha", "Beta"],
} as const);

export type ExcludableEnumType = "alpha" | "beta";
export type ExcludableEnumKind = "Alpha" | "Beta";
```

`overridden()` and `overriddenStatic()` have attributes that would include them whatever the auto-include settings, but `#[TsExclude]` removes them. `label()` and `secret()` are missing because auto-include is off. Turn on `enums.auto_include_methods`, and `label()` publishes while `secret()` stays out. See [Auto-Including All Enum Methods](./enums.md#auto-including-all-enum-methods) for which methods auto-include adds.

## Excluding Model Accessors and Relations

Put `#[TsExclude]` on the accessor or relation method:

```php
class ExcludableModel extends Model
{
    /** The name shown in the UI. */
    protected function displayName(): Attribute
    {
        return Attribute::make(get: fn (): string => strtoupper($this->name ?? ''));
    }

    #[TsExclude]
    protected function secretToken(): Attribute
    {
        return Attribute::make(get: fn (): string => 'hidden-token');
    }

    /** The posts this user wrote. */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'user_id');
    }

    #[TsExclude]
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'user_id');
    }

    #[TsExclude]
    public function getLegacyTokenAttribute(): string
    {
        return 'old-style-hidden';
    }
}
```

This generates:

```typescript
export interface ExcludableModel {
  id: number;
  name: string;
  // ... remaining database columns
}

export interface ExcludableModelMutators {
  /** The name shown in the UI. */
  display_name: string;
}

export interface ExcludableModelRelations {
  // Relations
  /** The posts this user wrote. */
  posts: Post[];
  // Counts
  posts_count: number;
  // Exists
  posts_exists: boolean;
}
```

`secretToken` and `comments` are missing from `ExcludableModelMutators` and `ExcludableModelRelations`, and so are `comments_count` and `comments_exists`. `getLegacyTokenAttribute()` uses the old `get{Name}Attribute()` accessor style, and the attribute leaves it out the same way as an `Attribute::make()` accessor. See [Models](./models.md) for how accessors and relations publish.

## Excluding Controller Actions

Put `#[TsExclude]` on the action method:

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

This generates:

```typescript
import { defineRoute } from "@tolki/ts";

/** This action is included */
export const show = defineRoute({
  name: "excludable.show",
  url: "/excludable/{id}",
  methods: ["get", "head"] as const,
  args: [{ name: "id", required: true }] as const,
});

/** @see App\Http\Controllers\ExcludableController */
const ExcludableController = {
  show,
};

export default ExcludableController;
```

The `secret` action is missing from the generated file, and `show` publishes as usual. See [Routing](./routing.md#filtering-excluding-routes) for the other ways to filter routes: name patterns, middleware exclusion, and publishing only named routes.

## Configuration Reference

`#[TsExclude]` has no config key. Each feature also has its own filtering settings, such as `included`, `excluded`, and `additional_directories`. See the filtering section for [enums](./enums.md#filtering-excluding-enums), [models](./models.md#filtering-excluding-models), [API resources](./api-resources.md#filtering-excluding), [form requests](./form-requests.md#filtering-excluding-form-requests), [broadcast events](./broadcast-events.md#filtering-excluding), and [routes](./routing.md#filtering-excluding-routes), or the [Configuration Reference](./configuration-reference.md).
