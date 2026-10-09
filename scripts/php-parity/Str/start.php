<?php

/**
 * Ground truth for Str::start().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

// Str::finish() and Str::start() return early for an empty or absent cap (laravel/framework#61803).
$slashes = str_repeat('/', 100000);
probe('start-cases', 'Str::start($value, $prefix) for each [$value, $prefix], recorded as [$value, $prefix, result]', fn () => array_map(fn (array $pair) => [...$pair, Str::start(...$pair)], [
    ['test/string', '/'], ['/test/string', '/'], ['//test/string', '/'], ['test/string', ''], ['', ''],
    ['', '/'], ['///', '/'], ['..a.b', '.'], ['$$a', '$'], ['[[x', '['], ['ñññz', 'ñ'], ['😀😀x', '😀'], ['a', 'abc'],
    ['aaa', 'aa'], ['aaaa', 'aa'], ['aaaaa', 'aa'], ['abab', 'ab'],
]));
probe('start-long-run', "Str::start('x'.str_repeat('/', 100000), '/') === '/x'.str_repeat('/', 100000)", fn () => Str::start('x' . $slashes, '/') === '/x' . $slashes);
probe('start-long-leading-run', "Str::start(str_repeat('/', 100000).'x', '/'): PCRE gives up on the run, so only the prefix comes back", fn () => Str::start($slashes . 'x', '/'));

emit();
