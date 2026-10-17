<?php

/**
 * Ground truth for Arr::random().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

probe('Arr::random on empty', 'Arr::random([])', function () {
    return Arr::random([]);
});

probe('Arr::random preserveKeys default', 'Arr::random([...], 2)', function () {
    return array_keys(Arr::random(['one'=>'foo','two'=>'bar','three'=>'baz'], 2));
});

probe('X23 random throws before the empty guard', 'Arr::random([],1)', function () {
    return Arr::random([], 1);
});

probe('X24 random preserveKeys defaults to false', 'Arr::random([10,20,30,40],2)', function () {
    $reindexed = Arr::random(nums(), 2);
    $preserved = Arr::random(nums(), 2, true);

    // Which keys get drawn is CSPRNG-driven; only the key SHAPE is stable.
    return [
        'keys' => array_keys($reindexed),
        'preserved_count' => count($preserved),
        'preserved_keys_are_original' => array_values(
            array_diff(array_keys($preserved), array_keys(nums()))
        ) === [],
    ];
});

// ---- random
probe('random-empty-2', "Arr::random([], 2)", fn () => Arr::random([], 2));

// ==== random (ArrTest::testRandom / testRandomOnEmptyArray) — DETERMINISTIC INVARIANTS ONLY.
$rand = [1, 2, 3, 4];
probe('random-zero-count', "Arr::random([1,2,3,4], 0)", fn () => Arr::random($rand, 0));
probe('random-empty-zero-count', "Arr::random([], 0) — does NOT throw", fn () => Arr::random([], 0));
probe('random-numeric-string-counts', "Arr::random([1,2,3,4], '0'|'1'|'2'): count and key shape only", fn () => [
    "'0'" => ['count' => count(Arr::random($rand, '0')), 'keys' => array_keys(Arr::random($rand, '0'))],
    "'1'" => ['count' => count(Arr::random($rand, '1')), 'keys' => array_keys(Arr::random($rand, '1'))],
    "'2'" => ['count' => count(Arr::random($rand, '2')), 'keys' => array_keys(Arr::random($rand, '2'))],
]);
probe('random-preserve-keys-invariant', "Arr::random([1,2,3,4], 2, true): keys are a subset of the source keys", function () use ($rand) {
    $drawn = Arr::random($rand, 2, true);

    return [
        'count' => count($drawn),
        'keys are original' => array_values(array_diff(array_keys($drawn), array_keys($rand))) === [],
        'values are original' => array_values(array_diff($drawn, $rand)) === [],
    ];
});
probe('random-single-no-count-type', "gettype(Arr::random([1,2,3,4]))", fn () => gettype(Arr::random($rand)));

probe('random-out-of-order-full-count', "Arr::random([2 => 'c', 0 => 'a', 1 => 'b'], 3) (50 draws, all equal)", fn () => arrayablePairs(everyDrawAgrees(fn () => Arr::random(OUT_OF_ORDER, 3))));
probe('random-out-of-order-full-count-preserve-keys', "Arr::random([2 => 'c', 0 => 'a', 1 => 'b'], 3, true) (50 draws, all equal)", fn () => arrayablePairs(everyDrawAgrees(fn () => Arr::random(OUT_OF_ORDER, 3, true))));
probe('random-mixed-full-count', "Arr::random(['x' => 1, 0 => 2, 'y' => 3], 3) (50 draws, all equal)", fn () => arrayablePairs(everyDrawAgrees(fn () => Arr::random(MIXED, 3))));
probe('random-mixed-full-count-preserve-keys', "Arr::random(['x' => 1, 0 => 2, 'y' => 3], 3, true) (50 draws, all equal)", fn () => arrayablePairs(everyDrawAgrees(fn () => Arr::random(MIXED, 3, true))));
probe('random-out-of-order-partial-keeps-array-order', "every one of 200 draws of Arr::random([2 => 'c', 0 => 'a', 1 => 'b'], 2, true) lists its keys in the array's own order", function () {
    $order = array_flip(array_keys(OUT_OF_ORDER));

    for ($draw = 0; $draw < 200; $draw++) {
        $positions = array_map(fn ($key) => $order[$key], array_keys(Arr::random(OUT_OF_ORDER, 2, true)));
        $ascending = $positions;
        sort($ascending);

        if ($positions !== $ascending) {
            return false;
        }
    }

    return true;
});
probe('random-mixed-partial-keeps-array-order', "every one of 200 draws of Arr::random(['x' => 1, 0 => 2, 'y' => 3], 2) lists its values in the array's own order", function () {
    $order = array_flip(array_values(MIXED));

    for ($draw = 0; $draw < 200; $draw++) {
        $positions = array_map(fn ($value) => $order[$value], Arr::random(MIXED, 2));
        $ascending = $positions;
        sort($ascending);

        if ($positions !== $ascending) {
            return false;
        }
    }

    return true;
});
probe('random-out-of-order-partial-values-keep-array-order', "every one of 200 draws of Arr::random([2 => 'c', 0 => 'a', 1 => 'b'], 2) lists two values in the array's own order", function () {
    $order = array_flip(array_values(OUT_OF_ORDER));

    for ($draw = 0; $draw < 200; $draw++) {
        $positions = array_map(fn ($value) => $order[$value], Arr::random(OUT_OF_ORDER, 2));
        $ascending = $positions;
        sort($ascending);

        if (count($positions) !== 2 || $positions !== $ascending) {
            return false;
        }
    }

    return true;
});
probe('random-collision-full-count', "Arr::random([1 => 'a', 'x' => 'b', '1' => 'c'], 2) (50 draws, all equal)", fn () => arrayablePairs(everyDrawAgrees(fn () => Arr::random([1 => 'a', 'x' => 'b', '1' => 'c'], 2))));
probe('random-list-full-count', "Arr::random(['a', 'b', 'c', 'd'], 4) (50 draws, all equal)", fn () => arrayablePairs(everyDrawAgrees(fn () => Arr::random(['a', 'b', 'c', 'd'], 4))));
probe('random-list-partial-keeps-array-order', "every one of 200 draws of Arr::random(['a', 'b', 'c', 'd'], 2) lists its values in the array's own order", function () {
    $order = array_flip(['a', 'b', 'c', 'd']);

    for ($draw = 0; $draw < 200; $draw++) {
        $positions = array_map(fn ($value) => $order[$value], Arr::random(['a', 'b', 'c', 'd'], 2));
        $ascending = $positions;
        sort($ascending);

        if ($positions !== $ascending) {
            return false;
        }
    }

    return true;
});
probe('C32-C-random-nan-count-on-empty', "Arr::random([], NAN) / Arr::random([], NAN, true) / (new Collection([]))->random(NAN)->all() / (new Collection([]))->random(fn () => NAN)->all(): the empty guard answers before pickArrayKeys", fn () => [
    'list' => Arr::random([], NAN),
    'list-preserving-keys' => Arr::random([], NAN, true),
    'collection' => (new Collection([]))->random(NAN)->all(),
    'collection-callback' => (new Collection([]))->random(fn () => NAN)->all(),
]);
probe('C32-C-arr-random-fractional-count', "Arr::random over [1, 2, 3] (list) and ['a' => 1, 'b' => 2, 'c' => 3] (keyed), deprecations silenced: how many it picks for 1.2, 2.9 and 1.5 with keys preserved, and what 3.5 and 0.5 throw", fn () => array_map(fn (array $items) => [
    '1.2' => count(@Arr::random($items, 1.2)),
    '2.9' => count(@Arr::random($items, 2.9)),
    '1.5 preserving keys' => count(@Arr::random($items, 1.5, true)),
    '3.5' => c32c_outcome(fn () => @Arr::random($items, 3.5)),
    '0.5' => c32c_outcome(fn () => @Arr::random($items, 0.5)),
], ['list' => [1, 2, 3], 'keyed' => ['a' => 1, 'b' => 2, 'c' => 3]]));

emit();
