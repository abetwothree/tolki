# Tolki Enum Laravel TypeScript Publisher Vite Plugin

The `@tolki/enum` package provides a Vite plugin to automatically watch for changes of the transformed PHP files by the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) package.

The Laravel TypeScript Publisher package can publish a JSON file list of transformed PHP files. This Vite plugin uses that JSON file list to watch for changes in those PHP files and automatically call the `php artisan ts:publish` command to transform the changed PHP files into TypeScript files.

## Command Execution Notes

The plugin runs the configured `command` with Node's `child_process.exec()` from the Vite project root.

This has two important consequences:

1. The command runs in a non-interactive shell.
2. Shell aliases such as `sail` are usually not available.

If you are using Laravel Sail and Vite is running on your host machine, prefer `./vendor/bin/sail artisan ts:publish` instead of `sail artisan ts:publish`.

If Vite is already running inside the PHP container, use `php artisan ts:publish`.

When the publish command rewrites the collected-files manifest, the plugin only reloads the watched file list. It does not run the publish command again for that manifest update, which prevents command loops.

## Usage

To use the Vite plugin, you need to add it to your Vite configuration file. Below is an example of how to add the plugin to your Vite configuration file:

```javascript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/enum/vite";

export default defineConfig({
  plugins: [laravelTsPublish()],
});
```

### Laravel Sail

Choose the command based on where `vite dev` is running:

- Vite running on the host machine: `./vendor/bin/sail artisan ts:publish`
- Vite running inside the container: `php artisan ts:publish`

Using just `sail artisan ts:publish` often fails because `sail` is commonly defined as a shell alias and aliases are not resolved by `exec()`.

## Default Functionality

By default, the plugin will work in the following way:

1. It will call `php artisan ts:publish` as the republish command when a file changes.
2. It will look for the list of transformed PHP files here: `resources/js/types/laravel-ts-collected-files.json`.
3. If that manifest file changes, it will reload the watched file list without calling the publish command again.
4. It will reload the page after a successful publish triggered by a watched PHP file change.
5. It will call the publish command on `vite build` before bundling.
6. It will throw an error if the publish command fails on `vite build`.

### Manifest Updates

The collected-files manifest is treated as configuration input for the watcher, not as a publish trigger.

That means when `ts:publish` updates `resources/js/types/laravel-ts-collected-files.json`, the plugin will refresh its internal watched-file list and continue. It will not immediately run `ts:publish` again from that manifest write.

## Plugin Options

The plugin accepts an options object to customize its behavior. It is recommended to use `.env` config settings to sync settings between the PHP side and the Vite plugin for the `filename` and `directory` options.

Below are the available options with a description and default values:

```javascript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/enum/vite";

export default defineConfig({
  plugins: [
    laravelTsPublish({
      /**
       * The publish command to run when a watched PHP file changes.
       *
       * This command runs through Node's `exec()` from the Vite project root.
       * Shell aliases like `sail` are usually not available here.
       *
       * If Vite runs on the host machine and your app uses Sail, prefer
       * `./vendor/bin/sail artisan ts:publish`.
       *
       * If Vite already runs inside the PHP container, use
       * `php artisan ts:publish`.
       */
      command: "php artisan ts:publish",
      /**
       * The filename of the JSON manifest listing collected PHP files.
       */
      filename: "laravel-ts-collected-files.json",
      /**
       * The directory where the JSON manifest file exists, relative to the Vite root.
       */
      directory: "resources/js/types/",
      /**
       * Whether to run the publish command once when `vite dev` starts.
       *
       * Has no effect during `vite build`.
       */
      runOnDevStart: false,
      /**
       * Whether to run the publish command once before bundling during `vite build`.
       *
       * Has no effect during `vite dev`.
       */
      runOnBuildStart: true,
      /**
       * Whether to trigger a full browser reload after the
       * command runs successfully during `vite dev`.
       *
       * Has no effect during `vite build`.
       */
      reload: true,
      /**
       * Whether to throw an error (aborting the build) when the command fails.
       *
       * When not specified, defaults to `true` during `vite build`
       * and `false` during `vite dev`.
       *
       * When specified, it will apply to both `vite dev` and `vite build`.
       */
      failOnError: undefined,
    }),
  ],
});
```

### Example for a Host-Machine Vite Dev Server with Sail

```javascript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/enum/vite";

export default defineConfig({
  plugins: [
    laravelTsPublish({
      command: "./vendor/bin/sail artisan ts:publish",
    }),
  ],
});
```

### Example for Vite Running Inside the Container

```javascript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/enum/vite";

export default defineConfig({
  plugins: [
    laravelTsPublish({
      command: "php artisan ts:publish",
    }),
  ],
});
```
