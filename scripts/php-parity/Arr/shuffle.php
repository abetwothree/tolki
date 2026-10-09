<?php

/**
 * Ground truth for Arr::shuffle().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- shuffle
probe('shuffle-assoc-keys', "array_keys(Arr::shuffle(['a'=>1,'b'=>2,'c'=>3]))", fn () => array_keys(Arr::shuffle(['a' => 1, 'b' => 2, 'c' => 3])));
probe('shuffle-assoc-values-sorted', "sorted values", function () { $s = Arr::shuffle(['a' => 1, 'b' => 2, 'c' => 3]); sort($s); return $s; });
probe('shuffle-empty', "Arr::shuffle([])", fn () => Arr::shuffle([]));

// ==== shuffle (ArrTest::testShuffleKeepsSameValues) — DETERMINISTIC: sort before comparing.
probe('shuffle-keeps-same-values', "sort(Arr::shuffle(range(0, 25)))", function () {
    $s = Arr::shuffle(range(0, 25));
    sort($s);

    return ['sorted' => $s, 'keys' => array_keys($s)];
});
// true is stored as the key 1, so the array holds two items and shuffle's values are 'b' and 'z'.
probe('shuffle-true-key-collision-values', "\$v = Arr::shuffle([1 => 'a', true => 'b', 0 => 'z']); sort(\$v)", function () {
    $values = Arr::shuffle([1 => 'a', true => 'b', 0 => 'z']);
    sort($values);

    return $values;
});

emit();
