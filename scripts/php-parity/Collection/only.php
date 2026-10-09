<?php

/**
 * Ground truth for Collection::only().
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
$spliceOutcome = function (array $items, array $arguments) use ($keysAndValues) {
    $c = collect($items);
    $removed = c32c_outcome(fn () => $keysAndValues(@$c->splice(...$arguments)));

    return ['removed' => $removed] + $keysAndValues($c);
};

// only / except
$kv = ['first' => 'Taylor', 'last' => 'Otwell', 'email' => 'e'];
probe('C32-D-only-null-first-arg', "(new Collection(\$kv))->only(null, 'first')", fn () => pairs((new Collection($kv))->only(null, 'first')));
probe('C32-D-only-array-then-extra-arg', "(new Collection(\$kv))->only(['first'], 'last')", fn () => pairs((new Collection($kv))->only(['first'], 'last')));
probe('C32-D-only-dot-key-literal', "(new Collection(['a' => ['b' => 1], 'a.b' => 2]))->only('a.b')", fn () => pairs((new Collection(['a' => ['b' => 1], 'a.b' => 2]))->only('a.b')));
probe('C32-D-only-dot-key-nested-miss', "(new Collection(['a' => ['b' => 1, 'c' => 2]]))->only('a.b')", fn () => pairs((new Collection(['a' => ['b' => 1, 'c' => 2]]))->only('a.b')));
probe('C32-D-only-keyed-collection-arg', "(new Collection(\$kv))->only(new Collection(['x' => 'first', 'y' => 'email']))", fn () => pairs((new Collection($kv))->only(new Collection(['x' => 'first', 'y' => 'email']))));
probe('C32-D-only-list-keys', "(new Collection(['a', 'b', 'c', 'd']))->only([3, 1])", fn () => pairs((new Collection(['a', 'b', 'c', 'd']))->only([3, 1])));
probe('C32-D-only-empty-array', "(new Collection(\$kv))->only([])", fn () => pairs((new Collection($kv))->only([])));
probe('C32-D-null-keys-copy', "\$c = new Collection(['a' => 1]); only(null), except(null) and select(null), each then put('b', 2): \$c and each copy", function () {
    $c = new Collection(['a' => 1]);
    $copies = [$c->only(null), $c->except(null), $c->select(null)];

    foreach ($copies as $copy) {
        $copy->put('b', 2);
    }

    return array_map(fn (Collection $collection) => $collection->all(), [$c, ...$copies]);
});
// array_flip skips a key it cannot store, while array_key_exists throws for one.
probe('C32-D-only-odd-later-args', "only('a', null) over ['null' => 1, 'a' => 2], only('a', ['b']) and only('a', new Collection(['b'])) over ['a' => 1, 'b' => 2], and only(0, [1]) over ['x', 'y']", fn () => [
    'null' => pairs(@(new Collection(['null' => 1, 'a' => 2]))->only('a', null)),
    'array' => pairs(@(new Collection(['a' => 1, 'b' => 2]))->only('a', ['b'])),
    'collection' => pairs(@(new Collection(['a' => 1, 'b' => 2]))->only('a', new Collection(['b']))),
    'list' => pairs(@(new Collection(['x', 'y']))->only(0, [1])),
]);

emit();
