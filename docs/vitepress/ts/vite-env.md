# Vite Env

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) reads the `VITE_` variables from your project's `.env` file and generates a `vite-env.d.ts` declaration file. The file augments Vite's own `ImportMetaEnv` interface, so `import.meta.env.VITE_APP_NAME` is typed on the frontend without a declaration file you maintain by hand.

The feature is on by default. It needs no `@tolki/ts` runtime, no attributes, and no per-class configuration.

## Anatomy of the Generated File

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

## Source File Resolution

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

## Parsing Rules

The package reads variable names only, one line at a time, with these rules:

- Each line is trimmed before it's checked.
- Blank lines and lines that start with `#` are skipped.
- A line with no `=` is skipped, because there's no name to read.
- The name is everything before the first `=`. Values, quotes, and inline comments aren't read or validated.
- Only names that start with `VITE_` are kept. Everything else, such as `APP_NAME` and `DB_CONNECTION`, is ignored.
- The names are sorted alphabetically, and duplicates are removed.

::: warning `export` prefixes
A line written as `export VITE_APP_NAME=MyApp` is skipped, because its name doesn't start with `VITE_`. Remove the `export` prefix to include the variable.
:::

## Output Location

The file goes to `vite_env.output_directory` if you set it, and to the global `output_directory` otherwise. `vite_env.filename` sets the filename, which defaults to `vite-env.d.ts`.

The [Vite plugin](./vite-plugin.md) doesn't watch your `.env` file. After you add or remove a `VITE_` variable, run `php artisan ts:publish` to update the declarations.

## No Filtering, Attributes, or Per-Item Config

Vite Env has no PHP classes to publish, so it has no `included`, `excluded`, or `additional_directories` settings and doesn't support `#[TsExclude]`. The same is true of [Broadcast Channels](./broadcast-channels.md#no-per-channel-attributes).

To leave a variable out, don't prefix it with `VITE_`. Vite won't expose it to client code either. To turn off the feature, set `vite_env.enabled` to `false`.

## Configuration Reference

The [Configuration Reference](./configuration-reference.md#vite-environment-vite-env) lists every `vite_env.*` key.
