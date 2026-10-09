<?php

/**
 * Ground truth for Arr::sortDesc().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// Keeps PHP's deprecation notices off stdout, where they would corrupt emit()'s JSON.
error_reporting(E_ALL & ~E_DEPRECATED);

probe('Arr::sortDesc numeric comparison', 'Arr::sortDesc([1,10,9])', function () {
    return array_values(Arr::sortDesc([1, 10, 9]));
});
$desc = [['age' => 2], ['age' => 10]];
probe('sortDesc overrides an explicit "asc" direction', 'Arr::sortDesc($u, [["age","asc"]])', fn () => array_values(Arr::sortDesc($desc, [['age', 'asc']])));

// B6 — the same ordering seen through every sort entry point the port mirrors.
$mixed = ['9', '10', '1', 5];
probe('Arr::sortDesc orders numeric strings numerically', 'Arr::sortDesc(["9","10","1",5])', fn () => array_values(Arr::sortDesc($mixed)));
probe('sortDesc-rows-natural', "Arr::sortDesc(['a'=>['name'=>'Chair'],'b'=>['name'=>'Desk']])", fn () => Arr::sortDesc(['a' => ['name' => 'Chair'], 'b' => ['name' => 'Desk']]));
probe('sortDesc-rows-natural-keys', "array_keys(...)", fn () => array_keys(Arr::sortDesc(['a' => ['name' => 'Chair'], 'b' => ['name' => 'Desk']])));
probe('sortDesc-scalar-keys', "array_keys(Arr::sortDesc(['c'=>3,'a'=>1,'b'=>2]))", fn () => array_keys(Arr::sortDesc(['c' => 3, 'a' => 1, 'b' => 2])));

// fix-round-1: "sorts rows descending with a closure selector and a dot-notation key" also
// makes a list-backed dot-key call the natural-sort probes above don't cover.
probe('sortDesc-rows-list-dot-key', "array_values(Arr::sortDesc([['meta'=>['k'=>1]],['meta'=>['k'=>2]]], 'meta.k'))", fn () => array_values(Arr::sortDesc([['meta' => ['k' => 1]], ['meta' => ['k' => 2]]], 'meta.k')));

$ties = [2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']];
probe('sortDesc-out-of-order-ties', "Arr::sortDesc([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], 'n')", fn () => arrayablePairs(Arr::sortDesc($ties, 'n')));
probe('sortDesc-out-of-order-ties-callback-order', "Arr::sortDesc([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], fn (\$v, \$k) => \$v['n']) => keys seen", fn () => keysSeen(fn ($cb) => Arr::sortDesc($ties, $cb), fn ($v) => $v['n']));
probe('sortDesc-mixed-callback-order', "Arr::sortDesc(['x' => 1, 0 => 2, 'y' => 3], fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => Arr::sortDesc(MIXED, $cb), fn ($v) => $v));
probe('sortDesc-out-of-order-loose-ties', "Arr::sortDesc([2 => '1', 0 => 1, 1 => '01'])", fn () => arrayablePairs(Arr::sortDesc([2 => '1', 0 => 1, 1 => '01'])));
probe('sortDesc-out-of-order-ties-descriptor', "Arr::sortDesc([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']], [['n', 'asc']])", fn () => arrayablePairs(Arr::sortDesc($ties, [['n', 'asc']])));
probe('sortDesc-collision-loose-ties', "Arr::sortDesc([1 => '1', 0 => 1, '1' => '01'])", fn () => arrayablePairs(Arr::sortDesc([1 => '1', 0 => 1, '1' => '01'])));
probe('sortDesc-out-of-order-rows-by-path', "Arr::sortDesc([2 => ['n' => 0], 0 => ['n' => 1]], 'n')", fn () => arrayablePairs(Arr::sortDesc([2 => ['n' => 0], 0 => ['n' => 1]], 'n')));
probe('sortDesc-out-of-order-rows-by-descriptor', "Arr::sortDesc([2 => ['n' => 0], 0 => ['n' => 1]], [['n', 'asc']])", fn () => arrayablePairs(Arr::sortDesc([2 => ['n' => 0], 0 => ['n' => 1]], [['n', 'asc']])));

emit();
