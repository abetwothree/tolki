<?php

/**
 * Ground truth for Collection::mapSpread().
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

probe('C32-E-mapSpread-scalar-row', "collect([10, 20])->mapSpread(fn (...\$a) => \$a)", fn () => (new Collection([10, 20]))->mapSpread(fn (...$a) => $a)->all());
probe('C32-E-mapSpread-string-keyed-row', "collect([['all' => fn () => [9], 'b' => 2]])->mapSpread(fn (...\$a) => count(\$a))", fn () => (new Collection([['all' => fn () => [9], 'b' => 2]]))->mapSpread(fn (...$a) => count($a))->all());
// Appending the key makes a null row an array, and unpacking passes an integer-keyed row's values by position.
probe('C32-E-mapSpread-null-row', "collect([null, [1]]) and collect(['x' => null]), each ->mapSpread(fn (...\$a) => \$a)", fn () => ['list' => (new Collection([null, [1]]))->mapSpread(fn (...$a) => $a)->all(), 'keyed' => (new Collection(['x' => null]))->mapSpread(fn (...$a) => $a)->all()]);
probe('C32-E-mapSpread-int-keyed-row', "collect([[5 => 'a', 7 => 'b'], []]) and collect(['x' => [5 => 'a', 7 => 'b']]), each ->mapSpread(fn (...\$a) => \$a)", fn () => ['list' => (new Collection([[5 => 'a', 7 => 'b'], []]))->mapSpread(fn (...$a) => $a)->all(), 'keyed' => (new Collection(['x' => [5 => 'a', 7 => 'b']]))->mapSpread(fn (...$a) => $a)->all()]);
probe('C32-E-mapSpread-int-keyed-collection-row', "collect([new Collection([5 => 'a', 7 => 'b'])]) and collect(['x' => ...]), each ->mapSpread(fn (...\$a) => \$a)", fn () => ['list' => (new Collection([new Collection([5 => 'a', 7 => 'b'])]))->mapSpread(fn (...$a) => $a)->all(), 'keyed' => (new Collection(['x' => new Collection([5 => 'a', 7 => 'b'])]))->mapSpread(fn (...$a) => $a)->all()]);
probe('C32-E-mapSpread-string-keyed-collection-row', "collect([new Collection(['a' => 1, 'b' => 2])])->mapSpread(fn (...\$a) => \$a)", fn () => (new Collection([new Collection(['a' => 1, 'b' => 2])]))->mapSpread(fn (...$a) => $a)->all());
probe('C32-E-mapSpread-object-row', "collect([new DateTime('@0')])->mapSpread(fn (...\$a) => \$a)", fn () => (new Collection([new DateTime('@0')]))->mapSpread(fn (...$a) => $a)->all());

emit();
