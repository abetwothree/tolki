# Vite Env

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) reads the `VITE_`-prefixed variables from your project's `.env` file and generates a `vite-env.d.ts` declaration file that augments Vite's own `ImportMetaEnv` interface — so `import.meta.env.VITE_APP_NAME` is fully typed on the frontend without hand-maintaining a separate declaration file.

This is the simplest generator in the package: no `@tolki/ts` runtime, no attributes, no per-item filtering — just a source file scan and a template render.

## How the Declaration File Is Generated

1. **Resolve the source file** — `vite_env.source_file` if configured; otherwise `.env` if it exists; otherwise `.env.example`.
2. **Parse `VITE_`-prefixed variables** — read the source file line by line, skip blank lines and `#` comments, extract the variable name before the `=` on each remaining line, and keep only names starting with `VITE_`.
3. **Sort and deduplicate** the variable names.
4. **Render `vite-env.d.ts`** from the variable list. If no `VITE_`-prefixed variables were found (or the source file doesn't exist), nothing is generated — the writer returns an empty string and no file is written.

## Anatomy of the Generated File

Given a `.env` file containing:

```env
APP_NAME=MyApp
DB_CONNECTION=mysql
VITE_APP_NAME="${APP_NAME}"
```

The package generates `vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- Only `VITE_APP_NAME` is included — `APP_NAME` and `DB_CONNECTION` are skipped since they don't start with `VITE_`, matching [Vite's own convention](https://vite.dev/guide/env-and-mode.html#env-files) for which environment variables get exposed to client-side code.
- `/// <reference types="vite/client" />` pulls in Vite's own ambient types so the `ImportMetaEnv`/`ImportMeta` declarations here merge with (rather than replace) Vite's base declarations.
- Every variable is typed as `string` — regardless of the value written in the `.env` file (`true`, `123`, etc.), since Vite always provides raw strings at runtime via `import.meta.env`.

## Source File Resolution

The source file is resolved with this priority:

1. **`vite_env.source_file`**, if explicitly configured — an absolute path, or a path relative to the project root.
2. **`.env`**, if it exists at the project root.
3. **`.env.example`**, as the final fallback — useful in CI or a fresh clone where `.env` (gitignored) may not exist yet, but `.env.example` (committed) does.

```php
// config/ts-publish.php
'vite_env' => [
    'source_file' => '.env.production',
],
```

## Parsing Rules

- Lines are processed one at a time; leading/trailing whitespace is trimmed before checking.
- Blank lines and lines starting with `#` (comments) are skipped.
- A line without an `=` is skipped — there's nothing to extract a variable name from.
- The variable name is everything before the first `=` on the line; values, quotes, and inline comments after the value are not parsed or validated, only the name matters.
- Only names starting with `VITE_` are kept; everything else (`APP_NAME`, `DB_CONNECTION`, etc.) is silently ignored.
- The final list is sorted alphabetically and deduplicated before being passed to the template.

## Output Location

The output directory is resolved with this priority:

1. `vite_env.output_directory`, if set.
2. The global `output_directory`.

The filename is controlled by `vite_env.filename` (default `vite-env.d.ts`).

## No Filtering, Attributes, or Per-Item Config

Like [Broadcast Channels](./broadcast-channels.md#no-per-channel-attributes), Vite Env is a single-output feature with no per-class collection — there's no `included`/`excluded`/`additional_directories` config, and no `#[TsExclude]` support, since there's no PHP class to reflect on. To exclude a specific variable, simply don't prefix it with `VITE_` (Vite itself won't expose it to client code either), or disable the feature entirely with `vite_env.enabled = false`.

## Configuration Reference

The full list of `vite_env.*` config keys lives in the [Configuration Reference](./configuration-reference.md).
