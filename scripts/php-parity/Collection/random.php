<?php

/**
 * Ground truth for Collection::random().
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

probe('random-traversable-backing-count', "count((new Collection(new ArrayIterator([1, 2, 3])))->random(2)->all())", fn () => count((new Collection(new ArrayIterator([1, 2, 3])))->random(2)->all()));
probe('C32-C-random-record-count-is-list', 'array_is_list((new Collection(["a" => 1, "b" => 2, "c" => 3]))->random(2)->all()) / random(0) / random(3, true) on [10, 20, 30]', fn () => [
    array_is_list((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->random(2)->all()),
    (new Collection(['a' => 1]))->random(0)->all(),
    array_is_list((new Collection([10, 20, 30]))->random(3, true)->all()),
]);
probe('C32-C-random-negative-count', '(new Collection([1, 2, 3]))->random(-1)->all()', fn () => (new Collection([1, 2, 3]))->random(-1)->all());
probe('C32-C-random-float-count', '(new Collection([1, 2, 3]))->random(1.2)->count() / random(2.9)->count(), with deprecations', fn () => [
    (new Collection([1, 2, 3]))->random(1.2)->count(),
    (new Collection([1, 2, 3]))->random(2.9)->count(),
]);
probe('C32-C-random-callable-count', '(new Collection([1, 2, 3]))->random(fn ($c) => $c instanceof Collection ? 2 : 0)->count() / random(fn () => 0)->all() / random(fn () => 5)', function () {
    $out = [
        (new Collection([1, 2, 3]))->random(fn ($c) => $c instanceof Collection ? 2 : 0)->count(),
        (new Collection([1, 2, 3]))->random(fn () => 0)->all(),
    ];
    try {
        (new Collection([1, 2, 3]))->random(fn () => 5);
    } catch (\Throwable $e) {
        $out[] = [get_class($e), $e->getMessage()];
    }

    return $out;
});
probe('C32-C-random-too-many-count', '(new Collection([1, 2, 3]))->random(4)', fn () => (new Collection([1, 2, 3]))->random(4));
probe('C32-C-random-preserved-string-keys', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->random(3, true)->all() / array_is_list(random(2, true)->all())", fn () => [
    (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->random(3, true)->all(),
    array_is_list((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->random(2, true)->all()),
]);
probe('C32-C-random-non-finite-count', "NAN, INF and -INF as the count of (new Collection([1, 2, 3]))->random(...)->all() and of Arr::random over [1, 2, 3] (list) and ['a' => 1, 'b' => 2, 'c' => 3] (keyed): the answer, or the class and message thrown", fn () => array_map(fn (float $count) => [
    'collection' => c32c_outcome(fn () => (new Collection([1, 2, 3]))->random($count)->all()),
    'list' => c32c_outcome(fn () => Arr::random([1, 2, 3], $count)),
    'keyed' => c32c_outcome(fn () => Arr::random(['a' => 1, 'b' => 2, 'c' => 3], $count)),
], ['NAN' => NAN, 'INF' => INF, '-INF' => -INF]));
probe('C32-C-random-non-numeric-string-count', "'abc' and '1x' as the count of (new Collection([1, 2, 3]))->random(...)->all() and of Arr::random over [1, 2, 3] (list) and ['a' => 1, 'b' => 2, 'c' => 3] (keyed): the class and message thrown", fn () => array_map(fn (string $count) => [
    'collection' => c32c_outcome(fn () => (new Collection([1, 2, 3]))->random($count)->all()),
    'list' => c32c_outcome(fn () => Arr::random([1, 2, 3], $count)),
    'keyed' => c32c_outcome(fn () => Arr::random(['a' => 1, 'b' => 2, 'c' => 3], $count)),
], ['abc' => 'abc', '1x' => '1x']));
probe('C32-C-random-out-of-order-full-count', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->random(3)->all() and pairs(random(3, true)->all()), which every draw answers alike", fn () => [
    'values' => (new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->random(3)->all(),
    'preserving-keys' => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->random(3, true)->all()),
]);

emit();
