<?php

/**
 * Ground truth for Arr::except().
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

// --- except
probe('except-int-key', "Arr::except([1 => 'hAz', 2 => [5 => 'foo', 12 => 'baz']], 2)", fn () => Arr::except([1 => 'hAz', 2 => [5 => 'foo', 12 => 'baz']], 2));
probe('except-float-key', "Arr::except([1 => 'hAz', 2 => [5 => 'foo', 12 => 'baz']], 2.5)", fn () => Arr::except([1 => 'hAz', 2 => [5 => 'foo', 12 => 'baz']], 2.5));
probe('except-mixed-list', "Arr::except(fw, ['name', 'framework.name'])", fn () => Arr::except(['name' => 'taylor', 'framework' => ['language' => 'PHP', 'name' => 'Laravel']], ['name', 'framework.name']));

// ==== except(null) is a no-op on a Collection (CollectionTest::testExcept)
// fix-round-1: "removes a dot-notation path" wrongly cited this file's "except-mixed-list",
// a 2-key call with a different fixture. This is the actual single dot-path call.
probe('except-single-dot-path', "Arr::except(['name'=>'taylor','framework'=>['language'=>'PHP','name'=>'Laravel']], 'framework.language')", fn () => Arr::except(['name' => 'taylor', 'framework' => ['language' => 'PHP', 'name' => 'Laravel']], 'framework.language'));

// fix-round-2: dataExcept's "removes a numeric key given as a number or as its string form"
// makes a second call with the key as a string; "except-int-key" only covers the int form.
probe('except-string-key', "Arr::except([1 => 'hAz', 2 => 'x'], '2')", fn () => Arr::except([1 => 'hAz', 2 => 'x'], '2'));
probe('except-out-of-order', "Arr::except([2 => 'c', 0 => 'a', 1 => 'b'], [0])", fn () => arrayablePairs(Arr::except(OUT_OF_ORDER, [0])));
$rangeOutcome = function (array $arguments) {
    try {
        return Collection::range(...$arguments)->all();
    } catch (\Throwable $e) {
        return [get_class($e), $e->getMessage()];
    }
};

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];

$c32KeysSeen = function (callable $run, bool $answer = false): array {
    $seen = [];
    $run(function ($v, $k) use (&$seen, $answer) {
        $seen[] = [gettype($k), $k];

        return $answer;
    });

    return $seen;
};
probe('C32-D-array-key-type-error', "except('a', ['b']) and except('a', new Collection(['b'])) over ['a' => 1, 'b' => 2], Arr::except([], [['b']]), and select('a', ['b']) over an array row, an object row, a scalar row and no rows", fn () => array_map(function (callable $run) {
    try {
        return pairs($run());
    } catch (\TypeError $e) {
        return get_class($e) . ': ' . $e->getMessage();
    }
}, [
    'except-array' => fn () => (new Collection(['a' => 1, 'b' => 2]))->except('a', ['b']),
    'except-collection' => fn () => (new Collection(['a' => 1, 'b' => 2]))->except('a', new Collection(['b'])),
    'arr-except-empty' => fn () => Arr::except([], [['b']]),
    'select-array-row' => fn () => (new Collection([['a' => 1, 'b' => 2]]))->select('a', ['b']),
    'select-object-row' => fn () => @(new Collection([(object) ['a' => 1, 'b' => 2]]))->select('a', ['b']),
    'select-scalar-row' => fn () => (new Collection([1]))->select('a', ['b']),
    'select-no-rows' => fn () => (new Collection([]))->select('a', ['b']),
]));
probe('C32-D-arr-except-null-key', "Arr::except(['' => 1, 'a' => 2], null), Arr::except(['' => 1, 'a' => 2], [null]) and Arr::except(['a' => ['' => 1]], [null])", fn () => [
    'bare' => pairs(Arr::except(['' => 1, 'a' => 2], null)),
    'list' => pairs(Arr::except(['' => 1, 'a' => 2], [null])),
    'nested' => pairs(@Arr::except(['a' => ['' => 1]], [null])),
]);
probe('C32-D-arr-except-float-list-path', "Arr::except([['a', 'b', 'c', 'd', 'e', 'f']], [0.5]) and Arr::except(['a', 'b', 'c'], [1.5])", fn () => [
    pairs(Arr::except([['a', 'b', 'c', 'd', 'e', 'f']], [0.5])),
    pairs(Arr::except(['a', 'b', 'c'], [1.5])),
]);

emit();
