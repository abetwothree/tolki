<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Str;

// D3 — Stringable::basename (Stringable.php:97) and ::dirname (:277) wrap PHP's basename()/dirname().
foreach ([
    'trailing name of a directory path'  => ['/framework/tests/Support', ''],
    'file name with extension'           => ['/framework/src/Str.php', ''],
    'file name with the suffix removed'  => ['/framework/src/Str.php', '.php'],
    'root alone is empty'                => ['/', ''],
    'empty path'                         => ['', ''],
    'trailing slash is ignored'          => ['foo/', ''],
    'repeated trailing slashes ignored'  => ['/foo//', ''],
    'suffix equal to the whole name stays' => ['.php', '.php'],
    'suffix equal to the whole file name stays' => ['Str.php', 'Str.php'],
    'dotfile is its own name'            => ['dir/.hidden', ''],
    'only the last suffix is removed'    => ['a/b/c.tar.gz', '.gz'],
    'suffix is case-sensitive'           => ['file.PHP', '.php'],
    'suffix absent leaves the name'      => ['foo', '.php'],
] as $label => [$path, $suffix]) {
    probe("basename: $label", "Str::of('$path')->basename('$suffix')", fn () => (string) Str::of($path)->basename($suffix));
}

foreach ([
    'parent of a file'                   => ['/framework/src/Str.php', 1],
    'parent of a directory'              => ['/framework/tests/Support', 1],
    'two levels up'                      => ['/framework/tests/Support', 2],
    'root stays root'                    => ['/', 1],
    'empty path stays empty'             => ['', 1],
    'bare name has dot parent'           => ['foo', 1],
    'top-level file has root parent'     => ['/foo', 1],
    'dot stays dot'                      => ['.', 1],
    'dot-dot becomes dot'                => ['..', 1],
    'trailing slash is ignored'          => ['/a/b/c/', 1],
    'repeated slashes collapse'          => ['a//b', 1],
    'levels beyond the top stop at dot'  => ['a/b/c', 5],
    'levels reach the root'              => ['/a/b/c', 3],
    'relative levels reach dot'          => ['a/b/c', 3],
] as $label => [$path, $levels]) {
    probe("dirname: $label", "Str::of('$path')->dirname($levels)", fn () => (string) Str::of($path)->dirname($levels));
}

probe('dirname: levels below one throws', "Str::of('a')->dirname(0)", fn () => (string) Str::of('a')->dirname(0));

emit();
