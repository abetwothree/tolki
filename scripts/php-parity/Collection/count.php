<?php

/**
 * Ground truth for Collection::count().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ==== count on empty (CollectionTest::testCountable)
probe('count-empty', "count([]) via Collection", fn () => ['empty' => (new Collection([]))->count(), 'nested' => (new Collection([[1, 2], [3]]))->count()]);
// fix-round-1: "count-empty" is an emptiness check; "counts only the top level" needs its
// own pin, on a fixture where a recursive-leaf-count bug would produce a different number.
probe('count-nested-top-level-only', "Collection count only counts top-level items, never descends", fn () => [
    'assoc' => (new Collection(['a' => ['b' => 1, 'c' => 2], 'd' => 3]))->count(),
    'list' => (new Collection([[1, 2], [3]]))->count(),
]);

probe('count-traversable-backing', "collect(gen(1,2))->count()", fn () => (new Collection(traversable()))->count());
probe('count-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->count()", fn () => (new Collection(OUT_OF_ORDER))->count());
probe('count-collision', "(new Collection([1 => 'a', 'x' => 'q', '1' => 'b']))->count()", fn () => (new Collection([1 => 'a', 'x' => 'q', '1' => 'b']))->count());

emit();
