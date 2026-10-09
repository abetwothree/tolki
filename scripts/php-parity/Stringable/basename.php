<?php

/**
 * Ground truth for Str::of()->basename().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

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

emit();
