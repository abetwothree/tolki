<?php

/**
 * Ground truth for Arr::take().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ==== take (ArrTest::testTake) — no `take` row exists anywhere in docs/php-parity/.
$take = [1, 2, 3, 4, 5, 6];
probe('take-positive', "Arr::take([1..6], 3)", fn () => Arr::take($take, 3));
probe('take-negative', "Arr::take([1..6], -3)", fn () => Arr::take($take, -3));
probe('take-zero', "Arr::take([1..6], 0)", fn () => Arr::take($take, 0));
probe('take-over-size', "Arr::take([1..6], 10)", fn () => Arr::take($take, 10));
probe('take-negative-over-size', "Arr::take([1..6], -10)", fn () => Arr::take($take, -10));
probe('take-empty', "Arr::take([], 3) and Arr::take([], -3)", fn () => ['positive' => Arr::take([], 3), 'negative' => Arr::take([], -3)]);
probe('take-assoc-positive', "Arr::take(['a'=>1,'b'=>2,'c'=>3,'d'=>4], 2)", fn () => Arr::take(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4], 2));
probe('take-assoc-negative', "Arr::take(['a'=>1,'b'=>2,'c'=>3,'d'=>4], -2)", fn () => Arr::take(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4], -2));

// fix-round-2: dataTake's "returns everything when the limit exceeds the size" also makes
// two assoc-backed calls; "take-over-size" / "take-negative-over-size" are list-only.
probe('take-assoc-over-size', "Arr::take(['a'=>1,'b'=>2], 10)", fn () => Arr::take(['a' => 1, 'b' => 2], 10));
probe('take-assoc-negative-over-size', "Arr::take(['a'=>1,'b'=>2], -10)", fn () => Arr::take(['a' => 1, 'b' => 2], -10));

// ---- 3. Positional.
probe('take-out-of-order', "Arr::take([2 => 'c', 0 => 'a', 1 => 'b'], 2)", fn () => arrayablePairs(Arr::take(OUT_OF_ORDER, 2)));
probe('take-out-of-order-negative', "Arr::take([2 => 'c', 0 => 'a', 1 => 'b'], -1)", fn () => arrayablePairs(Arr::take(OUT_OF_ORDER, -1)));
probe('take-mixed', "Arr::take(['x' => 1, 0 => 2, 'y' => 3], 2)", fn () => arrayablePairs(Arr::take(MIXED, 2)));
probe('take-mixed-negative', "Arr::take(['x' => 1, 0 => 2, 'y' => 3], -2)", fn () => arrayablePairs(Arr::take(MIXED, -2)));

emit();
