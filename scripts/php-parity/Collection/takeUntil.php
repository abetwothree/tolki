<?php

/**
 * Ground truth for Collection::takeUntil().
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
probe('C32-D-takeUntil-strict-value', "(new Collection([1, 2, 3, 4]))->takeUntil('3')", fn () => pairs((new Collection([1, 2, 3, 4]))->takeUntil('3')));
probe('C32-D-takeUntil-keyed', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->takeUntil(3)", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->takeUntil(3)));
probe('C32-D-takeUntil-callback-key', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->takeUntil(fn (\$v, \$k) => \$k === 'c')", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->takeUntil(fn ($v, $k) => $k === 'c')));
probe('C32-D-takeUntil-empty', "(new Collection([]))->takeUntil(1)", fn () => pairs((new Collection([]))->takeUntil(1)));

emit();
