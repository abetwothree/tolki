<?php

/**
 * Ground truth for PHP's (int) cast.
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

// PHP 8 casts a float past its int range to an int by keeping the low 64 bits, and NAN or an infinity to 0
// each int is written as its digits, which JSON cannot carry exactly as a number past 2^53
probe('C32-G-int-cast-past-int-range', "(string) (int) \$float for 1e19, -1e19, 2**63, -2**63, 2**64, 3 * 2**63, 1.5e19, 1e20, 1e30, -1e30, 2**63 + 2048, 2**64 - 2048, NAN, INF, -INF, -0.0, 2.5 and -2.5", fn () => array_map(fn (float $value) => (string) @((int) $value), [
    '1e19' => 1e19,
    '-1e19' => -1e19,
    '2**63' => 9223372036854775808.0,
    '-2**63' => -9223372036854775808.0,
    '2**64' => 18446744073709551616.0,
    '3 * 2**63' => 27670116110564327424.0,
    '1.5e19' => 1.5e19,
    '1e20' => 1e20,
    '1e30' => 1e30,
    '-1e30' => -1e30,
    '2**63 + 2048' => 9223372036854777856.0,
    '2**64 - 2048' => 18446744073709549568.0,
    'NAN' => NAN,
    'INF' => INF,
    '-INF' => -INF,
    '-0.0' => -0.0,
    '2.5' => 2.5,
    '-2.5' => -2.5,
]));

emit();
