<?php

/**
 * Ground truth for Collection::multiply().
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

// multiply: always a list of the values
probe('C32-F-multiply-assoc', "collect(['a' => 1, 'b' => 2])->multiply(2)", fn () => collect(['a' => 1, 'b' => 2])->multiply(2)->all());
// array_map is an internal caller, so the float coerces to an int as non-strict code does (with a deprecation)
probe('C32-F-multiply-fractional-count', "array_map([collect([1, 2]), 'multiply'], [2.5])[0]", fn () => @array_map([collect([1, 2]), 'multiply'], [2.5])[0]->all());
probe('C32-F-multiply-non-finite-count', "array_map([collect([1, 2]), 'multiply'], [\$count]) for NAN, INF and -INF: the class and message thrown", fn () => array_map(fn (float $count) => c32c_outcome(fn () => array_map([collect([1, 2]), 'multiply'], [$count])[0]->all()), ['NAN' => NAN, 'INF' => INF, '-INF' => -INF]));
probe('C32-F-multiply-out-of-int-range-count', "array_map([collect([1, 2]), 'multiply'], [\$count]) for 1e19, -1e19, 2**63, -2**63 and the float below -2**63: the answer, or the class and message thrown", fn () => array_map(fn (float $count) => c32c_outcome(fn () => array_map([collect([1, 2]), 'multiply'], [$count])[0]->all()), ['1e19' => 1e19, '-1e19' => -1e19, '2**63' => 9223372036854775808.0, '-2**63' => -9223372036854775808.0, 'below -2**63' => -9223372036854777856.0]));

emit();
