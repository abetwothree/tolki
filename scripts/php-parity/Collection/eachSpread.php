<?php

/**
 * Ground truth for Collection::eachSpread().
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

probe('C32-E-eachSpread-scalar-row', "collect([10, 20])->eachSpread(fn (...\$a) => null)", fn () => (new Collection([10, 20]))->eachSpread(fn (...$a) => null)->all());
probe('C32-E-eachSpread-null-row', "collect([null, [1]]) and collect(['x' => null]), each ->eachSpread(fn (...\$a) => ...): every \$a", fn () => ['list' => c32e_each_spread_args(new Collection([null, [1]])), 'keyed' => c32e_each_spread_args(new Collection(['x' => null]))]);
probe('C32-E-eachSpread-int-keyed-row', "collect([[5 => 'a', 7 => 'b'], []]) and collect(['x' => [5 => 'a', 7 => 'b']]), each ->eachSpread(fn (...\$a) => ...): every \$a", fn () => ['list' => c32e_each_spread_args(new Collection([[5 => 'a', 7 => 'b'], []])), 'keyed' => c32e_each_spread_args(new Collection(['x' => [5 => 'a', 7 => 'b']]))]);
probe('C32-E-eachSpread-int-keyed-collection-row', "collect([new Collection([5 => 'a', 7 => 'b'])]) and collect(['x' => ...]), each ->eachSpread(fn (...\$a) => ...): every \$a", fn () => ['list' => c32e_each_spread_args(new Collection([new Collection([5 => 'a', 7 => 'b'])])), 'keyed' => c32e_each_spread_args(new Collection(['x' => new Collection([5 => 'a', 7 => 'b'])]))]);
probe('C32-E-eachSpread-string-keyed-row', "collect([['a' => 1, 'b' => 2]])->eachSpread(fn (...\$a) => null)", fn () => c32e_each_spread_args(new Collection([['a' => 1, 'b' => 2]])));
probe('C32-E-eachSpread-string-keyed-collection-row', "collect([new Collection(['a' => 1, 'b' => 2])])->eachSpread(fn (...\$a) => null)", fn () => c32e_each_spread_args(new Collection([new Collection(['a' => 1, 'b' => 2])])));
probe('C32-E-eachSpread-object-row', "collect([new DateTime('@0')])->eachSpread(fn (...\$a) => null)", fn () => c32e_each_spread_args(new Collection([new DateTime('@0')])));

emit();
