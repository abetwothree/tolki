<?php

/**
 * Ground truth for Collection::takeWhile().
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
probe('C32-D-takeWhile-strict-value', "(new Collection([1, 1, 2]))->takeWhile('1')", fn () => pairs((new Collection([1, 1, 2]))->takeWhile('1')));
probe('C32-D-takeWhile-keyed', "(new Collection(['a' => 1, 'b' => 1, 'c' => 2, 'd' => 1]))->takeWhile(1)", fn () => pairs((new Collection(['a' => 1, 'b' => 1, 'c' => 2, 'd' => 1]))->takeWhile(1)));
probe('C32-D-takeWhile-callback-key', "(new Collection(['x', 'y', 'z']))->takeWhile(fn (\$v, \$k) => \$k < 2)", fn () => pairs((new Collection(['x', 'y', 'z']))->takeWhile(fn ($v, $k) => $k < 2)));
probe('C32-D-takeWhile-null-value', "(new Collection([null, null, 0]))->takeWhile(null)", fn () => pairs((new Collection([null, null, 0]))->takeWhile(null)));

emit();
