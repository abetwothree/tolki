<?php

/**
 * Ground truth for Collection::keyBy().
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

probe('collection-keyBy-scalar-key-cast', "(new Collection(['a' => ['k' => true], 'b' => ['k' => false], 'c' => ['k' => null]]))->keyBy('k') and @(new Collection([['v' => 1]]))->keyBy(fn () => 2.5): the keys", fn () => [
    'field' => array_keys((new Collection(['a' => ['k' => true], 'b' => ['k' => false], 'c' => ['k' => null]]))->keyBy('k')->all()),
    'float' => array_keys(@(new Collection([['v' => 1]]))->keyBy(fn () => 2.5)->all()),
]);
probe('C32-E-keyBy-int-key-order', "collect([['id'=>3],['id'=>1],['id'=>2]])->keyBy('id')->keys()", fn () => (new Collection([['id' => 3], ['id' => 1], ['id' => 2]]))->keyBy('id')->keys()->all());
probe('C32-E-keyBy-enum-keys', "keyBy over int-backed B then A, and keyBy(fn => pure A)", fn () => ['int' => c32e_pairs((new Collection([['id' => 1, 's' => C32E_Int::B], ['id' => 2, 's' => C32E_Int::A]]))->keyBy('s')->map(fn ($r) => $r['id'])), 'pure' => (new Collection([1]))->keyBy(fn () => C32E_Pure::A)->keys()->all()]);
probe('C32-E-keyBy-stringable-keys', "keyBy(fn => object with __toString) and keyBy(fn => new Stringable('Lara'))", fn () => ['toString' => (new Collection([1]))->keyBy(fn () => new class { public function __toString() { return 'Framework'; } })->keys()->all(), 'stringable' => (new Collection([1]))->keyBy(fn () => new Stringable('Lara'))->keys()->all()]);
probe('C32-E-keyBy-callback-key-type', "collect([1 => 'a', 'x' => 'b'])->keyBy(fn (\$v, \$k) => \$v.':'.gettype(\$k))->keys()", fn () => (new Collection([1 => 'a', 'x' => 'b']))->keyBy(fn ($v, $k) => $v.':'.gettype($k))->keys()->all());
probe('C32-E-keyBy-array-path', "collect([['a'=>['b'=>'z']]])->keyBy(['a','b']) and collect([['id'=>1,'name'=>'John']])->keyBy(['id','name'])", fn () => ['nested' => (new Collection([['a' => ['b' => 'z']]]))->keyBy(['a', 'b'])->keys()->all(), 'jsdoc' => (new Collection([['id' => 1, 'name' => 'John']]))->keyBy(['id', 'name'])->keys()->all()]);
probe('C32-E-keyBy-collection-rows', "c32c_rows(list | keyed)->keyBy('k'): each row's 'v'", fn () => array_map(fn (bool $keyed) => c32c_rows($keyed)->keyBy('k')->map(fn (Collection $row) => $row['v'])->all(), ['list' => false, 'keyed' => true]));

// A computed key PHP cannot store throws; the message depends on how each method writes the key.
probe('C32-E-keyBy-array-key', "(new Collection([1]))->keyBy(fn () => [1, 2])", fn () => (new Collection([1]))->keyBy(fn () => [1, 2])->all());
probe('C32-E-keyBy-assoc-key', "(new Collection([1]))->keyBy(fn () => ['a' => 1])", fn () => (new Collection([1]))->keyBy(fn () => ['a' => 1])->all());
probe('C32-E-keyBy-date-key', "(new Collection([1]))->keyBy(fn () => new DateTime('@0'))", fn () => (new Collection([1]))->keyBy(fn () => new DateTime('@0'))->all());

emit();
