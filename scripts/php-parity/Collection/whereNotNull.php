<?php

/**
 * Ground truth for Collection::whereNotNull().
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

probe('C32-D-whereNotNull-dot-path', "(new Collection([['a' => ['b' => null]], ['a' => ['b' => 0]], ['a' => []]]))->whereNotNull('a.b')->keys()", fn () => (new Collection([['a' => ['b' => null]], ['a' => ['b' => 0]], ['a' => []]]))->whereNotNull('a.b')->keys()->all());

emit();
