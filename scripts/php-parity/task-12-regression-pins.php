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

emit();
