<?php

/**
 * Bootstrap for the PHP parity probes.
 *
 * Resolves the local Laravel checkout from FRAMEWORK_PATH in the repo's .env,
 * autoloads it, and exposes probe() / emit() helpers so each probe file is
 * just a list of expressions and their real Laravel results.
 *
 * These probes are a DEVELOPMENT-TIME ORACLE, not a test dependency. They are
 * run by hand to capture ground truth; the captured values are then written
 * into the TypeScript tests as literals, so CI never needs PHP.
 */

declare(strict_types=1);

function repoRoot(): string
{
    return dirname(__DIR__, 2);
}

function frameworkPath(): string
{
    $envFile = repoRoot() . '/.env';

    if (! is_file($envFile)) {
        fwrite(STDERR, "Missing .env at {$envFile}. FRAMEWORK_PATH is required.\n");
        exit(1);
    }

    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), 'FRAMEWORK_PATH=')) {
            $path = trim(substr(trim($line), strlen('FRAMEWORK_PATH=')), " \"'");

            if (! is_dir($path)) {
                fwrite(STDERR, "FRAMEWORK_PATH points at {$path}, which does not exist.\n");
                exit(1);
            }

            return $path;
        }
    }

    fwrite(STDERR, "FRAMEWORK_PATH not found in .env\n");
    exit(1);
}

/**
 * Shim for a global enum the framework references but does not ship.
 *
 * `Arr.php:14` and `Collection.php:12` both `use SortDirection;` from the
 * GLOBAL namespace, and `Collection::sortByMany` matches on
 * `SortDirection::Ascending` / `::Descending` (Collection.php:1638-1640) —
 * but no such enum exists in the framework checkout (v13.25.0), in `vendor/`,
 * or in PHP 8.5 itself. Without this shim every `sortDesc` and multi-key
 * `sort` probe dies with `Error: Class "SortDirection" not found`.
 *
 * Declaring it here, before the autoloader runs, lets the REAL Laravel
 * sorting code execute unmodified. The case names match the framework's
 * usage and `packages/enum/src/php-enums.ts`.
 */
if (! enum_exists('SortDirection')) {
    enum SortDirection
    {
        case Ascending;
        case Descending;
    }
}

$autoload = frameworkPath() . '/vendor/autoload.php';

if (! is_file($autoload)) {
    fwrite(STDERR, "No vendor/autoload.php under FRAMEWORK_PATH. Run `composer install` there first.\n");
    exit(1);
}

require $autoload;

$GLOBALS['__probes'] = [];

/**
 * Record one probe: a label, the source expression as written, and its result.
 *
 * The callable is invoked immediately. Throwables are captured as
 * {"threw": "<Class>", "message": "..."} so exception parity can be asserted
 * the same way as return-value parity.
 */
function probe(string $label, string $expression, callable $run): void
{
    try {
        $result = ['value' => $run()];
    } catch (\Throwable $e) {
        $result = ['threw' => get_class($e), 'message' => $e->getMessage()];
    }

    $GLOBALS['__probes'][] = ['label' => $label, 'php' => $expression] + $result;
}

/** The exact framework revision a capture was taken against. */
function frameworkVersion(): string
{
    $out = @shell_exec(
        'git -C ' . escapeshellarg(frameworkPath()) . ' describe --tags --always --dirty 2>/dev/null'
    );

    return $out === null ? 'unknown' : trim($out);
}

/** Print the capture metadata and every recorded probe as pretty JSON. */
function emit(): void
{
    $payload = [
        'meta' => ['php' => PHP_VERSION, 'laravel' => frameworkVersion()],
        'probes' => $GLOBALS['__probes'],
    ];

    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), PHP_EOL;
}
