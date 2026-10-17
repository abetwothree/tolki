<?php

/**
 * Ground truth for Arr::divide().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// --- divide
probe('divide-empty-and-int-key', "Arr::divide(['' => 'Null', 1 => 'one'])", fn () => Arr::divide(['' => 'Null', 1 => 'one']));
probe('divide-int-key-types', "array_map('gettype', Arr::divide(['' => 'Null', 1 => 'one'])[0])", fn () => array_map('gettype', Arr::divide(['' => 'Null', 1 => 'one'])[0]));

// ==== divide (ArrTest::testDivide) — only the null-key/int-key row is captured today.
probe('divide-empty', "Arr::divide([])", fn () => Arr::divide([]));
probe('divide-array-values', "Arr::divide(['a' => [1, 2], 'b' => 'x'])", fn () => Arr::divide(['a' => [1, 2], 'b' => 'x']));
probe('divide-list', "Arr::divide(['Null', 'one'])", fn () => Arr::divide(['Null', 'one']));

probe('divide-out-of-order', "Arr::divide([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => arrayablePairs(Arr::divide(OUT_OF_ORDER)));
probe('divide-mixed', "Arr::divide(['x' => 1, 0 => 2, 'y' => 3])", fn () => arrayablePairs(Arr::divide(MIXED)));
probe('divide-collision', "Arr::divide([1 => 'a', 'x' => 'b', '1' => 'c'])", fn () => arrayablePairs(Arr::divide([1 => 'a', 'x' => 'b', '1' => 'c'])));

emit();
