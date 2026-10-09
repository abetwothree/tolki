<?php

/**
 * Ground truth for Arr::get().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('Arr::get — literal dotted key wins', 'Arr::get(["products.desk"=>[...]], "products.desk")', function () {
    return Arr::get(['products.desk' => ['price' => 100]], 'products.desk');
});

probe('X26 get/has/exists resolve a literal dotted key first', "Arr::get(['a.b'=>'literal','a'=>['b'=>'nested']],'a.b')", function () {
    $data = ['a.b' => 'literal', 'a' => ['b' => 'nested']];

    return [
        'get' => Arr::get($data, 'a.b'),
        'has' => Arr::has($data, 'a.b'),
        'exists' => Arr::exists($data, 'a.b'),
        'getList' => Arr::get(nums(), 2),
        'hasList' => Arr::has(nums(), 2),
        'existsList' => Arr::exists(nums(), 2),
    ];
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

// --- get
probe('get-null-value', "Arr::get(['foo' => null], 'foo', 'default')", fn () => Arr::get(['foo' => null, 'bar' => ['baz' => null]], 'foo', 'default'));
probe('get-nested-null-value', "Arr::get(['bar' => ['baz' => null]], 'bar.baz', 'default')", fn () => Arr::get(['foo' => null, 'bar' => ['baz' => null]], 'bar.baz', 'default'));
probe('get-through-list', "Arr::get(['products' => [['name' => 'desk'], ['name' => 'chair']]], 'products.0.name')", fn () => Arr::get(['products' => [['name' => 'desk'], ['name' => 'chair']]], 'products.0.name'));
probe('get-through-list-2', "Arr::get(['products' => [['name' => 'desk'], ['name' => 'chair']]], 'products.1.name')", fn () => Arr::get(['products' => [['name' => 'desk'], ['name' => 'chair']]], 'products.1.name'));
probe('get-through-list-missing', "Arr::get(['products' => [['name' => 'desk']]], 'products.2.name', 'none')", fn () => Arr::get(['products' => [['name' => 'desk']]], 'products.2.name', 'none'));
probe('get-through-list-length', "Arr::get(['products' => [1, 2, 3]], 'products.length', 'none')", fn () => Arr::get(['products' => [1, 2, 3]], 'products.length', 'none'));
probe('get-through-list-leading-zero', "Arr::get(['products' => [1, 2, 3]], 'products.01', 'none')", fn () => Arr::get(['products' => [1, 2, 3]], 'products.01', 'none'));
probe('get-false', "Arr::get(false, 'foo', 'default')", fn () => Arr::get(false, 'foo', 'default'));
probe('get-empty-null-key', 'Arr::get([], null)', fn () => Arr::get([], null));
probe('get-empty-null-key-default', "Arr::get([], null, 'default')", fn () => Arr::get([], null, 'default'));
probe('get-empty-string-key', "Arr::get(['' => 'bar'], '')", fn () => Arr::get(['' => 'bar'], ''));
probe('get-dot-only-key', "Arr::get(['' => ['' => 'bar']], '.')", fn () => Arr::get(['' => ['' => 'bar']], '.'));
probe('get-through-null', "Arr::get(['parent' => ['products' => ['desk' => null]]], 'parent.products.desk.price')", fn () => Arr::get(['parent' => ['products' => ['desk' => null]]], 'parent.products.desk.price'));
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

// ---- a non-canonical index string is a string key, so a list never holds it (get-through-list-leading-zero)
$nonCanonicalIndices = ['01', ' 1', '1e0', '+1', '0x1', '-0', '1 '];
probe('get-list-non-canonical-index', "Arr::get(['x', 'y'], \$k, 'd') and Arr::get([['x', 'y']], \"0.\$k\", 'd')", function () use ($nonCanonicalIndices) {
    $result = [];

    foreach ($nonCanonicalIndices as $k) {
        $result[$k] = ['top' => Arr::get(['x', 'y'], $k, 'd'), 'nested' => Arr::get([['x', 'y']], "0.{$k}", 'd')];
    }

    return $result;
});

// ---- Arr::get and Arr::has look an integer segment up as a key, so a map inside a list answers it too
probe('get-list-int-segment-into-map', "Arr::get([[0 => 'x']], '0.0', 'd'), Arr::get([['k' => 'v', 0 => 'x']], '0.0', 'd'), Arr::get([[[1 => 'z']]], '0.0.1', 'd'), Arr::has(…), data_get([['k' => 'v', 0 => 'x']], '0.0', 'd')", fn () => [
    'get' => Arr::get([[0 => 'x']], '0.0', 'd'),
    'get-map' => Arr::get([['k' => 'v', 0 => 'x']], '0.0', 'd'),
    'get-deep' => Arr::get([[[1 => 'z']]], '0.0.1', 'd'),
    'get-missing' => Arr::get([[1 => 'z']], '0.0', 'd'),
    'has' => Arr::has([[0 => 'x']], '0.0'),
    'has-missing' => Arr::has([[1 => 'z']], '0.0'),
    'data_get' => data_get([['k' => 'v', 0 => 'x']], '0.0', 'd'),
]);

// The read side of the same cast, for the round trip: an empty segment names the "" key,
// and "01" never reaches a list's index 1.
probe('get-write-path-key-cast', "Arr::get with an empty segment, a non-canonical index, and a stored '01' key", fn () => [
    "[['' => 1]] '0.'" => Arr::get([['' => 1]], '0.'),
    "[['a','b']] '0.01'" => Arr::get([['a', 'b']], '0.01'),
    "[['01' => 'z']] '0.01'" => Arr::get([['01' => 'z']], '0.01'),
    "['a','b'] '01'" => Arr::get(['a', 'b'], '01'),
]);
probe('get-through-empty-segment', "Arr::get(['a'=>[''=>['b'=>7]]], 'a..b')", fn () => Arr::get(['a' => ['' => ['b' => 7]]], 'a..b'));

// ---- 7. Controls: answers that do not depend on order.
probe('get-out-of-order-int-key', "Arr::get([2 => 'c', 0 => 'a', 1 => 'b'], 2)", fn () => Arr::get(OUT_OF_ORDER, 2));
probe('get-mixed-string-key', "Arr::get(['x' => 1, 0 => 2, 'y' => 3], 'y')", fn () => Arr::get(MIXED, 'y'));

emit();
