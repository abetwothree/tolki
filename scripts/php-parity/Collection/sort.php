<?php

/**
 * Ground truth for Collection::sort().
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

// Task 7 (U3): every member of the sort/reverse family is key-PRESERVING in
// PHP (asort/arsort/array_reverse($x, true)), on integer keys included.
probe('sort/sortDesc/reverse preserve integer keys and their order', 'asort/arsort/array_reverse on [0=>3,1=>1,2=>2]', function () {
    $c = new \Illuminate\Support\Collection([0 => 3, 1 => 1, 2 => 2]);

    return [
        'sort_all' => $c->sort()->all(),
        'sort_values' => $c->sort()->values()->all(),
        'sortdesc_all' => $c->sortDesc()->all(),
        'sortdesc_values' => $c->sortDesc()->values()->all(),
        'reverse_all' => $c->reverse()->all(),
        'reverse_values' => $c->reverse()->values()->all(),
    ];
});

// Collection::sort forwards a non-callable string to asort as a SORT_* flag,
// so PHP has no answer for the string-as-field-path form the TS port adds.
probe('Collection::sort — a string callback is a sort flag, not a field path', 'sort(""), sort("0"), sort("age")', function () {
    $c = new \Illuminate\Support\Collection(['a' => 3, 'b' => 1, 'c' => 2]);

    $attempt = static function (string $callback) use ($c) {
        try {
            return $c->sort($callback)->all();
        } catch (\Throwable $e) {
            return ['threw' => get_class($e), 'message' => $e->getMessage()];
        }
    };

    return [
        'empty_string' => $attempt(''),
        'zero_string' => $attempt('0'),
        'non_callable_string' => $attempt('age'),
        'is_callable_age' => is_callable('age'),
    ];
});

// B6 — the same ordering seen through every sort entry point the port mirrors.
$mixed = ['9', '10', '1', 5];
probe('Collection::sort orders numeric strings numerically', 'collect(["9","10","1",5])->sort()->values()', fn () => collect($mixed)->sort()->values()->all());
probe('order-sort', 'collect(base)->sort()', fn () => d8Views(collect(d8Base())->sort()));
probe('order-sort-does-not-mutate', '$c = collect(base); $c->sort(); $c', function () {
    $c = collect(d8Base());
    $c->sort();

    return d8Views($c);
});

// ---- Family G ------------------------------------------------------------

// Key-preserving probes return [[key, value], ...] so integer keys and order survive json_encode.
$pairs = function ($items) use (&$pairs) {
    $out = [];
    foreach ($items instanceof Collection ? $items->all() : $items as $k => $v) {
        $out[] = [$k, $v instanceof Collection ? $pairs($v) : $v];
    }

    return $out;
};

probe('C32-G-sort-comparator', '(new Collection([5, 3, 1, 2, 4]))->sort(fn ($a, $b) => $a <=> $b)->values()->all()',
    fn () => (new Collection([5, 3, 1, 2, 4]))->sort(fn ($a, $b) => $a <=> $b)->values()->all());
probe('C32-G-sort-comparator-desc', '(new Collection([5, 3, 1, 2, 4]))->sort(fn ($a, $b) => $b <=> $a)->values()->all()',
    fn () => (new Collection([5, 3, 1, 2, 4]))->sort(fn ($a, $b) => $b <=> $a)->values()->all());
probe('C32-G-sort-comparator-assoc', "(new Collection(['a' => 3, 'b' => 1, 'c' => 2]))->sort(fn (\$x, \$y) => \$x <=> \$y)->all()",
    fn () => $pairs((new Collection(['a' => 3, 'b' => 1, 'c' => 2]))->sort(fn ($x, $y) => $x <=> $y)));
probe('C32-G-sort-comparator-rows', "(new Collection([['n' => 2], ['n' => 1], ['n' => 3]]))->sort(fn (\$a, \$b) => \$a['n'] <=> \$b['n'])->values()->all()",
    fn () => (new Collection([['n' => 2], ['n' => 1], ['n' => 3]]))->sort(fn ($a, $b) => $a['n'] <=> $b['n'])->values()->all());

// Ties and groups over integer keys out of order, which only a Map-built collection holds in JS.
$gTies = [2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']];
probe('C32-G-sort-comparator-out-of-order', "(new Collection([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']]))->sort(fn (\$a, \$b) => \$a['n'] <=> \$b['n'])",
    fn () => $pairs((new Collection($gTies))->sort(fn ($a, $b) => $a['n'] <=> $b['n'])));
probe('C32-G-sort-comparator-int-cast', "(new Collection([3, 1, 2]))->sort(\$comparator)->values()->all() for a comparator answering a fraction below 1, an infinity and NAN, which uasort() casts to 0", fn () => array_map(fn (Closure $comparator) => @(new Collection([3, 1, 2]))->sort($comparator)->values()->all(), [
    'fraction' => fn ($a, $b) => ($a - $b) / 10,
    'infinity' => fn ($a, $b) => ($a <=> $b) * INF,
    'NAN' => fn () => NAN,
]));
// a bool comparator is deprecated but still sorts: true is 1, and false asks again with the operands swapped, where
// true is -1 (the deprecation notices are silenced)
probe('C32-G-sort-bool-comparator', "usort, uasort and uksort, then Collection::sort() and sortKeysUsing(), with a comparator answering a bool", function () {
    $usort = [3, 1, 2];
    @usort($usort, fn ($a, $b) => $a > $b);
    $usortDescending = [3, 1, 2];
    @usort($usortDescending, fn ($a, $b) => $a < $b);
    $usortLonger = [5, 3, 9, 1, 7, 2, 8];
    @usort($usortLonger, fn ($a, $b) => $a > $b);
    $usortFalse = [3, 1, 2];
    @usort($usortFalse, fn () => false);
    $uasort = [3, 1, 2];
    @uasort($uasort, fn ($a, $b) => $a > $b);
    $uksort = ['c' => 1, 'a' => 2, 'b' => 3];
    @uksort($uksort, fn ($a, $b) => $a > $b);
    $sorted = @(new Collection([3, 1, 2]))->sort(fn ($a, $b) => $a > $b);
    $sortedKeyed = @(new Collection(['x' => 3, 'y' => 1, 'z' => 2]))->sort(fn ($a, $b) => $a > $b);
    $sortedKeys = @(new Collection(['c' => 1, 'a' => 2, 'b' => 3]))->sortKeysUsing(fn ($a, $b) => $a > $b);

    return [
        'usort' => $usort,
        'usort descending' => $usortDescending,
        'usort longer' => $usortLonger,
        'usort always false' => $usortFalse,
        'uasort' => ['keys' => array_keys($uasort), 'values' => array_values($uasort)],
        'uksort' => array_keys($uksort),
        'sort' => ['keys' => $sorted->keys()->all(), 'values' => $sorted->values()->all()],
        'sort keyed' => ['keys' => $sortedKeyed->keys()->all(), 'values' => $sortedKeyed->values()->all()],
        'sortKeysUsing' => $sortedKeys->keys()->all(),
    ];
});
probe('C32-G-sort-comparator-past-int-range', "usort([3, 1, 2]) and (new Collection([3, 1, 2]))->sort() with a comparator answering (\$a <=> \$b) * 1e19, which the int cast wraps to the opposite sign, and usort() with one answering (\$a <=> \$b) * 2**64, which it wraps to 0", function () {
    $wrapped = [3, 1, 2];
    @usort($wrapped, fn ($a, $b) => ($a <=> $b) * 1e19);
    $zero = [3, 1, 2];
    @usort($zero, fn ($a, $b) => ($a <=> $b) * 18446744073709551616.0);

    return [
        'usort 1e19' => $wrapped,
        'usort 2**64' => $zero,
        'sort 1e19' => @(new Collection([3, 1, 2]))->sort(fn ($a, $b) => ($a <=> $b) * 1e19)->values()->all(),
    ];
});
probe('C32-G-sort-desc-mixed-keys', "(new Collection([0 => 1, 'x' => 2])) sorted descending by sort(fn (\$a, \$b) => \$b <=> \$a), sortByDesc(fn (\$v) => \$v) and sortDesc()", fn () => [
    'sort' => $pairs((new Collection([0 => 1, 'x' => 2]))->sort(fn ($a, $b) => $b <=> $a)),
    'sortByDesc' => $pairs((new Collection([0 => 1, 'x' => 2]))->sortByDesc(fn ($v) => $v)),
    'sortDesc' => $pairs((new Collection([0 => 1, 'x' => 2]))->sortDesc()),
]);

emit();
