<?php

/**
 * Ground truth for Collection::some().
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

// keys no PHP array can hold: each call over a list and a keyed backing, and what each holds after
$overBackings = fn (callable $call) => array_map(fn (Collection $c) => ['outcome' => c32c_outcome(fn () => $call($c)), 'all' => $c->all()], [collect(['a', 'b']), collect(['a' => 1, 'b' => 2])]);

$keysAndValues = fn (Collection $c) => ['keys' => $c->keys()->all(), 'values' => $c->values()->all()];

// shift() and pop() take their items one by one over range(1, min($count, count())), and PHP's min() answers the count
// of items over a NAN; range() refuses a float end less than one step from 1
$takeOutcome = function (string $method, array $items, $count) {
    $c = collect($items);
    $returned = c32c_outcome(function () use ($c, $method, $count) {
        $result = $c->$method($count);

        return $result instanceof Collection ? $result->all() : $result;
    });

    return ['returned' => $returned, 'all' => $c->all()];
};
probe('C32-C-no-args-forms-throw', '(new Collection([1]))->some() / every() / firstWhere()', function () {
    $out = [];
    foreach (['some', 'every', 'firstWhere'] as $method) {
        try {
            $out[$method] = (new Collection([1]))->{$method}();
        } catch (\Throwable $e) {
            $out[$method] = get_class($e);
        }
    }

    return $out;
});
probe('C32-C-two-args-null-value-others','some / doesntContain / containsStrict / doesntContainStrict with ("a", null) over [["a" => null], ["a" => 1]] and over [["a" => 1]], and firstOrFail("a", null) over [["a" => 1], ["a" => null]] and over [["a" => 1]]', fn () => [
    'some' => [(new Collection([['a' => null], ['a' => 1]]))->some('a', null), (new Collection([['a' => 1]]))->some('a', null)],
    'doesntContain' => [(new Collection([['a' => null], ['a' => 1]]))->doesntContain('a', null), (new Collection([['a' => 1]]))->doesntContain('a', null)],
    'containsStrict' => [(new Collection([['a' => null], ['a' => 1]]))->containsStrict('a', null), (new Collection([['a' => 1]]))->containsStrict('a', null)],
    'doesntContainStrict' => [(new Collection([['a' => null], ['a' => 1]]))->doesntContainStrict('a', null), (new Collection([['a' => 1]]))->doesntContainStrict('a', null)],
    'firstOrFail' => [
        c32c_outcome(fn () => (new Collection([['a' => 1], ['a' => null]]))->firstOrFail('a', null)),
        c32c_outcome(fn () => (new Collection([['a' => 1]]))->firstOrFail('a', null)),
    ],
]);

emit();
