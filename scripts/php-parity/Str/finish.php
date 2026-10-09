<?php

/**
 * Ground truth for Str::finish().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

// Str::finish() and Str::start() return early for an empty or absent cap (laravel/framework#61803).
$slashes = str_repeat('/', 100000);
probe('finish-cases', 'Str::finish($value, $cap) for each [$value, $cap], recorded as [$value, $cap, result]', fn () => array_map(fn (array $pair) => [...$pair, Str::finish(...$pair)], [
    ['ab', 'bc'], ['abbcbc', 'bc'], ['abcbbcbc', 'bc'], ['test/string', '/'], ['test/string/', '/'], ['test/string//', '/'], ['test/string', ''], ['', ''],
    ['', '/'], ['///', '/'], ['a.b..', '.'], ['a$$', '$'], ['x[[', '['], ['x\\\\', '\\'], ['añññ', 'ñ'], ['😀😀', '😀'], ['a', 'abc'], ['a/b/c', '/'],
    ['aaa', 'aa'], ['aaaa', 'aa'], ['aaaaa', 'aa'], ['abab', 'ab'],
]));
probe('finish-long-interior-run', "Str::finish(str_repeat('/', 100000).'x', '/') === str_repeat('/', 100000).'x/'", fn () => Str::finish($slashes . 'x', '/') === $slashes . 'x/');
probe('finish-long-interior-run-then-caps', "Str::finish(str_repeat('/', 100000).'x//', '/'): PCRE gives up on the run, so only the cap comes back", fn () => Str::finish($slashes . 'x//', '/'));
// finish() and start() given no string, Stringable's empty charlist, excerpt() with a tab, toBoolean() and whitespace.
probe('finish-start-non-string-arguments', 'Str::finish() and Str::start() given a cap, prefix or value that is no string: an int, true, null, a Stringable', fn () => [
    'finish-int-cap-present' => Str::finish('a5', 5),
    'finish-int-cap-absent' => Str::finish('a', 5),
    'finish-true-cap' => Str::finish('a1', true),
    'finish-null-cap' => Str::finish('a', null),
    'finish-stringable-cap' => Str::finish('a/', Str::of('/')),
    'finish-stringable-value' => Str::finish(Str::of('a/'), '/'),
    'stringable-finish-stringable-cap' => (string) Str::of('a/')->finish(Str::of('/')),
    'start-null-prefix' => Str::start('a', null),
    'start-int-prefix-present' => Str::start('5a', 5),
    'start-int-prefix-absent' => Str::start('a', 5),
    'start-stringable-prefix' => Str::start('/a', Str::of('/')),
    'start-stringable-value' => Str::start(Str::of('/a'), '/'),
    'stringable-start-stringable-prefix' => (string) Str::of('/a')->start(Str::of('/')),
]);

emit();
