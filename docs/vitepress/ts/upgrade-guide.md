# Upgrade Guide

This guide covers upgrading the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) from version 1.x to version 2. Version 2 aims to match everything Laravel Wayfinder provides, with a few things done differently.

## New in Version 2

Version 2 adds these features:

- Route functions based on your routes and controllers, including return types for Inertia routes and Vue components, and pagination with the model or resource embedded automatically
- Form request interfaces
- Broadcast channels
- Broadcast event interfaces
- A Laravel Echo TypeScript augmentation
- Global Inertia route response parameters
- A Vite env augmentation file, built from the `.env` settings prefixed with `VITE_`
- A generation cache that makes reruns of the full `ts:publish` command faster

For concrete examples of the new output, see the [generated output examples](https://github.com/abetwothree/laravel-ts-publish/tree/main/workbench/resources/js/types/data).

## Recommended Upgrade Flow

Follow these steps in order:

1. Update to the v2 package release in Composer.
2. Republish the config and views with `--force`. See [Configuration Changes](#configuration-changes) and [Templates](#templates).
3. Install `@tolki/ts` and remove `@tolki/enum`. See [New npm Package](#new-npm-package).
4. Update your Vite plugin import to `@tolki/ts/vite`.
5. Remove your old generated `data` folder.
6. Run a fresh publish with `php artisan ts:publish --fresh`.
7. Fix the import paths in your app code to match the modular namespace output. See [Modular Publishing Only](#modular-publishing-only).

## Breaking Changes

### Configuration Changes

The version 1 configuration was mostly flat. Version 2 has more features, so each main feature has its own configuration group.

Most version 1 settings move into their group, and the group name leaves the key: `enum_template` becomes `enums.template`, and `publish_models` becomes `models.enabled`.

If you published the config file, republish it with the `--force` flag:

```bash
php artisan vendor:publish --tag="ts-publish-config" --force
```

#### Full Configuration Update List

The tables below map every key from the flat version 1 config to its version 2 group. The recommended path is to republish the config file, then use your project's git diff to find the customizations you need to reapply.

::: details Show the full key-by-key migration table

##### 1) Pipeline Class Overrides Moved Under Each Feature Group

| Old key                      | New grouped key               |
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

##### 2) Shared Writer Overrides Renamed or Grouped

| Old key                     | New grouped key                                                        |
| --------------------------- | ---------------------------------------------------------------------- |
| `barrel_writer_class`       | `barrel_writer_class` (same key, still supported as a shared override) |
| `globals_writer_class`      | `globals.writer_class`                                                 |
| `json_writer_class`         | `json.writer_class`                                                    |
| `watcher_json_writer_class` | `watcher.writer_class`                                                 |

##### 3) Template Key Migration

| Old key             | New grouped key      |
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

##### 4) Feature Enable Flags Moved From Flat Keys to Grouped Keys

| Old key                       | New grouped key     |
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

##### 5) Namespace and Casing Options Moved Under Feature Groups

| Old key                    | New grouped key                   |
| -------------------------- | --------------------------------- |
| `models_namespace`         | `models.namespace`                |
| `enums_namespace`          | `enums.namespace`                 |
| `resources_namespace`      | `resources.namespace`             |
| `relationship_case`        | `models.relationship_case`        |
| `enum_method_case`         | `enums.method_case`               |
| `nullable_relations`       | `models.nullable_relations`       |
| `relation_nullability_map` | `models.relation_nullability_map` |

The `*.namespace` keys have no effect in version 2. The globals file names each namespace after the class's PHP namespace, as described in [Modular Publishing Only](#modular-publishing-only).

##### 6) Include, Exclude, and Additional Directories Migrated per Feature

| Old key                           | New grouped key                    |
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

These new version 2 groups use the same include, exclude, and additional directories pattern:

| New v2 groups using same pattern |
| -------------------------------- |
| `form_requests.*`                |
| `broadcast_events.*`             |

##### 7) Enum Metadata and Options Renamed and Regrouped

| Old key                            | New grouped key                     |
| ---------------------------------- | ----------------------------------- |
| `enum_metadata_enabled`            | `enums.metadata_enabled`            |
| `enums_use_tolki_package`          | `enums.use_tolki_package`           |
| `auto_include_enum_methods`        | `enums.auto_include_methods`        |
| `auto_include_enum_static_methods` | `enums.auto_include_static_methods` |

##### 8) Output File Naming and Output Directory Keys Grouped

| Old key                                 | New grouped key            |
| --------------------------------------- | -------------------------- |
| `global_filename`                       | `globals.filename`         |
| `global_directory`                      | `globals.output_directory` |
| `json_filename`                         | `json.filename`            |
| `json_output_directory`                 | `json.output_directory`    |
| `collected_files_json_filename`         | `watcher.filename`         |
| `collected_files_json_output_directory` | `watcher.output_directory` |

##### 9) Modular Publishing Setting Removed

| Old key              | Status in v2                          |
| -------------------- | ------------------------------------- |
| `modular_publishing` | Removed. Modular output is always on. |

##### 10) New Top-Level Config Groups in v2

These groups did not exist in the version 1 config:

| New v2 top-level group |
| ---------------------- |
| `cache.*`              |
| `routes.*`             |
| `form_requests.*`      |
| `broadcast_channels.*` |
| `broadcast_events.*`   |
| `inertia.*`            |
| `vite_env.*`           |

Version 2 also adds this nested group:

| New v2 nested group                    |
| -------------------------------------- |
| `broadcast_events.echo_augmentation.*` |

##### 11) Keys That Stayed the Same

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

### New npm Package

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

### Templates

If you published and modified the Blade templates, publish them again and reapply your changes:

```bash
php artisan vendor:publish --tag="laravel-ts-publish-views" --force
```

### `TsResourceCasts` Attribute Removed

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

### Pipeline Customization

If you changed or extended a collector, generator, transformer, writer, or template in version 1, check that your changes still work with version 2. Then register your classes under the new grouped `*_class` config keys to override the package defaults. See [Customizing the Pipeline](./customizing-the-pipeline.md).

### Modular Publishing Only

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

## New Command Options and Behavior

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

See [Publishing Types](./publishing.md) for every flag.

## New Config Groups in v2

Besides reorganizing the existing model, enum, and resource keys, version 2 adds these config groups:

- `routes.*`
- `form_requests.*`
- `broadcast_channels.*`
- `broadcast_events.*`
- `inertia.*`
- `vite_env.*`
- `cache.*`

If you published a version 1 config, republish it and reapply your customizations to the new grouped structure.

## New Generated Files You Should Expect

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

## Generation Cache

Version 2 adds a generation cache that skips unchanged classes after the first run:

- Run `php artisan ts:publish --fresh` after upgrading.
- Use `--fresh` any time you need to guarantee a full rebuild.

See [Cache Generation](./generating-cache.md) for how the cache works.
