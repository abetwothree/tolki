<p align="center"><img src="https://raw.githubusercontent.com/abetwothree/tolki/refs/heads/master/docs/vitepress/public/tolki-logo-short.svg" width="50%" alt="Laravel Tolki JS Logo"></p>

# Tolki JS TypeScript Package

This package provides TypeScript utility functions meant to be used by the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish/) PHP Package.

Features currently include the following:

- TypeScript Enum support with similar functionality to a PHP enum.
- TypeScript Route support to use Laravel's route definitions in frontend projects.
- A supporting Vite plugin to automatically publish files on production builds and automatically update TypeScript definitions on PHP file changes during development.

## Documentation

The full documentation for the enum utilities can be found at [https://tolki.abe.dev](https://tolki.abe.dev/ts/).

<!-- AUTO-GENERATED-DOCS:START -->

## Installation & Usage

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) generates TypeScript from your Laravel app. It covers model and API resource interfaces, enums, routes, form requests, broadcast channels and events, Inertia page props, and Vite environment variables. Its npm companion, [`@tolki/ts`](https://www.npmjs.com/package/@tolki/ts), gives the published enums and routes their runtime behavior.

Published enums get PHP-style helpers such as [`from`](https://www.php.net/manual/en/backedenum.from.php), [`tryFrom`](https://www.php.net/manual/en/backedenum.tryfrom.php), and [`cases`](https://www.php.net/manual/en/unitenum.cases.php). Published routes become functional objects that work the same way as Laravel Wayfinder's route definitions.

This page installs both packages and sets up your project. To run the publish command and control what it writes, see [Publishing Types](https://tolki.abe.dev/ts/publishing.html).

### Installing the Laravel Package

The package requires PHP 8.4 or later and Laravel 12 or 13. Install it with Composer:

```bash
composer require abetwothree/laravel-ts-publish
```

Publish the config file to customize any setting:

```bash
php artisan vendor:publish --tag="ts-publish-config"
```

Optionally, publish the Blade views that render each generated file:

```bash
php artisan vendor:publish --tag="laravel-ts-publish-views"
```

If you're upgrading from an earlier version, follow the [Upgrade Guide](https://tolki.abe.dev/ts/upgrade-guide.html).

### Installing `@tolki/ts`

Install the npm package with npm, yarn, or pnpm:

```bash [npm]
npm install @tolki/ts
```

```bash [yarn]
yarn add @tolki/ts
```

```bash [pnpm]
pnpm add @tolki/ts
```

Published routes need `@tolki/ts` at runtime. Published enums use it too, unless you set `enums.use_tolki_package` to `false` in the config file, which removes their runtime dependency on it. See [Disabling Metadata or the `@tolki/ts` Wrapper](https://tolki.abe.dev/ts/enums.html#disabling-metadata-or-the-tolki-ts-wrapper) for what changes when it's off.

### Recommended Directory Structure

Generated files go to `resources/js/types/data` by default. The `output_directory` config key sets the location:

```php
// config/ts-publish.php

'output_directory' => resource_path('/js/types/data/'),
```

Add the directory to `.gitignore`. Because `ts:publish` regenerates the files locally, in CI, or before a production build, committing them only adds noise and merge conflicts:

```gitignore
# Ignore published TypeScript files
/resources/js/types/data/
```

If you use [ESLint](https://eslint.org/) or [Oxlint](https://oxc.rs/), add the directory to your linter's ignore list too.

### Importing the Published Files

Create an import alias for the published directory in both `tsconfig.json` and `vite.config.ts`. The alias avoids long relative paths and makes it clear that the imports are generated files.

Add the path to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@data/*": ["resources/js/types/data/*"]
    }
  }
}
```

Add the matching alias to `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@data": path.resolve(__dirname, "resources/js/types/data"),
    },
  },
});
```

The output is always organized into directory trees that follow your PHP namespaces. An app with a single root namespace, such as `App\Models` and `App\Enums`, gets one `app/` tree, so a default installation's imports look like this:

```typescript
import { Status } from "@data/app/enums";
import type { User } from "@data/app/models";
```

For apps with more than one root namespace, [Modular Publishing](https://tolki.abe.dev/ts/modular-publishing.html) shows how each namespace maps to a path.

### Publishing Your Types

Run the publish command to generate the files:

```bash
php artisan ts:publish
```

[Publishing Types](https://tolki.abe.dev/ts/publishing.html) covers preview mode, republishing a single class, filtering classes, and publishing only some features.

### Automatic Publishing With the Vite Plugin

The Vite plugin from `@tolki/ts` republishes for you. During `vite dev`, it watches the PHP files the package collected and republishes when one of them changes. During `vite build`, it publishes once before bundling. Add it to `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/ts/vite";

export default defineConfig({
  plugins: [laravelTsPublish()],
});
```

On `vite build`, the plugin appends `--only-functional` by default. That flag skips model and resource interfaces, which are erased at compile time.

If you use Laravel Sail and Vite runs on your host machine, point the plugin at the Sail binary. The plugin runs its command in a non-interactive shell, where shell aliases such as `sail` usually aren't available:

```typescript
laravelTsPublish({
  command: "./vendor/bin/sail artisan ts:publish",
});
```

See [Single-File Republishing](https://tolki.abe.dev/ts/vite-plugin.html#single-file-republishing) for how the plugin republishes one file during `vite dev`, and [Plugin Options](https://tolki.abe.dev/ts/vite-plugin.html#plugin-options) for every option.

### Automatic Publishing on Composer Update

Add `ts:publish` to the `post-update-cmd` script in `composer.json` to republish types after every `composer update`:

```json
{
  "scripts": {
    "post-update-cmd": ["@php artisan ts:publish"]
  }
}
```

Composer runs `post-update-cmd` only for `composer update`, or for a `composer install` without a lock file. To also publish on a `composer install` from a lock file, such as in CI, add the same command to `post-install-cmd`.

### Analyzer API

`AstEngine::analyze()` gives you the TypeScript types the package infers for the array a class method returns, without publishing or writing anything. Pass a class and a method name, and you get back an `AnalysisResult` with the typed properties and the imports those types need.

`analyze()` and `AnalysisResult` are the only supported API. Other `AstEngine` methods and other classes in the analyzer are internal and can change without notice. See [Analyzer API](https://tolki.abe.dev/ts/analyzer-api.html) for the full reference.

### Pre-Command Hook

To run your own code right before `ts:publish`, register a closure with `LaravelTsPublish::callCommandUsing()` in a service provider's `boot()` method. Common uses are configuring directories, swapping pipeline classes, and reacting to feature flags. See [Pre-Command Hook](https://tolki.abe.dev/ts/pre-command-hook.html) for worked examples.

## Publishing Types

The `ts:publish` Artisan command reads your Laravel app and writes TypeScript for your models, enums, API resources, routes, form requests, broadcast channels and events, and Inertia pages. It also writes a `vite-env.d.ts` for your `VITE_` variables. This page covers running the command, previewing its output, republishing one class, and choosing what each run publishes. To install the package first, see [Installation & Usage](https://tolki.abe.dev/ts/index.html).

### Running the Command

Run `ts:publish` to publish every enabled feature:

```bash
php artisan ts:publish
```

Generated files go to `resources/js/types/data/` by default. Set `output_directory` in `config/ts-publish.php` to change it.

The first run caches its work, so later runs rebuild only the classes whose source changed. Pass `--fresh` to rebuild everything:

```bash
php artisan ts:publish --fresh
```

[When a Class Is Rebuilt](https://tolki.abe.dev/ts/generating-cache.html#when-a-class-is-rebuilt) explains what counts as a change.

The command rewrites a file only when its content changes. Unchanged files keep their modification time, so Vite doesn't reload for them.

### Previewing Output

Pass `--preview=true` to print the generated TypeScript in the console without writing any files:

```bash
php artisan ts:publish --preview=true
```

The `=true` is required. A bare `--preview` flag doesn't turn preview mode on, so the command writes real files.

Preview mode helps you debug a type or review a change before anything is written. It works with `--source` too, and it never reads or writes the cache.

### Republishing a Single Class

Pass `--source` with a fully-qualified class name or a file path to republish one class instead of the whole set:

```bash
php artisan ts:publish --source="App\Enums\Status"
php artisan ts:publish --source="app/Enums/Status.php"
php artisan ts:publish --source="App\Http\Resources\UserResource"
```

The class can be an enum, a model, an API resource, a controller with at least one registered route, a form request, or a broadcast event. On a large project, a single-class run is much faster than a full publish. The [Vite plugin](https://tolki.abe.dev/ts/vite-plugin.html#single-file-republishing) uses it during development to republish only the file that changed.

A single-class run differs from a full run in these ways:

- **Cache**: it never reads or writes the cache.
- **Barrels and shared files**: it writes only the class's own files. Barrel `index.ts` files, the globals and JSON files, and the collected files manifest stay as they are.
- **Model filters**: for a model, it checks the `included` and `excluded` settings of `models` and `model_metadata` separately. It can publish the interface, the metadata companion, or both.
- **Other filters**: for a class that isn't a model, it doesn't check `included` or `excluded`, so it publishes a class those settings leave out.
- **Directories**: `additional_directories` only affects discovery, so the class doesn't need to be in a listed directory.

The command fails with an error when it has nothing to publish. That happens when the class doesn't exist, isn't a class the package publishes, has `#[TsExclude]`, or belongs to a feature that is disabled in config. A model also fails when the `models` and `model_metadata` filters both leave it out.

### Publishing After Migrations

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

### Choosing What Gets Published

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
| `excluded`               | Leave these classes out.                                                |
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

Routes have their own filters (`only`, `except`, `exclude_middleware`, and `only_named`), covered in [Filtering & Excluding Routes](https://tolki.abe.dev/ts/routing.html#filtering-excluding-routes). To leave out one class or one member from its own source file, add `#[TsExclude]`, covered in [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html).

### Publishing Only Some Output

You can turn a feature off for every run in config, or limit a single run with a flag. Eight features support both: enums, models, model metadata, API resources, routes, form requests, broadcast channels, and broadcast events.

#### Turning a Feature Off in Config

Set a feature's `enabled` key to `false` to skip it on every run, including the post-migration run:

```php
// config/ts-publish.php

'resources' => [
    'enabled' => false,
    // ...
],
```

Every feature is enabled by default except `model_metadata`. A config file published before model metadata existed has no `model_metadata` block. To add one, copy the whole block, as the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html#model-metadata-model-metadata) explains.

Inertia, Vite env, the globals file, the JSON file, and the collected files manifest have their own `enabled` keys and no flag.

#### Limiting a Single Run With Flags

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

For example:

```bash
php artisan ts:publish --only-enums
php artisan ts:publish --only-functional
```

The flags can't be combined, and passing two of them returns an error. `--only-functional` is the exception. Combined with another `--only-*` flag, it wins, and the other flag is ignored. The [Vite plugin](https://tolki.abe.dev/ts/vite-plugin.html#production-builds) appends `--only-functional` on `vite build`, because model and resource interfaces are erased at compile time.

#### When a Flag Requests a Disabled Feature

If a flag requests a feature that is disabled in config, such as `--only-enums` while `enums.enabled` is `false`, the command asks whether to publish it anyway. Declining publishes nothing. In a non-interactive shell, such as CI or a queued job, the command keeps the config setting and exits without an error.

If every feature is disabled in config and no flag overrides one, the command prints a warning and exits successfully. It does the same when `--only-functional` finds every feature it would publish disabled.

#### Barrel Files in Partial Runs

A run rewrites the barrel `index.ts` files of each feature it publishes. A feature the run skips keeps its barrel files as they are.

Models and model metadata share one barrel in each namespace directory. [Barrel Files](https://tolki.abe.dev/ts/modular-publishing.html#barrel-files) lists which exports a run keeps in it.

#### Other Files in Partial Runs

Every run except a `--source` or `--preview=true` run writes these files when their feature is enabled, whatever `--only-*` flag you pass:

- `vite-env.d.ts`
- `inertia-config.d.ts`
- The collected files manifest, which always lists the files of every enabled feature
- The globals and JSON files

A partial run keeps the classes of the features it skips in the globals and JSON files, as the last run that published them left them. With the cache off, or with nothing cached for those features (the first publish, `--fresh`, or a change to your config, templates or the package version), it rewrites them without those features.

### Output Files

`output_to_files` is `true` by default. Setting it to `false` turns off the post-migration run. It doesn't stop `ts:publish`, which writes its files on every run unless you pass `--preview=true`.

You can turn these three outputs on or off independently:

| Config key        | Default | Output                                                                  |
| ----------------- | ------- | ----------------------------------------------------------------------- |
| `globals.enabled` | `false` | A declaration file that puts every published type in a global namespace |
| `json.enabled`    | `false` | A JSON file that describes every published class                        |
| `watcher.enabled` | `true`  | A JSON list of the PHP files the package collected, for file watchers   |

Each file goes to `output_directory` unless its own `output_directory` key is set. The [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html) lists every key.

#### Global Declaration File

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

A namespace segment of more than one word is camel-cased, because a hyphen isn't valid in a namespace name. `App\Http\Resources\ReportCards\SummaryCardResource` is `app.http.resources.reportCards.SummaryCardResource`, while its file is written under `report-cards/`. An acronym is lowered as one word, so `API` is `api` and `HTTPClient` is `httpClient`.

When two published types share a name, such as `App\Models\User` and `Crm\Models\User`, each reference from another namespace is qualified with the namespace of the class your PHP code names, such as `crm.models.User`.

TypeScript sees these types only when your `tsconfig.json` includes the file.

#### JSON Definitions File

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

#### Collected Files Manifest

When `watcher.enabled` is `true`, which is the default, the package writes `laravel-ts-collected-files.json`. It's a sorted list of the PHP files the package collected, relative to your project root:

```json
[
  "app/Enums/Status.php",
  "app/Http/Controllers/PostController.php",
  "app/Models/User.php"
]
```

File watchers such as the [Vite plugin](https://tolki.abe.dev/ts/vite-plugin.html) read it to know which files should trigger a republish. It lists the files of every enabled feature, including the controllers that have routes. When model metadata uses a custom provider, the provider's file is listed too, because changing it can change every metadata companion.

### Console Output

`ts:publish` supports three verbosity levels through Artisan's standard flags:

| Flag              | Output                                                                                                                                                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--quiet`, `-q`   | Nothing, except errors on stderr. The exit code reports the result, which suits tools such as the [Vite plugin](https://tolki.abe.dev/ts/vite-plugin.html).                                                                                                                               |
| _(none)_          | A summary: the output directory, the cache state, file counts per feature, extra files such as barrels and the globals and JSON files, and the elapsed time.                                                                                                                              |
| `--verbose`, `-v` | The summary, plus a table for each of enums, models, model metadata, resources, routes, and form requests, with details such as enum cases and methods, or model columns, mutators, and relations. A last table lists the extra files, such as barrels, globals, and the broadcast files. |

This example shows each level:

```bash
php artisan ts:publish
php artisan ts:publish -v
php artisan ts:publish --quiet
```

Quiet mode still writes every file and only suppresses console output. The Vite plugin passes `--quiet` by default, because the plugin only needs the exit code.

Unless you pass `--quiet`, the command ends with a warning for anything it couldn't fully publish. Examples include a model whose database table doesn't exist yet, and an Inertia action the package couldn't analyze.

## Enums

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) turns every PHP enum into a TypeScript object that behaves like the PHP enum, not only a union of its values. `.from()`, `.tryFrom()` and `.cases()` work on it through the `@tolki/ts` package, and you can publish your enum's own methods and static methods alongside the cases.

For example, this enum publishes its cases and its `label()` method:

```php
enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';

    #[TsEnumMethod]
    public function label(): string
    {
        return match($this) {
            self::Active => 'Active User',
            self::Inactive => 'Inactive User',
        };
    }
}
```

On the frontend, you use the published enum much like the PHP one:

```typescript
import { Status } from "@js/types/data/app/enums";

Status.Active; // 'active'
Status.label.Active; // 'Active User'
Status.from("active").label; // 'Active User', a PHP-like enum "instance"
```

`@tolki/ts` works together with the files this package generates and isn't meant to be used on its own. See [Installing `@tolki/ts`](https://tolki.abe.dev/ts/index.html#installing-tolki-ts) to add it to your project. To send one enum case to the frontend as a full object, return it through [`EnumResource`](https://tolki.abe.dev/ts/enum-api-resource.html).

### How Enums Are Generated

The `ts:publish` command publishes each enum as follows:

- **One file per enum**: `App\Enums\Status` is written to `app/enums/status.ts`, following the enum's namespace. Each namespace directory also gets an `index.ts` barrel that re-exports its files (`export * from './status'`).
- **Backed and unit enums**: enums backed by `int` or `string` and unit enums are all supported. A unit enum uses each case name as its value.
- **Metadata**: with `enums.metadata_enabled` on (the default), each enum has a `backed` flag and a `_cases` list. It also gets a `_methods` list when it publishes [instance methods](#tsenummethod), and a `_static` list when it publishes [static methods](#tsenumstaticmethod).
- **The `defineEnum()` wrapper**: with `enums.use_tolki_package` also on (the default), the enum is wrapped in `defineEnum()` from `@tolki/ts`.

### Anatomy of a Generated Enum

For a `Color` enum with case descriptions and a `hex()` method, the published file looks like this:

```typescript
import { defineEnum } from "@tolki/ts";

/**
 * Colors a label can use.
 *
 * @see App\Enums\Color
 */
export const Color = defineEnum({
  /** Primary red color */
  Red: "red",
  /** Primary green color */
  Green: "green",
  Blue: "blue",
  backed: true,
  /** Get the hex code for the color */
  hex: {
    Red: "#EF4444",
    Green: "#22C55E",
    Blue: "#3B82F6",
  },
  _cases: ["Red", "Green", "Blue"],
  _methods: ["hex"],
} as const);

export type ColorType = "red" | "green" | "blue";
export type ColorKind = "Red" | "Green" | "Blue";
```

Each part of the file does one job:

- **JSDoc comments**: the PHPDoc descriptions of the enum and its cases. See [PHPDoc Descriptions](#phpdoc-descriptions).
- **`backed`**: whether the PHP enum is backed. [`EnumResource`](https://tolki.abe.dev/ts/enum-api-resource.html) responses include the same key, and [`AsEnum`](#type-reference) types it.
- **`hex`**: an instance method published with [`#[TsEnumMethod]`](#tsenummethod), with one value per case.
- **`_cases`, `_methods` and `_static`**: the lists the `@tolki/ts` functions read to build a PHP-like instance. See [Runtime Utilities](#runtime-utilities).
- **`ColorType` and `ColorKind`**: type aliases for the case values and the case names. See [Value & Key Types](#value--key-types).

### Enum Attributes

All attributes live in the `AbeTwoThree\LaravelTsPublish\Attributes` namespace.

| Attribute               | Target        | Description                                                                               |
| ----------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| `#[TsEnumMethod]`       | Method        | Publish a method's return value. Called once per case, producing an object keyed by case. |
| `#[TsEnumStaticMethod]` | Static method | Publish a static method's return value. Called once and added as a top-level property.    |
| `#[TsEnum]`             | Enum class    | Rename the enum or add a description.                                                     |
| `#[TsCase]`             | Enum case     | Rename a case, change its frontend value, or add a description.                           |
| `#[TsExclude]`          | Class, method | Exclude a whole enum or one method.                                                       |

#### `#[TsEnumMethod]`

Mark an instance method with `#[TsEnumMethod]` to publish its return value for every case. Here the attribute also renames the key and adds a description:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsEnumMethod;

enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';

    #[TsEnumMethod(name: 'statusLabel', description: 'Human-readable label')]
    public function label(): string
    {
        return match($this) {
            self::Active => 'Active User',
            self::Inactive => 'Inactive User',
        };
    }
}
```

The method's values publish under the new key, one per case:

```typescript
export const Status = defineEnum({
  Active: "active",
  Inactive: "inactive",
  backed: true,
  /** Human-readable label */
  statusLabel: {
    Active: "Active User",
    Inactive: "Inactive User",
  },
  _cases: ["Active", "Inactive"],
  _methods: ["statusLabel"],
} as const);
```

The attribute takes these parameters:

| Parameter     | Type     | Default     | Description                                                                                                         |
| ------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `name`        | `string` | Method name | The key name in the output. [`enums.method_case`](#casing) applies to it too.                                       |
| `description` | `string` | `''`        | A JSDoc comment above the property.                                                                                 |
| `params`      | `array`  | `[]`        | Named arguments to call the method with. See [Methods With Required Parameters](#methods-with-required-parameters). |

##### Methods With Required Parameters

A method with required parameters is skipped by default, instead of publishing misleading `null` values. To include one, pass `params`. The package calls the method once per case, with those values as named arguments:

```php
#[TsEnumMethod(description: 'Compare with threshold', params: ['threshold' => 1])]
public function isAboveThreshold(int $threshold): bool
{
    return $this->value > $threshold;
}
```

`params` values must be constant expressions, because they're PHP attribute arguments. A method whose parameters are all optional needs no `params`. If a method throws for a case, that case's value publishes as `null`.

##### Object and Array Values

An instance or static method's value publishes as `json_encode()` writes it, which is also what an [`EnumResource`](https://tolki.abe.dev/ts/enum-api-resource.html) response sends. An object publishes as its JSON:

- A Carbon date publishes as its ISO 8601 string, such as `'2026-01-01T17:00:00.000000Z'`.
- A collection publishes as its items.
- A `JsonSerializable` object publishes what its `jsonSerialize()` returns.
- Any other object publishes its public properties. An object with only protected or private properties publishes `{}`, and a plain PHP `DateTime` publishes its `date`, `timezone_type` and `timezone` fields.

A value that `json_encode()` can't write, such as `NAN` or a string that isn't valid UTF-8, publishes as `null`.

An array whose integer keys don't count up from 0 in order publishes as an object keyed by those numbers, because that's how `json_encode()` writes it. `array_filter()` keeps each item's key, so it returns such an array whenever it removes an item before one it keeps. An `EnumResource` response sends the same value as a list, so `ts:publish` warns about the method. Keys that are numeric strings, such as `'01'`, are re-indexed the same way. Wrap the array in `array_values()` to publish and send a list, or use keys that aren't numeric to publish and send an object:

```php
#[TsEnumMethod]
public function higherPriorities(): array
{
    return array_values(array_filter(self::cases(), fn (self $case) => $case->value > $this->value));
}
```

#### `#[TsEnumStaticMethod]`

`#[TsEnumStaticMethod]` takes the same `name`, `description` and `params` options. The package calls the method once, not once per case, and publishes its return value as one top-level property:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsEnumStaticMethod;

#[TsEnumStaticMethod]
public static function options(): array
{
    return array_map(fn (self $s) => ['value' => $s->value, 'label' => $s->name], self::cases());
}
```

The return value publishes as it is:

```typescript
export const Status = defineEnum({
  // ...cases
  options: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  _static: ["options"],
} as const);
```

A static method with required parameters is skipped unless you pass `params`, the same as with `#[TsEnumMethod]`.

#### `#[TsEnum]`

`#[TsEnum]` renames the enum's TypeScript const, or adds a description to it:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsEnum;

#[TsEnum('UserStatus', description: 'All possible user account statuses')]
enum Status: string { case Active = 'active'; case Inactive = 'inactive'; }
```

The new name also names the type aliases:

```typescript
/**
 * All possible user account statuses
 *
 * @see App\Enums\Status
 */
export const UserStatus = defineEnum({
  Active: "active",
  Inactive: "inactive",
  // ...
} as const);

export type UserStatusType = "active" | "inactive";
export type UserStatusKind = "Active" | "Inactive";
```

The file takes the new name too (`user-status.ts`), and models that use the enum refer to it as `UserStatusType`. The attribute takes these parameters:

| Parameter     | Type     | Description                                                                                                                                                                                                                                  |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | `string` | The TypeScript const name. Use it when two enums in one namespace publish the same name, or when a [route file](https://tolki.abe.dev/ts/routing.html#what-the-props-expression-can-be) uses two same-named enums from different namespaces. |
| `description` | `string` | A JSDoc comment. It takes priority over any PHPDoc description.                                                                                                                                                                              |

An enum `Role` publishes the type `RoleType`. A second enum named `RoleType` in the same namespace publishes a const with that name, and the two can't share a barrel file or a global namespace. `ts:publish` warns when it finds such a pair. Rename one of them with `#[TsEnum]`. In two different namespaces this pair is fine, because a file that imports both gets an alias for one.

#### `#[TsCase]`

`#[TsCase]` renames a case, changes its frontend value, or adds a description:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCase;

enum Status: int
{
    #[TsCase(name: 'Enabled', value: 'enabled', description: 'The user can sign in')]
    case Active = 1;

    #[TsCase(name: 'Disabled', value: 'disabled')]
    case Inactive = 0;
}
```

The published enum and its type aliases use the new names and values:

```typescript
export const Status = defineEnum({
  /** The user can sign in */
  Enabled: "enabled",
  Disabled: "disabled",
  // ...
} as const);

export type StatusType = "enabled" | "disabled";
export type StatusKind = "Enabled" | "Disabled";
```

The attribute takes these parameters:

| Parameter     | Type            | Description                     |
| ------------- | --------------- | ------------------------------- |
| `name`        | `string`        | The case's key name.            |
| `value`       | `string \| int` | The case's value.               |
| `description` | `string`        | A JSDoc comment above the case. |

A changed `value` applies to the published enum and to [`EnumResource`](https://tolki.abe.dev/ts/enum-api-resource.html) responses. Laravel still serializes an enum-cast model column with the PHP value, so a model's `{Enum}Type` property won't match the JSON your API sends for that column.

### Value & Key Types

Every enum gets a `{Name}Type` alias of its case values. A backed enum also gets a `{Name}Kind` alias of its case names. A unit enum doesn't need one, because its values already are its case names:

```typescript
export type StatusType = "active" | "inactive";
export type StatusKind = "Active" | "Inactive"; // backed enums only
```

Use the aliases to type a raw value or a case name:

```typescript
import type { StatusType, StatusKind } from "@js/types/data/app/enums";

function setStatus(status: StatusType) {} // only 'active' | 'inactive'
function setStatusByKey(status: StatusKind) {} // only 'Active' | 'Inactive'
```

### Metadata & the `defineEnum()` Wrapper

With `enums.metadata_enabled` on, every enum has a `_cases` list, plus `_methods` and `_static` lists when it publishes instance or static methods. You don't read these lists yourself. `defineEnum()` and the standalone `from`, `tryFrom` and `cases` functions use them to build a PHP-like instance from a case value:

```typescript
import { Status } from "@js/types/data/app/enums";

const instance = Status.from("active");
// { name: 'Active', value: 'active', backed: true, label: 'Active User', options: [...] }
```

An instance method resolves to its value for the matched case (`label`), and a static method passes through as it is (`options`). See [Runtime Utilities](#runtime-utilities) for every function.

#### Disabling Metadata or the `@tolki/ts` Wrapper

Set `enums.metadata_enabled` to `false` to publish plain enum objects, without `backed`, the `_cases`, `_methods` and `_static` lists, or the `defineEnum()` wrapper:

```php
// config/ts-publish.php
'enums' => [
    'metadata_enabled' => false,
],
```

To keep the metadata but drop the wrapper, turn off `enums.use_tolki_package` instead:

```php
'enums' => [
    'metadata_enabled' => true,
    'use_tolki_package' => false,
],
```

The setting controls every `AsEnum<>` type the package publishes:

- **Models**: the `{Model}Resource` interfaces and the `import { type AsEnum }` line aren't generated. The main `{Model}` interface uses `{Enum}Type` for enum columns either way. See [Enum-Typed Columns](https://tolki.abe.dev/ts/models.html#enum-typed-columns-model-resource).
- **API resources**: an `EnumResource::make()` property publishes as `StatusType` instead of `AsEnum<typeof Status>`, and the enum is imported as a type (`import type { StatusType }`) instead of a value (`import { Status }`). See [Enum Properties With `EnumResource`](https://tolki.abe.dev/ts/api-resources.html#enum-properties-with-enumresource).
- **Inertia shared data**: an `EnumResource` prop shared from `HandleInertiaRequests::share()` publishes as `RoleType` with a type import, instead of `AsEnum<typeof Role>` with a value import. See [Inertia](https://tolki.abe.dev/ts/inertia.html).

Leave it on unless your enums must not depend on `@tolki/ts` at runtime. [Routes](https://tolki.abe.dev/ts/routing.html) import `@tolki/ts` whatever this setting is.

### Auto-Including All Enum Methods

By default, only methods marked with `#[TsEnumMethod]` or `#[TsEnumStaticMethod]` publish. To publish every public method without marking each one, turn on auto-include:

```php
// config/ts-publish.php
'enums' => [
    'auto_include_methods' => true,        // all public instance methods
    'auto_include_static_methods' => true, // all public static methods
],
```

Auto-include adds public methods only. It never adds private or protected methods, magic methods such as `__call()`, or PHP's built-in `cases()`, `from()` and `tryFrom()`. You can still mark a method with its attribute to set its `name`, `description` or `params` while auto-include handles the rest. A method with required parameters is still skipped unless its attribute passes `params`.

Both settings are off by default because they publish the return value of every public method on your enums. Check that's what you want before you turn them on.

### PHPDoc Descriptions

The package reads doc blocks and turns their descriptions into JSDoc comments:

| Location        | JSDoc placement                      |
| --------------- | ------------------------------------ |
| Enum class      | Above the `export const` declaration |
| Enum case       | Above the case property              |
| Instance method | Above the method property            |
| Static method   | Above the static method property     |

Tag lines such as `@param`, `@return` and `@phpstan-type` are removed, so only the prose description carries over. When an attribute sets a `description` too, the attribute wins over the PHPDoc block.

### Filtering & Excluding Enums

Enums use the same include and exclude settings as models, resources and the other published types:

```php
// config/ts-publish.php
'enums' => [
    'included' => [App\Enums\Status::class],       // only these (empty = all)
    'excluded' => [App\Enums\Internal::class],      // never publish these
    'additional_directories' => ['modules/Blog/Enums'],
],
```

`#[TsExclude]` on the enum class excludes the whole enum. On a method, it excludes only that method, even when auto-include or an attribute would otherwise publish it. See [Excluding Enum Methods](https://tolki.abe.dev/ts/excluding-content.html#excluding-enum-methods) on the Excluding Content page, which also covers models, resources and routes.

### Casing

`enums.method_case` sets the casing of published method keys: `'camel'` (default), `'snake'` or `'pascal'`. It doesn't rename your PHP methods, and it also applies to a key set with the attributes' `name` parameter. See [`enums.method_case`](https://tolki.abe.dev/ts/casing-configuration.html#enums-method-case) on the Casing Configurations page for examples.

### Runtime Utilities

`@tolki/ts` exports these functions, which give `defineEnum()` its PHP-like behavior. You normally call them through the published enum (`Status.from(...)`) instead of importing them.

[cases](#cases) [defineEnum](#defineenum) [from](#from) [tryFrom](#tryfrom)

#### `cases`

Like PHP's [cases](https://www.php.net/manual/en/unitenum.cases.php) method, `cases` returns an array with one resolved instance per case:

```typescript
import { cases } from "@tolki/ts";
import { Status } from "@js/types/data/app/enums";

const result = cases(Status); // one resolved instance per case in Status
```

#### `defineEnum`

The published files wrap each enum in `defineEnum`, which binds `from`, `tryFrom` and `cases` to the enum object:

```typescript
import { defineEnum } from "@tolki/ts";

const Status = defineEnum({
  ACTIVE: "active",
  INACTIVE: "inactive",
  _cases: ["ACTIVE", "INACTIVE"],
  _methods: [],
  _static: [],
});

Status.cases();
Status.from("active");
Status.tryFrom("non-valid-key"); // null
```

#### `from`

Like PHP's [from](https://www.php.net/manual/en/backedenum.from.php), `from` returns the enum instance for a value, and throws if the value matches no case:

```typescript
import { from } from "@tolki/ts";
import { Status } from "@js/types/data/app/enums";

const result = from(Status, "active");
from(Status, "non-valid-key"); // throws
```

#### `tryFrom`

Like PHP's [tryFrom](https://www.php.net/manual/en/backedenum.tryfrom.php), `tryFrom` works like `from` but returns `null` for a value that matches no case:

```typescript
import { tryFrom } from "@tolki/ts";
import { Status } from "@js/types/data/app/enums";

const result = tryFrom(Status, "active");
const missing = tryFrom(Status, "non-valid-key"); // null
```

### Vite Plugin

The `@tolki/ts` package ships a Vite plugin that republishes enums and routes automatically during development. See the [Vite Plugin documentation](https://tolki.abe.dev/ts/vite-plugin.html).

### Configuration Reference

The [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html) lists every `enums.*` config key, including the pipeline class overrides for advanced customization.

### Type Reference

The runtime functions come from `@tolki/ts`. The types come from `@tolki/types`, and `@tolki/ts` re-exports `AsEnum`, `CaseValue`, `DefineEnumResult`, `EnumConst` and `FromResult`:

| Export                            | Description                                                                                                                                                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineEnum()`                    | Wraps a raw enum const with bound `from`, `tryFrom` and `cases` helpers.                                                                                                                                                                 |
| `from()`, `tryFrom()`, `cases()`  | Standalone versions that take the enum object as their first argument.                                                                                                                                                                   |
| `EnumConst`                       | The base shape every generated enum const satisfies.                                                                                                                                                                                     |
| `CaseKeys<T>` / `CaseValue<T>`    | The union of case key names, or of case values, for an enum const.                                                                                                                                                                       |
| `MethodKeys<T>` / `StaticKeys<T>` | The union of instance method key names, or of static method key names.                                                                                                                                                                   |
| `FromResult<T, V>`                | The resolved instance type that `from(T, V)` returns.                                                                                                                                                                                    |
| `DefineEnumResult<T>`             | The return type of `defineEnum()`: the const plus its bound helpers.                                                                                                                                                                     |
| `AsEnum<T, V?>`                   | A resolved instance at the type level: a discriminated union across all cases, or one case with the second parameter. It types the JSON that the [`EnumResource`](https://tolki.abe.dev/ts/enum-api-resource.html) API resource returns. |

## Models

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) turns your Eloquent models into TypeScript interfaces for their columns, accessors and relations. The types come from your database schema, casts and docblocks, so you don't keep a second copy of each model up to date by hand.

Model interfaces are plain TypeScript, so they don't need the `@tolki/ts` runtime that [enums](https://tolki.abe.dev/ts/enums.html) and [routes](https://tolki.abe.dev/ts/routing.html) use. The one exception is a model with enum-typed columns: its file imports the `AsEnum` type with `import { type AsEnum } from '@tolki/ts';` for its [enum-resolved interfaces](#enum-typed-columns-modelresource).

### How Models Are Generated

The `ts:publish` command publishes each model as follows:

- **One file per model**: `App\Models\User` is written to `app/models/user.ts`, following the model's namespace. Each namespace directory also gets an `index.ts` barrel that re-exports its files (`export * from './user'`), the same as [enums](https://tolki.abe.dev/ts/enums.html#how-enums-are-generated).
- **Split interfaces**: columns, accessors and relations go into separate interfaces by default. See [Model Templates](#model-templates).
- **Column types**: a column's type comes from the first source that applies. In order, those are a [`#[TsCasts]`](#tscasts) entry, an accessor with the column's name, the model's cast in `casts()` or `$casts`, and the database column type. A custom cast class can set its own type with [`#[TsType]`](#tstype). When the result is still vague, such as `unknown[]`, a class-level `@property` tag refines it. The [Type Mapping Reference](#type-mapping-reference) lists the default types.
- **Accessors**: new-style `Attribute` accessors and old-style `get{Name}Attribute()` methods that aren't columns publish as mutators, typed from their return types, their docblocks or what their getters return.
- **Relations**: each relation publishes, plus a `_count` and an `_exists` property for it.
- **Metadata companions**: an opt-in feature writes a runtime `{model}_meta.ts` file beside the interface. See [Model Metadata](https://tolki.abe.dev/ts/model-metadata.html).

When a model has no attributes at all and its table doesn't exist, `ts:publish` prints a warning after its summary:

```text
App\Models\User: Table [users] does not exist on connection [mysql], so its columns are not published. Run the migrations, then publish again.
```

The interface is still published, with no columns, so the warning is how you tell a missing migration from a model that has no columns. A table that exists but lacks some columns isn't reported, and `--quiet` hides the warning.

### Anatomy of a Generated Model

For a `User` model with enum-cast columns, accessors and relations, the published file looks like this:

```typescript
import { type AsEnum } from "@tolki/ts";

import { MembershipLevel, Role } from "../enums";
import type { DatabaseNotification } from "../../illuminate/notifications";
import type { MembershipLevelType, RoleType } from "../enums";
import type { Address, Comment, Image, Order, Post, Profile, Team } from ".";

/**
 * Application user account
 *
 * @see App\Models\User
 */
export interface User {
  id: number;
  /** User name formatted with first letter capitalized */
  name: string;
  email: string;
  email_verified_at: string | null;
  password: string;
  options: Record<string, unknown> | null;
  remember_token: string | null;
  created_at: string | null;
  updated_at: string | null;
  role: RoleType | null;
  membership_level: MembershipLevelType | null;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  settings: {
    theme: "light" | "dark";
    notifications: boolean;
    locale: string;
  } | null;
  last_login_at: string | null;
  last_login_ip: string | null;
}

export interface UserResource extends Omit<User, "role" | "membership_level"> {
  role: AsEnum<typeof Role> | null;
  membership_level: AsEnum<typeof MembershipLevel> | null;
}

export interface UserMutators {
  /** User initials (e.g. "JD" for "John Doe") */
  initials: string;
  /** Whether the user is a premium member */
  is_premium: boolean;
}

export interface UserRelations {
  // Relations
  profile: Profile | null;
  posts: Post[];
  comments: Comment[];
  orders: Order[];
  addresses: Address[];
  teams: Team[];
  owned_teams: Team[];
  /** Polymorphic images (avatar gallery, etc.) */
  images: Image[];
  /** Get the entity's notifications. */
  notifications: DatabaseNotification[];
  // Counts
  profile_count: number;
  posts_count: number;
  // ...one `_count` per relation
  // Exists
  profile_exists: boolean;
  posts_exists: boolean;
  // ...one `_exists` per relation
}

export interface UserAll extends User, UserMutators, UserRelations {}

export interface UserAllResource
  extends UserResource, UserMutators, UserRelations {}
```

Each interface holds one part of the model:

- **`User`**: the columns. The enum columns `role` and `membership_level` use the enum's `{Enum}Type` union, which is how Eloquent serializes a backed enum to JSON. `settings` is an inline object type from a [`#[TsCasts]`](#tscasts) override.
- **`UserResource`**: the same columns, with each enum column typed as a resolved enum instance. See [Enum-Typed Columns](#enum-typed-columns-modelresource).
- **`UserMutators`**: the accessors, new-style `Attribute` or old-style `getXAttribute()`. Each accessor's PHPDoc description becomes a JSDoc comment. See [PHPDoc Descriptions](#phpdoc-descriptions).
- **`UserRelations`**: every relation, including polymorphic ones and framework relations such as `notifications`, which is imported from a generated `illuminate/notifications` directory. Each relation also gets a `_count` and an `_exists` property, matching Laravel's [`withCount`](https://laravel.com/docs/eloquent-relationships#counting-related-models) and `withExists`.
- **`UserAll` and `UserAllResource`**: the interfaces combined. `UserAll` is generated when the model has accessors or relations. `UserAllResource` is generated whenever the model has an enum-typed property, even with no accessors or relations.

### Model Templates

By default, a model is split into up to four interfaces (`{Model}`, `{Model}Mutators`, `{Model}Relations` and `{Model}All`), so a page imports only the parts it uses. The `model-full` template puts everything in one interface instead:

| Template                          | Description                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `laravel-ts-publish::model-split` | **(Default)** Separate interfaces for columns, mutators and relations, plus an `All` interface that combines them. |
| `laravel-ts-publish::model-full`  | One interface, with `// Columns`, `// Mutators` and `// Relations` comments between the groups.                    |

Set the template in your config:

```php
// config/ts-publish.php
'models' => [
    'template' => 'laravel-ts-publish::model-full',
],
```

An accessor listed in the model's `$appends` array publishes in the main `{Model}` interface in both templates, because Laravel includes appended attributes every time it serializes the model to JSON.

To change a template's structure, see [Publishing and Editing Templates](https://tolki.abe.dev/ts/customizing-the-pipeline.html#publishing-and-editing-templates).

#### Choosing Between Interfaces in a Form

The split template lets you compose only the pieces a page needs. This Inertia form uses the full `User` shape plus one relation flag:

```typescript
import { useForm } from "@inertiajs/vue3";
import type { User, UserRelations } from "@js/types/data/app/models";

interface UserForm extends User, Pick<UserRelations, "profile_exists"> {
  profile: UserRelations["profile"] | null;
}

const form = useForm<UserForm>({ ...user });
form.profile; // Profile | null
form.posts; // TS error: `posts` isn't part of UserForm
```

With `model-full`, you `Omit` every relation property you don't need, instead of picking the ones you do:

```typescript
import type { User } from "@js/types/data/app/models";

interface UserForm extends Omit<
  User,
  "profile" | "posts" | "profile_count" | "posts_count" | "posts_exists"
> {
  profile: User["profile"] | null;
}
```

Because `model-full` includes every relation, each model also depends on the full interface of every model it relates to. A type error two or three relations deep then surfaces in every model that reaches it. That can help you find models whose types are incomplete, but those errors take longer to trace and fix.

### Nullable Relations

Singular relations get `| null` from their relation type. For `BelongsTo` and `MorphTo`, the package also checks whether the foreign key columns are nullable:

| Relation Type                                                            | Strategy   | Behavior                                                                       |
| ------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------ |
| `HasOne`, `MorphOne`, `HasOneThrough`                                    | `nullable` | Always nullable, because the related record may not exist.                     |
| `BelongsTo`                                                              | `fk`       | Nullable only when the foreign key column is nullable in the database.         |
| `MorphTo`                                                                | `morph`    | Nullable when either the morph type column or the morph id column is nullable. |
| `HasMany`, `HasManyThrough`, `BelongsToMany`, `MorphMany`, `MorphToMany` | `never`    | Never nullable. An empty relation serializes as an empty array, not `null`.    |

For example, the `User` and `Post` relations publish like this:

```typescript
export interface UserRelations {
  profile: Profile | null; // HasOne: always nullable
  posts: Post[]; // HasMany: never nullable
}

export interface PostRelations {
  author: User; // BelongsTo: user_id is NOT NULL
  category_rel: Category | null; // BelongsTo: category_id is nullable
}
```

#### Disabling or Overriding the Strategy

Set `models.nullable_relations` to `false` to keep every singular relation non-nullable:

```php
// config/ts-publish.php
'models' => [
    'nullable_relations' => false,
],
```

To change the strategy for one relation type, map its class to `'nullable'`, `'never'`, `'fk'` or `'morph'` in `models.relation_nullability_map`. This works for custom and third-party relation classes too:

```php
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use SomePackage\Relations\BelongsToTenant;

'models' => [
    'relation_nullability_map' => [
        BelongsTo::class => 'nullable', // make all BelongsTo always nullable
        HasOne::class => 'never',       // make HasOne never nullable
        BelongsToTenant::class => 'fk', // custom relation type, checked like BelongsTo
    ],
],
```

The table above is the default map. A relation class that isn't in the map is always nullable, so map a custom relation class to give it a stricter strategy.

### What Gets Published: Hidden Attributes, Write-Only Accessors

Not every attribute Eloquent knows about reaches the generated interface. Hidden attributes, write-only accessors and relations that share an attribute's name follow their own rules.

#### Hidden Attributes

`$hidden` attributes publish by default. Set `models.exclude_hidden` to `true` to leave them out, which matches what Laravel's `toArray()` and `toJson()` return:

```php
// config/ts-publish.php
'models' => [
    'exclude_hidden' => true,
],
```

With the setting on, hidden columns such as `password` and `remember_token` also drop out of resource interfaces. That applies to any resource that takes the model's properties implicitly, through whole-model delegation or `except()`. A resource's `only(['password'])` still keeps a hidden column it names. See [`exclude_hidden` and Attribute Filters](https://tolki.abe.dev/ts/api-resources.html#exclude-hidden-and-attribute-filters) on the API Resources page for the full rule.

The default is off, so upgrading the package never drops a property your frontend already reads. Turn it on once you've confirmed the frontend doesn't need those columns. The package can't see a runtime `makeVisible()` call, so a hidden column stays out of the model's interface even on requests that reveal it. If the frontend needs a hidden column, remove it from `$hidden`.

#### Write-Only Accessors

A write-only accessor has a setter and no getter: `Attribute::set(...)`, or `Attribute::make(set: ...)`. Its type comes from the first of these that applies:

1. The `Get` type of its `@return Attribute<Get, Set>` docblock, when that type is specific and isn't `never`.
2. The database type of a column with the same name.
3. Nothing. The accessor is left out of the interface instead of publishing as `unknown`, unless a class-level `@property` tag types it.

`Attribute<never, string>`, or `Attribute<?never, string>`, is the usual way to document an accessor with no getter. Its `never` records that there is no getter, not what reading the attribute returns, so a column behind it publishes its database type: `subject: string`, not `subject: never`.

Step 2 uses the column's database type and skips its cast. Laravel reports a column that has a mutator as cast by that mutator, so an enum, `integer` or `boolean` cast on the column isn't applied. An old-style `set{Name}Attribute()` method behaves the same way. To publish a more specific type, give the accessor a specific `Get` type, such as `Attribute<Role|null, string>`, which publishes `RoleType | null`, or add a `#[TsCasts]` entry.

In this `Order` model, one write-only accessor documents its `Get` type and one documents nothing:

```php
class Order extends Model
{
    /** @return Attribute<?string, string> */
    protected function trackingCode(): Attribute
    {
        return Attribute::make(set: fn (string $value): string => strtoupper($value));
    }

    // No getter, no docblock generic, no backing column: left out of OrderMutators.
    protected function searchIndex(): Attribute
    {
        return Attribute::make(set: fn (string $value): string => strtolower($value));
    }
}
```

`trackingCode` publishes as `tracking_code: string | null` in `OrderMutators`, and `searchIndex` doesn't appear. A write-only accessor on a real column, such as one that normalizes a value on save, publishes as that column in the main `{Model}` interface, not as a mutator.

#### A Relation Named Like a Column or Accessor

A relation can share its published name with a column or an accessor, such as a `supervisor` column beside a `supervisor()` relation. A model's JSON has one `supervisor` key, and a loaded relation takes it. The combined `{Model}All` interface does the same, and leaves the attribute's key out:

```typescript
export interface DepotAll extends Omit<Depot, "supervisor">, DepotRelations {}
```

`Depot` and `DepotRelations` each keep their own `supervisor`, so the interface you choose still says which value you have. The `model-full` template and the [global declaration file](https://tolki.abe.dev/ts/publishing.html#global-declaration-file) publish only the relation's line.

A relation's `_count` and `_exists` properties follow the same rule. When a column or an accessor already has that name, such as an `orders_count` counter-cache column, it keeps its own type and isn't published a second time.

### Model Attributes

All attributes live in the `AbeTwoThree\LaravelTsPublish\Attributes` namespace.

| Attribute      | Target                                              | Description                                                          |
| -------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| `#[TsCasts]`   | `casts()` method, `$casts` property, or model class | Override or add TypeScript types for columns, mutators or relations. |
| `#[TsType]`    | Custom cast class                                   | Set the TypeScript type used wherever this cast class is applied.    |
| `#[TsExclude]` | Model class, accessor method, or relation method    | Exclude a whole model, or one accessor or relation.                  |

#### `#[TsCasts]`

`#[TsCasts]` takes an array that maps property names to a TypeScript type. A value is either a type string, or an array: `['type' => ..., 'import' => ...]` for a type you import from your own files, and `['type' => ..., 'optional' => true]` to mark the property optional with a `?`:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

class User extends Model
{
    #[TsCasts([
        'metadata' => '{label: string, value: string}[]',
        'settings' => 'Record<string, unknown>',
        'dimensions' => ['type' => 'ProductDimensions', 'import' => '@js/types/product'],
    ])]
    public function casts(): array
    {
        return [
            'metadata' => 'array',
            'settings' => 'array',
            'dimensions' => 'array',
        ];
    }
}
```

The published interface uses those types and imports `ProductDimensions`:

```typescript
import type { ProductDimensions } from "@js/types/product";

export interface User {
  metadata: { label: string; value: string }[];
  settings: Record<string, unknown>;
  dimensions: ProductDimensions;
}
```

You can put `#[TsCasts]` on the `casts()` method, on the `$casts` property, or on the model class. All three take the same array.

Put `#[TsCasts]` on `casts()` or `$casts`, so the TypeScript type sits next to the PHP cast. Put it on the class when you override a mutator or a relation. It's also the right place for a model you extend from the `vendor` directory, since you can override its relation and mutator types without touching the vendor's casts.

#### `#[TsType]`

For a custom cast class you use on several models, put `#[TsType]` on the cast class once, instead of repeating `#[TsCasts]` everywhere you use it:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsType;

#[TsType(['type' => 'ProductDimensions', 'import' => '@js/types/product'])]
class ProductDimensionsCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes) { /* ... */ }
}

class Product extends Model
{
    public function casts(): array
    {
        return ['dimensions' => ProductDimensionsCast::class];
    }
}
```

Every column that uses the cast publishes with that type:

```typescript
import type { ProductDimensions } from "@js/types/product";

export interface Product {
  dimensions: ProductDimensions;
}
```

`#[TsType]` also takes a plain string, such as `#[TsType('{width: number, height: number}')]`, when the type needs no import. Without `#[TsType]`, a custom cast publishes the return type of its `get()` method. A cast class that implements `SerializesCastableAttributes`, including one a `Castable` value object names, publishes the return type of its `serialize()` method instead, because that's what Laravel sends when it converts the model to JSON.

When `get()`'s native type is missing or vague, such as a bare `array`, the `@return` docblock sets the type, so `@return list<LegDto>` publishes a list of `LegDto`'s public properties, the shape `json_encode()` writes. A `@return` that names a model, such as `list<User>`, or another class that doesn't publish as an inline shape keeps `unknown[]`. A `get()` that declares neither publishes `unknown`.

### Laravel 13 Model Attributes

Laravel 13 added native class attributes for Eloquent models (`Illuminate\Database\Eloquent\Attributes`) and API resources (`Illuminate\Http\Resources\Attributes`). They replace property-based conventions, such as `#[Table]` in place of `protected $table`. These are Laravel's attributes, not this package's, so you don't import anything from `AbeTwoThree\LaravelTsPublish\Attributes` to use them. The package honors the ones that change a model's serialized shape, with no configuration:

| Attribute                                                                                                                                                                                                                                                                                          | Honored? | Notes                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#[Table('...')]`                                                                                                                                                                                                                                                                                  | Yes      | Selects the table whose columns are published, the same as `protected $table`.                                                                                                                                                                                                                  |
| `#[Hidden(['col'])]`                                                                                                                                                                                                                                                                               | Yes      | Marks columns hidden, the same as `protected $hidden`. See [Hidden Attributes](#hidden-attributes).                                                                                                                                                                                             |
| `#[Visible(['col'])]`                                                                                                                                                                                                                                                                              | Yes      | An allowlist, the same as `protected $visible`: every column it doesn't list becomes hidden. With `models.exclude_hidden` on, list every column you want published, or most of the model disappears from the interface.                                                                         |
| `#[Appends(['accessor'])]`                                                                                                                                                                                                                                                                         | Yes      | Adds accessors to the published set, the same as `protected $appends`.                                                                                                                                                                                                                          |
| `#[Connection('name')]`                                                                                                                                                                                                                                                                            | Yes      | Selects the database connection whose schema the columns come from, the same as `protected $connection`.                                                                                                                                                                                        |
| `#[Collects(SomeResource::class)]`                                                                                                                                                                                                                                                                 | Yes      | Sets the resource a collection collects. See [Resource Collections](https://tolki.abe.dev/ts/api-resources.html#resource-collections).                                                                                                                                                          |
| `#[UseResource(...)]`, `#[UseResourceCollection(...)]`                                                                                                                                                                                                                                             | Yes      | Link a model to its resource. See [How the Backing Model Is Resolved](https://tolki.abe.dev/ts/api-resources.html#how-the-backing-model-is-resolved). Available since Laravel 12.29.                                                                                                            |
| `#[PreserveKeys]`                                                                                                                                                                                                                                                                                  | Yes      | Types the collection's `data` as `Record<string, R>` instead of `R[]`, the keyed JSON object Laravel returns. `public $preserveKeys = true;` does the same. See [Key-Preserving Collections](https://tolki.abe.dev/ts/api-resources.html#key-preserving-collections) on the API Resources page. |
| `#[RouteKey('slug')]`                                                                                                                                                                                                                                                                              | Yes      | A model-bound route argument types `_routeKey` from the attribute's key, even when the model overrides none of `getRouteKeyName()`, `getKeyName()` or `$primaryKey`. See [Model Binding](https://tolki.abe.dev/ts/routing.html#model-binding) on the Routing page.                              |
| Everything else (`#[DateFormat]`, `#[WithoutTimestamps]`, `#[WithoutIncrementing]`, `#[Fillable]`, `#[Guarded]`, `#[Unguarded]`, `#[Scope]`, `#[ScopedBy]`, `#[ObservedBy]`, `#[Boot]`, `#[Initialize]`, `#[Touches]`, `#[CollectedBy]`, `#[UseEloquentBuilder]`, `#[UseFactory]`, `#[UsePolicy]`) | N/A      | These change querying, events, mass assignment or factories, not the serialized shape, so they don't affect the published types.                                                                                                                                                                |

`#[Table]`, `#[Hidden]`, `#[Visible]`, `#[Appends]`, `#[Connection]`, `#[Collects]` and `#[PreserveKeys]` require Laravel 13. `#[RouteKey]` requires Laravel 13.21. `#[UseResource]` and `#[UseResourceCollection]` require Laravel 12.29. On an older version, using one isn't an error: the model loads normally and the attribute is ignored. Nothing tells you that `#[Table]` didn't take effect, so run a Laravel version that supports each attribute you rely on.

### Typing Attributes Without #[TsCasts]

Most columns and accessors type themselves. When one publishes `unknown` or `unknown[]`, reach for these annotations before `#[TsCasts]`, in this order:

1. A parameterized `Attribute<>`, `@return` or `@phpstan-return` docblock on the accessor, generics included, such as `Attribute<Collection<int, LineItem>, never>`.
2. A class-level `@property` or `@property-read` tag, including one that uses a `@phpstan-type` or `@phpstan-import-type` alias.
3. A `@return MorphTo<A|B, $this>` generic on a `morphTo()` relation.

PHPStan and Larastan read all of them, so the annotation that fixes your TypeScript is also checked by static analysis, and the package reads them with no configuration. `#[TsCasts]` is still the right tool when a shape's keys are built at runtime, or when the type belongs to the frontend and needs its own import. The [Annotation Checklist](#annotation-checklist) lists each case by symptom.

#### Accessor Getter Bodies

When an accessor's getter has no specific return type, and its `@return Attribute<Get, Set>` docblock is missing or vague, the package reads what the getter returns. An accessor that would otherwise publish `unknown[]` publishes the shape it builds:

```php
class Release extends Model
{
    protected function versionData(): Attribute
    {
        return Attribute::get(fn () => ['major' => $this->major, 'minor' => $this->minor]);
    }

    protected function tagList(): Attribute
    {
        return Attribute::get(fn (): array => collect(explode(',', $this->tags_csv))
            ->map(fn ($tag) => ['name' => $tag])
            ->values()
            ->all());
    }

    protected function emptyList(): Attribute
    {
        return Attribute::get(fn (): array => []);
    }
}
```

The first two accessors publish the shapes their getters return. The empty list keeps the `unknown[]` of its `: array` signature, because an empty `[]` says nothing about its elements:

```typescript
export interface ReleaseMutators {
  version_data: { major: number; minor: number };
  tag_list: { name: string }[];
  empty_list: unknown[];
  // …
}
```

The package reads `Attribute::make()`, `Attribute::get()`, `new Attribute(get: ...)` and old-style `get{Name}Attribute()` bodies. An accessor declared in a trait is read against the model that uses the trait. A method the getter calls is read the same way: `channelOptions()` returns `static::channelLabels()`, whose signature is a bare `: array`, and still publishes `{ "1": string; "2": string }`. A getter that returns an untyped property is typed from the property's default value, so `channels()`, which returns `protected $allowedChannels`, publishes `string[]`.

A specific return type or `Attribute<Get, Set>` generic is always read first, so the getter body never overrides an accurate annotation. When the getter can't be typed, the accessor keeps the type from its signature or docblock, or publishes `unknown` if it has neither. That happens when the getter:

- Returns an empty `[]` literal, like `empty_list` above
- Builds its keys in a loop, such as `$totals['k'.$index] = $index`
- Calls something whose return type can't be determined
- Reads another accessor that reads it back, in which case both publish `unknown`
- Can only be typed as `null`, because one side of a `??` or a ternary couldn't be typed
- Names two different classes or enums that share a short name, such as `$this->status ?? $this->author?->status` when each `status` is a different `Status` enum
- Returns an API resource

The `null` case keeps a getter from publishing a type that's plainly wrong: `fn ($value, array $attributes) => $attributes['title'] ?? null` publishes `unknown`, not `null`, because its real value is the title.

#### Typing `array` Casts With `@property`

A column cast to `'array'`, or to any cast with no more specific type, publishes as `unknown[]`. Instead of `#[TsCasts]`, add a class-level `@property` or `@property-read` tag with the real shape. It's the same tag PHPStan and Larastan read:

```php
/**
 * @property array<int, string>|null $to
 * @property array<string, string>|null $headers
 */
class Message extends Model { ... }
```

`$to` and `$headers` publish as `string[] | null` and `Record<string, string> | null` instead of `unknown[] | null`, and PHPStan and Larastan type the same properties.

A tag can also spell a tuple, an object shape, quoted or string literal keys, or a nullable shape inside another. `list{int, string}` publishes the tuple `[number, string]`, `object{a: int}` publishes `{ a: number }`, `array<'a'|'b', int>` publishes `{ a?: number; b?: number }`, and `array{a: ?array{b: int}}` publishes `{ a: { b: number } | null }`. A `callable` inside a shape publishes `unknown`.

On a nullable column, the tag's type gains `| null` unless it already holds `null` at its top level. A `null` inside a shape doesn't count, so `@property array{a: ?int} $meta` publishes `{ a: number | null } | null`.

A tag applies only when the column's own type is vague. It never overrides a specific type, such as an accessor's return type, an enum cast or a custom `CastsAttributes` class. A subclass's tag wins over its parent's. `@property-write` tags are ignored, because they describe the setter.

A tag that is still partly vague is used when it's more specific than the type it replaces. `@property array<string, mixed>|null $settings` turns a plain `'array'` cast into `Record<string, unknown> | null`: the type still names `unknown`, but it beats `unknown[] | null`. A tag that is exactly as vague as the original is ignored: `unknown`, `unknown[]`, `object`, or the `unknown[] | Record<string, unknown>` of a bare collection.

The package also reads `@property` tags on the traits the model and its parents use, and on the traits those traits use. A trait that supplies an accessor can document it that way. The `$`-less form some packages use, `@property string[] labels`, works as long as nothing follows the property name.

#### Typing JSON Columns With `@phpstan-type` Aliases

For a shape that deserves a name, define it once as a `@phpstan-type` on the DTO that owns it, then import it into the model with `@phpstan-import-type`:

```php
/** @phpstan-type PresetConfig array{filters?: array<string, mixed>, sorts?: list<string>} */
final readonly class PresetDto { ... }

/**
 * @phpstan-import-type PresetConfig from PresetDto
 * @property PresetConfig|null $config
 */
class Preset extends Model { ... }
```

`$config` publishes as `{ filters?: Record<string, unknown>; sorts?: string[] } | null`. The alias expands inline, so `PresetDto` isn't imported, optional keys keep their `?`, and PHPStan checks the same alias. The package also reads `@phpstan-import-type ... as Alias`, `@psalm-type` and `@psalm-import-type`. An alias also expands inside a list or a shape, as in `list<PresetConfig>|null` or `array{preset: PresetConfig}`, and in a promoted constructor property's `@var`. An alias can use another imported alias, and an import cycle publishes `unknown` instead of stalling the run. For a shape that's already worth documenting for static analysis, prefer an alias over `#[TsCasts]`.

#### Nullable and Intersection Docblock Types

A nullable alias keeps its `| null`. Here it's written with a trailing `|null`:

```php
/**
 * @phpstan-import-type GridConfig from GridConfigDto
 * @phpstan-import-type GridPreset from GridConfigDto
 *
 * @property GridConfig|null $grid_config
 * @property GridPreset|null $grid_preset
 */
class Team extends Model { ... }
```

Both aliases expand, and both keep `| null`:

```typescript
export interface Team {
  grid_config: {
    filters?: Record<string, unknown>;
    sorts?: string[];
    columns?: string[];
  } | null;
  grid_preset: { name: string; locked?: boolean } | null;
  // …
}
```

A leading `?` works the same way, on a generic and on an alias, so `@property ?GridPreset $grid_preset` also keeps its `| null`. The same goes for an accessor's `@return` docblock:

```php
/** @return Attribute<?array<int, int>, never> */
protected function stateIds(): Attribute

/** @return Attribute<?FlagValue, never> */   // FlagValue is a @phpstan-type alias
protected function flagDefault(): Attribute
```

Each type publishes with `| null`:

```typescript
export interface OrderMutators {
  state_ids: number[] | null;
  flag_default: boolean | number | string | null;
  // …
}
```

A docblock intersection resolves each member and joins them with `&`:

```php
/** @return Attribute<Collection<int, User&object{pivot: TaskAssignment}>, never> */
protected function assignedUsers(): Attribute
```

`User` keeps its import, but `pivot` publishes as `unknown`:

```typescript
export interface ProjectMutators {
  assigned_users: (User & { pivot: unknown })[];
  // …
}
```

A class named inside an `object{...}` shape always publishes as `unknown`, which is why `TaskAssignment` is lost here. A member that can't be resolved is dropped from the intersection, instead of turning the whole type into `unknown`, since `A & B` is assignable to `A`.

#### Trait `@template` Bindings

A generic trait's `@template` parameter is bound by the `@use` tag on the class that uses the trait, so one trait can give many models a correctly typed accessor:

```php
/** @template TChild of Model */
trait AggregatesChildren
{
    /** @return Attribute<EloquentCollection<int, TChild>, never> */
    protected function childItems(): Attribute { ... }
}

class Project extends Model
{
    /** @use AggregatesChildren<Comment> */
    use AggregatesChildren;
}
```

`TChild` becomes `Comment` for this model:

```typescript
export interface ProjectMutators {
  child_items: Comment[];
  // …
}
```

PHPStan reads the `@use` tag for the same purpose, so static analysis checks the binding too.

#### Typing Castable-With-Arguments Casts

Laravel's built-in `Castable` classes carry their configuration after a colon in the cast string. `AsEnumCollection::of(DayOfWeek::class)`, `AsCollection::of(...)` and `AsCollection::using(...)` all build a `"ClassName:arg1,arg2"` cast string. The package types these with no extra configuration:

```php
protected function casts(): array
{
    return [
        'week_days' => AsEnumCollection::of(DayOfWeek::class),
        'grid_configs' => AsCollection::of(GridConfigDto::class),
    ];
}
```

Each cast publishes the mapped class's type as a list:

- **`AsEnumCollection::of($enum)`**: the enum's type with `[]`, such as `DayOfWeekType[]`. The enum is imported the same way as for an enum-cast column.
- **`AsCollection::of($map)` and `AsCollection::using($collection, $map)`**: the mapped class's shape with `[]`. An `Arrayable` DTO with a documented `toArray()` shape inlines as an object array, such as `{ label: string; config: Record<string, unknown> }[]`, and a mapped enum publishes the same way as `AsEnumCollection`. When the mapped class has no shape the package can read, or the cast is a bare `AsCollection`, the column stays `unknown[]`.
- **Any other `Castable` or `CastsAttributes` class with arguments**: a custom cast or `AsEncryptedCollection`, for example, publishes as if the arguments weren't there.

#### Typing `morphTo` Relations

By default, a `morphTo()` relation is typed as the union of every published model that declares a `morphOne()` or `morphMany()` pointing back at it. A relation that returns a custom subclass of `MorphOne` or `MorphMany` counts too. That lookup can only ever build the full union, never narrow it. To type the relation directly, add a `@return MorphTo<A|B, $this>` docblock to the relation method. PHPStan checks the same docblock, and you don't need `#[TsCasts]`:

```php
class Activity extends Model
{
    /** @return MorphTo<User, $this> */
    public function causer(): MorphTo
    {
        return $this->morphTo();
    }
}
```

`causer` publishes as `User | null`, even though no model declares a relation pointing back at `Activity`. With neither a docblock nor an inverse relation, a `morphTo()` publishes as `unknown`.

The second generic argument, `$this`, is Laravel's convention for the child model and is ignored. A generic that names the base `Model` class or an abstract class is ignored too, and the relation falls back to the union of its inverse relations. That covers `@phpstan-return MorphTo<Model, $this>`, which is what Larastan expects when a relation's targets aren't known up front, and which would otherwise publish a `Model` type that nothing can import. Each `morphTo()` relation resolves on its own, so two differently named `morphTo` relations on one model get separate types.

##### Parents Found Through a Subclass or a Custom Pivot

The union also picks up two kinds of parent that need no docblock.

A parent can point its relation at a subclass of the model that declares the `morphTo()`. `Venue::reviews()` returns `morphMany(VenueReview::class, 'reviewable')`, where `VenueReview extends Review` and only `Review` declares `reviewable()`, so `Venue` joins `Review`'s union:

```typescript
export interface ReviewRelations {
  reviewable: Artist | Venue;
  // …
}

export interface VenueReviewRelations {
  reviewable: Venue;
  // …
}
```

A subclass never inherits a sibling's parents, so `VenueReview::reviewable` stays `Venue`, and `Artist` never appears there. The union only grows upward. A parent declared against the base `Review` is never added to a subclass, because a row written through that relation stores `Review`'s morph value, not the subclass's.

The second kind is a `morphToMany(...)->using(Pivot::class)` whose custom pivot declares its own `morphTo()`. The pivot row's morph column names the parent directly, so the pivot's relation resolves like any other:

```php
class Venue extends Model
{
    /** Labels attached via the custom Labelable pivot, which itself carries the morphTo back */
    public function labels(): MorphToMany
    {
        return $this->morphToMany(Label::class, 'labelable')->using(Labelable::class);
    }
}
```

With `Artist` declaring the same relation, the pivot's `labelable` covers both parents:

```typescript
export interface LabelableRelations {
  labelable: Artist | Venue;
  // …
}
```

A `morphToMany()` without `->using()` adds no parent, and neither does `morphedByMany()`. That's the inverse side of the relation, so counting it would record the wrong parent.

#### DTO-Typed Accessors and Casts

An `Arrayable` DTO whose `toArray()` has no `@return array{...}` shape publishes the shape of its typed public properties, promoted constructor properties included, instead of `unknown[]`:

```php
final readonly class ShippingOptions implements Arrayable
{
    public function __construct(
        public string $carrier,
        public bool $insured,
        public ?string $trackingUrl = null,
    ) {}

    /** @return array<string, bool|string|null> */
    public function toArray(): array
    {
        return (array) $this;
    }
}
```

An accessor or cast that returns this DTO publishes as `{ carrier: string; insured: boolean; trackingUrl: string | null }`. Nullable properties keep their `| null`. Private, protected and static properties are left out, because `(array) $this` doesn't include them. A property typed as a class or an enum, such as a model, publishes as `unknown`, because the inline shape can't import it.

Optional is separate from nullable. A property that is neither promoted nor given a default value publishes as an optional key. Add `public string $summary;` to the class body above, assigned in the constructor, and it publishes as `summary?: string`. PHP leaves an unassigned typed property out of `(array) $this`, and the package can't tell whether the constructor always assigns it. To keep the key required, promote the property, or give it a default value on a DTO that isn't `readonly`. A `@return array{...}` docblock on `toArray()` always wins, so add one when the properties don't tell the whole story.

This only applies to `Arrayable`. A `JsonSerializable` DTO is typed from a `@return array{...}` docblock on `jsonSerialize()` and never from its properties, because `jsonSerialize()` can return anything. A `jsonSerialize()` that declares `string` or `?string`, in its signature or its `@return`, publishes `string` or `string | null`. One whose `@return` is `\DateTime` publishes `{ date: string; timezone_type: number; timezone: string }`, the date object `json_encode()` writes. Without any of these, the DTO isn't inlined, and the property publishes by other rules, such as the DTO's class name.

`json_encode()` ignores `__toString()`, so a class with only `__toString()` doesn't publish `string`. It publishes what `json_encode()` writes: its public properties as a shape, with `unknown` for one that has no type, or `Record<string, never>`, the `{}`, when it has no public properties. A class that allows dynamic properties, or extends `ArrayObject`, publishes `Record<string, unknown>`, and one whose `jsonSerialize()` returns an `array` with no `@return array{...}` shape publishes `unknown[] | Record<string, unknown>`. An accessor whose getter returns a first-class callable, such as `Attribute::get(fn () => strlen(...))`, publishes `Record<string, never>` too, because Laravel sends the `Closure` as `{}`. Call the function in the getter instead.

#### Annotation Checklist

This table indexes the annotations above by symptom, plus two cases from [API Resources](https://tolki.abe.dev/ts/api-resources.html). None of them needs `#[TsCasts]`, and PHPStan and Larastan read them all, so the annotation that fixes the TypeScript type is also checked by static analysis:

| Still publishing `unknown`?                                                                                     | Add this                                                                                                                                              | Result                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Attribute<Collection, never>` publishes `unknown[]`, and the getter builds the value in a loop                 | Parameterize the generic: `Attribute<Collection<int, LineItem>, never>`, or `array{...}` for a fixed shape                                            | The element type (`LineItem[]`), imported automatically. Keys built in a loop can't be read from the getter body, so the generic is the fix                                                                                                         |
| A bare `'array'` or `'collection'` cast with no shape anywhere else                                             | A class-level `@property` or `@property-read` tag, such as `@property array<string, mixed>\|null $settings`                                           | `Record<string, unknown> \| null`, or the tag's more specific type, instead of `unknown[] \| null`. See [Typing `array` Casts With `@property`](#typing-array-casts-with-property)                                                                  |
| A JSON shape you want to name once and reuse                                                                    | `@phpstan-type Name array{...}` on the class that owns it, then `@phpstan-import-type Name from ThatClass` and `@property Name $prop` on the model    | The shape, expanded inline and checked by PHPStan, with no import of the DTO. See [Typing JSON Columns With `@phpstan-type` Aliases](#typing-json-columns-with-phpstan-type-aliases)                                                                |
| An `AsEnumCollection` or `AsCollection` cast with no argument publishes `unknown[]`                             | Pass the mapped class: `AsEnumCollection::of(Status::class)`, `AsCollection::of(LineItemDto::class)`                                                  | The element's type, an enum or a DTO shape, as a list. See [Typing Castable-With-Arguments Casts](#typing-castable-with-arguments-casts)                                                                                                            |
| A `morphTo()` publishes `unknown` because no model declares the matching `morphOne()` or `morphMany()`          | `@return MorphTo<A\|B, $this>` on the relation method                                                                                                 | The union, with every member imported. See [Typing `morphTo` Relations](#typing-morphto-relations)                                                                                                                                                  |
| A `morphTo()` whose parents point at a subclass, or reach it through a `->using()` pivot                        | Nothing. The union includes both automatically                                                                                                        | The parent union. See [Parents Found Through a Subclass or a Custom Pivot](#parents-found-through-a-subclass-or-a-custom-pivot)                                                                                                                     |
| An `Arrayable` DTO accessor or cast publishes `unknown[]`                                                       | Nothing. Typed public properties, promoted constructor properties included, are read automatically when `toArray()` has no `@return array{...}` shape | The DTO's property shape instead of `unknown[]`. See [DTO-Typed Accessors and Casts](#dto-typed-accessors-and-casts)                                                                                                                                |
| `$this->relation->only([...])` or `->except([...])` loses the related model's `#[TsCasts]` or `@property` types | Nothing. This is automatic when the relation resolves to a single model and every filtered key is a database column                                   | `Pick<Model, 'a' \| 'b'>`, which reuses the model's own interface. `except()` picks every other column. See [Relation Filters](https://tolki.abe.dev/ts/api-resources.html#relation-filters) on the API Resources page                              |
| An accessor or relation is missing from an inlined `$this->relation->except([...])`                             | Name it: switch that key to `only([...])`, or give it its own entry in `toArray()`                                                                    | The key comes back. An inlined `except()` expands to database columns only, which matches what `Model::except()` returns at runtime. See [Relation Filters](https://tolki.abe.dev/ts/api-resources.html#relation-filters) on the API Resources page |
| An accessor publishes `unknown[]` from a vague `Attribute<array, never>` or a bare `: array` getter             | Nothing. The getter body is read when the signature and the docblock are both vague                                                                   | The shape the getter returns. See [Accessor Getter Bodies](#accessor-getter-bodies)                                                                                                                                                                 |
| A query-selected attribute (`selectRaw('… as rank')`) has no column, cast or accessor behind it                 | A class-level `@property` or `@property-read` tag naming it                                                                                           | The tag's type wherever a resource or another published type reads the attribute. The tag doesn't add the attribute to the model's own interface, which lists only what the schema and casts declare                                                |
| A nullable docblock generic (`?Alias`, `Attribute<?array<int, int>, never>`) publishes `unknown`                | Nothing. A leading `?` is read as `\| null`                                                                                                           | The type with `\| null`. See [Nullable and Intersection Docblock Types](#nullable-and-intersection-docblock-types)                                                                                                                                  |

If a property still publishes `unknown`, open an issue on the [package's GitHub issue tracker](https://github.com/abetwothree/laravel-ts-publish/issues) with the PHP and the generated TypeScript.

### PHPDoc Descriptions

The package reads doc blocks and turns their descriptions into JSDoc comments:

| Location    | Source                                        | JSDoc Placement                          |
| ----------- | --------------------------------------------- | ---------------------------------------- |
| Model class | Doc block above the class                     | Above the `export interface` declaration |
| Columns     | Doc block above the column's accessor method  | Above the column property                |
| Mutators    | Doc block above the mutator's accessor method | Above the mutator property               |
| Relations   | Doc block above the relation method           | Above the relation property              |

For columns and mutators, the package checks the new-style accessor (`protected function name(): Attribute`) before the old-style one (`public function getNameAttribute()`). Tag lines such as `@param`, `@return` and `@phpstan-type` are removed, so only the prose description carries over. These doc blocks become the JSDoc comments in the [Anatomy of a Generated Model](#anatomy-of-a-generated-model) example:

```php
/** Application user account */
class User extends Model
{
    /** User initials (e.g. "JD" for "John Doe") */
    protected function initials(): Attribute
    {
        return Attribute::make(get: fn (): string => /* ... */);
    }

    /** Polymorphic images (avatar gallery, etc.) */
    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }
}
```

### Enum-Typed Columns (`{Model}Resource`)

A column or accessor typed as a backed or unit enum publishes in two ways:

- **The main interface**: `User` uses the enum's `{Enum}Type` union, which is how Laravel serializes the enum when it converts a model to JSON.
- **A parallel `Resource` interface**: `{Model}Resource` types the same property as [`AsEnum<typeof Enum>`](https://tolki.abe.dev/ts/enums.html#type-reference), and the split template adds `{Model}MutatorsResource` for accessors and `{Model}AllResource`. `AsEnum` is the shape you get once the raw value is a full enum instance, either from `Status.from(user.status)` or from an API resource that serialized the enum with [`EnumResource`](https://tolki.abe.dev/ts/enum-api-resource.html).

A property is rewritten only when its type is a single enum or a list of one, either optionally `| null`. A list becomes `AsEnum<typeof Enum>[]`. A shape, or a union with other types, keeps its own type.

This helper resolves the raw `role` value into the type `UserResource` declares:

```typescript
import { Role } from "@js/types/data/app/enums";
import type { User, UserResource } from "@js/types/data/app/models";

function displayRole(user: User) {
  const resolved: UserResource["role"] = user.role
    ? Role.from(user.role)
    : null;
  // resolved?.name, resolved?.value, etc.: a full enum instance, not only the raw value
}
```

The `Resource` interfaces, and the `AsEnum` import, are generated only when `enums.use_tolki_package` is `true`, which is the default. Set it to `false` and enum columns use `{Enum}Type` everywhere.

### Timestamps as Date Objects

Date and timestamp columns (`date`, `datetime`, `timestamp` and their immutable variants) publish as `string` by default. Set `timestamps_as_date` to `true` to publish them as `Date`:

```php
// config/ts-publish.php
'timestamps_as_date' => true,
```

The setting changes every date column:

| Config Value      | Generated Type       |
| ----------------- | -------------------- |
| `false` (default) | `created_at: string` |
| `true`            | `created_at: Date`   |

A `timestamp` cast is the exception. It publishes `number` under either setting, as [Dates & Times](#dates--times) explains.

### Custom TypeScript Type Mappings

To change how a type publishes everywhere, add it to `custom_ts_mappings`. Keys are matched case-insensitively, and your entries take precedence over the built-in map, including the cast and database driver rules below:

```php
// config/ts-publish.php
'custom_ts_mappings' => [
    'binary' => 'Blob',
    'json' => 'Record<string, unknown>', // overrides the default 'object' mapping
    'money' => 'number',                  // keeps money columns a number on every driver
],
```

To see which entry a cast, a column or a date follows, read [`custom_ts_mappings`](https://tolki.abe.dev/ts/configuration-reference.html#custom-ts-mappings) in the Configuration Reference.

To change one property instead of every column of a type, use [`#[TsCasts]`](#tscasts) or [`#[TsType]`](#tstype).

### Type Mapping Reference

The package maps database column types and casts to these TypeScript types by default.

[Numbers](#numbers) [Booleans](#booleans) [Strings](#strings) [Arrays &amp; Objects](#arrays--objects) [Dates &amp; Times](#dates--times) [Other](#other)

#### Numbers

`bigint`, `decimal`, `double`, `double precision`, `float`, `integer`, `int`, `numeric`, `number`, `mediumint`, `smallint`, `year`, `real`, `money`, `smallmoney`, `serial`, `bigserial`, `smallserial` → **`number`**. An uncast `decimal`, `numeric` or PostgreSQL `money` column can publish `string` instead, as described below.

A bare `tinyint`, as created by `tinyInteger()` on MySQL and SQL Server, is also **`number`**. Only `tinyint(1)`, the type Laravel's `boolean()` column has on MySQL and SQLite, means boolean. See [Booleans](#booleans).

A `decimal:N` cast, such as `decimal:2`, publishes **`string`**, because Laravel returns a decimal cast as a string on every database.

A `decimal`, `numeric` or PostgreSQL `money` column with no cast follows the driver of the connection you publish on. It publishes **`string`** on MySQL, MariaDB and PostgreSQL, and **`number`** on SQLite and SQL Server. Publish against the database driver your app runs in production, or cast the column `decimal:N` to publish `string` on every driver. To keep another type on every driver, map the column type in [`custom_ts_mappings`](https://tolki.abe.dev/ts/configuration-reference.html#custom-ts-mappings), such as `'decimal' => 'number'` on MySQL (this also covers `decimal:N` casts) or `'numeric' => 'number'` on PostgreSQL.

On SQL Server, cast the column `decimal:N`, because the `pdo_sqlsrv` driver returns a decimal as a string while the package publishes `number`.

#### Booleans

`bool`, `boolean`, `bit`, `tinyint(1)` → **`boolean`**

#### Strings

`char`, `character`, `enum`, `longtext`, `mediumtext`, `string`, `text`, `varchar`, `encrypted`, `uuid`, `guid`, `hashed`, `time`, `timetz`, `timestamptz`, `numeric-string` → **`string`**

Sized, binary and legacy database types publish the same way: `tinytext`, `binary`, `varbinary`, `blob`, `bytea`, `tinyblob`, `mediumblob`, `longblob`, `nvarchar`, `nchar`, `ntext`, `xml`, `interval`, `uniqueidentifier` and `datetimeoffset` → **`string`**. `set(…)` is also a `string`, not an array, because MySQL returns a matched `SET` as a comma-separated string. So are the Postgres and MySQL network and full-text types: `inet`, `cidr`, `macaddr`, `macaddr8` and `tsvector`.

#### Arrays & Objects

| Cast                                                               | TypeScript Type                        |
| ------------------------------------------------------------------ | -------------------------------------- |
| `array`, `collection`, `iterable`                                  | `unknown[]`                            |
| `AsCollection`, `AsEncryptedCollection`, `AsEnumCollection` (bare) | `unknown[]`                            |
| `AsArrayObject`, `AsEncryptedArrayObject`, `AsEnumArrayObject`     | `unknown[] \| Record<string, unknown>` |
| `json`, `jsonb`, `object`                                          | `object`                               |
| `Illuminate\Database\Eloquent\Collection`                          | `Record<string, unknown>`              |
| `Illuminate\Support\Collection`                                    | `unknown[] \| Record<string, unknown>` |
| `Illuminate\Database\Eloquent\Casts\AsFluent`                      | `object`                               |

The three `As*ArrayObject` casts hold an `ArrayObject`, which serializes a list as a JSON array and anything else as an object, so the type allows both shapes. Check `Array.isArray()` on the value before you treat it as an object, or pin its shape with [`#[TsCasts]`](#tscasts).

The `unknown[]` collection row is the bare form. `AsEnumCollection::of(...)`, `AsCollection::of(...)` and `AsCollection::using(...)` publish the mapped element's type instead. See [Typing Castable-With-Arguments Casts](#typing-castable-with-arguments-casts).

A parameterized docblock generic in `@return`, `@property` or `Attribute<>` publishes a more specific type, based on its key type. Every container behaves the same way for a given key type:

| Key type             | Emitted                    | Containers                                            |
| -------------------- | -------------------------- | ----------------------------------------------------- |
| `int`, or omitted    | `X[]`                      | `list<X>`, `array<…>`, `iterable<…>`, `Collection<…>` |
| `string`             | `Record<string, X>`        | `array<…>`, `iterable<…>`, `Collection<…>`            |
| `array-key`, `mixed` | `X[] \| Record<string, X>` | `array<…>`, `iterable<…>`, `Collection<…>`            |

`list<X>` has no key type, so it always publishes as `X[]`. A container with no generic at all, such as a bare `Collection`, uses the [Arrays & Objects](#arrays--objects) table above instead.

A collection chain on a relation, such as `->sortBy()`, `->pluck($value, $key)` or `->take()`, publishes as `X[] | Record<string, X>` whatever its declared type, because those methods can leave the keys out of order. It narrows to `X[]` when the chain ends with keys that count up from 0. A trailing `->values()` does that, and so does a `->take()` from the front of a collection whose keys are already sequential.

#### Dates & Times

`date`, `immutable_date`, `datetime`, `immutable_datetime`, `immutable_custom_datetime`, a `timestamp` column, `datetime2`, `smalldatetime`, and `Carbon`, `CarbonImmutable` or `Illuminate\Support\Carbon` casts all follow [`timestamps_as_date`](#timestamps-as-date-objects) → **`string`** (default) or **`Date`**. `datetime2` is what SQL Server's `dateTime($precision)` and `timestamp($precision)` create when you give a precision. It's the same kind of column as a bare `datetime`, so it follows the same setting, and `smalldatetime` does too.

A `timestamp` cast publishes **`number`** under either setting, because Laravel serializes it as a Unix timestamp, such as `1767225600`. A `timestamp` column without that cast, such as `created_at`, keeps the date type.

An old-style accessor, `get{Name}Attribute()`, that returns a plain PHP `DateTime` or `DateTimeImmutable` publishes `{ date: string; timezone_type: number; timezone: string }`. Laravel sends that object as it is, and those fields are what `json_encode()` writes for it. A new-style `Attribute` accessor or a cast that returns one keeps the date type, because Laravel formats it as a date string first. A Carbon date keeps the date type from either kind of accessor.

#### Other

| Cast                                | TypeScript Type               |
| ----------------------------------- | ----------------------------- |
| `AsStringable`, `AsUri`, `AsBinary` | `string`                      |
| `null`                              | `null`                        |
| `mixed`                             | `unknown`                     |
| `never` (PHPStan)                   | `never`                       |
| `void` (PHPStan)                    | `void`                        |
| `true` / `false` (PHPStan)          | `true` / `false`              |
| `array-key` (PHPStan)               | `string \| number`            |
| `scalar` (PHPStan)                  | `string \| number \| boolean` |
| `geometry`, `geography`             | `unknown`                     |
| `vector`                            | `number[]`                    |

A spatial column's JSON shape depends on how your app reads it. Raw WKB is a binary string, and `ST_AsGeoJSON()` returns an object, so the package publishes `unknown` instead of guessing. MySQL's `geometry(subtype: '...')` reports the subtype as the column type, so `point`, `linestring`, `polygon`, `geometrycollection`, `multipoint`, `multilinestring` and `multipolygon` all publish as **`unknown`** for the same reason. A `vector` column comes from pgvector or MySQL 9, which both serialize it as a JSON array of floats.

### Filtering & Excluding Models

Models use the same include and exclude settings as enums and resources:

```php
// config/ts-publish.php
'models' => [
    'included' => [App\Models\User::class],        // only these (empty = all)
    'excluded' => [App\Models\Pivot::class],         // never publish these
    'additional_directories' => ['modules/Blog/Models'],
],
```

A relation that points at a model outside `included`, or at an `excluded` model, is left out of the relations interface, and a `morphTo()` union drops those models too. A model outside your directories that nothing excludes is published instead. See [Related Models Outside Your Directories](#related-models-outside-your-directories).

`#[TsExclude]` on the model class excludes the whole model. On an accessor or relation method, it excludes only that property:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

class User extends Model
{
    #[TsExclude]
    protected function secretToken(): Attribute
    {
        return Attribute::make(get: fn (): string => 'hidden');
    }

    #[TsExclude]
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}
```

See [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html) for how `#[TsExclude]` works across models, enums, resources and routes.

The [model metadata](https://tolki.abe.dev/ts/model-metadata.html#filtering-excluding) feature inherits these three settings unless you set the matching `model_metadata.*` key.

#### Related Models Outside Your Directories

A relation can point at a model the package was never told to publish, such as a vendor package's model, or one in a directory that isn't in `additional_directories`. The package publishes that model too, along with the models it relates to in turn, so the relation's import resolves. The `Notifiable` trait is the common case: it relates `User` to Laravel's `DatabaseNotification`, which is published to `illuminate/notifications/database-notification.ts` with no config.

A related model is published this way only when:

- it isn't in `excluded`, and it's in `included` when you set that list
- its class doesn't carry `#[TsExclude]`
- its table or view exists

Otherwise the relation is left out, like a relation to an excluded model. In an app that never created the `notifications` table, `UserRelations` has no `notifications` property.

The package reads each relation on a blank model. A relation that can't be read that way, such as one that reads another model's attribute, is left out of its model, and `ts:publish` names it in a warning. A related model the package can't read at all is left out with a warning too.

A model published this way gets its interfaces and nothing else. It has no [model metadata](https://tolki.abe.dev/ts/model-metadata.html) file, and the [Vite plugin](https://tolki.abe.dev/ts/vite-plugin.html) doesn't republish it when its file changes. Add its class or directory to `additional_directories` to get both.

### Casing

`models.relationship_case` sets the casing of relation names: `'snake'` (default), `'camel'` or `'pascal'`. The `_count` and `_exists` suffixes are added to the cased name as they are:

| Config Value | Relation (`hasMany(Post::class)`) | Count               | Exists               |
| ------------ | --------------------------------- | ------------------- | -------------------- |
| `'snake'`    | `owned_teams: Team[]`             | `owned_teams_count` | `owned_teams_exists` |
| `'camel'`    | `ownedTeams: Team[]`              | `ownedTeams_count`  | `ownedTeams_exists`  |
| `'pascal'`   | `OwnedTeams: Team[]`              | `OwnedTeams_count`  | `OwnedTeams_exists`  |

### Configuration Reference

The [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html) lists every `models.*` config key, including the pipeline class overrides for advanced customization.

## Model Metadata

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can publish a small runtime companion beside each generated model interface. The companion, `{model}_meta.ts`, exports a `{Model}ModelMetadata` object whose values come from a provider class you control. The default provider publishes the model's morph class, so the frontend can build polymorphic payloads such as `commentable_type` without hard-coding PHP class names.

A [model interface](https://tolki.abe.dev/ts/models.html) is type-only and disappears at compile time. A companion is a real module you read at runtime, so the frontend can use values the backend owns instead of hard-coding them. Companions count as functional output, so the [Vite plugin](https://tolki.abe.dev/ts/vite-plugin.html#production-builds) regenerates them on `vite build`, and they don't need the `@tolki/ts` runtime.

### How Model Metadata Is Generated

Model metadata is its own publishing feature:

- **Separate settings**: the feature is configured under `model_metadata.*` and is off by default. `models.enabled` and `--only-models` control model interfaces only. `model_metadata.enabled` and `--only-model-metadata` control companions, and `--only-functional` includes them.
- **The same models**: the feature finds the same models as model publishing, and inherits `models.included`, `models.excluded` and `models.additional_directories` unless you set the matching `model_metadata.*` key. A value you set wins, even an empty array. A model published only because [another model relates to it](https://tolki.abe.dev/ts/models.html#related-models-outside-your-directories) gets no companion.
- **One provider call per model**: the provider's `provide(Model $model)` receives a model instance from the container, not a record from the database, and returns the payload. The package runs `provide()` to get the values, and reads its docblock and code to type them. See [How Each Key Is Typed](#how-each-key-is-typed).
- **One file per model**: `{model}_meta.ts` is written beside the model interface, and the namespace's `index.ts` barrel exports it. See [Barrels](#barrels).

### Anatomy of a Generated Companion

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

A `config/ts-publish.php` published before this feature has no `model_metadata` block. Laravel merges package config one level deep, so a block you add replaces the package's defaults for that block. Copy the whole block from the package config rather than only the key you need. Nothing breaks if you skip it, because every key falls back to its default in code.

### Writing a Provider

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

### How Each Key Is Typed

Each returned key's TypeScript type comes from the first of these that applies:

1. **`#[TsCasts]` on `provide()`**: an explicit type, and the only way to point a key at an import path of your own. `['type' => 'X', 'import' => '@/types/x']` imports `X`, and `'optional' => true` marks the key optional.
2. **The `@return array{...}` shape**: `key?:` marks an optional key, and every other key must be in every payload. Scalars, containers such as `array<string, T>` (published as `Record<string, T>`) and `list<T>` (published as `T[]`), and nested shapes all work.
3. **The method body**: the package reads the returned array literal, with `$model` typed as its declared class. These need no annotation:
   - Scalars, casts such as `(string) …`, and nested inline arrays
   - Calls on `$model` whose Laravel signature or docblock declares a return type, such as `getTable()`, `getKeyName()`, `getRouteKeyName()` and `getMorphClass()`, which all publish as `string`
   - Enum values, including a case written inline such as `'status' => Status::Active`, which import their `{Name}Type` alias from the generated enums, the same as a `#[TsCasts]` import would

   When the body's type for a key still contains `unknown`, the package ignores it, and the key needs a docblock or `#[TsCasts]` type. A helper with no declared return type, such as `private function tableFor($model)`, is that case.

Marking a key optional decides whether the payload has to return it, not how the key is written once it's returned. The `satisfies` type lists exactly the keys the payload returned, each one required.

Two kinds of value always need `#[TsCasts]`. The first is a class or enum named in the docblock, because a docblock string carries no import path. The second is any value typed as a model or a resource. A metadata value doesn't have to match either interface, so the package never imports one for it.

Every returned key must end up with a type, and every required key must be returned. Otherwise the companion fails, and the error names the model and the keys.

### Values

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

#### Empty Containers

PHP can't tell an empty list from an empty object, and TypeScript rejects `[]` where an object or `Record<…>` type is declared. Two rules cover it:

- Return `(object) []` or `new stdClass` for an empty object.
- A bare `[]` publishes as `{}` wherever its type is an object literal, an index signature or a `Record<…>`, and as `[]` everywhere else. That includes a key typed with an imported `#[TsCasts]` type, which the package can't look inside.

### Barrels

Companions share their namespace directory's `index.ts` barrel with the model interfaces. [Barrel Files](https://tolki.abe.dev/ts/modular-publishing.html#barrel-files) lists which exports each run keeps.

### Failures

A provider that throws for one model doesn't stop the run. The common case is `Relation::enforceMorphMap()` with a model missing from the map. Every other file is written, and that model keeps its previous `{model}_meta.ts` and barrel export as the last good version. The command then reports each failure and exits non-zero. Under `--quiet`, the failures go to stderr, so CI and the [Vite plugin](https://tolki.abe.dev/ts/vite-plugin.html) still see them, and a failing companion fails `vite build`. Use `model_metadata.excluded` for models you deliberately don't map. A `--source` run stops at the first failure.

The package checks the provider, generator and transformer classes before it writes any file, so a misconfigured `provider_class` fails early instead of leaving a half-published directory.

### Filtering & Excluding

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

`#[TsExclude]` on a model class excludes both its interface and its companion. See [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html).

### Cache

Companions take part in [cache generation](https://tolki.abe.dev/ts/generating-cache.html). The provider's file counts as a dependency of each companion, and a custom provider's file is also watched, so editing it republishes during `vite dev`. The package also hashes each model's provider payload, so a morph-map change or a new value republishes exactly the affected companions without `--fresh`. The hash covers the raw payload that `provide()` returns, and an object value is hashed by its own properties. If an object's `toArray()` depends on anything else, return an array instead.

### Limits

Two cases aren't handled for you:

- An enum that a provider body returns is imported from the generated enums even when you exclude that enum from enum publishing. The companion then fails `tsc` with a missing module or member. Include the enum, or type the key with an import-aware `#[TsCasts]`.
- A model named with an underscore, such as `User_meta`, gets the same file name as the `User` companion. PSR-1 class names don't use underscores, so the package doesn't guard against this.

### Customizing the Pipeline

`model_metadata.provider_class` is the extension point most apps need. The feature also has the standard swappable classes, `collector_class`, `generator_class`, `transformer_class` and `writer_class`, and a `template` key (`laravel-ts-publish::model-meta`) for the Blade view that renders the companion. A custom generator or transformer must extend the package's default. See [Customizing the Pipeline](https://tolki.abe.dev/ts/customizing-the-pipeline.html).

### Configuration Reference

The [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html#model-metadata-model-metadata) lists every `model_metadata.*` key.

## API Resources

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) generates a TypeScript interface for each of your Laravel [API resources](https://laravel.com/docs/eloquent-resources), the `JsonResource` classes that shape your API's JSON. It reads each resource's `toArray()` method without calling it, and publishes the name, type, and optionality of every property the method returns.

Use it when your frontend reads JSON from API resources. Each publish regenerates the interface from `toArray()`, so you don't maintain a second, hand-written type.

By default, the package looks for resources in the `app/Http/Resources` directory. To change that, see [Filtering & Excluding](#filtering--excluding).

Resources need the `@tolki/ts` runtime package only when they use `EnumResource::make()`, which publishes that package's `AsEnum<typeof Enum>` type. See [Installing `@tolki/ts`](https://tolki.abe.dev/ts/index.html#installing-tolki-ts) and [Enums](https://tolki.abe.dev/ts/enums.html).

### Anatomy of a Generated Resource

This resource reads columns, an enum, relations, and counts from its `User` model:

```php
/**
 * User account resource.
 *
 * @mixin User
 */
#[TsResource(model: User::class)]
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => EnumResource::make($this->role),
            'profile' => $this->whenLoaded('profile'),
            'posts' => PostResource::collection($this->whenLoaded('posts')),
            'phone' => $this->whenHas('phone'),
            'avatar' => $this->whenNotNull($this->avatar),
            'posts_count' => $this->whenCounted('posts'),
            'comments_count' => $this->whenCounted('comments'),
        ];
    }
}
```

The package generates this interface:

```typescript
import { type AsEnum } from "@tolki/ts";

import { Role } from "../../enums";
import type { Profile } from "../../models";
import type { PostResource } from ".";

/**
 * User account resource.
 *
 * @see App\Http\Resources\UserResource
 */
export interface UserResource {
  id: number;
  name: string;
  email: string;
  role: AsEnum<typeof Role> | null;
  profile?: Profile | null;
  posts?: PostResource[];
  phone?: string | null;
  avatar?: string;
  posts_count?: number;
  comments_count?: number;
}
```

The output shows how each kind of value is typed:

- Direct properties, such as `id`, `name`, and `email`, are required.
- `whenLoaded()`, `whenHas()`, `whenNotNull()`, and `whenCounted()` make their properties optional (`?`).
- `EnumResource::make()` publishes `AsEnum<typeof Role>` and imports it. It adds `| null` because the `role` column is nullable.
- `PostResource::collection()` publishes `PostResource[]`, imported from the barrel file in the same directory.
- A bare `whenLoaded('profile')` publishes the model's relation type, `Profile | null`.
- The class docblock becomes a JSDoc comment, with a `@see` tag that points back to the PHP class.

#### Classes Sharing a Name Across Namespaces

When two classes in different namespaces share a name, such as `App\Models\User` and `Crm\Models\User`, the generated file imports each one under its own alias. Every occurrence of the name inside a property's type uses the alias of the class it refers to, in source order:

```typescript
import type { User as CrmUser } from "../../../crm/models";
import type { User as ModelsUser } from "../../models";

export interface WarehouseResource {
  regional_hub_contacts: {
    primaryContact: CrmUser | null;
    manager: ModelsUser | null;
    secondaryContact: CrmUser | null;
  } | null;
}
```

### How the Backing Model Is Resolved

The package types most properties from the resource's backing Eloquent model, using its database columns, casts, accessors, and relations. It looks for that model in this order:

1. The `#[TsResource(model: User::class)]` attribute.
2. A `@mixin` or `@extends` tag in the resource's own docblock. The class name resolves through the file's `use` imports.
3. The nearest parent class whose docblock has a `@mixin` or `@extends` tag.
4. A `$resource` property redeclared with a `@var` type, such as `/** @var User */ public $resource;`.
5. Laravel's naming convention in reverse, so `App\Http\Resources\UserResource` maps to `App\Models\User`.
6. A model whose `#[UseResource(UserResource::class)]` attribute names the resource. This attribute needs Laravel 12.29 or later.

Most resources need only a `@mixin` tag or the naming convention. Use `#[TsResource(model:)]` when the resource name doesn't match the model, and `#[UseResource]` when the resource lives outside an `Http\Resources` namespace.

Step 3 lets a subclass use its parent's model without repeating the docblock, whether or not the subclass declares its own `toArray()`. See [Inheriting a Parent `toArray()`](#inheriting-a-parent-toarray).

If no model resolves, a property read from the model, such as `$this->id`, publishes `unknown`.

`$this->resource` holds the backing model, so a key that returns it whole publishes the model's interface. `'post' => $this->resource` publishes `post: Post`. If the resource redeclares `$resource` as nullable, such as `/** @var Post|null */ public $resource;` or `?Post`, the key keeps that `null`: `post: Post | null`.

A `ResourceCollection` is backed by no model, whatever its docblock or `#[TsResource(model:)]` names, because its `$this->resource` holds the collected items. A model read in a collection, such as `$this->title`, publishes `unknown`. See [Reading `$this->resource`](#reading-this-resource).

### Supported `toArray()` Patterns

These sections cover the Laravel resource features you use in `toArray()`. Each one shows the PHP you write and the TypeScript it produces.

#### Direct Property Access

A property read from the model takes its type from the database column and its cast:

```php
'id' => $this->id,
'name' => $this->name,
'status' => $this->status, // an enum cast
```

The three properties publish these types:

```typescript
id: number;
name: string;
status: StatusType;
```

`$this->resource->name` reads the same attribute, so it publishes the same type. A property you declare on the resource class itself, such as a promoted constructor parameter, takes its type from that declaration. It wins over a model attribute with the same name, as it does in PHP.

An untyped property that nothing in the class, its parents, or its traits writes takes its default's type, so `protected $stage = Status::Draft;` publishes `StatusType`. A protected or private one declared without a value, such as `protected $name;`, publishes `null`.

#### Conditional Methods

Laravel's conditional methods publish optional properties (`?`), because the key can be missing from the response. Passing a default argument makes the property required, because the key is then always present. The exception is a value or a default that is itself a conditional value, such as `$this->whenLoaded('author')`. See [Passing a Default Argument](#passing-a-default-argument).

| Method                                                    | Includes the key when                       | Published type                                                                                                                         |
| --------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `$this->when($condition, $value)`                         | `$condition` is true                        | `$value`'s type                                                                                                                        |
| `$this->unless($condition, $value)`                       | `$condition` is false                       | `$value`'s type                                                                                                                        |
| `$this->whenHas('attribute', $value)`                     | The attribute is present                    | `$value`'s type, or `unknown` when the package can't type it                                                                           |
| `$this->whenAppended('attribute', $value)`                | The accessor is appended                    | `$value`'s type, or `unknown` when the package can't type it                                                                           |
| `$this->whenNotNull($value)`                              | `$value` isn't `null`                       | `$value`'s type without `null`                                                                                                         |
| `$this->whenNull($value)`                                 | `$value` is `null`                          | `null`                                                                                                                                 |
| `$this->whenLoaded('relation')`                           | The relation is loaded                      | The relation's type                                                                                                                    |
| `$this->whenCounted('relation')`                          | The count is loaded                         | `number`                                                                                                                               |
| `$this->whenAggregated('relation', 'column', 'function')` | The aggregate is loaded                     | The aggregate's type. It adds `\| null` except for a count and the other cases in [Typing `whenAggregated()`](#typing-whenaggregated). |
| `$this->whenExistsLoaded('relation', $value)`             | The existence flag is loaded                | `$value`'s type, else `boolean`                                                                                                        |
| `$this->whenPivotLoaded('table')`                         | The pivot is loaded                         | `unknown`                                                                                                                              |
| `$this->whenPivotLoadedAs('accessor', 'table')`           | The pivot is loaded under a custom accessor | `unknown`                                                                                                                              |
| `$this->transform($value, $callback)`                     | `$value` is filled                          | `$callback`'s return type                                                                                                              |

To see when `whenLoaded()` or a resource built around a relation adds `| null`, read [Nullable Relations](#nullable-relations).

##### `unless()` Is `when()` With the Condition Negated

`unless($condition, $value, $default)` includes `$value` when `$condition` is false. It publishes exactly what `when()` would, including with a default argument:

```php
'status' => $this->unless($this->is_draft, $this->status),          // optional
'status' => $this->unless($this->is_draft, $this->status, 'draft'), // required
```

##### Passing a Default Argument

Every conditional method accepts a trailing default argument. When you pass one, Laravel includes the key whether or not the condition holds, so the property is required, unless the value or the default can itself be missing. The default's type joins the value's type:

```php
'discount' => $this->when($this->has_discount, $this->discount_percent),        // discount?: number
'discount' => $this->when($this->has_discount, $this->discount_percent, 'n/a'), // discount: number | string
'reviews'  => $this->whenCounted('reviews', null, 'n/a'),                       // reviews: number | string
'address'  => $this->whenHas('full_address', $this->full_address, 0),           // address: string | number
```

For `whenNotNull()` and `whenNull()`, the second argument is that default value, not a callback. `whenNotNull()` includes the key only when its value isn't `null`, so it removes `null` from the type:

```php
'line_2'   => $this->whenNotNull($this->line_2),              // line_2?: string, from a string | null column
'discount' => $this->whenNotNull($this->discount_percent, 0), // discount: number
```

A default of the value's own type makes the property required without widening it. A default of another type, such as a string fallback for a number column, publishes a union of both.

An explicit `null` counts as a default, because Laravel checks whether you passed the argument, not what it holds. So `$this->whenLoaded('user', fn ($user) => $user, null)` is required, and it publishes `User | null` instead of `User`.

A value or a default that is itself a conditional value keeps the property optional, because Laravel still drops the key when that value is missing:

```php
'author' => $this->when($flag, $this->whenLoaded('author'), 'none'), // author?: User | string
'author' => $this->when($flag, 'none', $this->whenLoaded('author')), // author?: string | User
```

Any other default makes the property required, but two cases leave its type as it was:

- **A default the package can't type**: the value's type stands alone. This covers an expression or closure the package can't read.
- **A value the package can't type**: for `when()`, `unless()`, `whenHas()`, `whenAppended()`, `whenPivotLoaded()`, and `whenPivotLoadedAs()`, the property publishes `unknown`, which already covers any default.

`whenExistsLoaded()`, `whenCounted()`, and `whenAggregated()` keep their `boolean` or aggregate type for such a value instead, and the default joins that type.

Laravel calls a default closure with no arguments, except in `transform()`. A closure default that requires a parameter would throw if it ran, so the package leaves it out of the type:

```php
'notes' => $this->whenNotNull($this->notes, fn ($notes) => strlen($notes)), // notes: string
```

A closure whose parameter has its own default, such as `fn ($notes = '') => strlen($notes)`, runs without arguments, and the parameter holds its default's type. Its return type joins the union as usual, and the property publishes `string | number`.

On PHP 8.5 the default can also be a static closure or a first-class callable, such as `fn ($notes = strlen(...)) => $notes`. The parameter then holds `Record<string, never>`, because Laravel sends a `Closure` as `{}`.

`transform()` calls its default with the blank value, so a one-parameter default runs, and its parameter holds the value's full type, `null` included. `$this->transform($this->rating, fn ($r) => 'x', fn ($r) => $r)` publishes `string | number | null`.

##### Closure Parameters

When you pass a closure as the value, its first parameter holds whatever Laravel calls it with:

| Method                                                            | The closure's first parameter holds                                                                                                                              |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `whenLoaded()`                                                    | The loaded relation, never `null`: a model, a list of models, or the models a `morphTo` can hold                                                                 |
| `whenHas()`                                                       | The attribute's value                                                                                                                                            |
| `whenExistsLoaded()`                                              | The relation's `{relation}_exists` flag, a `boolean`                                                                                                             |
| `whenCounted()`, and `whenAggregated()` with the `count` function | The count, a `number`                                                                                                                                            |
| `whenAggregated()` with any other function                        | The aggregate, never `null`                                                                                                                                      |
| `transform()`                                                     | The value you pass as its first argument                                                                                                                         |
| `when()`, `unless()`                                              | No value, since Laravel passes none. A closure that requires a parameter throws `ArgumentCountError` whenever Laravel calls it, and `ts:publish` warns about it. |
| `whenAppended()`                                                  | No value, since Laravel passes none                                                                                                                              |

When Laravel passes no value, a parameter with a default holds that default's type.

The closure's return type becomes the property's type:

```php
'author_name' => $this->whenLoaded('author', fn ($author) => $author->name),     // author_name?: string
'has_comments' => $this->whenExistsLoaded('comments', fn ($exists) => $exists), // has_comments?: boolean
```

Here `author` is a relation that can't load `null`. When a relation is loaded as `null`, Laravel returns `null` without calling the closure, so a relation that can load `null` publishes `author_name?: string | null`. A `whenAggregated()` closure works the same way when its function is a string literal other than `'count'`, because SQL returns `NULL` for that aggregate over no rows. So `fn ($max) => ['max' => $max]` publishes `{ max: number } | null`, unless an accessor or `@property` on your model types the attribute without `null`. See [Nullable Relations](#nullable-relations) for which relations can load `null`.

##### `whenHas()`, `whenAppended()`, and `whenExistsLoaded()` Type From the Value You Pass

All three return Laravel's `value($value, ...)`, so the property takes the type of the value you pass, not of the attribute you name. `whenHas()` and `whenExistsLoaded()` pass the attribute to the closure's first parameter, and `whenAppended()` passes nothing:

```php
return [
    'has_title' => $this->whenHas('title', fn ($title): bool => $title !== ''),
    'title_length' => $this->whenHas('title', fn ($title) => strlen($title)),
    'appended_label' => $this->whenAppended('title_display', fn () => 'label'),
    'comments_flag' => $this->whenExistsLoaded('comments', fn ($exists) => $exists ? 'yes' : 'no'),
    'title_unresolvable' => $this->whenHas('title', fn ($title) => json_decode($title)),
];
```

The resource publishes these properties:

```typescript
export interface PostResource {
  has_title?: boolean;
  title_length?: number;
  appended_label?: string;
  comments_flag?: string;
  title_unresolvable?: unknown;
  // …
}
```

When the package can't type the value of `whenHas()` or `whenAppended()`, the property publishes `unknown`, not the attribute's type, because the value replaces the attribute in the response. `json_decode()` returns `mixed`, and a plain title decodes to `null`, so `title_unresolvable` is `unknown`. To type it, give the closure a native return type: `fn ($title): ?string => json_decode($title)` publishes `string | null`. A `@return` docblock on the closure doesn't type it.

`whenExistsLoaded()` keeps `boolean` for a value it can't type. Without a value argument, `whenHas('phone')` types from its column, and `whenExistsLoaded('user')` publishes `boolean`.

##### An Explicit `null` in the Value Slot

Laravel's `value()` helper returns a plain `null` unchanged. So a literal `null` as the value of `whenHas()`, `whenAppended()`, or `whenExistsLoaded()` publishes `null`, and the attribute's type never reaches the property. A default still joins the type:

```php
'address'  => $this->whenHas('full_address', null, 0),         // address: number | null
'appended' => $this->whenAppended('full_address', null, 0),    // appended: number | null
'exists'   => $this->whenExistsLoaded('user', null, 'absent'), // exists: string | null
```

This happens only when Laravel receives a `null` in that slot: a literal `null`, or a named `default:` argument that skips the value, since PHP fills the skipped argument with `null`. So `whenHas('phone', default: 0)` publishes `number | null`. Leaving both arguments out is different: `whenHas('phone')` still types from the column, and `whenExistsLoaded('user')` is still `boolean`.

`whenCounted()`, `whenAggregated()`, and `whenLoaded()` treat a `null` value as no value, so the count, the aggregate, or the relation still comes through. That's why `whenCounted('reviews', null, 'n/a')` publishes `number | string`. An aggregate other than a count keeps its own `| null`, so `whenAggregated('items', 'price', 'sum', null, 'none')` publishes `number | string | null`. For a `parent` relation that can load `null`, `whenLoaded('parent', null, 'absent')` publishes `Category | string | null`.

##### Typing `whenAggregated()`

`whenAggregated('relation', 'column', 'function')` reads the `{relation}_{function}_{column}` attribute that a query such as `withSum('orderItems', 'total_price')` loads, here `order_items_sum_total_price`. The package types that attribute from the first of these that applies:

1. An accessor or a `@property` tag that your model declares for the attribute.
2. A built-in cast that your model declares for the attribute.
3. What your database driver returns for the related column.

Most aggregates add `| null`, because SQL returns `NULL` for an aggregate over no rows. Three cases publish without it:

- **A count**: `whenAggregated()` with `'count'` publishes `number`, as `whenCounted()` does.
- **A function that isn't a string literal**: a function the call passes in a variable or a constant publishes `number`.
- **A declaration without `null`**: an accessor or `@property` whose type leaves out `null`, such as a getter that returns `$value ?? 0`, publishes that type.

On SQLite, for example:

```php
'last_sold_at' => $this->whenAggregated('orderItems', 'created_at', 'max'),  // last_sold_at?: string | null
'average_quantity' => $this->whenAggregated('orderItems', 'quantity', 'avg'), // average_quantity?: number | null
'revenue' => $this->whenAggregated('orderItems', 'total_price', 'sum', null, 0), // revenue: number | null
```

The published type follows the database connection of the machine that runs `ts:publish`. A `SUM()` of a decimal column publishes `number | null` from SQLite and `string | null` from MySQL. Publish against the database driver your app runs in production. The [generation cache](https://tolki.abe.dev/ts/generating-cache.html) rebuilds everything when `database.default` or a connection's driver changes, including a driver that the connection's `url` names.

To publish one type on every driver, cast the attribute on the parent model:

```php
class Product extends Model
{
    protected function casts(): array
    {
        return [
            'order_items_sum_total_price' => 'float', // number | null on every driver
        ];
    }
}
```

Laravel applies your model's casts to an aggregate attribute, but it never applies the related model's casts there. It casts no aggregate on its own except `withExists()`.

A cast publishes the type Laravel returns for it, so `integer` and `float` publish `number`, and `decimal:2` publishes `string`. The package can't see a cast you add at query time with `withCasts()`.

#### Nested Resources

Reference another resource with `::make()`, `::collection()`, or `new`. The property takes that resource's interface, and the package imports it:

```php
// Optional, because whenLoaded() is conditional
'author' => UserResource::make($this->whenLoaded('user')),

// new works the same as ::make()
'author' => new UserResource($this->whenLoaded('user')),

// A list of resources
'tags' => TagResource::collection($this->whenLoaded('tags')),

// Required, because the argument isn't conditional
'owner' => UserResource::make($this->user),
```

Here `user` is a `BelongsTo` relation with a nullable foreign key, so `author` and `owner` add `| null`. The `author`, `tags`, and `owner` properties publish:

```typescript
author?: UserResource | null;
tags?: TagResource[];
owner: UserResource | null;
```

Inside another resource, Laravel sends a nested resource whose payload is `null` as `null`. So a resource built around a relation that can load `null` adds `| null`, as [Nullable Relations](#nullable-relations) describes. When the foreign key isn't nullable, `author` and `owner` publish `UserResource` without it. A list of resources, such as `tags`, never adds `| null`.

A resource built around a literal `null`, such as `new UserResource(null)`, publishes `null`.

A resource can reference itself:

```php
'parent' => CategoryResource::make($this->whenLoaded('parent')),
'children' => CategoryResource::collection($this->whenLoaded('children')),
```

Calling `resolve()` on a nested resource, as in `new UserResource($this->author)->resolve($request)`, publishes the same interface.

A named collection nests the same way, with `new` or `::make()`. Inside another resource, Laravel sends what the collection's `toArray()` returns, so a collection with a `toArray()` of its own publishes its interface:

```php
'staff' => new UserCollection($this->staff),
```

With the `UserCollection` from [Resource Collections](#resource-collections), whose `toArray()` returns `data` and `has_admin`, `staff` publishes `staff: UserCollection;`. A collection with no `toArray()`, or one whose `toArray()` returns the collected list, sends the bare list, so it publishes `UserResource[]`. An argument-less `toResourceCollection()` that finds a collection by name follows the same rule. Over an empty collection, Laravel skips the guess and sends `[]`, so when the guess would find `UserCollection`, the property publishes `UserCollection | never[]`.

A [JSON:API resource](#jsonapi-resources) nests differently. See [Nesting a JSON:API Resource](#nesting-a-jsonapi-resource).

#### `toResource()` and `toResourceCollection()`

Laravel's `Model::toResource()` and `Collection::toResourceCollection()` find their resource three ways, and the package follows each one:

```php
// 1. An explicit class argument
'owner' => $this->owner->toResource(UserResource::class),

// 2. #[UseResource] or #[UseResourceCollection] on the model
'owner' => $this->owner->toResource(),

// 3. Laravel's naming convention: {Model}Resource, then {Model}
'owner_guessed' => $this->whenLoaded('owner', fn ($m) => $m->toResource()),
'attachment' => $this->whenLoaded('attachment', fn ($m) => $m->toResource()),
```

The naming convention is the only route that guesses a class name, and the package accepts the guess only when it publishes that resource. If the guessed class comes from another package, has `#[TsExclude]`, or sits outside the scanned directories, the property publishes `unknown` instead of importing a file that doesn't exist:

```typescript
owner_guessed?: UserResource; // the guessed UserResource is published
attachment?: unknown; // AttachmentResource exists, but has #[TsExclude]
```

Here `owner` can't load `null`. On a relation that can, `owner_guessed` publishes `UserResource | null`, as does `$this->owner?->toResource()`. See [Nullable Relations](#nullable-relations).

A resource you name yourself is always used, even when this package doesn't publish it. That covers a class argument, `#[UseResource]` or `#[UseResourceCollection]`, and a collection's `#[Collects]` or `$collects`. When no resource matches at all, the property publishes `unknown`.

A `?->` earlier in the same chain adds `| null` too, because PHP ends the whole chain with `null` when that step is `null`. A local variable ends the chain, so a call on it keeps the bare resource type:

```php
public function toArray(Request $request): array
{
    $grandparent = $this->parent?->parent;

    return [
        'grandparent' => $this->parent?->parent->toResource(),
        'siblings' => $this->parent?->children->toResourceCollection(),
        'local_grandparent' => $grandparent->toResource(),
    ];
}
```

On a `Category` resource, these keys publish:

```typescript
grandparent: CategoryResource | null;
siblings: CategoryResource[] | null;
local_grandparent: CategoryResource;
```

`$grandparent` can hold `null`, but calling `toResource()` on a `null` local throws instead of returning `null`, so `local_grandparent` never sends `null`.

#### Enum Properties With `EnumResource`

Wrap an enum-cast property in `EnumResource::make()` to send the enum as an object instead of its bare value:

```php
'status' => EnumResource::make($this->status),
'currency' => EnumResource::make($this->currency),
```

See [Response Shape](https://tolki.abe.dev/ts/enum-api-resource.html#response-shape) on the Enum API Resource page for what the object holds. With `enums.use_tolki_package` enabled, which is the default, these publish `AsEnum<typeof Status>` and `AsEnum<typeof Currency>`, and the package imports each enum. With it disabled, they publish the enum's type alias, such as `StatusType`.

`EnumResource::collection()` does the same for a list, and publishes `AsEnum<typeof Status>[]`.

The enum can also come from a local variable, and the whole `EnumResource` can come from a helper method on the resource. Both publish the same `AsEnum` type:

```php
public function toArray(Request $request): array
{
    $status = $this->status;

    return [
        'status_from_local' => EnumResource::make($status),
        'status_from_helper' => $this->statusResource(),
        'visibility_from_helper' => $this->visibilityResource(),
    ];
}

public function statusResource(): EnumResource
{
    return EnumResource::make($this->status);
}

public function visibilityResource(): ?EnumResource
{
    return $this->visibility === null ? null : new EnumResource($this->visibility);
}
```

A helper that can return `null` adds `| null`:

```typescript
status_from_local: AsEnum<typeof Status>;
status_from_helper: AsEnum<typeof Status>;
visibility_from_helper: AsEnum<typeof Visibility> | null;
```

Wrapping a conditional value, as in `EnumResource::make($this->whenHas('status'))`, makes the property optional, as the conditional method alone would.

A ternary that wraps only one of its arms keeps both shapes. The property publishes a union, with the import each side needs, even inside an inline array:

```php
'audit' => [
    'status' => $request->boolean('wrap')
        ? EnumResource::collection($this->status_history)
        : $this->status_history,
],
```

The ternary publishes both arms:

```typescript
import { type AsEnum } from "@tolki/ts";

import { Status } from "../../enums";
import type { StatusType } from "../../enums";

export interface TeamResource {
  audit: { status: AsEnum<typeof Status>[] | StatusType[] };
}
```

Without the wrapper, a bare case such as `'status' => Status::Active` publishes the enum's type alias, `StatusType`, which matches the value Laravel sends for a backed enum. A pure enum's case publishes its alias too.

#### Merge Operations

Use `merge()`, `mergeWhen()`, and `mergeUnless()` to add properties to the response:

```php
// Unconditional: the properties are required
$this->merge([
    'full_name' => $this->first_name . ' ' . $this->last_name,
    'total_display' => $this->total,
]),

// Conditional: the properties are optional
$this->mergeWhen($this->is_featured, [
    'weight' => $this->weight,
    'dimensions' => $this->dimensions,
]),
```

`merge()` and `mergeWhen()` also accept a closure or an arrow function instead of an array:

```php
$this->merge(fn () => [
    'currency_label' => $this->currency,
]),

$this->mergeWhen($this->paid_at !== null, fn () => [
    'shipped_at' => $this->shipped_at,
    'tracking' => $this->tracking_number,
]),
```

Each method decides whether its properties are required:

| Method                                       | Merged properties                                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `$this->merge([...])`                        | Required                                                                                                                            |
| `$this->mergeWhen($condition, [...])`        | Optional (`?`), included when `$condition` is true                                                                                  |
| `$this->mergeUnless($condition, [...])`      | Optional (`?`), included when `$condition` is false                                                                                 |
| `$this->mergeWhen($condition, [...], [...])` | The second array merges when `$condition` is false. A key both arrays set is required, with both types. A key one sets is optional. |

`mergeUnless()` takes a default the same way. Either array can be a closure instead, which Laravel calls with no arguments.

```php
$this->mergeWhen($this->paid_at !== null, [
    'state' => 'paid',
    'paid_by' => $this->user_id,
], [
    'state' => 0,
    'awaiting_payment' => true,
]),
```

`state` is in both arrays, so the response always has it:

```typescript
state: string | number;
paid_by?: number;
awaiting_payment?: boolean;
```

When the package can't type a key's value in one array, the key takes its type from the other array, as a ternary does. That holds even when the other array's value is a plain `null`.

A closure can return a different array on each path. A `return []` inside a `merge()` closure merges nothing, so the keys its other returns set publish optional:

```php
$this->merge(function () {
    if (! $this->user) {
        return [];
    }

    return [
        'user_name' => $this->user->name,
        'user_email' => $this->user->email,
    ];
}),
```

The closure publishes `user_name?: string` and `user_email?: string`.

A merge can also take the resource's own model, `$this->resource`, or a call to one of the resource's methods, such as `$this->labelFields()`, passed as it is or returned from a closure:

```php
return [
    'id' => $this->id,
    $this->merge(fn () => $this->labelFields()),
    $this->mergeWhen($this->color !== null, $this->resource),
];
```

A method call merges the keys the method returns. The model merges the keys its `toArray()` writes, with the model's own `#[TsCasts]` applied. That's the same set a resource with no `toArray()` publishes, as [JsonResource Base Delegation](#jsonresource-base-delegation) describes. Behind `mergeWhen()` or `mergeUnless()`, each merged key is optional.

A key the array sets before a merge publishes as it would without the merge, because Laravel doesn't let a merged key replace it. Here `id` stays a required `number`, though the model also has an `id`.

#### Closure & Arrow Function Values

A closure or an arrow function in value position is typed from what it returns:

```php
// An arrow function: its expression is the value
'status' => $this->when(true, fn () => $this->status),

// An arrow function that returns a nested resource
'user' => $this->when(true, fn () => UserResource::make($this->user)),

// A full closure: the types of all its return statements are unioned
'notes' => $this->when(true, function () {
    return $this->notes;
}),
```

This works wherever a value goes, including `when()`, `whenLoaded()`, `whenNotNull()`, `merge()`, and `mergeWhen()`.

A first-class callable, such as `$this->label(...)` or `UserResource::make(...)`, creates a closure. Where Laravel calls the value, as `when()`, `whenLoaded()` and the other conditional methods do, it publishes what the call returns:

```php
'label' => $this->when($request->has('label'), $this->label(...)),        // label?: string
'supervisor' => $this->whenLoaded('supervisor', UserResource::make(...)), // supervisor?: UserResource | null
'length' => strlen(...),                                                  // length: Record<string, never>
```

As a plain value, nothing calls it, and Laravel sends the `Closure` as `{}`, so a first-class callable there, like `length` above, publishes `Record<string, never>`. `ts:publish` warns about such a callable and names its line. Call the function instead, as in `'length' => strlen($this->name)`.

`ts:publish` doesn't analyze a class again while the [generation cache](https://tolki.abe.dev/ts/generating-cache.html) holds it, so a warning may not repeat on the next run. Run `php artisan ts:publish --fresh` to list every warning.

### Method Calls, Variables, and Collections

Values you compute in `toArray()` get types too: method calls, property reads on other objects, local variables, and collection chains.

#### Method Return Types

A method call takes its type from the called method's signature: its native return type, or its `@return` docblock when the native type is missing or vague. This works for calls on enum casts, date casts, models, Eloquent collections, value objects, and services resolved from the container:

```php
public function toArray(Request $request): array
{
    $record = $this->resource;

    return [
        'priority_label' => $this->priority->label(),                                 // enum cast
        'published_date' => $this->published_at->setTimezone('UTC')->toDateString(),  // date cast
        'from_label' => Priority::from(1)->label(),                                   // enum constructor
        'record_class' => $record::className(),                                       // static call on a variable's class
        'author_fresh' => $this->author->fresh(),                                     // model
        'comment_ids' => $this->comments->modelKeys(),                                // Eloquent collection
    ];
}
```

Each call publishes its method's return type:

```typescript
export interface PostResource {
  priority_label: string;
  published_date: string;
  from_label: string;
  record_class: string;
  author_fresh: User | null;
  comment_ids: number[];
  // …
}
```

A property read works the same way. Once `$post` holds a `Post`, `$post?->author?->name` publishes `string | null`. A value object's public property takes its declared type, so `$this->stats?->views` publishes `number | null`. A `?->` adds `| null` to the result once, however many steps use it.

When the declaration says too little, as with no return type, `mixed`, or a bare `array`, the method's own `return` statements set the type:

```php
public function toArray(Request $request): array
{
    return [
        'headline' => $this->headline(),
        'size' => $this->size(),
    ];
}

private function headline()
{
    return strtoupper($this->title);
}

private function size(): mixed
{
    if ($this->word_count > 1000) {
        return 'long';
    }

    return 1.5;
}
```

Each key publishes what its method's returns hold:

```typescript
headline: string;
size: string | number;
```

Every `return` counts, so one the package can't type leaves the key `unknown`. A method that yields or returns a closure publishes `unknown` too. A method with no return type that can end without returning a value adds `| null`. This reading applies to the methods in your app, not to a vendor package's methods.

A call to a method the resource declares takes that method's type, even when the backing model declares a method with the same name, because PHP runs the resource's method. Here the `Invoice` model declares `total(): string`, which formats the amount:

```php
'total' => $this->total(),                     // total: number
'formatted_total' => $this->resource->total(), // formatted_total: string

public function total(): mixed
{
    return (float) $this->resource->total;
}
```

`$this->resource->total()` calls the model's method directly, so it publishes the model's type. When neither the resource method's declaration nor its body types the call, the key publishes `unknown`, never the model method's type. Give the method a return type to fix it. The same holds for a `$resource` redeclared as a class other than a model, such as `/** @var CartTotals */ public $resource;`. If `CartTotals` doesn't declare the method you call, the key publishes `unknown`, because Laravel throws there.

Some of Laravel's own methods declare loose types, so the package reads the model instead. `getKey()` publishes the model's key type, `number` or `string`, and `modelKeys()` publishes a list of it. That's why `comment_ids` above is `number[]`. `resolveRouteBinding()` publishes the model you call it on, or `null`, so `$this->author?->resolveRouteBinding($this->user_id)` publishes `User | null`.

`getKey()` publishes the key type on any model the package can name, including one a variable holds, such as a `whenLoaded()` closure parameter, a `map()` element, or a helper's `Post $post` parameter. So `$this->comments->map(fn ($comment) => $comment->getKey())` publishes `number[]`.

A model that no database row backs yet has no key, so its `getKey()` adds `| null`. That covers a model you build with `new`, `replicate()`, `replicateQuietly()` or `newInstance()`, and one that a query, a relation or a factory builds without saving it:

```php
'draft_id' => Post::make(['title' => 'Draft'])->getKey(),       // number | null
'found_id' => Post::firstOrNew(['title' => 'Draft'])->getKey(), // number | null
'reply_id' => $this->resource->comments()->make()->getKey(),    // number | null
'fake_user_id' => User::factory()->make()->getKey(),            // number | null
'created_id' => Post::create(['title' => 'Draft'])->getKey(),   // number
```

A call that returns the same model, such as `(new Post)->fill([...])`, keeps the `| null`. A helper's `Post $post` parameter adds it only where the call passes a model no row backs yet. The package doesn't follow `save()`, so a model you save after `new` still publishes `number | null`. On a model whose `$primaryKey` is `null`, `getKey()` publishes `null`.

On an abstract model, `getKey()` publishes the key type the class declares, through `$keyType`, `HasUuids`, `HasUlids` or Laravel 13's `#[Table]`, joined with the key type of each published model that extends it. So a base whose subclasses key by integer and by UUID publishes `number | string`. When the abstract model works its key out in code, such as in an overridden `getKeyType()`, `getKey()` publishes `unknown`.

`getAuthIdentifier()` on an authenticatable model publishes the type of the column the model identifies users by. That's the key type, or the type of the column a literal `getAuthIdentifierName()` returns, so a model whose `getAuthIdentifierName()` returns `'email'` publishes `string`. A model no row backs yet adds `| null`, and a model that overrides `getAuthIdentifier()` publishes the return type it declares.

A method that returns a plain PHP `DateTime` or `DateTimeImmutable` publishes `{ date: string; timezone_type: number; timezone: string }`, the object `json_encode()` writes for it. A Carbon date publishes `string`, or `Date` under `timestamps_as_date`, and so do the `now()` and `today()` helpers, which return one. A `DateTimeInterface` can hold either kind, so it publishes the Carbon date's type or that object, and a `CarbonPeriod` publishes a list of the Carbon date's type. A `CarbonInterval` publishes the `DateInterval` fields `json_encode()` writes for it, such as `y`, `m`, `d` and `days`. `str($value)` publishes `string`, and `str()` with no argument publishes `Record<string, never>`. `url($path)` publishes `string` when the path can't be `null`, and `unknown` when it can or has no type.

A value built in place publishes what `json_encode()` writes for it as well, so `new DateTime()` publishes that date object and `new RuntimeException('x')` publishes `Record<string, never>`. `new Collection($items)` publishes as `collect($items)` does. These values stay `unknown` when built in place:

- An `Arrayable` or a `Responsable`
- An Inertia `ProvidesInertiaProperty` class
- A model
- A class with no public property and no `__toString()`, such as `stdClass`

Type such a key with [`#[TsCasts]`](#overriding-property-types-with-tscasts).

A method that returns the base `Model` class, `Illuminate\Foundation\Auth\User`, an abstract model, or a model that isn't published, such as one in `models.excluded`, publishes `unknown`, because no published file has a type for it. Declare the concrete model as the return type, such as `: Order`, to type the value.

##### Methods Declared as a Bare `array`

A method declared `: array` with no `@return` docblock says nothing about its keys. For these methods, the array the body returns sets the type:

```php
final class PriceQuoteService
{
    public const int TIER_BASIC = 1;

    public const int TIER_PRO = 2;

    public function quote(): array
    {
        return ['unit' => '1.00', 'minimum' => 10, 'discounted' => ['unit' => '0.90']];
    }

    public static function tierLabels(): array
    {
        return [self::TIER_BASIC => 'Basic', self::TIER_PRO => 'Pro'];
    }
}

// in toArray():
'quote' => resolve(PriceQuoteService::class)->quote(),
'tiers' => PriceQuoteService::tierLabels(),
```

Both properties publish the returned array as the resource sends it:

```typescript
export interface QuoteResource {
  quote: { unit: string; minimum: number; discounted: { unit: string } };
  tiers: string[];
}
```

Integer keys, written literally or as a constant such as `self::TIER_BASIC`, publish as Laravel sends them. A resource sends an array whose keys are all numeric as a list, so `tiers` publishes `string[]`. A numeric key beside a named key stays, as in `{ name: string; "42": boolean }`, and a resource with `$preserveKeys`, or `#[PreserveKeys]` on Laravel 13, keeps every key.

Outside a resource, such as in an Inertia page prop, `tiers` publishes `{ "1": string; "2": string }`, because JSON encodes such an array as an object. In a resource, `collect([...])` keeps its keys as the value of a top-level key, so `'codes' => collect([200 => 'OK', 404 => 'Not Found'])` publishes `{ "200": string; "404": string }`.

A `?array` declaration keeps its `null`, so the method publishes the shape `| null`. An `array|false` declaration keeps its `false` the same way.

What the body reads from the method's parameters is typed too, whether you use its result as a value or spread it. Each parameter holds its declared type, from the signature, or from a `@param` tag when the signature's type is missing or vague, such as `array`. A parameter with no type, or only `mixed`, holds what each call passes. A closure you pass is the exception: in `$this->hold(fn () => 5)`, the parameter holds `unknown`, because a resource sends a closure as `{}`. A first-class callable that Laravel calls gets the value Laravel calls it with, as in `whenLoaded()`:

```php
'card' => $this->card($this->resource),                              // card: { id: number; title: string }
'author_card' => $this->authorCard($this->author),                    // author_card: { name: string }
'loaded_card' => $this->whenLoaded('author', $this->authorCard(...)), // loaded_card?: { name: string }

private function card(Post $post): array
{
    return ['id' => $post->id, 'title' => $post->title];
}

private function authorCard($author): array
{
    return ['name' => $author->name];
}
```

When the method can return something other than an array literal, apart from a `null`, boolean, string, or number literal its declaration allows, the package reads each `return` as a value instead, as [Method Return Types](#method-return-types) describes. So a method that returns a collection pipeline publishes its list:

```php
'contents' => $this->contents(), // contents: string[]

private function contents(): array
{
    return $this->comments->map(fn ($comment) => $comment->content)->values()->all();
}
```

If one `return` can't be typed, or the method yields, the property publishes `unknown`.

When you use the method's result as a value, a value in the array that is an enum or a model publishes `unknown`, because a method body can't supply the import it needs. The rest of the shape keeps its types. Spreading the same method keeps an enum's type. To type that value, build the array in `toArray()` itself, or override the property with [`#[TsCasts]`](#overriding-property-types-with-tscasts) and a type your frontend exports, as in `['type' => 'StatusPayload', 'import' => '@/types/payloads']`. An entry imports only a type it names whole, so a type named inside a shape you write in the entry isn't imported.

A model's own `toArray()`, called as a value, publishes `Record<string, unknown>`, because the relations it includes depend on what's loaded at runtime. A relation's collection, as in `$this->comments->toArray()`, publishes `Record<string, unknown>[]`. To publish the model's keys, spread it instead, as [Model `toArray()` Spread](#model-toarray-spread) shows.

An `only()` or `except()` call names no class, so its result keeps its shape:

- A literal key list publishes its inline shape, with any enum- or model-typed member left `unknown`.
- A runtime key list publishes `Record<string, unknown>`.
- A to-many relation publishes `unknown[]`.

The same applies when the method reads an accessor whose getter calls `only()` or `except()`. A model that overrides `only()` or `except()` with a declared return type publishes that type instead. A model return, such as `: static`, becomes an object with the model's columns and appended accessors, narrowed to the literal keys. An enum or other class return leaves the value `unknown`.

This `Comment` method shows each case:

```php
// On Comment, read from a resource as 'summary' => $this->relationSummary()
public function relationSummary(): array
{
    return [
        'id' => $this->id,
        'author' => $this->user->only(['id', 'name']),
        'author_role' => $this->user?->only(['id', 'role']),
        'replies' => $this->replies->only([1, 2]),
    ];
}
```

The `role` column is an enum, so it's left `unknown`, and the to-many `replies` publishes `unknown[]`:

```typescript
summary: { id: number; author: { id: number; name: string }; author_role: { id: number; role: unknown } | null; replies: unknown[] };
```

##### Resource Macros

Laravel runs a macro you register on `JsonResource` before it forwards a call to the model, so a call the macro answers publishes what the macro returns, never the type of a model method with the same name:

```php
// In a service provider's boot() method
JsonResource::macro('label', function (): string {
    return strtoupper($this->resource->title);
});

// In a Post resource, where the Post model declares label(): int
'label' => $this->label(),                 // label: string
'model_label' => $this->resource->label(), // model_label: number
```

`$this->resource->label()` calls the model directly, so it keeps the model's type. `$this?->label()`, `static::label()`, `self::label()` and `$this::label()` reach the macro, as `$this->label()` does. A method the resource declares or inherits, such as `whenLoaded()`, runs before any macro with its name, so a macro never changes it.

The package types a macro from its native return type, then its `@return` docblock, then its body. It reads the body without the values the call passes, so a body whose result depends on its arguments publishes `unknown`. It doesn't read the body of a closure declared outside a class method, such as in `bootstrap/app.php`. To type such a macro, give the closure a return type. A `@return` docblock works only on a closure declared inside a class, such as in a service provider's `boot()` method.

The package sees the macros your app registers while it boots. It doesn't see a macro registered later, or by a deferred service provider, so a call to that macro publishes as if the macro didn't exist.

Registering, removing, or re-pointing a macro makes the next `ts:publish` rebuild every class instead of reusing the [generation cache](https://tolki.abe.dev/ts/generating-cache.html).

#### Local Variables and Narrowing

A variable you assign once keeps the type of its value, so you don't need to inline the expression. Assign it in a statement at the top level of the method or of a closure body:

```php
public function toArray(Request $request): array
{
    $slug = $this->slug;

    return [
        'slug' => $slug, // string, as if you returned $this->slug
    ];
}
```

A conditional value keeps its `?` through the variable, and through a `??` or a ternary. With `$loaded = $this->whenLoaded('author')`, `'author' => $loaded ?? 'none'` publishes `author?: User | string`: a missing value isn't `null`, so `??` returns it, and Laravel drops the key.

A closure or arrow-function parameter with the same name doesn't affect the outer variable. Inside its own closure, the parameter holds its own value:

```php
public function toArray(Request $request): array
{
    $member = $this->slug;

    return [
        'outer_member' => $member, // string
        'mapped_members' => $this->members->map(fn ($member) => $member), // User[], since this $member is the map's element
    ];
}
```

A closure that captures the variable by value, with `use ($member)`, and reassigns it doesn't change the outer variable either. Only `use (&$member)` does. An arrow function never does.

A variable you write more than once publishes `unknown`, because the package can't tell which value reaches the response. That includes a second assignment inside an `if` or a loop, a `foreach` that assigns it, a `catch`, `unset()`, `static` or `global`, and changes through `.=`, `++`, or a reference. It also includes passing the variable to a by-reference parameter, such as `preg_match()`'s `$matches`, `settype()`, `parse_str()`, or one of your own methods. A variable assigned only inside an `if`, a loop, or another block also publishes `unknown`. Variables assigned inside a closure body follow the same rules within that closure. A reassignment inside an `if` branch that ends in `return` or `throw` applies only inside that branch, so the code after it keeps reading the original variable.

A by-reference built-in that keeps the value's form keeps its type:

- `ksort()` keeps any array. With flags that compare keys as strings, such as `SORT_STRING`, it keeps only an array that publishes as an object.
- `uksort()`, `krsort()`, `asort()`, `arsort()`, `uasort()`, `natsort()` and `natcasesort()` keep only an array that publishes as an object, such as `{ b: number; a: number }`.
- `sort()`, `rsort()`, `usort()` and `shuffle()` keep a list, such as `string[]`. They re-index an array that publishes as an object, so such a variable publishes `unknown`.
- `array_pop()` and `array_shift()` keep a list. On an array that publishes as an object the variable publishes `unknown`, because a key the shape requires may be gone.
- `array_push()`, `array_unshift()` and `array_splice()` keep a list when each value you add fits its element type.
- The `$count` argument of `str_replace()`, `str_ireplace()`, `preg_replace()` and `preg_replace_callback()` keeps `number`.
- `array_walk()` and a `foreach` by reference keep the type when each write in the callback or the loop fits the element's type. `array_walk_recursive()` keeps a nested array's type when each write fits the leaves it visits.

A key-keeping sort on a list reorders its keys, so what it publishes depends on where the value goes. In an API resource it still publishes the list, because Laravel re-indexes the result. In Inertia props and other places that send the value as-is, it publishes `Record<number, T>`.

In an `array_walk()` callback, a compound write counts as the operation it performs: `.=` writes a string, and `+=`, `-=`, `*=`, `/=`, `%=`, `**=` and `++` write a number. The callback sees only its own parameters and its `use` imports. An arrow function also sees the outer scope.

A copy taken before the call keeps the type the variable had, and a copy taken after it reads what the call left:

```php
$copy = $original;
sort($original); // $copy keeps the type $original had before the sort
```

A call on one of a local's keys, such as `sort($groups['x'])`, keeps the local's type when it keeps that key's form.

These rules cover a variable you read as a value. For a variable that `toArray()` returns, the package follows each write instead, as [Building the Array in a Variable](#building-the-array-in-a-variable) describes.

To type a variable the package can't read, annotate its assignment. See [Typing a Variable With `@var`](#typing-a-variable-with-var).

##### Narrowing With `instanceof`

An early-exit `instanceof` guard narrows a variable for every statement after it. Here `attachable` is a `morphTo`, so `$parent` can hold several models until the guard proves it holds a `Post`:

```php
$record = $this->attachable;

return [
    'parent' => $this->whenLoaded('attachable', function () {
        $parent = $this->attachable;

        if (! $parent || ! $parent instanceof Post) {
            return null;
        }

        return [
            'title' => $parent->title,
            'class' => $parent::className(),
            'morph' => $parent->getMorphClass(),
        ];
    }),
    'record_title' => $record instanceof Post ? $record->title : null,
];
```

In both properties, the reads resolve against `Post`:

```typescript
export interface AttachmentResource {
  parent?: { title: string; class: string; morph: string } | null;
  record_title: string | null;
}
```

A guard narrows a variable only when all of these hold:

- The `if` sits at the top level of the method or closure body.
- The `if` has no `else` or `elseif`, and its body ends with `return` or `throw`.
- The condition is a negated test such as `! $parent instanceof Post`, alone or in an `||` chain. A chain joined with `&&` narrows nothing.
- The test reads a local variable or a closure parameter, not a property such as `$this->author`.
- Nothing writes the variable after the guard. A write before the guard doesn't matter, since the guard tests the value it leaves.

The guard narrows only the reads after it. A read in the guard's own body, or in a `return` placed before the guard, still sees every class the variable can hold. A positive test, such as `if ($parent instanceof Post) { ... }`, narrows nothing, not even inside its own body.

Narrowing applies to reads through the variable, such as `$parent->title`. The variable's own value, as in `'parent' => $parent`, keeps its full union type.

An `instanceof` ternary on a variable narrows its true arm the same way, as `record_title` above shows, and so does an `||` chain of tests on that variable. A negated test, such as `! $post instanceof Post ? null : $post->title`, narrows the false arm instead.

A ternary that tests `$this->resource` against one model narrows the backing model for its proven arm, so a relation that only a subclass declares resolves there. On a `Team` resource, `$this->resource instanceof SubscribedTeam ? $this->resource->subscriber?->name : null` publishes `string | null`.

A variable assigned from an `instanceof` ternary keeps the narrowing for every read through it. The test can be an `||` chain of `instanceof` checks. Here `imageable` is a `morphTo` whose possible models include one with a string key:

```php
$either = $this->imageable instanceof Post || $this->imageable instanceof User ? $this->imageable : null;

return [
    'either_id' => $either?->getKey(),          // number | null
    'open_id' => $this->imageable?->getKey(),   // number | string | null
];
```

The same holds when the proven arm reads through the tested variable or `$this->resource`:

```php
$subscriber = $this->resource instanceof SubscribedTeam ? $this->resource->subscriber : null;

return [
    'subscriber_name' => $subscriber?->name, // string | null
];
```

These forms don't narrow:

- **The ternary's own value**: `'either' => $either` publishes the whole union. Only reads through the variable narrow.
- **A read inside the arm when the test is on a property**: `$this->imageable instanceof Post ? $this->imageable->getKey() : null` stays `number | string | null`. Assign the ternary to a variable, and read through that variable instead.
- **A test on a different spelling of the arm's value**: a variable bound to a ternary that tests `$this->resource->imageable` against a `$this->imageable` arm isn't narrowed.
- **Mixed conditions**: a test joined with `&&`, or an `||` chain that mixes negated and plain tests.
- **The arm the test doesn't prove**: `$this->resource instanceof SubscribedTeam ? null : $this->resource->subscriber` publishes `unknown`, since `Team` has no `subscriber` relation.

##### Typing a Variable With `@var`

When the package can't type a variable's value, an inline `@var` on its assignment types it. This resource wraps a `CartTotals` value object instead of a model:

```php
/** @var CartTotals $totals */
$totals = $this->resource;

return [
    'subtotal' => $totals->subtotal, // number, from CartTotals' declared property
    'totals' => $totals,             // { subtotal: number; chargeable: boolean; count: number; hasExtras: boolean }
];
```

It also restores a value the package would otherwise drop. Without the annotation, `$picked` below publishes `null`, because the package leaves out a ternary arm it can't type:

```php
/** @var string|null $picked */
$picked = $this->id > 0 ? json_decode('"x"') : null; // string | null
```

The annotation follows these rules:

- **Placement**: it sits on a `$x = ...;` statement at the top level of the method or closure body. It names the variable, as in `/** @var CartTotals $totals */`, or names none, as in `/** @var CartTotals */`.
- **Span**: it types the reads after that statement, up to the next statement that writes the variable. A loop that writes the variable ends the span where the loop starts. So an annotation also types a variable you reassign, until its next write.
- **Precedence**: it applies only where the package's own reading of the value is `unknown`, or is only the `null` left after an arm it can't type was dropped. Any other reading stands, whatever the annotation says: `/** @var int $n */ $n = $this->title;` still publishes `string`. To override a type the package got wrong, use [`#[TsCasts]`](#overriding-property-types-with-tscasts).

A conditional value stays optional, so `/** @var User $reviewer */ $reviewer = $this->whenLoaded('reviewer');` publishes `reviewer?: User`.

A closure parameter you reassign reads the new value from that statement on, when the value or an annotation names its class. In `function (User $author)`, `$author = $author->profile;` makes the reads after it use `Profile`. The package can't tell which class `$author->comments->find(1)` returns, so after `$author = $author->comments->find(1);` the reads keep using `User` until you annotate the assignment with `/** @var Comment $author */`. A `foreach` variable bound to a model keeps reading that model.

The annotation's type counts only when it's built from these forms, and when every part of it resolves:

- Scalars: `int`, `string`, `bool`, `float`, `null`, `true`, and `false`
- A class, interface, or enum that the file imports or writes in full
- `list<X>`, `array<int, X>`, `array<string, X>`, and `array<'a'|'b', X>`
- `array{...}` and `object{...}` shapes with plain or quoted keys, and `list{...}` tuples
- `Collection<K, X>`, for both Laravel's support collection and its Eloquent collection
- A `callable` as a shape's member, which publishes `unknown`
- Unions of these forms, such as `Comment|User|null` or `list<User>|User`, and `?` before any form

Any other type is ignored, so write `list<int>` instead of `int[]`. A model or enum inside a shape is ignored too. A `?` before a shape adds `| null` even when a member already holds `null`, so `?array{a: ?int}` publishes `{ a: number | null } | null`.

#### Collection Pipelines

A chain of collection methods keeps its element type to the end, whether it starts at a relation or at `collect()`:

```php
return [
    'comment_ids' => $this->comments->map(fn ($comment) => $comment->id)->values()->all(),
    'title_words' => collect(explode(' ', $this->title))->map(fn ($word) => ['word' => $word])->values()->all(),
    'author_name' => data_get($this->author, 'name'),
    'author_name_or_guest' => data_get($this->author, 'name', 'guest'),
    'doubled' => $this->comments->concat($this->comments)->values(),
];
```

Each chain publishes its element type:

```typescript
export interface PostResource {
  comment_ids: number[];
  title_words: { word: string }[];
  author_name: string | null;
  author_name_or_guest: string | null;
  doubled: Comment[];
  // …
}
```

These helpers and methods publish as follows:

- **`all()` and `values()`**: a collection and the array behind it both publish `X[]`, so `all()` changes nothing. A method that breaks sequential keys, such as `filter()`, `sortBy()`, or `keyBy()`, adds a `Record<string, X>` arm, because `json_encode()` writes such a collection as an object. `values()` restores sequential keys and removes that arm.
- **`collect()`**: the element type comes from the argument, and the `map()` parameter holds that element, which is why `$word` above is a `string`. On its own, `collect([...])` publishes the list or object its array encodes as, such as `number[]` for `collect([1, 2])` or `{ title: string }` for `collect(['title' => $this->title])`. `collect()` with no argument publishes `never[]`. A bare array literal publishes the same way, so `['a', 'b']` publishes `string[]`. A list holding an element the package can't type publishes `unknown[]`.
- **`data_get()`**: `data_get($target, 'a.b')` publishes what `$target?->a?->b` would. A default joins the type instead of removing `null`, because `data_get()` returns the default only when the key is missing, not when its value is `null`.
- **Typed `map()` parameters**: a model type hint on a `map()` parameter types every read through it, chained and nullsafe reads included, when you call `map()` on a variable such as a local or a `whenLoaded()` parameter. With `$rows = $this->resource->getRelation('comments')`, `$rows->map(fn (Comment $comment) => $comment->user?->name ?: null)->all()` publishes `(string | null)[]`. A relation chain such as `$this->comments->map(...)` uses the relation's model the same way. On a `collect(...)` root, or on a `map()` called straight on a method's result, such as `$this->resource->getRelation('comments')->map(...)`, the parameter holds no model, so reads through it publish `unknown`.

`concat($other)` keeps the type only when `$other` is exactly the same collection type. Concatenating `Comment[]` and `Tag[]` publishes `unknown`, since the result is a different collection, not a longer one. A `data_get()` key with a `*` segment also publishes `unknown`.

A chain can start at `$this->resource` too. `$this->resource->comments->map(fn ($comment) => $comment->id)` publishes `number[]`, as `$this->comments->map(...)` does. A `?->` on `$this->resource` adds `| null` once, since a resource can wrap `null`. `$this->resource?->comments->map(fn ($comment) => $comment->id)` publishes `number[] | null`.

`first()`, `last()` and `firstWhere()` on a relation's collection return one of its models or `null`, so a read through them with `?->` is typed. `$this->comments->first()?->content` publishes `string | null`, and so does the same read after `last()` or `firstWhere('is_flagged', true)`. After a `first()` or `last()` call that passes a default, such as `first(null, 'none')`, the read publishes `unknown`, because Laravel returns that default when no model matches.

### Spreads and Inheritance

A resource can build its array from its parent class, its traits, and its own helper methods. Each one adds its properties to the interface.

#### Parent `toArray()` Spread

Extend a parent resource with `...parent::toArray($request)`. The parent's properties come first, and the child can override any key:

```php
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => EnumResource::make($this->status),
        ];
    }
}

class ApiPostResource extends PostResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'status' => $this->status, // overrides the parent's EnumResource type
        ];
    }
}
```

`ApiPostResource` gets `id`, `title`, and `status` from `PostResource`, and its own `status` replaces the `EnumResource` type with the plain enum.

When the parent is `JsonResource` itself, the spread publishes the model's properties. See [JsonResource Base Delegation](#jsonresource-base-delegation).

Both spellings work: `...parent::toArray($request)` inside an array literal, and a bare `return parent::toArray($request);`. A child that declares no `toArray()` at all inherits the parent's. See [Inheriting a Parent `toArray()`](#inheriting-a-parent-toarray).

#### Inheriting a Parent `toArray()`

A resource that extends another resource and declares no `toArray()` of its own publishes its parent's shape:

```php
/**
 * @mixin Order
 */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => EnumResource::make($this->status),
        ];
    }
}

// No toArray() and no @mixin: both come from OrderResource
class BodylessOrderResource extends OrderResource {}
```

The child publishes the parent's properties:

```typescript
export interface BodylessOrderResource {
  id: number;
  status: AsEnum<typeof OrderStatus>;
}
```

The nearest class up the parent chain that declares a `toArray()` provides the shape, so inheritance several levels deep works. The backing model comes from the parent chain too: a resource with no `@mixin` or `@extends` tag of its own uses the nearest ancestor's, as step 3 of [How the Backing Model Is Resolved](#how-the-backing-model-is-resolved) describes. That keeps the inherited properties typed from their columns.

If no class in the chain declares a `toArray()`, the resource publishes the model's properties, as [JsonResource Base Delegation](#jsonresource-base-delegation) describes. With no model either, the interface is empty, apart from any types `#[TsExtends]` adds. A `ResourceCollection` subclass with no `toArray()` still finds its element type as [Resource Collections](#resource-collections) describes.

#### A `toArray()` From a Trait

A `toArray()` that a trait supplies is the resource's own method, as it is in PHP. The package reads the trait's method body, wherever the trait is declared:

```php
trait ShapesPayload
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'shaped_by' => 'trait',
        ];
    }
}

/**
 * @mixin Label
 */
class LabelResource extends JsonResource
{
    use ShapesPayload;
}
```

The resource publishes the keys the trait's `toArray()` returns:

```typescript
export interface LabelResource {
  id: number;
  name: string;
  shaped_by: string;
}
```

A subclass of `LabelResource` with no `toArray()` of its own publishes the same keys. A `ResourceCollection` can take its `toArray()` from a trait the same way.

#### JsonResource Base Delegation

A resource with no `toArray()`, or whose `toArray()` returns `parent::toArray($request)`, publishes the backing model's columns, its appended accessors, and its relations, each relation an optional key. These follow the keys Laravel's `Model::toArray()` writes, with the differences below. A subclass of Laravel's `JsonApiResource` is the exception: it publishes the resource object it sends, as [JSON:API Resources](#jsonapi-resources) describes. This resource has no `toArray()`:

```php
/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    // No toArray(): the properties come from the User model
}
```

The interface lists the model's columns and appended accessors, then its relations:

```typescript
export interface UserResource {
  id: number;
  name: string;
  email: string;
  password: string;
  // … the other columns
  profile?: Profile | null;
  posts?: Post[];
  owned_teams?: Team[];
}
```

Each kind of property follows its own rule:

- **Columns**: every column, typed from its database type and cast.
- **Accessors**: only the accessors the model lists in `$appends`. An accessor it doesn't append never reaches the response, so it isn't published.
- **Relations**: each relation is optional, because Laravel writes it only once it's loaded. Its key follows the model's `$snakeAttributes` setting, snake_case by default, so `ownedTeams()` publishes `owned_teams`. The [`models.relationship_case`](https://tolki.abe.dev/ts/casing-configuration.html#models-relationship-case) setting doesn't apply here. The package leaves out a relation to a model it doesn't publish, and a `morphTo` it can't type.
- **A key a relation shares with a column**: a loaded relation replaces the column's value, so the key is required, and its type is the union of both.

`$hidden` and `$visible` follow the `models.exclude_hidden` setting, as [`exclude_hidden` and Attribute Filters](#exclude_hidden-and-attribute-filters) describes. With it off, the default, `$hidden` columns such as `password` still publish, and `$visible` is ignored. With it on, the resource follows Laravel's rule. When `$visible` lists anything, only those keys stay, and then anything `$hidden` lists drops out. In both lists, Laravel matches a relation by its method name, such as `ownedTeams`, not by its `owned_teams` key.

The package reads your model's class, not a request. A change you make for one request, such as `makeHidden()`, `makeVisible()`, `setAppends()`, or a `select()` that loads fewer columns, doesn't reach the interface.

A delegated resource doesn't always match the model's own interface. A key that a relation shares with a column has both types here, and a relation you mark `#[TsExclude]` still publishes here, though the model's interface leaves it out.

You can also spread the base properties and add your own keys:

```php
/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'full_name' => strtoupper($this->name),
        ];
    }
}
```

A variable that starts from `parent::toArray($request)` works the same way. See [Building the Array in a Variable](#building-the-array-in-a-variable).

[How the Backing Model Is Resolved](#how-the-backing-model-is-resolved) describes how the package finds the model. When no model resolves, the resource publishes an empty interface.

#### Trait Method Spread

Spread a trait method's return into `toArray()` with `...$this->method()`. Its body publishes the same types it would in `toArray()`, and its `@return array{...}` docblock types the keys the body can't:

```php
trait IncludesMorphValue
{
    /**
     * @return array{morphValue: string}
     */
    protected function includeMorphValue(): array
    {
        return ['morphValue' => $this->resource->getMorphClass()];
    }
}

class PostResource extends JsonResource
{
    use IncludesMorphValue;

    public function toArray(Request $request): array
    {
        return [
            ...$this->includeMorphValue(),
            'id' => $this->id,
            'title' => $this->title,
        ];
    }
}
```

The trait's keys come first:

```typescript
export interface PostResource {
  morphValue: string;
  id: number;
  title: string;
}
```

Multi-line `@return` shapes work too:

```php
/**
 * @return array{
 *     firstName: string,
 *     lastName: string,
 *     isActive: bool,
 * }
 */
protected function includeProfile(): array
{
    // ...
}
```

You can also put `#[TsCasts]` on the trait method, with the same syntax as on a resource class. It overrides types, marks keys optional, adds imports, and appends keys the method doesn't return:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

trait IncludesExtras
{
    #[TsCasts([
        'location' => ['type' => 'GeoPoint', 'import' => '@/types/geo'],
        'flag' => ['type' => 'string | null', 'optional' => true],
        'extra' => 'Record<string, unknown>',
    ])]
    protected function includeCastedExtras(): array
    {
        return [
            'location' => strtoupper('x'),
            'flag' => strtolower('y'),
        ];
    }
}
```

A key the body can't type, and that neither the `@return` docblock nor `#[TsCasts]` covers, publishes `unknown`.

Trait spreads carry through inheritance. When a parent resource spreads a trait method and a child spreads `...parent::toArray($request)`, the child gets the keys the trait contributed.

#### Bare Method-Call Return

`toArray()` can return a method call directly, instead of spreading it into an array:

```php
public function toArray(Request $request): array
{
    return $this->data(); // the same as return [...$this->data()];
}
```

A chain of several calls works too, as long as it ends at an array literal, or at an `only()` or `except()` filter as described in [Attribute Filters](#attribute-filters-only--except):

```php
class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $this->data();
    }

    protected function data(): array
    {
        return $this->nested();
    }

    protected function nested(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
        ];
    }
}
```

The resource publishes the innermost array:

```typescript
export interface TeamResource {
  id: number;
  slug: string;
}
```

The chain can pass through trait and parent methods, as a `...$this->method()` spread can. See [Trait Method Spread](#trait-method-spread).

#### Building the Array in a Variable

`toArray()` can build its array in a variable and return it. The package follows each write to the variable, and a key written on only some paths publishes optional:

```php
public function toArray(Request $request): array
{
    $data = [
        'id' => $this->id,
        'name' => $this->name,
    ];

    if ($request->boolean('with_slug')) {
        $data['slug'] = $this->slug;
    }

    $data['posts_count'] = $this->whenCounted('posts');

    return $data;
}
```

The variable's keys become the interface:

```typescript
export interface TagResource {
  id: number;
  name: string;
  slug?: string;
  posts_count?: number;
}
```

The variable can start from an array literal, as above, or from any of these:

- `parent::toArray($request)`, which on a `JsonResource` parent holds the model's properties, as [JsonResource Base Delegation](#jsonresource-base-delegation) describes
- `parent::with($request)`, which holds the keys of the resource's `$with` property
- `$this->only([...])` with a literal list of keys
- `array_merge()` of array literals and `parent::toArray($request)` calls
- A helper method on the resource that returns an array

A spread of `...$this->with($request)` or `...parent::with($request)` in `toArray()` adds the `$with` keys too.

These rules decide each key:

- **A write inside a block**: a key first written inside an `if`, a loop, a `try` or `catch` block, or a `switch` case publishes optional, because that path may not run.
- **A key written more than once**: the key takes the type of its last write. `+=` adds only the keys the array doesn't have yet, and assigning a whole new array drops the keys written before it.
- **An `unset()`**: `unset($data['slug'])` removes the key. Inside a block, it makes the key optional instead.
- **Other `return` statements**: the variable counts as one branch beside the method's other returns, so a `return []` guard, or a returned array literal that leaves a key out, makes that key optional.

The package doesn't follow `$data[] = ...`, a key computed at runtime such as `$data[$key]`, or a nested key such as `$data['meta']['label']`, whether written or passed to `unset()`. It also reads the method in one pass. A key written after an early `return $data;` publishes required when that write always runs, though the early return sends the array without it. In either case, return an array literal on each path, or list the keys with [`#[TsCasts]`](#overriding-property-types-with-tscasts), which can also mark a key optional.

`+` publishes PHP's array union, where the left side's keys win and the right side adds the keys it lacks. That holds in a key's value, so `['code' => 'in'] + ['code' => 0, 'lane' => 2]` publishes `{ code: string; lane: number }`, and in a whole return, such as `return parent::toArray($request) + ['note' => 'none'];`.

#### Return Branches and `@return` Shapes

Every `return` in a spread method counts, not only the first. A branch that returns `[]` leaves its keys out, so the keys the other branches return become optional. The method's own `@return` types what its body can't:

```php
trait GathersPermissions
{
    /**
     * @return array{permissions?: array<string, bool>, links?: array{self: string, related: array<string, array{name: string}>}}
     */
    public function gatherPermissions(): array
    {
        if (! $this->resource instanceof Model) {
            return [];
        }

        return ['permissions' => $this->opaque(), 'links' => $this->opaque()];
    }

    /** @return array<string, string> */
    public function gatherLabels(): array
    {
        $data = [];
        $data['main_label'] = $this->opaque();

        if ($this->resource->exists) {
            $data['extra_label'] = $this->opaque();
        }

        return $data;
    }

    /** Untyped, so only the docblocks above can type what it returns. */
    protected function opaque()
    {
        return $this->resource->getAttribute('title');
    }
}
```

A resource that spreads both methods publishes:

```typescript
export interface PostPermissionsResource {
  permissions?: Record<string, boolean>;
  links?: { self: string; related: Record<string, { name: string }> };
  main_label: string;
  extra_label?: string;
  // …
}
```

Both forms of `@return` count:

- **An `array{...}` shape**: each key gets its own type, and a key written `key?:` also becomes optional. A string or number literal type, such as `'draft'|'live'` or `1|2|3`, publishes as written.
- **`array<string, V>`**: `V` types every key the body left `unknown`.

`toArray()`'s own `@return array{...}` fills keys the same way.

The body always wins. The docblock fills only a key the body left `unknown`, or an [interpolated key's](#interpolated-keys) value that the body left `unknown | undefined`, so a stale `@return` can't overwrite a type the package already knows.

A shape value that names a PHP class or enum is skipped, because a docblock can't carry its import. Type that key with `#[TsCasts]` and an `import` instead. A name that isn't a PHP class, such as a type you declare only in TypeScript, publishes as written in a spread method's `@return`. In `toArray()`'s own `@return`, the key stays `unknown`, so type it with `#[TsCasts]`.

In a spread method, the branches count only while every `return` is an array literal, `[]`, or a variable the method builds. Otherwise, only the spread method's first `return` counts.

#### Interpolated Keys

A key built from literal text around a variable can't become a fixed property name, because it changes on each pass of the loop. Both the interpolated and the concatenated spelling publish a template-literal index signature. These methods belong to the same resource as the ones above:

```php
/** @return array<string, string> */
public function gatherChannelLabels(): array
{
    $data = ['primary_label' => 'Primary'];

    foreach (['email', 'sms'] as $name) {
        $data["{$name}_label"] = 'Channel';
    }

    return $data;
}

/** @return array<string, string> */
public function gatherRegionLabels(): array
{
    $data = [];

    foreach (['east', 'west'] as $name) {
        $data[$name.'_region'] = 'Region';
    }

    return $data;
}
```

Each loop key becomes an index signature:

```typescript
export interface PostPermissionsResource {
  primary_label: string;
  [key: `${string}_label`]: string | undefined;
  [key: `${string}_region`]: string | undefined;
  // …
}
```

The value type carries `| undefined` instead of the signature carrying a `?`, because `[key: T]?:` isn't valid TypeScript, and a key that matches the pattern may be absent.

When the body can't type the value, the method's `@return array<string, V>` does, as it does for a named key. A third method on the same resource, `gatherOpaqueTags()`, declares `@return array<string, string>` and assigns `$data["{$name}_tag"] = $this->opaque()`:

```typescript
[key: `${string}_tag`]: string | undefined;
```

The key doesn't need a loop. A key written straight into the returned array, into an array a merge adds, or into a nested array publishes a signature too. In a nested array, the signature becomes part of that property's object type:

```php
return [
    'tag_'.$this->id => true,
    'box' => ["{$this->id}_inner" => 5, 'x' => 1],
];
```

Both keys become signatures:

```typescript
export interface TagBoxResource {
  [key: `tag_${string}`]: boolean | undefined;
  box: { [key: `${string}_inner`]: number | undefined; x: number };
}
```

A backslash in the literal text is doubled, because TypeScript reads a single one as an escape. `$data["{$name}\\unit"]`, whose keys end in `\unit`, publishes ``[key: `${string}\\unit`]``.

A literal key whose text reads as an index signature, such as `'[key: string]'`, is left out, and `ts:publish` warns. Printed as written, it would type every other key, so rename it.

To retype a signature with `#[TsCasts]`, use its published name as the key. Write it in single quotes, because PHP reads `${string}` inside double quotes as a variable. You can paste the name straight from the published file. PHP reads each `\\` in single quotes as one backslash, but the entry still finds its signature.

A pasted key that could name two signatures retypes neither, and `ts:publish` warns. Write each one exactly instead, such as ``'[key: `${string}\\\\unit`]'`` for ``[key: `${string}\\unit`]``. On a resource, the entry still adds its key as a new property, like any entry for a key `toArray()` doesn't return.

TypeScript checks an index signature against every named key its pattern matches, and against every signature whose pattern contains its own. So each named key the pattern matches, `#[TsCasts]` keys included, joins the signature's value type, and so does another signature with the same pattern. Beside `price_tag: number`, the `_tag` signature publishes `string | number | undefined`.

A signature keeps only the value its body gives it, which is `unknown | undefined` when only the docblock typed it, in these cases:

- **A key that can't join**: a key the pattern matches, or one of the signature's own entries, can't join the union when any of these holds:
  - its type has a top-level `unknown`, or is a template literal type
  - its type names a class, or any type other than a primitive, `Record`, or `Date`
  - its type holds a string literal with a backslash
  - it brings a class import, unless the import comes from `#[TsCasts]`
- **An overlapping pattern**: another signature's pattern may overlap its own. A plain `[key: string]` or `[key: number]` signature always counts as overlapping.
- **An extends clause**: the interface extends a type, through `#[TsExtends]` or a `ts_extends` config entry, whose keys the package can't see.

When a key the pattern matches is all that stops the union, `ts:publish` warns and names the key and the signature.

A signature needs both a literal part and a variable part. A fully literal key publishes as a named property, and a fully dynamic key, such as `$data[$name]`, isn't published. A key whose literal text contains a backtick isn't published either.

A value the body typed itself stands, even beside a key it can't take in, an overlapping pattern, or an extends clause. So ``[key: `${string}_tag`]: string | undefined`` beside `main_tag: PostResource` still fails `tsc` with TS2411, and a pattern contained in another one can fail with TS2413. Type the key, or rename it out of the pattern.

#### Model `toArray()` Spread

Spreading a model's own `toArray()` into an array literal with other keys intersects the model's interface with those keys, instead of publishing `Record<string, unknown>`:

```php
'members' => $this->whenLoaded('members', fn ($members) => $members->map(
    fn (User $member) => [...$member->toArray(), 'flag' => true]
)),
```

The spread and the extra key become an intersection:

```typescript
members?: (Omit<User, "flag"> & { flag: boolean })[];
```

The `Omit<>` matters. In PHP the later key wins, so `'flag'` replaces whatever the spread contributed. TypeScript's `&` would instead intersect both, and turn a conflicting key into `never`. When one literal holds several spreads, each spread's `Omit<>` removes every key that a later spread or an explicit key overwrites, in source order.

At the top level of `toArray()`, a spread with no key flattens into the resource's own properties instead. `...$this->user->toArray()` adds the user's properties to the interface, and `...PostResource::make($this->post)->resolve()` adds the post resource's. A collection's `...$this->tags->toArray()` adds a `[key: number]` index signature.

The intersection references the `{Model}` interface instead of copying its shape. That comes close to what `toArray()` returns at runtime, with two differences:

- **Relations are missing**: a relation loaded before the spread is in the JSON but not in the type, since the package can't know what's loaded. Under the [`model-split` template](https://tolki.abe.dev/ts/models.html#model-templates), relations live in `{Model}Relations`, which the spread doesn't reference.
- **`$hidden` columns are extra**: Laravel strips them at runtime, but they stay in `{Model}` unless [`models.exclude_hidden`](https://tolki.abe.dev/ts/models.html#what-gets-published-hidden-attributes-write-only-accessors) is enabled.

Appended accessors aren't a difference: `toArray()` includes them, and they're part of `{Model}`. `{Model}Mutators` holds only the accessors a model doesn't append.

Spreading a resource, as in `...UserResource::make($m)->resolve($request)`, works the same way without either difference, because the resource interface is the response shape.

### Attribute Filters (`only` / `except`)

`$this->only([...])` and `$this->except([...])` filter the backing model's attributes. Both work as the return value and as a spread:

```php
// As the return value
public function toArray(Request $request): array
{
    return $this->only(['id', 'name', 'email']);
}

// As a spread in the returned array
public function toArray(Request $request): array
{
    return [
        ...$this->except(['password', 'remember_token']),
        'role' => EnumResource::make($this->role),
    ];
}
```

The two methods build different property sets:

- **`only([...])`**: exactly the keys you name, each typed from the model, including accessors and relations. A key the model types outside its schema, such as a `withCount()` count (`comments_count: number`) or an `@property` tag, is kept. A key that the model doesn't define and nothing can type is dropped.
- **`except([...])`**: the model's columns, accessors, and relations, minus the keys you name.

A model that declares its own typed `only()` or `except()` publishes that method's return instead, such as the model itself for `: static`.

`$this->resource->only([...])` and `$this->resource->except([...])` are the same calls, so they publish the same types, spread or not. The same holds for every relation filter below: `$this->resource->author->only([...])` publishes what `$this->author->only([...])` does.

`only()` and `except()` are the only attribute filters the package reads. If you need another method, [open an issue](https://github.com/abetwothree/laravel-ts-publish/issues) or send a pull request.

#### Relation Filters

`only()` and `except()` work on a related model too, as in `$this->author->only([...])` or `$this->post?->except([...])`. A to-many relation and a collection member filter differently, as [To-Many Relations and Collection Members](#to-many-relations-and-collection-members) describes.

When the relation holds a single model and every key you name is one of its database columns, the property references the related model's interface with `Pick<>`. `only()` picks the keys you name, and `except()` picks every other column:

```php
'author' => $this->author->only(['id', 'name']),
'post' => $this->post?->except(['created_at', 'updated_at']),
```

Both properties reference the model's interface:

```typescript
author: Pick<User, "id" | "name">;
post: Pick<Post, "id" | "title" | "content" | "user_id"> | null;
```

This keeps the model's own `#[TsCasts]` and `@property` types. Both methods publish `Pick<>`, never `Omit<>`, so the type names exactly the columns it holds, whatever mutators, relations, or counts the model's interface also carries.

`except()` picks your model's columns minus the named keys. When the model gains a column, an existing `except([...])` includes it without any change to your resource.

When a key isn't a column, the package writes the shape inline, and the two methods differ the way they do in Eloquent:

- **`only([...])`**: expands exactly the keys you name. Eloquent's `only()` calls `getAttribute()` for each key, which reads accessors and relations too. So `$this->author->only(['name', 'initials', 'posts'])` publishes `{ name: string; initials: string; posts: Post[] }`.
- **`except([...])`**: expands the related model's database columns minus the named keys, never an accessor or a relation. Eloquent's `except()` reads only the stored attributes, and a model keeps its relations apart from those.

So for `'author' => $this->author?->except(['id', 'name'])`, where `User` has the accessors `initials` and `is_premium` and the relations `profile` and `posts`, the type holds columns only:

```typescript
author: { email: string; phone: string | null } | null;
```

Naming a relation or an accessor in `except()` changes nothing, since that key was never in the set. To publish one, switch to `only([...])`, or give the key its own entry in `toArray()`.

An accessor typed as a union of models, such as `@return Attribute<Contact|User|null, never>`, is filtered one model at a time. Each model gets its own `Pick<>` when every key is one of its columns, and an inline shape otherwise. When `Contact` has no `phone` column, `$this->last_active_by?->only(['id', 'phone'])` publishes `{ id: number } | Pick<User, "id" | "phone"> | null`.

##### To-Many Relations and Collection Members

On a to-many relation, `only()` and `except()` select models, not attributes. Eloquent's collection `only()` and `except()` keep the models whose primary key you list and return them whole, so the property publishes the relation's own type, whatever the key list holds:

```php
'replies' => $this->comments->only([1, 2]),
'kept' => $this->comments?->except($request->input('ids')),
```

Both keep the relation's type:

```typescript
replies: Comment[];
kept: Comment[] | null;
```

A `?->` on `$this->resource` adds `| null` once, because a resource can wrap `null`. `$this->resource?->comments->only([1, 2])` publishes `Comment[] | null`.

An accessor that returns an Eloquent collection of models filters the same way. It publishes a list of those models, such as `Comment[]`, whatever key type the accessor declares.

A member holding a support `Collection` selects entries by key: `only()` keeps the listed keys, and `except()` drops them. Its filter publishes `Record<string, unknown>`, whatever the collection holds. This covers these members:

- A column cast with `'collection'`, `'encrypted:collection'`, `AsCollection`, or `AsEncryptedCollection`
- An accessor, cast getter, or method that returns a `Collection`

These members publish `unknown` instead:

- An `AsEnumCollection` column
- A collection-cast column read through anything other than `$this` or `$this->resource`, such as a relation's column in `$this->author->options->only([...])`, or a local variable that holds the model
- A collection class that overrides `only()` or `except()`, such as:
  - a class you pass to `AsCollection::using()`
  - a returned subclass that overrides them
  - a cast that builds an Eloquent collection
  - a method that returns an Eloquent collection

A single relation filtered by a runtime key list, such as `$this->author->only($request->input('fields'))`, names nothing to pick, so it publishes `Record<string, unknown>`.

#### Attribute Filters on Any Model

`only([...])` and `except([...])` work on any value that holds a model, not only a relation. The same types come from a bare `$this->only([...])`, which the resource forwards to its model, from a `whenLoaded()` closure parameter, and from a local variable that holds a model:

```php
return [
    ...$this->only(['id', 'comments_count']),
    'summary' => $this->when(true, fn () => $this->only(['id', 'title'])),
    'category' => $this->whenLoaded('category', fn ($category) => $category->only(['id', 'name'])),
    'dynamic' => $this->only($request->input('fields')),
];
```

Each filter publishes a `Pick<>` or a record:

```typescript
export interface PostResource {
  id: number;
  comments_count: number;
  summary?: Pick<Post, "id" | "title">;
  category?: Pick<Category, "id" | "name">;
  dynamic: Record<string, unknown>;
  // …
}
```

The `Pick<>` reference needs a literal key list. `$this->only($request->input('fields'))` has none, so it publishes `Record<string, unknown>` instead of guessing which keys arrive.

#### `exclude_hidden` and Attribute Filters

The `ts-publish.models.exclude_hidden` setting, described in [Models](https://tolki.abe.dev/ts/models.html#what-gets-published-hidden-attributes-write-only-accessors), applies to resources as well as to model interfaces. A `$hidden` column you name is kept, and a derived property set leaves it out, as Laravel's `toArray()` does:

```php
$this->only(['password'])   // kept: you named it
$this->except(['id'])       // password dropped: the property set is derived
```

With `exclude_hidden` enabled, each pattern treats a `$hidden` column this way:

| Pattern                                                                          | Property set                                     | A `$hidden` column                  |
| -------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------- |
| `'password' => $this->password`                                                  | The property you wrote                           | Kept, because you named it          |
| `$this->only(['id', 'password'])`                                                | Exactly the keys you named                       | Kept, because you named it          |
| `$this->relation->only(['id', 'password'])`                                      | Exactly the keys you named                       | Kept, because you named it          |
| `$this->whenHas('password')`                                                     | The attribute you named                          | Kept, because you named it          |
| `$this->except(['id'])`                                                          | The model's properties minus the named keys      | Dropped, because the set is derived |
| `$this->relation->except(['id'])`                                                | The related model's columns minus the named keys | Dropped, because the set is derived |
| `parent::toArray($request)`, `[...parent::toArray($request)]`, or no `toArray()` | The model's properties                           | Dropped, because the set is derived |

Reading a column directly, as in `'password' => $this->password`, is the most common way to expose one, and it behaves like a named `only()` key: a `$hidden` column you read yourself is never dropped.

To publish a `$hidden` column through a derived set, name it. Switch the property to `only([...])`, read it as `$this->column`, or remove it from the model's `$hidden` array if it no longer needs hiding.

### Resource Collections

`ResourceCollection` subclasses publish an interface too. `$this->collection` becomes a list of the singular resource:

```php
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'has_admin' => true,
        ];
    }
}
```

The collection's interface imports the singular resource:

```typescript
import type { UserResource } from ".";

export interface UserCollection {
  data: UserResource[];
  has_admin: boolean;
}
```

The singular resource comes from the first of these that names a class, in the order Laravel's `collects()` reads them:

1. The `#[Collects(UserResource::class)]` attribute on the collection. This attribute needs Laravel 13.
2. The `$collects` property.
3. The naming convention: `UserCollection` collects `User` when a class of that name exists in the same namespace, or else `UserResource`. The package uses the convention's pick only when it publishes that class.

When the class it names isn't an API resource, Laravel throws a `LogicException` instead of trying the next step. The collection then publishes an empty interface, and `ts:publish` warns.

The `$collects` property works on every supported Laravel version:

```php
class OrderCollection extends ResourceCollection
{
    public $collects = OrderResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
        ];
    }
}
```

On Laravel 12, use the `$collects` property or the naming convention. The `#[Collects]` attribute doesn't exist there, so the package can't find the resource of a collection that relies on it.

A collection that names its resource only through an overridden `collects()` method, or by assigning `$this->collects` in its constructor, publishes an empty interface. Declare `public $collects` instead.

When no singular resource matches, such as for a `MiscCollection` with no `MiscResource`, `$this->collection` publishes `unknown[]`.

A collection with no `toArray()` publishes Laravel's default shape, `{ data: R[] }`. So does a `toArray()` that returns the collected list: the `return parent::toArray($request);` stub that `php artisan make:resource` writes, `$this->collection`, or `$this->resource`. Over a paginator, `return $this->resource;` sends more than that, as [Paginated Collections](#paginated-collections) describes. With `public static $wrap = null;`, the collection is the list itself, so the package publishes a type alias instead of an interface:

```php
#[Collects(PostResource::class)] // Laravel 13+
class PostFlatCollection extends ResourceCollection
{
    public static $wrap = null;
}
```

The unwrapped collection becomes an alias:

```typescript
export type PostFlatCollection = PostResource[];
```

A collection with no `toArray()` that extends another collection applies the list above to its own class, and inherits the parent's `$collects` property and `$wrap`, but no PHP attribute, such as `#[Collects]` or `#[PreserveKeys]`. When the parent names its resource with `#[Collects]` or by its class name, a child that doesn't name one itself makes Laravel send the plain models. The package then publishes the model behind the parent's resource, such as `handovers: Handover[]` for a child of a `HandoverCollection` with `#[Collects(HandoverResource::class)]`, or the parent's resource when it doesn't publish that model. Set `$collects` on the child to name its resource, as `HandoverDigestCollection` does:

```php
class HandoverCollection extends ResourceCollection
{
    public static $wrap = 'handovers';

    public $collects = HandoverResource::class;
}

class HandoverDigestCollection extends HandoverCollection
{
    public $collects = HandoverSummaryResource::class;
}
```

`HandoverDigestCollection` collects its own resource, under the `handovers` key it inherits:

```typescript
export interface HandoverDigestCollection {
  handovers: HandoverSummaryResource[];
}
```

A child that inherits its parent's own `toArray()` runs it as itself, so `$this->collection` in that method lists the child's resource.

#### The Wrap Key Your App Sets

The package reads the wrap key your app has set by the time `ts:publish` runs, so a call in a service provider's `boot()` method reaches the published types:

```php
use Illuminate\Http\Resources\Json\JsonResource;

public function boot(): void
{
    JsonResource::withoutWrapping();
}
```

After `JsonResource::withoutWrapping()`, every collection that publishes Laravel's default shape is the list itself, so it publishes a type alias instead of an interface with a `data` key. A `PostCollection` with no `toArray()` publishes `export type PostCollection = PostResource[];`. Code that reads its `data` key then fails to compile, since Laravel no longer sends that key. After `JsonResource::wrap('items')`, the same collections publish `{ items: PostResource[] }`.

A class that redeclares `$wrap` keeps its own key through `withoutWrapping()`, and so do its subclasses. `HandoverDigestCollection` above keeps `handovers`. Calling `HandoverCollection::wrap('crew')` changes the key for that class and its subclasses only.

Call these methods unconditionally in a provider's `boot()`. A wrap set anywhere else, such as in middleware, in a controller, or behind a `runningInConsole()` check, isn't in place when `ts:publish` runs, so the published types miss it. A change to the wrap key rebuilds every cached file on the next run. Inertia props follow the same key, as [API Resources in Props](https://tolki.abe.dev/ts/inertia.html#api-resources-in-props) describes.

#### Key-Preserving Collections

A `ResourceCollection` normally serializes as a JSON array, so the generated type is `R[]`. Laravel can keep the collection's original keys instead, which makes the payload a JSON object. The package reads both ways to opt in:

```php
use Illuminate\Http\Resources\Attributes\PreserveKeys;
use Illuminate\Http\Resources\Json\ResourceCollection;

#[PreserveKeys] // Laravel 13+
class TeamCollection extends ResourceCollection
{
    public $collects = TeamResource::class;
}
```

The property form works on every supported Laravel version:

```php
use Illuminate\Http\Resources\Json\ResourceCollection;

class TeamCollection extends ResourceCollection
{
    public $preserveKeys = true;

    public $collects = TeamResource::class;
}
```

Either form generates:

```typescript
export interface TeamCollection {
  data: Record<string, TeamResource>;
}
```

With `public static $wrap = null;` as well, the collection publishes the alias `export type TeamCollection = Record<string, TeamResource>;`.

The type follows `#[PreserveKeys]` or `$preserveKeys`, not the keys of the items you pass, which the package can't see. A collection without either that you give items keyed by `keyBy()` sends an object, while its type says `TeamResource[]`. One with either that you give a plain list sends an array, while its type says `Record<string, TeamResource>`. In your own `toArray()`, `$this->collection` and `$this->resource` keep the keys of the items you pass, whatever the class declares, so items that `filter()` left with gaps are sent as an object. Give `#[PreserveKeys]` to a collection that receives keyed items, and call `values()` on filtered items before you pass them in.

#### Reading `$this->resource`

Inside a collection, `$this->resource` holds the collected items, which are a collection of the singular resource or the paginator you passed in. A key that returns it, or its `toArray()`, publishes every shape Laravel can send, with the paginator types from `@tolki/types`:

```php
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'page' => $this->resource,
            'first_user' => $this->resource->first(),
            'user_count' => $this->resource->count(),
        ];
    }
}
```

The collection publishes:

```typescript
import type {
  CursorPaginator,
  LengthAwarePaginator,
  SimplePaginator,
} from "@tolki/types";
import type { UserResource } from ".";

export interface UserCollection {
  data: UserResource[];
  page:
    | UserResource[]
    | LengthAwarePaginator<UserResource>
    | SimplePaginator<UserResource>
    | CursorPaginator<UserResource>;
  first_user: UserResource | null;
  user_count: number;
}
```

These calls on `$this->resource` publish a type of their own:

- `first()` and `last()` publish `UserResource | null`.
- `count()` publishes `number`, and `isEmpty()` publishes `boolean`.
- `only()` and `except()` publish `UserResource[] | Record<string, UserResource>`, since the items they keep come back under their own keys.
- A paginator method, such as `total()`, `perPage()` or `nextPageUrl()`, publishes its return type, such as `number` or `string | null`.

Laravel throws when the items are a plain collection, or a paginator without that method, so the type covers only the paginators that have it. `total()` exists only on the paginator `paginate()` returns, so call it only in a collection you always build from `paginate()`.

If the collection always receives one kind of paginator, redeclare `$resource` with it. With `/** @var LengthAwarePaginator<int, UserResource> */ public $resource;`, `page` publishes `LengthAwarePaginator<UserResource>`.

A call the collection forwards to `$this->resource`, such as `$this->first()` or `$this->total()`, publishes the same type. In a [key-preserving collection](#key-preserving-collections), the list type is `Record<string, UserResource>`. When no singular resource matches, each type holds `unknown`, such as `unknown[]` and `LengthAwarePaginator<unknown>`.

The package doesn't follow a collection pipeline on `$this->resource`, such as `map()`, `pluck()` or `values()`, or a read on the item `first()` returns, such as `$this->resource->first()?->name`. Each publishes `unknown`. Type such a key with [`#[TsCasts]`](#overriding-property-types-with-tscasts).

#### Paginated Collections

A collection's interface covers what its `toArray()` returns. The `links` and `meta` keys Laravel adds to a paginated response, and any data you add with `with()` or `additional()`, aren't part of it. An Inertia page prop that passes a paginator to a resource collection gets its pagination members from the page prop's type instead, with the `meta` block of each paginator kind. See [Paginating Inline in the Render Call](https://tolki.abe.dev/ts/inertia.html#paginating-inline-in-the-render-call) on the Inertia page.

Over a paginator, Laravel merges a `meta` or `links` key that your `toArray()` returns beside `data` into its own pagination block with `array_merge_recursive()`, and it merges the `with()` and `additional()` data the same way. A key your `toArray()` adds, such as `links.self`, is in the page prop's type. A key that two of these name, such as `meta.total`, is sent as a list of both values, such as `[3, 3]`, while the type still says `number`. Give your key another name, or remove from `paginationInformation()` only the key your `toArray()` also sends. The package doesn't read `paginationInformation()`, so any other change there leaves the published pagination type wrong.

Over a paginator, `$this->resource` holds the paginator itself. A `toArray()` that returns it sends the paginator's own array, with `current_page`, `first_page_url`, and its other keys, beside `links` and `meta`, and the page prop's type covers only `data`, `links`, and `meta`. Return `$this->collection` in a collection you paginate.

### JSON:API Resources

Laravel's [`JsonApiResource`](https://laravel.com/docs/eloquent-resources#jsonapi-resources), added in Laravel 12.45, sends a model as a [JSON:API](https://jsonapi.org/format/) document. The package publishes a subclass as the resource object it sends under `data`, and `@tolki/types` provides the document types around it:

```php
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

/**
 * @mixin Post
 */
class PostResource extends JsonApiResource
{
    public $attributes = ['title', 'word_count', 'published_at'];

    public $relationships = [
        'author' => UserResource::class,
        'comments' => CommentResource::class,
    ];
}
```

Here `UserResource` and `CommentResource` are JSON:API resources too. The package generates:

```typescript
import type {
  JsonApiToManyRelationship,
  JsonApiToOneRelationship,
} from "@tolki/types";

export interface PostResource {
  id: string;
  type: "posts";
  attributes: {
    title: string;
    word_count: number | null;
    published_at: string | null;
  };
  relationships?: {
    author?: JsonApiToOneRelationship<"users">;
    comments?: JsonApiToManyRelationship<"comments">;
  };
}
```

Each member follows what Laravel sends:

- **`id`**: always `string`, because Laravel sends the model's key as a string, even an integer one.
- **`type`**: the type Laravel works out for the resource when `ts:publish` runs, such as `"posts"` for `PostResource`, or the string literal your `toType()` returns.
- **`attributes`**: taken from the first source the resource declares, in the order Laravel reads them:
  1. A `toAttributes()` method. A key that `when()` or another conditional method wraps is optional, and an attribute name listed without a key, such as `'title'`, reads that model attribute.
  2. The `$attributes` property, a list of model attribute names.
  3. A `toArray()` method. Its keys become the attributes, not the whole response.
  4. With none of these, every key of the model's own `toArray()`, as [JsonResource Base Delegation](#jsonresource-base-delegation) describes.
- **`relationships`**: one key per relationship that `$relationships` or `toRelationships()` declares, named after its relation method. The member and each key are optional, because Laravel sends a relationship only when the request asks for it with `?include=`, or when you call `includePreviouslyLoadedRelationships()` on the resource and the relation is already loaded. A to-one relationship publishes `JsonApiToOneRelationship<"users">`, and a to-many one `JsonApiToManyRelationship<"comments">`.
- **`links` and `meta`**: optional members, published from `toLinks()` and `toMeta()`, or from the `$jsonApiLinks` and `$jsonApiMeta` properties.

`attributes` is required while at least one attribute is always sent. A `#[TsCasts]` entry on the resource or on its model retypes a key inside `attributes`, and never `id` or `type`.

#### Fetching a Document

The package doesn't type the response of a route, so type what `fetch()` returns with the document types from `@tolki/types`. The second type parameter lists the resource objects that `included` can hold:

```typescript
import type { JsonApiDocument } from "@tolki/types";
import type {
  CommentResource,
  PostResource,
  UserResource,
} from "@js/types/data/app/http/resources";

type Included = UserResource | CommentResource;

const res = await fetch(`/api/posts/${id}?include=author,comments`);
const doc: JsonApiDocument<PostResource, Included> = await res.json();

doc.data.attributes.title; // string
doc.included; // Included[] | undefined
```

`JsonApiCollection<PostResource>` types what `PostResource::collection()` sends, and `JsonApiPaginator`, `JsonApiSimplePaginator`, and `JsonApiCursorPaginator` type it over each paginator. [JSON:API Utilities Types](https://tolki.abe.dev/typescript/typescript-utilities-list.html#json-api-utilities-types) lists every type.

As an Inertia prop, a JSON:API resource publishes its whole document for you. See [JSON:API Resources in Props](https://tolki.abe.dev/ts/inertia.html#json-api-resources-in-props).

#### Sparse Fieldsets

Every attribute the resource always sends is required. A request with a sparse fieldset, such as `?fields[posts]=title`, sends only the attributes it names. Read such a response through `JsonApiSparse` from `@tolki/types`, which makes the `attributes` member optional, and every attribute in it:

```typescript
import type { JsonApiDocument, JsonApiSparse } from "@tolki/types";
import type { PostResource } from "@js/types/data/app/http/resources";

type SparsePost = JsonApiSparse<PostResource>;

const res = await fetch(`/api/posts/${id}?fields[posts]=title`);
const doc: JsonApiDocument<SparsePost> = await res.json();

doc.data.attributes?.title; // string | undefined
```

#### Nesting a JSON:API Resource

Inside a plain API resource, Laravel sends a JSON:API resource without `included` or `jsonapi`:

```php
'author' => new UserResource($this->author),
'comments' => CommentResource::collection($this->comments),
'related' => new PostCollection($this->related),
```

Here `PostCollection` is a `ResourceCollection` that collects `PostResource`. The keys publish:

```typescript
author: { data: UserResource };
comments: CommentResource[];
related: { data: PostResource }[];
```

- A single resource, from `new`, `make()`, or `toResource()`, sends its resource object under `data`, and adds `| null` where its model can be `null`.
- `collection()` sends a list of resource objects.
- A named collection sends each item under its own `data` key.

#### What Isn't Typed

- A `toType()` that returns anything other than one string literal publishes `type: string`. The type is worked out when `ts:publish` runs, so a morph map or `Pluralizer::useLanguage()` call your app makes only later doesn't reach it.
- Keys that `additional()` adds beside `data` aren't published.
- A relationship whose resource is a plain `JsonResource` publishes `type: string`. Laravel throws when a request includes it.

### Resource Attributes

Four attributes configure how a resource is published:

| Attribute       | Target                                              | Use it to                                                                                                                                    |
| --------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `#[TsResource]` | Resource class                                      | Set the interface name, the backing model, or a description                                                                                  |
| `#[TsCasts]`    | Resource class, `toArray()`, or a method it spreads | Override property types, or add properties                                                                                                   |
| `#[TsExtends]`  | Resource class                                      | Extend the interface with your own TypeScript types, as [Extending Interfaces](https://tolki.abe.dev/ts/extending-interfaces.html) describes |
| `#[TsExclude]`  | Resource class                                      | Leave the resource out of the output, as [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html) describes                      |

#### Configuring Resource Generation With `#[TsResource]`

Use `#[TsResource]` to set the generated interface's name, the backing model, or a description:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsResource;
use App\Models\User;

#[TsResource(name: 'UserData', model: User::class, description: 'User API response')]
class UserResource extends JsonResource
{
    // ...
}
```

The attribute takes three optional parameters:

| Parameter     | Type            | Default                | Description                         |
| ------------- | --------------- | ---------------------- | ----------------------------------- |
| `name`        | `?string`       | Class name             | The TypeScript interface name       |
| `model`       | `?class-string` | Resolved automatically | The backing Eloquent model          |
| `description` | `string`        | `''`                   | A JSDoc comment above the interface |

`name` also sets the output file's name. For example, `#[TsResource(name: 'Address')]` generates `address.ts` instead of `address-resource.ts`.

#### Overriding Property Types With `#[TsCasts]`

The package already types these shapes without an override:

- A method call on an enum, a date, a model, or a service, and a property read on any of those or on a value object. See [Method Return Types](#method-return-types).
- A value behind a local variable, a closure-local variable, or an `instanceof` guard. See [Local Variables and Narrowing](#local-variables-and-narrowing).
- A collection chain, `data_get()`, and `only([...])` on any model. See [Collection Pipelines](#collection-pipelines) and [Attribute Filters on Any Model](#attribute-filters-on-any-model).
- A key that only some branches return, or one that a spread method's `@return` describes. See [Return Branches and `@return` Shapes](#return-branches-and-return-shapes).

`#[TsCasts]` is the right tool when the frontend owns the type and it needs its own import, or when a shape is dynamic.

Use `#[TsCasts]` to override a property's type, or to add a property that `toArray()` doesn't return:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

#[TsCasts([
    'metadata' => 'Record<string, unknown>',
    'coordinates' => ['type' => 'GeoPoint', 'import' => '@/types/geo'],
    'flagged_at' => ['type' => 'string | null', 'optional' => true],
])]
class CommentResource extends JsonResource
{
    // ...
}
```

Each entry takes one of these forms:

| Form                     | Example                                             | Effect                                             |
| ------------------------ | --------------------------------------------------- | -------------------------------------------------- |
| A string                 | `'Record<string, unknown>'`                         | Overrides the type                                 |
| An array with `import`   | `['type' => 'GeoPoint', 'import' => '@/types/geo']` | Uses a custom type and imports it                  |
| An array with `optional` | `['type' => 'string', 'optional' => true]`          | Overrides the type and marks the property optional |

An entry for a key that `toArray()` returns overrides that key's type. An entry for any other key adds a property to the interface. With the `coordinates` entry above, the resource generates:

```typescript
import type { GeoPoint } from "@/types/geo";

export interface CommentResource {
  id: number;
  content: string;
  is_flagged: boolean;
  flagged_at?: string | null;
  metadata: Record<string, unknown>;
  author?: UserResource;
  post?: PostResource;
  coordinates: GeoPoint;
}
```

An entry publishes its type exactly as you write it, and the file imports only the types its interface names. So an entry over a key that wraps an enum in [`EnumResource::make()`](#enum-properties-with-enumresource), such as `'status' => 'StatusType'`, publishes `status: StatusType` instead of `AsEnum<typeof Status>`. To keep the wrap, write it in the entry, as in `'status' => 'AsEnum<typeof Status>'`. The package then imports `AsEnum` and `Status` for that key.

Entries also work on two less common kinds of key:

- **An index signature**: use its published name as the key, such as ``'[key: `${string}_tag`]' => 'string'``. `'optional' => true` adds `| undefined` to its value instead of a `?`, because `[key: T]?:` isn't valid TypeScript. [Interpolated Keys](#interpolated-keys) covers how to write the key.
- **A numeric key**: `'42' => 'boolean'` publishes `"42": boolean`.

You can put `#[TsCasts]` on the resource class, on `toArray()` itself, or on a trait or helper method that `toArray()` spreads. On a method, it works the same way as on the class, including on a `toArray()` that returns `parent::toArray($request)`. See [Trait Method Spread](#trait-method-spread).

The backing model's own `#[TsCasts]` applies here too. An entry on the model retypes the resource property with the same name, including its `optional` flag. For example, an `Address` model entry `'latitude' => ['type' => 'number | null', 'optional' => true]` makes a resource's `'latitude' => $this->whenNotNull($this->latitude)` publish `latitude?: number | null`. A model entry never adds a property.

When more than one place names a key, the place lower in this list wins:

1. The backing model's entries: on its class, then on `$casts`, then on `casts()`.
2. A method that `toArray()` spreads.
3. `toArray()`.
4. The resource class.

So the resource's own entries, on the class or on a method, take precedence over the model's. The order holds even when two places spell an index signature's name differently.

An entry that leaves out `'optional'` keeps the flag of the nearest place above it in the list that sets one, or else the inferred one. Over the `Address` entry above, a `toArray()` entry `'latitude' => 'Latitude'` on a plain `'latitude' => $this->latitude` publishes `latitude?: Latitude`.

### Nullable Relations

A to-one relation loads `null` when its related record doesn't exist. Wherever Laravel can send that `null`, the property adds `| null`. The package decides whether a relation can load `null` from the relation type and your database schema. The `models.nullable_relations` setting controls this, and it's enabled by default. Each relation type has a strategy:

| Relation type                                           | Strategy   | Result                                                           |
| ------------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `HasOne`, `MorphOne`, `HasOneThrough`                   | `nullable` | Always nullable, since the related record may not exist          |
| `BelongsTo`                                             | `fk`       | Nullable when the foreign key column is nullable in the database |
| `MorphTo`                                               | `morph`    | Nullable when the morph type or ID column is nullable            |
| `HasMany`, `BelongsToMany`, and other to-many relations | `never`    | A list, never `null`                                             |

For example, a `BelongsTo` relation with a nullable foreign key:

```php
// Migration: $table->foreignId('user_id')->nullable();

// Resource:
'user' => $this->whenLoaded('user'),
```

The property publishes `user?: User | null`: optional because of `whenLoaded()`, and nullable because of the foreign key.

The `| null` also applies to the other ways you can send the relation. Here `parent` is a `BelongsTo` relation with a nullable `parent_id`, and `children` is a `HasMany` relation:

```php
'parent_name' => $this->whenLoaded('parent', fn ($parent) => $parent->name),
'parent_label' => $this->whenLoaded('parent', 'loaded'),
'parent_resource' => CategoryResource::make($this->whenLoaded('parent')),
'parent_direct' => CategoryResource::make($this->parent),
'parent_nullsafe' => $this->parent?->toResource(),
'parent_in_array' => ['parent' => CategoryResource::make($this->parent)],
'children_names' => $this->whenLoaded('children', fn ($children) => $children->pluck('name')),
```

Each `parent` property adds `| null`, and the to-many `children_names` doesn't:

```typescript
parent_name?: string | null;
parent_label?: string | null;
parent_resource?: CategoryResource | null;
parent_direct: CategoryResource | null;
parent_nullsafe: CategoryResource | null;
parent_in_array: { parent: CategoryResource | null };
children_names?: string[];
```

Each `| null` comes from what Laravel does at runtime:

- **A `whenLoaded()` value or closure**: when the relation is loaded as `null`, Laravel returns `null` without reading the value or calling the closure.
- **A resource built around the relation**: inside another resource, Laravel sends a nested resource whose payload is `null` as `null`.
- **A nullsafe call**: `?->` returns `null` when the relation is `null`.

`$this->parent->toResource()`, without the `?`, publishes `CategoryResource` with no `| null`, because PHP throws an error when `parent` is `null`.

A `when()`, ternary, `mergeWhen()`, `transform()`, `if` block or earlier `return` that rules out a `null` `parent` by testing `$this->parent` itself, for truthiness, against `null`, with `isset()` or with one `instanceof`, drops the `| null` from what it guards, so `$this->when($this->parent, fn () => CategoryResource::make($this->parent))` publishes `CategoryResource`, while a check on `parent_id` keeps it, because a soft-deleted parent still loads as `null`.

A resource built directly around a relation gets the `| null` only when the package can type that relation. A relation the model doesn't declare, a relation to a model the package doesn't publish, and a `morphTo` with no resolvable target publish without it. Inside a `whenLoaded()` closure, the relation's own rule applies instead, so `$this->whenLoaded('parent', fn ($parent) => CategoryResource::make($parent))` publishes `CategoryResource | null` whenever `parent` can load `null`. In that closure, a relation the model doesn't declare counts as one that can load `null` while `nullable_relations` is on.

To turn off nullable relation detection everywhere:

```php
// config/ts-publish.php
'models' => [
    'nullable_relations' => false,
],
```

To change the strategy for a relation type, use `models.relation_nullability_map`:

```php
// config/ts-publish.php
'models' => [
    'relation_nullability_map' => [
        \Illuminate\Database\Eloquent\Relations\HasOne::class => 'never',
    ],
],
```

The valid strategies are `'nullable'`, `'never'`, `'fk'`, and `'morph'`.

Resources and models share these `models.*` settings, because a resource takes its relation types from its backing model. See [Nullable Relations](https://tolki.abe.dev/ts/models.html#nullable-relations) on the Models page.

### Filtering & Excluding

Choose which resources are published with the same include and exclude settings that [enums](https://tolki.abe.dev/ts/enums.html#filtering-excluding-enums) and [models](https://tolki.abe.dev/ts/models.html#filtering-excluding-models) use:

```php
// config/ts-publish.php

'resources' => [
    // Publish only these resources (leave empty to publish all)
    'included' => [
        App\Http\Resources\UserResource::class,
        App\Http\Resources\PostResource::class,
    ],

    // Leave these resources out
    'excluded' => [
        App\Http\Resources\InternalResource::class,
    ],

    // Search these directories for resources too
    'additional_directories' => [
        'modules/Blog/Http/Resources',
    ],
],
```

As with models and enums, `included` and `excluded` accept both class names and directory paths.

`#[TsExclude]` on a resource class also leaves it out. See [Resource Attributes](#resource-attributes) and [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html).

To turn off resource publishing entirely, set `enabled` to `false`:

```php
// config/ts-publish.php

'resources' => [
    'enabled' => false,
],
```

To publish only resources for a single run, pass the `--only-resources` flag:

```bash
php artisan ts:publish --only-resources
```

`--only-resources` fails when you combine it with another `--only-*` flag, such as `--only-enums` or `--only-models`. `--only-functional` is the exception: it overrides every other `--only-*` flag, and it skips resources.

### Configuration Reference

The [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html) lists every `resources.*` config key.

## Broadcast Channels

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) compiles every channel you register in `routes/channels.php` into one `broadcast-channels.ts` file. The file holds a `BroadcastChannel` union of template literal types, and a `BroadcastChannels` const with an accessor for every dynamic segment. You build a channel name the way you call a route helper, instead of typing `{placeholder}` strings by hand.

Broadcast channels don't need the `@tolki/ts` runtime. The output is a plain union type and a plain object of strings and accessor functions. See [Installing `@tolki/ts`](https://tolki.abe.dev/ts/index.html#installing-tolki-ts) for the features that do.

### How Broadcast Channel Types Are Generated

Broadcast channels work differently from [enums](https://tolki.abe.dev/ts/enums.html), [models](https://tolki.abe.dev/ts/models.html), [resources](https://tolki.abe.dev/ts/api-resources.html) and [form requests](https://tolki.abe.dev/ts/form-requests.html). There's no class to collect or filter, and no attributes:

- **Every registered channel**: the package reads every channel name you register with `Broadcast::channel(...)`.
- **Only the name matters**: a closure and a channel class publish the same way, as [Both Registration Styles](#both-registration-styles) shows.
- **One combined file**: every channel goes into one file, named by `broadcast_channels.filename` (`broadcast-channels.ts` by default). There's no `index.ts` barrel, no per-channel files, and no `included`, `excluded` or `additional_directories` filtering, since no PHP class backs a channel. With no channels registered, the file is `export {};`.
- **No attributes**: `#[TsExclude]` and `#[TsCasts]` don't apply, for the same reason. See [No Per-Channel Attributes](#no-per-channel-attributes).

### Anatomy of the Generated File

Given these registrations:

```php
// routes/channels.php
use App\Broadcasting\PublicAnnouncementsChannel;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return true;
});

Broadcast::channel('user.{userId}.notifications', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Both a channel of its own and the start of the channel below.
Broadcast::channel('chat.{roomId}', function ($user, $roomId) {
    return true;
});

Broadcast::channel('chat.{roomId}.messages', function ($user, $roomId) {
    return true;
});

// A channel class. Only the name string affects the TypeScript output.
Broadcast::channel('public-announcements', PublicAnnouncementsChannel::class);
```

The package generates:

```typescript
export type BroadcastChannel =
  | `orders.${string | number}`
  | `user.${string | number}.notifications`
  | `chat.${string | number}`
  | `chat.${string | number}.messages`
  | `public-announcements`;

export const BroadcastChannels = {
  orders: (orderId: string | number) => `orders.${orderId}` as const,
  user: (userId: string | number) => ({
    notifications: `user.${userId}.notifications` as const,
  }),
  chat: (roomId: string | number) => ({
    $channel: `chat.${roomId}` as const,
    messages: `chat.${roomId}.messages` as const,
  }),
  "public-announcements": `public-announcements` as const,
};
```

The file has two exports:

- **`BroadcastChannel`**: a union of [template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html). Each `{param}` segment becomes `${string | number}`, whether PHP binds it to a model, an enum or a scalar, since only the channel name matters.
- **`BroadcastChannels`**: an object that mirrors the dot-notation names. A channel with no dynamic segments is a string constant. A channel that ends in a `{param}` is a function that returns the channel name. A channel with a `{param}` and more segments after it, like `user.{userId}.notifications`, is a function that returns an object of the segments that follow.

A static segment that isn't a valid JavaScript identifier, such as `public-announcements` with its hyphen, becomes a quoted key. See [Quoted Keys](#quoted-keys).

### How Channel Names Become Accessors

The accessor shape follows [Laravel Wayfinder](https://github.com/laravel/wayfinder)'s. The package splits each channel name on `.` and builds `BroadcastChannels` from the pieces:

- **Static segments** become keys, nested in the order they appear.
- **`{param}` segments** become the parameters of the function for the static segment before them, so `orders.{orderId}` gives `orders(orderId)`.
- **Shared leading segments** share one key. `chat.{roomId}` and `chat.{roomId}.messages` both live under `BroadcastChannels.chat(roomId)`.

Channels that share a segment have to give its parameters the same names. `orders.{orderId}` beside `orders.{slug}.timeline` gives the `orders` key two different parameters, and `ts:publish` fails with a "conflicting parameter names" error. Rename one wildcard so the two match.

### Both Registration Styles

Laravel lets you register a channel with a closure or with a channel class that has a `join()` method:

```php
// A closure
Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return true;
});

// A channel class, which only affects authorization in PHP
Broadcast::channel('order.{orderId}', OrderChannel::class);
```

Both produce the same TypeScript for the same channel name, because the package reads only the name. It never reads the closure or the class.

### The `$channel` Accessor for Overlapping Prefixes

When a channel name is a channel of its own and also the start of other channels, like `chat.{roomId}` beside `chat.{roomId}.messages`, its accessor returns an object. `$channel` on that object is the shorter channel's own name:

```typescript
BroadcastChannels.chat(42).$channel; // 'chat.42', the chat room itself
BroadcastChannels.chat(42).messages; // 'chat.42.messages', the room's message stream
```

Without `$channel`, you couldn't reach the plain `chat.{roomId}` channel once `chat` returns an object with a `messages` key.

### Quoted Keys

A static segment with characters a bare JavaScript key can't hold, such as a hyphen, is quoted:

```typescript
export const BroadcastChannels = {
  "public-announcements": `public-announcements` as const,
  "order-status": (statusId: string | number) =>
    `order-status.${statusId}` as const,
};
```

Reach a quoted key with bracket notation:

```typescript
BroadcastChannels["public-announcements"];
BroadcastChannels["order-status"](3);
```

### The `BroadcastChannel` Type

Each registered channel adds one member to the `BroadcastChannel` union. Use it to type a helper that accepts any valid channel name without naming a specific one:

```typescript
import type { BroadcastChannel } from "@js/types/data/broadcast-channels";

function subscribe(channel: BroadcastChannel) {
  return Echo.private(channel);
}

subscribe(BroadcastChannels.orders(42)); // ✓
subscribe("not-a-real-channel"); // ✗ type error
```

### No Per-Channel Attributes

Channels are collected as plain name strings, not as PHP classes, so the attributes available for [enums](https://tolki.abe.dev/ts/enums.html#enum-attributes), [models](https://tolki.abe.dev/ts/models.html#model-attributes) and [form requests](https://tolki.abe.dev/ts/form-requests.html#overriding-field-types-with-tscasts) don't apply:

- **No `#[TsExclude]`**: to leave a channel out, remove its `Broadcast::channel(...)` registration, or skip it with a condition in `routes/channels.php`, such as `if (! app()->isProduction())`.
- **No `#[TsCasts]`**: there's no per-channel type to override. Every dynamic segment is `string | number`, matching how Laravel resolves a channel name when it authorizes a subscription, whatever PHP type the segment binds to.
- **No `included`, `excluded` or `additional_directories` config**: every channel your app registers is included. There's no directory to search, since channels don't live in class files.

### Configuration Reference

The [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html) lists every `broadcast_channels.*` key, including the class overrides for customizing the pipeline.

## Broadcast Events

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) generates a TypeScript interface for each event that implements `ShouldBroadcast` or `ShouldBroadcastNow`, so the payloads your frontend receives through Laravel Echo are typed. It also writes a combined `broadcast-events.ts` index, with a `BroadcastEvent` union and a flat `BroadcastEvents` const of every Echo event name. An optional module augmentation types Laravel Echo's `Events` interface.

Broadcast events don't need the `@tolki/ts` runtime. The output is plain TypeScript interfaces and a plain `const` object. See [Installing `@tolki/ts`](https://tolki.abe.dev/ts/index.html#installing-tolki-ts) for the features that do.

### How Broadcast Event Types Are Generated

Unlike [broadcast channels](https://tolki.abe.dev/ts/broadcast-channels.html), events are published one class at a time, like [enums](https://tolki.abe.dev/ts/enums.html), [models](https://tolki.abe.dev/ts/models.html) and [form requests](https://tolki.abe.dev/ts/form-requests.html). The output follows these rules:

- **Discovery**: the package finds every class in `app/Events` that implements `ShouldBroadcast` or `ShouldBroadcastNow`. You can add directories and filter classes, as [Filtering & Excluding](#filtering--excluding) shows.
- **Payload**: each event's interface comes from its `broadcastWith()` method or its public properties. See [Broadcast Data](#broadcast-data).
- **One file per event**: the directory mirrors the event's namespace, as for models and enums, and the file keeps the class name, so `App\Events\OrderShipped` becomes `app/events/OrderShipped.ts`.
- **Index file**: every event also lands in one `broadcast-events.ts` index. See [The Combined Index File](#the-combined-index-file-broadcast-eventsts).
- **Echo augmentation**: optionally, an `echo-broadcast-events.d.ts` file types Laravel Echo. See [Echo Module Augmentation](#echo-module-augmentation).

### Anatomy of a Generated Event File

Given this event:

```php
class OrderShipped implements ShouldBroadcast
{
    public function __construct(
        public int $orderId,
        public string $trackingNumber,
        public string $carrier,
        public ?array $metadata = null,
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("orders.{$this->orderId}");
    }
}
```

The package generates `app/events/OrderShipped.ts`:

```typescript
/** @see App\Events\OrderShipped */
export interface OrderShipped {
  orderId: number;
  trackingNumber: `${string}-${string}-${string}`;
  carrier: string;
  metadata?: Record<string, unknown>;
}
```

The interface follows these rules:

- **Name**: the interface is always named after the event's short class name.
- **`@see` comment**: points back to the fully qualified PHP class.
- **Required properties**: a public property is required when it's promoted in the constructor or has a default. Every property on `OrderShipped` is promoted, so all four are required before `#[TsCasts]` applies.
- **Optional properties**: a property declared in the class body with a type and no default, such as `public string $label;` set in the constructor, is optional (`label?: string`). `json_encode()` leaves out a typed property that was never assigned, and the package can't see an assignment in the constructor. So a property your constructor always sets still gets the `?`. Give it a default, or promote it, to make it required.
- **Nullable properties**: a nullable property is typed `| null`. Nullability alone never makes a key optional.

In this example, three things come from a `#[TsCasts]` override on the class: `trackingNumber`'s template-literal type, `metadata`'s `Record<string, unknown>` type and the `?` on `metadata`. [Overriding Property Types With `#[TsCasts]`](#overriding-property-types-with-tscasts) shows the override. Without it, the two properties would have their inferred types (`string` and `unknown[] | null`), and `metadata` would be required.

### Broadcast Data

By default, every public property becomes an interface field, in declaration order, whether it's promoted in the constructor or declared in the class body. A `@var` docblock wins over the native type, so `/** @var list<string> */ public array $tags` is typed `string[]` rather than `unknown[]`. Properties that come from a trait are skipped, whatever the trait. A [`#[TsExtends]`](https://tolki.abe.dev/ts/extending-interfaces.html) trait's fields already arrive through the `extends` clause.

Define `broadcastWith()` to send, and type, a different shape, for example to leave out private fields:

```php
class TeamMessageSent implements ShouldBroadcast
{
    public function __construct(
        public int $teamId,
        public string $content,
        private string $senderToken,
    ) {}

    /**
     * @return array{teamId: int, content: string}
     */
    public function broadcastWith(): array
    {
        return [
            'teamId' => $this->teamId,
            'content' => $this->content,
        ];
    }

    public function broadcastOn(): Channel
    {
        return new Channel("teams.{$this->teamId}");
    }
}
```

The interface has only the keys `broadcastWith()` returns:

```typescript
/** @see App\Events\TeamMessageSent */
export interface TeamMessageSent {
  teamId: number;
  content: string;
}
```

`senderToken` never appears in the interface. The package reads the body of `broadcastWith()` and types each `$this->…` value from the event's own properties. The `@return array{teamId: int, content: string}` docblock above is documentation, not a requirement, and the same interface comes out without it.

When the body can't type a value, the `@return array{…}` shape types it:

```php
final class PostScheduled implements ShouldBroadcast
{
    public function __construct(public Post $post) {}

    public function broadcastOn(): Channel
    {
        return new Channel('posts');
    }

    /** @return array{published_at: string|null} */
    public function broadcastWith(): array
    {
        return ['published_at' => $this->publishedAt()];
    }

    private function publishedAt() // no return type
    {
        return $this->post->getAttribute('published_at');
    }
}
```

The docblock fills the key the body couldn't type:

```typescript
/** @see App\Events\PostScheduled */
export interface PostScheduled {
  published_at: string | null;
}
```

The body still wins wherever it types a value. The docblock only fills a key the body left `unknown`, so a stale `@return` can't overwrite a type the body already found. A `key?:` entry in the docblock makes that key optional.

A spread helper that builds its keys by interpolation, such as `"{$name}_tag"`, adds an index signature to the interface, for example ``[key: `${string}_tag`]: string | undefined``. When the helper's body can't type the values, its `@return array<string, V>` docblock types them. [Interpolated Keys](https://tolki.abe.dev/ts/api-resources.html#interpolated-keys) on the API Resources page describes how the event's `#[TsCasts]` and `extends` clause then apply.

When an event has `broadcastWith()`, including one inherited from a parent class or a trait, only that method shapes the payload. The public properties aren't read. A key it renames, computes or drops shows up exactly that way. `['team' => $this->teamId, 'kind' => 'message', 'count' => count($this->items)]` becomes `{ team: number; kind: string; count: number }`, with no `teamId`.

Laravel merges a `broadcastWith()` payload with `array_merge()`, which renumbers integer keys from `0`. A top-level `42 => …` key therefore publishes as `"0"`, and `ts:publish` warns that you probably meant a string key. Nested keys keep theirs.

`broadcastWith()` can also build its array in a variable and return it. A key it writes on only some paths, such as inside an `if`, is optional:

```php
class ManifestAssembled implements ShouldBroadcast
{
    public function __construct(
        public int $parcelId,
        public string $carrier,
        public bool $express = false,
    ) {}

    public function broadcastWith(): array
    {
        $payload = ['parcelId' => $this->parcelId, 'carrier' => $this->carrier];

        if ($this->express) {
            $payload['priority'] = 'express';
        }

        return $payload;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('manifests');
    }
}
```

The `priority` key publishes optional:

```typescript
/** @see App\Events\ManifestAssembled */
export interface ManifestAssembled {
  parcelId: number;
  carrier: string;
  priority?: string;
}
```

[Building the Array in a Variable](https://tolki.abe.dev/ts/api-resources.html#building-the-array-in-a-variable) on the API Resources page lists the writes the package follows.

### Model & Enum-Aware Properties

A property typed as an Eloquent model or a PHP enum resolves to the type the rest of the package uses for it. The file imports that type for you:

```php
class MultiModelEvent implements ShouldBroadcast
{
    public function __construct(
        public readonly Post $post,
        public readonly User $user,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel("multi.{$this->post->id}");
    }
}
```

The model properties become `Partial` model types:

```typescript
import type { Post, User } from "../models";

/** @see App\Events\MultiModelEvent */
export interface MultiModelEvent {
  post: Partial<Post>;
  user: Partial<User>;
}
```

The two kinds resolve this way:

- **Eloquent models** resolve to `Partial<Model>`, since a broadcast payload may not include every column. The type is imported from the generated [models](https://tolki.abe.dev/ts/models.html).
- **PHP enums** resolve to the enum's `{Name}Type` alias, the union of its backing values, or of its case names for a pure enum. The alias is imported from the generated [enums](https://tolki.abe.dev/ts/enums.html). A rename with [`#[TsEnum]`](https://tolki.abe.dev/ts/enums.html#tsenum) carries over, so the alias always names a type the enum output declares.

This event has two enum properties:

```php
class EnumBroadcastEvent implements ShouldBroadcast
{
    public function __construct(
        public readonly Status $status,
        public readonly Color $color,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('enum-events');
    }
}
```

Each enum property becomes its type alias:

```typescript
import type { ColorType, StatusType } from "../enums";

/** @see App\Events\EnumBroadcastEvent */
export interface EnumBroadcastEvent {
  status: StatusType;
  color: ColorType;
}
```

Two properties can need models or enums that share a class name but live in different namespaces. Each import then gets a prefix from its namespace, such as `AppUser` and `CrmUser`, so both work in one file. Events that share a class name get the same treatment in the [combined index](#the-combined-index-file-broadcast-eventsts).

### Custom Echo Event Names With `broadcastAs()`

By default, an event's Echo name follows Laravel's convention: a leading dot, then the fully qualified class name with dots in place of backslashes. Override it with `broadcastAs()`:

```php
class ServerCreated implements ShouldBroadcast
{
    public function __construct(
        public int $serverId,
        public string $serverName,
    ) {}

    public function broadcastAs(): string
    {
        return 'server.created';
    }

    public function broadcastOn(): Channel
    {
        return new Channel('servers');
    }
}
```

`broadcastAs()` doesn't change the interface:

```typescript
/** @see App\Events\ServerCreated */
export interface ServerCreated extends BroadcastableEvent {
  serverId: number;
  serverName: string;
}
```

The string `broadcastAs()` returns, `'server.created'` here, becomes the event's key everywhere: the `BroadcastEvent` union member, the `BroadcastEvents` value and the Echo augmentation key. Without `broadcastAs()`, the key would be `'.App.Events.ServerCreated'`.

`broadcastAs()` has to return one whole string literal. A name built at runtime, such as `return 'order.'.$this->kind;`, has no single value to publish, so the event keeps Laravel's class-name convention. You get a key you can predict, instead of the literal prefix `'order.'`, which Echo would never receive.

The `extends BroadcastableEvent` in this example comes from a `#[TsExtends]` attribute on the class. See [Extending Interfaces](#extending-interfaces-global-config-vs-tsextends) below.

### Overriding Property Types With `#[TsCasts]`

Override an inferred type with `#[TsCasts]` on the event class, the same way as for [models](https://tolki.abe.dev/ts/models.html#tscasts) and [form requests](https://tolki.abe.dev/ts/form-requests.html#overriding-field-types-with-tscasts):

```php
#[TsCasts([
    'trackingNumber' => '`${string}-${string}-${string}`',
    'metadata' => ['type' => 'Record<string, unknown>', 'optional' => true],
])]
class OrderShipped implements ShouldBroadcast
{
    public function __construct(
        public int $orderId,
        public string $trackingNumber,
        public string $carrier,
        public ?array $metadata = null,
    ) {}

    // ...
}
```

This override gives `trackingNumber` its template-literal type, and gives `metadata` its `Record<string, unknown>` type and its `?`, in the [Anatomy](#anatomy-of-a-generated-event-file) example. Each entry is a type string, or an array with `type`, `optional` and `import` keys for a custom type that needs an import.

An entry publishes its type exactly as written, without the `Partial<>` a model property otherwise gets, and the file imports only the types the interface names. A class-level entry for a key the payload doesn't have adds neither the key nor its import. An entry on `broadcastWith()` does add a key the payload lacks, as a resource's `toArray()` entry does.

You can also put `#[TsCasts]` on `broadcastWith()`. It works the same way as on the class, and the class's entry wins when both name a key.

### Extending Interfaces: Global Config vs. `#[TsExtends]`

An event interface can extend shared interfaces through config, through an attribute, or through both at once.

The `ts_extends.broadcast_events` config applies to every event:

```php
// config/ts-publish.php
'ts_extends' => [
    'broadcast_events' => [
        ['extends' => 'HasTimestamps', 'import' => '@/types/common'],
    ],
],
```

Every event interface then extends `HasTimestamps`:

```typescript
import type { HasTimestamps } from "@/types/common";

/** @see App\Events\UserNotification */
export interface UserNotification extends HasTimestamps {
  userId: number;
  title: string;
  message: string;
}
```

The `#[TsExtends]` attribute applies to one event class. It also works on a trait the event uses:

```php
#[TsExtends('BroadcastableEvent', '@/types/broadcast')]
class ServerCreated implements ShouldBroadcast
{
    // ...
}
```

See [Extending Interfaces](https://tolki.abe.dev/ts/extending-interfaces.html) for the attribute and config syntax.

### The Combined Index File (`broadcast-events.ts`)

After it writes the event files, the package combines them into one index:

```typescript
import type { EnumBroadcastEvent } from "./app/events/EnumBroadcastEvent";
import type { MultiModelEvent } from "./app/events/MultiModelEvent";
import type { OrderShipped } from "./app/events/OrderShipped";
import type { ServerCreated } from "./app/events/ServerCreated";
import type { TeamMessageSent } from "./app/events/TeamMessageSent";
import type { UserSynced as AppUserSynced } from "./app/events/UserSynced";
import type { UserSynced as CrmUserSynced } from "./crm/events/UserSynced";

export type BroadcastEvent =
  | ".App.Events.EnumBroadcastEvent"
  | ".App.Events.MultiModelEvent"
  | ".App.Events.OrderShipped"
  | "server.created"
  | ".App.Events.TeamMessageSent"
  | ".App.Events.UserSynced"
  | ".Crm.Events.UserSynced";

export const BroadcastEvents = Object.freeze({
  EnumBroadcastEvent: ".App.Events.EnumBroadcastEvent",
  MultiModelEvent: ".App.Events.MultiModelEvent",
  OrderShipped: ".App.Events.OrderShipped",
  ServerCreated: "server.created",
  TeamMessageSent: ".App.Events.TeamMessageSent",
  AppUserSynced: ".App.Events.UserSynced",
  CrmUserSynced: ".Crm.Events.UserSynced",
} as const);

export type {
  EnumBroadcastEvent,
  MultiModelEvent,
  OrderShipped,
  ServerCreated,
  TeamMessageSent,
  AppUserSynced,
  CrmUserSynced,
};
```

The index has these parts:

- **`BroadcastEvent`**: a union of every event's Echo name, from `broadcastAs()` or the default dotted class name.
- **`BroadcastEvents`**: a flat, frozen const that maps each event's short class name to its Echo name. It's flat, unlike [Wayfinder](https://github.com/laravel/wayfinder)'s nested namespace tree, because you look an event up by what it is, not by where its class lives.
- **Re-exports**: the index re-exports every event interface, so you can import from the index or from the event's own file.
- **Import-conflict aliasing**: two event classes can share a short name, such as `App\Events\UserSynced` and `Crm\Events\UserSynced`. Their imports and const keys then get a prefix from the namespace (`AppUserSynced` and `CrmUserSynced`). It's the same aliasing that [model and enum properties](#model--enum-aware-properties) get inside one event file.

If your app has no broadcast events, the index is `export {};`.

### Echo Module Augmentation

When `broadcast_events.echo_augmentation.enabled` is `true` (the default), the package also writes `echo-broadcast-events.d.ts`:

```typescript
import type { EnumBroadcastEvent } from "./app/events/EnumBroadcastEvent";
import type { OrderShipped } from "./app/events/OrderShipped";
import type { ServerCreated } from "./app/events/ServerCreated";

declare module "@laravel/echo" {
  interface Events {
    ".App.Events.EnumBroadcastEvent": EnumBroadcastEvent;
    ".App.Events.OrderShipped": OrderShipped;
    "server.created": ServerCreated;
  }
}
```

The file augments Laravel Echo's own `Events` interface. `Echo.private(channel).listen(eventName, ...)` and `useEcho()` from `@laravel/echo-vue` or `@laravel/echo-react` then infer the payload type from the event name, with no annotation.

The package picks the `declare module` target in this order:

1. The `broadcast_events.echo_augmentation.echo_package` config value, if set.
2. The first one your `package.json` dependencies or dev dependencies list, checked in this order: `@laravel/echo-vue`, `@laravel/echo-react`, `@laravel/echo-svelte`.
3. `@laravel/echo`, the base package every Echo setup depends on.

The file uses the same import-conflict aliasing as the index, so same-named events from different namespaces resolve correctly. If your app has no broadcast events, the package writes no augmentation file.

### Filtering & Excluding

Broadcast events use the same discovery settings as enums, models and form requests. Each list takes class names or directory paths:

```php
// config/ts-publish.php
'broadcast_events' => [
    'included' => [],               // only these event classes (empty = all)
    'excluded' => [],               // leave these event classes out
    'additional_directories' => [], // directories to search besides app/Events
],
```

`#[TsExclude]` on an event class leaves it out of collection and publishing:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

#[TsExclude]
class InternalDebugEvent implements ShouldBroadcast
{
    // Not published to TypeScript
}
```

See [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html) for the full attribute reference.

### Configuration Reference

The [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html) lists every `broadcast_events.*` key, including the Echo augmentation options and the class overrides for customizing the pipeline.

## Casing Configurations

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) has three config options that set the casing of generated names: `models.relationship_case` for model relations, `enums.method_case` for enum methods, and `routes.method_casing` for route actions. Each one accepts `'snake'`, `'camel'`, or `'pascal'`, and each affects only its own feature. There's no global casing setting, and no attribute or `@tolki/ts` setup is involved.

### `models.relationship_case`

This option sets the casing of relation names in generated model interfaces. See [Models](https://tolki.abe.dev/ts/models.html) for how relations publish.

```php
// config/ts-publish.php

'models' => [
    'relationship_case' => 'snake', // default
],
```

For a relation method named `ownedTeams()`, each value gives these names:

| Config Value | Relationship `ownedTeams()` | Count               | Exists               |
| ------------ | --------------------------- | ------------------- | -------------------- |
| `'snake'`    | `owned_teams: Team[]`       | `owned_teams_count` | `owned_teams_exists` |
| `'camel'`    | `ownedTeams: Team[]`        | `ownedTeams_count`  | `ownedTeams_exists`  |
| `'pascal'`   | `OwnedTeams: Team[]`        | `OwnedTeams_count`  | `OwnedTeams_exists`  |

Only the relation name is cased. The `_count` and `_exists` suffixes are added as they are, so `'camel'` gives you `ownedTeams_count`, not `ownedTeamsCount`.

For every relation on a model, the package also publishes a `_count` and an `_exists` property. They type the attributes that Laravel's [`withCount` and `withExists`](https://laravel.com/docs/eloquent-relationships#counting-related-models) add, and they appear in every generated model's interfaces. Laravel always names these attributes in snake case, such as `owned_teams_count`. Under `'camel'` or `'pascal'`, the published `_count` and `_exists` names don't match them.

### `enums.method_case`

This option sets the casing of enum method and static method keys in the generated output. See [Enum Attributes](https://tolki.abe.dev/ts/enums.html#enum-attributes) and [Auto-Including All Enum Methods](https://tolki.abe.dev/ts/enums.html#auto-including-all-enum-methods) for which methods publish, through `#[TsEnumMethod]`, `#[TsEnumStaticMethod]`, and the `auto_include_methods` and `auto_include_static_methods` settings.

```php
// config/ts-publish.php

'enums' => [
    'method_case' => 'camel', // default
],
```

For a method named `getLabel()` and a static method named `AllLabels()`, each value gives these keys:

| Config Value | Method `getLabel()` | Static Method `AllLabels()` |
| ------------ | ------------------- | --------------------------- |
| `'snake'`    | `get_label`         | `all_labels`                |
| `'camel'`    | `getLabel`          | `allLabels`                 |
| `'pascal'`   | `GetLabel`          | `AllLabels`                 |

The setting applies to every published enum method, instance or static, however it was included. You can rename one method with the `name` parameter of `#[TsEnumMethod]` or `#[TsEnumStaticMethod]`. That name goes through this setting as well, so under the default `'camel'`, `#[TsEnumMethod(name: 'get_label')]` publishes `getLabel`. Write the name in your configured casing to keep it as written. A case renamed with `#[TsCase(name:)]` isn't affected, and publishes exactly as written.

### `routes.method_casing`

This option sets the casing of each route action's exported name. See [Routing](https://tolki.abe.dev/ts/routing.html) for how routes publish. It changes only the generated export name. The Laravel route name stays the same, so `route()` and Ziggy calls still use it.

```php
// config/ts-publish.php

'routes' => [
    'method_casing' => 'camel', // default
],
```

For controller methods named `updateProfile()` and `store()`, each value gives these export names:

| Config Value | Controller method `updateProfile()` | Controller method `store()` |
| ------------ | ----------------------------------- | --------------------------- |
| `'snake'`    | `update_profile`                    | `store`                     |
| `'camel'`    | `updateProfile`                     | `store`                     |
| `'pascal'`   | `UpdateProfile`                     | `Store`                     |

If the cased name is a reserved JavaScript word, such as `delete`, the package adds `Method` to it, so the export is `deleteMethod` and stays a valid identifier.

### Configuration Reference

These are the three options and their defaults:

| Config Key                 | Type     | Default   | Description                                                                 |
| -------------------------- | -------- | --------- | --------------------------------------------------------------------------- |
| `models.relationship_case` | `string` | `'snake'` | Casing for relation names. The `_count` and `_exists` suffixes don't change |
| `enums.method_case`        | `string` | `'camel'` | Casing for enum instance and static method keys                             |
| `routes.method_casing`     | `string` | `'camel'` | Casing for each route action's exported name                                |

The full list of `models.*`, `enums.*`, and `routes.*` config keys is in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Enum API Resource

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) ships `EnumResource`, a Laravel [JSON resource](https://laravel.com/docs/eloquent-resources) that turns one PHP enum case into a flat, API-friendly object. It follows the same rules as `ts:publish`, so every `#[TsEnumMethod]` and `#[TsEnumStaticMethod]` you set up for TypeScript also appears in the JSON response, and you don't maintain separate serialization logic.

On the frontend, the `AsEnum` type from `@tolki/ts` matches this response shape, so you can type any response that uses `EnumResource`. See [Typing API Responses With `AsEnum`](#typing-api-responses-with-asenum).

### Basic Usage

Return an enum case directly from a controller or route:

```php
use AbeTwoThree\LaravelTsPublish\EnumResource;
use App\Enums\Status;

return new EnumResource(Status::Published);
```

You can also use it inside another resource's `toArray()`, for an enum-cast model property or for any enum case:

```php
namespace App\Http\Resources;

use AbeTwoThree\LaravelTsPublish\EnumResource;
use App\Enums\MembershipLevel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // Assuming "status" is a model property cast to the Status enum
            'status' => new EnumResource($this->status),
            // Any enum case works, not only model properties
            'membership_level' => new EnumResource(MembershipLevel::Free),
        ];
    }
}
```

Inside another resource, `EnumResource::make($this->status)` and `new EnumResource($this->status)` both publish the property as `AsEnum<typeof Status>`. See [Enum Properties With `EnumResource`](https://tolki.abe.dev/ts/api-resources.html#enum-properties-with-enumresource) on the API Resources page.

The same rewrite applies to [Inertia shared data](https://tolki.abe.dev/ts/inertia.html). With `enums.use_tolki_package` on (the default), an `EnumResource::make()` returned from your middleware's `share()` publishes as `AsEnum<typeof Role>` in `inertia-config.d.ts`, with `import { type AsEnum } from '@tolki/ts'` and an import of the `Role` const above the declarations. A shared key whose ternary picks between two different enums isn't rewritten. It publishes as `RoleType | StatusType` with neither enum imported, so TypeScript reports both names as missing (`TS2304`). Give both arms the same enum. See the `EnumResource` note in [How the Augmentation File Is Generated](https://tolki.abe.dev/ts/inertia.html#how-the-augmentation-file-is-generated).

`EnumResource` turns off Laravel's resource wrapping (`public static $wrap = ''`), so the response is the flat object shown below, not wrapped in a `data` key. When the enum is `null`, the resource returns `null` instead of an object.

### Response Shape

Every response has these keys, taken from the matching case, with any `#[TsCase]` override applied:

| Key      | Type               | Description                                       |
| -------- | ------------------ | ------------------------------------------------- |
| `name`   | `string`           | The enum case name                                |
| `value`  | `string \| number` | The backed value, or the case name for unit enums |
| `backed` | `boolean`          | Whether the enum is a backed enum                 |

The response for `Status::Published`, with two instance methods, looks like this:

```json
{
  "name": "Published",
  "value": 1,
  "backed": true,
  "icon": "check",
  "color": "green"
}
```

Each instance method, marked with `#[TsEnumMethod]` or included by `enums.auto_include_methods`, adds a top-level key that holds the method's value for this case. Each static method, marked with `#[TsEnumStaticMethod]` or included by `enums.auto_include_static_methods`, adds a top-level key that holds its return value.

Each method key holds the same value as the published enum, as `json_encode()` writes it. A method that throws for the case, or returns a value `json_encode()` can't write, sends `null`. [Object and Array Values](https://tolki.abe.dev/ts/enums.html#object-and-array-values) shows how an object becomes JSON, and the one kind of array that the response sends as a list while the published enum holds an object.

The response therefore has the same keys as the object you get when you call `.from()` on the published enum with the same value.

### Unit Enums

Unit enums work too. A unit enum has no backed value, so `value` repeats the case `name`, and `backed` is `false`:

```php
return new EnumResource(Role::Admin);
```

That call returns this response:

```json
{
  "name": "Admin",
  "value": "Admin",
  "backed": false
}
```

### Relationship to TypeScript Publishing

`EnumResource` follows the same rules as the `ts:publish` command. See [Enums](https://tolki.abe.dev/ts/enums.html) for the full attribute and auto-include reference. In practice:

- By default, only methods marked with `#[TsEnumMethod]` or `#[TsEnumStaticMethod]` are included. With auto-include on, public methods are included automatically.
- A method with required parameters and no `params` on its attribute is left out.
- `enums.method_case` sets the casing of the method keys in the response. See [`enums.method_case`](https://tolki.abe.dev/ts/casing-configuration.html#enums-method-case) on the Casing Configurations page.
- `#[TsExclude]` on a method removes it from both the TypeScript output and the response. See [Excluding Enum Methods](https://tolki.abe.dev/ts/excluding-content.html#excluding-enum-methods).

Because both follow the same rules, the JSON response has the same keys as the `AsEnum` type for that enum, with no second serializer to keep in sync.

### Typing API Responses With `AsEnum`

`@tolki/ts` exports an `AsEnum` type that describes the exact `EnumResource` response for any published enum, so you can type enum API responses on the frontend:

```typescript
import type { AsEnum } from "@tolki/ts";
import type { Status } from "@js/types/data/app/enums";

// Full discriminated union of all cases
type StatusResponse = AsEnum<typeof Status>;
// { name: 'Draft'; value: 0; backed: true; icon: 'pencil'; color: 'gray'; ... }
// | { name: 'Published'; value: 1; backed: true; icon: 'check'; color: 'green'; ... }
```

The optional second type parameter narrows the type to one case, by value:

```typescript
// Narrowed to a single case
type DraftResponse = AsEnum<typeof Status, 0>;
// { name: 'Draft'; value: 0; backed: true; icon: 'pencil'; color: 'gray'; ... }
```

Use it to type an API response directly:

```typescript
const response = await fetch(`/api/articles/${id}`);
const article: { id: number; status: AsEnum<typeof Status> } =
  await response.json();

if (article.status.value === 0) {
  // TypeScript knows this is the Draft case
  console.log(article.status.icon); // 'pencil'
}
```

The [Type Reference](https://tolki.abe.dev/ts/enums.html#type-reference) on the Enums page lists the full `AsEnum` signature next to every other `@tolki/ts` export.

### Auto-Generated `{Model}Resource` Interfaces

With `enums.use_tolki_package` on (the default), a model with enum-cast columns also gets `{Model}Resource` interfaces. They replace each property typed as a single enum, or a list of one, either optionally `| null`, with `AsEnum<typeof EnumName>`, or `AsEnum<typeof EnumName>[]` for a list. An accessor typed as a shape, or as a union with other types, keeps its own type. Use these interfaces when a property holds a full enum instance, because your code resolved it with `Status.from(post.status)` or because an API response serialized it with `EnumResource`. You don't compose `Omit<>` and `AsEnum<>` yourself.

For a `Post` model that casts the columns `status`, `visibility` and `priority` to enums, the package publishes both interfaces:

```typescript
export interface Post {
  id: number;
  title: string;
  content: string;
  status: StatusType; // Original enum type
  visibility: VisibilityType | null; // Original enum type
  priority: PriorityType | null; // Original enum type
}

// Generated for you
export interface PostResource extends Omit<
  Post,
  "status" | "visibility" | "priority"
> {
  status: AsEnum<typeof Status>;
  visibility: AsEnum<typeof Visibility> | null;
  priority: AsEnum<typeof Priority> | null;
}
```

Type the API response with the `Resource` interface:

```typescript
import type { PostResource } from "@js/types/data/app/models";

const response = await fetch("/api/posts/1");
const post: PostResource = await response.json();

post.status.value; // 0 | 1
post.status.icon; // 'pencil' | 'check'
```

Both [model templates](https://tolki.abe.dev/ts/models.html#model-templates) generate these interfaces. The `model-full` template generates one `{Model}Resource` that covers columns and accessors together. The `model-split` template generates a `PostResource` beside the columns interface, and a separate `PostMutatorsResource` beside the mutators interface, since accessors can be enum-typed too:

```typescript
export interface PostResource extends Omit<
  Post,
  "status" | "visibility" | "priority"
> {
  status: AsEnum<typeof Status>;
  // ...
}

export interface PostMutators {
  due_notice: DueAtNoticeType;
}

export interface PostMutatorsResource extends Omit<PostMutators, "due_notice"> {
  due_notice: AsEnum<typeof DueAtNotice>;
}
```

When two enums share a class name, both imports get a namespace prefix, for the type and for the const. `App\Enums\Status` and `App\Crm\Enums\Status` import as `EnumsStatus` and `CrmStatus`, with `EnumsStatusType` and `CrmStatusType` for the types. See [Enum-Typed Columns](https://tolki.abe.dev/ts/models.html#enum-typed-columns-model-resource) on the Models page for how the main and `Resource` interfaces differ.

### Configuration Reference

`EnumResource` has no config of its own. It uses the same `enums.*` settings (`method_case`, `auto_include_methods` and `auto_include_static_methods`) listed in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Excluding Content

Add the `#[TsExclude]` attribute to keep a class out of the TypeScript output, or to leave out one of its methods, accessors, relations, or controller actions. It works on enums, models, resources, form requests, broadcast events, and controllers. It's a PHP attribute only. It has no config key, and there's nothing to set up in `@tolki/ts`.

### `#[TsExclude]` Attribute

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

A method with `#[TsExclude]` is left out even when it also has `#[TsEnumMethod]` or `#[TsEnumStaticMethod]`. The same goes for a method that `enums.auto_include_methods` or `enums.auto_include_static_methods` would include.

### What Gets Removed

A class with `#[TsExclude]` is skipped before anything else happens. The package never analyzes it and writes no file for it. It's also left out of barrel `index.ts` files and combined files, such as `broadcast-events.ts`. On a model, that includes the model's [model metadata](https://tolki.abe.dev/ts/model-metadata.html) companion.

On a method, accessor, relation, or action, the attribute removes only that member. The rest of the class publishes as usual.

To leave out classes without adding the attribute, use the feature's filtering config instead, such as `models.excluded`. See [Configuration Reference](#configuration-reference) below.

Broadcast channels don't support `#[TsExclude]`. A channel is a name string from `routes/channels.php`, not a PHP class, so there's nothing to put the attribute on. See [Broadcast Channels](https://tolki.abe.dev/ts/broadcast-channels.html#no-per-channel-attributes) for how to leave a channel out.

### Excluding an Entire Class

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

### Excluding Enum Methods

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

`overridden()` and `overriddenStatic()` have attributes that would include them whatever the auto-include settings, but `#[TsExclude]` removes them. `label()` and `secret()` are missing because auto-include is off. Turn on `enums.auto_include_methods`, and `label()` publishes while `secret()` stays out. See [Auto-Including All Enum Methods](https://tolki.abe.dev/ts/enums.html#auto-including-all-enum-methods) for which methods auto-include adds.

### Excluding Model Accessors and Relations

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

`secretToken` and `comments` are missing from `ExcludableModelMutators` and `ExcludableModelRelations`, and so are `comments_count` and `comments_exists`. `getLegacyTokenAttribute()` uses the old `get{Name}Attribute()` accessor style, and the attribute leaves it out the same way as an `Attribute::make()` accessor. See [Models](https://tolki.abe.dev/ts/models.html) for how accessors and relations publish.

### Excluding Controller Actions

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

The `secret` action is missing from the generated file, and `show` publishes as usual. See [Routing](https://tolki.abe.dev/ts/routing.html#filtering-excluding-routes) for the other ways to filter routes: name patterns, middleware exclusion, and publishing only named routes.

### Configuration Reference

`#[TsExclude]` has no config key. Each feature also has its own filtering settings, such as `included`, `excluded`, and `additional_directories`. See the filtering section for [enums](https://tolki.abe.dev/ts/enums.html#filtering-excluding-enums), [models](https://tolki.abe.dev/ts/models.html#filtering-excluding-models), [API resources](https://tolki.abe.dev/ts/api-resources.html#filtering-excluding), [form requests](https://tolki.abe.dev/ts/form-requests.html#filtering-excluding-form-requests), [broadcast events](https://tolki.abe.dev/ts/broadcast-events.html#filtering-excluding), and [routes](https://tolki.abe.dev/ts/routing.html#filtering-excluding-routes), or the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Extending Interfaces

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can add an `extends` clause to a generated model, resource, form request, or broadcast event interface. Use it to pull in a hand-written interface for properties the package can't infer, or to share common fields across many classes without repeating them. All four features support it the same way.

There are two ways to add an `extends` clause, and they combine when you use both:

- **The `#[TsExtends]` attribute**: applies to one class, and to any class that extends it or uses the trait it's on.
- **The `ts_extends.*` config arrays**: apply to every generated interface of one feature, such as every model.

### `#[TsExtends]` Attribute

The attribute takes the clause, an optional import path, and an optional list of names to import:

```php
namespace AbeTwoThree\LaravelTsPublish\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
class TsExtends
{
    public function __construct(
        public string $extends,
        public ?string $import = null,
        public ?array $types = null,
    ) {}
}
```

Each parameter controls one part of the clause:

| Parameter | Type            | Default  | Description                                                                                                                                            |
| --------- | --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `extends` | `string`        | required | The TypeScript for the `extends` clause: an interface name, or a generic such as `Pick<X, "a" \| "b">`.                                                |
| `import`  | `?string`       | `null`   | The path to import the clause's types from. Leave it out for a global type that needs no import.                                                       |
| `types`   | `?list<string>` | `null`   | The names to import from `import`. When it's `null`, the package reads the names from `extends`, which works only when `extends` has no generic in it. |

`#[TsExtends]` is repeatable, so you can stack as many as you need. You can put it on any of these:

- A model, resource, form request, or broadcast event class.
- Any parent class in the class's inheritance chain.
- Any trait the class or one of its parent classes uses.

The package combines every `#[TsExtends]` it can reach from a class into that class's one `extends` clause. The class's own attributes come first, then those on its traits and parent classes, nearest first.

### Multiple Attributes & Named Arguments

This model stacks two attributes, and uses named arguments for `import` and `types`:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExtends;

#[TsExtends('HasTimestamps', import: '@/types/common')]
#[TsExtends('Pick<Auditable, "created_by" | "updated_by">', import: '@/types/audit', types: ['Auditable'])]
class Warehouse extends Model
{
    // ...
}
```

This generates:

```typescript
import type { Auditable } from "@/types/audit";
import type { HasTimestamps } from "@/types/common";

export interface Warehouse
  extends HasTimestamps, Pick<Auditable, "created_by" | "updated_by"> {
  // ... columns
}
```

On a model, the clause goes on the main interface, which holds the columns. The model's `WarehouseAll` interface extends that one, so it gets the clause too.

`HasTimestamps` needs no `types` array. When `types` is `null`, the package reads the names to import from the `extends` string itself. Without `types`, the package can't pick the names out of a generic clause, such as `Pick<>`, `Omit<>`, or `Partial<>`, so the import comes out missing or broken. Always list them in `types`.

An entry with no `import` is treated as a global type that's already available, such as one declared in your own global `.d.ts` file.

### Inheriting From Parent Classes & Traits

`#[TsExtends]` on a parent class or a trait applies to every class that extends or uses it. This example combines three sources into one `extends` clause: a trait, a parent class, and the resource itself.

The trait has two attributes:

```php
#[TsExtends('ExtendableInterface')]
#[TsExtends('Omit<Timestamps, "created_at" | "updated_at">', '@/types/util', ['Timestamps'])]
trait ExtendsInterfaces {}
```

The parent class has two more:

```php
#[TsExtends('ResourceRoutes', '@/types/resources')]
#[TsExtends('Pick<Routable, "store" | "update">', '@/types/routing', ['Routable'])]
class RoutableResource extends JsonResource {}
```

The resource extends `RoutableResource`, uses the `ExtendsInterfaces` trait, and adds its own attribute:

```php
#[TsExtends('BaseResource', import: '@/types/base')]
class WarehouseResource extends RoutableResource
{
    use ExtendsInterfaces;

    public function toArray(Request $request): array
    {
        return [/* ... */];
    }
}
```

All five attributes end up in one `extends` clause: the resource's own first, then the trait's, then the parent class's:

```typescript
import type { BaseResource } from "@/types/base";
import type { ResourceRoutes } from "@/types/resources";
import type { Routable } from "@/types/routing";
import type { Timestamps } from "@/types/util";

export interface WarehouseResource
  extends
    BaseResource,
    ExtendableInterface,
    Omit<Timestamps, "created_at" | "updated_at">,
    ResourceRoutes,
    Pick<Routable, "store" | "update"> {
  // ... resource properties
}
```

### Deduplication

When a class can reach the same `#[TsExtends]` more than one way, the clause lists it once. A trait that both a parent class and its child use is the common case:

```php
#[TsExtends('SharedInterface', '@/types/shared')]
trait SharedExtendsInterface {}
```

A parent resource and its child both use the trait:

```php
class BaseSharedResource extends JsonResource
{
    use SharedExtendsInterface;
}

class ChildSharedResource extends BaseSharedResource
{
    use SharedExtendsInterface;
}
```

`ChildSharedResource` reaches `SharedExtendsInterface` through its own `use` statement and again through `BaseSharedResource`. `SharedInterface` still appears once in the generated interface:

```typescript
import type { SharedInterface } from "@/types/shared";

export interface ChildSharedResource extends SharedInterface {}
```

### Global Config: `ts_extends.*`

To extend a shared interface on every generated interface of one feature, use the `ts_extends` config array instead of adding `#[TsExtends]` to each class. It has one key per feature: `models`, `resources`, `form_requests`, and `broadcast_events`.

```php
// config/ts-publish.php

'ts_extends' => [
    'models' => [
        'HasTimestamps',
        ['extends' => 'BaseFields', 'import' => '@/types/base'],
        ['extends' => 'Pick<Auditable, "created_by">', 'import' => '@/types/audit', 'types' => ['Auditable']],
    ],
    'resources' => [
        ['extends' => 'BaseResource', 'import' => '@/types/base'],
    ],
    'form_requests' => [
        //
    ],
    'broadcast_events' => [
        ['extends' => 'HasTimestamps', 'import' => '@/types/common'],
    ],
],
```

Each entry is a string or an array:

- **A string**: an `extends` clause with no import, for a global type.
- **An array**: `extends`, `import`, and optionally `types` keys, which work like the attribute's parameters.

Config entries combine with the `#[TsExtends]` attributes on the same interface. They come after the attributes in the clause, and a duplicate is removed the same way. Take the `broadcast_events` entry above, `['extends' => 'HasTimestamps', 'import' => '@/types/common']`, and an event that uses a trait with the same attribute:

```php
class UserNotification implements ShouldBroadcast
{
    use HasBroadcastTimestamps; // #[TsExtends('HasTimestamps', '@/types/common')]

    public function __construct(
        public int $userId,
        public string $title,
        public string $message,
    ) {}
}
```

The config entry and the trait's attribute have the same `extends` and `import`, so the clause lists `HasTimestamps` once:

```typescript
import type { HasTimestamps } from "@/types/common";

export interface UserNotification extends HasTimestamps {
  userId: number;
  title: string;
  message: string;
}
```

### Naming Conflicts & Aliasing

Two entries can use the same type name from different import paths, from any mix of attributes, traits, parent classes, and config. The package then aliases every use of that name. Each alias is the PascalCase form of the last segment of its own import path, followed by the type name, and each affected clause uses its alias:

```php
// Both entries name a type "Routable", from different import paths.
#[TsExtends('Routable', '@/types/routing')]
#[TsExtends('Routable', '@/types/legacy-routing')]
class Example { /* ... */ }
```

This generates:

```typescript
import type { Routable as LegacyRoutingRoutable } from "@/types/legacy-routing";
import type { Routable as RoutingRoutable } from "@/types/routing";

export interface Example extends RoutingRoutable, LegacyRoutingRoutable {}
```

The package applies these rules in order:

1. Identical `extends` and `import` pairs from any source, whether attribute, trait, parent class, or config, are kept once.
2. The same type name from the same path, across different `extends` clauses, gets one import statement.
3. The same type name from two different paths is aliased everywhere it appears, each with the prefix from its own import path. Every clause that uses it is rewritten to the alias, even inside a generic such as `Pick<>`.

### Configuration Reference

Each `ts_extends` key applies to one feature's interfaces:

| Config Key                    | Type    | Default | Description                                               |
| ----------------------------- | ------- | ------- | --------------------------------------------------------- |
| `ts_extends.models`           | `array` | `[]`    | Global `extends` clauses applied to every model           |
| `ts_extends.resources`        | `array` | `[]`    | Global `extends` clauses applied to every resource        |
| `ts_extends.form_requests`    | `array` | `[]`    | Global `extends` clauses applied to every form request    |
| `ts_extends.broadcast_events` | `array` | `[]`    | Global `extends` clauses applied to every broadcast event |

## Form Requests

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) turns each `FormRequest` into a TypeScript interface for its payload, built from the rules your `rules()` method returns. The shape of a `useForm()` call, an Axios body or a route's [request payload type](https://tolki.abe.dev/ts/routing.html#form-request-payload-types) then matches your validation rules. You don't maintain a second type by hand.

Form requests don't need the `@tolki/ts` runtime. Each one publishes as a plain TypeScript interface, or as a `Record<string, unknown>` alias for a [dynamic request](#dynamic-requests). See [Installing `@tolki/ts`](https://tolki.abe.dev/ts/index.html#installing-tolki-ts) for the features that do.

### How Form Request Types Are Generated

The package looks for form requests in `app/Http/Requests` and publishes each one it finds. The output follows these rules:

- **One file per request**: the path comes from the namespace, so `App\Http\Requests\StorePostRequest` becomes `app/http/requests/store-post-request.ts`.
- **Barrels**: each namespace directory gets an `index.ts` that re-exports every file (`export * from './store-post-request'`), the same as for [enums](https://tolki.abe.dev/ts/enums.html#how-enums-are-generated) and [models](https://tolki.abe.dev/ts/models.html#how-models-are-generated).
- **Rules come from `rules()`**: the package builds your form request without a real HTTP request and calls `rules()`. It reads the rules you return and runs no validation. [Dynamic Requests](#dynamic-requests) covers what `rules()` can and can't do during a publish.

### Anatomy of a Generated Form Request

This request uses the common rule types and a `#[TsCasts]` override:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;
use Illuminate\Foundation\Http\FormRequest;

#[TsCasts([
    'tags' => 'string[]',
    'rating' => ['type' => 'number | bigint', 'optional' => true],
])]
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'published' => ['boolean'],
            'rating' => ['nullable', 'numeric'],
            'email' => ['required', 'email'],
            'tags' => ['array'],
            'tags.*' => ['string'],
        ];
    }
}
```

The package publishes this interface:

```typescript
/** @see App\Http\Requests\StorePostRequest */
export interface StorePostRequest {
  title: string;
  body: string;
  published?: boolean;
  rating?: number | bigint | null;
  /** @format email */
  email: string;
  tags?: string[];
}
```

Each field shows one rule at work:

- **`title` and `body`** are required, from the `required` rule, and typed `string`, from the `string` rule.
- **`published`** has no `required` rule, so it's optional, even though `boolean` alone says nothing about presence.
- **`rating`** shows that a [`#[TsCasts]`](#overriding-field-types-with-tscasts) override replaces only the type and the `?`. The `nullable` rule still adds `| null`, giving `number | bigint | null` rather than `number | bigint`.
- **`email`** gets a [JSDoc annotation](#jsdoc-metadata-annotations), `@format email`, from the `email` rule.
- **`tags`** is `string[]` instead of the bare `array` rule's `unknown[]`. The sibling `tags.*` rule sets that type, and `#[TsCasts]` then sets it to the same value.
- **`tags.*`** gets no property of its own. A dot-notation or wildcard rule key describes a value inside `tags`, so it composes into `tags` instead of appearing as a quoted `"tags.*"` key. See [Array & Nested Rules](#array--nested-rules).

The interface's JSDoc comment is the description in the docblock of `rules()`, or in the class docblock when `rules()` has none. Fields have no docblocks of their own, since they're keys in the `rules()` array. [JSDoc metadata annotations](#jsdoc-metadata-annotations) fill that role instead.

### Rule-to-Type Mapping Reference

The package checks a field's rules in this order, and the first match sets its type:

1. `File` rule objects, such as `Rule::file()` or `File::image()`, give `File`.
2. `Rule::anyOf([...])` gives a union of each inner rule set's type.
3. `Rule::enum(...)` gives a union of the enum's backing values, honoring `->only()` and `->except()`. An enum with no backing values gives `string`.
4. `Rule::in(...)` or `in:a,b,c` gives a union of literal values, quoted or not, as [Numeric `in:` Literals](#numeric-in-literals) explains.
5. Other rule objects: `Rule::date()`, `Email`, `Password` and `StringRule` give `string`. `Numeric` gives `number`. `Rule::dimensions()` gives `File`. `Rule::array()`, `Contains` and `DoesntContain` give `unknown[]`. `Rule::notIn(...)` gives `string`.
6. String rule names, from the table below.
7. Anything else gives `unknown`.

String rule names map to these types:

| Rules                                                                                                                                                                                                                                         | Type        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `string`, `alpha`, `alpha_dash`, `alpha_num`, `ascii`, `current_password`, `hex_color`, `json`, `date`, `date_equals`, `date_format`, `email`, `url`, `active_url`, `uuid`, `ulid`, `ip`, `ipv4`, `ipv6`, `mac_address`, `regex`, `not_regex` | `string`    |
| `integer`, `int`, `numeric`, `decimal`, `digits`, `digits_between`                                                                                                                                                                            | `number`    |
| `boolean`, `accepted`, `accepted_if`, `declined`, `declined_if`                                                                                                                                                                               | `boolean`   |
| `file`, `image`, `mimes`, `mimetypes`, `extensions`                                                                                                                                                                                           | `File`      |
| `array`, `list`                                                                                                                                                                                                                               | `unknown[]` |

An `array` or `list` field gets a sharper type when you describe its contents. A sibling `field.*` rule that resolves to a type `T` makes the field `T[]`, as [Array & Nested Rules](#array--nested-rules) shows. A rule that lists its keys, such as `required_array_keys`, makes it an object with those keys, as [Key-List Rules](#key-list-rules-known-keys-without-a-full-shape) shows.

#### Numeric `in:` Literals

`Rule::in([1, 2, 3])` carries real integers, so it publishes `1 | 2 | 3`. The string form can't, because Laravel's rule parser reads `in:1,2,3` as strings. So `'legacy_code' => ['string', 'in:1,2,3']` publishes the quoted `'1' | '2' | '3'`.

A sibling rule that declares the field numeric makes the values unquoted. Those rules are the `number` row of the table above: `integer`, `int`, `numeric`, `decimal`, `digits` and `digits_between`:

```php
'priority_level' => ['required', 'integer', 'in:1,2,3'],      // 1 | 2 | 3
'digit_grade' => ['digits:1', 'in:1,2,3'],                    // 1 | 2 | 3
'decimal_tier' => ['decimal:1', 'in:1.5,2.5'],                // 1.5 | 2.5
'legacy_code' => ['required', 'string', 'in:1,2,3'],          // '1' | '2' | '3'
```

A value loses its quotes only when it reads back as the same text. Laravel's `in` rule compares the raw input string against each listed value, so a padded or reformatted value stays a string. Publishing it as a number would describe a value Laravel rejects:

```php
'padded_numeric_code' => ['required', 'numeric', 'in:007,2.50'],  // '007' | '2.50'
'padded_decimal_tier' => ['decimal:2', 'in:1.50,2.50'],           // '1.50' | '2.50'
```

### Presence, Nullability & Exclusion

These rules decide whether a field is optional, nullable or left out:

| Rule                                                                                                           | Effect                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `required`, or any rule starting with `required` (including `Rule::requiredIf()` and `Rule::requiredUnless()`) | The field is required, with no `?`.                                                                                                                                                   |
| `sometimes`                                                                                                    | The field is optional, even alongside `required`.                                                                                                                                     |
| `nullable`                                                                                                     | Adds `\| null` to the field's type.                                                                                                                                                   |
| `missing` or `prohibited`                                                                                      | The field is left out of the interface entirely, not only marked optional. A nested key is dropped from its parent's shape instead. See [Array & Nested Rules](#array--nested-rules). |

This example shows each rule's effect in a comment:

```php
public function rules(): array
{
    return [
        'title' => ['required', 'string'],   // title: string;
        'slug' => ['sometimes', 'required', 'string'], // slug?: string;
        'notes' => ['nullable', 'string'],   // notes?: string | null;
        'internal_id' => ['prohibited'],     // left out
    ];
}
```

A field with no `required` rule, such as a bare `'published' => ['boolean']`, is optional. As in Laravel's validation, a field without `required` may be missing from the request.

### Array & Nested Rules

Dot-notation keys (`meta.description`) and wildcard keys (`tags.*`) describe values nested inside a field, not top-level keys you send. Each one composes into its nearest parent without a dot and never appears as its own quoted property. A property such as `"order.id"?: string` would suggest you could send a literal `order.id` key, which Laravel's dot notation never means:

```php
class ArrayRulesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'tags' => ['array', 'min:1', 'max:10'],
            'tags.*' => ['required', 'string', 'max:50'],

            'selected_ids' => ['required', 'array', 'between:1,5'],
            'selected_ids.*' => ['required', 'integer'],

            'order' => ['required', 'array'],
            'order.id' => ['required', 'uuid'],
            'order.items' => ['required', 'array'],
            'order.items.*.product_id' => ['required', 'integer'],
        ];
    }
}
```

The nested rules compose into their parents:

```typescript
export interface ArrayRulesRequest {
  tags?: string[];
  selected_ids: number[];
  /** @format uuid order.id */
  order: { id: string; items: { product_id: number }[] };
}
```

Nesting has no depth limit. `order.items.*.product_id` composes through every segment, the same way `tags.*` composes through one. The parent's own rules decide its `?` and `| null`, so `selected_ids` is required because its own rule says `required`. Each nested key's rules decide its `?` inside the parent's shape.

A parent with no rule of its own is optional. `'order.items.*.sku' => ['required', 'string']` on its own publishes `order?: { items?: { sku: string }[] }`, and adding `'order' => ['required', 'array']` makes `order` required.

#### Nested Edge Cases

These rule combinations have a less obvious result:

| Rules                                                                                        | Generated type                                            | Why                                                                                                                                           |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `'choices' => ['nullable','array']`<br>`'choices.*' => ['nullable','string']`                | `choices?: (string \| null)[] \| null`                    | The element's `nullable` folds into the element type. The array's own `nullable` stays on the array.                                          |
| `'options' => ['array']`<br>`'options.*' => ['string']`<br>`'options.default' => ['string']` | `options?: { default?: string } & Record<string, string>` | A wildcard beside a named key describes a map with some fixed keys. The intersection stays valid TypeScript even when the two halves differ.  |
| `'meta' => ['array']`<br>`'meta.secret' => ['prohibited']`                                   | `meta?: Record<string, never>`                            | Every named key is prohibited, so no key is allowed. This isn't an empty object you can add keys to.                                          |
| `'empties' => ['array']`<br>`'empties.*' => ['prohibited']`                                  | `empties?: never[]`                                       | The element can never appear, so the array can never hold anything.                                                                           |
| `'v1\.0' => ['required','string']`                                                           | `"v1.0": string`                                          | An escaped dot is a literal character in the attribute name, so it stays one field. It's quoted, since `.` can't appear in a bare identifier. |
| `'items' => ['array']`<br>`'items.0.name' => ['required','string']`                          | `items?: { name: string }[]`                              | Explicit numeric indices describe a list. No real JSON array fits a `{ "0": … }` type.                                                        |
| `'variants.0.name' => [...]`<br>`'variants.1.email' => [...]`                                | `variants?: ({ name: string } \| { email: string })[]`    | Indices with different shapes form a union, in parentheses so `[]` applies to the whole union rather than its last member.                    |

A `prohibited` or `missing` rule on a nested key drops that key and everything under it from the parent's shape. `'order.secret' => ['prohibited']` beside `'order.secret.token' => ['required','uuid']` leaves nothing of `secret` in `order`.

#### Key-List Rules: Known Keys Without a Full Shape

Four validation rules name an array's keys without declaring a nested shape for them. Each listed key becomes an `unknown` property, instead of the whole field staying `unknown[]`. The rules differ in whether Laravel guarantees a key is present, and the `?` follows that:

| Rule                      | Meaning                                                                                          | PHP                                                                      | TypeScript                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `required_array_keys:a,b` | Every listed key must be present.                                                                | `'permissions' => ['required','array','required_array_keys:read,write']` | `permissions: { read: unknown; write: unknown };`              |
| `in_array_keys:a,b`       | At least one listed key must be present, so no single key is guaranteed.                         | `'config' => ['required','array','in_array_keys:timezone']`              | `config: { timezone?: unknown };`                              |
| `array:a,b`               | Only the listed keys are allowed. Says nothing about presence.                                   | `'preferences' => ['nullable','array:theme,locale']`                     | `preferences?: { theme?: unknown; locale?: unknown } \| null;` |
| `array_keys:a,b`          | Only the listed keys are allowed, and at least one must be present. No single key is guaranteed. | `'attributes_map' => ['required','array_keys:color,size']`               | `attributes_map: { color?: unknown; size?: unknown };`         |

A field can combine a key-list rule with a declared child rule, and the two merge. On a name collision, the declared child sets the type and the `?`. A listed key with no child rule stays `unknown`:

```php
'shipping' => ['required', 'array', 'required_array_keys:method,address'],
'shipping.method' => ['nullable', 'in:standard,express'],
```

The declared child wins for `method`:

```typescript
shipping: { method?: 'standard' | 'express' | null; address: unknown };
```

`method` keeps its own type and `?` from `'shipping.method'`, even though `required_array_keys` also names it. `address` has no rule of its own, so it stays `unknown`, and it's required because `required_array_keys` requires it.

### JSDoc Metadata Annotations

Some rules add a JSDoc tag above the field, alongside any effect they have on its type:

| Rules                                                                                                              | Annotation                            |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `email`, `url`, `active_url`, `uuid`, `ulid`, `ip`, `ipv4`, `ipv6`, `mac_address`, `hex_color`                     | `@format {rule}`                      |
| `date`, `date_equals`                                                                                              | `@format date`                        |
| `exists:table,column` or `Rule::exists(...)`                                                                       | `@constraint exists`                  |
| `unique:table,column` or `Rule::unique(...)`                                                                       | `@constraint unique`                  |
| `required_if`, `required_unless`, `required_with`, `required_without`, `required_with_all`, `required_without_all` | `@metadata required-conditionally`    |
| `Rule::requiredIf(...)` or `Rule::requiredUnless(...)`                                                             | `@metadata required-if conditional`   |
| `Rule::prohibitedIf(...)` or `Rule::prohibitedUnless(...)`                                                         | `@metadata prohibited-if conditional` |
| `Rule::excludeIf(...)` or `Rule::excludeUnless(...)`                                                               | `@metadata exclude-if conditional`    |
| `not_in:a,b,c`                                                                                                     | `@not a, b, c`                        |

For example, an `exists` rule adds a `@constraint` tag:

```php
'category_id' => ['required', 'integer', 'exists:categories,id'],
```

The field publishes with the tag:

```typescript
/** @constraint exists */
category_id: number;
```

An annotation on a nested rule isn't lost when the rule [composes into its parent](#array--nested-rules). It moves to the parent's comment, followed by the full rule key it came from, wildcards included, so you can tell which nested key it describes:

```php
'order.id' => ['required', 'uuid'],
'products.*.contact_email' => ['required', 'email'],
```

Each annotation moves to its parent's comment:

```typescript
export interface StoreOrderRequest {
  /** @format uuid order.id */
  order: { id: string /* … */ };
  /** @format email products.*.contact_email */
  products: { contact_email: string /* … */ }[];
}
```

A `prohibited` nested key is the exception. It and everything under it leave the type, so their annotations go too.

### Overriding Field Types With `#[TsCasts]`

Put `#[TsCasts]` on the `FormRequest` class to override a field's type, mark it optional, or point it at a type you import. It's the same attribute, with the same array shape, that [models](https://tolki.abe.dev/ts/models.html#tscasts) and API resources use. Unlike a [resource's `#[TsCasts]`](https://tolki.abe.dev/ts/api-resources.html#overriding-property-types-with-tscasts), it never adds a field. It only rewrites fields that `rules()` declares. A key that names no rule adds nothing to the interface, though its `import` is still written, which leaves an unused import:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;
use Illuminate\Validation\Rule;

#[TsCasts([
    'status' => "'draft' | 'published' | 'archived'",
    'attributes' => ['type' => 'PostAttributes', 'import' => '@js/types/posts'],
])]
class UpdatePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
            'attributes' => ['sometimes', 'array'],
        ];
    }
}
```

The `import` key writes the import line into the request's file:

```typescript
import type { PostAttributes } from "@js/types/posts";

export interface UpdatePostRequest {
  title?: string;
  status: "draft" | "published" | "archived";
  attributes?: PostAttributes;
}
```

`#[TsCasts]` replaces only a field's type and, through its `optional` key, its `?`. A `nullable` rule on the field still adds `| null` to the override, as the `rating` field in [Anatomy of a Generated Form Request](#anatomy-of-a-generated-form-request) shows.

`#[TsCasts]` keys match the generated field names, and a dot-notation rule key never becomes one, because it [composes into its parent](#array--nested-rules). A key like `'order.id'` or `'tags.*'` matches nothing, is ignored, and adds no field. Override the parent (`'order'` or `'tags'`) to replace the whole shape, or make the rule precise enough not to need an override. The one dotted key that matches is an escaped one: `'v1\.0'` generates the field `"v1.0"`, so a `'v1.0'` cast overrides it.

### Extending Interfaces With `#[TsExtends]`

Form requests support `#[TsExtends]` and the `ts_extends.form_requests` config array, the same interface extension the rest of the package uses. See [Extending Interfaces](https://tolki.abe.dev/ts/extending-interfaces.html) for the attribute and config syntax.

### Dynamic Requests

The package calls `rules()` with no real HTTP request. Inside `rules()`, `Auth::user()` returns a stand-in user whose methods all return `false`, so a rule that branches on a check such as `Auth::user()->isAdmin()` still publishes.

Code that needs a real request, session or signed-in user can't run during a publish. When `rules()` fails that way, for example by reading `$this->user()->id`, the package publishes the whole request as a `Record<string, unknown>` alias instead of failing the run:

```php
class DynamicRequest extends FormRequest
{
    public function rules(): array
    {
        $userId = $this->user()->id; // no user exists while ts:publish runs

        return [
            'name' => ['required', 'string'],
            'user_id' => ['required', 'integer', 'in:'.$userId],
        ];
    }
}
```

The fallback type carries a `@dynamic` tag:

```typescript
/**
 * @see App\Http\Requests\DynamicRequest
 * @dynamic Rules could not be resolved statically.
 */
export type DynamicRequest = Record<string, unknown>;
```

### Filtering & Excluding Form Requests

Form requests use the same include and exclude settings as enums, models and resources. Each list takes class names or directory paths:

```php
// config/ts-publish.php
'form_requests' => [
    'included' => [App\Http\Requests\StorePostRequest::class], // only these (empty = all)
    'excluded' => [App\Http\Requests\InternalRequest::class],   // never publish these
    'additional_directories' => ['modules/Blog/Http/Requests'],
],
```

`#[TsExclude]` on the class excludes the whole request:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

#[TsExclude]
class InternalRequest extends FormRequest
{
    // Not published to TypeScript
}
```

There's no field-level exclusion, because fields are keys in one `rules()` array rather than separate methods. See [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html) for how the attribute works across models, enums, resources and routes.

### Route Integration

When a controller action type-hints a `FormRequest`, the action's route export gets the request's interface through `annotateRequestPayload<T>()`, with no configuration. See [Form Request Payload Types](https://tolki.abe.dev/ts/routing.html#form-request-payload-types) for `annotateRequestPayload` and `InferRequestPayload`.

#### Reading a Single Validated Field

When an action builds an Inertia page prop from `$request->validated('key')`, the request's rules type that prop, so it gets the field's own type instead of `unknown`. A dotted path walks the same nested rules the interface composes, so the prop types exactly as that key does inside the generated shape:

```php
// StorePostRequest::rules() declares:
//   'title' => ['required', 'string'],
//   'options' => ['array'],
//   'options.default' => ['string'],

public function store(StorePostRequest $request): Response
{
    return Inertia::render('Posts/Success', [
        'title' => $request->validated('title'),
        'defaultOption' => $request->validated('options.default'),
    ]);
}
```

Each prop takes its field's type:

```typescript
export type StorePageProps = Inertia.SharedData & {
  title: string;
  defaultOption?: string;
};
```

The parameter has to be the `FormRequest` subclass itself, because `validated()` on a plain `Request` type-hint has no rules to read. API resources don't get this. A resource's `toArray(Request $request)` never sees the request's rules, so the typing covers Inertia page props only.

A top-level key also picks up the request's own [`#[TsCasts]`](#overriding-field-types-with-tscasts). The prop takes the override's type and its `optional` flag, in either direction. If the override has an `'import' => …` entry, the generated file gets that import line. The prop and the interface then describe the field the same way, and a `nullable` rule still adds `| null` after the override, as it does in the interface.

The prop stays `unknown` wherever the rules can't answer with confidence:

- A key your rules never declare, and `validated()` with no argument, which returns the whole payload rather than one field.
- A key marked `prohibited`, or anything under one, since the interface drops that subtree.
- A path with a `*` segment. `validated()` passes the path to `data_get()`, which expands a wildcard into a list, not the single element the wildcard rule describes.
- An [escaped-dot key](#nested-edge-cases) (`'v1\.0'`), which `data_get()` also splits on and can't reach.
- A non-literal key (`validated($column)`), a call that also passes a `default` argument, and any [dynamic request](#dynamic-requests).

An override on a parent key is the one place the prop and the interface disagree. `#[TsCasts(['options' => 'MyOptions'])]` replaces the whole `options` shape in the interface, but `validated('options.default')` still types as `string` from the rule the override replaced. The package can't look inside a hand-written TypeScript type. Read `validated('options')` instead, or make the nested rule precise enough not to need the override. A dot-notation override key such as `'options.default'` is ignored in both places, so those two never disagree. The escaped-dot field is the one dotted key the interface honors, but `validated()` can't reach it, as the list above says.

### Configuration Reference

The [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html) lists every `form_requests.*` key, including the class overrides for customizing the pipeline.

## Cache Generation

After the first full publish, `ts:publish` reuses the previous output of every class whose source hasn't changed, including the files the class depends on. The cache is on by default. It clears itself when you upgrade the package, change your output-affecting config, or edit a template `ts:publish` renders.

The cache settings live in the `cache` block of `config/ts-publish.php`:

```php
// config/ts-publish.php

'cache' => [
    'enabled' => env('TS_PUBLISH_CACHE_ENABLED', true),
    'store' => env('TS_PUBLISH_CACHE_STORE'),
    'directory' => storage_path('framework/cache/ts-publish'),
    'key' => env('TS_PUBLISH_CACHE_KEY'),
],
```

`ts:publish` never rewrites a file whose content hasn't changed, so unchanged files keep their modification time and don't trigger rebuilds in tools like Vite.

### When a Class Is Rebuilt

The package reuses a class's cached output only while nothing it depends on has changed. It rebuilds the class when any of these change:

- **Its PHP files**: the class's own file, or any PHP file the package read to generate it, including parent classes, traits, interfaces, related models, and every enum, service, cast, value object, or helper function whose declared types it used.
- **Its routes**: for a controller, any route that points at it, including its URI, HTTP methods, name, domain, controller method, and middleware. Adding or removing a route counts too, so you don't need `--fresh` after editing routes.
- **Its metadata**: for a [model metadata](https://tolki.abe.dev/ts/model-metadata.html#cache) companion, the provider class, or the values it returns for that model. A new morph map alias set in a service provider counts.
- **Its output files**: if you delete a file the class wrote on an earlier run, the class is rebuilt even though its source didn't change.

The whole cache clears, and the next run rebuilds everything, when any of these change:

- **The package version**: after you upgrade or downgrade the package.
- **Your config**: any `ts-publish` setting outside the `cache` block. The order of keys doesn't matter.
- **Your templates**: the template each cached feature renders from its [`*.template` key](https://tolki.abe.dev/ts/customizing-the-pipeline.html#publishing-and-editing-templates), and each view that template includes by name. Publishing an unedited copy doesn't count, but editing or deleting one does.
- **Your database driver**: `database.default`, a connection's driver, or the driver that its `url` names.
- **Your resource wrap key**: a `JsonResource::withoutWrapping()` or `wrap()` call that your service providers make, as [The Wrap Key Your App Sets](https://tolki.abe.dev/ts/api-resources.html#the-wrap-key-your-app-sets) describes.
- **The signing key**: `cache.key`, or `app.key` when `cache.key` isn't set.

Classes you delete from your app drop out of the cache on the next run.

A run limited by an `--only-*` flag, including the `--only-functional` run the [Vite plugin](https://tolki.abe.dev/ts/vite-plugin.html#production-builds) makes on `vite build`, keeps the cache of the features it skips. With `--fresh`, such a run still clears the whole cache.

### What the Cache Can't Detect

Some changes don't touch any file the cache tracks. The cache misses these:

- **Database schema changes**: a model's columns come from your database, not a source file. The automatic post-migration republish always runs with `--fresh`, so it picks up the new schema. If you change the schema another way, run `php artisan ts:publish --fresh`.
- **A view your template includes by a computed name**: the cache doesn't track a view included through a variable, as in `@include($name)`, or a Blade component such as `<x-alert />`. After you edit one, run `php artisan ts:publish --fresh`.
- **Edits to generated files**: if you edit a generated `.ts` file by hand without changing its source, the cache doesn't notice and won't overwrite it. Run `php artisan ts:publish --fresh`, or delete the file, to restore it.
- **A class that didn't exist at the last publish**: if your code names a class before it exists, creating the class later doesn't rebuild the classes that name it. Run `php artisan ts:publish --fresh` after you create it.
- **A long-running worker after a deploy**: a queue or Octane worker that runs `ts:publish` keeps the PHP it loaded, so after a deploy it publishes types from your old code and caches them. Restart your workers after a deploy, as you would for any PHP change. If a worker published before you restarted it, run `php artisan ts:publish --fresh`.
- **Values that can't be serialized**: if your `ts-publish` config holds a value such as a closure, every run rebuilds everything. A model metadata provider that returns such a value rebuilds its companions on every run.

### Forcing a Full Rebuild

Pass `--fresh` to clear the cache, regenerate everything, and write a new cache:

```bash
php artisan ts:publish --fresh
```

`--fresh` has no effect with `--source` or `--preview=true`, because those runs don't use the cache.

### What Bypasses the Cache

The cache is skipped in these cases:

- **`--source` runs**: single-class republishing never reads or writes the cache.
- **`--preview=true` runs**: a preview writes no files, so caching it would record outputs that were never written and make later runs skip them.
- **`cache.enabled` set to `false`**: the cache is off for every run.

### Storage Backends

The cache lives in files by default. You can move it to any Laravel cache store instead.

#### File Backend (Default)

The file cache lives in `storage/framework/cache/ts-publish`. Set `cache.directory` to move it. The package maintains the directory itself:

- **Kept out of git**: the package writes a `.gitignore` into the directory the first time it uses it.
- **Self-healing**: if a cache file fails its signature check or can't be read, the package deletes it, and the next run rebuilds that entry.

#### Laravel Cache Store Backend

Set `cache.store` to the name of a store in your Laravel cache config, such as `redis` or `database`, to keep the cache there:

```dotenv
TS_PUBLISH_CACHE_STORE=redis
```

A store-backed cache behaves like this:

- **Only its own keys**: the package tracks the keys it writes, and clearing the cache removes only those keys. It never touches other entries in a shared store.
- **No expiry**: entries are stored forever, because the package tracks staleness itself.

### Payload Signing & Security

Both backends sign every cache entry with an HMAC-SHA256 signature. The key is `cache.key`, or `app.key` when `cache.key` isn't set.

The package checks the signature before it reads an entry. An entry with a missing or wrong signature, or with corrupt data, is treated as missing, and the class is rebuilt. Rotating the key has the same effect on every entry, so the next run rebuilds everything once.

If neither `cache.key` nor `app.key` is set, entries are stored unsigned, and the package can't detect a tampered entry. In practice, that means an app that hasn't run `php artisan key:generate`.

When `cache.store` points at a Laravel cache store (`redis`, `database`, `file`, and so on), the store unserializes its own values when it reads them. By default, when Laravel's `cache.serializable_classes` is unset, it allows PHP classes, and it does this before the package checks the signature. The signature still protects the data, but it can't stop object creation at the cache layer. If the store is shared or not fully trusted, set Laravel's `cache.serializable_classes` to `false` or to an allowlist, or use a dedicated, trusted store. The default file backend isn't affected.

### Caching a Custom Generator

The built-in generators all work with the cache. A custom `*.generator_class` that extends one of them inherits that support. A generator written from scratch needs the `RehydratesFromCache` trait, or it's rebuilt on every run. See [Cache-Compatible Generators](https://tolki.abe.dev/ts/customizing-the-pipeline.html#cache-compatible-generators-rehydratesfromcache).

If your generator's output depends on something that isn't a PHP file, such as a database value or an API response, implement `ProvidesCacheSignature`. Return a string that changes whenever that input changes, and the package rebuilds the class when it does:

```php
use AbeTwoThree\LaravelTsPublish\Cache\Contracts\ProvidesCacheSignature;
use AbeTwoThree\LaravelTsPublish\Generators\ModelGenerator;
use Illuminate\Support\Facades\DB;

class LabelledModelGenerator extends ModelGenerator implements ProvidesCacheSignature
{
    public static function cacheSignature(string $fqcn): string
    {
        return (string) DB::table('labels')->max('updated_at');
    }
}
```

Register the class with its `*.generator_class` key, `models.generator_class` in this example.

The route and model metadata generators already implement `ProvidesCacheSignature`, which is how route and metadata changes rebuild their classes. If you extend one of them and override `cacheSignature()`, include `parent::cacheSignature($fqcn)` in the string you return, or those changes stop rebuilding the class.

### Configuration

| Config Key        | Type      | Default                              | Description                                                                                                                                                                     |
| ----------------- | --------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cache.enabled`   | `bool`    | `true`                               | Turn the generation cache on or off. Set with `TS_PUBLISH_CACHE_ENABLED`.                                                                                                       |
| `cache.store`     | `?string` | `null`                               | `null` keeps the cache in files under `directory`. Set a Laravel cache store name (`redis`, `database`, and so on) to keep it there instead. Set with `TS_PUBLISH_CACHE_STORE`. |
| `cache.directory` | `string`  | `storage/framework/cache/ts-publish` | Where the file backend keeps the cache.                                                                                                                                         |
| `cache.key`       | `?string` | `null`                               | The HMAC signing key. Falls back to `app.key` when unset. Changing it rebuilds everything once. Set with `TS_PUBLISH_CACHE_KEY`.                                                |

## Inertia

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) reads the `share()` method of your `HandleInertiaRequests` middleware and writes `inertia-config.d.ts`. That file declares a global `Inertia.SharedData` type and augments `@inertiajs/core`, so every Inertia page gets typed shared props without a type you maintain by hand.

This page covers shared data, and the API resources that shared data and a route's page props hold. A route's own page props, meaning the `component` field and the page-props type on its route helper, are covered in [Inertia Integration](https://tolki.abe.dev/ts/routing.html#inertia-integration) on the Routing page.

### How the Augmentation File Is Generated

With `inertia.enabled` on (the default), the package builds the file from your middleware:

- **Finding the middleware**: the package searches `inertia.inertia_middleware_path`, or `app_path()` when that isn't set, for a class that extends `Inertia\Middleware`. If it finds none, it writes no file. If your app has more than one such class, point `inertia.inertia_middleware_path` at the directory that holds the one you want.
- **Reading `share()`**: every key's value is typed from your code, without handling a real request. A `share()` that a trait supplies is read too, and so is one that builds its array in a variable and returns it. A key that the variable gets on only some paths, such as inside an `if`, is optional.
- **Parent middleware**: a `...parent::share($request)` spread and `array_merge(parent::share($request), [...])` are both read, all the way up your middleware's parent classes. A later key overrides an earlier one and keeps the earlier one's position, as PHP does.
- **Integer keys**: Inertia merges shared data and page props with `array_merge()`, which renumbers integer keys from `0`. A top-level `42 => …` key therefore publishes as `"0"`, and `ts:publish` warns that you probably meant a string key. Nested keys keep theirs.
- **`$request->user()`**: typed through your live auth config, from `auth.defaults.guard` to that guard's provider to the provider's `model`. The prop becomes `User | null`, and the file imports the model's type for you. `auth()->user()`, `auth()->id()`, `Auth::user()` and `Auth::id()` resolve the same way.
- **Request helpers**: `$request->url()`, `fullUrl()`, `path()`, `integer()`, `boolean()`, `string()`, `cookie()` and `hasCookie()` are typed from Laravel's own signatures.
- **`config()`**: `config('some.key')` with a literal key is typed from the live config value, since the package runs inside your booted app. A computed key stays `unknown`.
- **Value helpers**: `now()` and `today()` are typed as `string`, or `Date` under [`timestamps_as_date`](https://tolki.abe.dev/ts/models.html#timestamps-as-date-objects). `str($value)` is typed as `string`, and `str()` with no argument as `Record<string, never>`. `url($path)` is typed as `string` when the path can't be `null`, and stays `unknown` when it can or has no type. `collect([...])` and a bare array literal are both typed as the list or object the array encodes as, such as `string[]` for `['a', 'b']`. `+` on two arrays is typed as PHP's array union, where the left side's keys win.
- **Closures and first-class callables**: Inertia calls a callable prop before it sends it, so closures and first-class callables, such as `fn () => $request->url()` and `now(...)`, are typed from what the call returns.
- **Inertia v2 prop wrappers**: `Inertia::defer()`, `optional()`, `lazy()`, `always()`, `merge()` and `deepMerge()` type as the value they wrap. The three a partial reload can leave out, `defer`, `optional` and `lazy`, make the key optional.
- **API resources**: a resource or resource collection is typed as the response Inertia sends for it, as [API Resources in Props](#api-resources-in-props) describes.
- **`EnumResource` props**: a prop that wraps an enum in `EnumResource`, such as `'role' => EnumResource::make(Role::Admin)`, becomes `AsEnum<typeof Role>` when `enums.use_tolki_package` is on (the default), the same as in [API Resources](https://tolki.abe.dev/ts/api-resources.html#enum-properties-with-enumresource). With it off, the key keeps the enum's type alias (`role: RoleType`). The change applies per key, so another key that reads the enum directly keeps `RoleType`.
- **Enum cases**: a bare case, such as `'defaultStatus' => Status::Draft`, is typed as the enum's type alias (`defaultStatus: StatusType`), which matches the value Laravel sends for a backed enum. The file imports the alias for you.
- **`errors`**: left out. `@inertiajs/core` already types `page.props.errors` as `Errors & ErrorBag`, and [`errorValueType`](#anatomy-of-the-generated-file) sharpens it. A `#[TsCasts]` or `@return` docblock entry named `errors` still adds one if you want it.
- **The output file**: the result is written to `inertia-config.d.ts`. Set `inertia.augmentation_filename` to change the name.

`auth()->id()` and `Auth::id()` publish the type of the column the auth model identifies users by, with `| null`. That's the model's key, such as `number | null`, unless the model's `getAuthIdentifierName()` returns a literal column name. A model whose `getAuthIdentifierName()` returns `'email'` publishes `string | null`. An identifier column cast to an enum publishes `unknown`.

When the package can't create an instance of the model, it reads the key type from the class, and publishes `unknown` if code works the key out. A `getAuthIdentifierName()` that works the column out in code, such as from config, publishes `unknown` too, and so does an override of `getAuthIdentifier()`, since only running your app shows which value the ID holds.

In a route's [page props](https://tolki.abe.dev/ts/routing.html#inertia-integration), `getKey()` on a route-bound model publishes the model's key type with no `| null`, because Laravel binds only a saved row. With a `Post $post` action parameter, `'post_id' => $post->getKey()` publishes `post_id: number`.

A key whose ternary arms wrap different enums, such as `$cond ? EnumResource::make(Role::Admin) : EnumResource::make(Status::Draft)`, renders as `RoleType | StatusType` with no import for either name. Your build then fails with a `TS2304` error for each. Give both arms the same enum, or override that key with a `#[TsCasts]` entry that has an `import`.

### Anatomy of the Generated File

Given this middleware:

```php
class HandleInertiaRequests extends Middleware
{
    protected $withAllErrors = true;

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => ['user' => $request->user()],
            'ziggy' => fn () => ['location' => $request->url()],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state'),
            'appName' => config('app.name'),
        ];
    }
}
```

The package generates `inertia-config.d.ts`:

```typescript
import type { User } from "./app/models";

declare global {
  namespace Inertia {
    type SharedData = {
      auth: { user: User | null };
      ziggy: { location: string };
      sidebarOpen: boolean;
      appName: string;
    };
  }
}

declare module "@inertiajs/core" {
  export interface InertiaConfig {
    sharedPageProps: {
      auth: { user: User | null };
      ziggy: { location: string };
      sidebarOpen: boolean;
      appName: string;
    };
    errorValueType: string[];
  }
}

export {};
```

Each part of the file does one job:

- **`import type { User } from "./app/models";`**: every model, resource or enum that a prop type names gets an import at the top, with a path relative to the output root. An `EnumResource` prop is the exception under the default `enums.use_tolki_package`. It renders as `AsEnum<typeof Role>`, so the enum's const is imported as a value (`import { Role } from './app/enums';`), under an `import { type AsEnum } from '@tolki/ts';` line, and both come before the `import type` lines. Imports from an `import` key in `#[TsCasts]` join the `import type` lines.
- **`declare global { namespace Inertia { type SharedData = ...; } }`**: makes `Inertia.SharedData` available by name in any `.ts` file in your project. That includes the generated route files, which combine it with each page's props, as [Inertia Integration](https://tolki.abe.dev/ts/routing.html#inertia-integration) shows.
- **`declare module '@inertiajs/core' { ... }`**: augments Inertia's own `InertiaConfig`, so `usePage().props` is typed across your frontend without you writing the augmentation.
- **`errorValueType: string[]`**: added only when the middleware sets `protected $withAllErrors = true;`. It matches the shape Inertia uses for its validation errors in that mode.
- **`export {};`**: TypeScript accepts a `declare global` block only in a module, a file with at least one top-level `import` or `export`. This line makes the file a module even when it has no imports.

The file imports only the names its types use. A key you override with `#[TsCasts]` drops the import its inferred type needed.

A key that isn't a plain identifier, such as `'can-edit'` or `42`, is quoted, as in `"can-edit": boolean`. Route files quote a page prop's key the same way.

A value the package can't read stays `unknown`. `'flash' => ['success' => fn () => $request->session()->get('success')]` would publish `flash: { success: unknown }`, because `session()` isn't one of the typed request methods. Give such a key its type with [`#[TsCasts]` or a `@return` docblock](#type-resolution-priority).

### Type Resolution Priority

Each key from `share()` takes its type from the first of these that covers it:

1. **`#[TsCasts]`** on the middleware class or on its `share()` method. When both name a key, the method's entry wins, even when the two spell an index signature's name differently. It's the same attribute [models](https://tolki.abe.dev/ts/models.html#tscasts), [API resources](https://tolki.abe.dev/ts/api-resources.html#overriding-property-types-with-tscasts) and [broadcast events](https://tolki.abe.dev/ts/broadcast-events.html#overriding-property-types-with-tscasts) use.
2. **A `@return array{...}` docblock** on `share()`. You write the shape by hand, for a key the package can't infer, such as a method call whose return type says nothing. A `key?:` entry makes that key optional.
3. **Inference from your code**, the default. It covers plain values, nested arrays, conditionals, closures, spreads, `array_merge()`, `config()`, the request and auth helpers, and Inertia's prop wrappers.

A key that `#[TsCasts]` or the docblock names but `share()` doesn't return is added to the type.

In a `#[TsCasts]` entry, `'optional' => true` adds a `?` and `'optional' => false` removes one. An entry that leaves out `'optional'` takes the flag from the next source down. For an entry on `share()`, that's first the class's entry for the same key, if it sets `'optional'`. Next comes the docblock, where `key?:` makes the key optional and `key:` makes it required. Inference decides a key neither names.

An entry on a controller method for a route's [page props](https://tolki.abe.dev/ts/routing.html#overriding-props-with-tscasts) takes `'optional'` the same way. Without it, the prop keeps its own `?`.

In this middleware, one key takes its type from each override:

```php
#[TsCasts(['appName' => 'string'])]
class HandleInertiaRequests extends Middleware
{
    /**
     * @return array{flash: array{success: string|null, error: string|null}}
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'appName' => config('app.name'),
            'flash' => $this->resolveFlashMessages($request), // a method whose return type says nothing
        ];
    }
}
```

Here `appName` takes its type from `#[TsCasts]` and `flash` takes its type from the `@return` docblock. Any other key that `share()` returns falls back to inference.

### API Resources in Props

Inertia sends an API resource prop as the resource's whole response, the same JSON a route that returns the resource sends. That holds at any depth of a route's page props and in `share()`, so each prop publishes that response:

```php
return Inertia::render('Posts/Show', [
    'post' => new PostResource($post),
    'comments' => CommentResource::collection($post->comments),
    'tags' => new TagCollection($post->tags),
]);
```

The page-props type matches what Inertia sends:

```typescript
export type ShowPageProps = Inertia.SharedData & {
  post: { data: PostResource };
  comments: AnonymousResourceCollection<CommentResource>;
  tags: TagCollection;
};
```

Each kind of prop follows its own rule:

- **A single resource**, from `new`, `make()`, or `toResource()`, publishes `{ data: PostResource }`, because Laravel sends it under the `data` key. Code that reads `props.post.title` doesn't compile, since Laravel sends the title at `props.post.data.title`. A resource whose `toArray()` already returns its wrap key, such as `data`, isn't wrapped again, and `EnumResource::make()` keeps `AsEnum<typeof Role>`, because `EnumResource` turns wrapping off.
- **`Resource::collection()`** publishes `AnonymousResourceCollection<CommentResource>` from `@tolki/types`, which is `{ data: CommentResource[] }`.
- **A named collection** publishes its own interface, which already holds its wrap key. One whose `toArray()` returns no wrap key publishes `{ data: TagCollection }`, because Laravel nests that body under `data`.
- **`->toResourceCollection()`** with no argument publishes the collection Laravel guesses. Over an empty collection, Laravel skips the guess and sends `{ data: [] }`, so the prop also publishes that empty response, such as `UserCollection | { data: never[] }` or, over `paginate()`, `| JsonResourcePaginator<never>`. A guessed collection whose response is only its `data` list already fits it and gets no extra type.

The wrap key is the one your app sets by the time `ts:publish` runs, as [The Wrap Key Your App Sets](https://tolki.abe.dev/ts/api-resources.html#the-wrap-key-your-app-sets) describes. After `JsonResource::withoutWrapping()`, a single resource publishes the bare `PostResource`, and `Resource::collection()` over items that aren't paginated publishes `CommentResource[]`. Over a paginator, Laravel keeps the `data` key. After `JsonResource::wrap('items')`, a single resource publishes `{ items: PostResource }`.

Some props publish less than Inertia sends. The keys that `additional()` or a resource's `with()` method add beside `data` aren't published, and after `JsonResource::withoutWrapping()` those keys still make Laravel nest the resource under `data`, while the package publishes it bare. `Resource::collection(...)->additional(...)` publishes `unknown`. Props that another class's method builds, as in `Inertia::render('Posts/Show', $this->props->build())`, publish each API resource inside them bare, though Inertia sends it under `data`. Type such a prop with [`#[TsCasts]`](https://tolki.abe.dev/ts/routing.html#overriding-props-with-tscasts).

#### JSON:API Resources in Props

A [JSON:API resource](https://tolki.abe.dev/ts/api-resources.html#json-api-resources) prop publishes the document Inertia sends, with the document types from `@tolki/types`. Here `PostResource` extends `JsonApiResource`, and its one relationship, `author`, is a `UserResource`:

```php
return Inertia::render('Posts/Index', [
    'post' => new PostResource($post),
    'posts' => PostResource::collection(Post::all()),
    'paged' => PostResource::collection(Post::query()->paginate(10)),
]);
```

The page-props type names each document:

```typescript
export type IndexPageProps = Inertia.SharedData & {
  post: JsonApiDocument<PostResource, UserResource>;
  posts: JsonApiCollection<PostResource, UserResource>;
  paged: JsonApiPaginator<PostResource, UserResource>;
};
```

The second type parameter lists every resource object that an `?include=` request can add to `included`, a union when there are several, through the relationships of each related resource too. A related model with no JSON:API resource of its own adds Laravel's fallback, such as `JsonApiResourceObject<"reports">`. Over `simplePaginate()` and `cursorPaginate()`, the prop publishes `JsonApiSimplePaginator` and `JsonApiCursorPaginator`. `toResource()` and `toResourceCollection()` publish the same documents.

After `JsonResource::withoutWrapping()`, `PostResource::collection()` over items that aren't paginated publishes the bare `PostResource[]`. A request with `?include=`, or any request once `JsonApiResource::configure()` sets the `jsonapi` member, still sends it under `data`, and the published type doesn't cover that.

### Preserve-Keys Resource Collections in Page Props

This section covers resource collections in a route's page props. A collection that `share()` returns is typed the same way. See [Inertia Integration](https://tolki.abe.dev/ts/routing.html#inertia-integration) for how page props are typed in general.

A `ResourceCollection`, or a resource collected with `Resource::collection()`, can keep its source collection's keys through the `#[PreserveKeys]` attribute or the older `public $preserveKeys = true;` property. Laravel then serializes its `data` as a JSON object keyed by those keys, not as an array. A paginated page prop backed by such a collection types `data` to match:

```typescript
import type { JsonResourcePaginator } from "@tolki/types";

// $wrap = null (flat), or Resource::collection($paginator) on a preserve-keys resource:
export type TeamsPageProps = Inertia.SharedData & {
  teams: Omit<JsonResourcePaginator<Team>, "data"> & {
    data: Record<string, Team>;
  };
};
```

`JsonResourcePaginator<T>` types its `data` as `T[]` (see [Paginated Collections](https://tolki.abe.dev/ts/api-resources.html#paginated-collections) on the API Resources page), so a key-preserving collection can't use it as is. The page-props type drops the array `data` with `Omit` and adds a keyed `Record<string, T>` in its place. Over `simplePaginate()` or `cursorPaginate()`, it starts from `JsonResourceSimplePaginator<T>` or `JsonResourceCursorPaginator<T>` instead.

A named collection that wraps its items in a `data` key, such as `new TeamCollection($paginator)`, doesn't need this. Its page prop is the collection's own interface plus pagination (`TeamCollection & ResourcePagination`), and that interface already types `data` as `Record<string, T>` when the collection keeps keys, paginated or not. Only the flat collection and the anonymous `Resource::collection()` form need the `Omit<...> & { data: Record<...> }` shape.

#### Paginating Inline in the Render Call

You don't have to assign a paginator to a variable first. Both of these produce the same page-props type:

```php
// Through a variable
$teams = Team::query()->paginate(10);

return Inertia::render('Teams/Index', [
    'teams' => new TeamCollection($teams),
]);

// Inline, with no variable
return Inertia::render('Teams/Index', [
    'teams' => new TeamCollection(Team::query()->paginate(10)),
]);
```

Both forms give the collection's interface plus pagination:

```typescript
export type IndexPageProps = Inertia.SharedData & {
  teams: TeamCollection & ResourcePagination;
};
```

`paginate()`, `simplePaginate()`, and `cursorPaginate()` are all recognized, in the `new SomeCollection(...)`, `SomeResource::collection(...)`, and `->toResourceCollection()` forms.

Each paginator sends its own `meta` block, so each gets its own type from `@tolki/types`. A named collection adds the pagination type to its own interface. An anonymous collection, from `SomeResource::collection(...)`, publishes the paginator's whole response, and so does a collection with `$wrap = null`, because Laravel sends it under `data` over a paginator. In this list, the named form comes first, and `R` is the collected resource:

- `paginate()`: `TeamCollection & ResourcePagination`, or `JsonResourcePaginator<R>`.
- `simplePaginate()`: `TeamCollection & ResourceSimplePagination`, or `JsonResourceSimplePaginator<R>`.
- `cursorPaginate()`: `TeamCollection & ResourceCursorPagination`, or `JsonResourceCursorPaginator<R>`.

A prop that can hold more than one paginator kind, such as a ternary over `paginate()` and `simplePaginate()`, publishes `TeamCollection & (ResourceSimplePagination | ResourcePagination)`. One that can hold a plain collection or a paginator publishes both shapes, `TeamCollection | (TeamCollection & ResourcePagination)`. A collection that `share()` returns is typed the same way.

When the package doesn't see a paginator, the prop doesn't lose its type. It gets the collection's type without the pagination part, which is wrong rather than missing. The package sees a paginator that a query chain starting at the model returns, such as `Post::query()->simplePaginate(10)`, or one held in a local variable assigned that way. It doesn't follow a paginator from a query builder held in a variable, from a controller method such as `$this->page()`, or from a method of an injected service:

```php
$q = Post::query();

return Inertia::render('Posts/Index', [
    'posts' => new PostCollection($q->paginate(10)), // not detected
]);
```

Here `posts` types as `PostCollection`, without `& ResourcePagination`, and the same paginator passed without a resource publishes `unknown`. Build the paginator in the props, or type the prop with [`#[TsCasts]`](https://tolki.abe.dev/ts/routing.html#overriding-props-with-tscasts).

### Output Location

The package writes the augmentation file to the first of these directories that's set:

1. `inertia.output_directory`.
2. `routes.output_directory`. Route files reference `Inertia.SharedData`, so when you move them, the augmentation file follows.
3. The global `output_directory`.

### Configuration Reference

The [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html) lists every `inertia.*` key, including `component_casing` and `ui_table_package`, which apply to route page props.

## Modular Publishing

The package writes every TypeScript file into a directory tree that mirrors your PHP namespaces. There's no flat-output mode, and no setting to turn this off. Modular and domain-driven apps, such as those built with [InterNACHI/modular](https://github.com/InterNACHI/modular), keep each module's types together, and a single-namespace app gets one `app/` tree. Models, enums, resources, form requests, broadcast events, and routes all follow the same rule.

### Output Structure

An app with an `App` namespace and a second `Accounting` module produces a tree like this:

```text
resources/js/types/data/
├── app/
│   ├── enums/
│   │   ├── role.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── user.ts
│   │   ├── admin/
│   │   │   ├── store.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── events/
│   │   ├── OrderShipped.ts
│   │   ├── UserRegisteredEvent.ts
│   │   └── index.ts
│   └── http/
│       ├── controllers/
│       │   ├── post-controller.ts
│       │   └── index.ts
│       ├── requests/
│       │   ├── store-post-request.ts
│       │   └── index.ts
│       └── resources/
│           ├── user-resource.ts
│           └── index.ts
├── accounting/
│   ├── enums/
│   │   ├── invoice-status.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── invoice.ts
│   │   ├── payment.ts
│   │   └── index.ts
│   └── http/
│       └── resources/
│           ├── invoice-resource.ts
│           └── index.ts
├── broadcast-channels.ts
├── broadcast-events.ts
├── echo-broadcast-events.d.ts
├── inertia-config.d.ts
├── vite-env.d.ts
└── laravel-ts-collected-files.json
```

Each namespace directory gets a barrel `index.ts` that exports every file in it. See [Barrel Files](#barrel-files).

A broadcast event's file is named after its PHP class, such as `OrderShipped.ts` rather than `order-shipped.ts`. Every other feature kebab-cases its file names.

The files at the root of the tree combine output from many classes, so they don't belong to a namespace directory. Each one has a config key to rename it. This table shows the default names and the setting that turns each file on:

| File                              | Turned On By                                 | Default |
| --------------------------------- | -------------------------------------------- | ------- |
| `broadcast-channels.ts`           | `broadcast_channels.enabled`                 | On      |
| `broadcast-events.ts`             | `broadcast_events.enabled`                   | On      |
| `echo-broadcast-events.d.ts`      | `broadcast_events.echo_augmentation.enabled` | On      |
| `inertia-config.d.ts`             | `inertia.enabled`                            | On      |
| `vite-env.d.ts`                   | `vite_env.enabled`                           | On      |
| `laravel-ts-collected-files.json` | `watcher.enabled`                            | On      |
| `laravel-ts-global.ts`            | `globals.enabled`                            | Off     |
| `laravel-ts-definitions.json`     | `json.enabled`                               | Off     |

Three of these files are skipped when there's nothing to declare. `echo-broadcast-events.d.ts` needs at least one broadcast event, `inertia-config.d.ts` needs the package to find your Inertia middleware, and `vite-env.d.ts` needs a `VITE_` variable in your env file. With no channels or no events, `broadcast-channels.ts` and `broadcast-events.ts` are still written, each as an empty module (`export {};`).

The Echo augmentation declares types for the Echo package your `package.json` has: `@laravel/echo-vue`, `@laravel/echo-react`, or `@laravel/echo-svelte`, falling back to `@laravel/echo`. To pick one yourself, set `broadcast_events.echo_augmentation.echo_package`.

### How Output Paths Are Built

The package builds each file's directory from its class's namespace:

1. It drops the class name and keeps the namespace.
2. It removes `namespace_strip_prefix` from the start of the namespace, if the namespace starts with it. See [Stripping a Namespace Prefix](#stripping-a-namespace-prefix).
3. It kebab-cases each namespace segment on its own, then joins the segments with `/`.

The file name is the kebab-cased class name, except for broadcast events:

| PHP Class                           | Output File                            |
| ----------------------------------- | -------------------------------------- |
| `App\Models\User`                   | `app/models/user.ts`                   |
| `App\Enums\Role`                    | `app/enums/role.ts`                    |
| `Accounting\Models\Invoice`         | `accounting/models/invoice.ts`         |
| `Shipping\Enums\ShipmentStatus`     | `shipping/enums/shipment-status.ts`    |
| `App\Domain\Billing\Models\Invoice` | `app/domain/billing/models/invoice.ts` |

#### Nested Namespaces

A namespace of any depth becomes nested directories. `App\Models\Admin\Store` produces an `admin/` directory inside `app/models/`:

```text
app/models/
├── admin/
│   ├── store.ts
│   └── index.ts
├── user.ts
└── index.ts
```

### Automatic Relative Imports

Generated files import each other with relative paths, which the package works out from the two namespace paths. You don't need to configure a path alias for them:

| From          | To              | Result             |
| ------------- | --------------- | ------------------ |
| `blog/models` | `blog/models`   | `.`                |
| `blog/models` | `blog/enums`    | `../enums`         |
| `app/models`  | `blog/enums`    | `../../blog/enums` |
| `models`      | `models/videos` | `./videos`         |

A path into a directory below starts with `./`, because TypeScript reads a bare specifier such as `videos` as a package import. Any other path climbs one `../` per directory level, then descends to the target.

This is how `accounting/models/invoice.ts` imports from another module, a sibling namespace, and its own namespace:

```typescript
// accounting/models/invoice.ts

import type { User } from "../../app/models"; // another module
import type { InvoiceStatusType } from "../enums"; // sibling namespace (accounting/enums)
import type { Payment } from "."; // same namespace (accounting/models)

export interface Invoice {
  id: number;
  user_id: number;
  status: InvoiceStatusType;
  // ...
}

export interface InvoiceRelations {
  user: User;
  payments: Payment[];
  // ...
}
```

### Stripping a Namespace Prefix

If your modules share a namespace prefix, such as `Modules\`, remove it from the output paths with the `namespace_strip_prefix` option:

```php
// config/ts-publish.php

'namespace_strip_prefix' => 'Modules\\',
```

The prefix comes off the start of each matching namespace before the path is built:

| PHP Class                        | Without a Prefix                    | With `'Modules\\'`          |
| -------------------------------- | ----------------------------------- | --------------------------- |
| `Modules\Blog\Models\Article`    | `modules/blog/models/article.ts`    | `blog/models/article.ts`    |
| `Modules\Shipping\Enums\Carrier` | `modules/shipping/enums/carrier.ts` | `shipping/enums/carrier.ts` |

The default is an empty string, which strips nothing.

### Barrel Files

Each namespace directory gets a barrel `index.ts` that re-exports every file in it, sorted alphabetically with no duplicates. This is `accounting/models/index.ts`:

```typescript
export * from "./invoice";
export * from "./payment";
```

A barrel lets you import from a namespace directory instead of from each file. These imports use the `@data` alias from [Importing the Published Files](https://tolki.abe.dev/ts/index.html#importing-the-published-files):

```typescript
import type { User, Order } from "@data/app/models";
import type { Invoice } from "@data/accounting/models";
import type { InvoiceStatusType } from "@data/accounting/enums";
```

Models, enums, resources, form requests, broadcast events, and routes each write their own barrels. A route barrel re-exports each controller's default export by name, such as `export { default as PostController } from './post-controller';`, rather than using `export *`. That keeps two controllers with a method of the same name from clashing.

`ts:publish --preview=true` prints each barrel's contents under its own label, such as `Model Barrel Files:` or `Enum Barrel Files:`, next to the per-class files. A verbose run, `ts:publish -v`, lists each barrel file's path in its Extras table.

Model interfaces and [model metadata](https://tolki.abe.dev/ts/model-metadata.html) companions (`_meta` files) share their namespace directory, so they share one barrel. Each export in it belongs to one of the two, and a run rebuilds the exports of each one it publishes. These rules decide which exports a run keeps:

- An export for a model you removed disappears on the next run.
- If an `--only-*` flag skips one of the two while it's enabled in config, its exports stay.
- If one of the two is disabled in config, its exports are removed.
- If a model's metadata provider throws, that model keeps its previous companion export, and the command exits with an error. See [Failures](https://tolki.abe.dev/ts/model-metadata.html#failures).

Barrels are generated files. The package doesn't keep comments or lines you add to them, and `--source` runs never change them.

### Applies Across Every Feature

Namespace paths work the same way for every feature that publishes one file per class:

- [Models](https://tolki.abe.dev/ts/models.html): the model's interfaces, such as `{Model}`, `{Model}Mutators`, `{Model}Relations`, and `{Model}Resource`, and its `{model}_meta.ts` [model metadata](https://tolki.abe.dev/ts/model-metadata.html) companion.
- [Enums](https://tolki.abe.dev/ts/enums.html): the enum object and its type aliases.
- [API Resources](https://tolki.abe.dev/ts/api-resources.html): resource interfaces.
- [Form Requests](https://tolki.abe.dev/ts/form-requests.html): request payload interfaces.
- [Broadcast Events](https://tolki.abe.dev/ts/broadcast-events.html): event interfaces.
- [Routing](https://tolki.abe.dev/ts/routing.html): route helper files, one per controller, at `{namespace path}/{controller-name}.ts`.

The [root-level files](#output-structure) don't use namespace paths, because each one combines output from many classes.

## Pre-Command Hook

Register a closure with `LaravelTsPublish::callCommandUsing()` to run your own code right before `ts:publish` does its work. Use it to build directory lists, swap pipeline classes, or react to feature flags and the environment. The closure runs only when the command runs, not when the service provider boots, so it adds nothing to a normal web request.

Register the hook in a service provider's `boot()` method:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        // Runs only when `php artisan ts:publish` runs.
        config()->set('ts-publish.models.additional_directories', [
            'modules/Blog/Models',
            'modules/Shop/Models',
        ]);
    });
}
```

### When the Hook Runs

The hook runs before anything else in `ts:publish`, before the command reads `--source` or checks its `--only-*` flags. It runs the same way for every kind of invocation:

| Invocation                                                | Hook Runs |
| --------------------------------------------------------- | --------- |
| `php artisan ts:publish` (full publish)                   | Yes       |
| `php artisan ts:publish --source=App\Models\User`         | Yes       |
| `php artisan ts:publish --preview=true`                   | Yes       |
| Automatic republish after `migrate` (`run_after_migrate`) | Yes       |

The closure receives no arguments, so it can't tell which invocation started it. That matters for `--source` reruns. The Vite plugin runs one each time you save a PHP file during `vite dev`, as [Single-File Republishing](https://tolki.abe.dev/ts/vite-plugin.html#single-file-republishing) describes.

To skip expensive work on those reruns, such as a filesystem scan, check a condition the closure can see for itself. A cached scan result or an environment variable both work.

### Registration Behavior

The hook follows these rules:

- **One closure at a time**: calling `callCommandUsing()` again replaces the registered closure. Closures don't stack or chain.
- **Runs on every invocation**: the same closure runs in full each time the command runs. It isn't cleared after its first run.
- **Nothing by default**: until you call `callCommandUsing()`, no hook runs.
- **Config is loaded**: the closure can read and set any `ts-publish.*` key with `config()->set()`, because Laravel's config is fully loaded when it runs.

### Resetting the Hook Between Tests

A registered closure stays registered for the rest of the PHP process, even when Laravel boots a fresh application for each test. A closure registered in a service provider's `boot()` is registered again on each boot, which replaces the previous one. A closure you register inside a test stays active until something registers another closure.

To clear it after each test, register a closure that does nothing:

```php [Pest]
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;

afterEach(function () {
    LaravelTsPublish::callCommandUsing(fn () => null);
});
```

```php [PHPUnit]
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;

protected function tearDown(): void
{
    LaravelTsPublish::callCommandUsing(fn () => null);

    parent::tearDown();
}
```

### Use Cases

The examples below all register the hook in a service provider's `boot()` method.

#### Dynamic Directory Discovery

The most common use is scanning the filesystem, so `additional_directories` stays current as you add or remove modules. This example finds each module's `Models` and `Enums` directories:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use Symfony\Component\Finder\Finder;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        $find = fn (string $name) => collect(
            Finder::create()->directories()->in(base_path('modules'))->name($name)->depth(1)
        )->map(fn ($dir) => $dir->getPathname())->values()->all();

        config()->set('ts-publish.models.additional_directories', $find('Models'));
        config()->set('ts-publish.enums.additional_directories', $find('Enums'));
    });
}
```

#### Modular Package Integration

A module manager such as `nwidart/laravel-modules` knows which modules are enabled. Read its registry instead of scanning the filesystem, so only enabled modules contribute directories:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use Nwidart\Modules\Facades\Module;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        $enabledPaths = collect(Module::allEnabled())
            ->map(fn ($module) => $module->getPath())
            ->values()
            ->all();

        config()->set('ts-publish.models.additional_directories', collect($enabledPaths)
            ->map(fn (string $path) => "{$path}/Models")
            ->all());

        config()->set('ts-publish.enums.additional_directories', collect($enabledPaths)
            ->map(fn (string $path) => "{$path}/Enums")
            ->all());
    });
}
```

When you disable a module, its types drop out of the next publish with no config change. A module without a `Models` or `Enums` directory is skipped, because collectors ignore paths that don't exist.

#### Conditionally Swapping Pipeline Classes

The hook runs before `ts:publish` reads any `*_class` key, so it can swap a [pipeline](https://tolki.abe.dev/ts/customizing-the-pipeline.html) class based on conditions at run time. This example uses a lighter transformer in CI, where the full analysis isn't needed:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use App\TypeScript\CiModelTransformer;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        if (env('CI')) {
            config()->set('ts-publish.models.transformer_class', CiModelTransformer::class);
        }
    });
}
```

#### Feature-Flag-Driven Publishing

With [Laravel Pennant](https://laravel.com/docs/pennant), or any other feature-flag package, you can publish a module's types only once its feature is active:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use Laravel\Pennant\Feature;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        if (Feature::active('new-billing-module')) {
            config()->set('ts-publish.models.additional_directories', [
                ...config('ts-publish.models.additional_directories'),
                'modules/Billing/Models',
            ]);
        }
    });
}
```

## Routing

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) generates a TypeScript route helper for every controller action your routes point to. A helper builds the action's URL, binds its parameters, adds query strings and spoofs form methods, so your frontend never hand-writes a URL. The helpers follow [Laravel Wayfinder](https://github.com/laravel/wayfinder)'s conventions and work with Inertia the same way.

The generated files stay small. Each action is one call to [`defineRoute`](#anatomy-of-defineroute), and the URL-building logic lives once in the `@tolki/ts` runtime instead of being repeated for every route. Install `@tolki/ts` alongside the Laravel package, as [Installing `@tolki/ts`](https://tolki.abe.dev/ts/index.html#installing-tolki-ts) describes.

This is how you call the helper generated for a `PostController`:

```typescript
import { PostController } from "@js/types/data/app/http/controllers";

PostController.update({ post: 42 }); // { url: '/posts/42', method: 'put' }
PostController.update(post); // pass a Post object directly
PostController.update.form({ post: 42 }); // { action: '/posts/42?_method=PUT', method: 'post' }
```

### How Routes Are Generated

The package writes one TypeScript file for each controller that has at least one publishable route. The files follow these rules:

- **One file per controller**: the path comes from the namespace, so `App\Http\Controllers\PostController` becomes `app/http/controllers/post-controller.ts`.
- **One export per action**: each action is a `const` named after the controller method, not the Laravel route name. The file's `default` export holds every action, keyed by method name.
- **Reserved words**: a method named after a JavaScript reserved word, such as `delete`, is exported as `deleteMethod`. The default export still keys it as `delete`, so `ItemController.delete()` works.
- **Duplicate routes**: when several routes point at the same controller method, you get one export. A named route wins over an unnamed one.
- **`HEAD` routes**: Laravel registers `HEAD` for every `GET` route, so a `GET` helper also has `.head()` and `.form.head()`.
- **Skipped routes**: a route defined with a closure has no controller, so it gets no helper. Fallback routes get none either.
- **Excluded actions**: `#[TsExclude]` on a controller or a method leaves it out. See [Filtering & Excluding Routes](#filtering--excluding-routes).

Each namespace directory gets an `index.ts` barrel. Unlike the barrels for models, enums and resources, a route barrel re-exports only each controller's default export. That keeps controllers that share method names, such as `index` and `show`, from colliding:

```typescript
// app/http/controllers/index.ts
export { default as PostController } from "./post-controller";
export { default as UserController } from "./user-controller";
```

An invokable controller exports its `__invoke` action as the default, so you call the controller itself. If other methods on it have routes too, they're properties of that default, such as `DashboardController.refresh()`:

```typescript
import DashboardController from "@js/types/data/app/http/controllers/dashboard-controller";

DashboardController(); // { url: '/dashboard', method: 'get' }
```

### Anatomy of `defineRoute`

Each action in a generated file is one `defineRoute()` call:

```typescript
export const show = defineRoute({
  name: "posts.show", // the Laravel route name, left out when the route has none
  url: "/posts/{post}", // the URI template, or {domain}{uri} for a domain route
  domain: "api.example.com", // only on a domain-restricted route
  methods: ["get", "head"] as const,
  args: [{ name: "post", required: true, _routeKey: "id" }] as const,
  component: "PostShow", // only on an Inertia route
});
```

`defineRoute()` returns a callable object with these members:

| Member                                             | Description                                                                                                                                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `route(...)`                                       | Returns `{ url, method }` for the route's primary (first declared) HTTP method.                                                                                                                           |
| `route.url(...)`                                   | Takes the same arguments and returns only the URL string.                                                                                                                                                 |
| `route.get(...)`, `route.post(...)`, …             | One method per declared HTTP verb, each returning `{ url, method }` for that verb.                                                                                                                        |
| `route.form(...)`                                  | Builds `{ action, method }` for an HTML `<form>`. See [Building Forms](#building-forms).                                                                                                                  |
| `route.form.put(...)`, `route.form.delete(...)`, … | Form variants per verb, with Laravel's `_method` spoofing added.                                                                                                                                          |
| `route.definition`                                 | The metadata object passed to `defineRoute()`.                                                                                                                                                            |
| `route.component`, `route.withComponent(...)`      | On an Inertia route only. See [Inertia Integration](#inertia-integration).                                                                                                                                |
| `route.toString()`                                 | Returns the URL built with no arguments, so `` `${PostController.index}` `` works in a template literal. A route with a required parameter throws, unless a [route default](#route-defaults) supplies it. |
| `route(...).toString()`                            | Returns the call's URL, so `` `${PostController.show(42)}` `` gives `/posts/42`.                                                                                                                          |

### Calling a Route

Every helper accepts the same calling conventions, so use whichever reads best at the call site:

```typescript
// Named object
PostController.show({ post: 42 });

// Positional arguments
PostController.show(42);

// Positional array
PostController.show([42]);

// An object with an `id` or the route's binding key
PostController.show(post); // post = { id: 42, title: '...' }
```

A route with several parameters takes them the same ways, by position or by name:

```typescript
UserPostController.show({ user: 2, post: 42 });
UserPostController.show(2, 42);
UserPostController.show([2, 42]);
UserPostController.show(someUser, somePost);
```

A lone object such as `PostController.show(post)` works only for a route with exactly one parameter. The object needs an `id`, a `_routeKey`, or the property the route binds by, such as `slug`.

#### Trailing Query Options

Every calling convention accepts a trailing object whose keys become query parameters. See [Query Parameters](#query-parameters) for how values are encoded:

```typescript
PostController.show.url(42, { preview: true }); // '/posts/42?preview=1'
PostController.show.url({ post: 42 }, { preview: true }); // '/posts/42?preview=1'
```

A helper treats the last argument as options only when you pass more arguments than the route has parameters. That last argument also has to be a plain object that holds none of the route's parameter names.

### Model Binding

When a route parameter is type-hinted with an Eloquent model, its `args` entry gets a `_routeKey`. That key names the column the model binds by, as in Laravel's [route model binding](https://laravel.com/docs/routing#route-model-binding):

```typescript
// Route::get('/slug-posts/{slugPost:slug}', ...)
args: [{ name: "slugPost", required: true, _routeKey: "slug" }] as const,
```

At the call site, pass the key's value or the model object. The helper reads the property `_routeKey` names, falls back to `id`, and throws when the object has neither:

```typescript
CustomRouteKeyController.show({ slugPost: "hello-world" });
CustomRouteKeyController.show(post); // post = { slug: 'hello-world', ... }
```

The parameter's type comes from the `args` metadata alone. It accepts the key's value, or any object with that key or an `id`, so binding a model never imports the model's TypeScript type into the route file. A route file imports a model type only when an Inertia page prop names it, as [Inertia Integration](#inertia-integration) shows.

The key is the one Laravel binds by. A `{post:slug}` segment names it directly. Otherwise it's whatever the model's `getRouteKeyName()` returns, so overriding `getRouteKeyName()`, `getKeyName()` or `$primaryKey` changes it. So does the `#[RouteKey('slug')]` attribute on its own (Laravel 13.21 and later). See [Laravel 13 Model Attributes](https://tolki.abe.dev/ts/models.html#laravel-13-model-attributes).

### Enum Binding

A route parameter type-hinted with a [backed enum](https://www.php.net/manual/en/language.enumerations.backed.php) gets the enum's backing values instead of a route key:

```typescript
args: [{ name: "status", required: true, _enumValues: [0, 1] }] as const,
```

Pass a backing value, or any object with a `value` property, such as a case resolved from a `defineEnum()` enum:

```typescript
EnumBoundController.byStatus({ status: 0 }); // a backing value
EnumBoundController.byStatus({ status: Status.Active }); // an enum case value
EnumBoundController.byStatus({ status: Status.from(0) }); // a defineEnum() instance
```

As with model binding, the route file imports no enum, because TypeScript infers the allowed values from `_enumValues`. A parameter typed with a pure enum, one with no backing values, is a plain parameter that takes any string or number.

### Optional Parameters & `where` Constraints

A `{param?}` segment becomes an optional parameter in both the named and positional forms:

```typescript
export const show = defineRoute({
  url: "/optional/{param?}",
  methods: ["get", "head"] as const,
  args: [{ name: "param", required: false }] as const,
});

OptionalParamController.show.url(); // '/optional'
OptionalParamController.show.url({ param: "x" }); // '/optional/x'
```

A parameter constrained with `->where(...)` carries its pattern, and the helper throws when a value doesn't match:

```typescript
// args: [{ name: "id", required: true, where: "[0-9]+" }]
TypedParamController.showInt({ id: "abc" });
// Error: Route error: 'id' parameter 'abc' does not match required format '[0-9]+'.
```

### Domain Routes

A route restricted to a domain gets a `domain` field. Its URL is protocol-relative, so it works in `fetch()` or an `<a href>` with whatever protocol the current page uses:

```typescript
export const index = defineRoute({
  url: "api.example.com/domain",
  domain: "api.example.com",
  methods: ["get", "head"] as const,
});

DomainController.index.url(); // '//api.example.com/domain'
```

### Query Parameters

An argument key that doesn't match a route parameter becomes a query parameter:

```typescript
PostController.index.url({ q: "search", page: 2 }); // '/posts?q=search&page=2'
```

Values are encoded the way Laravel reads query input:

- **Booleans**: `true` and `false` become `1` and `0`.
- **Arrays**: indexed keys, as in `tags[0]=a&tags[1]=b`.
- **Objects**: bracketed keys, as in `filter[status]=active`.
- **`null` and `undefined`**: left out of the query string.

When a query key has the same name as a route parameter, put it under `_query`:

```typescript
// PostController.sorted is the route /posts/sort/{sort}
PostController.sorted.url({ sort: "created_at", _query: { sort: "desc" } });
// '/posts/sort/created_at?sort=desc'
```

To change one key of the current page's query string and keep the rest, pass `mergeQuery`. A `null` or `undefined` value removes that key. On a route with parameters, pass `mergeQuery` in the trailing options object:

```typescript
// current URL: /posts?sort=name&page=3
PostController.index.url({ mergeQuery: { page: 1 } });
// '/posts?sort=name&page=1'

PostController.show.url({ post: 42 }, { mergeQuery: { tab: "comments" } });
```

### Route Defaults

As with Laravel's [`URL::defaults()`](https://laravel.com/docs/urls#default-values), you can set a parameter value once. Every helper then uses it wherever that parameter is required but not passed:

```typescript
import { setRouteDefaults, addRouteDefault } from "@tolki/ts";

setRouteDefaults({ locale: "en" });
addRouteDefault("locale", "fr"); // overwrite a single key
```

`setRouteDefaults()` also accepts a function, which runs each time a helper builds a URL. `getRouteDefaults()` returns the current defaults, and `resetRouteDefaults()` clears them, which helps in test setup and teardown.

### Building Forms

`.form(...)` builds `{ action, method, toString() }` for a classic HTML `<form>`. HTML forms submit only `GET` and `POST`, so `method` is always `'get'` or `'post'`. As in Wayfinder, the bare call spoofs the route's primary method for you:

```typescript
const { action, method } = PostController.store.form();
// action: '/posts', method: 'post'

PostController.update.form({ post: 42 });
// { action: '/posts/42?_method=PUT', method: 'post' }, spoofing the primary PUT

PostController.destroy.form({ post: 42 });
// { action: '/posts/42?_method=DELETE', method: 'post' }, spoofing the primary DELETE
```

Use a per-verb variant only when a route accepts several verbs and you want to submit as one that isn't its primary. The variants are `.form.put(...)`, `.form.patch(...)`, `.form.delete(...)`, `.form.get(...)` and `.form.head(...)`:

```typescript
// A route registered for PUT and PATCH, with PUT as its primary method
PostController.update.form(); // spoofs _method=PUT
PostController.update.form.patch({ post: 42 }); // spoofs _method=PATCH instead
```

`GET` and `POST` never get a `_method`, since HTML forms support both. `.form.head(...)` submits as a `'get'` form with `_method=HEAD`, because a form can't send `HEAD`.

### Inertia Integration

With `inertia.enabled` on (the default), each action that renders an Inertia page gets a `component` field and a page-props type. The generated file applies the typing helpers for you:

```typescript
export type PostPageProps = Inertia.SharedData & { post: Post };

export const post = annotatePageProps<PostPageProps>()(
  defineRoute({
    name: "inertia.post",
    url: "/inertia/post/{post}",
    methods: ["get", "head"] as const,
    args: [{ name: "post", required: true, _routeKey: "id" }] as const,
    component: "PostShow",
  }),
);
```

The package reads `Inertia::render()`, the `inertia()` helper and `inertia()->render()`. The component name has to be a string literal, so a render call that builds the name at runtime gets no `component` field or page-props type. Only Inertia responses are typed. An action that returns JSON or a view gets a route helper with no response type.

`Inertia.SharedData` holds the props your middleware shares with every page. See [Inertia](https://tolki.abe.dev/ts/inertia.html) for how the package types it.

Read the page-props type back with `InferPageProps<typeof route>`, for example to type a page component's props without a separate import:

```typescript
import type { InferPageProps } from "@tolki/ts";
import { post } from "@js/types/data/app/http/controllers/inertia-controller";

type Props = InferPageProps<typeof post>; // PostPageProps
```

#### Conditional (Multi-Component) Routes

An action that renders different components on different branches, for example by auth state, gets a `component` map and a union of page-props types:

```typescript
export type ConditionalAuthenticatedPageProps = Inertia.SharedData & {
  user: User | null;
};
export type ConditionalGuestPageProps = Inertia.SharedData & {
  message: string;
};

export const conditional = annotatePageProps<
  ConditionalAuthenticatedPageProps | ConditionalGuestPageProps
>()(
  defineRoute({
    url: "/inertia/conditional",
    methods: ["get", "head"] as const,
    component: {
      authenticated: "Conditional/Authenticated",
      guest: "Conditional/Guest",
    } as const,
  }),
);
```

Each map key is the component's last path segment, cased by `inertia.component_casing` (camel by default). When two components share a last segment, the keys take in more of the path until they differ.

`route.component` holds the whole map. `route.withComponent(component, ...args)` returns the call result with a `component` key. Use it to record which variant a call represents, for logging or for picking the frontend component to render. It takes a value from the map, such as `'Conditional/Authenticated'`, not a key. On a single-component route, `route.component` is the name, and `route.withComponent(...args)` takes only the route arguments.

Two renders of the same component merge into one page-props type instead of a union. A key that only one of them sets becomes optional, since that branch leaves it out.

#### What the Props Expression Can Be

The package reads the props argument as an expression, not only as an array literal, so common controller code types without annotations:

```php
public function show(Post $post, Request $request): Response
{
    return Inertia::render('Posts/Show', [
        'post' => $post,
        'comments' => Comment::query()->latest()->get(),
        'author' => $request->user(),
        'page' => $request->integer('page'),
        'related' => Post::query()->paginate(10),
        'tally' => Inertia::defer(fn () => Comment::query()->count()),
    ]);
}
```

This generates:

```typescript
export type ShowPageProps = Inertia.SharedData & {
  post: Post;
  comments: Comment[];
  author: User | null;
  page: number;
  related: LengthAwarePaginator<Post>;
  tally?: number;
};
```

These expressions are typed:

- **Eloquent finders and collections**, typed from the model the chain starts at. `find()`, `first()` and `firstWhere()` are `Model | null`. `findOrFail()`, `firstOrFail()`, `sole()`, `create()`, `make()`, `firstOrCreate()`, `firstOrNew()` and `updateOrCreate()` are `Model`. `all()` and `get()` are `Model[]`. `paginate()`, `simplePaginate()` and `cursorPaginate()` are `LengthAwarePaginator<Model>`, `SimplePaginator<Model>` and `CursorPaginator<Model>`, imported from `@tolki/types`. `count()` is `number` and `exists()` is `boolean`.
- **Route-bound model parameters**: a `Post $post` parameter is `Post` wherever a prop uses it.
- **PHP enums**: a prop holding an enum is the enum's `{Name}Type` alias, imported from the generated [enums](https://tolki.abe.dev/ts/enums.html). That includes a bare case, such as `'status' => Status::Active`. A rename with [`#[TsEnum]`](https://tolki.abe.dev/ts/enums.html#tsenum) carries over, so `#[TsEnum(name: 'Size')] enum ShirtSize` gives you `size: SizeType`.
- **`$request->user()`**, typed through your `auth` config the same way [shared data](https://tolki.abe.dev/ts/inertia.html) is, and the typed `Request` reads such as `integer()`, `boolean()`, `string()` and `url()`.
- **`compact()` and `array_merge()`**: passed as the whole props argument, as in `Inertia::render('Posts/Show', compact('post', 'comments'))` or `array_merge($base, [...])`, each types the same as the array literal it builds.
- **Inertia v2 prop wrappers**: `defer()`, `optional()` and `lazy()` type as the value they wrap and make the key optional, since a partial reload can leave it out. `always()`, `merge()` and `deepMerge()` type as the value they wrap.
- **API resources and resource collections**, typed as the response Inertia sends for each, such as `{ data: PostResource }` for a single resource and `JsonResourceSimplePaginator<PostResource>` over `simplePaginate()`, including a `#[PreserveKeys]` collection's keyed `data` member. See [API Resources in Props](https://tolki.abe.dev/ts/inertia.html#api-resources-in-props).
- **A props array assigned from a ternary**, or props built whole by a method on an injected service, as in `Inertia::render('Posts/Show', $this->service->build())`.
- **Closures and first-class callables**: Inertia calls a callable prop, so `fn () => $this->label()` and `$this->label(...)` are both typed from what the call returns. In props that another class's method or a controller helper method builds, a first-class callable publishes `Record<string, never>` and `ts:publish` warns, even though Inertia does call it. Use a closure there.

If two enums in different namespaces share a class name, such as `App\Enums\Status` and `App\Billing\Status`, both publish as `StatusType`. A route file whose props use both imports `StatusType` twice, and TypeScript rejects it as a duplicate identifier. Rename one with `#[TsEnum]` to keep them apart.

A prop the package can't read is typed `unknown`, and the run carries on. Use [`#[TsCasts]`](#overriding-props-with-tscasts) to set its type.

Inertia merges shared data and page props with `array_merge()`, which renumbers integer keys from `0`. A top-level `42 => …` key therefore publishes as `"0"`, and `ts:publish` warns that you probably meant a string key. Nested keys keep theirs.

Sometimes the package can't analyze an action at all, for example because a class the action depends on fails to load. That route then publishes as a plain helper with no page-props type, and `ts:publish` names the action in a warning after the run. The rest of the run still finishes.

#### Overriding Props With `#[TsCasts]`

When the package can't see the type you want, add `#[TsCasts]` to the controller method. Each key replaces that prop's type, and a key the render call doesn't set is added. The other props keep their inferred types:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

#[TsCasts([
    'stats' => '{ views: number; likes: number }',
    'meta' => ['type' => 'PageMeta', 'import' => '@/types/pages'],
])]
public function index(): Response
{
    return Inertia::render('Dashboard', [
        'title' => 'Dashboard',
        'stats' => $this->legacyStats(),
    ]);
}
```

An entry's `'optional' => true` makes the prop optional, and an entry that leaves out `'optional'` keeps the prop's own `?`.

The `import` key writes the import line into the route file:

```typescript
import type { PageMeta } from "@/types/pages";

export type IndexPageProps = Inertia.SharedData & {
  title: string;
  stats: { views: number; likes: number };
  meta: PageMeta;
};
```

### Inertia UI Table Props

A route that renders an [Inertia UI Table](https://inertiaui.com/) gets a typed page prop. The package reads the table's model from the table class itself, and never creates the table or calls its `toArray()`:

```php
use App\Tables\PostTable;
use Inertia\Inertia;

public function index()
{
    return Inertia::render('Posts/Index', [
        'posts' => PostTable::make()->defaultSort('-id'),
    ]);
}
```

The page prop is `TableResource<TModel>` for the table's model:

```typescript
import type { TableResource } from "@inertiaui/table-vue";
import type { Post } from "../models";

export type IndexPageProps = Inertia.SharedData & {
  posts: TableResource<Post>;
};
```

`TableResource` is imported from whichever Inertia UI Table package your `package.json` lists, `@inertiaui/table-vue` or `@inertiaui/table-react`. If neither is listed, the import uses `@inertiaui/table-vue`. To force a package, or to use an alias, set `inertia.ui_table_package` in `config/ts-publish.php`.

The package finds a table's model in any of these places:

- A `$resource` property default, as in `protected ?string $resource = Post::class;`.
- A `query(): Builder` method that returns `Post::query()`, `Post::class`, or a query chain that starts at the model.
- A service method: when the controller passes `$this->tables->index($request)`, the array that method returns can hold table props.

A table whose model exists only at runtime, for example one set in its constructor, gets no table type. Use [`#[TsCasts]`](#overriding-props-with-tscasts) on the controller method to type its props.

### Sibling Actions on a Table Controller

A controller that renders a table needs no special handling, and neither do its other actions. Each action, such as `create`, `store`, `edit` or `update`, gets its page-props type from its own render call, the same as on a controller with no table.

Because the package never creates a table or calls its `toArray()`, publishing never reaches the table's optional Excel (PhpSpreadsheet) export.

### Form Request Payload Types

With `form_requests.enabled` on (the default), an action whose method type-hints a `FormRequest` gets that request's [generated interface](https://tolki.abe.dev/ts/form-requests.html) attached with `annotateRequestPayload`:

```typescript
export const store = annotateRequestPayload<StorePostRequest>()(
  defineRoute({
    name: "posts.store",
    url: "/posts",
    methods: ["post"] as const,
  }),
);
```

Read it back with `InferRequestPayload<typeof route>`, for example to type an Inertia `useForm()` call:

```typescript
import type { InferRequestPayload } from "@tolki/ts";
import { store } from "@js/types/data/app/http/controllers/post-controller";

const form = useForm<InferRequestPayload<typeof store>>({
  title: "",
  body: "",
});
```

When an action has both a page-props type and a request payload, the generated file nests the two helpers:

```typescript
export const store = annotateRequestPayload<StorePostRequest>()(
  annotatePageProps<StorePageProps>()(
    defineRoute({
      name: "inertia-form-request.store",
      url: "/inertia-form-request",
      methods: ["post"] as const,
      component: "InertiaFormRequest/Success",
    }),
  ),
);
```

### Filtering & Excluding Routes

These settings leave routes out of the published output:

- **`#[TsExclude]`**: on a controller class it excludes every action. On a method it removes that one route, with no helper and no page-props type.
- **`routes.only` and `routes.except`**: route-name patterns with wildcards (`'posts.*'`) and negation (`'!posts.index'`). A negated pattern beats a matching one, and a list of negations alone matches every name it doesn't negate. `routes.only` matches names, so it never includes an unnamed route. If you set both, `routes.only` wins and `routes.except` is ignored.
- **`routes.exclude_middleware`**: skips every route that uses one of the listed middleware. An entry has to match the middleware exactly as the route declares it, so `'throttle'` doesn't match `'throttle:api'`.
- **`routes.only_named`**: when `true`, publishes only the routes that have a `->name(...)`.

This config publishes the `posts.*` routes except `posts.destroy`, and skips any route behind the `internal` middleware:

```php
// config/ts-publish.php
'routes' => [
    'only' => ['posts.*', '!posts.destroy'],
    'exclude_middleware' => ['internal'],
],
```

See [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html) for `#[TsExclude]` across every feature.

### Casing

`routes.method_casing` sets the casing of each action's exported name: `'camel'` (the default), `'snake'` or `'pascal'`. Any other value keeps the method name as written. The setting changes only the generated name, never the Laravel route name, and the default export still keys each action by its PHP method name.

### Configuration Reference

The [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html) lists every `routes.*` and `inertia.*` key, including the class overrides for customizing the pipeline.

### Type Reference

The functions come from `@tolki/ts`. The types come from `@tolki/ts` or the types-only `@tolki/types`:

| Export                                                                                    | Description                                                                                                             |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `defineRoute()`                                                                           | Builds a route helper from route metadata.                                                                              |
| `annotatePageProps<T>()`                                                                  | Attaches an Inertia page-props type to a route. Generated files apply it for you.                                       |
| `annotateRequestPayload<T>()`                                                             | Attaches a form request payload type to a route. Generated files apply it for you.                                      |
| `InferPageProps<T>`                                                                       | Reads a route's page-props type.                                                                                        |
| `InferRequestPayload<T>`                                                                  | Reads a route's request payload type.                                                                                   |
| `setRouteDefaults()`, `addRouteDefault()`, `getRouteDefaults()`, `resetRouteDefaults()`   | Manage the global route parameter defaults.                                                                             |
| `formSafeOptions()`                                                                       | Adds `_method` spoofing to a set of query options. `.form()` uses it, and you can call it for a form you build by hand. |
| `RouteArgMeta`, `RouteMetadata`, `RouteQueryOptions`, `RouteComponentType`                | The metadata shapes `defineRoute()` accepts.                                                                            |
| `DefineRouteResult`, `RouteCallResult`, `RouteFormResult`, `RouteCallResultWithComponent` | The shapes of a route helper and its call results.                                                                      |

## Vite Env

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) reads the `VITE_` variables from your project's `.env` file and generates a `vite-env.d.ts` declaration file. The file augments Vite's own `ImportMetaEnv` interface, so `import.meta.env.VITE_APP_NAME` is typed on the frontend without a declaration file you maintain by hand.

The feature is on by default. It needs no `@tolki/ts` runtime, no attributes, and no per-class configuration.

### Anatomy of the Generated File

Given a `.env` file that contains these variables:

```dotenv
APP_NAME=MyApp
DB_CONNECTION=mysql
VITE_APP_NAME="${APP_NAME}"
```

The package generates this `vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

The output follows three rules:

- **Only `VITE_` variables**: `APP_NAME` and `DB_CONNECTION` are skipped. This matches [Vite's own convention](https://vite.dev/guide/env-and-mode.html#env-files) for which environment variables reach client-side code.
- **Merged with Vite's types**: `/// <reference types="vite/client" />` pulls in Vite's own ambient types, so these `ImportMetaEnv` and `ImportMeta` declarations merge with Vite's base declarations instead of replacing them.
- **Always `string`**: every variable is typed as `string`, whatever its value in `.env` (`true`, `123`, and so on), because Vite exposes `.env` values in `import.meta.env` as strings.

If the source file doesn't exist, or it has no `VITE_` variables, no file is written.

### Source File Resolution

The package reads the first source file it finds, in this order:

1. **`vite_env.source_file`**, if you set it. It can be an absolute path, or a path relative to the project root.
2. **`.env`**, if it exists at the project root.
3. **`.env.example`**, as the fallback. This helps in CI or a fresh clone, where the gitignored `.env` may not exist yet but the committed `.env.example` does.

This example reads a production env file instead:

```php
// config/ts-publish.php

'vite_env' => [
    'source_file' => '.env.production',
],
```

### Parsing Rules

The package reads variable names only, one line at a time, with these rules:

- Each line is trimmed before it's checked.
- Blank lines and lines that start with `#` are skipped.
- A line with no `=` is skipped, because there's no name to read.
- The name is everything before the first `=`. Values, quotes, and inline comments aren't read or validated.
- Only names that start with `VITE_` are kept. Everything else, such as `APP_NAME` and `DB_CONNECTION`, is ignored.
- The names are sorted alphabetically, and duplicates are removed.

A line written as `export VITE_APP_NAME=MyApp` is skipped, because its name doesn't start with `VITE_`. Remove the `export` prefix to include the variable.

### Output Location

The file goes to `vite_env.output_directory` if you set it, and to the global `output_directory` otherwise. `vite_env.filename` sets the filename, which defaults to `vite-env.d.ts`.

The [Vite plugin](https://tolki.abe.dev/ts/vite-plugin.html) doesn't watch your `.env` file. After you add or remove a `VITE_` variable, run `php artisan ts:publish` to update the declarations.

### No Filtering, Attributes, or Per-Item Config

Vite Env has no PHP classes to publish, so it has no `included`, `excluded`, or `additional_directories` settings and doesn't support `#[TsExclude]`. The same is true of [Broadcast Channels](https://tolki.abe.dev/ts/broadcast-channels.html#no-per-channel-attributes).

To leave a variable out, don't prefix it with `VITE_`. Vite won't expose it to client code either. To turn off the feature, set `vite_env.enabled` to `false`.

### Configuration Reference

The [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html#vite-env-vite-env) lists every `vite_env.*` key.

## Vite Plugin

The `@tolki/ts` package includes a Vite plugin that keeps your published types current. During `vite dev`, it reruns `php artisan ts:publish` when a PHP file collected by the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) changes. During `vite build`, it publishes once before bundling.

The Laravel package publishes a JSON manifest that lists every PHP file it collected. The plugin watches exactly those files, not your whole project.

### Adding the Plugin

Add the plugin to your Vite configuration file:

```typescript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/ts/vite";

export default defineConfig({
  plugins: [laravelTsPublish()],
});
```

#### Laravel Sail

The plugin runs its command in a non-interactive shell from the Vite project root, so shell aliases such as `sail` are usually not available. Choose the command based on where `vite dev` runs:

| Where Vite runs          | Command                                        |
| ------------------------ | ---------------------------------------------- |
| On your host machine     | `./vendor/bin/sail artisan ts:publish`         |
| Inside the PHP container | `php artisan ts:publish`, which is the default |

A bare `sail artisan ts:publish` fails when `sail` is a shell alias, which is how Laravel's Sail documentation sets it up. This example points the plugin at the Sail binary for a Vite dev server on the host:

```typescript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/ts/vite";

export default defineConfig({
  plugins: [
    laravelTsPublish({
      command: "./vendor/bin/sail artisan ts:publish",
    }),
  ],
});
```

### Default Functionality

With no options, the plugin does the following:

- Uses `php artisan ts:publish` as the publish command.
- Reads the list of watched files from `resources/js/types/data/laravel-ts-collected-files.json`.
- Republishes only the changed file with `--source` when a watched PHP file changes during `vite dev`, instead of running a full publish.
- Reloads the page after a successful publish during `vite dev`.
- Queues a file that changes while a publish is running, and republishes it after the current run. Each queued file runs once.
- Reloads the watched file list when the manifest itself changes, without running the publish command again.
- Runs the publish command once before bundling on `vite build`, with `--only-functional` appended.
- Fails `vite build` if the publish command fails. During `vite dev`, it logs the error and keeps running.
- Appends `--quiet` to every command, and includes a failed command's error output in its own error message.

A model metadata provider that throws for a model also fails `vite build`, because `ts:publish` reports the failure on stderr and exits with an error.

#### Production Builds

On `vite build`, the plugin appends `--only-functional`. That flag skips model and resource interfaces, which are type-only and erased at compile time. Everything else still publishes.

Form requests are type-only too, but they still publish. A route whose controller method takes a form request is wrapped in `annotateRequestPayload<T>()` and imports the published form request type. That import depends on `form_requests.enabled` in your config, not on the flags passed to `ts:publish`. Skipping form requests would leave the route importing a file that was never written.

Set `onBuildOnlyFunctional` to `false` to publish everything on build. The [Publishing Types](https://tolki.abe.dev/ts/publishing.html#other-files-in-partial-runs) page lists what an `--only-functional` run does to the other generated files.

#### Single-File Republishing

The manifest lists each collected file's path, so the plugin can republish only the file that changed during development. Instead of a full `php artisan ts:publish`, it runs a targeted command:

```bash
php artisan ts:publish --source=app/Enums/Status.php --quiet
```

A single-file run skips every other class, so it stays fast as your project grows.

The plugin builds this command by appending `--source={file}` to the `command` option. The `{file}` placeholder becomes the file's path from the manifest, already shell-escaped, so don't wrap it in quotes. Set the `sourceCommand` option to use your own template, or set it to `false` to always run the full command.

The runs that `runOnDevStart` and `runOnBuildStart` trigger always use the full `command`, so every file is generated.

#### Manifest Updates

The collected-files manifest tells the plugin which files to watch. It doesn't trigger a publish.

When `ts:publish` rewrites `resources/js/types/data/laravel-ts-collected-files.json`, the plugin refreshes its watched-file list and continues. It doesn't run `ts:publish` again for that write, which prevents a publish loop.

If the manifest doesn't exist when `vite dev` starts, the plugin logs `Manifest not found` and has no files to watch. This happens after a fresh clone when the output directory is in `.gitignore`. Run `php artisan ts:publish` once, then start Vite.

### Plugin Options

The plugin accepts an options object:

| Option                  | Type              | Default                             | Description                                                                                                                                                                                                                                |
| ----------------------- | ----------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `command`               | `string`          | `"php artisan ts:publish"`          | The publish command. It runs in a non-interactive shell from the Vite project root.                                                                                                                                                        |
| `filename`              | `string`          | `"laravel-ts-collected-files.json"` | The filename of the manifest that lists the collected PHP files.                                                                                                                                                                           |
| `directory`             | `string`          | `"resources/js/types/data/"`        | The directory that holds the manifest, relative to the Vite root.                                                                                                                                                                          |
| `runOnDevStart`         | `boolean`         | `false`                             | Run the publish command once when `vite dev` starts. No effect during `vite build`.                                                                                                                                                        |
| `runOnBuildStart`       | `boolean`         | `true`                              | Run the publish command once before bundling during `vite build`. No effect during `vite dev`.                                                                                                                                             |
| `reload`                | `boolean`         | `true`                              | Reload the browser after the command succeeds during `vite dev`. No effect during `vite build`.                                                                                                                                            |
| `failOnError`           | `boolean`         | `true` on build, `false` on dev     | Throw an error, which aborts the build, when the command fails. Setting it applies to both `vite dev` and `vite build`.                                                                                                                    |
| `sourceCommand`         | `string \| false` | Derived from `command`              | The command template for single-file republishing during `vite dev`. The default is `command` followed by `--source={file}`. `{file}` becomes the shell-escaped path from the manifest. `false` always runs the full command.              |
| `onBuildOnlyFunctional` | `boolean`         | `true`                              | Append `--only-functional` to the command during `vite build`. No effect during `vite dev`.                                                                                                                                                |
| `quiet`                 | `boolean`         | `true`                              | Append `--quiet` to every command. The plugin reads success or failure from the exit code, and quiet mode skips console rendering, which speeds up each run. A failing command's error output still appears in the plugin's error message. |

The `filename` and `directory` options must match where the Laravel package writes the manifest: `watcher.filename`, and `watcher.output_directory` or `output_directory`. If you change those settings in `config/ts-publish.php`, read the values from `.env` on both sides to keep them in sync.

This example also publishes when the dev server starts, and turns off the browser reload:

```typescript
laravelTsPublish({
  command: "./vendor/bin/sail artisan ts:publish",
  runOnDevStart: true,
  reload: false,
});
```

## Customizing the Pipeline

Models, model metadata, enums, resources, routes, form requests, broadcast channels, and broadcast events all run through the same pipeline. A collector finds your classes, a transformer reads each one, and a writer renders it through a Blade template. To replace a stage, extend the built-in class and point the feature's config key at your class. The other stages keep working as before.

This config swaps the transformer that models use:

```php
// config/ts-publish.php

'models' => [
    'transformer_class' => App\TypeScript\CustomModelTransformer::class,
],
```

If you only want to change how the TypeScript is formatted, you don't need a PHP class. [Publish the templates](#publishing-and-editing-templates) and edit them instead.

### What Each Stage Does

A class passes through these stages in order:

- **Collector**: finds the classes to publish, such as every model in `app/Models`. It applies the feature's `included`, `excluded`, and `additional_directories` settings, and it skips classes marked `#[TsExclude]`.
- **Generator**: publishes one class. It builds a transformer, passes it to a writer, and keeps the file's content. The [generation cache](#cache-compatible-generators-rehydratesfromcache) works at this stage.
- **Transformer**: reads one PHP class and returns a data object that describes the TypeScript to write. It builds no strings.
- **Writer**: renders the transformer's data through a template and writes the file.
- **Template**: the Blade view that holds the TypeScript syntax. You can publish and edit it without touching any other stage.

Broadcast channels aren't classes, so they skip the generator and the transformer.

### Pipeline Stages Per Feature

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

The classes live in the `AbeTwoThree\LaravelTsPublish\Collectors`, `Generators`, `Transformers`, and `Writers` namespaces.

Broadcast events have two more writer keys. `broadcast_events.index_writer_class` writes the combined index file, and `broadcast_events.echo_augmentation.writer_class` writes the Echo module augmentation.

Model metadata is stricter than the other features. A custom `model_metadata.generator_class` must extend `ModelMetadataGenerator`, and a custom `model_metadata.transformer_class` must extend `ModelMetadataTransformer`. If either doesn't, `ts:publish` fails before it writes any file.

Two more keys swap a class that isn't a pipeline stage:

- **`model_metadata.provider_class`**: the class whose `provide($model)` returns each model's metadata values. Most apps customize this one. See [Writing a Provider](https://tolki.abe.dev/ts/model-metadata.html#writing-a-provider).
- **`form_requests.analyzer_class`**: the class that reads a form request's `rules()`. The same class types `$request->validated('key')` in Inertia page props, as [Reading a Single Validated Field](https://tolki.abe.dev/ts/form-requests.html#reading-a-single-validated-field) describes. The published config file has no line for this key, so add it to your `form_requests` block. See the [form request settings](https://tolki.abe.dev/ts/configuration-reference.html#form-requests-form-requests) in the Configuration Reference.

#### Shared & Combined Writers

A few writers don't belong to a single feature. Each one has its own config key:

| Writer              | Config Key             | Writes                                                                                                                                                                                               |
| ------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BarrelWriter`      | `barrel_writer_class`  | The [barrel `index.ts`](https://tolki.abe.dev/ts/modular-publishing.html#barrel-files) in each namespace directory for models, model metadata, enums, resources, form requests, and broadcast events |
| `GlobalsWriter`     | `globals.writer_class` | The global declaration file, which declares your enum, model, resource, form request, and broadcast event types in a global namespace                                                                |
| `JsonWriter`        | `json.writer_class`    | The combined JSON definitions file                                                                                                                                                                   |
| `WatcherJsonWriter` | `watcher.writer_class` | The JSON list of collected file paths that file watchers read                                                                                                                                        |

Route barrels have a different format, so the route writer (`routes.writer_class`) writes them.

If your `barrel_writer_class` overrides `writeModular()`, override `writeModularPreserving()` as well. A run that skips models or model metadata while it's enabled in config, or where a metadata provider fails for a model, writes model barrels through `writeModularPreserving()`. `ts:publish --only-models` does this while model metadata is enabled.

#### Features Without a Swappable Pipeline

Inertia and Vite env have no `*_class` keys, so you can't swap their classes. See the options for [Inertia](https://tolki.abe.dev/ts/inertia.html#configuration-reference) and [Vite Env](https://tolki.abe.dev/ts/vite-env.html#configuration-reference). You can still [edit their templates](#publishing-and-editing-templates).

### Swapping a Transformer

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

#### Changing How a Resource Finds Its Model

A resource transformer is also where you change how resources find their backing model. In your `resources.transformer_class`, override `resolveModelClass()`, set `$this->modelClass`, and return `$this`:

```php
protected function resolveModelClass(): self
{
    parent::resolveModelClass();

    $this->modelClass ??= MyConvention::modelFor($this->reflectionResource);

    return $this;
}
```

The override changes what `ts:publish` writes. [`AstEngine::analyze()`](https://tolki.abe.dev/ts/analyzer-api.html#analyzing-a-method) doesn't use your transformer, so pass the model as its third argument there.

### Abstract Base Classes

Every built-in class extends one of four abstract base classes. To write a class from scratch, extend the matching base class and implement its abstract methods. The [built-in classes](#pipeline-stages-per-feature) are complete examples of each.

#### `CoreCollector<TFindable>`

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

`accepts()` answers whether a class the scan didn't find would still be published if it were named. The package asks it before it publishes a [related model](https://tolki.abe.dev/ts/models.html#related-models-outside-your-directories) that sits outside your directories. If your collector overrides `collect()` to narrow its list, override `accepts()` to match, or the models your list relates to are published too.

A collector reads each directory once per PHP process and reuses that list. `ts:publish` clears the cache at the start of every run, so a publish always sees the files on disk.

Your own code can still see an old list. For example, a test helper or a `tinker` session might call `collect()` or `allows()`, write a PHP file, and call it again. The second call returns the list from before the write. Clear the cache between the write and the second call:

```php
use AbeTwoThree\LaravelTsPublish\Collectors\CoreCollector;

CoreCollector::flushClassMapCache();
```

The method is static on the base class, so one call clears the cache for every collector.

#### `CoreGenerator<TGeneratable>`

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

#### `CoreTransformer<TTransformable>`

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

#### `CoreWriter<TTransformer of CoreTransformer>`

A writer receives its filesystem through the constructor and implements `write()`:

```php
public function __construct(
    protected Filesystem $filesystem,
) {}

abstract public function write(CoreTransformer $transformer): string;
```

`write()` takes a transformer and returns the rendered file content. When `output_to_files` is on, which is the default, it also writes the file to disk.

### Cache-Compatible Generators (`RehydratesFromCache`)

The built-in generators use the `AbeTwoThree\LaravelTsPublish\Generators\Concerns\RehydratesFromCache` trait to take part in the [generation cache](https://tolki.abe.dev/ts/generating-cache.html#caching-a-custom-generator). Add the trait to a custom `*.generator_class` to cache it the same way. The trait adds two methods:

```php
public static function fromCache(string $findable, CoreTransformer $transformer, string $filename): static;

protected function hydrate(string $findable, CoreTransformer $transformer, string $filename): void;
```

On a cache hit, the package builds your generator with `fromCache()`, which skips the constructor. `generate()` doesn't run, so the class isn't transformed again and its file isn't rewritten. `hydrate()` then restores `$findable`, the stored transformer, and the file name. That's what the rest of the run reads from a built-in generator, for example to write barrels. If your generator keeps other state that later steps read, override `hydrate()` to restore it too.

The cache stores the transformer by serializing it. A transformer that holds a value PHP can't serialize, such as a closure, isn't cached, and its class rebuilds on the next run.

A generator without the trait still produces correct output, but it rebuilds on every run instead of coming from the cache.

To add inputs that aren't PHP files to a generator's cache check, such as route definitions, implement `ProvidesCacheSignature`. See [Caching a Custom Generator](https://tolki.abe.dev/ts/generating-cache.html#caching-a-custom-generator).

### Publishing and Editing Templates

To change the generated TypeScript's formatting without writing PHP, publish the package's Blade templates:

```bash
php artisan vendor:publish --tag="laravel-ts-publish-views"
```

The command copies the templates to `resources/views/vendor/laravel-ts-publish`, and Laravel loads your copies ahead of the package's. The next `ts:publish` after you edit one rebuilds the [generation cache](https://tolki.abe.dev/ts/generating-cache.html), so you don't need `--fresh`. The exception is a view your template includes by a computed name, covered in [What the Cache Can't Detect](https://tolki.abe.dev/ts/generating-cache.html#what-the-cache-can-t-detect).

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

Your copies stay as they were when you published them. After you upgrade the package, compare them with the package's new templates and merge the changes. A stale copy can leave out output the new version adds.

## Analyzer API

The analysis that the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) runs on your classes is also available to your own code. `AstEngine::analyze()` takes a class and a method name. It returns the typed properties that method returns, plus the imports those types need. Use it when your own code needs this package's types without a full publish, such as a custom Artisan command or another package.

To change what `ts:publish` itself does, replace one of its stages instead. See [Customizing the Pipeline](https://tolki.abe.dev/ts/customizing-the-pipeline.html).

### Analyzing a Method

`analyze()` reads what a method returns: nested arrays, conditionals, closures, and method calls. It works on any class, whether or not it's a resource. A property read or a method call is typed from the class of the value you call it on, such as `$this->author->name` or a local variable.

Laravel's conditional methods, such as `$this->when()` and `$this->whenLoaded()`, belong to `JsonResource`, so `analyze()` reads them that way only on a resource. On any other class, `$this->when()` is that class's own method. Laravel's `Conditionable::when()`, which events and other classes can use, returns the callback's result or the object itself. The package doesn't type that, so the key comes back `unknown`, as it does in a publish. A resource built around the call is the exception: `UserResource::make($this->when(…))` still comes back optional on any class, though `Conditionable::when()` always sends the key. Write such a key as a ternary, or give it a `#[TsCasts]` entry on the method with `'optional' => false`.

This example analyzes a service class's `toPayload()` method:

```php
use AbeTwoThree\LaravelTsPublish\Ast\AstEngine;

$result = resolve(AstEngine::class)->analyze(App\Services\CartSummary::class, 'toPayload', null, 'app/services');

// $result->properties   => list<{name, type, optional, description}>
// $result->typeImports  => import path => list<type name>
// $result->valueImports => import path => list<enum const name>
```

`analyze()` takes four arguments:

| Argument             | Default     | Description                                                                                                                                                                                                                                                                     |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$class`             | required    | The class to analyze.                                                                                                                                                                                                                                                           |
| `$method`            | `'toArray'` | The method whose return value is analyzed.                                                                                                                                                                                                                                      |
| `$modelClass`        | `null`      | The Eloquent model that `$this->...` reads resolve against. Leave it `null` to bind no model, or to let a `JsonResource` subclass find its own.                                                                                                                                 |
| `$fromNamespacePath` | `''`        | The namespace path of the file you're writing, such as `app/services`. Import paths come back relative to it, as [Automatic Relative Imports](https://tolki.abe.dev/ts/modular-publishing.html#automatic-relative-imports) describes. Pass `''` for a file at your output root. |

`analyze()` writes nothing to disk. The file, its formatting, and any barrel entry are up to you.

`analyze()` and the `AnalysisResult` it returns are the only supported parts of the engine. Every other class under `AbeTwoThree\LaravelTsPublish\Ast`, and every other method on `AstEngine`, is `@internal`. Those change without notice, so code that calls them can break on any update.

#### `AnalysisResult`

`analyze()` returns a readonly `AnalysisResult` with three properties:

```php
public function __construct(
    public array $properties,
    public array $typeImports,
    public array $valueImports,
) {}
```

Each property holds one part of the module you write:

- **`properties`**: a `list<{name, type, optional, description}>` with one entry per key the method returns. `type` is already a TypeScript type string. `optional` is `true` wherever the code can leave the key out, such as a conditional method or a `mergeWhen()`.
- **`typeImports`**: an `import path => list<name>` map of the types that the property types name. Write these as `import type` lines.
- **`valueImports`**: an `import path => list<name>` map of the enum constants that an `AsEnum<typeof X>` wrapper reads. Write these as plain `import` lines, never as `import type`.

Two classes that share an import path merge into one entry, so neither overwrites the other.

The three properties agree with each other, so a module that renders all three as they are compiles:

- **Same-name classes**: two classes with the same short name, such as two `User` models, come back under separate aliases, and the property types use those aliases.
- **`EnumResource` properties**: an `EnumResource::make()` property comes back as `AsEnum<typeof X>`, beside the value import that wrapper needs. With `enums.use_tolki_package` off, it comes back as the plain enum type with a type import, and `valueImports` stays empty.
- **No unused imports**: nothing is imported that no property type names. A name counts wherever it appears in a type, even inside a string, template text, or a comment. A method-level `#[TsCasts]` of `"'User' | 'Admin'"` therefore keeps an unused `User` import, which TypeScript reports only under `noUnusedLocals`.

#### Method Parameters

On a class that isn't a `JsonResource`, `analyze()` reads a parameter typed as `Illuminate\Http\Request`, or a subclass of it, as the request. A call such as `$request->url()` then types as `string`. On a `JsonResource`, it doesn't, so `$request->url()` in `toArray()` is `unknown`.

`analyze()` binds no other parameters. A [model metadata](https://tolki.abe.dev/ts/model-metadata.html) provider shows the difference. `analyze($provider, 'provide')` leaves `$model->getTable()` as `unknown`, while the published companion types it as `string`, because a publish binds the `Model $model` parameter to its declared type. The published companion also applies the `@return` docblock and `#[TsCasts]` on top.

There's no public entry point for an analysis that binds other parameters.

### Analyzing Resources, Models, and Events

A resource works with no extra arguments. A model needs one more, and a broadcast event needs the method name.

#### Resources

Call `analyze()` with a `JsonResource` subclass and leave the other arguments at their defaults. The package finds the resource's model the same way `ts:publish` does, and analyzes `toArray()`:

```php
$result = resolve(AstEngine::class)->analyze(App\Http\Resources\PostResource::class);
```

`analyze()` doesn't use a custom `resources.transformer_class`, so a [`resolveModelClass()` override](https://tolki.abe.dev/ts/customizing-the-pipeline.html#changing-how-a-resource-finds-its-model) doesn't apply here. To choose the model yourself, pass it as the third argument.

Every pattern in [API Resources](https://tolki.abe.dev/ts/api-resources.html) gives the same properties, imports, and optionality as a publish. That includes the `when()` family of conditional methods, `EnumResource::make()`, nested and collection resources, `merge()` and `mergeWhen()`, and relation filters such as `$this->author->only([...])`. The exceptions are a `morphTo` union, a collection that publishes as an alias, class-level and model-level `#[TsCasts]`, a `toResource()` guess by naming convention, and the filled index signature of an interpolated key. [What It Cannot Do](#what-it-cannot-do) covers each one.

A [JSON:API resource](https://tolki.abe.dev/ts/api-resources.html#json-api-resources) returns its resource object, the `id`, `type`, `attributes`, and other members a publish writes, even when it declares a `toArray()`.

To read a resource's `with()`, `resolve()`, or `jsonSerialize()`, pass that method's name as the second argument. `analyze($resource, 'with')` starts from the resource's `$with` property, so a `with()` that returns `parent::with($request)`, or builds on it, returns the `$with` keys. A `resolve()` or `jsonSerialize()` built on the parent's method returns the resource's `toArray()` keys, as Laravel sends them, and a `jsonSerialize()` reads the resource's own `resolve()` when it declares one.

#### Models

A model needs its own class as the third argument. The automatic model lookup runs only for a `JsonResource` subclass, and a model's `toArray()` is Laravel's own method, with nothing in its body to read. Pass the model twice to get the attribute and relation shape that [Models](https://tolki.abe.dev/ts/models.html) publishes from:

```php
$result = resolve(AstEngine::class)->analyze(App\Models\User::class, 'toArray', App\Models\User::class);
```

If you leave the third argument `null`, all three properties come back empty.

#### Broadcast Events

`analyze($event, 'broadcastWith')` returns the payload the package publishes for that event, as [Broadcast Data](https://tolki.abe.dev/ts/broadcast-events.html#broadcast-data) describes. A `broadcastWith()` inherited from a parent class or supplied by a trait counts, as it does when Laravel dispatches the event. The result doesn't include two things a publish adds on top: the event's class-level `#[TsCasts]` overrides, and `Partial<Model>` for a model property.

An event with no `broadcastWith()` anywhere in its class hierarchy is published from its public properties. `analyze()` never falls back to them, so on such an event it returns an empty result, imports included. Only `ts:publish` produces that shape.

### What It Cannot Do

Some shapes come only from a full `ts:publish` run. In these cases, `analyze()` returns something different from the published file, or nothing at all:

**Inertia page props.** [Page props](https://tolki.abe.dev/ts/routing.html#inertia-integration) come from the props argument of an `Inertia::render()` call in a controller action, not from a method's return value. `analyze()` on a controller action returns that method's own return shape, not its page props. There's no public entry point for page props.

**Inertia shared data.** `analyze($middleware, 'share')` returns what inference finds in `share()`. It also leaves out a `#[TsCasts]` on `share()`, though `analyze()` applies one on any other method it analyzes. The published `SharedData` applies `#[TsCasts]` first, then the `@return array{...}` docblock on `share()`, then inference, as [Type Resolution Priority](https://tolki.abe.dev/ts/inertia.html#type-resolution-priority) describes. It also drops the `errors` key that `Inertia\Middleware::share()` adds, because `@inertiajs/core` types `page.props.errors` itself.

For example, a `share()` whose docblock declares `filters?: array<string, string>` and whose body returns `(array) $request->query('filters', [])` comes back from `analyze()` as `filters: unknown[]`. The published `SharedData` has `filters?: Record<string, string>`.

**Form request rules.** A form request's published interface is built from its rules by the class in `form_requests.analyzer_class`, not by `analyze()`. See [Form Requests](https://tolki.abe.dev/ts/form-requests.html). `analyze($request, 'rules')` types the array that `rules()` returns, not the validated payload.

**`morphTo` unions.** `analyze()` can't list the models a `morphTo` relation can hold, because only a publish scans your models for the `morphOne` and `morphMany` relations that point back. The relation is left out of a model's shape, and it comes back `unknown` where a `toArray()` names it. A [`@return MorphTo<A|B, $this>` docblock](https://tolki.abe.dev/ts/models.html#typing-morphto-relations) on the relation method gives both `analyze()` and a publish the union.

**Collections that publish as an alias.** A `ResourceCollection` with no keys beyond its items publishes as a flat alias, `export type X = Y[]`, rather than an interface, when it has `$wrap = null`. After [`JsonResource::withoutWrapping()`](https://tolki.abe.dev/ts/api-resources.html#the-wrap-key-your-app-sets), so does every collection with Laravel's default shape that doesn't redeclare `$wrap`. An alias has no property list or imports to put in an `AnalysisResult`, so all three properties come back empty. `ts:publish` writes the alias.

**Class-level and model-level `#[TsCasts]`.** `analyze()` applies a `#[TsCasts]` on the analyzed method only. `ts:publish` then applies a resource's class-level `#[TsCasts]` and its model's `#[TsCasts]`, types and optionality both. On a `CommentResource` whose class-level casts name `flagged_at` and `metadata`, `analyze()` returns `flagged_at: string | null` and `metadata: unknown[] | null`. The published interface has `flagged_at?: string | null` and `metadata: Record<string, unknown>`.

**Resources guessed by naming convention.** When `toResource()` guesses a resource class by its name, a publish uses the guess only if that resource is published too. `analyze()` accepts any resource class that exists. Where a publish that excludes the guessed resource writes `unknown`, `analyze()` names the resource.

**Filled index signatures.** A `@return` docblock can fill in the value type of an interpolated key's index signature. `analyze()` checks that fill only against the keys the method returns. `ts:publish` also checks it against the extends clause and the `#[TsCasts]` keys: a resource's class-level and model-level ones, or an event's class-level ones. Wherever they could conflict, it resets the fill to `unknown | undefined`, and under an extends clause it always does. See [Interpolated Keys](https://tolki.abe.dev/ts/api-resources.html#interpolated-keys).

On a `#[TsExtends]` resource, `analyze()` returns ``[key: `${string}_tag`]: string | undefined`` where the published interface has `unknown | undefined`.

The difference can also run the other way. Where a key the method returns can't join the fill, `analyze()` returns `unknown | undefined`. Once a class-level or model-level `#[TsCasts]` entry gives that key a type that can join, `ts:publish` joins the fill with it. On a resource whose `_tag` keys only a `@return array<string, string>` docblock types, beside a `main_tag` that only a class-level entry `'main_tag' => 'number'` types, `analyze()` returns ``[key: `${string}_tag`]: unknown | undefined``, and the published interface has ``[key: `${string}_tag`]: string | number | undefined``.

Outside those cases, `analyze()` runs the same inference that resources, broadcast events, model metadata, Inertia page props, and Inertia shared data publish from. What each of those features adds on top is on its own page, linked above.

`analyze()` and `ts:publish` both type the patterns these docs describe. Anything else, such as an expression neither can follow or [a local you reassign](https://tolki.abe.dev/ts/api-resources.html#local-variables-and-narrowing), comes back `unknown` rather than a guess.

Two cases don't widen to `unknown`. [A conditional's default that can't be typed](https://tolki.abe.dev/ts/api-resources.html#passing-a-default-argument) leaves the value's own type in place. [A ternary or `?:` arm that can't be typed is left out](https://tolki.abe.dev/ts/api-resources.html#typing-a-variable-with-var), so `$cond ? $untypable : null` publishes `null`.

### Configuration Reference

`analyze()` has no config keys of its own. It follows the settings you already have, such as `enums.use_tolki_package`, `models.nullable_relations`, `timestamps_as_date`, and `custom_ts_mappings`, so its types match what `ts:publish` writes for [Enums](https://tolki.abe.dev/ts/enums.html), [Models](https://tolki.abe.dev/ts/models.html), and [API Resources](https://tolki.abe.dev/ts/api-resources.html). The full list is in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Configuration Reference

This page lists every option in `config/ts-publish.php`, grouped by feature. To get your own copy of the file, with a comment on each option, publish it:

```bash
php artisan vendor:publish --tag="ts-publish-config"
```

The `*_class` keys swap a class in the publishing pipeline. See [Abstract Base Classes](https://tolki.abe.dev/ts/customizing-the-pipeline.html#abstract-base-classes) for what each class must implement.

### General Settings

| Config Key                    | Type     | Default                   | Description                                                                                                                                                                                                      |
| ----------------------------- | -------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run_after_migrate`           | `bool`   | `true`                    | Republish types with `--fresh` after `migrate` runs migrations. Set with `TS_PUBLISH_RUN_AFTER_MIGRATE`. See [Publishing After Migrations](https://tolki.abe.dev/ts/publishing.html#publishing-after-migrations) |
| `output_to_files`             | `bool`   | `true`                    | Setting it to `false` turns off the post-migration republish. `ts:publish` writes files on every run unless you pass `--preview=true`                                                                            |
| `output_directory`            | `string` | `resources/js/types/data` | Directory where TypeScript files are written                                                                                                                                                                     |
| `namespace_strip_prefix`      | `string` | `''`                      | Prefix removed from class namespaces before they become output paths, such as `'Modules\\'`                                                                                                                      |
| `timestamps_as_date`          | `bool`   | `false`                   | Map date, datetime, and timestamp values, including Carbon instances, to `Date` instead of `string`, except a `timestamp` cast, which is a number                                                                |
| `custom_ts_mappings`          | `array`  | `[]`                      | Override or extend PHP-to-TypeScript type mappings. See [`custom_ts_mappings`](#custom_ts_mappings)                                                                                                              |
| `ts_extends.models`           | `array`  | `[]`                      | Global `extends` clauses for all models                                                                                                                                                                          |
| `ts_extends.resources`        | `array`  | `[]`                      | Global `extends` clauses for all resources                                                                                                                                                                       |
| `ts_extends.form_requests`    | `array`  | `[]`                      | Global `extends` clauses for all form requests                                                                                                                                                                   |
| `ts_extends.broadcast_events` | `array`  | `[]`                      | Global `extends` clauses for all broadcast events                                                                                                                                                                |
| `barrel_writer_class`         | `string` | `BarrelWriter`            | Class that writes barrel `index.ts` files                                                                                                                                                                        |

#### `custom_ts_mappings`

Each entry maps a type name to the TypeScript type it publishes, and it wins over the package's own rule for that name:

- An entry for a cast, such as `'decimal:2'`, overrides that cast's rule. An entry named like both a cast and a column type, such as `'timestamp'` or `'decimal'`, applies to both, and a `'decimal'` entry covers every `decimal:N` cast.
- An entry for a column type, such as `'decimal'` or `'numeric'`, publishes that type on every database driver, for the column and for its `MIN()` and `MAX()` aggregates. `SUM()` and `AVG()` still follow the driver.
- A `DateTime` entry is read as the `datetime` column and cast type, because keys are matched case-insensitively. PHP's `DateTime` class keeps the object `json_encode()` writes for it, but a `DateTime` that a cast class or a new-style accessor returns takes the entry, because Laravel serializes that date as it does a `datetime` column. An entry for `DateTimeImmutable` does retype that class.
- A `Carbon\Carbon` entry retypes `Carbon\Carbon`, `CarbonInterface` and a subclass with no entry of its own, and a date a cast class or a new-style accessor returns whose class has no entry of its own. `CarbonImmutable` and `Illuminate\Support\Carbon`, which `now()` and `today()` return, follow their own entries, and so do date columns and date casts, such as `'datetime'`. A date type with no entry follows `timestamps_as_date`.

```php
'custom_ts_mappings' => [
    'decimal:2' => 'number', // the decimal:2 cast only
    'numeric' => 'number',   // numeric columns, on every driver
],
```

### Models (`models.*`)

| Config Key                        | Type     | Default                           | Description                                                                                                                                                                                                                                                             |
| --------------------------------- | -------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `models.enabled`                  | `bool`   | `true`                            | Enable or disable model publishing                                                                                                                                                                                                                                      |
| `models.namespace`                | `string` | `'models'`                        | Not used. The global declaration file names each namespace after the class's PHP namespace, such as `app.models`                                                                                                                                                        |
| `models.relationship_case`        | `string` | `'snake'`                         | Case style for relationships: `snake`, `camel`, or `pascal`                                                                                                                                                                                                             |
| `models.nullable_relations`       | `bool`   | `true`                            | Append `\| null` to singular relation types that can be empty, based on each relation type's strategy                                                                                                                                                                   |
| `models.exclude_hidden`           | `bool`   | `false`                           | Omit Eloquent `$hidden` attributes from model interfaces, and from resource properties wherever the package derives them from the model. See [`exclude_hidden` and Attribute Filters](https://tolki.abe.dev/ts/api-resources.html#exclude-hidden-and-attribute-filters) |
| `models.relation_nullability_map` | `array`  | `[]`                              | Override the nullability strategy per relation class: `nullable`, `never`, `fk`, or `morph`                                                                                                                                                                             |
| `models.template`                 | `string` | `laravel-ts-publish::model-split` | Blade template for model TypeScript output                                                                                                                                                                                                                              |
| `models.included`                 | `array`  | `[]`                              | Only publish these models (empty = all)                                                                                                                                                                                                                                 |
| `models.excluded`                 | `array`  | `[]`                              | Exclude these models from publishing                                                                                                                                                                                                                                    |
| `models.additional_directories`   | `array`  | `[]`                              | Extra directories to search for models. A model that a published model relates to is published without being listed, under the rules in [Related Models Outside Your Directories](https://tolki.abe.dev/ts/models.html#related-models-outside-your-directories)         |
| `models.collector_class`          | `string` | `ModelsCollector`                 | Discovers PHP model classes                                                                                                                                                                                                                                             |
| `models.generator_class`          | `string` | `ModelGenerator`                  | Orchestrates transforming and writing                                                                                                                                                                                                                                   |
| `models.transformer_class`        | `string` | `ModelTransformer`                | Converts PHP class into TypeScript data                                                                                                                                                                                                                                 |
| `models.writer_class`             | `string` | `ModelWriter`                     | Writes TypeScript model files                                                                                                                                                                                                                                           |

### Model Metadata (`model_metadata.*`)

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

### Enums (`enums.*`)

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

### Resources (`resources.*`)

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

### Globals (`globals.*`)

See [Global Declaration File](https://tolki.abe.dev/ts/publishing.html#global-declaration-file) for what this file contains.

| Config Key                 | Type     | Default                       | Description                                                              |
| -------------------------- | -------- | ----------------------------- | ------------------------------------------------------------------------ |
| `globals.enabled`          | `bool`   | `false`                       | Generate a global namespace declaration file                             |
| `globals.output_directory` | `string` | `''`                          | Directory for the global declaration file. Empty uses `output_directory` |
| `globals.filename`         | `string` | `laravel-ts-global.ts`        | Filename for the global declaration file                                 |
| `globals.template`         | `string` | `laravel-ts-publish::globals` | Blade template for global declaration output                             |
| `globals.writer_class`     | `string` | `GlobalsWriter`               | Writes global declaration file                                           |

### JSON (`json.*`)

See [JSON Definitions File](https://tolki.abe.dev/ts/publishing.html#json-definitions-file) for the file's format.

| Config Key              | Type     | Default                       | Description                                                  |
| ----------------------- | -------- | ----------------------------- | ------------------------------------------------------------ |
| `json.enabled`          | `bool`   | `false`                       | Output all definitions as a JSON file                        |
| `json.filename`         | `string` | `laravel-ts-definitions.json` | Filename for the JSON output                                 |
| `json.output_directory` | `string` | `''`                          | Directory for the JSON output. Empty uses `output_directory` |
| `json.writer_class`     | `string` | `JsonWriter`                  | Writes JSON definitions file                                 |

### Watcher (`watcher.*`)

See [Collected Files Manifest](https://tolki.abe.dev/ts/publishing.html#collected-files-manifest) for what the file lists.

| Config Key                 | Type     | Default                           | Description                                                           |
| -------------------------- | -------- | --------------------------------- | --------------------------------------------------------------------- |
| `watcher.enabled`          | `bool`   | `true`                            | Output collected PHP file paths as JSON (for file watchers)           |
| `watcher.filename`         | `string` | `laravel-ts-collected-files.json` | Filename for the collected files JSON                                 |
| `watcher.output_directory` | `string` | `''`                              | Directory for the collected files JSON. Empty uses `output_directory` |
| `watcher.writer_class`     | `string` | `WatcherJsonWriter`               | Writes collected files JSON for watchers                              |

### Routes (`routes.*`)

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

### Form Requests (`form_requests.*`)

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

`form_requests.analyzer_class` has no line in the published config file. Add the key to the `form_requests` block to point it at your own class. The same class also types [`$request->validated('key')`](https://tolki.abe.dev/ts/form-requests.html#reading-a-single-validated-field) in Inertia page props, so swapping it changes those types too.

### Broadcast Channels (`broadcast_channels.*`)

| Config Key                            | Type     | Default                                  | Description                                                                  |
| ------------------------------------- | -------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `broadcast_channels.enabled`          | `bool`   | `true`                                   | Enable or disable broadcast channel publishing                               |
| `broadcast_channels.filename`         | `string` | `broadcast-channels.ts`                  | Filename for the generated channels file                                     |
| `broadcast_channels.template`         | `string` | `laravel-ts-publish::broadcast-channels` | Blade template for the channels output                                       |
| `broadcast_channels.output_directory` | `string` | `''`                                     | Custom output directory for the channels file. Empty uses `output_directory` |
| `broadcast_channels.collector_class`  | `string` | `BroadcastChannelsCollector`             | Discovers registered channel names                                           |
| `broadcast_channels.writer_class`     | `string` | `BroadcastChannelsWriter`                | Writes the `broadcast-channels.ts` file                                      |

### Broadcast Events (`broadcast_events.*`)

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

### Inertia (`inertia.*`)

| Config Key                        | Type      | Default               | Description                                                                                                                                                             |
| --------------------------------- | --------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inertia.enabled`                 | `bool`    | `true`                | Enable or disable Inertia shared-data and page-prop analysis                                                                                                            |
| `inertia.inertia_middleware_path` | `?string` | `null`                | Directory to search for the `HandleInertiaRequests` middleware (defaults to `app_path()`)                                                                               |
| `inertia.augmentation_filename`   | `string`  | `inertia-config.d.ts` | Filename for the generated module augmentation file                                                                                                                     |
| `inertia.output_directory`        | `string`  | `''`                  | Custom output directory. Empty uses `routes.output_directory`, then the global `output_directory`                                                                       |
| `inertia.component_casing`        | `string`  | `'camel'`             | Casing style for derived page-prop export names, used by the per-route page props. See [Inertia Integration](https://tolki.abe.dev/ts/routing.html#inertia-integration) |
| `inertia.ui_table_package`        | `?string` | `null`                | npm package used for InertiaUI Table integration, used by the per-route page props                                                                                      |

### Vite Env (`vite_env.*`)

| Config Key                  | Type      | Default         | Description                                                                  |
| --------------------------- | --------- | --------------- | ---------------------------------------------------------------------------- |
| `vite_env.enabled`          | `bool`    | `true`          | Enable Vite environment type generation                                      |
| `vite_env.filename`         | `string`  | `vite-env.d.ts` | Filename for the Vite env declaration file                                   |
| `vite_env.output_directory` | `string`  | `''`            | Custom output directory for the Vite env file. Empty uses `output_directory` |
| `vite_env.source_file`      | `?string` | `null`          | Source `.env` file (defaults to `.env`, falls back to `.env.example`)        |

### Cache Generation (`cache.*`)

| Config Key        | Type      | Default                              | Description                                                            |
| ----------------- | --------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `cache.enabled`   | `bool`    | `true`                               | Skip re-generating unchanged classes after the first run               |
| `cache.store`     | `?string` | `null`                               | `null` = file cache under `directory`; or a Laravel cache store name   |
| `cache.directory` | `string`  | `storage/framework/cache/ts-publish` | Directory for the file-based cache                                     |
| `cache.key`       | `?string` | `null`                               | HMAC signing key for the cache (file and store); defaults to `app.key` |

The published config reads `cache.enabled`, `cache.store`, and `cache.key` from the `TS_PUBLISH_CACHE_ENABLED`, `TS_PUBLISH_CACHE_STORE`, and `TS_PUBLISH_CACHE_KEY` environment variables. See [Cache Generation](https://tolki.abe.dev/ts/generating-cache.html) for what triggers a rebuild, the storage options, and the `--fresh` flag.

<!-- AUTO-GENERATED-DOCS:END -->
