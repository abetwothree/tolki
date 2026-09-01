# Customizing the Pipeline

Every feature this package publishes — models, enums, resources, routes, form requests, broadcast channels, and broadcast events — runs through the same **Collector → Generator → Transformer → Writer → Template** pipeline, though not every feature uses all five stages. Each stage is swappable independently, per feature, via the config file: extend the built-in class, override the matching config key, and the rest of the pipeline keeps working unmodified.

```php
// config/ts-publish.php

'models' => [
    'transformer_class' => App\TypeScript\CustomModelTransformer::class,
],
```

## What Each Stage Does

- **Collector** — discovers the fully-qualified class names to publish (e.g. every model in `app/Models`), applying the feature's `included` / `excluded` / `additional_directories` config.
- **Generator** — orchestrates a single class's publish: builds a `Transformer`, hands it to a `Writer`, and holds the resulting file content. Also the integration point for the [generation cache](#cache-compatible-generators-rehydratesfromcache).
- **Transformer** — converts one PHP class into the structured data (a `Datable` DTO) that describes what should be in the TypeScript output — no string building, just data.
- **Writer** — renders a `Transformer`'s data through a **Template** (a Blade view) and writes the resulting file to disk.
- **Template** — the Blade view responsible for the actual TypeScript syntax. Publishable and editable independently of every other stage.

## Pipeline Stages Per Feature

Not every feature has all four swappable classes — broadcast channels, for example, has no per-class Generator or Transformer stage, since a channel is just a name string, not a PHP class to statically analyze. Each stage is swapped via a `{feature}.{stage}_class` config key (e.g. `models.collector_class`) — the table below shows the resulting default class for each stage.

| Feature            | Collector                    | Generator                 | Transformer                 | Writer                    |
| ------------------ | ---------------------------- | ------------------------- | --------------------------- | ------------------------- |
| Models             | `ModelsCollector`            | `ModelGenerator`          | `ModelTransformer`          | `ModelWriter`             |
| Enums              | `EnumsCollector`             | `EnumGenerator`           | `EnumTransformer`           | `EnumWriter`              |
| Resources          | `ResourcesCollector`         | `ResourceGenerator`       | `ResourceTransformer`       | `ResourceWriter`          |
| Routes             | `RoutesCollector`            | `RouteGenerator`          | `RouteTransformer`          | `RouteWriter`             |
| Form Requests      | `FormRequestsCollector`      | `FormRequestGenerator`    | `FormRequestTransformer`    | `FormRequestWriter`       |
| Broadcast Channels | `BroadcastChannelsCollector` | _(none)_                  | _(none)_                    | `BroadcastChannelsWriter` |
| Broadcast Events   | `BroadcastEventsCollector`   | `BroadcastEventGenerator` | `BroadcastEventTransformer` | `BroadcastEventWriter`¹   |

<sup>1</sup> Broadcast Events also has two additional writer stages beyond the table above: `index_writer_class` (writes the combined index file) and `echo_augmentation.writer_class` (writes the Echo module augmentation).

::: warning `BroadcastEventTransformer` changed shape
Its constructor used to take a second argument alongside `$findable` — an `Analyzer` instance from [Surveyor](https://github.com/laravel/surveyor), the library that typed broadcast events at the time. Events are now typed by the package's own [analyzer](./analyzer-api.md), and the constructor matches every other transformer:

```php
public function __construct(string $findable);
```

The protected methods a subclass hooks into moved with it, so re-check any existing override:

- **`convertType()` and `resolveArrayType()` are gone**, along with the `$analyzed` property, because all three took Surveyor types. This is the one that bites quietly: an override of a method the parent no longer calls is dead code, not an error, so a subclass that mapped a custom value object through `convertType()` keeps loading while its event types change underneath it.
- **`runAnalysis()`, `resolveBroadcastName()`, `resolveProperties()`, `convertClassType()` and `collectPropertyFqcns()` take or return different types.** These fail loudly — PHP rejects the incompatible declaration when the subclass loads — so you'll know immediately.

:::

Each feature also has its own `*.template` config key (`models.template`, `enums.template`, `routes.template`, `form_requests.template`, `broadcast_channels.template`, and `broadcast_events.template` / `index_template` / `echo_augmentation.template`) pointing at the Blade view responsible for that feature's output syntax — see [Publishing & Editing Templates](#publishing-editing-templates).

### Shared & Combined Writers

A few writers aren't tied to a single feature — they combine already-transformed data from multiple features, or write a single combined file:

| Writer              | Config Key             | Responsibility                                                                                                             |
| ------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `BarrelWriter`      | `barrel_writer_class`  | Writes every namespace directory's barrel `index.ts` file — see [Modular Publishing](./modular-publishing.md#barrel-files) |
| `GlobalsWriter`     | `globals.writer_class` | Writes the global declaration file combining every model/enum interface                                                    |
| `JsonWriter`        | `json.writer_class`    | Writes the combined JSON definitions file                                                                                  |
| `WatcherJsonWriter` | `watcher.writer_class` | Writes the collected-file-paths JSON used by file watchers                                                                 |

### Features Without a Swappable Pipeline

Inertia and Vite Env are **not** part of this swappable pipeline — they have their own dedicated analysis logic (reading the `HandleInertiaRequests` middleware, or parsing `.env`) and only expose filename/output-directory config, with no `*_class` override keys. See [Inertia](./inertia.md) and [Vite Env](./vite-env.md) for their configuration options.

## Abstract Base Classes

Every built-in class extends one of these four abstract base classes. A custom class must extend the matching one and implement its abstract methods.

### `CoreCollector<TFindable>`

```php
abstract protected function defaultDirectory(): string;
abstract protected function classFilter(ReflectionClass $reflection): bool;

/** @return array{included: list<string>, excluded: list<string>, additional_directories: list<string>} */
abstract protected function finderSettings(): array;

/** @return Collection<int, class-string<TFindable>> */
public function collect(): Collection; // concrete — orchestrates the above
```

`collect()` itself is concrete and already handles merging `additional_directories`, `included`, and the default directory, filtering by `classFilter()`, and excluding anything matched by `excluded` or marked `#[TsExclude]`. A custom collector typically only needs to implement the three abstract methods.

### `CoreGenerator<TGeneratable>`

```php
public function __construct(
    public protected(set) string $findable, // class-string<TGeneratable> — auto-calls generate()
) {}

abstract public function generate(): string;
abstract public function filename(): string;
```

The constructor calls `generate()` immediately, so by the time a `Generator` instance exists, `$this->content` should already hold the rendered output (typically by building a `Transformer` internally and delegating to a `Writer`).

### `CoreTransformer<TTransformable>`

```php
public function __construct(
    protected string $findable, // class-string<TTransformable> — auto-calls transform()
) {}

public function fqcn(): string; // concrete

abstract public function transform(): self;
abstract public function filename(): string;
abstract public function data(): Datable;
```

`data()` returns a `Datable` DTO — plain structured data describing the output, not a rendered string. This is what gets handed to a `Writer` (and what gets cached — see below).

### `CoreWriter<TTransformer of CoreTransformer>`

```php
public function __construct(
    protected Filesystem $filesystem, // constructor-injected
) {}

abstract public function write(CoreTransformer $transformer): string;
```

A `Writer` takes a `Transformer` instance and returns the rendered file content as a string (and, when `output_to_files` is enabled, is also responsible for actually writing it to disk).

## Cache-Compatible Generators (`RehydratesFromCache`)

The built-in generators (`ModelGenerator`, `EnumGenerator`, `ResourceGenerator`, `RouteGenerator`, `FormRequestGenerator`, `BroadcastEventGenerator`) all use the `AbeTwoThree\LaravelTsPublish\Generators\Concerns\RehydratesFromCache` trait to participate in the [generation cache](./generating-cache.md). It adds:

```php
public static function fromCache(string $findable, CoreTransformer $transformer, string $filename): static;

protected function hydrate(string $findable, CoreTransformer $transformer, string $filename): void;
```

`fromCache()` builds a generator instance via `ReflectionClass::newInstanceWithoutConstructor()` — skipping the normal constructor entirely, so `generate()` (and therefore the underlying `transform()` and file write) never runs again for a class the cache already has a valid, unchanged snapshot for. `hydrate()` then restores just enough state (`$findable`, the cached `$transformer`, and the cached `$filename`) for the rest of the pipeline (barrel writers, preview output, etc.) to treat it identically to a freshly generated instance.

Add this trait to a custom `*.generator_class` to opt it into the same behavior. A generator without it is always rebuilt from scratch on every run — correct, just not cached.

## Example: Swapping a Transformer

```php
namespace App\TypeScript;

use AbeTwoThree\LaravelTsPublish\Dtos\Contracts\Datable;
use AbeTwoThree\LaravelTsPublish\Transformers\ModelTransformer;

class CustomModelTransformer extends ModelTransformer
{
    public function transform(): self
    {
        parent::transform();

        // Add or adjust data before it reaches the Writer.

        return $this;
    }
}
```

```php
// config/ts-publish.php

'models' => [
    'transformer_class' => App\TypeScript\CustomModelTransformer::class,
],
```

The same pattern applies to a Collector, Generator, or Writer — extend the built-in class for the feature you want to customize, override just the behavior you need, and set the matching `*_class` config key.

## Publishing & Editing Templates

If you only need to change the generated TypeScript's formatting — not the underlying pipeline logic — publish the Blade templates directly instead of writing PHP classes:

```bash
php artisan vendor:publish --tag="laravel-ts-publish-views"
```

Then point the feature's `*.template` config key at your published (or entirely custom) Blade view.
