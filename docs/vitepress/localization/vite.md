# Vite Plugin

`@tolki/lang/vite-laravel` is a Vite plugin that runs the `lang:export` command of [`abetwothree/laravel-lang-export`](https://github.com/abetwothree/laravel-lang), watches your lang files, and serves the exported locales as a module that [`createLang`](./index.md#loading-locales-on-demand) loads from. <Badge type="info" text="JS only" />

## Installation

Install the Composer package in your Laravel app, and the Vite plugin comes with `@tolki/lang`. Vite 7 or 8 is the peer dependency.

```bash
composer require abetwothree/laravel-lang-export
```

::: code-group

```bash [npm]
npm install @tolki/lang
```

```bash [yarn]
yarn add @tolki/lang
```

```bash [pnpm]
pnpm add @tolki/lang
```

:::

Add the plugin to `vite.config.ts`. The default export and the named `laravelLangExport` are the same function.

```ts
// vite.config.ts
import laravelLangExport from "@tolki/lang/vite-laravel";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [laravelLangExport()],
});
```

The exporter writes `resources/js/lang/{locale}.json` for each locale and a `manifest.json`. Its [output contract](https://github.com/abetwothree/laravel-lang/blob/main/docs/output-contract.md) lists what each file holds. Git-ignoring `resources/js/lang` is fine, because the plugin exports before it builds.

## Options

Every option is optional. The four export options become artisan flags on every run, a full export and a one-file export alike. When you leave one out, the flag is left out and `config/lang-export.php` decides.

| Option            | Default                              | Artisan flag                           |
| ----------------- | ------------------------------------ | -------------------------------------- |
| `command`         | `"php artisan lang:export"`          |                                        |
| `sourceCommand`   | `` `${command} --source={file}` ``   | `--source=`, through the `{file}` slot |
| `output`          | the exporter's `resources/js/lang`   | `--output=`                            |
| `locales`         | every locale                         | `--locale=`, once for each locale      |
| `only`            | every group                          | `--only=`, once for each pattern       |
| `except`          | no group left out                    | `--except=`, once for each pattern     |
| `runOnDevStart`   | `true`                               |                                        |
| `runOnBuildStart` | `true`                               |                                        |
| `reload`          | `true`                               |                                        |
| `failOnError`     | `true` in `vite build`, else `false` |                                        |
| `quiet`           | `true`                               | `--quiet`, added once                  |

- `command` runs through Node's `exec()` from the Vite root, so a shell alias such as `sail` is not available. Give the whole command, such as `"./vendor/bin/sail artisan lang:export"`.
- `sourceCommand` exports one changed file. `{file}` becomes the shell-escaped path. Set it to `false` to always run the full command.
- `output` is relative to the Laravel base path. The plugin reads `manifest.json` from the same directory, or from `resources/js/lang` when you leave `output` out.
- `runOnDevStart` and `runOnBuildStart` choose whether to export once when `vite dev` starts and before bundling in `vite build`. The exporter skips files whose bytes are unchanged, so a run with no changes costs one PHP boot.
- `reload` sends a full page reload after a successful export during `vite dev`.
- `failOnError` decides whether a failed export throws. A failed build stops, while a failed dev run logs the error and keeps the server up.
- `quiet` appends `--quiet` to every command unless your command or template already holds it.

```ts
// vite.config.ts
import laravelLangExport from "@tolki/lang/vite-laravel";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    laravelLangExport({
      locales: ["en", "es"],
      except: ["validation"],
    }),
  ],
});
```

Pass a flag here, rather than in `command`, so the one-file export gets the same flags as the full one. A mismatch changes the exporter's fingerprint, which turns the run into a full export.

## Dev and build

In `vite build`, the plugin runs one full export before bundling. A failed export fails the build.

In `vite dev`, the plugin runs one full export when the server starts, then watches the directories the manifest lists under `watch`. It reads the list again whenever `manifest.json` changes.

- A `.php` or `.json` file that you add or change inside the Vite root runs `--source=<path relative to the root>`, which exports that file alone.
- A file outside the root, such as a package that Composer symlinks from elsewhere, a deleted file or directory, or two or more changes that queue behind a running export, runs one full export.
- A file with any other extension, such as an editor swap file, runs nothing.
- Exports never overlap. Changes that arrive while one runs wait, then run as one export.

After a successful export, the dev server reloads the page.

### Sail

When PHP runs in a Sail container, point `command` at Sail. The plugin passes paths relative to the Vite root, which also match inside the container.

```ts
// vite.config.ts
import laravelLangExport from "@tolki/lang/vite-laravel";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    laravelLangExport({
      command: "./vendor/bin/sail artisan lang:export",
    }),
  ],
});
```

A package outside the Vite root, such as a path repository, re-exports in full, because the exporter cannot match an absolute host path against one inside the container.

## The virtual module

The plugin serves a module named `virtual:tolki-lang`. It exports `locales`, the locales the manifest lists, and `load(locale)`, which answers a locale's lines. Pass `load` straight to `createLang`.

```ts
import { createLang } from "@tolki/lang";
import { load } from "virtual:tolki-lang";

const lang = createLang({ locale: "en", fallback: "en", load });
await lang.ready;
```

For the browser, `load` imports the locale's file with `import()`, so each locale becomes its own content-hashed chunk, and a visitor downloads only the locales they use. For the server build, the module imports every locale up front, so `load` answers at once and `createLang` needs no `await`. A locale the manifest does not list throws an `Error` that names the locales that were exported. A manifest locale that holds `/`, `\`, `..` or a NUL byte is left out.

When the manifest is missing or unreadable, the plugin warns and `locales` is empty.

Do not import the files with `import.meta.glob("./lang/*.json")`. That pattern also matches `manifest.json`, which lists directories on your server, and Vite would ship it as a public file.

### Types

Add the types for `virtual:tolki-lang` to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@tolki/lang/client"]
  }
}
```

Or reference them from a `.d.ts` file in your project:

```ts
/// <reference types="@tolki/lang/client" />
```

They declare `locales` as `readonly string[]`, and `load` as a function from a locale to its lines or a promise of them.

## Loading without the module

You can give `createLang` any `load` function. This one fetches each locale from `public/lang`:

```ts
import { createLang } from "@tolki/lang";

const lang = createLang({
  locale: "en",
  fallback: "en",
  load: async (locale) => {
    const response = await fetch(`/lang/${locale}.json`);

    return response.json();
  },
});
```

::: warning
Do not expose `manifest.json`. The exporter writes it next to the locale files, and its `watch` list holds the paths of your lang directories, which can be absolute server paths when a directory sits outside the project. If you export to a folder under `public`, delete the manifest from what you deploy, or export to `resources/js/lang` and copy only the `{locale}.json` files into `public/lang`. Every line in a locale file ships to the browser as well, so use the `only` and `except` options to leave out groups such as `validation` that the page never shows.
:::

## Next

- [Vue](./vue.md), [React](./react.md) and [Svelte](./svelte.md) bind the lang you create to your components.
- [Installation & Usage](./index.md) covers `createLang`, `ready` and `setLocale`.
