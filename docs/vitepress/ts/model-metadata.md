# Model Metadata

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can publish a small runtime companion beside each generated model interface. The companion, `{model}_meta.ts`, exports a `{Model}ModelMetadata` object whose values come from a provider class you control. The default provider publishes the model's morph class, so the frontend can build polymorphic payloads such as `commentable_type` without hard-coding PHP class names.

A [model interface](./models.md) is type-only and disappears at compile time. A companion is a real module you read at runtime, so the frontend can use values the backend owns instead of hard-coding them. Companions count as functional output, so the [Vite plugin](./vite-plugin.md#production-builds) regenerates them on `vite build`, and they don't need the `@tolki/ts` runtime.

## How Model Metadata Is Generated

Model metadata is its own publishing feature:

- **Separate settings**: the feature is configured under `model_metadata.*` and is off by default. `models.enabled` and `--only-models` control model interfaces only. `model_metadata.enabled` and `--only-model-metadata` control companions, and `--only-functional` includes them.
- **The same models**: the feature finds the same models as model publishing, and inherits `models.included`, `models.excluded` and `models.additional_directories` unless you set the matching `model_metadata.*` key. A value you set wins, even an empty array.
- **One provider call per model**: the provider's `provide(Model $model)` receives a model instance from the container, not a record from the database, and returns the payload. The package runs `provide()` to get the values, and reads its docblock and code to type them. See [How Each Key Is Typed](#how-each-key-is-typed).
- **One file per model**: `{model}_meta.ts` is written beside the model interface, and the namespace's `index.ts` barrel exports it. See [Barrels](#barrels).

## Anatomy of a Generated Companion

The `model_metadata` block ships with `'enabled' => false`, so turn it on in your config:

```php
// config/ts-publish.php
'model_metadata' => [
    'enabled' => true,
],
```

With the default provider, each companion holds the model's morph class:

```typescript
// resources/js/types/data/app/models/user_meta.ts
export const UserModelMetadata = {
  morphClass: "App\\Models\\User",
} as const satisfies {
  morphClass: string;
};
```

The companion follows a few rules:

- **Names**: the export is `{Model}ModelMetadata`, and the file is `{kebab-model}_meta.ts`. The underscore keeps a companion from colliding with a model interface file: a `UserMeta` model publishes `user-meta.ts`, while `User`'s companion is `user_meta.ts`. [Limits](#limits) covers the one exception.
- **Literal types**: `as const` keeps every value a literal type, and `satisfies` checks the object against the declared or inferred types without widening it.
- **The morph class**: the default provider publishes one key, `morphClass`, which holds what `getMorphClass()` returns. That's the model's class name, or its alias once you register a morph map. With `Relation::morphMap(['user' => User::class])`, the value is `'user'`. A numeric alias publishes as a string, because the default provider casts `getMorphClass()` to `string`, so there's no integer mode. Under `Relation::enforceMorphMap()`, a model missing from the map fails its companion. See [Failures](#failures).

On the frontend, read the value instead of typing the PHP class name by hand:

```typescript
import { UserModelMetadata } from "@js/types/data/app/models";

form.commentable_type = UserModelMetadata.morphClass;
```

::: tip Adding the Block to an Existing Config
A `config/ts-publish.php` published before this feature has no `model_metadata` block. Laravel merges package config one level deep, so a block you add replaces the package's defaults for that block. Copy the whole block from the package config rather than only the key you need. Nothing breaks if you skip it, because every key falls back to its default in code.
:::

## Writing a Provider

A provider implements `AbeTwoThree\LaravelTsPublish\Metadata\Contracts\ModelMetadataProvider`. Laravel's container resolves it, so constructor dependencies work, and one provider serves every published model:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;
use AbeTwoThree\LaravelTsPublish\Metadata\Contracts\ModelMetadataProvider;
use Illuminate\Database\Eloquent\Model;

final class AppModelMetadataProvider implements ModelMetadataProvider
{
    /**
     * @return array{
     *     morphClass: string,
     *     identifiers: array{primaryKey: string, routeKey: string},
     *     flags: array<string, bool>,
     * }
     */
    #[TsCasts([
        'identifiers' => ['type' => 'ModelIdentifiers', 'import' => '@/types/model-identifiers'],
    ])]
    public function provide(Model $model): array
    {
        return [
            'morphClass' => (string) $model->getMorphClass(),
            'identifiers' => [
                'primaryKey' => $model->getKeyName(),
                'routeKey' => $model->getRouteKeyName(),
            ],
            'flags' => [],
        ];
    }
}
```

Point `model_metadata.provider_class` at your class. The published config ships the key as a commented line, so uncomment it:

```php
// config/ts-publish.php
'model_metadata' => [
    'enabled' => true,
    'template' => 'laravel-ts-publish::model-meta',
    'provider_class' => App\TypeScript\AppModelMetadataProvider::class,
],
```

Prefer a precise `@return array{...}` shape. PHPStan or Psalm checks the contract, and the package publishes the same shape. The published config names no classes of its own. Every `*_class` key, `provider_class` included, is a commented line that shows what you can swap, and the default applies in code.

## How Each Key Is Typed

Each returned key's TypeScript type comes from the first of these that applies:

1. **`#[TsCasts]` on `provide()`**: an explicit type, and the only way to point a key at an import path of your own. `['type' => 'X', 'import' => '@/types/x']` imports `X`, and `'optional' => true` marks the key optional.
2. **The `@return array{...}` shape**: `key?:` marks an optional key, and every other key must be in every payload. Scalars, containers such as `array<string, T>` (published as `Record<string, T>`) and `list<T>` (published as `T[]`), and nested shapes all work.
3. **The method body**: the package reads the returned array literal, with `$model` typed as its declared class. These need no annotation:
   - Scalars, casts such as `(string) …`, and nested inline arrays
   - Calls on `$model` whose Laravel signature or docblock declares a return type, such as `getTable()`, `getKeyName()`, `getRouteKeyName()` and `getMorphClass()`, which all publish as `string`
   - Enum values, which import their `{Name}Type` alias from the generated enums, the same as a `#[TsCasts]` import would

   When the body's type for a key still contains `unknown`, the package ignores it, and the key needs a docblock or `#[TsCasts]` type. A helper with no declared return type, such as `private function tableFor($model)`, is that case.

Marking a key optional decides whether the payload has to return it, not how the key is written once it's returned. The `satisfies` type lists exactly the keys the payload returned, each one required.

Two kinds of value always need `#[TsCasts]`. The first is a class or enum named in the docblock, because a docblock string carries no import path. The second is any value typed as a model or a resource. A metadata value doesn't have to match either interface, so the package never imports one for it.

Every returned key must end up with a type, and every required key must be returned. Otherwise the companion fails, and the error names the model and the keys.

## Values

A provider can return these values:

- `null`, scalars and arrays
- Enums: a backed enum publishes its value, and a pure enum its name
- `stdClass` objects
- Objects that implement `Arrayable` or `JsonSerializable`

The payload's top-level keys must be strings. Nested values follow the same value rules.

Instead of writing invalid TypeScript, the companion fails, naming the model and the property path (such as `property [limits.maximum]`), when a value is:

- A closure, or any other object
- A float that isn't finite
- An integer outside JavaScript's safe range (±2⁵³−1), which you can return as a string instead
- A circular object
- An array nested more than 64 levels deep

Floats are written at full round-trip precision.

### Empty Containers

PHP can't tell an empty list from an empty object, and TypeScript rejects `[]` where an object or `Record<…>` type is declared. Two rules cover it:

- Return `(object) []` or `new stdClass` for an empty object.
- A bare `[]` publishes as `{}` wherever its type is an object literal, an index signature or a `Record<…>`, and as `[]` everywhere else. That includes a key typed with an imported `#[TsCasts]` type, which the package can't look inside.

## Barrels

Companions share their namespace directory's `index.ts` barrel with the model interfaces. [Barrel Files](./modular-publishing.md#barrel-files) lists which exports each run keeps.

## Failures

A provider that throws for one model doesn't stop the run. The common case is `Relation::enforceMorphMap()` with a model missing from the map. Every other file is written, and that model keeps its previous `{model}_meta.ts` and barrel export as the last good version. The command then reports each failure and exits non-zero. Under `--quiet`, the failures go to stderr, so CI and the [Vite plugin](./vite-plugin.md) still see them, and a failing companion fails `vite build`. Use `model_metadata.excluded` for models you deliberately don't map. A `--source` run stops at the first failure.

The package checks the provider, generator and transformer classes before it writes any file, so a misconfigured `provider_class` fails early instead of leaving a half-published directory.

## Filtering & Excluding

The feature takes the same finder settings as models:

```php
// config/ts-publish.php
'model_metadata' => [
    'enabled' => true,
    // Omitted finder settings inherit from models.*; a value you set wins, even [].
    'included' => [App\Models\User::class],
    'excluded' => [App\Models\Pivot::class],
],
```

`#[TsExclude]` on a model class excludes both its interface and its companion. See [Excluding Content](./excluding-content.md).

## Cache

Companions take part in [cache generation](./generating-cache.md). The provider's file counts as a dependency of each companion, and a custom provider's file is also watched, so editing it republishes during `vite dev`. The package also hashes each model's provider payload, so a morph-map change or a new value republishes exactly the affected companions without `--fresh`. The hash covers the raw payload that `provide()` returns, and an object value is hashed by its own properties. If an object's `toArray()` depends on anything else, return an array instead.

## Limits

Two cases aren't handled for you:

- An enum that a provider body returns is imported from the generated enums even when you exclude that enum from enum publishing. The companion then fails `tsc` with a missing module or member. Include the enum, or type the key with an import-aware `#[TsCasts]`.
- A model named with an underscore, such as `User_meta`, gets the same file name as the `User` companion. PSR-1 class names don't use underscores, so the package doesn't guard against this.

## Customizing the Pipeline

`model_metadata.provider_class` is the extension point most apps need. The feature also has the standard swappable classes, `collector_class`, `generator_class`, `transformer_class` and `writer_class`, and a `template` key (`laravel-ts-publish::model-meta`) for the Blade view that renders the companion. A custom generator or transformer must extend the package's default. See [Customizing the Pipeline](./customizing-the-pipeline.md).

## Configuration Reference

The [Configuration Reference](./configuration-reference.md#model-metadata-model-metadata) lists every `model_metadata.*` key.
