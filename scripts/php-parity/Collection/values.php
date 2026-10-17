<?php

/**
 * Ground truth for Collection::values().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ==== CollectionTest parity
// ---- literal ports (assoc / int-keyed non-list)
probe('C1 values resets int keys', '(new Collection([1 => \'a\', 2 => \'b\', 3 => \'c\']))->values()->all()', fn () => (new Collection([1 => 'a', 2 => 'b', 3 => 'c']))->values()->all());

// ==== values on empty
probe('values-empty', "(new Collection([]))->values()", fn () => (new Collection([]))->values()->all());
probe('values-traversable-backing', "(new Collection(new ArrayIterator([1, 2, 3])))->values()", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->values()->all());
probe('values-string-backing', "(new Collection('abc'))->values()", fn () => (new Collection('abc'))->values()->all());

probe('values-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->values()", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->values()->all()));
probe('values-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->values()", fn () => arrayablePairs((new Collection(MIXED))->values()->all()));
probe('values-collision', "(new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->values()", fn () => arrayablePairs((new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->values()->all()));

emit();
