# Installation & Usage

The [`@tolki/ts`](https://www.npmjs.com/package/@tolki/ts) package provides a variety of enum manipulation utilities inspired by PHP's enum utilities like [from](https://www.php.net/manual/en/backedenum.from.php), [tryFrom](https://www.php.net/manual/en/backedenum.tryfrom.php), and [cases](https://www.php.net/manual/en/unitenum.cases.php).

It also includes utilities to create functional routing objects that work the same way as Laravel Wayfinder's route definitions do.

This package is meant to be used with the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish), which transforms PHP enums & routes into functional TypeScript objects.

## Installing the Laravel Package

Install the PHP package via Composer:

```bash
composer require abetwothree/laravel-ts-publish
```

Optionally, you may publish the config and view files with:

```bash
php artisan vendor:publish --tag="ts-publish-config"
php artisan vendor:publish --tag="laravel-ts-publish-views"
```

## Installing `@tolki/ts`

You can install this package via npm, yarn, or pnpm:

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

If you don't want your enums to depend on `@tolki/ts` at runtime, set `enums.use_tolki_package` to `false` in the published configuration file. See the full [Enums documentation](./enums.md) for what changes when it's disabled.

Keep in mind that the `@tolki/ts` npm package is required for routing utilities to function correctly at runtime.

## Recommended Directory Structure

By default, generated files are written to `resources/js/types/data`. It's recommended to gitignore this directory — the files are generated on demand (locally, in CI, or before a production build), so committing them just adds noise and merge conflicts:

**Configuration:**

```php
// config/ts-publish.php

'output_directory' => resource_path('/js/types/data'),
```

**Git Ignore:**

```gitignore
# Ignore published TypeScript files
/resources/js/types/data/
```

If you use [ESLint](https://eslint.org/) or [Oxlint](https://oxc.rs/), add the published directory to your linter's ignore list too.

## Importing the Published Files

Create an import alias for the published files in `tsconfig.json` and `vite.config.ts` to avoid long relative paths and make it clear these are generated files:

**tsconfig.json:**

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

**vite.config.ts:**

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

Output is always organized into namespace-derived directory trees — a single-namespace app (just `App\Models`, `App\Enums`, etc.) produces one `app/` directory tree, so a default installation's imports look like:

```typescript
import { Status } from "@data/app/enums";
import type { User } from "@data/app/models";
```

See [Modular Publishing](./modular-publishing.md) for the full namespace-to-path algorithm on larger, multi-namespace applications.

## Automatic Publishing with the Vite Plugin

Add the Vite plugin to automatically watch for changes to your collected PHP files and re-run `ts:publish` during development and before a production build:

```typescript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/ts/vite";

export default defineConfig({
  plugins: [laravelTsPublish()],
});
```

If you're using Laravel Sail and Vite runs on your host machine, point the plugin at the Sail binary instead of a bare `sail` alias (which isn't available to Vite's non-interactive shell):

```typescript
laravelTsPublish({
  command: "./vendor/bin/sail artisan ts:publish",
});
```

For the full default behavior (single-file republishing during `vite dev`, the `--only-functional` flag on `vite build`, manifest handling, and every configuration option), see the full [Vite Plugin documentation](./vite-plugin.md).

## Automatic Publishing on Composer Update

Add `ts:publish` to the `post-update-cmd` hook in `composer.json` so deployed and CI environments stay in sync automatically:

```json
{
  "scripts": {
    "post-update-cmd": ["@php artisan ts:publish"]
  }
}
```

## Publishing Only Some Output

Every phase has an `enabled` key in `config/ts-publish.php` (`enums`, `models`, `model_metadata`, `resources`, `routes`, `form_requests`, `broadcast_channels`, `broadcast_events`), and one `--only-*` flag per phase limits a single run: `--only-enums`, `--only-models`, `--only-model-metadata`, `--only-resources`, `--only-routes`, `--only-form-requests`, `--only-broadcast-channels`, `--only-broadcast-events`. The flags cannot be combined. `--only-functional` publishes the runtime output only — enums, model metadata, routes, form requests, broadcast channels and events — skipping model and resource interfaces, and wins over any other `--only-*` flag.

A flag that requests a phase disabled in config prompts for an override in an interactive shell and respects the config silently otherwise (CI, queued jobs, the post-migration hook). Barrel `index.ts` files are rebuilt for every phase a run publishes; a phase that is enabled but skipped by a flag keeps its existing exports — see [Modular Publishing](./modular-publishing.md#barrel-files).

## Analyzer API

The same static analysis engine that powers `ts:publish` is also callable directly — hand `AstEngine` a class and a method name and get back a typed property list, without running the full publish pipeline or writing anything to disk. See the full [Analyzer API documentation](./analyzer-api.md).

## Pre-Command Hook

If you need to run custom logic right before `ts:publish` executes — dynamically configuring directories, swapping pipeline classes, or reacting to feature flags — register a closure with `LaravelTsPublish::callCommandUsing()` in a service provider's `boot()` method. See the full [Pre-Command Hook documentation](./pre-command-hook.md) for worked examples.

## Development Workflow

During development, run `vite dev` and the plugin will automatically watch for changes in your collected PHP files and call the publish command to keep your TypeScript files up to date.

Run `vite build` to build your assets for production — the plugin calls the publish command (with `--only-functional` appended by default, which publishes enums, model metadata, routes, form requests, and broadcast channels/events; model and resource interfaces are erased at compile time) before bundling.
