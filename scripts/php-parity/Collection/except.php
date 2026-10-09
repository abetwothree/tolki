<?php

/**
 * Ground truth for Collection::except().
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

probe('collection-except-null', "(new Collection(['a'=>1,'b'=>2]))->except(null)", fn () => (new Collection(['a' => 1, 'b' => 2]))->except(null)->all());
probe('collection-except-self', "\$c->except(\$c)", function () {
    $c = new Collection(['a' => 1, 'b' => 2]);

    return $c->except($c)->all();
});

// only / except
$kv = ['first' => 'Taylor', 'last' => 'Otwell', 'email' => 'e'];
probe('C32-D-except-array-then-extra-arg', "(new Collection(\$kv))->except(['first'], 'last')", fn () => pairs((new Collection($kv))->except(['first'], 'last')));
probe('C32-D-except-dot-key-literal-first', "(new Collection(['a.b' => 1, 'a' => ['b' => 2]]))->except('a.b')", fn () => pairs((new Collection(['a.b' => 1, 'a' => ['b' => 2]]))->except('a.b')));
probe('C32-D-except-keyed-collection-arg', "(new Collection(\$kv))->except(new Collection(['x' => 'first', 'y' => 'email']))", fn () => pairs((new Collection($kv))->except(new Collection(['x' => 'first', 'y' => 'email']))));
probe('C32-D-except-list-numeric-string', "(new Collection(['a', 'b', 'c']))->except('1')", fn () => pairs((new Collection(['a', 'b', 'c']))->except('1')));
probe('C32-D-except-empty-array', "(new Collection(\$kv))->except([])", fn () => pairs((new Collection($kv))->except([])));
// Arr::forget asks Arr::exists, which reads a null key as '' and a float as its string form; unset then casts a
// float to its integer part, and explode splits the string form into a path.
probe('C32-D-except-forget-null-key', "except(null), except([null]), except('a', null) and except(new Collection([null])), then forget(null) and forget([null]), over ['' => 1, 'a' => 2]", fn () => [
    'except-null' => pairs((new Collection(['' => 1, 'a' => 2]))->except(null)),
    'except-list' => pairs((new Collection(['' => 1, 'a' => 2]))->except([null])),
    'except-later' => pairs((new Collection(['' => 1, 'a' => 2]))->except('a', null)),
    'except-collection' => pairs((new Collection(['' => 1, 'a' => 2]))->except(new Collection([null]))),
    'forget-null' => pairs((new Collection(['' => 1, 'a' => 2]))->forget(null)),
    'forget-list' => pairs((new Collection(['' => 1, 'a' => 2]))->forget([null])),
]);
probe('C32-D-except-float-key', "except([1.5]) over ['1.5' => 'a', 1 => 'b', 'c' => 'd'], ['1.5' => 'a', 'c' => 'd'] and [1 => ['5' => 'x', 6 => 'y']], and forget([1.5]) over ['1.5' => 'a', 1 => 'b']", fn () => [
    'both' => pairs(@(new Collection(['1.5' => 'a', 1 => 'b', 'c' => 'd']))->except([1.5])),
    'string-only' => pairs(@(new Collection(['1.5' => 'a', 'c' => 'd']))->except([1.5])),
    'nested' => pairs((new Collection([1 => ['5' => 'x', 6 => 'y']]))->except([1.5])),
    'forget-both' => pairs(@(new Collection(['1.5' => 'a', 1 => 'b']))->forget([1.5])),
]);

emit();
