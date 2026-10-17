<?php

/**
 * Ground truth for PHP's get_debug_type().
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

probe('C32-A-debug-type-float-past-int-range', "get_debug_type() of 1e19, -1e19, -0.0, 2**63 and 2**62, then the message collect([\$item])->ensure('int') throws for 1e19 and -0.0", fn () => [
    'types' => array_map(fn ($value) => get_debug_type($value), ['1e19' => 1e19, '-1e19' => -1e19, '-0.0' => -0.0, '2**63' => 9223372036854775808.0, '2**62' => 4611686018427387904]),
    'ensure' => array_map(fn ($value) => c32c_outcome(fn () => collect([$value])->ensure('int')), ['1e19' => 1e19, '-0.0' => -0.0]),
]);

emit();
