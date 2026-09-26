# Pre-Command Hook

Register a closure with `LaravelTsPublish::callCommandUsing()` to run your own code right before `ts:publish` does its work. Use it to build directory lists, swap pipeline classes, or react to feature flags and the environment. The closure runs only when the command runs, not when the service provider boots, so it adds nothing to a normal web request.

Register the hook in a service provider's `boot()` method:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        // Runs only when `php artisan ts:publish` runs.
        config()->set('ts-publish.models.additional_directories', [
            'modules/Blog/Models',
            'modules/Shop/Models',
        ]);
    });
}
```

## When the Hook Runs

The hook runs before anything else in `ts:publish`, before the command reads `--source` or checks its `--only-*` flags. It runs the same way for every kind of invocation:

| Invocation                                                | Hook Runs |
| --------------------------------------------------------- | --------- |
| `php artisan ts:publish` (full publish)                   | Yes       |
| `php artisan ts:publish --source=App\Models\User`         | Yes       |
| `php artisan ts:publish --preview=true`                   | Yes       |
| Automatic republish after `migrate` (`run_after_migrate`) | Yes       |

The closure receives no arguments, so it can't tell which invocation started it. That matters for `--source` reruns. The Vite plugin runs one each time you save a PHP file during `vite dev`, as [Single-File Republishing](./vite-plugin.md#single-file-republishing) describes.

To skip expensive work on those reruns, such as a filesystem scan, check a condition the closure can see for itself. A cached scan result or an environment variable both work.

## Registration Behavior

The hook follows these rules:

- **One closure at a time**: calling `callCommandUsing()` again replaces the registered closure. Closures don't stack or chain.
- **Runs on every invocation**: the same closure runs in full each time the command runs. It isn't cleared after its first run.
- **Nothing by default**: until you call `callCommandUsing()`, no hook runs.
- **Config is loaded**: the closure can read and set any `ts-publish.*` key with `config()->set()`, because Laravel's config is fully loaded when it runs.

## Resetting the Hook Between Tests

A registered closure stays registered for the rest of the PHP process, even when Laravel boots a fresh application for each test. A closure registered in a service provider's `boot()` is registered again on each boot, which replaces the previous one. A closure you register inside a test stays active until something registers another closure.

To clear it after each test, register a closure that does nothing:

::: code-group

```php [Pest]
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;

afterEach(function () {
    LaravelTsPublish::callCommandUsing(fn () => null);
});
```

```php [PHPUnit]
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;

protected function tearDown(): void
{
    LaravelTsPublish::callCommandUsing(fn () => null);

    parent::tearDown();
}
```

:::

## Use Cases

The examples below all register the hook in a service provider's `boot()` method.

### Dynamic Directory Discovery

The most common use is scanning the filesystem, so `additional_directories` stays current as you add or remove modules. This example finds each module's `Models` and `Enums` directories:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use Symfony\Component\Finder\Finder;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        $find = fn (string $name) => collect(
            Finder::create()->directories()->in(base_path('modules'))->name($name)->depth(1)
        )->map(fn ($dir) => $dir->getPathname())->values()->all();

        config()->set('ts-publish.models.additional_directories', $find('Models'));
        config()->set('ts-publish.enums.additional_directories', $find('Enums'));
    });
}
```

### Modular Package Integration

A module manager such as `nwidart/laravel-modules` knows which modules are enabled. Read its registry instead of scanning the filesystem, so only enabled modules contribute directories:

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

When you disable a module, its types drop out of the next publish with no config change. A module without a `Models` or `Enums` directory is skipped, because collectors ignore paths that don't exist.

### Conditionally Swapping Pipeline Classes

The hook runs before `ts:publish` reads any `*_class` key, so it can swap a [pipeline](./customizing-the-pipeline.md) class based on conditions at run time. This example uses a lighter transformer in CI, where the full analysis isn't needed:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use App\TypeScript\CiModelTransformer;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        if (env('CI')) {
            config()->set('ts-publish.models.transformer_class', CiModelTransformer::class);
        }
    });
}
```

### Feature-Flag-Driven Publishing

With [Laravel Pennant](https://laravel.com/docs/pennant), or any other feature-flag package, you can publish a module's types only once its feature is active:

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
