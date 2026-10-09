<?php

/**
 * Ground truth for Collection::flatMap().
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
probe('C32-E-flatMap-record-receiver', "collect(['a' => 1, 'b' => 2])->flatMap(fn (\$v) => [\$v, \$v * 10]), and whether it is a list", fn () => [
    'pairs' => c32e_pairs((new Collection(['a' => 1, 'b' => 2]))->flatMap(fn ($v) => [$v, $v * 10])),
    'is-list' => array_is_list((new Collection(['a' => 1, 'b' => 2]))->flatMap(fn ($v) => [$v, $v * 10])->all()),
]);

emit();
