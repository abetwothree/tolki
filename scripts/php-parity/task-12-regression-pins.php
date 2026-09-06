<?php

/**
 * Task 12 ground truth — regression-pin probes before merge.
 *
 * Run: php scripts/php-parity/task-12-regression-pins.php > docs/php-parity/task-12-regression-pins.json
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('flatten depth 0 fully flattens (depth never hits 1)', 'Arr::flatten([1,[2,[3]]], 0)', function () {
    return Arr::flatten([1, [2, [3]]], 0);
});

probe('flatten depth 0 via Collection', 'collect([1,[2,[3]]])->flatten(0)->all()', function () {
    return collect([1, [2, [3]]])->flatten(0)->all();
});

probe('flatten depth 1 for comparison', 'collect([1,[2,[3]]])->flatten(1)->all()', function () {
    return collect([1, [2, [3]]])->flatten(1)->all();
});

probe('sortDesc ties fall back to original order, not a full reverse', 'collect([[id=a,k=2],[id=b,k=1],[id=c,k=2],[id=d,k=3]])->sortByDesc(fn($i)=>$i["k"])->pluck("id")->values()->all()', function () {
    $items = [
        ['id' => 'a', 'k' => 2],
        ['id' => 'b', 'k' => 1],
        ['id' => 'c', 'k' => 2],
        ['id' => 'd', 'k' => 3],
    ];

    return collect($items)->sortByDesc(fn ($i) => $i['k'])->pluck('id')->values()->all();
});

probe('sortDesc on integer-keyed collection reorders values (PHP)', 'collect([0=>3,1=>1,2=>2])->sortDesc()->all()', function () {
    return collect([0 => 3, 1 => 1, 2 => 2])->sortDesc()->all();
});

probe('PHP casts "-1" to int(-1) and array_splice renumbers it too (JS does not)', "array_splice(\$a=['-1'=>'x','b'=>'y','c'=>'z'], 1, 1)", function () {
    $a = ['-1' => 'x', 'b' => 'y', 'c' => 'z'];
    array_splice($a, 1, 1);

    return $a;
});

probe('slice over-negative length clamps to empty', 'array_slice($a,0,-5,true)', function () {
    return [
        'assoc_0_neg5' => Arr::get(['v' => array_slice(['a' => 1, 'b' => 2, 'c' => 3], 0, -5, true)], 'v'),
        'assoc_neg5_neg5' => array_slice(['a' => 1, 'b' => 2, 'c' => 3], -5, -5, true),
        'list_0_neg5' => array_slice([1, 2, 3], 0, -5),
        'list_neg5_neg5' => array_slice([1, 2, 3], -5, -5),
        'assoc_0_neg6_of5' => array_slice(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5], 0, -6, true),
    ];
});

probe('undot only canonicalises canonical integer keys', 'Arr::undot(["1e2"=>"x"])', function () {
    return [
        'exp' => Arr::undot(['1e2' => 'x']),
        'leading_space' => Arr::undot([' 1' => 'x']),
        'plus' => Arr::undot(['+1' => 'x']),
        'leading_zero' => Arr::undot(['01' => 'x']),
        'canonical' => Arr::undot(['1' => 'x']),
    ];
});

// Arr::push() takes $array by reference, so it must be assigned to a variable first —
// passing a literal dies with "could not be passed by reference" before the body runs.
probe('push requires an array at the key', 'Arr::push($pa = [1,2,3], 0, 9)', function () {
    $pa = [1, 2, 3];
    Arr::push($pa, 0, 9);

    return ['unreachable' => $pa];
});

probe('push through an explicit null', 'Arr::push($pb = ["name"=>null], "name", 9)', function () {
    $pb = ['name' => null];
    Arr::push($pb, 'name', 9);

    return ['unreachable' => $pb];
});

probe('push at a missing key creates the array', 'Arr::push($pc = [], "name", 9)', function () {
    $pc = [];
    Arr::push($pc, 'name', 9);

    return $pc;
});

// Arr::array() is the guard Arr::push() calls internally; probed directly here so
// arrayItem's own pinned tests (the JS port of Arr::array()) trace to an exact-match row.
probe('Arr::array requires an array at the key', 'Arr::array([1,2,3], 0)', function () {
    return Arr::array([1, 2, 3], 0);
});

probe('Arr::array through an explicit null', 'Arr::array([null,["valid"]], 0)', function () {
    return Arr::array([null, ['valid']], 0);
});

probe('Arr::array through a float', 'Arr::array([1.5], 0)', function () {
    return Arr::array([1.5], 0);
});

// A multi-segment key resolves to the same array-or-throw guard at its final segment,
// regardless of how many segments precede it.
probe('push at a multi-segment key still requires an array at the resolved path', 'Arr::push($pd = [["Desk"]], "0.0", "Chair", "Lamp")', function () {
    $pd = [['Desk']];
    Arr::push($pd, '0.0', 'Chair', 'Lamp');

    return ['unreachable' => $pd];
});

// The null-vs-missing distinction through a dotted path — the hard part of D5 — since a
// flat key can't tell "hasOwn but null" apart from "no own key" the way a dotted path can.
probe('push through an explicit null at a dotted path', 'Arr::push($e1 = ["a"=>["b"=>null]], "a.b", 9)', function () {
    $e1 = ['a' => ['b' => null]];
    Arr::push($e1, 'a.b', 9);

    return ['unreachable' => $e1];
});

probe('push at a missing dotted path creates the array', 'Arr::push($e2 = ["a"=>[]], "a.b", 9)', function () {
    $e2 = ['a' => []];
    Arr::push($e2, 'a.b', 9);

    return $e2;
});

// Surprise (see task-13 fix report): a non-array intermediate segment does NOT throw.
// Arr::get()'s dot-walk returns the [] default the moment a segment isn't accessible,
// so Arr::set() silently overwrites 1.5 with a fresh array instead of ever raising.
probe('push through a float in a middle segment does not throw', 'Arr::push($e3 = [1.5, [2]], "0.1", 9)', function () {
    $e3 = [1.5, [2]];
    Arr::push($e3, '0.1', 9);

    return $e3;
});

emit();
