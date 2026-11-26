<?php

/**
 * Ground truth for Str::position().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('position-astral', "Str::position('😀a', 'a'), Str::position('😀😀a', 'a', -1) and Str::position('😀😀', '', 2)", fn () => [Str::position('😀a', 'a'), Str::position('😀😀a', 'a', -1), Str::position('😀😀', '', 2)]);
probe('position-empty-needle', "Str::position() of '' in 'Hello, World!', in 'abc' from -1 and from 3, and in ''", fn () => [Str::position('Hello, World!', ''), Str::position('abc', '', -1), Str::position('abc', '', 3), Str::position('', '')]);
probe('position-offset-bounds', 'Str::position() at the edges, recorded as [haystack, needle, offset, result]', fn () => array_map(fn (array $c) => [...$c, attempt(fn () => Str::position(...$c))], [['abc', 'a', 3], ['abc', 'c', -1], ['abc', 'a', -3], ['hello', 'l', 5], ['', 'a', 0], ['abc', 'a', 10], ['abc', 'a', -4], ['hello', 'l', -10], ['', 'a', 1], ['😀😀', '', 3], ['hello', 'l', -2]]));

probe('position-fractional-offset', 'Str::position() with a fractional offset, recorded as [haystack, needle, offset, result], with PHP\'s deprecations', fn () => withDeprecations(fn () => array_map(fn (array $c) => [...$c, Str::position(...$c)], [['abc', '', 0.5], ['abc', 'a', -3.5], ['abc', '', -3.5], ['abc', 'c', 1.9], ['abc', 'a', 3.5]])));
probe('position-non-finite-offset', "What Str::position('abc', 'a', NAN) and Str::position('abc', 'a', INF) throw", fn () => [attempt(fn () => Str::position('abc', 'a', NAN)), attempt(fn () => Str::position('abc', 'a', INF))]);

emit();
