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

emit();
