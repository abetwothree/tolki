<?php

/**
 * Ground truth for Collection::sum().
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

// sum: PHP `+` coerces numeric strings; JS `+` concatenates them.
probe('C32-H-sum-numeric-strings', "(new Collection(['1', '2', '3']))->sum()", fn () => (new Collection(['1', '2', '3']))->sum());
probe('C32-H-sum-float-strings', "(new Collection(['1.5', '2']))->sum()", fn () => (new Collection(['1.5', '2']))->sum());
probe('C32-H-sum-key-numeric-strings', "(new Collection([['foo' => '4'], ['foo' => '2']]))->sum('foo')", fn () => (new Collection([['foo' => '4'], ['foo' => '2']]))->sum('foo'));
probe('C32-H-sum-non-numeric-string', "(new Collection([1, 'a']))->sum()", fn () => (new Collection([1, 'a']))->sum());
probe('C32-H-sum-null-and-bools', "[sum([1, null, 2]), sum([true, true, false])]", fn () => [(new Collection([1, null, 2]))->sum(), (new Collection([true, true, false]))->sum()]);
probe('C32-H-sum-dot-path', "(new Collection([['a' => ['b' => 1]], ['a' => ['b' => 2]]]))->sum('a.b')", fn () => (new Collection([['a' => ['b' => 1]], ['a' => ['b' => 2]]]))->sum('a.b'));
probe('C32-H-sum-leading-numeric-string', "@(new Collection([1, '2abc']))->sum()", fn () => @(new Collection([1, '2abc']))->sum());
probe('C32-H-sum-array-items', "(new Collection([[1], [2]]))->sum()", fn () => (new Collection([[1], [2]]))->sum());
probe('C32-H-sum-object-item', "(new Collection([new stdClass]))->sum()", fn () => (new Collection([new stdClass]))->sum());
probe('C32-H-sum-float-total-non-numeric-string', "(new Collection([1.5, 'a']))->sum()", fn () => (new Collection([1.5, 'a']))->sum());
probe('C32-H-sum-closure-item', "(new Collection([1, fn () => 1]))->sum()", fn () => (new Collection([1, fn () => 1]))->sum());

emit();
