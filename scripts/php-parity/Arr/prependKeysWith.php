<?php

/**
 * Ground truth for Arr::prependKeysWith().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- prependKeysWith
probe('prependKeysWith-literal', "Arr::prependKeysWith([...], 'test.')", fn () => Arr::prependKeysWith(['id' => '123', 'data' => '456', 'list' => [1, 2, 3], 'meta' => ['key' => 1]], 'test.'));

// ==== prependKeysWith over a list (the 'test.' assoc literal already exists)
probe('prependKeysWith-list', "Arr::prependKeysWith(['a', 'b', 'c'], 'item_')", fn () => Arr::prependKeysWith(['a', 'b', 'c'], 'item_'));

// fix-round-2 (A10 sweep of A1-A6 citations): "prependKeysWith-list" recorded a 3-item
// ['a','b','c']/'item_' call; "prefixes a list's indices" actually calls with 2 items and
// a 'p.' prefix. This is the real call.
probe('prependKeysWith-two-item-list', "Arr::prependKeysWith(['a', 'b'], 'p.')", fn () => Arr::prependKeysWith(['a', 'b'], 'p.'));

probe('prependKeysWith-out-of-order', "Arr::prependKeysWith([2 => 'c', 0 => 'a', 1 => 'b'], 'k')", fn () => arrayablePairs(Arr::prependKeysWith(OUT_OF_ORDER, 'k')));
probe('prependKeysWith-mixed', "Arr::prependKeysWith(['x' => 1, 0 => 2, 'y' => 3], 'p')", fn () => arrayablePairs(Arr::prependKeysWith(MIXED, 'p')));
probe('prependKeysWith-collision', "Arr::prependKeysWith([1 => 'a', 'x' => 'b', '1' => 'c'], 'k')", fn () => arrayablePairs(Arr::prependKeysWith([1 => 'a', 'x' => 'b', '1' => 'c'], 'k')));

emit();
