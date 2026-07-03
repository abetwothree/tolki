# Cache Generation

After the first full publish, `ts:publish` can skip re-generating classes whose source files (and everything they depend on) haven't changed. Unchanged files are never rewritten, so their modification time is preserved — avoiding spurious rebuilds in tools like Vite. The cache is busted automatically whenever the package version or your output-affecting config changes.

```php
// config/ts-publish.php

'cache' => [
    'enabled' => env('TS_PUBLISH_CACHE_ENABLED', true),
    'store' => env('TS_PUBLISH_CACHE_STORE'),
    'directory' => storage_path('framework/cache/ts-publish'),
    'key' => env('TS_PUBLISH_CACHE_KEY'),
],
```

## How a Cache Hit Is Detected

For each class, the orchestrator (`BaseRunner::cachedGenerate()`) runs through this exact sequence:

1. **Requires `RehydratesFromCache`** — if the resolved `*.generator_class` doesn't use the trait (no `fromCache()` method), the class is always rebuilt from scratch — correct, just never cached. See [Cache-Compatible Generators](./customizing-the-pipeline.md#cache-compatible-generators-rehydratesfromcache).
2. **Folds in a non-file signature, if the generator provides one** — see [Non-File Signatures](#non-file-signatures-providescachesignature) below.
3. **Recomputes the fingerprint fresh** from the *previously recorded* dependency file list plus that signature, and compares it to the stored fingerprint — cheap, since it only re-hashes already-known files rather than re-running collection.
4. **Also verifies every previously-written output file still exists on disk** — a manually deleted output file forces a rebuild even if the fingerprint still matches.

Only when all of this matches is the class's transformer snapshot rehydrated and its cached output reused as-is.

## The Fingerprint Algorithm

`Fingerprinter::fromPaths()` computes an order-independent fingerprint from a set of file paths:

1. Paths are deduplicated and sorted, so the fingerprint never changes just because files were discovered in a different order.
2. Each path is hashed with `hash_file('xxh128', $path)`. A **missing** file contributes a stable `'missing'` marker instead of erroring — so a dependency's later appearance (or removal) still changes the fingerprint.
3. An optional non-file `$extra` signature string (see below) is appended as `::extra::{$extra}` when non-empty.
4. The final fingerprint is `hash('xxh128', ...)` over the joined `path@hash` lines.

xxHash128 is used throughout — it's fast, which matters since fingerprinting runs on every class on every publish (cached or not). It's a non-cryptographic hash: the *integrity/tamper-resistance* of the cache comes from the separate HMAC signing layer (see [Payload Signing & Security](#payload-signing-security)), not from this fingerprint.

## What Gets Recorded as a Dependency

`DependencyRecorder::recordClass()` builds the dependency file list for a class:

- The class's own source file.
- Every trait it uses, recursively — a trait used by another trait is still recorded, since `ReflectionClass::getTraits()` only returns direct traits.
- Every interface it implements.
- The full parent class chain, walking all the way up — and each ancestor's own traits, too.

Recording is guarded by `class_exists()`, so an unresolvable class string can never crash a publish — it's a cache side-channel, and it stays silent on failure rather than risk breaking generation.

## Non-File Signatures (`ProvidesCacheSignature`)

Some cache-relevant inputs don't live in any file at all — the clearest example is **routes**: a route's URI, HTTP methods, name, domain, and middleware live in your route files, not in the controller class file itself, so a route change wouldn't otherwise be visible to the file-based fingerprint.

`RouteGenerator` solves this by implementing `AbeTwoThree\LaravelTsPublish\Cache\Contracts\ProvidesCacheSignature`:

```php
class RouteGenerator extends CoreGenerator implements ProvidesCacheSignature
{
    public static function cacheSignature(string $fqcn): string
    {
        return RouteCacheSignature::for($fqcn);
    }
}
```

`RouteCacheSignature::for($controllerClass)` builds a deterministic signature by collecting every route mapped to that controller, encoding each one as `name|uri|methods|domain|actionMethod|middleware` (methods and middleware sorted for stability), sorting all of them, and hashing the result. `BaseRunner` checks `is_subclass_of($generatorClass, ProvidesCacheSignature::class, true)` and, when true, folds the returned signature into `Fingerprinter::fromPaths()` as the `$extra` argument — so adding, removing, or editing a route (even just its URI) busts exactly the controllers whose routes changed, without needing `--fresh`.

A custom [`*.generator_class`](./customizing-the-pipeline.md) can implement the same interface to fold its own non-file signature (an API response, a database timestamp, anything else that affects output but isn't a file) into its cache fingerprint.

## Config Fingerprinting

Beyond individual classes, the entire cache is busted whenever your output-affecting config changes. `ConfigFingerprint::compute()`:

- Reads the full `ts-publish` config array, **excluding the `cache.*` sub-array** — toggling cache settings themselves must never bust every class's cache.
- Recursively sorts every array by key, so the fingerprint is independent of declaration order.
- Hashes the result with `xxh128`.
- Falls back to a random per-run token if the config contains a non-serializable value (e.g. a raw closure) — this guarantees a safe full rebuild that run rather than crashing generation.

## Manifest Lifecycle

`GenerationManifest` is the in-memory index tying it all together:

- **`load()`** — loads stored entries from the repository. If the stored header's package version or config hash no longer matches the current run, the *entire* cache is flushed and generation starts fresh.
- **`hit()`** — true only when the fingerprint matches AND every one of the class's previously-recorded output files still exists (see [How a Cache Hit Is Detected](#how-a-cache-hit-is-detected) above).
- **`record()`** — stores a freshly-built class's fingerprint, output filename, dependency paths, output paths, and a base64-encoded transformer snapshot.
- **`markSeen()`** / **`save()`** — every class touched during a run is marked seen; `save()` **prunes any entry not seen this run**, so a class removed from your source tree has its stale cache entry cleaned up automatically instead of lingering forever.

## Storage Backends

### File Backend (Default)

- Each entry is written to `{directory}/{xxh128(key)}.cache` — the key itself is hashed into the filename, so no filesystem-unsafe characters ever reach disk.
- The directory self-manages a `.gitignore` (`*` / `!.gitignore`) on first use.
- **Self-healing on corruption** — if a cache file fails signature verification or fails to parse, it's deleted immediately (`forget()`) so the next run rebuilds it cleanly instead of failing repeatedly.

### Laravel Cache Store Backend

Setting `cache.store` (e.g. `'redis'`, `'database'`) routes the manifest through any configured Laravel cache store instead of the filesystem:

- The repository maintains its **own in-memory key index** (a `list<string>` stored under `{prefix}:__index__`), since Laravel cache stores have no native "flush only my keys" operation. `flush()` only removes keys *this package itself wrote* — it never touches unrelated entries in a shared store.
- The index is persisted once via `commit()` after a batch of writes (called once at the end of `GenerationManifest::save()`), not on every individual `put()` — cheap at expected class counts.
- Entries are stored with `forever()` — no TTL, since the manifest tracks its own staleness via fingerprints and pruning rather than relying on cache expiry.

## Payload Signing & Security

Both backends share the same signing logic (`SignsCachePayloads` trait):

- **Signing** — `serialize($value)`, then prepended with `hash_hmac('sha256', $serialized, $key) . ':'` when a key is configured. Falls back to unsigned storage only if no key is resolvable at all (no `cache.key` **and** no `app.key` — effectively only possible on a fresh app before `php artisan key:generate`).
- **Verification** — the HMAC is checked with `hash_equals()` (timing-safe comparison) before anything is trusted. On any failure — missing signature, mismatched signature, corrupt data, or a non-array/non-string-keyed result — the payload is rejected and treated as absent.
- **Deserialization is always `allowed_classes: false`** — even a successfully-signed payload can never instantiate a PHP object during `unserialize()`, closing the object-injection surface entirely on this package's own read path.

> [!WARNING]
> **Using a cache `store` with an untrusted backend.** When `store` points at a Laravel cache store (`redis`, `database`, `file`, …), that store deserializes its own values on read — and by default (Laravel's `cache.serializable_classes` is unset) it does so with PHP classes allowed, *before* this package's HMAC is checked. The signing still protects payload integrity, but it cannot stop object instantiation at the cache layer. If the store is shared or otherwise not fully trusted, set Laravel's `cache.serializable_classes` to `false` (or an explicit allowlist) and/or use a dedicated, trusted store. The default file backend is unaffected.

## Forcing a Full Rebuild

```bash
php artisan ts:publish --fresh
```

Flushes the cache, regenerates everything, and writes a fresh cache. It's a no-op under `--source` and `--preview`.

## What Bypasses the Cache

- **`--source=...` runs** (single-class republishing) always bypass the cache entirely.
- **`--preview` runs** never use the cache — they write no files, so caching them would record empty outputs and poison later real runs into skipping files that were never actually written.
- Setting `cache.enabled` to `false` disables it everywhere.

## Configuration

| Config Key | Type | Default | Description |
|---|---|---|---|
| `cache.enabled` | `bool` | `true` | Turn the generation cache on or off. |
| `cache.store` | `?string` | `null` | `null` keeps the cache on disk under `directory`. Set to any Laravel cache store name (`redis`, `database`, …) to keep the manifest there instead. |
| `cache.directory` | `string` | `storage/framework/cache/ts-publish` | Where the file-based cache lives. |
| `cache.key` | `?string` | `null` | HMAC signing key. Falls back to `app.key` when unset. Rotating the key triggers a one-time full rebuild — safe. |

> [!NOTE]
> The cache keys off your PHP source files. If you **manually edit a generated `.ts` file** without changing its source, the cache won't detect the edit and won't overwrite it — run `php artisan ts:publish --fresh` (or delete the generated file) to restore it.

> [!NOTE]
> **Database schema changes** (migrations) aren't part of the fingerprint — a model's columns are read from the live database, not a source file. The automatic post-migration republish always runs with `--fresh`, so it reflects schema changes. If you change the schema another way, run `php artisan ts:publish --fresh` yourself.
