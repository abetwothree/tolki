<?php

/**
 * Ground truth for Collection::median().
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

// median
probe('C32-H-median-numeric-strings', "[median(['10', '9', '8']), median(['10', '9'])]", fn () => [(new Collection(['10', '9', '8']))->median(), (new Collection(['10', '9']))->median()]);
probe('C32-H-median-rows-without-key', "(new Collection([['value' => 1, 'age' => 20], ['value' => 3, 'age' => 30], ['value' => 2, 'age' => 25]]))->median()", fn () => (new Collection([['value' => 1, 'age' => 20], ['value' => 3, 'age' => 30], ['value' => 2, 'age' => 25]]))->median());
probe('C32-H-median-array-key', "(new Collection([['a' => ['b' => 1]], ['a' => ['b' => 9]], ['a' => ['b' => 5]]]))->median(['a', 'b'])", fn () => (new Collection([['a' => ['b' => 1]], ['a' => ['b' => 9]], ['a' => ['b' => 5]]]))->median(['a', 'b']));
probe('C32-H-median-non-numeric-middle-values', "(new Collection(['b', 'a']))->median()", fn () => (new Collection(['b', 'a']))->median());
probe('C32-H-median-out-of-order-tie', "(new Collection([2 => '5', 0 => 5, 1 => 1]))->median()", fn () => (new Collection([2 => '5', 0 => 5, 1 => 1]))->median());

emit();
