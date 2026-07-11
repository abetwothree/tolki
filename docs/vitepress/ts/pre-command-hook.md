# Pre-Command Hook

Register a closure with `LaravelTsPublish::callCommandUsing()` to run custom logic right before the `ts:publish` command executes — dynamically configuring directories, swapping pipeline classes, or reacting to feature flags and environment state. The closure only runs when the command actually runs, not at service provider boot time, so it never adds overhead to a normal web request.

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        // This only runs when `php artisan ts:publish` is executed
        config()->set('ts-publish.models.additional_directories', [
            'modules/Blog/Models',
            'modules/Shop/Models',
        ]);
    });
}
```

## When the Hook Runs

`callCommandWith()` is invoked as the very first line of `TsPublishCommand::handle()` — before `--source` is checked, before the `--only-*` flags are validated, before anything else. This means it runs **unconditionally and identically** for every way the command can be invoked:

| Invocation                                        | Hook runs? |
| ------------------------------------------------- | ---------- |
| `php artisan ts:publish` (full publish)           | Yes        |
| `php artisan ts:publish --source=App\Models\User` | Yes        |
| `php artisan ts:publish --preview=true`           | Yes        |
| Automatic post-migration republish                | Yes        |

There's no way to distinguish which invocation triggered the hook from inside the closure itself — if you need different behavior for `--source` reruns (for example, skipping expensive filesystem scans that the [Vite plugin](./vite-plugin.md) triggers on every file save), check for cheaper conditions inside the closure (e.g. caching the scan result, or reading an environment variable) rather than relying on the command's own options.

## Registration Behavior

- **Only one closure at a time** — calling `callCommandUsing()` again replaces the previously registered closure entirely; closures don't stack or chain.
- **Re-runs every time** — the same registered closure executes in full on every `callCommandWith()` call (i.e. every command invocation). It does not self-clear after running once.
- **No-op by default** — if nothing has called `callCommandUsing()`, `callCommandWith()` does nothing.
- **Runs with full config already loaded** — the closure can read and write any `ts-publish.*` config key via `config()->set(...)`, since Laravel's config repository is fully booted by the time it runs.

## Use Cases

### Dynamic Directory Discovery

The most common use case: scanning the filesystem so `additional_directories` stays in sync automatically as modules are added or removed, instead of hand-maintaining a static list.

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use Symfony\Component\Finder\Finder;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        $modelDirs = collect(Finder::create()->directories()->in(base_path('modules'))->name('Models')->depth(1))
            ->map(fn ($dir) => $dir->getRelativePathname())
            ->values()
            ->all();

        $enumDirs = collect(Finder::create()->directories()->in(base_path('modules'))->name('Enums')->depth(1))
            ->map(fn ($dir) => $dir->getRelativePathname())
            ->values()
            ->all();

        config()->set('ts-publish.models.additional_directories', $modelDirs);
        config()->set('ts-publish.enums.additional_directories', $enumDirs);
    });
}
```

### Modular Package Integration (e.g. `nwidart/laravel-modules`)

Rather than scanning the filesystem blindly, react to your module manager's own registry so only currently-_enabled_ modules contribute directories:

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

This way, disabling a module also removes its types from the next publish without editing any config.

### Conditionally Swapping Pipeline Classes

Since the hook runs before the [pipeline](./customizing-the-pipeline.md) is resolved, it's the right place to swap a `*_class` override based on runtime conditions — for example, using a lighter-weight transformer in CI where full analysis isn't needed:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use App\TypeScript\CiModelTransformer;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        if (app()->runningInConsole() && env('CI')) {
            config()->set('ts-publish.models.transformer_class', CiModelTransformer::class);
        }
    });
}
```

### Feature-Flag-Driven Publishing

Combine with [Laravel Pennant](https://laravel.com/docs/pennant) (or any feature-flag system) to only publish a module's types once its feature is active:

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
