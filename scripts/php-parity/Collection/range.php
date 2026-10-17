<?php

/**
 * Ground truth for Collection::range().
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

// --- range
probe('C32-A-range-descending', 'Collection::range(5, 1)->all()', fn () => Collection::range(5, 1)->all());
probe('C32-A-range-descending-through-zero', 'Collection::range(2, -2)->all()', fn () => Collection::range(2, -2)->all());
probe('C32-A-range-descending-negative', 'Collection::range(-2, -4)->all()', fn () => Collection::range(-2, -4)->all());
probe('C32-A-range-ascending-through-zero', 'Collection::range(-2, 2)->all()', fn () => Collection::range(-2, 2)->all());
probe('C32-A-range-ascending-negative', 'Collection::range(-4, -2)->all()', fn () => Collection::range(-4, -2)->all());
probe('C32-A-range-descending-step', 'Collection::range(10, 1, 3)->all()', fn () => Collection::range(10, 1, 3)->all());
probe('C32-A-range-single', 'Collection::range(3, 3)->all()', fn () => Collection::range(3, 3)->all());
probe('C32-A-range-float-step', 'Collection::range(0, 1, 0.1)->all()', fn () => Collection::range(0, 1, 0.1)->all());
probe('C32-A-range-step-zero-throws', 'Collection::range(1, 5, 0)', fn () => Collection::range(1, 5, 0)->all());
probe('C32-A-range-negative-step-increasing-throws', 'Collection::range(1, 5, -1)', fn () => Collection::range(1, 5, -1)->all());
probe('C32-A-range-step-exceeds-span-throws', 'Collection::range(1, 2, 3)', fn () => Collection::range(1, 2, 3)->all());
probe('C32-A-range-step-equals-span', 'Collection::range(0, 10, 10)->all()', fn () => Collection::range(0, 10, 10)->all());
probe('C32-A-range-negative-step-descending', 'Collection::range(5, 1, -2)->all()', fn () => Collection::range(5, 1, -2)->all());
probe('C32-A-range-float-step-stops-at-end', 'Collection::range(0, 1, 0.4)->all()', fn () => Collection::range(0, 1, 0.4)->all());
probe('C32-A-range-float-size-rounds-half-up', 'Collection::range(0.2, 0.5, 0.1)->all()', fn () => Collection::range(0.2, 0.5, 0.1)->all());
probe('C32-A-range-descending-float-step', 'Collection::range(1, 0, 0.3)->all()', fn () => Collection::range(1, 0, 0.3)->all());
probe('C32-A-range-descending-float-stops-at-end', 'Collection::range(4, 1.5)->all()', fn () => Collection::range(4, 1.5)->all());
$rangeOutcome = function (array $arguments) {
    try {
        return Collection::range(...$arguments)->all();
    } catch (\Throwable $e) {
        return [get_class($e), $e->getMessage()];
    }
};
probe('C32-A-range-non-finite-arguments-throw', 'Collection::range() given NAN, INF or -INF as the step, the start or the end', fn () => array_map($rangeOutcome, [[1, 5, NAN], [1, 5, INF], [1, 5, -INF], [NAN, 5], [INF, 5], [-INF, 5], [0, NAN], [0, INF], [0, -INF]]));
probe('C32-A-range-checks-the-step-first', 'Collection::range(NAN, NAN, NAN) and Collection::range(NAN, 5, 0)', fn () => array_map($rangeOutcome, [[NAN, NAN, NAN], [NAN, 5, 0]]));
// range() refuses a size past the maximum array size, printing an integer range's bounds or a float range's
probe('C32-A-range-past-maximum-array-size', "Collection::range(\$start, \$end, \$step) past the maximum array size, for integer and float bounds either way round: the class and message thrown", fn () => array_map($rangeOutcome, [
    '1..1073741824' => [1, 1073741824],
    '0..1073741824' => [0, 1073741824],
    '2147483648..1' => [2147483648, 1],
    '1..2147483648 step 2' => [1, 2147483648, 2],
    '1..1e19' => [1, 1e19],
    '1e19..1' => [1e19, 1],
    '0..2147483648 step 0.5' => [0, 2147483648, 0.5],
    '0.5..1e10' => [0.5, 1e10],
    '1..1e22' => [1, 1e22],
]));
// the message prints a float range's figures as C's %.1f does: ties to even, and an infinite size as inf
probe('C32-A-range-size-message-rounding', "Collection::range(\$start, \$end, \$step) past the maximum array size where a printed figure ends in an exact half: the class and message thrown", fn () => array_map($rangeOutcome, [
    '0.25..1e10' => [0.25, 1e10],
    '-0.25..1e10' => [-0.25, 1e10],
    '1.75..1e10' => [1.75, 1e10],
    '0..1e10 step 1.25' => [0, 1e10, 1.25],
]));
probe('C32-A-range-size-message-infinite', "Collection::range(\$start, \$end, \$step) whose size overflows to INF: the class and message thrown", fn () => array_map($rangeOutcome, [
    '0..1 step 5e-324' => [0, 1, 5e-324],
    '-1e308..1e308' => [-1e308, 1e308],
    '0..1e308 step 1e-10' => [0, 1e308, 1e-10],
]));
probe('C32-A-range-size-message-signs-and-carries', "Collection::range(\$start, 1e10) past the maximum array size for a start of -0.0, -0.04, 0.05 and 99.95: the class and message thrown", fn () => array_map($rangeOutcome, [
    '-0.0' => [-0.0, 1e10],
    '-0.04' => [-0.04, 1e10],
    '0.05' => [0.05, 1e10],
    '99.95' => [99.95, 1e10],
]));

emit();
