# Cache Generation

After the first full publish, `ts:publish` reuses the previous output of every class whose source hasn't changed, including the files the class depends on. The cache is on by default. It clears itself when you upgrade the package or change your output-affecting config.

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

## When a Class Is Rebuilt

The package reuses a class's cached output only while nothing it depends on has changed. It rebuilds the class when any of these change:

- **Its PHP files**: the class's own file, or any PHP file the package read to generate it, including parent classes, traits, interfaces, and related models.
- **Its routes**: for a controller, any route that points at it, including its URI, HTTP methods, name, domain, controller method, and middleware. Adding or removing a route counts too, so you don't need `--fresh` after editing routes.
- **Its metadata**: for a [model metadata](./model-metadata.md#cache) companion, the provider class, or the values it returns for that model. A new morph map alias set in a service provider counts.
- **Its output files**: if you delete a file the class wrote on an earlier run, the class is rebuilt even though its source didn't change.

The whole cache clears, and the next run rebuilds everything, when any of these change:

- **The package version**: after you upgrade or downgrade the package.
- **Your config**: any `ts-publish` setting outside the `cache` block. The order of keys doesn't matter.
- **The signing key**: `cache.key`, or `app.key` when `cache.key` isn't set.

Classes you delete from your app drop out of the cache on the next run.

::: warning Partial Runs Drop the Skipped Features
A run limited by an `--only-*` flag keeps cache entries only for the features it publishes. The next full run rebuilds the features it skipped. This includes the `--only-functional` run the [Vite plugin](./vite-plugin.md#production-builds) makes on `vite build`.
:::

## What the Cache Can't Detect

Some changes don't touch any file the cache tracks. The cache misses these:

- **Database schema changes**: a model's columns come from your database, not a source file. The automatic post-migration republish always runs with `--fresh`, so it picks up the new schema. If you change the schema another way, run `php artisan ts:publish --fresh`.
- **Edits to published templates**: the cache doesn't track Blade views, so a class whose PHP hasn't changed keeps its old output. After you edit a [published template](./customizing-the-pipeline.md#publishing-and-editing-templates), run `php artisan ts:publish --fresh`.
- **Edits to generated files**: if you edit a generated `.ts` file by hand without changing its source, the cache doesn't notice and won't overwrite it. Run `php artisan ts:publish --fresh`, or delete the file, to restore it.
- **Values that can't be serialized**: if your `ts-publish` config holds a value such as a closure, every run rebuilds everything. A model metadata provider that returns such a value rebuilds its companions on every run.

## Forcing a Full Rebuild

Pass `--fresh` to clear the cache, regenerate everything, and write a new cache:

```bash
php artisan ts:publish --fresh
```

`--fresh` has no effect with `--source` or `--preview=true`, because those runs don't use the cache.

## What Bypasses the Cache

The cache is skipped in these cases:

- **`--source` runs**: single-class republishing never reads or writes the cache.
- **`--preview=true` runs**: a preview writes no files, so caching it would record outputs that were never written and make later runs skip them.
- **`cache.enabled` set to `false`**: the cache is off for every run.

## Storage Backends

The cache lives in files by default. You can move it to any Laravel cache store instead.

### File Backend (Default)

The file cache lives in `storage/framework/cache/ts-publish`. Set `cache.directory` to move it. The package maintains the directory itself:

- **Kept out of git**: the package writes a `.gitignore` into the directory the first time it uses it.
- **Self-healing**: if a cache file fails its signature check or can't be read, the package deletes it, and the next run rebuilds that entry.

### Laravel Cache Store Backend

Set `cache.store` to the name of a store in your Laravel cache config, such as `redis` or `database`, to keep the cache there:

```dotenv
TS_PUBLISH_CACHE_STORE=redis
```

A store-backed cache behaves like this:

- **Only its own keys**: the package tracks the keys it writes, and clearing the cache removes only those keys. It never touches other entries in a shared store.
- **No expiry**: entries are stored forever, because the package tracks staleness itself.

## Payload Signing & Security

Both backends sign every cache entry with an HMAC-SHA256 signature. The key is `cache.key`, or `app.key` when `cache.key` isn't set.

The package checks the signature before it reads an entry. An entry with a missing or wrong signature, or with corrupt data, is treated as missing, and the class is rebuilt. Rotating the key has the same effect on every entry, so the next run rebuilds everything once.

If neither `cache.key` nor `app.key` is set, entries are stored unsigned, and the package can't detect a tampered entry. In practice, that means an app that hasn't run `php artisan key:generate`.

::: warning Using a Shared or Untrusted Cache Store
When `cache.store` points at a Laravel cache store (`redis`, `database`, `file`, and so on), the store unserializes its own values when it reads them. By default, when Laravel's `cache.serializable_classes` is unset, it allows PHP classes, and it does this before the package checks the signature. The signature still protects the data, but it can't stop object creation at the cache layer. If the store is shared or not fully trusted, set Laravel's `cache.serializable_classes` to `false` or to an allowlist, or use a dedicated, trusted store. The default file backend isn't affected.
:::

## Caching a Custom Generator

The built-in generators all work with the cache. A custom `*.generator_class` that extends one of them inherits that support. A generator written from scratch needs the `RehydratesFromCache` trait, or it's rebuilt on every run. See [Cache-Compatible Generators](./customizing-the-pipeline.md#cache-compatible-generators-rehydratesfromcache).

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

## Configuration

| Config Key        | Type      | Default                              | Description                                                                                                                                                                     |
| ----------------- | --------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cache.enabled`   | `bool`    | `true`                               | Turn the generation cache on or off. Set with `TS_PUBLISH_CACHE_ENABLED`.                                                                                                       |
| `cache.store`     | `?string` | `null`                               | `null` keeps the cache in files under `directory`. Set a Laravel cache store name (`redis`, `database`, and so on) to keep it there instead. Set with `TS_PUBLISH_CACHE_STORE`. |
| `cache.directory` | `string`  | `storage/framework/cache/ts-publish` | Where the file backend keeps the cache.                                                                                                                                         |
| `cache.key`       | `?string` | `null`                               | The HMAC signing key. Falls back to `app.key` when unset. Changing it rebuilds everything once. Set with `TS_PUBLISH_CACHE_KEY`.                                                |
