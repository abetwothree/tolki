<?php

/**
 * Ground truth for Arr::join().
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

// --- join
probe('join-assoc-two', "Arr::join(['a' => 'a', 'b' => 'b'], ', ', ' and ')", fn () => Arr::join(['a' => 'a', 'b' => 'b'], ', ', ' and '));

// ==== join (ArrTest::testJoin) — only the two-element form is captured today.
probe('join-single', "Arr::join(['a'], ', ', ' and ')", fn () => Arr::join(['a'], ', ', ' and '));
probe('join-empty', "Arr::join([], ', ', ' and ')", fn () => Arr::join([], ', ', ' and '));
probe('join-three-no-final-glue', "Arr::join(['a','b','c'], ', ')", fn () => Arr::join(['a', 'b', 'c'], ', '));
probe('join-assoc-numbers', "Arr::join(['a'=>1,'b'=>2,'c'=>3], ', ')", fn () => Arr::join(['a' => 1, 'b' => 2, 'c' => 3], ', '));

// ---- 6. Output and sorting.
probe('join-out-of-order', "Arr::join([2 => 'c', 0 => 'a', 1 => 'b'], ', ', ' and ')", fn () => Arr::join(OUT_OF_ORDER, ', ', ' and '));
probe('join-out-of-order-no-final-glue', "Arr::join([2 => 'c', 0 => 'a', 1 => 'b'], ', ')", fn () => Arr::join(OUT_OF_ORDER, ', '));
probe('join-mixed', "Arr::join(['x' => 1, 0 => 2, 'y' => 3], ', ', ' and ')", fn () => Arr::join(MIXED, ', ', ' and '));
probe('join-collision', "Arr::join([1 => 'a', 0 => 'z', '1' => 'b'], ',')", fn () => Arr::join([1 => 'a', 0 => 'z', '1' => 'b'], ','));
probe('C32-H-arr-join-pieces', "Arr::join() casting each piece as implode() does, the final item as . does, and handing a lone item back as it is", fn () => [
    'array piece' => @Arr::join([1, [2, 3]], ','),
    'scalars' => Arr::join([true, false, null, 1.5, 'x'], ','),
    'keyed array piece' => @Arr::join(['a' => 1, 'b' => [2]], ','),
    'object piece' => c32c_outcome(fn () => Arr::join([1, new stdClass], ',')),
    'closure piece' => c32c_outcome(fn () => Arr::join([1, fn () => 1], ',')),
    'toString piece' => Arr::join([1, new C32HToString('T')], ','),
    'final array piece' => @Arr::join([1, [2]], ', ', ' and '),
    'final object piece' => c32c_outcome(fn () => Arr::join([1, new stdClass], ', ', ' and ')),
    'final scalars' => Arr::join([true, null, false], ', ', ' and '),
    'lone array' => Arr::join([[1, 2]], ', ', ' and '),
    'lone bool' => Arr::join([true], ', ', ' and '),
]);

emit();
