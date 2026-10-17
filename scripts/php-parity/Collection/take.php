<?php

/**
 * Ground truth for Collection::take().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

// CollectionTest::testTakeLast — a negative take keeps the ORIGINAL keys.
probe('collection-take-negative-keeps-keys', "(new Collection(['taylor','dayle','shawn']))->take(-2)", fn () => (new Collection(['taylor', 'dayle', 'shawn']))->take(-2)->all());
probe('collection-take-positive-keeps-keys', "(new Collection(['taylor','dayle','shawn']))->take(2)", fn () => (new Collection(['taylor', 'dayle', 'shawn']))->take(2)->all());
probe('collection-take-zero', "(new Collection(['taylor','dayle','shawn']))->take(0)", fn () => (new Collection(['taylor', 'dayle', 'shawn']))->take(0)->all());

// ==== P-39: what a Traversable backing answers, against what a string backing answers.
// Collection materialises a Traversable through iterator_to_array, so take(2) sees its
// elements; a string is not Traversable, so (array) wraps it as one item.

probe('take-traversable-backing', "(new Collection(new ArrayIterator([1, 2, 3])))->take(2)", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->take(2)->all());
probe('take-string-backing', "(new Collection('abc'))->take(2)", fn () => (new Collection('abc'))->take(2)->all());
probe('order-take', 'collect(base)->take(2)', fn () => d8Views(collect(d8Base())->take(2)));
probe('order-take-negative', 'collect(base)->take(-2)', fn () => d8Views(collect(d8Base())->take(-2)));
probe('take-out-of-order-collection', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->take(2)", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->take(2)->all()));
probe('take-out-of-order-negative-collection', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->take(-1)", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->take(-1)->all()));
probe('take-collision-negative', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->take(-1)", fn () => arrayablePairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->take(-1)->all()));

// take() and combine() gained Collection tests alongside the LazyCollection fixes (#61659, #61696).
probe('take-negative-past-size', "(new Collection(['taylor', 'dayle', 'shawn']))->take(-5)->all()", fn () => (new Collection(['taylor', 'dayle', 'shawn']))->take(-5)->all());

// ---- Family G ------------------------------------------------------------

// Key-preserving probes return [[key, value], ...] so integer keys and order survive json_encode.
$pairs = function ($items) use (&$pairs) {
    $out = [];
    foreach ($items instanceof Collection ? $items->all() : $items as $k => $v) {
        $out[] = [$k, $v instanceof Collection ? $pairs($v) : $v];
    }

    return $out;
};
probe('C32-G-take-assoc-negative', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->take(-2)->all()",
    fn () => (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->take(-2)->all());
probe('C32-G-take-counts', "(new Collection([1, 2, 3, 4, 5, 6]))->take(\$limit) for 1.5, -1.5, NAN, INF, -INF, 1e19 and -1e19", fn () => array_map(
    fn (float $limit) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5, 6]))->take($limit))),
    ['1.5' => 1.5, '-1.5' => -1.5, 'NAN' => NAN, 'INF' => INF, '-INF' => -INF, '1e19' => 1e19, '-1e19' => -1e19],
));

emit();
