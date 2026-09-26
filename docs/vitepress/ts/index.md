# Installation & Usage

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) generates TypeScript from your Laravel app. It covers model and API resource interfaces, enums, routes, form requests, broadcast channels and events, Inertia page props, and Vite environment variables. Its npm companion, [`@tolki/ts`](https://www.npmjs.com/package/@tolki/ts), gives the published enums and routes their runtime behavior.

Published enums get PHP-style helpers such as [`from`](https://www.php.net/manual/en/backedenum.from.php), [`tryFrom`](https://www.php.net/manual/en/backedenum.tryfrom.php), and [`cases`](https://www.php.net/manual/en/unitenum.cases.php). Published routes become functional objects that work the same way as Laravel Wayfinder's route definitions.

This page installs both packages and sets up your project. To run the publish command and control what it writes, see [Publishing Types](./publishing.md).

## Installing the Laravel Package

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

If you're upgrading from version 1.x, follow the [Upgrade Guide](./upgrade-guide.md).

## Installing `@tolki/ts`

Install the npm package with npm, yarn, or pnpm:

::: code-group

```bash [npm]
npm install @tolki/ts
```

```bash [yarn]
yarn add @tolki/ts
```

```bash [pnpm]
pnpm add @tolki/ts
```

:::

Published routes need `@tolki/ts` at runtime. Published enums use it too, unless you set `enums.use_tolki_package` to `false` in the config file, which removes their runtime dependency on it. See [Disabling Metadata or the `@tolki/ts` Wrapper](./enums.md#disabling-metadata-or-the-tolki-ts-wrapper) for what changes when it's off.

## Recommended Directory Structure

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

## Importing the Published Files

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

For apps with more than one root namespace, [Modular Publishing](./modular-publishing.md) shows how each namespace maps to a path.

## Publishing Your Types

Run the publish command to generate the files:

```bash
php artisan ts:publish
```

[Publishing Types](./publishing.md) covers preview mode, republishing a single class, filtering classes, and publishing only some features.

## Automatic Publishing With the Vite Plugin

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

See [Single-File Republishing](./vite-plugin.md#single-file-republishing) for how the plugin republishes one file during `vite dev`, and [Plugin Options](./vite-plugin.md#plugin-options) for every option.

## Automatic Publishing on Composer Update

Add `ts:publish` to the `post-update-cmd` script in `composer.json` to republish types after every `composer update`:

```json
{
  "scripts": {
    "post-update-cmd": ["@php artisan ts:publish"]
  }
}
```

Composer runs `post-update-cmd` only for `composer update`, or for a `composer install` without a lock file. To also publish on a `composer install` from a lock file, such as in CI, add the same command to `post-install-cmd`.

## Analyzer API

`AstEngine::analyze()` gives you the TypeScript types the package infers for the array a class method returns, without publishing or writing anything. Pass a class and a method name, and you get back an `AnalysisResult` with the typed properties and the imports those types need.

`analyze()` and `AnalysisResult` are the only supported API. Other `AstEngine` methods and other classes in the analyzer are internal and can change without notice. See [Analyzer API](./analyzer-api.md) for the full reference.

## Pre-Command Hook

To run your own code right before `ts:publish`, register a closure with `LaravelTsPublish::callCommandUsing()` in a service provider's `boot()` method. Common uses are configuring directories, swapping pipeline classes, and reacting to feature flags. See [Pre-Command Hook](./pre-command-hook.md) for worked examples.
