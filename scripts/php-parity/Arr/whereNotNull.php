<?php

/**
 * Ground truth for Arr::whereNotNull().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// --- whereNotNull on assoc
probe('whereNotNull-assoc-falsy', "Arr::whereNotNull(['a' => null, 'b' => 0, 'c' => false, 'd' => '', 'e' => null, 'f' => []])", fn () => Arr::whereNotNull(['a' => null, 'b' => 0, 'c' => false, 'd' => '', 'e' => null, 'f' => []]));
probe('whereNotNull-all-null', "Arr::whereNotNull([null, null]) and Arr::whereNotNull(['a'=>null])", fn () => [
    'list' => Arr::whereNotNull([null, null]),
    'assoc' => Arr::whereNotNull(['a' => null]),
]);
probe('whereNotNull-list-preserves-keys', "Arr::whereNotNull([null, 0, false, '', null, []])", fn () => Arr::whereNotNull([null, 0, false, '', null, []]));
probe('whereNotNull-out-of-order', "Arr::whereNotNull([2 => 'c', 0 => null, 1 => 'b'])", fn () => arrayablePairs(Arr::whereNotNull([2 => 'c', 0 => null, 1 => 'b'])));
// A null written last over an integer key's earlier value drops that key.
probe('whereNotNull-collision-null-last', "Arr::whereNotNull([1 => 'a', 'x' => 'm', '1' => null])", fn () => arrayablePairs(Arr::whereNotNull([1 => 'a', 'x' => 'm', '1' => null])));

emit();
