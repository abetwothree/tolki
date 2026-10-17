<?php

/**
 * Ground truth for Collection::value().
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

probe('C32-C-value-collection-row-null', "(new Collection([new Collection(['v' => null]), new Collection(['v' => 1])]))->value('v', 'def')", fn () => (new Collection([new Collection(['v' => null]), new Collection(['v' => 1])]))->value('v', 'def'));
probe('C32-C-value-default', '(new Collection([["a" => 1]]))->value("b", fn () => "d") / value("b", "d") / (new Collection([]))->value("a")', fn () => [
    (new Collection([['a' => 1]]))->value('b', fn () => 'd'),
    (new Collection([['a' => 1]]))->value('b', 'd'),
    (new Collection([]))->value('a'),
]);
probe('C32-C-value-null-key', "(new Collection([['a' => 1]]))->value(null) / value(null, 'd') / value(null, fn () => 'lazy') / (new Collection([]))->value(null, 'd'): data_get() hands back its null target for a null key", fn () => [
    (new Collection([['a' => 1]]))->value(null),
    (new Collection([['a' => 1]]))->value(null, 'd'),
    (new Collection([['a' => 1]]))->value(null, fn () => 'lazy'),
    (new Collection([]))->value(null, 'd'),
]);

emit();
