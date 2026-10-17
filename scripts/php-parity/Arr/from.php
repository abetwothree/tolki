<?php

/**
 * Ground truth for Arr::from().
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

// ---- from
probe('from-stdclass', "Arr::from((object)['foo'=>'bar'])", fn () => Arr::from((object) ['foo' => 'bar']));
probe('from-true-key-collision', "Arr::from([1 => 'a', true => 'b'])", fn () => arrayablePairs(Arr::from([1 => 'a', true => 'b'])));

// --- Arr::from refuses a scalar with the class its @throws names
probe('C32-A-arr-from-scalar-throws', 'Arr::from(123)', fn () => Arr::from(123));

emit();
