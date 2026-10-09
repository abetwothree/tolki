<?php

/**
 * Ground truth for Arr::sortRecursive().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- sortRecursive (literal from ArrTest)
$sr = [
    'users' => [
        ['name' => 'joe', 'mail' => 'joe@example.com', 'numbers' => [2, 1, 0]],
        ['name' => 'jane', 'age' => 25],
    ],
    'repositories' => [['id' => 1], ['id' => 0]],
    20 => [2, 1, 0],
    30 => [2 => 'a', 1 => 'b', 0 => 'c'],
];
probe('sortRecursive-literal', "Arr::sortRecursive(\$sr)", fn () => Arr::sortRecursive($sr));
probe('sortRecursive-numbers-lexical', "Arr::sortRecursive(['a'=>[10,9,1]])", fn () => Arr::sortRecursive(['a' => [10, 9, 1]]));
probe('sortRecursive-list-of-objects', "Arr::sortRecursive(['r'=>[['id'=>2],['id'=>10],['id'=>1]]])", fn () => Arr::sortRecursive(['r' => [['id' => 2], ['id' => 10], ['id' => 1]]]));

// ==== ArrTest parity: follow-up rows
probe('sortRecursive-key-case', "array_keys(Arr::sortRecursive(['b'=>1,'B'=>2,'a'=>3,'_x'=>4]))", fn () => array_keys(Arr::sortRecursive(['b' => 1, 'B' => 2, 'a' => 3, '_x' => 4])));
probe('sortRecursive-list-strings-case', "Arr::sortRecursive(['l'=>['b','B','a']])", fn () => Arr::sortRecursive(['l' => ['b', 'B', 'a']]));

// ---- Arr::sortRecursive recurses only into arrays: an object value is kept whole and unsorted
probe('sortRecursive-object-leaf', "Arr::sortRecursive(['d' => \$date, 'a' => 1]), (['l' => [\$date]]), (['o' => (object) ['b' => 1, 'a' => 2]]), (['m' => new ArrayObject(['b' => 1, 'a' => 2])]): keys, identity and the object's own key order", function () {
    $date = new DateTime('@0');
    $object = (object) ['b' => 1, 'a' => 2];
    $arrayObject = new ArrayObject(['b' => 1, 'a' => 2]);
    $map = Arr::sortRecursive(['d' => $date, 'a' => 1]);
    $inList = Arr::sortRecursive(['l' => [$date]]);
    $withObject = Arr::sortRecursive(['o' => $object]);
    $withArrayObject = Arr::sortRecursive(['m' => $arrayObject]);

    return [
        'map' => ['keys' => array_keys($map), 'kept' => $map['d'] === $date],
        'in-list' => $inList['l'][0] === $date,
        'object' => ['kept' => $withObject['o'] === $object, 'keys' => array_keys((array) $object)],
        'arrayObject' => ['kept' => $withArrayObject['m'] === $arrayObject, 'keys' => array_keys($arrayObject->getArrayCopy())],
    ];
});

// ---- the list twins: an object inside a list stays whole in sortRecursive; crossJoin walks a map argument's values
probe('sortRecursive-list-object-leaf', "Arr::sortRecursive([[\$date]]), Arr::sortRecursive([\$object]), Arr::sortRecursive([['o' => \$object]]): whether each object is kept", function () {
    $date = new DateTime('@0');
    $object = (object) ['b' => 1, 'a' => 2];

    return [
        'nested-list' => Arr::sortRecursive([[$date]])[0][0] === $date,
        'list' => Arr::sortRecursive([$object])[0] === $object,
        'map-in-list' => Arr::sortRecursive([['o' => $object]])[0]['o'] === $object,
    ];
});

// ---- 2. sortRecursive's array_is_list branch.
probe('sortRecursive-list-of-ints', 'Arr::sortRecursive([3,1,2])', fn () => Arr::sortRecursive([3, 1, 2]));
probe('sortRecursive-explicit-zero-based-keys', 'Arr::sortRecursive([0=>3,1=>1,2=>2])', fn () => Arr::sortRecursive([0 => 3, 1 => 1, 2 => 2]));
probe('sortRecursive-nested-lists', 'Arr::sortRecursive([[3,1,2],[9,8]])', fn () => Arr::sortRecursive([[3, 1, 2], [9, 8]]));
probe('sortRecursive-string-keys-stay-ksorted', "Arr::sortRecursive(['b'=>2,'a'=>1])", fn () => Arr::sortRecursive(['b' => 2, 'a' => 1]));
probe('sortRecursive-gapped-int-keys-stay-ksorted', 'Arr::sortRecursive([0=>3,2=>1])', fn () => Arr::sortRecursive([0 => 3, 2 => 1]));

// The ArrTest literal, respelled the way JavaScript can hold it: a plain object always
// enumerates integer keys ascending, so `[2=>'a',1=>'b',0=>'c']` arrives as `[0=>'c',...]`,
// which IS a list, and sorts by value rather than by key.
$srJs = [
    'users' => [
        ['name' => 'joe', 'mail' => 'joe@example.com', 'numbers' => [2, 1, 0]],
        ['name' => 'jane', 'age' => 25],
    ],
    'repositories' => [['id' => 1], ['id' => 0]],
    20 => [2, 1, 0],
    30 => [0 => 'c', 1 => 'b', 2 => 'a'],
];
probe('sortRecursive-literal-js-spelling', 'Arr::sortRecursive($srJs)', fn () => Arr::sortRecursive($srJs));

probe('sortRecursive-descending-int-keys', "Arr::sortRecursive([1 => 'a', 0 => 'b'])", fn () => arrayablePairs(Arr::sortRecursive([1 => 'a', 0 => 'b'])));
probe('sortRecursive-out-of-order', "Arr::sortRecursive([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => arrayablePairs(Arr::sortRecursive(OUT_OF_ORDER)));
probe('sortRecursive-out-of-order-key-and-value-sorts-disagree', "Arr::sortRecursive([2 => 'a', 0 => 'c', 1 => 'b'])", fn () => arrayablePairs(Arr::sortRecursive([2 => 'a', 0 => 'c', 1 => 'b'])));
// [1 => ..., 0 => ...] is not a list, so it is key-sorted and each key keeps its own value.
probe('sortRecursive-out-of-order-nested', "Arr::sortRecursive([1 => ['b' => 2, 'a' => 1], 0 => 'z'])", fn () => arrayablePairs(Arr::sortRecursive([1 => ['b' => 2, 'a' => 1], 0 => 'z'])));
// '1' lands on key 1's first position with the last value, so the array is [1 => 'b', 0 => 'c'].
probe('sortRecursive-collision', "Arr::sortRecursive([1 => 'a', 0 => 'c', '1' => 'b'])", fn () => arrayablePairs(Arr::sortRecursive([1 => 'a', 0 => 'c', '1' => 'b'])));
// '0' lands on key 0 with the last value, so the array is the LIST [0 => 'c', 1 => 'a'], sorted by value.
probe('sortRecursive-collision-makes-list', "Arr::sortRecursive([0 => 'b', 1 => 'a', '0' => 'c'])", fn () => arrayablePairs(Arr::sortRecursive([0 => 'b', 1 => 'a', '0' => 'c'])));

emit();
