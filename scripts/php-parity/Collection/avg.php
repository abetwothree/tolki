<?php

/**
 * Ground truth for Collection::avg().
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

// avg
probe('C32-H-avg-non-numeric-string', "(new Collection([10, 'house', 20]))->avg()", fn () => (new Collection([10, 'house', 20]))->avg());
probe('C32-H-avg-callback-arity', "(new Collection(['a' => 1]))->avg(fn (...\$args) => count(\$args))", fn () => (new Collection(['a' => 1]))->avg(fn (...$args) => count($args)));

emit();
