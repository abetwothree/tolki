# Upgrade Guide

This guide lists the changes in each release that can change your generated types or break a custom class, newest first.

## Upgrading to 2.5 From 2.4

Version 2.5.0 replaced the package's type engine. Your first publish after upgrading changes many generated files, even if you change nothing, so run `php artisan ts:publish` once and review the diff before you commit it.

### Removed Dependencies

#### `laravel/surveyor` and `laravel/ranger`

The package no longer requires `laravel/surveyor` or `laravel/ranger`. If your app uses either package directly, add it to your own `composer.json`.

### Published Templates

#### `inertia-config.blade.php`

If you published the views and share an `EnumResource` through Inertia, update your copy of `inertia-config.blade.php`. A copy published before 2.5.0 drops the enum value imports that the shared prop needs, and nothing reports the problem. Merge the new import block from the package's template into your copy, or publish the views again.

### Single-Class Republishing

#### `--source` Applies the Model Filters

`--source` now applies `models.included` and `models.excluded` to a model, and the `model_metadata` filters to its metadata companion. When the filters leave out both, the command reports the model and exits with an error. Before 2.5.0, it published the model anyway.

If a script republishes a model that your filters leave out, change the filters to allow it, or remove the call. The Vite plugin isn't affected, because it only republishes classes the package collected.

### API Resources

#### Classes That Share a Name Get the Right Alias

A property that named the same class name more times than it had distinct classes could get the wrong import alias. It could also get a bare name with no import, which failed in your app with `TS2304 Cannot find name`. Each occurrence now uses the alias of its own class. You don't need to change anything.

### Float Values

#### Floats Keep Full Precision

The package now writes a PHP float at full round-trip precision, instead of rounding it to PHP's `precision` setting. That covers floats such as a value an enum method returns for a case, or a value in a form request rule. For example, `0.1 + 0.2` now publishes as `0.30000000000000004` instead of `0.3`. Review the float literals in your first publish after upgrading, and update any frontend code that compared against a rounded value.

### Custom Pipeline Classes

If you extended one of these classes before 2.5.0, check your overrides.

#### `BroadcastEventTransformer`

The constructor now takes one argument, like every other transformer:

```php
public function __construct(string $findable);
```

A subclass that passes a second argument to `parent::__construct()` must drop it. The protected methods changed as well:

- **Removed**: `convertType()`, `resolveArrayType()`, and the `$analyzed` property. An override of a removed method loads without error but never runs. A subclass that mapped a custom value object through `convertType()` keeps loading while its event types change.
- **Changed**: `runAnalysis()`, `resolveBroadcastName()`, `resolveProperties()`, `convertClassType()`, and `collectPropertyFqcns()` take or return different types. PHP rejects an incompatible override when the class loads, so you see these right away.

#### `ResourceTransformer`

`modelFromDocblock()`, `modelFromAncestorDocblock()`, `guessModelFromConvention()`, `guessModelFromUseResourceAttribute()`, and `substituteEnumResourceType()` are gone. An override of one of them still loads, but it never runs, and nothing reports an error. A resource that one of the four model methods covered is typed against the model the package finds on its own. An override of `substituteEnumResourceType()` no longer changes how a property that returns an `EnumResource` is typed. No method that remains changed its signature, so none of these overrides fails when the class loads.

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

#### Renamed Constant

`SurveyorTypeMapper` was removed. Its `TOLKI_TYPES_MAP` constant, the map of PHP classes that `@tolki/types` has TypeScript types for, is now `AbeTwoThree\LaravelTsPublish\Support\TolkiTypes::MAP`. The contents are the same.

#### Bound `LaravelTsPublish` Subclasses

The helpers on `LaravelTsPublish` that emit JavaScript, handle type strings, and name files moved to three classes: `Support\JsEmitter`, `Support\TsTypeString`, and `Support\TsNaming`. Every `LaravelTsPublish::` call you make still works, with the same signature. The package itself calls the new classes, though. If you bound a `LaravelTsPublish` subclass in the container to override one of those helpers, the override no longer runs, and nothing reports it. Bind a subclass of the matching `Support` class instead. These classes are internal, so check your override after each upgrade.

#### Custom Barrel Writers

A `barrel_writer_class` that overrides `writeModular()` must now override `writeModularPreserving()` the same way, or some runs write the default barrel format. [Shared & Combined Writers](./customizing-the-pipeline.md#shared-combined-writers) explains which runs use it.

## Upgrading to 2.4 From 2.3

### API Resources

#### Relation `except()` Publishes `Pick<>`

A relation's `except()` used to publish `Omit<Post, "created_at" | "updated_at">`, which widened under a model template whose interface also carries mutators, relations, and counts. It now picks the remaining columns, as in `Pick<Post, "id" | "title" | "content" | "user_id">`. Under the default template, both carry the same columns, so you don't need to change anything.

#### A Child Resource Inherits Its Parent's `toArray()`

A child resource with no `toArray()` of its own used to publish an empty interface when no model resolved for it. It now inherits its parent's `toArray()`. If you added a pass-through `toArray()` only to work around that, you can delete it.

#### A Guessed `toResource()` Class Must Be Published

When `toResource()` guesses a resource class by naming convention, the package now accepts the guess only when it publishes that resource. A guessed resource it doesn't publish used to be imported anyway, which failed in your app with `TS2307 Cannot find module`. That property now publishes `unknown`. To type it, publish the guessed resource. [`toResource()` and `toResourceCollection()`](./api-resources.md#toresource-and-toresourcecollection) lists the ways the package finds the class.

### Form Requests

#### String-Form `in:` Rules Set the Field Type

A string-form `in:` rule now sets the field's type wherever it appears in the rule list, as `Rule::in()` already did. Before 2.4.0, a type rule listed ahead of it won: `['required', 'string', 'in:user,admin']` published `string`, and it now publishes `'user' | 'admin'`.

When a sibling rule declares the field numeric (`integer`, `int`, `numeric`, `decimal`, `digits`, or `digits_between`), the values also lose their quotes: `['required', 'integer', 'in:1,2,3']` publishes `1 | 2 | 3`. A value that doesn't read back as the same text, such as `007`, keeps its quotes.

TypeScript now flags code that assigns an unlisted value to one of these fields, or compares a numeric field to a quoted string. Use a listed value, and change `=== '1'` to `=== 1`. See [Numeric `in:` Literals](./form-requests.md#numeric-in-literals).

## Upgrading to 2.3 From 2.2

### API Resources

#### Relation `except()` Publishes Database Columns Only

A relation's `except()` used to publish every accessor and relation of the related model, minus the named keys, even though `Model::except()` never returns them. It now publishes the model's database columns only. If your frontend read an accessor or a relation from an `except()` result, switch that property to `only([...])`, or give the key its own entry in `toArray()`. TypeScript reports every place that reads a key that's gone.

### Models

#### A Bare `tinyint` Is Now `number`

Only `tinyint(1)` publishes as `boolean`. It's what Laravel's `boolean()` column creates on MySQL and SQLite, so real boolean columns are unaffected. A column created with `tinyInteger()` used to publish as [`boolean`](./models.md#booleans) and now publishes as [`number`](./models.md#numbers).

The same change fixes some real boolean columns. Their sized `tinyint(1)` type didn't match the map before, so they published as `number`, and they now publish as `boolean`.

If you compare a `tinyInteger()` column with `=== true`, or use it directly in a condition, compare it with a number instead. TypeScript flags every place that needs the change.

#### The `As*ArrayObject` Casts Also Allow Arrays

`AsArrayObject`, `AsEncryptedArrayObject`, and `AsEnumArrayObject` publish as [`unknown[] | Record<string, unknown>`](./models.md#arrays-objects) instead of `Record<string, unknown>` alone. An `ArrayObject` filled from a list serializes as a JSON array, so the old type rejected valid payloads from your API.

Narrow the value before you treat it as an object: `Object.keys(x.meta)` no longer compiles on its own, so check `Array.isArray(x.meta)` first. You can also pin the property to the shape your column holds with [`#[TsCasts]`](./models.md#tscasts).

### JSON Definitions File

#### Entries Are Keyed by Fully-Qualified Class Name

Before 2.3.0, the [JSON definitions file](./publishing.md#json-definitions-file) keyed its entries by short class name, so two classes with the same short name overwrote each other. Each top-level object is now keyed by fully-qualified class name, and each entry has a `name` field that holds the short name. Update code that reads the file to look entries up by fully-qualified name, and to read `name` for display.

## Upgrading to 2.0 From 1.x

Version 2 aims to match everything Laravel Wayfinder provides, with a few things done differently.

### New in Version 2

Version 2 adds these features:

- Route functions based on your routes and controllers, including return types for Inertia routes and Vue components, and pagination with the model or resource embedded automatically
- Form request interfaces
- Broadcast channels
- Broadcast event interfaces
- A Laravel Echo TypeScript augmentation
- Global Inertia route response parameters
- A Vite env augmentation file, built from the `.env` settings prefixed with `VITE_`
- A generation cache that makes reruns of the full `ts:publish` command faster

Each feature's page in these docs shows the TypeScript it generates.

### Recommended Upgrade Flow

Follow these steps in order:

1. Update to the v2 package release in Composer.
2. Republish the config and views with `--force`. See [Configuration Changes](#configuration-changes) and [Templates](#templates).
3. Install `@tolki/ts` and remove `@tolki/enum`. See [New npm Package](#new-npm-package).
4. Update your Vite plugin import to `@tolki/ts/vite`.
5. Remove your old generated `data` folder.
6. Run a fresh publish with `php artisan ts:publish --fresh`.
7. Fix the import paths in your app code to match the modular namespace output. See [Modular Publishing Only](#modular-publishing-only).

### Breaking Changes

#### Configuration Changes

The version 1 configuration was mostly flat. Version 2 has more features, so each main feature has its own config block.

Most version 1 settings move into their block, and the block name leaves the key: `enum_template` becomes `enums.template`, and `publish_models` becomes `models.enabled`.

If you published the config file, republish it with the `--force` flag:

```bash
php artisan vendor:publish --tag="ts-publish-config" --force
```

##### Full Configuration Update List

The tables below map every key from the flat version 1 config to its version 2 block. The recommended path is to republish the config file, then use your project's git diff to find the customizations you need to reapply.

::: details Show the Full Key-by-Key Migration Table

###### 1) Pipeline Class Overrides Moved Under Each Feature Group

| Old key                      | New key                       |
| ---------------------------- | ----------------------------- |
| `model_collector_class`      | `models.collector_class`      |
| `model_generator_class`      | `models.generator_class`      |
| `model_transformer_class`    | `models.transformer_class`    |
| `model_writer_class`         | `models.writer_class`         |
| `enum_collector_class`       | `enums.collector_class`       |
| `enum_generator_class`       | `enums.generator_class`       |
| `enum_transformer_class`     | `enums.transformer_class`     |
| `enum_writer_class`          | `enums.writer_class`          |
| `resource_collector_class`   | `resources.collector_class`   |
| `resource_generator_class`   | `resources.generator_class`   |
| `resource_transformer_class` | `resources.transformer_class` |
| `resource_writer_class`      | `resources.writer_class`      |

###### 2) Shared Writer Overrides Renamed or Grouped

| Old key                     | New key                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| `barrel_writer_class`       | `barrel_writer_class` (same key, still supported as a shared override) |
| `globals_writer_class`      | `globals.writer_class`                                                 |
| `json_writer_class`         | `json.writer_class`                                                    |
| `watcher_json_writer_class` | `watcher.writer_class`                                                 |

###### 3) Template Key Migration

| Old key             | New key              |
| ------------------- | -------------------- |
| `model_template`    | `models.template`    |
| `enum_template`     | `enums.template`     |
| `resource_template` | `resources.template` |
| `globals_template`  | `globals.template`   |

Version 2 also adds template keys for the new features:

| New v2 template keys                          |
| --------------------------------------------- |
| `routes.template`                             |
| `form_requests.template`                      |
| `broadcast_channels.template`                 |
| `broadcast_events.template`                   |
| `broadcast_events.index_template`             |
| `broadcast_events.echo_augmentation.template` |

###### 4) Feature Enable Flags Moved From Flat Keys to Grouped Keys

| Old key                       | New key             |
| ----------------------------- | ------------------- |
| `publish_enums`               | `enums.enabled`     |
| `publish_models`              | `models.enabled`    |
| `publish_resources`           | `resources.enabled` |
| `output_globals_file`         | `globals.enabled`   |
| `output_json_file`            | `json.enabled`      |
| `output_collected_files_json` | `watcher.enabled`   |

Version 2 adds these feature toggles:

| New v2 feature toggles       |
| ---------------------------- |
| `routes.enabled`             |
| `form_requests.enabled`      |
| `broadcast_channels.enabled` |
| `broadcast_events.enabled`   |
| `inertia.enabled`            |
| `vite_env.enabled`           |
| `cache.enabled`              |

###### 5) Namespace and Casing Options Moved Under Feature Groups

| Old key                    | New key                           |
| -------------------------- | --------------------------------- |
| `models_namespace`         | `models.namespace`                |
| `enums_namespace`          | `enums.namespace`                 |
| `resources_namespace`      | `resources.namespace`             |
| `relationship_case`        | `models.relationship_case`        |
| `enum_method_case`         | `enums.method_case`               |
| `nullable_relations`       | `models.nullable_relations`       |
| `relation_nullability_map` | `models.relation_nullability_map` |

The `*.namespace` keys have no effect in version 2. The globals file names each namespace after the class's PHP namespace, as described in [Modular Publishing Only](#modular-publishing-only).

###### 6) Include, Exclude, and Additional Directories Migrated Per Feature

| Old key                           | New key                            |
| --------------------------------- | ---------------------------------- |
| `additional_model_directories`    | `models.additional_directories`    |
| `included_models`                 | `models.included`                  |
| `excluded_models`                 | `models.excluded`                  |
| `additional_enum_directories`     | `enums.additional_directories`     |
| `included_enums`                  | `enums.included`                   |
| `excluded_enums`                  | `enums.excluded`                   |
| `additional_resource_directories` | `resources.additional_directories` |
| `included_resources`              | `resources.included`               |
| `excluded_resources`              | `resources.excluded`               |

These new version 2 blocks use the same include, exclude, and additional directories pattern:

| New v2 blocks using the same pattern |
| ------------------------------------ |
| `form_requests.*`                    |
| `broadcast_events.*`                 |

###### 7) Enum Metadata and Options Renamed and Regrouped

| Old key                            | New key                             |
| ---------------------------------- | ----------------------------------- |
| `enum_metadata_enabled`            | `enums.metadata_enabled`            |
| `enums_use_tolki_package`          | `enums.use_tolki_package`           |
| `auto_include_enum_methods`        | `enums.auto_include_methods`        |
| `auto_include_enum_static_methods` | `enums.auto_include_static_methods` |

###### 8) Output File Naming and Output Directory Keys Grouped

| Old key                                 | New key                    |
| --------------------------------------- | -------------------------- |
| `global_filename`                       | `globals.filename`         |
| `global_directory`                      | `globals.output_directory` |
| `json_filename`                         | `json.filename`            |
| `json_output_directory`                 | `json.output_directory`    |
| `collected_files_json_filename`         | `watcher.filename`         |
| `collected_files_json_output_directory` | `watcher.output_directory` |

###### 9) Modular Publishing Setting Removed

| Old key              | Status in v2                          |
| -------------------- | ------------------------------------- |
| `modular_publishing` | Removed. Modular output is always on. |

###### 10) New Top-Level Config Groups in v2

These blocks did not exist in the version 1 config:

| New v2 top-level block |
| ---------------------- |
| `cache.*`              |
| `routes.*`             |
| `form_requests.*`      |
| `broadcast_channels.*` |
| `broadcast_events.*`   |
| `inertia.*`            |
| `vite_env.*`           |

Version 2 also adds this nested block:

| New v2 nested block                    |
| -------------------------------------- |
| `broadcast_events.echo_augmentation.*` |

###### 11) Keys That Stayed the Same

These keys are still top-level and need no migration:

| Key                      | Status                      |
| ------------------------ | --------------------------- |
| `run_after_migrate`      | Unchanged (still top-level) |
| `output_to_files`        | Unchanged (still top-level) |
| `output_directory`       | Unchanged (still top-level) |
| `namespace_strip_prefix` | Unchanged (still top-level) |
| `custom_ts_mappings`     | Unchanged (still top-level) |
| `timestamps_as_date`     | Unchanged (still top-level) |

`ts_extends` still exists, and version 2 adds sections beyond `models` and `resources`:

| `ts_extends` key              | v2 note           |
| ----------------------------- | ----------------- |
| `ts_extends.form_requests`    | New section in v2 |
| `ts_extends.broadcast_events` | New section in v2 |

:::

#### New npm Package

To support functional routing as well as functional enums, install the new `@tolki/ts` package that goes with this Laravel package:

```bash
npm install @tolki/ts
```

Then uninstall the previous `@tolki/enum` package. `@tolki/ts` supports both the version 1 functional enums and the new version 2 functional routing functions:

```bash
npm uninstall @tolki/enum
```

If you use the Vite plugin, update its import path in your Vite config file:

```typescript
import { laravelTsPublish } from "@tolki/ts/vite";
```

The build flag changed too. The Vite plugin from `@tolki/enum` calls `ts:publish` with the `--only-enums` option. The `@tolki/ts` Vite plugin calls it with `--only-functional` instead, which skips model and resource interfaces when building assets.

#### Templates

If you published and modified the Blade templates, publish them again and reapply your changes:

```bash
php artisan vendor:publish --tag="laravel-ts-publish-views" --force
```

#### `TsResourceCasts` Attribute Removed

The `TsResourceCasts` attribute (`AbeTwoThree\LaravelTsPublish\Attributes\TsResourceCasts`) has been removed.

Replace every use with `TsCasts` (`AbeTwoThree\LaravelTsPublish\Attributes\TsCasts`), which now handles resources, trait methods, models, and form requests the same way. The constructor signature and array format are identical. Only the class name changes:

```php
// Before
use AbeTwoThree\LaravelTsPublish\Attributes\TsResourceCasts;
#[TsResourceCasts(['field' => 'string'])]

// After
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;
#[TsCasts(['field' => 'string'])]
```

#### Pipeline Customization

If you changed or extended a collector, generator, transformer, writer, or template in version 1, check that your changes still work with version 2. Then register your classes under the new `*_class` keys in each feature's block to override the package defaults. See [Customizing the Pipeline](./customizing-the-pipeline.md).

#### Modular Publishing Only

In version 1, the default output was a flat directory, with a setting for modular publishing. Version 2 always publishes in the modular format, and there's no setting for a flat directory. With 7 large groups of features instead of 3, supporting both layouts was error-prone, so version 2 keeps only the modular one.

Update the import paths in your code to match the PHP namespace of each model, enum, and resource. Delete the `data` folder that holds your previous types, then run `php artisan ts:publish --fresh`, so the files you see match the version 2 output.

For example, take a model in this PHP namespace:

```php
<?php

namespace App\Models\Users;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    //
}
```

Its import path changes like this:

```typescript
// Before
import type { User } from "@data/models";

// After
import type { User } from "@data/app/models/users";
```

If you use the globals file, its namespaces follow your PHP namespaces too. A version 1 flat-mode type such as `models.User` becomes `app.models.users.User` for the model above. See [Global Declaration File](./publishing.md#global-declaration-file).

### New Command Options and Behavior

Version 2 adds more selective `ts:publish` flags and a cache control:

```bash
# Every enabled feature except model and resource interfaces
php artisan ts:publish --only-functional

# One feature at a time
php artisan ts:publish --only-routes
php artisan ts:publish --only-form-requests
php artisan ts:publish --only-broadcast-channels
php artisan ts:publish --only-broadcast-events

# Rebuild the cache
php artisan ts:publish --fresh
```

These flags follow three rules:

- You can pass only one `--only-*` flag per command.
- `--only-functional` takes precedence and ignores other `--only-*` flags.
- `--fresh` forces a full regeneration and cache rebuild.

See [Limiting a Single Run With Flags](./publishing.md#limiting-a-single-run-with-flags) for every flag.

### New Config Groups in v2

Besides reorganizing the existing model, enum, and resource keys, version 2 adds these config blocks:

- `routes.*`
- `form_requests.*`
- `broadcast_channels.*`
- `broadcast_events.*`
- `inertia.*`
- `vite_env.*`
- `cache.*`

If you published a version 1 config, republish it and reapply your customizations to the new block structure.

### New Generated Files You Should Expect

Depending on which features are enabled, version 2 generates these files beyond enums, models, and resources:

- Route controller helper files
- Form request TypeScript interfaces
- Event parameter TypeScript interfaces
- `broadcast-channels.ts`
- `broadcast-events.ts`
- `echo-broadcast-events.d.ts`, when the Echo augmentation is enabled
- `inertia-config.d.ts`
- `vite-env.d.ts`, or your configured filename

Make sure your `tsconfig.json` include patterns cover these generated declaration files.

### Generation Cache

Version 2 adds a generation cache that skips unchanged classes after the first run:

- Run `php artisan ts:publish --fresh` after upgrading.
- Use `--fresh` any time you need to guarantee a full rebuild.

See [Cache Generation](./generating-cache.md) for how the cache works.
