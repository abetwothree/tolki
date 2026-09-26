# Customizing the Pipeline

Models, model metadata, enums, resources, routes, form requests, broadcast channels, and broadcast events all run through the same pipeline. A collector finds your classes, a transformer reads each one, and a writer renders it through a Blade template. To replace a stage, extend the built-in class and point the feature's config key at your class. The other stages keep working as before.

This config swaps the transformer that models use:

```php
// config/ts-publish.php

'models' => [
    'transformer_class' => App\TypeScript\CustomModelTransformer::class,
],
```

If you only want to change how the TypeScript is formatted, you don't need a PHP class. [Publish the templates](#publishing-and-editing-templates) and edit them instead.

## What Each Stage Does

A class passes through these stages in order:

- **Collector**: finds the classes to publish, such as every model in `app/Models`. It applies the feature's `included`, `excluded`, and `additional_directories` settings, and it skips classes marked `#[TsExclude]`.
- **Generator**: publishes one class. It builds a transformer, passes it to a writer, and keeps the file's content. The [generation cache](#cache-compatible-generators-rehydratesfromcache) works at this stage.
- **Transformer**: reads one PHP class and returns a data object that describes the TypeScript to write. It builds no strings.
- **Writer**: renders the transformer's data through a template and writes the file.
- **Template**: the Blade view that holds the TypeScript syntax. You can publish and edit it without touching any other stage.

Broadcast channels aren't classes, so they skip the generator and the transformer.

## Pipeline Stages Per Feature

Each stage has a config key named `{feature}.{stage}_class`, such as `models.collector_class`. This table lists each feature's config block and the default class behind each key:

| Feature              | `collector_class`            | `generator_class`         | `transformer_class`         | `writer_class`            |
| -------------------- | ---------------------------- | ------------------------- | --------------------------- | ------------------------- |
| `models`             | `ModelsCollector`            | `ModelGenerator`          | `ModelTransformer`          | `ModelWriter`             |
| `model_metadata`     | `ModelMetadataCollector`     | `ModelMetadataGenerator`  | `ModelMetadataTransformer`  | `ModelMetadataWriter`     |
| `enums`              | `EnumsCollector`             | `EnumGenerator`           | `EnumTransformer`           | `EnumWriter`              |
| `resources`          | `ResourcesCollector`         | `ResourceGenerator`       | `ResourceTransformer`       | `ResourceWriter`          |
| `routes`             | `RoutesCollector`            | `RouteGenerator`          | `RouteTransformer`          | `RouteWriter`             |
| `form_requests`      | `FormRequestsCollector`      | `FormRequestGenerator`    | `FormRequestTransformer`    | `FormRequestWriter`       |
| `broadcast_channels` | `BroadcastChannelsCollector` | none                      | none                        | `BroadcastChannelsWriter` |
| `broadcast_events`   | `BroadcastEventsCollector`   | `BroadcastEventGenerator` | `BroadcastEventTransformer` | `BroadcastEventWriter`    |

The classes live in the `AbeTwoThree\LaravelTsPublish\Collectors`, `Generators`, `Transformers`, and `Writers` namespaces. Broadcast channels have no generator or transformer key, because a channel is a name string rather than a PHP class.

Broadcast events have two more writer keys. `broadcast_events.index_writer_class` writes the combined index file, and `broadcast_events.echo_augmentation.writer_class` writes the Echo module augmentation.

Model metadata is stricter than the other features. A custom `model_metadata.generator_class` must extend `ModelMetadataGenerator`, and a custom `model_metadata.transformer_class` must extend `ModelMetadataTransformer`. If either doesn't, `ts:publish` fails before it writes any file.

Two more keys swap a class that isn't a pipeline stage:

- **`model_metadata.provider_class`**: the class whose `provide($model)` returns each model's metadata values. Most apps customize this one. See [Model Metadata](./model-metadata.md).
- **`form_requests.analyzer_class`**: the class that reads a form request's `rules()`. The same class types `$request->validated('key')` in routes and page props. The published config file has no line for this key, so add it to your `form_requests` block. See the [Configuration Reference](./configuration-reference.md).

### Shared & Combined Writers

A few writers don't belong to a single feature. Each one has its own config key:

| Writer              | Config Key             | Writes                                                                                                                                                                      |
| ------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BarrelWriter`      | `barrel_writer_class`  | The [barrel `index.ts`](./modular-publishing.md#barrel-files) in each namespace directory for models, model metadata, enums, resources, form requests, and broadcast events |
| `GlobalsWriter`     | `globals.writer_class` | The global declaration file, which declares your enum, model, resource, form request, and broadcast event types in a global namespace                                       |
| `JsonWriter`        | `json.writer_class`    | The combined JSON definitions file                                                                                                                                          |
| `WatcherJsonWriter` | `watcher.writer_class` | The JSON list of collected file paths that file watchers read                                                                                                               |

Route barrels have a different format, so the route writer (`routes.writer_class`) writes them.

::: warning A custom barrel writer needs both write methods
If your `barrel_writer_class` overrides `writeModular()`, override `writeModularPreserving()` as well. A run that skips one of the model phases writes model barrels through `writeModularPreserving()`, for example `ts:publish --only-models` while model metadata is enabled.
:::

### Features Without a Swappable Pipeline

Inertia and Vite env have no `*_class` keys, so you can't swap their classes. See [Inertia](./inertia.md) and [Vite Env](./vite-env.md) for the options they have. You can still [edit their templates](#publishing-and-editing-templates).

## Swapping a Transformer

To change what a transformer produces, extend the built-in class and adjust its data after the parent runs:

```php
namespace App\TypeScript;

use AbeTwoThree\LaravelTsPublish\Transformers\ModelTransformer;

class CustomModelTransformer extends ModelTransformer
{
    public function transform(): self
    {
        parent::transform();

        // Adjust the data here, before the writer renders it.

        return $this;
    }
}
```

Then point the feature's config key at your class:

```php
// config/ts-publish.php

'models' => [
    'transformer_class' => App\TypeScript\CustomModelTransformer::class,
],
```

Collectors, generators, and writers work the same way. Extend the feature's built-in class, override the behavior you need, and set the matching `*_class` key.

## Abstract Base Classes

Every built-in class extends one of four abstract base classes. To write a class from scratch, extend the matching base class and implement its abstract methods. The [built-in classes](#pipeline-stages-per-feature) are complete examples of each.

### `CoreCollector<TFindable>`

A collector implements three methods and inherits `collect()`:

```php
abstract protected function defaultDirectory(): string;
abstract protected function classFilter(ReflectionClass $reflection): bool;

/** @return array{included: list<string>, excluded: list<string>, additional_directories: list<string>} */
abstract protected function finderSettings(): array;

/** @return Collection<int, class-string<TFindable>> */
public function collect(): Collection; // concrete
```

`collect()` scans the default directory plus the `additional_directories` and `included` settings. It keeps the classes your `classFilter()` accepts, then drops anything listed in `excluded` or marked `#[TsExclude]`. A custom collector usually implements only the three abstract methods.

::: warning Collectors cache each directory's class list
A collector reads each directory once per PHP process and reuses that list. `ts:publish` clears the cache at the start of every run, so a publish always sees the files on disk.

Your own code can still see an old list. For example, a test helper or a `tinker` session might call `collect()` or `allows()`, write a PHP file, and call it again. The second call returns the list from before the write. Clear the cache between the write and the second call:

```php
use AbeTwoThree\LaravelTsPublish\Collectors\CoreCollector;

CoreCollector::flushClassMapCache();
```

The method is static on the base class, so one call clears the cache for every collector.
:::

### `CoreGenerator<TGeneratable>`

A generator implements two methods. Its constructor calls `generate()`:

```php
public function __construct(
    public protected(set) string $findable, // class-string<TGeneratable>
) {}

abstract public function generate(): string;
abstract public function filename(): string;
```

By the time the constructor returns, `$content` must hold the rendered file. The built-in generators build a transformer, pass it to a writer, and store what the writer returns.

Give your generator a publicly readable `transformer` property that holds its transformer, as the built-in generators do with `public protected(set)`. Barrel files need it, and the generation cache never stores a generator without it.

### `CoreTransformer<TTransformable>`

A transformer implements three methods. Its constructor calls `transform()`:

```php
public function __construct(
    protected string $findable, // class-string<TTransformable>
) {}

public function fqcn(): string; // concrete

abstract public function transform(): self;
abstract public function filename(): string;
abstract public function data(): Datable;
```

`data()` returns a `Datable` object: plain data that describes the output, not a rendered string. The writer renders it, and the generation cache stores it.

Set the `$namespacePath` property in `transform()` as well. Writers use it to choose the file's directory, and barrels use it to choose the `index.ts` that exports the file.

### `CoreWriter<TTransformer of CoreTransformer>`

A writer receives its filesystem through the constructor and implements `write()`:

```php
public function __construct(
    protected Filesystem $filesystem,
) {}

abstract public function write(CoreTransformer $transformer): string;
```

`write()` takes a transformer and returns the rendered file content. When `output_to_files` is on, which is the default, it also writes the file to disk.

## Cache-Compatible Generators (`RehydratesFromCache`)

The built-in generators use the `AbeTwoThree\LaravelTsPublish\Generators\Concerns\RehydratesFromCache` trait to take part in the [generation cache](./generating-cache.md). Add the trait to a custom `*.generator_class` to cache it the same way. The trait adds two methods:

```php
public static function fromCache(string $findable, CoreTransformer $transformer, string $filename): static;

protected function hydrate(string $findable, CoreTransformer $transformer, string $filename): void;
```

On a cache hit, the package builds your generator with `fromCache()`, which skips the constructor. `generate()` doesn't run, so the class isn't transformed again and its file isn't rewritten. `hydrate()` then restores `$findable`, the stored transformer, and the file name. That's what the rest of the run reads from a built-in generator, for example to write barrels. If your generator keeps other state that later steps read, override `hydrate()` to restore it too.

The cache stores the transformer by serializing it. A transformer that holds a value PHP can't serialize, such as a closure, isn't cached, and its class rebuilds on the next run.

A generator without the trait still produces correct output, but it rebuilds on every run instead of coming from the cache.

To add inputs that aren't PHP files to a generator's cache check, such as route definitions, implement `ProvidesCacheSignature`. See [Cache Generation](./generating-cache.md).

## Publishing and Editing Templates

To change the generated TypeScript's formatting without writing PHP, publish the package's Blade templates:

```bash
php artisan vendor:publish --tag="laravel-ts-publish-views"
```

The command copies the templates to `resources/views/vendor/laravel-ts-publish`. Laravel loads your copies ahead of the package's, so your edits apply on the next `ts:publish` with no config change.

To use a template with a different name, point the feature's template key at it. These are the keys and their default views:

| Config Key                                    | Default View                                 |
| --------------------------------------------- | -------------------------------------------- |
| `models.template`                             | `laravel-ts-publish::model-split`            |
| `model_metadata.template`                     | `laravel-ts-publish::model-meta`             |
| `enums.template`                              | `laravel-ts-publish::enum`                   |
| `resources.template`                          | `laravel-ts-publish::resource`               |
| `routes.template`                             | `laravel-ts-publish::route`                  |
| `form_requests.template`                      | `laravel-ts-publish::form-request`           |
| `broadcast_channels.template`                 | `laravel-ts-publish::broadcast-channels`     |
| `broadcast_events.template`                   | `laravel-ts-publish::broadcast-event`        |
| `broadcast_events.index_template`             | `laravel-ts-publish::broadcast-events-index` |
| `broadcast_events.echo_augmentation.template` | `laravel-ts-publish::echo-broadcast-events`  |
| `globals.template`                            | `laravel-ts-publish::globals`                |

Inertia's `inertia-config.blade.php` and Vite env's `vite-env.blade.php` have no template key. Edit your published copies to change them.

::: warning Published templates don't update with the package
Your copies stay as they were when you published them. After you upgrade the package, compare them with the package's new templates and merge the changes. A stale copy can leave out output the new version adds. For example, a copy of `inertia-config.blade.php` published before v2.5.0 drops the enum value imports that an `EnumResource` shared prop needs.
:::

## Upgrading Custom Classes to v2.5

Version 2.5.0 replaced the package's type engine. If you extended one of these classes before then, check your overrides.

### `BroadcastEventTransformer`

The constructor now takes one argument, like every other transformer:

```php
public function __construct(string $findable);
```

A subclass that passes a second argument to `parent::__construct()` must drop it. The protected methods changed as well:

- **Removed**: `convertType()`, `resolveArrayType()`, and the `$analyzed` property. An override of a removed method loads without error but never runs. A subclass that mapped a custom value object through `convertType()` keeps loading while its event types change.
- **Changed**: `runAnalysis()`, `resolveBroadcastName()`, `resolveProperties()`, `convertClassType()`, and `collectPropertyFqcns()` take or return different types. PHP rejects an incompatible override when the class loads, so you see these right away.

### `ResourceTransformer`

`modelFromDocblock()`, `modelFromAncestorDocblock()`, `guessModelFromConvention()`, and `guessModelFromUseResourceAttribute()` are gone. An override of one of them still loads, but it never runs. Every resource it used to cover is then typed against the model the package finds on its own, and nothing reports an error. The rest of `ResourceTransformer` kept its signatures.

To keep a custom convention, override `resolveModelClass()`. Set `$this->modelClass` and return `$this`:

```php
protected function resolveModelClass(): self
{
    parent::resolveModelClass();

    $this->modelClass ??= MyConvention::modelFor($this->reflectionResource);

    return $this;
}
```

`resolveModelClass()` changes what `ts:publish` writes. [`AstEngine::analyze()`](./analyzer-api.md) doesn't use your transformer, so it still finds the model the default way. Pass the model as its third argument to choose it yourself.

### Renamed Constant

`SurveyorTypeMapper` was removed. Its `TOLKI_TYPES_MAP` constant, the map of PHP classes that `@tolki/types` has TypeScript types for, is now `AbeTwoThree\LaravelTsPublish\Support\TolkiTypes::MAP`. The contents are the same.
