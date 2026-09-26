# Publishing Types

The `ts:publish` Artisan command reads your Laravel app and writes TypeScript for your models, enums, API resources, routes, form requests, broadcast channels and events, and Inertia pages. It also writes a `vite-env.d.ts` for your `VITE_` variables. This page covers running the command, previewing its output, republishing one class, and choosing what each run publishes. To install the package first, see [Installation & Usage](./index.md).

## Running the Command

Run `ts:publish` to publish every enabled feature:

```bash
php artisan ts:publish
```

Generated files go to `resources/js/types/data/` by default. Set `output_directory` in `config/ts-publish.php` to change it.

The first run caches its work, so later runs rebuild only the classes whose source changed. Pass `--fresh` to rebuild everything:

```bash
php artisan ts:publish --fresh
```

[Cache Generation](./generating-cache.md) explains what counts as a change.

The command rewrites a file only when its content changes. Unchanged files keep their modification time, so Vite doesn't reload for them.

## Previewing Output

Pass `--preview=true` to print the generated TypeScript in the console without writing any files:

```bash
php artisan ts:publish --preview=true
```

::: warning Write `--preview=true`, not `--preview`
The `=true` is required. A bare `--preview` flag doesn't turn preview mode on, so the command writes real files.
:::

Preview mode helps you debug a type or review a change before anything is written. It works with `--source` too, and it never reads or writes the cache.

## Republishing a Single Class

Pass `--source` with a fully-qualified class name or a file path to republish one class instead of the whole set:

```bash
php artisan ts:publish --source="App\Enums\Status"
php artisan ts:publish --source="app/Enums/Status.php"
php artisan ts:publish --source="App\Http\Resources\UserResource"
```

The class can be an enum, a model, an API resource, a controller with at least one registered route, a form request, or a broadcast event. On a large project, a single-class run is much faster than a full publish. The [Vite plugin](./vite-plugin.md) uses it during development to republish only the file that changed.

A single-class run differs from a full run in these ways:

- **Cache**: it never reads or writes the cache.
- **Barrels and shared files**: it writes only the class's own files. Barrel `index.ts` files, the globals and JSON files, and the collected files manifest stay as they are.
- **Model filters**: for a model, it checks the `included` and `excluded` settings of `models` and `model_metadata` separately. It can publish the interface, the metadata companion, or both.
- **Directories**: `additional_directories` only affects discovery, so the class doesn't need to be in a listed directory.

The command fails with an error when it has nothing to publish. That happens when the class doesn't exist, isn't a kind the package publishes, has `#[TsExclude]`, or belongs to a feature that is disabled in config. A model also fails when the `models` and `model_metadata` filters both leave it out.

## Publishing After Migrations

By default, the package runs `ts:publish --fresh` after each `migrate` command that runs migrations, so your model types match the new schema. It uses `--fresh` because the cache can't see schema changes.

Turn it off in the config file:

```php
// config/ts-publish.php

'run_after_migrate' => false,
```

Or with an environment variable:

```dotenv
TS_PUBLISH_RUN_AFTER_MIGRATE=false
```

The post-migration run is also off when `output_to_files` is `false`, and when your app environment is `testing`, so migrations in your test suite don't republish types.

## Choosing What Gets Published

The package finds each feature's classes in a default directory:

| Feature          | Default directory    |
| ---------------- | -------------------- |
| Models           | `app/Models`         |
| Enums            | `app/Enums`          |
| API resources    | `app/Http/Resources` |
| Form requests    | `app/Http/Requests`  |
| Broadcast events | `app/Events`         |

Routes come from your registered routes, and broadcast channels come from your registered channels.

Each feature in the table has three settings in `config/ts-publish.php`:

| Key                      | Effect                                                                  |
| ------------------------ | ----------------------------------------------------------------------- |
| `included`               | Publish only these classes. An empty array publishes every class found. |
| `excluded`               | Never publish these classes.                                            |
| `additional_directories` | Also search these directories.                                          |

This example limits model publishing to two models, skips one, and searches a module directory:

```php
// config/ts-publish.php

'models' => [
    'included' => [
        App\Models\User::class,
        App\Models\Post::class,
    ],
    'excluded' => [
        App\Models\AuditLog::class,
    ],
    'additional_directories' => [
        'modules/Blog/Models',
    ],
],
```

The same three keys work for `enums`, `resources`, `form_requests`, and `broadcast_events`. Model metadata uses the `models` settings unless its own `model_metadata` block sets them.

`included` and `excluded` accept class names and directory paths. A directory matches every class inside it, and an `included` directory is searched even when it's outside the default directory. `additional_directories` also accepts a class name, for a single class that lives outside your directories.

Routes have their own filters (`only`, `except`, `exclude_middleware`, and `only_named`), covered in [Filtering & Excluding Routes](./routing.md#filtering-excluding-routes). To leave out one class or one member from its own source file, add `#[TsExclude]`, covered in [Excluding Content](./excluding-content.md).

## Publishing Only Some Output

You can turn a feature off for every run in config, or limit a single run with a flag. Eight features support both: enums, models, model metadata, API resources, routes, form requests, broadcast channels, and broadcast events.

### Turning a Feature Off in Config

Set a feature's `enabled` key to `false` to skip it on every run, including the post-migration run:

```php
// config/ts-publish.php

'resources' => [
    'enabled' => false,
    // ...
],
```

Every feature is enabled by default except `model_metadata`. A config file published before model metadata existed has no `model_metadata` block. To add one, copy the whole block, as the [Configuration Reference](./configuration-reference.md#model-metadata-model-metadata) explains.

Inertia, Vite env, the globals file, the JSON file, and the collected files manifest have their own `enabled` keys and no flag.

### Limiting a Single Run With Flags

Pass one `--only-*` flag to publish a single feature for one run:

| Flag                        | Publishes                                                  |
| --------------------------- | ---------------------------------------------------------- |
| `--only-enums`              | Enums                                                      |
| `--only-models`             | Model interfaces                                           |
| `--only-model-metadata`     | Model metadata companions                                  |
| `--only-resources`          | API resources                                              |
| `--only-routes`             | Routes                                                     |
| `--only-form-requests`      | Form requests                                              |
| `--only-broadcast-channels` | Broadcast channels                                         |
| `--only-broadcast-events`   | Broadcast events                                           |
| `--only-functional`         | Every enabled feature except model and resource interfaces |

```bash
php artisan ts:publish --only-enums
php artisan ts:publish --only-functional
```

The flags can't be combined, and passing two of them returns an error. `--only-functional` is the exception. Combined with another `--only-*` flag, it wins, and the other flag is ignored. The [Vite plugin](./vite-plugin.md) appends `--only-functional` on `vite build`, because model and resource interfaces are erased at compile time.

### When a Flag Requests a Disabled Feature

If a flag requests a feature that is disabled in config, such as `--only-enums` while `enums.enabled` is `false`, the command asks whether to publish it anyway. Declining publishes nothing. In a non-interactive shell, such as CI or a queued job, the command keeps the config setting and exits without an error.

If every feature is disabled in config and no flag overrides one, the command prints a warning and exits successfully. It does the same when `--only-functional` finds every feature it would publish disabled.

### Barrel Files in Partial Runs

A run rewrites the barrel `index.ts` files of each feature it publishes. A feature the run skips keeps its barrel files as they are.

Models and model metadata share one barrel in each namespace directory, and each export in it belongs to one of the two features. Companion files end in `_meta`. When a run rewrites a shared barrel, these rules apply:

- A feature the run publishes replaces its own exports, so a removed model's export disappears.
- A feature that is enabled in config but skipped by a flag keeps its exports.
- A feature that is disabled in config loses its exports.
- A model whose metadata provider throws keeps its last companion export, and the command exits with an error.

Barrels are generated files. A rewrite never keeps comments, or any other line that isn't an `export * from './file';` statement. [Barrel Files](./modular-publishing.md#barrel-files) shows the barrel layout.

::: tip Custom barrel writers
A `barrel_writer_class` that extends `BarrelWriter` without overriding anything keeps these rules. If you override `writeModular()` to change the barrel format, override `writeModularPreserving()` the same way. Partial runs call `writeModularPreserving()`, so the inherited version would write the default format on exactly those runs.
:::

### Other Files in Partial Runs

Every run except a `--source` run writes these files when their feature is enabled, whatever `--only-*` flag you pass:

- `vite-env.d.ts`
- `inertia-config.d.ts`
- The collected files manifest, which always lists the files of every enabled feature
- The globals and JSON files

::: warning The globals and JSON files follow the run
The globals and JSON files list only the classes the current run publishes. A partial run, including the `--only-functional` run the Vite plugin makes on `vite build`, rewrites them without the features it skipped. Run a full `ts:publish` to restore them.
:::

## Output Files

`output_to_files` controls whether a run writes anything to disk. It's `true` by default. When it's `false`, runs write no files, and the post-migration run is off.

You can turn three more outputs on or off independently:

| Config key        | Default | Output                                                                  |
| ----------------- | ------- | ----------------------------------------------------------------------- |
| `globals.enabled` | `false` | A declaration file that puts every published type in a global namespace |
| `json.enabled`    | `false` | A JSON file that describes every published class                        |
| `watcher.enabled` | `true`  | A JSON list of the PHP files the package collected, for file watchers   |

Each file goes to `output_directory` unless its own `output_directory` key is set. The [Configuration Reference](./configuration-reference.md) lists every key.

### Global Declaration File

When `globals.enabled` is `true`, the package also writes `laravel-ts-global.ts`. It declares every published model, enum, resource, form request, and broadcast event in a global namespace, so you can use the types without importing them:

```php
// config/ts-publish.php

'globals' => [
    'enabled' => true,
    'filename' => 'laravel-ts-global.ts',
],
```

Each namespace follows the class's PHP namespace, the same way the output directories do. `App\Models\User` becomes `app.models.User`:

```typescript
let user: app.models.User;
let status: app.enums.StatusType;
```

TypeScript sees these types only when your `tsconfig.json` includes the file.

### JSON Definitions File

When `json.enabled` is `true`, the package also writes `laravel-ts-definitions.json`. It describes every published model, enum, resource, form request, and broadcast event as data, such as properties, cases, and methods, instead of TypeScript source:

```php
// config/ts-publish.php

'json' => [
    'enabled' => true,
    'filename' => 'laravel-ts-definitions.json',
],
```

The file has one top-level object per feature: `models`, `enums`, `resources`, `formRequests`, and `broadcastEvents`. Each object is keyed by fully-qualified class name, and each entry has a `name` field that holds the short class name:

```json
{
  "models": {
    "App\\Models\\User": {
      "name": "User",
      "properties": [
        { "name": "id", "type": "number" },
        { "name": "email", "type": "string" }
      ]
    }
  }
}
```

Look entries up by fully-qualified name, and read `name` for display. Two classes can share a short name in different namespaces, such as `App\Models\User` and `Crm\Models\User`, and a short-name key would let one overwrite the other.

::: warning Changed in v2.3.0
Before v2.3.0, the file was keyed by short class name. Code written against that format needs to switch to fully-qualified keys.
:::

### Collected Files Manifest

When `watcher.enabled` is `true`, which is the default, the package writes `laravel-ts-collected-files.json`. It's a sorted list of the PHP files the package collected, relative to your project root:

```json
[
  "app/Enums/Status.php",
  "app/Http/Controllers/PostController.php",
  "app/Models/User.php"
]
```

File watchers such as the [Vite plugin](./vite-plugin.md) read it to know which files should trigger a republish. It lists the files of every enabled feature, including the controllers that have routes. When model metadata uses a custom provider, the provider's file is listed too, because changing it can change every metadata companion.

## Console Output

`ts:publish` supports three verbosity levels through Artisan's standard flags:

| Flag              | Output                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--quiet`, `-q`   | Nothing, except errors on stderr. The exit code reports the result, which suits tools such as the [Vite plugin](./vite-plugin.md).                           |
| _(none)_          | A summary: the output directory, the cache state, file counts per feature, extra files such as barrels and the globals and JSON files, and the elapsed time. |
| `--verbose`, `-v` | The summary, plus tables that list every generated file with its details, such as enum cases and methods, or model columns, mutators, and relations.         |

This example shows each level:

```bash
php artisan ts:publish
php artisan ts:publish -v
php artisan ts:publish --quiet
```

Quiet mode still writes every file and only suppresses console output. The Vite plugin passes `--quiet` by default, because the plugin only needs the exit code.

Unless you pass `--quiet`, the command ends with a warning for anything it couldn't fully publish. Examples include a model whose database table doesn't exist yet, and an Inertia action the package couldn't analyze.
