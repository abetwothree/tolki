<?php

/**
 * Ground truth for Arr::collapse().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

// --- collapse (assoc groups with integer keys: array_merge renumbers)
probe('collapse-int-keys', "Arr::collapse(['g1' => ['a' => 1, 5 => 'x'], 'g2' => [5 => 'y']])", fn () => Arr::collapse(['g1' => ['a' => 1, 5 => 'x'], 'g2' => [5 => 'y']]));
probe('collapse-string-keys', "Arr::collapse(['a' => ['x' => 1, 'y' => 2], 'b' => ['x' => 3, 'z' => 4]])", fn () => Arr::collapse(['a' => ['x' => 1, 'y' => 2], 'b' => ['x' => 3, 'z' => 4]]));
probe('collapse-assoc-of-lists', "Arr::collapse(['a' => [1, 2], 'b' => [3]])", fn () => Arr::collapse(['a' => [1, 2], 'b' => [3]]));

// ---- Arr::collapse unwraps a Collection item; array_merge and array_unshift renumber negative integer keys too
probe('collapse-assoc-collection-item', "Arr::collapse(['a' => new Collection(['x' => 1]), 'b' => ['y' => 2]])", fn () => Arr::collapse(['a' => new Collection(['x' => 1]), 'b' => ['y' => 2]]));
probe('collapse-negative-int-keys', "Arr::collapse(['g1' => [-1 => 'a', 'k' => 'b'], 'g2' => [-1 => 'c']]) and the same groups as a list", fn () => [
    'assoc' => Arr::collapse(['g1' => [-1 => 'a', 'k' => 'b'], 'g2' => [-1 => 'c']]),
    'list' => Arr::collapse([[-1 => 'a', 'k' => 'b'], [-1 => 'c']]),
]);
probe('collapse-skips-objects', "Arr::collapse([[1], new DateTime('@0'), [2]]), ([[1], new ArrayObject(['x' => 1]), [2]]), ([['a' => 1], (object) ['b' => 2]]), ([(object) ['b' => 2]]), (['g1' => ['a' => 1], 'g2' => (object) ['b' => 2]])", fn () => [
    'date' => Arr::collapse([[1], new DateTime('@0'), [2]]),
    'array-object' => Arr::collapse([[1], new ArrayObject(['x' => 1]), [2]]),
    'object-item' => Arr::collapse([['a' => 1], (object) ['b' => 2]]),
    'only-object' => Arr::collapse([(object) ['b' => 2]]),
    'assoc-object-item' => Arr::collapse(['g1' => ['a' => 1], 'g2' => (object) ['b' => 2]]),
]);

// ---- Arr::collapse over mixed lists and maps is one array_merge; a Collection item unwraps, a scalar is skipped
probe('collapse-list-then-map', "Arr::collapse([[1, 2], ['x' => 1, 0 => 'z']])", fn () => Arr::collapse([[1, 2], ['x' => 1, 0 => 'z']]));
probe('collapse-map-then-list', "Arr::collapse([['a' => 3], [1, 2]])", fn () => Arr::collapse([['a' => 3], [1, 2]]));
probe('collapse-collection-items', "Arr::collapse([new Collection([1, 2]), 5, new Collection([3])])", fn () => Arr::collapse([new Collection([1, 2]), 5, new Collection([3])]));

probe('collapse-out-of-order-lists', "Arr::collapse([2 => ['c'], 0 => ['a'], 1 => ['b']])", fn () => arrayablePairs(Arr::collapse([2 => ['c'], 0 => ['a'], 1 => ['b']])));
probe('collapse-out-of-order-string-keys', "Arr::collapse([2 => ['c' => 1], 0 => ['a' => 1], 1 => ['b' => 1]])", fn () => arrayablePairs(Arr::collapse([2 => ['c' => 1], 0 => ['a' => 1], 1 => ['b' => 1]])));
probe('collapse-out-of-order-collision', "Arr::collapse([1 => ['k' => 1], 0 => ['k' => 2]])", fn () => arrayablePairs(Arr::collapse([1 => ['k' => 1], 0 => ['k' => 2]])));
probe('collapse-mixed', "Arr::collapse(['x' => ['p' => 1], 0 => [5], 'y' => ['q' => 2]])", fn () => arrayablePairs(Arr::collapse(['x' => ['p' => 1], 0 => [5], 'y' => ['q' => 2]])));

// Arr::collapse() and Arr::flatten() read any Enumerable through all(), a LazyCollection too (laravel/framework#61811).
probe('collapse-lazy-list', 'Arr::collapse([[1], new LazyCollection([2, 3]), collect([4])])', fn () => Arr::collapse([[1], new LazyCollection([2, 3]), collect([4])]));
probe('collapse-lazy-nested-kept', 'Arr::collapse([new LazyCollection([[1, 2], new LazyCollection([3])])])', fn () => shown(Arr::collapse([new LazyCollection([[1, 2], new LazyCollection([3])])])));
probe('collapse-lazy-assoc-outer', "Arr::collapse(['x' => [1], 'y' => new LazyCollection([2, 3]), 'z' => collect([4])])", fn () => Arr::collapse(['x' => [1], 'y' => new LazyCollection([2, 3]), 'z' => collect([4])]));
probe('collapse-lazy-keyed', "Arr::collapse(['first' => ['a' => 1], 'second' => new LazyCollection(['b' => 2, 'a' => 3])])", fn () => shown(Arr::collapse(['first' => ['a' => 1], 'second' => new LazyCollection(['b' => 2, 'a' => 3])])));

emit();
