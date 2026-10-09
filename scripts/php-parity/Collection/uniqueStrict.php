<?php

/**
 * Ground truth for Collection::uniqueStrict().
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

probe('uniqueStrict-duplicatesStrict-key-order', "(new Collection([['x' => 1, 'y' => 2], ['y' => 2, 'x' => 1]]))->uniqueStrict() and ->duplicatesStrict()", fn () => [
    'uniqueStrict' => (new Collection([['x' => 1, 'y' => 2], ['y' => 2, 'x' => 1]]))->uniqueStrict()->all(),
    'duplicatesStrict' => (new Collection([['x' => 1, 'y' => 2], ['y' => 2, 'x' => 1]]))->duplicatesStrict()->all(),
]);
probe('C32-D-unique-arrays-strict', "(new Collection([[1, 2], ['1', 2], [1, 2]]))->uniqueStrict()", fn () => pairs((new Collection([[1, 2], ['1', 2], [1, 2]]))->uniqueStrict()));

emit();
