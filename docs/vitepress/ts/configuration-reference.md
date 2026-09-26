# Configuration Reference

This page lists every option in `config/ts-publish.php`, grouped by feature. To get your own copy of the file, with a comment on each option, publish it:

```bash
php artisan vendor:publish --tag="ts-publish-config"
```

The `*_class` keys swap a class in the publishing pipeline. See [Abstract Base Classes](./customizing-the-pipeline.md#abstract-base-classes) for what each class must implement.

## General Settings

| Config Key                    | Type     | Default                   | Description                                                                                                                                                                             |
| ----------------------------- | -------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run_after_migrate`           | `bool`   | `true`                    | Republish types with `--fresh` after `migrate` runs migrations. Set with `TS_PUBLISH_RUN_AFTER_MIGRATE`. See [Publishing After Migrations](./publishing.md#publishing-after-migrations) |
| `output_to_files`             | `bool`   | `true`                    | Setting it to `false` turns off the post-migration republish. `ts:publish` writes files on every run unless you pass `--preview=true`                                                   |
| `output_directory`            | `string` | `resources/js/types/data` | Directory where TypeScript files are written                                                                                                                                            |
| `namespace_strip_prefix`      | `string` | `''`                      | Prefix removed from class namespaces before they become output paths, such as `'Modules\\'`                                                                                             |
| `timestamps_as_date`          | `bool`   | `false`                   | Map date, datetime, and timestamp values, including Carbon instances, to `Date` instead of `string`                                                                                     |
| `custom_ts_mappings`          | `array`  | `[]`                      | Override or extend PHP-to-TypeScript type mappings                                                                                                                                      |
| `ts_extends.models`           | `array`  | `[]`                      | Global `extends` clauses for all models                                                                                                                                                 |
| `ts_extends.resources`        | `array`  | `[]`                      | Global `extends` clauses for all resources                                                                                                                                              |
| `ts_extends.form_requests`    | `array`  | `[]`                      | Global `extends` clauses for all form requests                                                                                                                                          |
| `ts_extends.broadcast_events` | `array`  | `[]`                      | Global `extends` clauses for all broadcast events                                                                                                                                       |
| `barrel_writer_class`         | `string` | `BarrelWriter`            | Class that writes barrel `index.ts` files                                                                                                                                               |

## Models (`models.*`)

| Config Key                        | Type     | Default                           | Description                                                                                                                                                                                                                                    |
| --------------------------------- | -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `models.enabled`                  | `bool`   | `true`                            | Enable or disable model publishing                                                                                                                                                                                                             |
| `models.namespace`                | `string` | `'models'`                        | Not used. The global declaration file names each namespace after the class's PHP namespace, such as `app.models`                                                                                                                               |
| `models.relationship_case`        | `string` | `'snake'`                         | Case style for relationships: `snake`, `camel`, or `pascal`                                                                                                                                                                                    |
| `models.nullable_relations`       | `bool`   | `true`                            | Append `\| null` to singular relation types that can be empty, based on each relation type's strategy                                                                                                                                          |
| `models.exclude_hidden`           | `bool`   | `false`                           | Omit Eloquent `$hidden` attributes from model interfaces, and from resource properties wherever the package derives them from the model. See [`exclude_hidden` and Attribute Filters](./api-resources.md#exclude-hidden-and-attribute-filters) |
| `models.relation_nullability_map` | `array`  | `[]`                              | Override the nullability strategy per relation class: `nullable`, `never`, `fk`, or `morph`                                                                                                                                                    |
| `models.template`                 | `string` | `laravel-ts-publish::model-split` | Blade template for model TypeScript output                                                                                                                                                                                                     |
| `models.included`                 | `array`  | `[]`                              | Only publish these models (empty = all)                                                                                                                                                                                                        |
| `models.excluded`                 | `array`  | `[]`                              | Exclude these models from publishing                                                                                                                                                                                                           |
| `models.additional_directories`   | `array`  | `[]`                              | Extra directories to search for models                                                                                                                                                                                                         |
| `models.collector_class`          | `string` | `ModelsCollector`                 | Discovers PHP model classes                                                                                                                                                                                                                    |
| `models.generator_class`          | `string` | `ModelGenerator`                  | Orchestrates transforming and writing                                                                                                                                                                                                          |
| `models.transformer_class`        | `string` | `ModelTransformer`                | Converts PHP class into TypeScript data                                                                                                                                                                                                        |
| `models.writer_class`             | `string` | `ModelWriter`                     | Writes TypeScript model files                                                                                                                                                                                                                  |

## Model Metadata (`model_metadata.*`)

A config file published before model metadata existed has no `model_metadata` block. Nothing breaks without it: every `model_metadata` key falls back in code to the packaged value, so an older config keeps working until you enable the feature. When you add the block, copy the whole block rather than a single key. The package merges its defaults one level deep, so a partial block replaces the packaged one.

| Config Key                              | Type     | Default                                    | Description                                                                                                                                                                                         |
| --------------------------------------- | -------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model_metadata.enabled`                | `bool`   | `false`                                    | Publish a runtime `{model}_meta.ts` companion beside each model interface                                                                                                                           |
| `model_metadata.provider_class`         | `string` | `DefaultModelMetadataProvider`             | The class whose `provide($model)` returns each companion's values. It must implement `ModelMetadataProvider`. The published config shows this key commented out; uncomment it to set your own class |
| `model_metadata.template`               | `string` | `laravel-ts-publish::model-meta`           | Blade template for the companion                                                                                                                                                                    |
| `model_metadata.included`               | `array`  | _inherits `models.included`_               | Only publish companions for these models (an explicit `[]` means all)                                                                                                                               |
| `model_metadata.excluded`               | `array`  | _inherits `models.excluded`_               | Never publish companions for these models                                                                                                                                                           |
| `model_metadata.additional_directories` | `array`  | _inherits `models.additional_directories`_ | Extra directories to search                                                                                                                                                                         |
| `model_metadata.collector_class`        | `string` | `ModelMetadataCollector`                   | Discovers models for this feature                                                                                                                                                                   |
| `model_metadata.generator_class`        | `string` | `ModelMetadataGenerator`                   | Orchestrates transforming and writing. Must extend the default class                                                                                                                                |
| `model_metadata.transformer_class`      | `string` | `ModelMetadataTransformer`                 | Builds each companion's data from the provider. Must extend the default class                                                                                                                       |
| `model_metadata.writer_class`           | `string` | `ModelMetadataWriter`                      | Writes the companion file                                                                                                                                                                           |

## Enums (`enums.*`)

| Config Key                          | Type     | Default                    | Description                                                                                                     |
| ----------------------------------- | -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `enums.enabled`                     | `bool`   | `true`                     | Enable or disable enum publishing                                                                               |
| `enums.namespace`                   | `string` | `'enums'`                  | Not used. The global declaration file names each namespace after the class's PHP namespace, such as `app.enums` |
| `enums.method_case`                 | `string` | `'camel'`                  | Case style for enum methods: `snake`, `camel`, or `pascal`                                                      |
| `enums.auto_include_methods`        | `bool`   | `false`                    | Include all public non-static enum methods without attributes                                                   |
| `enums.auto_include_static_methods` | `bool`   | `false`                    | Include all public static enum methods without attributes                                                       |
| `enums.metadata_enabled`            | `bool`   | `true`                     | Include `_cases`, `_methods`, `_static` metadata on enums                                                       |
| `enums.use_tolki_package`           | `bool`   | `true`                     | Wrap enums in `defineEnum()` from `@tolki/ts`                                                                   |
| `enums.template`                    | `string` | `laravel-ts-publish::enum` | Blade template for enum TypeScript output                                                                       |
| `enums.included`                    | `array`  | `[]`                       | Only publish these enums (empty = all)                                                                          |
| `enums.excluded`                    | `array`  | `[]`                       | Exclude these enums from publishing                                                                             |
| `enums.additional_directories`      | `array`  | `[]`                       | Extra directories to search for enums                                                                           |
| `enums.collector_class`             | `string` | `EnumsCollector`           | Discovers PHP enum classes                                                                                      |
| `enums.generator_class`             | `string` | `EnumGenerator`            | Orchestrates transforming and writing                                                                           |
| `enums.transformer_class`           | `string` | `EnumTransformer`          | Converts PHP enum into TypeScript data                                                                          |
| `enums.writer_class`                | `string` | `EnumWriter`               | Writes TypeScript enum files                                                                                    |

## Resources (`resources.*`)

| Config Key                         | Type     | Default                        | Description                                                                                                              |
| ---------------------------------- | -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `resources.enabled`                | `bool`   | `true`                         | Enable or disable resource publishing                                                                                    |
| `resources.namespace`              | `string` | `'resources'`                  | Not used. The global declaration file names each namespace after the class's PHP namespace, such as `app.http.resources` |
| `resources.template`               | `string` | `laravel-ts-publish::resource` | Blade template for resource TypeScript output                                                                            |
| `resources.included`               | `array`  | `[]`                           | Only publish these resources (empty = all)                                                                               |
| `resources.excluded`               | `array`  | `[]`                           | Exclude these resources from publishing                                                                                  |
| `resources.additional_directories` | `array`  | `[]`                           | Extra directories to search for resources                                                                                |
| `resources.collector_class`        | `string` | `ResourcesCollector`           | Discovers PHP resource classes                                                                                           |
| `resources.generator_class`        | `string` | `ResourceGenerator`            | Orchestrates transforming and writing                                                                                    |
| `resources.transformer_class`      | `string` | `ResourceTransformer`          | Converts PHP resource into TypeScript data                                                                               |
| `resources.writer_class`           | `string` | `ResourceWriter`               | Writes TypeScript resource files                                                                                         |

## Globals (`globals.*`)

See [Global Declaration File](./publishing.md#global-declaration-file) for what this file contains.

| Config Key                 | Type     | Default                       | Description                                                              |
| -------------------------- | -------- | ----------------------------- | ------------------------------------------------------------------------ |
| `globals.enabled`          | `bool`   | `false`                       | Generate a global namespace declaration file                             |
| `globals.output_directory` | `string` | `''`                          | Directory for the global declaration file. Empty uses `output_directory` |
| `globals.filename`         | `string` | `laravel-ts-global.ts`        | Filename for the global declaration file                                 |
| `globals.template`         | `string` | `laravel-ts-publish::globals` | Blade template for global declaration output                             |
| `globals.writer_class`     | `string` | `GlobalsWriter`               | Writes global declaration file                                           |

## JSON (`json.*`)

See [JSON Definitions File](./publishing.md#json-definitions-file) for the file's format.

| Config Key              | Type     | Default                       | Description                                                  |
| ----------------------- | -------- | ----------------------------- | ------------------------------------------------------------ |
| `json.enabled`          | `bool`   | `false`                       | Output all definitions as a JSON file                        |
| `json.filename`         | `string` | `laravel-ts-definitions.json` | Filename for the JSON output                                 |
| `json.output_directory` | `string` | `''`                          | Directory for the JSON output. Empty uses `output_directory` |
| `json.writer_class`     | `string` | `JsonWriter`                  | Writes JSON definitions file                                 |

## Watcher (`watcher.*`)

See [Collected Files Manifest](./publishing.md#collected-files-manifest) for what the file lists.

| Config Key                 | Type     | Default                           | Description                                                           |
| -------------------------- | -------- | --------------------------------- | --------------------------------------------------------------------- |
| `watcher.enabled`          | `bool`   | `true`                            | Output collected PHP file paths as JSON (for file watchers)           |
| `watcher.filename`         | `string` | `laravel-ts-collected-files.json` | Filename for the collected files JSON                                 |
| `watcher.output_directory` | `string` | `''`                              | Directory for the collected files JSON. Empty uses `output_directory` |
| `watcher.writer_class`     | `string` | `WatcherJsonWriter`               | Writes collected files JSON for watchers                              |

## Routes (`routes.*`)

| Config Key                  | Type     | Default                     | Description                                                            |
| --------------------------- | -------- | --------------------------- | ---------------------------------------------------------------------- |
| `routes.enabled`            | `bool`   | `true`                      | Enable or disable route publishing                                     |
| `routes.method_casing`      | `string` | `'camel'`                   | Case style for route method names                                      |
| `routes.output_directory`   | `string` | `''`                        | Custom output directory for route files. Empty uses `output_directory` |
| `routes.only`               | `array`  | `[]`                        | Only publish these routes (empty = all)                                |
| `routes.except`             | `array`  | `[]`                        | Exclude these routes from publishing                                   |
| `routes.exclude_middleware` | `array`  | `[]`                        | Exclude routes with these middleware                                   |
| `routes.only_named`         | `bool`   | `false`                     | Only publish named routes                                              |
| `routes.collector_class`    | `string` | `RoutesCollector`           | Discovers PHP routes                                                   |
| `routes.generator_class`    | `string` | `RouteGenerator`            | Orchestrates transforming and writing                                  |
| `routes.transformer_class`  | `string` | `RouteTransformer`          | Converts routes into TypeScript data                                   |
| `routes.writer_class`       | `string` | `RouteWriter`               | Writes TypeScript route files                                          |
| `routes.template`           | `string` | `laravel-ts-publish::route` | Blade template for route output                                        |

## Form Requests (`form_requests.*`)

| Config Key                             | Type     | Default                            | Description                                                                                                             |
| -------------------------------------- | -------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `form_requests.enabled`                | `bool`   | `true`                             | Enable or disable form request publishing                                                                               |
| `form_requests.namespace`              | `string` | `'form-requests'`                  | Not used. The global declaration file names each namespace after the class's PHP namespace, such as `app.http.requests` |
| `form_requests.template`               | `string` | `laravel-ts-publish::form-request` | Blade template for form request TypeScript output                                                                       |
| `form_requests.output_directory`       | `string` | `''`                               | Custom output directory for form request files. Empty uses `output_directory`                                           |
| `form_requests.included`               | `array`  | `[]`                               | Only publish these form requests (empty = all)                                                                          |
| `form_requests.excluded`               | `array`  | `[]`                               | Exclude these form requests from publishing                                                                             |
| `form_requests.additional_directories` | `array`  | `[]`                               | Extra directories to search for form requests                                                                           |
| `form_requests.collector_class`        | `string` | `FormRequestsCollector`            | Discovers PHP FormRequest classes                                                                                       |
| `form_requests.generator_class`        | `string` | `FormRequestGenerator`             | Orchestrates transforming and writing                                                                                   |
| `form_requests.transformer_class`      | `string` | `FormRequestTransformer`           | Converts PHP FormRequest into TypeScript data                                                                           |
| `form_requests.writer_class`           | `string` | `FormRequestWriter`                | Writes TypeScript form request files                                                                                    |
| `form_requests.analyzer_class`         | `string` | `FormRequestRulesAnalyzer`         | Resolves `rules()`, and types `validated('key')` in Inertia page props                                                  |

`form_requests.analyzer_class` has no line in the published config file. Add the key to the `form_requests` block to point it at your own class. The same class also types [`$request->validated('key')`](./form-requests.md#reading-a-single-validated-field) in Inertia page props, so swapping it changes those types too.

## Broadcast Channels (`broadcast_channels.*`)

| Config Key                            | Type     | Default                                  | Description                                                                  |
| ------------------------------------- | -------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `broadcast_channels.enabled`          | `bool`   | `true`                                   | Enable or disable broadcast channel publishing                               |
| `broadcast_channels.filename`         | `string` | `broadcast-channels.ts`                  | Filename for the generated channels file                                     |
| `broadcast_channels.template`         | `string` | `laravel-ts-publish::broadcast-channels` | Blade template for the channels output                                       |
| `broadcast_channels.output_directory` | `string` | `''`                                     | Custom output directory for the channels file. Empty uses `output_directory` |
| `broadcast_channels.collector_class`  | `string` | `BroadcastChannelsCollector`             | Discovers registered channel names                                           |
| `broadcast_channels.writer_class`     | `string` | `BroadcastChannelsWriter`                | Writes the `broadcast-channels.ts` file                                      |

## Broadcast Events (`broadcast_events.*`)

| Config Key                                            | Type      | Default                                      | Description                                                                                                                                                                                                           |
| ----------------------------------------------------- | --------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `broadcast_events.enabled`                            | `bool`    | `true`                                       | Enable or disable broadcast event publishing                                                                                                                                                                          |
| `broadcast_events.index_filename`                     | `string`  | `broadcast-events.ts`                        | Filename for the combined index file                                                                                                                                                                                  |
| `broadcast_events.index_template`                     | `string`  | `laravel-ts-publish::broadcast-events-index` | Blade template for the index file                                                                                                                                                                                     |
| `broadcast_events.template`                           | `string`  | `laravel-ts-publish::broadcast-event`        | Blade template for each per-event interface file                                                                                                                                                                      |
| `broadcast_events.output_directory`                   | `string`  | `''`                                         | Custom output directory for event files. Empty uses `output_directory`                                                                                                                                                |
| `broadcast_events.included`                           | `array`   | `[]`                                         | Only publish these event classes (empty = all)                                                                                                                                                                        |
| `broadcast_events.excluded`                           | `array`   | `[]`                                         | Exclude these event classes from publishing                                                                                                                                                                           |
| `broadcast_events.additional_directories`             | `array`   | `[]`                                         | Extra directories to search for event classes                                                                                                                                                                         |
| `broadcast_events.collector_class`                    | `string`  | `BroadcastEventsCollector`                   | Discovers `ShouldBroadcast` classes                                                                                                                                                                                   |
| `broadcast_events.generator_class`                    | `string`  | `BroadcastEventGenerator`                    | Orchestrates transforming and writing                                                                                                                                                                                 |
| `broadcast_events.transformer_class`                  | `string`  | `BroadcastEventTransformer`                  | Converts a PHP event class into TypeScript data                                                                                                                                                                       |
| `broadcast_events.writer_class`                       | `string`  | `BroadcastEventWriter`                       | Writes per-event TypeScript files                                                                                                                                                                                     |
| `broadcast_events.index_writer_class`                 | `string`  | `BroadcastEventsIndexWriter`                 | Writes the combined index file                                                                                                                                                                                        |
| `broadcast_events.echo_augmentation.enabled`          | `bool`    | `true`                                       | Generate the Echo module augmentation file                                                                                                                                                                            |
| `broadcast_events.echo_augmentation.echo_package`     | `?string` | `null`                                       | npm package to augment. When `null`, the first of these that your `package.json` lists, checked in this order: `@laravel/echo-vue`, `@laravel/echo-react`, `@laravel/echo-svelte`. With none of them, `@laravel/echo` |
| `broadcast_events.echo_augmentation.filename`         | `string`  | `echo-broadcast-events.d.ts`                 | Filename for the Echo augmentation file                                                                                                                                                                               |
| `broadcast_events.echo_augmentation.template`         | `string`  | `laravel-ts-publish::echo-broadcast-events`  | Blade template for the Echo augmentation file                                                                                                                                                                         |
| `broadcast_events.echo_augmentation.output_directory` | `string`  | `''`                                         | Custom output directory for the Echo augmentation file. Empty uses `broadcast_events.output_directory`, then `output_directory`                                                                                       |
| `broadcast_events.echo_augmentation.writer_class`     | `string`  | `BroadcastEventsEchoWriter`                  | Writes the Echo augmentation file                                                                                                                                                                                     |

## Inertia (`inertia.*`)

| Config Key                        | Type      | Default               | Description                                                                                                                                    |
| --------------------------------- | --------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `inertia.enabled`                 | `bool`    | `true`                | Enable or disable Inertia shared-data and page-prop analysis                                                                                   |
| `inertia.inertia_middleware_path` | `?string` | `null`                | Directory to search for the `HandleInertiaRequests` middleware (defaults to `app_path()`)                                                      |
| `inertia.augmentation_filename`   | `string`  | `inertia-config.d.ts` | Filename for the generated module augmentation file                                                                                            |
| `inertia.output_directory`        | `string`  | `''`                  | Custom output directory. Empty uses `routes.output_directory`, then the global `output_directory`                                              |
| `inertia.component_casing`        | `string`  | `'camel'`             | Casing style for derived page-prop export names, used by the per-route page props. See [Inertia Integration](./routing.md#inertia-integration) |
| `inertia.ui_table_package`        | `?string` | `null`                | npm package used for InertiaUI Table integration, used by the per-route page props                                                             |

## Vite Env (`vite_env.*`)

| Config Key                  | Type      | Default         | Description                                                                  |
| --------------------------- | --------- | --------------- | ---------------------------------------------------------------------------- |
| `vite_env.enabled`          | `bool`    | `true`          | Enable Vite environment type generation                                      |
| `vite_env.filename`         | `string`  | `vite-env.d.ts` | Filename for the Vite env declaration file                                   |
| `vite_env.output_directory` | `string`  | `''`            | Custom output directory for the Vite env file. Empty uses `output_directory` |
| `vite_env.source_file`      | `?string` | `null`          | Source `.env` file (defaults to `.env`, falls back to `.env.example`)        |

## Cache Generation (`cache.*`)

| Config Key        | Type      | Default                              | Description                                                            |
| ----------------- | --------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `cache.enabled`   | `bool`    | `true`                               | Skip re-generating unchanged classes after the first run               |
| `cache.store`     | `?string` | `null`                               | `null` = file cache under `directory`; or a Laravel cache store name   |
| `cache.directory` | `string`  | `storage/framework/cache/ts-publish` | Directory for the file-based cache                                     |
| `cache.key`       | `?string` | `null`                               | HMAC signing key for the cache (file and store); defaults to `app.key` |

The published config reads `cache.enabled`, `cache.store`, and `cache.key` from the `TS_PUBLISH_CACHE_ENABLED`, `TS_PUBLISH_CACHE_STORE`, and `TS_PUBLISH_CACHE_KEY` environment variables. See [Cache Generation](./generating-cache.md) for what triggers a rebuild, the storage options, and the `--fresh` flag.
