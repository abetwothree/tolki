<?php

/**
 * Ground truth for data_has().
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

probe('C32-D-data-has-collection-target', "data_has over a Collection: a null value, 'a.b', a missing key; and data_has with a null or an empty key", fn () => [
    data_has(new Collection(['v' => null]), 'v'),
    data_has(new Collection(['a' => ['b' => 1]]), 'a.b'),
    data_has(new Collection(['a' => 1]), 'b'),
    data_has(['a' => 1], null),
    data_has(['a' => 1], []),
]);
probe('C32-D-data-has-array-and-object-targets', "data_has(['a' => null], 'a') / data_has([10, 20], '1') / data_has([10], '01') / data_has(new C32D_Point, 'p') / data_has(new C32D_Point, 'q')", fn () => [
    data_has(['a' => null], 'a'),
    data_has([10, 20], '1'),
    data_has([10], '01'),
    data_has(new C32D_Point, 'p'),
    data_has(new C32D_Point, 'q'),
]);

emit();
