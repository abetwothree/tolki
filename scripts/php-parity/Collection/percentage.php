<?php

/**
 * Ground truth for Collection::percentage().
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

// percentage: PHP's round() compares the value with the double nearest its midpoint; toFixed() and Math.round() do not.
probe('C32-H-percentage-fp-below-half', "(new Collection(range(1, 2000)))->percentage(fn (\$v) => \$v <= 9, 1)", fn () => (new Collection(range(1, 2000)))->percentage(fn ($v) => $v <= 9, 1));
probe('C32-H-percentage-precision-zero-and-negative', "[percentage(..., 0), percentage(..., -1)] on [1, 1, 2]", fn () => [(new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, 0), (new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, -1)]);
probe('C32-H-percentage-fp-just-below-half-rounds-up', "(new Collection(range(1, 2000)))->percentage(fn (\$v) => \$v <= 3, 1)", fn () => (new Collection(range(1, 2000)))->percentage(fn ($v) => $v <= 3, 1));
probe('C32-H-percentage-scaled-just-short-of-whole', "(new Collection(range(1, 35)))->percentage(fn (\$v) => \$v <= 3, 15)", fn () => (new Collection(range(1, 35)))->percentage(fn ($v) => $v <= 3, 15));
probe('C32-H-percentage-beyond-double-digits', "(new Collection(range(1, 9)))->percentage(fn (\$v) => \$v === 1, 15)", fn () => (new Collection(range(1, 9)))->percentage(fn ($v) => $v === 1, 15));
// array_map is an internal caller, so a float precision coerces to an int as non-strict code does (with a deprecation)
probe('C32-H-percentage-fractional-precision', "array_map([\$c, 'percentage'], [\$cb], [\$precision]) on [1, 1, 2] with \$cb = fn (\$v) => \$v === 1, for 1.5, -1.5, 2.9, -0.0 and 0.5", fn () => array_map(fn (float $precision) => @array_map([new Collection([1, 1, 2]), 'percentage'], [fn ($v) => $v === 1], [$precision])[0], ['1.5' => 1.5, '-1.5' => -1.5, '2.9' => 2.9, '-0.0' => -0.0, '0.5' => 0.5]));
probe('C32-H-percentage-precision-bounds', "array_map([\$c, 'percentage'], [\$cb], [\$precision]) on [1, 1, 2] for -2**63 and the largest float below 2**63", fn () => array_map(fn (float $precision) => array_map([new Collection([1, 1, 2]), 'percentage'], [fn ($v) => $v === 1], [$precision])[0], ['-2**63' => -9223372036854775808.0, 'below 2**63' => 9223372036854774784.0]));
probe('C32-H-percentage-non-int-precision', "array_map([\$c, 'percentage'], [\$cb], [\$precision]) on [1, 1, 2] for NAN, INF, -INF, 1e19, -1e19 and 2**63, and on [] for NAN: the class and message thrown", fn () => [
    'items' => array_map(fn (float $precision) => c32c_outcome(fn () => array_map([new Collection([1, 1, 2]), 'percentage'], [fn ($v) => $v === 1], [$precision])[0]), ['NAN' => NAN, 'INF' => INF, '-INF' => -INF, '1e19' => 1e19, '-1e19' => -1e19, '2**63' => 9223372036854775808.0]),
    'empty' => c32c_outcome(fn () => array_map([new Collection([]), 'percentage'], [fn ($v) => $v === 1], [NAN])[0]),
]);
probe('C32-H-percentage-extreme-precision', "[percentage(=== 1, -400), percentage(=== 1, 400), percentage(=== 5, 400)] on [1, 1, 2]", fn () => [(new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, -400), (new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, 400), (new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 5, 400)]);

emit();
