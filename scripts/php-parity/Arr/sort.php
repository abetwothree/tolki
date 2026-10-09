<?php

/**
 * Ground truth for Arr::sort().
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

// Keeps PHP's deprecation notices off stdout, where they would corrupt emit()'s JSON.
error_reporting(E_ALL & ~E_DEPRECATED);

probe('Arr::sort multi-key', 'Arr::sort($u, ["name","age","meta.key"])', function () {
    $u = [
        'd' => ['name' => 'Item', 'age' => 10, 'meta' => ['key' => 3]],
        'a' => ['name' => 'Item', 'age' => 2,  'meta' => ['key' => 1]],
        'c' => ['name' => 'Apple','age' => 10, 'meta' => ['key' => 2]],
    ];

    return array_values(Arr::sort($u, ['name', 'age', 'meta.key']));
});

// sortByMany reads Arr::get($comparison, 1, true): true and 'asc' sort ascending, false and 'desc' descending,
// a missing direction means true, and anything unrecognized falls through to descending.
probe('direction tuple [age,false] — descending', 'Arr::sort($u, ["name",["age",false]])', function () {
    $u = ['a' => ['name' => 'Item', 'age' => 2], 'b' => ['name' => 'Item', 'age' => 10]];

    return array_values(Arr::sort($u, ['name', ['age', false]]));
});

probe('direction tuple [age,true] — ascending', 'Arr::sort($u, ["name",["age",true]])', function () {
    $u = ['a' => ['name' => 'Item', 'age' => 10], 'b' => ['name' => 'Item', 'age' => 2]];

    return array_values(Arr::sort($u, ['name', ['age', true]]));
});

probe('direction tuple [age,"desc"] — string form', 'Arr::sort($u, [["age","desc"]])', function () {
    return array_values(Arr::sort(['a' => ['age' => 2], 'b' => ['age' => 10]], [['age', 'desc']]));
});

probe('direction tuple [age] — omitted defaults to ascending', 'Arr::sort($u, [["age"]])', function () {
    return array_values(Arr::sort(['a' => ['age' => 10], 'b' => ['age' => 2]], [['age']]));
});

probe('direction tuple [age,"BOGUS"] — default arm is DESCENDING', 'Arr::sort($u, [["age","BOGUS"]])', function () {
    return array_values(Arr::sort(['a' => ['age' => 2], 'b' => ['age' => 10]], [['age', 'BOGUS']]));
});

// An empty comparisons array is a no-op: uasort's comparator returns null (0) for every pair, keeping insertion order.
probe('Arr::sort — empty descriptor array preserves insertion order', 'Arr::sort($u, [])', function () {
    return array_values(Arr::sort(['a' => 5, 'b' => 1, 'c' => 3], []));
});

// Task 7 (U2): sortBy(null) is asort() on RAW values, so -1 precedes 0. The
// TS port ordered PHP-falsy values ahead of everything and treated them as
// equal, which put 0 before -1.
probe('sort orders falsy values by value, not by falsiness', 'asort([-1,0,5])', function () {
    $natural = ['a' => -1, 'b' => 0, 'c' => 5];
    asort($natural);

    return [
        'natural' => $natural,
        'arr_sort' => Arr::sort([-1, 0, 5]),
        'collection_sortby_null' => (new \Illuminate\Support\Collection(['a' => -1, 'b' => 0, 'c' => 5]))->sortBy(null)->all(),
        'sortdesc_values' => (new \Illuminate\Support\Collection([3, 1, 2]))->sortDesc()->values()->all(),
        'reverse_values' => (new \Illuminate\Support\Collection([3, 1, 2]))->reverse()->values()->all(),
    ];
});

// Task 7 (U2): the same falsy set behind a string field path, which the TS
// port sorted with its own hand-rolled falsy-first comparison.
probe('sort by a string field orders falsy field values by value', 'Arr::sort($u, "n")', function () {
    $u = ['a' => ['n' => -1], 'b' => ['n' => 0], 'c' => ['n' => 5]];

    return [
        'arr_sort_field' => Arr::sort($u, 'n'),
        'collection_sortby_field' => (new \Illuminate\Support\Collection($u))->sortBy('n')->all(),
    ];
});

probe('X28 sort accepts multi-key and [key, direction] descriptors', 'Arr::sort(..., [...])', function () {
    $records = [['id' => 3, 'name' => 'c'], ['id' => 1, 'name' => 'a'], ['id' => 2, 'name' => 'b']];

    return [
        'byKey' => array_values(Arr::sort($records, 'id')),
        'descriptor' => array_values(Arr::sort($records, [['id', false]])),
        'plain' => Arr::sort([30, 10, 20]),
        'empty' => Arr::sort([3, 1, 2], []),
    ];
});

probe('sort with no comparisons leaves the order alone', 'Arr::sort([3,1,2],[])', function () {
    return Arr::sort([3, 1, 2], []);
});

// T2 — the three direction arms Obj.sort's copy of the comparator never reached
$asc = [['age' => 10], ['age' => 2]];
probe('direction tuple [age,"asc"] — string form', 'Arr::sort($u, [["age","asc"]])', fn () => array_values(Arr::sort($asc, [['age', 'asc']])));
probe('direction tuple [age,SortDirection::Ascending]', 'Arr::sort($u, [["age",SortDirection::Ascending]])', fn () => array_values(Arr::sort($asc, [['age', SortDirection::Ascending]])));

// Collection.php:1646-1657 — Arr::wrap($comparison) then is_callable($prop), so a
// comparator nested in a one-element descriptor runs as a comparator
$rows = [['age' => 3], ['age' => 1], ['age' => 2]];
$byAge = fn ($a, $b) => $a['age'] <=> $b['age'];
probe('Arr::sort runs a comparator nested in a one-element descriptor', 'Arr::sort($rows, [[$byAge]])', fn () => array_values(Arr::sort($rows, [[$byAge]])));

// B6 — the same ordering seen through every sort entry point the port mirrors.
$mixed = ['9', '10', '1', 5];
probe('Arr::sort orders numeric strings numerically', 'Arr::sort(["9","10","1",5])', fn () => array_values(Arr::sort($mixed)));

// B6 — a keyed backing, which is what Obj.sort and sortByMany walk.
$rows = [['n' => '9'], ['n' => '10'], ['n' => '1'], ['n' => 5]];
probe('Arr::sort by key orders numeric strings numerically', 'Arr::sort($rows, "n")', fn () => array_values(Arr::sort($rows, 'n')));

// ---- sort
probe('sort-rows-natural', "Arr::sort(['a'=>['name'=>'Desk'],'b'=>['name'=>'Chair']])", fn () => Arr::sort(['a' => ['name' => 'Desk'], 'b' => ['name' => 'Chair']]));
probe('sort-rows-natural-keys', "array_keys(...)", fn () => array_keys(Arr::sort(['a' => ['name' => 'Desk'], 'b' => ['name' => 'Chair']])));

$sbm = [
    'a' => ['name' => 'John', 'age' => 8, 'meta' => ['key' => 3]],
    'b' => ['name' => 'John', 'age' => 10, 'meta' => ['key' => 5]],
    'c' => ['name' => 'Dave', 'age' => 10, 'meta' => ['key' => 3]],
    'd' => ['name' => 'John', 'age' => 8, 'meta' => ['key' => 2]],
];
probe('sortByMany-keys', "Arr::sort(\$sbm, ['name','age','meta.key'])", fn () => Arr::sort($sbm, ['name', 'age', 'meta.key']));
probe('sortByMany-keys-order', "array_keys", fn () => array_keys(Arr::sort($sbm, ['name', 'age', 'meta.key'])));
probe('sortByMany-order', "Arr::sort(\$sbm, ['name',['age',false],['meta.key',true]])", fn () => array_keys(Arr::sort($sbm, ['name', ['age', false], ['meta.key', true]])));
probe('sortByMany-callable', "Arr::sort(\$sbm, [cmp name, cmp age desc, ['meta.key', true]])", fn () => Arr::sort($sbm, [
    fn ($a, $b) => $a['name'] <=> $b['name'],
    fn ($a, $b) => $b['age'] <=> $a['age'],
    ['meta.key', true],
]));
probe('sortByMany-callable-keys', "array_keys", fn () => array_keys(Arr::sort($sbm, [
    fn ($a, $b) => $a['name'] <=> $b['name'],
    fn ($a, $b) => $b['age'] <=> $a['age'],
    ['meta.key', true],
])));
// ---- callback key types: PHP hands a callback an integer key as an int
$keyTypes = function (callable $run, mixed $result = true): array {
    $seen = [];

    try {
        $run(function ($value, $key) use (&$seen, $result) {
            $seen[] = gettype($key);

            return $result;
        });
    } catch (\Throwable) {
    }

    return $seen;
};
$intKeyed = [1 => 'a', 'x' => 'b'];
probe('callback-key sort', 'Arr::sort([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::sort($intKeyed, $cb), 0));

// ==== fix-round-1 (batch A7-A9 citation sweep): dataSort/dataSortDesc's plain-scalar object
// test cited "sort(Desc)-rows-natural-keys", whose actual fixture is Desk/Chair rows, not
// {c:3,a:1,b:2}. Dedicated probes for the exact scalar-object call, ascending and descending.
probe('sort-scalar-keys', "array_keys(Arr::sort(['c'=>3,'a'=>1,'b'=>2]))", fn () => array_keys(Arr::sort(['c' => 3, 'a' => 1, 'b' => 2])));

// fix-round-1: "sorts rows with a closure selector and a dot-notation key" only cited the
// no-selector natural-sort probes; the closure/dot-key/list calls it also makes need their own.
probe('sort-rows-closure-keys', "array_keys(Arr::sort(['a'=>['name'=>'Desk'],'b'=>['name'=>'Chair']], fn(\$v)=>\$v['name']))", fn () => array_keys(Arr::sort(['a' => ['name' => 'Desk'], 'b' => ['name' => 'Chair']], fn ($v) => $v['name'])));
probe('sort-rows-dot-key-keys', "array_keys(Arr::sort(['a'=>['meta'=>['k'=>2]],'b'=>['meta'=>['k'=>1]]], 'meta.k'))", fn () => array_keys(Arr::sort(['a' => ['meta' => ['k' => 2]], 'b' => ['meta' => ['k' => 1]]], 'meta.k')));
probe('sort-rows-list-closure', "array_values(Arr::sort([['name'=>'Desk'],['name'=>'Chair']], fn(\$v)=>\$v['name']))", fn () => array_values(Arr::sort([['name' => 'Desk'], ['name' => 'Chair']], fn ($v) => $v['name'])));

// fix-round-1 (Important 2 — missing array-backed siblings): dataSort's sortByMany and
// per-key-direction tests were object-only; add the equivalent list-backed calls.
$sbmList = [
    ['name' => 'John', 'age' => 8, 'meta' => ['key' => 3]],
    ['name' => 'John', 'age' => 10, 'meta' => ['key' => 5]],
    ['name' => 'Dave', 'age' => 10, 'meta' => ['key' => 3]],
    ['name' => 'John', 'age' => 8, 'meta' => ['key' => 2]],
];
probe('sortByMany-keys-list', "array_values(Arr::sort(\$sbmList, ['name','age','meta.key']))", fn () => array_values(Arr::sort($sbmList, ['name', 'age', 'meta.key'])));
probe('sortByMany-order-list', "array_values(Arr::sort(\$sbmList, ['name',['age',false],['meta.key',true]]))", fn () => array_values(Arr::sort($sbmList, ['name', ['age', false], ['meta.key', true]])));

// F-2 — the same rule seen through Arr::sort, which is the entry point this
// port mirrors: counts order the rows before any element is looked at.
probe('Arr::sort orders lists of arrays by count first', 'Arr::sort([[9,9],[10],[1,2,3]])', fn () => array_values(Arr::sort([[9, 9], [10], [1, 2, 3]])));
probe('Arr::sort orders equal-count rows element-wise', 'Arr::sort([["id"=>2],["id"=>10],["id"=>1]])', fn () => array_values(Arr::sort([['id' => 2], ['id' => 10], ['id' => 1]])));

$ties = [2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']];
probe('sort-out-of-order', "Arr::sort([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => arrayablePairs(Arr::sort(OUT_OF_ORDER)));
probe('sort-out-of-order-ties', "Arr::sort([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], 'n')", fn () => arrayablePairs(Arr::sort($ties, 'n')));
probe('sort-out-of-order-ties-callback', "Arr::sort([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], fn (\$v, \$k) => \$v['n'])", fn () => arrayablePairs(Arr::sort($ties, fn ($v, $k) => $v['n'])));
probe('sort-out-of-order-ties-callback-order', "Arr::sort([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], fn (\$v, \$k) => \$v['n']) => keys seen", fn () => keysSeen(fn ($cb) => Arr::sort($ties, $cb), fn ($v) => $v['n']));
probe('sort-out-of-order-ties-descriptor', "Arr::sort([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], [['n', 'asc']])", fn () => arrayablePairs(Arr::sort($ties, [['n', 'asc']])));
probe('sort-mixed-callback-order', "Arr::sort(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => Arr::sort(MIXED, $cb), fn ($v) => $v));
probe('sort-out-of-order-loose-ties', "Arr::sort([2 => '1', 0 => 1, 1 => '01'])", fn () => arrayablePairs(Arr::sort([2 => '1', 0 => 1, 1 => '01'])));
// '1' lands on key 1's first position with the last value, '01', which ties 1 loosely.
probe('sort-collision-loose-ties', "Arr::sort([1 => '1', 0 => 1, '1' => '01'])", fn () => arrayablePairs(Arr::sort([1 => '1', 0 => 1, '1' => '01'])));
// The rows are arrays here; in JS the same rows as Maps cannot be read by path (see the tests).
probe('sort-out-of-order-rows-by-path', "Arr::sort([2 => ['n' => 1], 0 => ['n' => 0]], 'n')", fn () => arrayablePairs(Arr::sort([2 => ['n' => 1], 0 => ['n' => 0]], 'n')));
probe('sort-out-of-order-rows-by-descriptor', "Arr::sort([2 => ['n' => 1], 0 => ['n' => 0]], [['n', 'asc']])", fn () => arrayablePairs(Arr::sort([2 => ['n' => 1], 0 => ['n' => 0]], [['n', 'asc']])));
probe('C32-G-sortBy-bool-comparator', "sortBy() with a comparator answering a bool, alone and ahead of 'y', sortBy() with one answering 0.5 ahead of 'y', and Arr::sort() with a bool comparator", fn () => [
    'alone' => @(new Collection([['x' => 3], ['x' => 1], ['x' => 2]]))->sortBy([fn ($p, $q) => $p['x'] > $q['x']])->values()->all(),
    'ahead of y' => @(new Collection([['x' => 1, 'y' => 2], ['x' => 1, 'y' => 1]]))->sortBy([fn ($p, $q) => $p['x'] > $q['x'], 'y'])->values()->all(),
    'zero ahead of y' => (new Collection([['x' => 1, 'y' => 2], ['x' => 1, 'y' => 1]]))->sortBy([fn ($p, $q) => 0, 'y'])->values()->all(),
    'fraction ahead of y' => @(new Collection([['x' => 1, 'y' => 2], ['x' => 1, 'y' => 1]]))->sortBy([fn ($p, $q) => 0.5, 'y'])->values()->all(),
    'Arr::sort list' => @Arr::sort([3, 1, 2], [fn ($a, $b) => $a > $b]),
    'Arr::sort keyed' => @Arr::sort(['c' => 3, 'a' => 1, 'b' => 2], [fn ($a, $b) => $a > $b]),
]);

emit();
