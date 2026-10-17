<?php

/**
 * Ground truth for Collection::skipWhile().
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
probe('C32-D-skipWhile-keyed', "(new Collection(['a' => 1, 'b' => 2, 'c' => 1]))->skipWhile(1)", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 1]))->skipWhile(1)));
probe('C32-D-skipWhile-list-keys', "(new Collection([1, 1, 2, 1]))->skipWhile(1)", fn () => pairs((new Collection([1, 1, 2, 1]))->skipWhile(1)));
probe('C32-D-skipWhile-strict-value', "(new Collection([1, 1, 2]))->skipWhile('1')", fn () => pairs((new Collection([1, 1, 2]))->skipWhile('1')));
probe('C32-D-skipWhile-callback-key', "(new Collection(['x', 'y', 'z']))->skipWhile(fn (\$v, \$k) => \$k < 1)", fn () => pairs((new Collection(['x', 'y', 'z']))->skipWhile(fn ($v, $k) => $k < 1)));
probe('C32-D-skip-take-out-of-order-keys', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b'])): skipWhile('c'), takeUntil('a') and takeWhile('c')", fn () => [
    'skipWhile' => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->skipWhile('c')),
    'takeUntil' => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->takeUntil('a')),
    'takeWhile' => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->takeWhile('c')),
]);

emit();
