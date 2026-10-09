<?php

/**
 * Ground truth for Arr::sortRecursiveDesc().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

$srd = [
    'empty' => [],
    'nested' => ['level1' => ['level2' => ['level3' => [2, 3, 1]], 'values' => [4, 5, 6]]],
    'mixed' => ['a' => 1, 2 => 'b', 'c' => 3, 1 => 'd'],
    'numbered_index' => [1 => 'e', 3 => 'c', 4 => 'b', 5 => 'a', 2 => 'd'],
];
probe('sortRecursiveDesc-literal', "Arr::sortRecursiveDesc(\$srd)", fn () => Arr::sortRecursiveDesc($srd));
probe('sortRecursiveDesc-numbers', "Arr::sortRecursiveDesc(['a'=>[1,9,10]])", fn () => Arr::sortRecursiveDesc(['a' => [1, 9, 10]]));

// fix-round-1: "orders nested numbers descending, numerically" also asserts a list-backed
// call; "sortRecursiveDesc-numbers" only covers the object-backed one.
probe('sortRecursiveDesc-numbers-list', "Arr::sortRecursiveDesc([[1,9,10]])", fn () => Arr::sortRecursiveDesc([[1, 9, 10]]));

// fix-round-1: "descends every level of the ArrTest fixture" uses a 3-key subset of the
// canonical $srd literal (no numbered_index); cite the exact subset instead of the 4-key one.
probe('sortRecursiveDesc-three-groups', "Arr::sortRecursiveDesc(['empty'=>[],'nested'=>['level1'=>['level2'=>['level3'=>[2,3,1]],'values'=>[4,5,6]]],'mixed'=>['a'=>1,2=>'b','c'=>3,1=>'d']])", fn () => Arr::sortRecursiveDesc([
    'empty' => [],
    'nested' => ['level1' => ['level2' => ['level3' => [2, 3, 1]], 'values' => [4, 5, 6]]],
    'mixed' => ['a' => 1, 2 => 'b', 'c' => 3, 1 => 'd'],
]));
probe('sortRecursiveDesc-explicit-zero-based-keys', 'Arr::sortRecursiveDesc([0=>3,1=>1,2=>2])', fn () => Arr::sortRecursiveDesc([0 => 3, 1 => 1, 2 => 2]));
probe('sortRecursiveDesc-nested-lists', 'Arr::sortRecursiveDesc([[3,1,2],[9,8]])', fn () => Arr::sortRecursiveDesc([[3, 1, 2], [9, 8]]));
probe('sortRecursiveDesc-string-keys-stay-krsorted', "Arr::sortRecursiveDesc(['b'=>2,'a'=>1])", fn () => Arr::sortRecursiveDesc(['b' => 2, 'a' => 1]));
probe('sortRecursiveDesc-descending-int-keys', "Arr::sortRecursiveDesc([1 => 'a', 0 => 'b'])", fn () => arrayablePairs(Arr::sortRecursiveDesc([1 => 'a', 0 => 'b'])));
probe('sortRecursiveDesc-out-of-order', "Arr::sortRecursiveDesc([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => arrayablePairs(Arr::sortRecursiveDesc(OUT_OF_ORDER)));
probe('sortRecursiveDesc-out-of-order-key-and-value-sorts-disagree', "Arr::sortRecursiveDesc([2 => 'a', 0 => 'c', 1 => 'b'])", fn () => arrayablePairs(Arr::sortRecursiveDesc([2 => 'a', 0 => 'c', 1 => 'b'])));
probe('sortRecursiveDesc-collision', "Arr::sortRecursiveDesc([1 => 'a', 0 => 'c', '1' => 'b'])", fn () => arrayablePairs(Arr::sortRecursiveDesc([1 => 'a', 0 => 'c', '1' => 'b'])));
// '1' lands on key 1's first position, so the array is [1 => 'b', 0 => 'a']: not a list, so key-sorted.
probe('sortRecursiveDesc-collision-out-of-order', "Arr::sortRecursiveDesc([1 => 'c', 0 => 'a', '1' => 'b'])", fn () => arrayablePairs(Arr::sortRecursiveDesc([1 => 'c', 0 => 'a', '1' => 'b'])));
probe('sortRecursiveDesc-collision-makes-list', "Arr::sortRecursiveDesc([0 => 'z', 1 => 'b', '0' => 'a'])", fn () => arrayablePairs(Arr::sortRecursiveDesc([0 => 'z', 1 => 'b', '0' => 'a'])));

emit();
