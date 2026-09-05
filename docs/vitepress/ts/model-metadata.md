# Model Metadata

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can publish a small runtime companion beside each generated model interface: `{model}_meta.ts`, exporting a `{Model}ModelMetadata` object whose values come from a provider class you control. The default provider publishes the model's morph class, so the frontend can build polymorphic payloads (`commentable_type`) without hard-coding PHP class names.

Unlike [model interfaces](./models.md), which are type-only and erased at compile time, a companion is a real runtime module. It counts as _functional_ output — the [Vite plugin](./vite-plugin.md) regenerates it on `vite build` alongside enums and routes — and it needs no `@tolki/ts` runtime.

## How Model Metadata Is Generated

- Model metadata is its own publishing phase, configured under `model_metadata.*` and **disabled by default**. `models.enabled` and `--only-models` control model interfaces only; `model_metadata.enabled` and `--only-model-metadata` control companions; `--only-functional` includes them.
- `ModelMetadataCollector` extends `ModelsCollector`, so it discovers the same classes and inherits `models.included`, `models.excluded`, and `models.additional_directories` unless the matching `model_metadata.*` key is set — an explicitly configured value wins, including an empty array.
- For each model, the configured provider's `provide(Model $model)` receives a model instance (resolved through the container, not loaded from the database) and returns the payload. Values are normalized at runtime; types are resolved statically — see [Types](#types-body-inference-docblock-and-tscasts).
- One `{model}_meta.ts` is written beside the model interface, and the namespace's barrel `index.ts` exports it — see [Barrels](#barrels).

## Anatomy of a Generated Companion

```php
// config/ts-publish.php — the block ships with 'enabled' => false; this is the one key to flip
'model_metadata' => [
    'enabled' => true,
],
```

```typescript
// resources/js/types/data/app/models/user_meta.ts
export const UserModelMetadata = {
  morphClass: "App\\Models\\User",
} as const satisfies {
  morphClass: string;
};
```

- The **export** is `{Model}ModelMetadata`; the **file** is `{kebab-model}_meta.ts`. The underscore is deliberate — `Str::kebab()` never produces one, so a companion can never collide with a model interface file (`UserMeta` → `user-meta.ts`; `User`'s companion → `user_meta.ts`).
- `as const` keeps every value a literal type; `satisfies` checks it against the declared or inferred shape without widening it.
- With a morph map (`Relation::morphMap(['user' => User::class])`) the value is the alias, `'user'`. A numeric alias is published as a string — the default provider casts `getMorphClass()` to `string`, so there is no integer mode. Under `Relation::enforceMorphMap()`, a model missing from the map fails its companion — see [Failures](#failures).

```typescript
import { UserModelMetadata } from "@js/types/data/app/models";

form.commentable_type = UserModelMetadata.morphClass;
```

> [!NOTE]
> The `model_metadata` block is new. Package defaults are merged one level deep, so when adding it to an already-published `config/ts-publish.php`, copy the **whole** block from the package config rather than a single key — every key has a fallback in code, but a partial block replaces the defaults it omits.

## Writing a Provider

A provider implements `AbeTwoThree\LaravelTsPublish\Metadata\Contracts\ModelMetadataProvider` and is resolved through Laravel's container, so constructor dependencies work. One provider serves every published model.

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

```php
// config/ts-publish.php — provider_class ships as a commented line; uncomment it with your class
'model_metadata' => [
    'enabled' => true,
    'template' => 'laravel-ts-publish::model-meta',
    'provider_class' => App\TypeScript\AppModelMetadataProvider::class,
],
```

Prefer a precise `@return array{...}` shape: PHPStan or Psalm validates the contract, and the generator uses the same shape. The published config file names no classes of its own — every `*_class` key, `provider_class` included, is a commented line showing what you can swap, and the default is applied in code.

## Types: Body Inference, Docblock, and `#[TsCasts]`

For each returned key the TypeScript type is the first available of:

1. **`#[TsCasts]` on `provide()`** — an explicit override, and the only way to point a key at an import path of your own. `['type' => 'X', 'import' => '@/types/x']` imports `X`; `'optional' => true` marks the key optional.
2. **The `@return array{...}` docblock shape.** `key?:` marks an optional key; every non-optional key must be present in every payload. Scalars, containers (`array<string, T>` → `Record<string, T>`, `list<T>` → `T[]`), and nested shapes are supported.
3. **Body inference.** The returned array literal is analyzed statically, with the `$model` parameter bound to its declared type, so no annotation is needed for:
   - scalars, casts (`(string) …`), and nested inline arrays;
   - calls on the model parameter whose Laravel signature or docblock declares a return type — `getTable()`, `getKeyName()`, `getRouteKeyName()`, and `getMorphClass()` all infer `string`;
   - enum values — an enum returned from the body imports its `{Name}Type` alias from the generated enums, exactly as a `#[TsCasts]` import would.

   A body-inferred type that still contains `unknown` is discarded, and the key then needs a docblock or `#[TsCasts]` type. A helper with no declared return type (`private function tableFor($model)`) is exactly that case.

Optionality decides whether the payload has to return the key, not how the key is spelled once it is returned: the `satisfies` shape lists exactly the keys the payload produced, each of them required.

Two shapes always need `#[TsCasts]`: a class or enum **named in the docblock** (a docblock string carries no import path), and any value typed as a **model** — a runtime metadata array need not satisfy the model's interface, so the generator refuses to import one.

Every returned key must end up with a type, and every required key must be returned; otherwise generation fails naming the model and the keys.

## Values

A value may be `null`, a scalar, an array, an enum (backed → its value, pure → its name), a `stdClass`, or an object implementing `Arrayable` or `JsonSerializable`. Values are normalized recursively. Generation fails — naming the model and the property path, e.g. `property [limits.maximum]` — instead of emitting invalid TypeScript for: any other object or a resource; a non-finite float; an integer outside JavaScript's safe range (±2⁵³−1 — return those as strings); a circular object; more than 64 nested array levels. Floats are emitted at full round-trip precision.

### Empty containers

PHP cannot tell an empty list from an empty object, and TypeScript rejects `[]` where a `Record<…>` or object shape is declared. Two rules cover it:

- Return `(object) []` (or `new stdClass`) for an empty object.
- A bare `[]` is emitted as `{}` wherever its resolved type is an object literal, index signature, or `Record<…>`, and as `[]` everywhere else — including under an imported `#[TsCasts]` alias, which cannot be inspected.

## Barrels

Companions live in the same namespace directory as model interfaces, so both phases share one barrel `index.ts`. Every export in it belongs to exactly one phase (`_meta` files are companions; nothing else is), and a run rebuilds the exports of each phase it publishes:

| Phase this run                                   | Its exports in the barrel                                        |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| Published                                        | Exactly what was generated — a removed model's export disappears |
| Enabled in config, skipped by an `--only-*` flag | Kept from the existing file                                      |
| Disabled in config                               | Dropped — turning metadata off prunes its companions             |
| Published, but one model's provider failed       | That model's previous companion export is kept                   |

Barrels are generated files: comments or hand-written lines in them are not preserved. `--source` runs never touch barrels — see [Modular Publishing](./modular-publishing.md#barrel-files).

## Failures

A provider that throws for one model — `Relation::enforceMorphMap()` with a model missing from the map is the common case — does **not** stop the run. Every other file is written, that model's previous `{model}_meta.ts` and barrel export are kept as last known good, and the command reports each failure and exits non-zero (on stderr under `--quiet`, so CI and the [Vite plugin](./vite-plugin.md) see it — a failing companion fails `vite build`). Use `model_metadata.excluded` for models you deliberately do not map. `--source` runs fail on the first exception.

The provider and generator classes are validated before any file is written, so a misconfigured `provider_class` fails fast rather than leaving a half-published directory.

## Filtering & Excluding

```php
// config/ts-publish.php
'model_metadata' => [
    'enabled' => true,
    // Omitted finder settings inherit from models.*; an explicit value overrides, including [].
    'included' => [App\Models\User::class],
    'excluded' => [App\Models\Pivot::class],
],
```

`#[TsExclude]` on a model class excludes its interface **and** its companion — the exclusion happens at collection, before either phase runs. See [Excluding Content](./excluding-content.md).

## Cache

Companions take part in [cache generation](./generating-cache.md). The provider's own file is recorded as a dependency, and a custom provider is added to the watched-file manifest too, so editing it republishes during `vite dev`. Beyond that, `ModelMetadataGenerator::cacheSignature()` hashes the provider's payload, so a morph-map change or a new value busts exactly the affected companions without `--fresh`. The hash covers the provider's _raw_ payload — an object value is fingerprinted by its own properties, so if its `toArray()` depends on anything else, return an array instead.

## Limits

- An enum a provider body returns is imported from the generated enums even when that enum is excluded from enum publishing; the companion then fails `tsc` with a missing module or member. Include the enum, or use an import-aware `#[TsCasts]`.
- A model class whose name contains an underscore (`User_meta`) kebabs to the same filename as another model's companion. PSR-1 names do not carry underscores, so this is accepted rather than guarded.

## Customizing the Pipeline

`model_metadata.provider_class` is the intended extension point. The phase also exposes the standard swappable classes — `collector_class`, `generator_class`, `transformer_class`, `writer_class` — and `template` (`laravel-ts-publish::model-meta`), the Blade view receiving the companion's data. The static type side (body inference, docblock, `#[TsCasts]`, imports) lives in `ModelMetadataAnalyzer`, an [analyzer](./analyzer-api.md) consumer that a custom transformer calls through the container. See [Customizing the Pipeline](./customizing-the-pipeline.md).

## Configuration Reference

The full list of `model_metadata.*` keys lives in the [Configuration Reference](./configuration-reference.md#model-metadata-model-metadata).
