<?php

/**
 * Ground truth for Collection::min().
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

// min / max
probe('C32-H-min-numeric-strings', "(new Collection(['10', '9', '8']))->min()", fn () => (new Collection(['10', '9', '8']))->min());
probe('C32-H-min-max-callback-arity', "[min(fn (...\$a) => count(\$a)), max(...)] on ['a' => 1]", fn () => [(new Collection(['a' => 1]))->min(fn (...$a) => count($a)), (new Collection(['a' => 1]))->max(fn (...$a) => count($a))]);
probe('C32-H-min-max-strings', "[min, max] of ['b', 'a', 'c']", fn () => [(new Collection(['b', 'a', 'c']))->min(), (new Collection(['b', 'a', 'c']))->max()]);
probe('C32-H-min-max-out-of-order-tie', "[min, max] of [2 => '1', 0 => 1]", fn () => [(new Collection([2 => '1', 0 => 1]))->min(), (new Collection([2 => '1', 0 => 1]))->max()]);
probe('C32-H-min-max-null-items', "[[min, max] of [null, 3, 1], [min, max] of [null]]", fn () => [[(new Collection([null, 3, 1]))->min(), (new Collection([null, 3, 1]))->max()], [(new Collection([null]))->min(), (new Collection([null]))->max()]]);

emit();
