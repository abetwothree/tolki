<?php

/**
 * Ground truth for Collection::whereInstanceOf().
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

// whereInstanceOf with an associative class list
probe('C32-D-whereInstanceOf-assoc-types', "(new Collection([new stdClass, new ArrayObject, new SplStack]))->whereInstanceOf(['a' => stdClass::class, 'b' => SplStack::class])->keys()", fn () => (new Collection([new stdClass, new ArrayObject, new SplStack]))->whereInstanceOf(['a' => stdClass::class, 'b' => SplStack::class])->keys()->all());

emit();
