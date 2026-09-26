# Vite Plugin

The `@tolki/ts` package includes a Vite plugin that keeps your published types current. During `vite dev`, it reruns `php artisan ts:publish` when a PHP file collected by the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) changes. During `vite build`, it publishes once before bundling.

The Laravel package publishes a JSON manifest that lists every PHP file it collected. The plugin watches exactly those files, not your whole project.

## Adding the Plugin

Add the plugin to your Vite configuration file:

```typescript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/ts/vite";

export default defineConfig({
  plugins: [laravelTsPublish()],
});
```

### Laravel Sail

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

## Default Functionality

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

### Production Builds

On `vite build`, the plugin appends `--only-functional`. That flag skips model and resource interfaces, which are type-only and erased at compile time. Everything else still publishes.

Form requests are type-only too, but they still publish. A route whose controller method takes a form request is wrapped in `annotateRequestPayload<T>()` and imports the published form request type. That import depends on `form_requests.enabled` in your config, not on the flags passed to `ts:publish`. Skipping form requests would leave the route importing a file that was never written.

Set `onBuildOnlyFunctional` to `false` to publish everything on build. The [Publishing Types](./publishing.md#other-files-in-partial-runs) page lists what an `--only-functional` run does to the other generated files.

### Single-File Republishing

The manifest lists each collected file's path, so the plugin can republish only the file that changed during development. Instead of a full `php artisan ts:publish`, it runs a targeted command:

```bash
php artisan ts:publish --source=app/Enums/Status.php --quiet
```

A single-file run skips every other class, so it stays fast as your project grows.

The plugin builds this command by appending `--source={file}` to the `command` option. The `{file}` placeholder becomes the file's path from the manifest, already shell-escaped, so don't wrap it in quotes. Set the `sourceCommand` option to use your own template, or set it to `false` to always run the full command.

The runs that `runOnDevStart` and `runOnBuildStart` trigger always use the full `command`, so every file is generated.

### Manifest Updates

The collected-files manifest tells the plugin which files to watch. It doesn't trigger a publish.

When `ts:publish` rewrites `resources/js/types/data/laravel-ts-collected-files.json`, the plugin refreshes its watched-file list and continues. It doesn't run `ts:publish` again for that write, which prevents a publish loop.

::: tip Starting from a fresh clone
If the manifest doesn't exist when `vite dev` starts, the plugin logs `Manifest not found` and has no files to watch. This happens after a fresh clone when the output directory is in `.gitignore`. Run `php artisan ts:publish` once, then start Vite.
:::

## Plugin Options

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
