<?php

/**
 * Ground truth for Collection::union().
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

probe('Collection::union', '$c->union(["a"=>1,"b"=>2])', function () {
    return (new Collection(['a' => null]))->union(['a' => 1, 'b' => 2])->all();
});

probe('X20 union lets the left operand win, null value included', "['a'=>null] + ['a'=>1]", function () {
    return ['nullWins' => ['a' => null] + ['a' => 1], 'ints' => (new Collection([10, 20]))->union([1, 1, 50, 60])->all()];
});

probe('union treats null as an empty operand', 'collect([10,20])->union(null)', function () {
    return collect([10, 20])->union(null)->all();
});
probe('C17 union array', '(new Collection([\'name\' => \'Hello\']))->union([\'id\' => 1])->all()', fn () => (new Collection(['name' => 'Hello']))->union(['id' => 1])->all());
probe('C18 union collection', '(new Collection([\'name\' => \'Hello\']))->union(new Collection([\'name\' => \'World\', \'id\' => 1]))->all()', fn () => (new Collection(['name' => 'Hello']))->union(new Collection(['name' => 'World', 'id' => 1]))->all());
probe('union-list-operand', "(new Collection(['a' => 1]))->union([5])", fn () => (new Collection(['a' => 1]))->union([5])->all());

// ---- a list-backed union or combine reads a keyed operand by key (union) or by its values (combine)
probe('union-list-keyed-operand', "(new Collection([1, 2]))->union([2 => 'z']), (new Collection([1]))->union([3 => 'd'])->union([9, 8, 7, 6])->sortKeys(), (new Collection([1]))->union([3 => 'd']), (new Collection([1, 2]))->union(['a' => 5])", fn () => [
    'offset' => (new Collection([1, 2]))->union([2 => 'z'])->all(),
    'gap-filled' => (new Collection([1]))->union([3 => 'd'])->union([9, 8, 7, 6])->sortKeys()->all(),
    'gap' => (new Collection([1]))->union([3 => 'd'])->all(),
    'string-key' => (new Collection([1, 2]))->union(['a' => 5])->all(),
]);
probe('list-backing-keyed-operand', "(new Collection(['a', 'b']))->union([2 => 'z']) and (new Collection(['a', 'b', 'c']))->intersectByKeys([0 => 'x', 2 => 'y'])", fn () => [
    'union' => (new Collection(['a', 'b']))->union([2 => 'z'])->all(),
    'intersectByKeys' => (new Collection(['a', 'b', 'c']))->intersectByKeys([0 => 'x', 2 => 'y'])->values()->all(),
]);
probe('union-all-nullish', "(new Collection(null))->union(null)", fn () => (new Collection(null))->union(null)->all());
probe('union-list-backing-keyed-result', "(new Collection())->union(['a' => 1]), (new Collection([1, 2]))->union(['a' => 1, 5 => 9]), ([1, 2])->union([-1 => 9]), ([1])->union([3 => 4]), ([1])->union([3 => 4])->union([9, 8, 7, 6])", fn () => [
    'empty-string-key' => (new Collection())->union(['a' => 1])->all(),
    'string-key-and-gap' => (new Collection([1, 2]))->union(['a' => 1, 5 => 9])->all(),
    'negative-key' => (new Collection([1, 2]))->union([-1 => 9])->all(),
    'gap' => (new Collection([1]))->union([3 => 4])->all(),
    'gap-then-filled' => (new Collection([1]))->union([3 => 4])->union([9, 8, 7, 6])->all(),
]);
probe('union-function-valued-member', "(new Collection(['all' => \$fn, 'admin' => 'a']))->union(['guest' => 1]), (['toJSON' => fn () => 'J', 'b' => 2])->union(['c' => 3]), (['toArray' => fn () => [9], 'b' => 2])->union(['c' => 3]): the keys, and how often \$fn ran", function () {
    $calls = 0;
    $fn = function () use (&$calls) {
        $calls++;

        return 'X';
    };

    return [
        'all' => array_keys((new Collection(['all' => $fn, 'admin' => 'a']))->union(['guest' => 1])->all()),
        'toJSON' => array_keys((new Collection(['toJSON' => fn () => 'J', 'b' => 2]))->union(['c' => 3])->all()),
        'toArray' => array_keys((new Collection(['toArray' => fn () => [9], 'b' => 2]))->union(['c' => 3])->all()),
        'calls' => $calls,
    ];
});

// ==== D7 (F-23 routed by P-40): union was left out of the C10 scalar sweep. It is the one
// setop whose backing is its LEFT operand, so a scalar backing must win over the operand.
probe('d7-union-scalar-backing', "(new Collection(5))->union([9]) and (new Collection('x'))->union([9])", fn () => [
    'int' => (new Collection(5))->union([9])->all(),
    'string' => (new Collection('x'))->union([9])->all(),
]);
probe('d7-union-traversable-backing', "(new Collection(new ArrayIterator([1, 2])))->union(['d' => 4]) and ->union([9, 9, 9])", fn () => [
    'keyed-operand' => (new Collection(new ArrayIterator([1, 2])))->union(['d' => 4])->all(),
    'list-operand' => (new Collection(new ArrayIterator([1, 2])))->union([9, 9, 9])->all(),
]);
probe(
    'plain-object-toArray-member-union-keeps-its-keys',
    "collect((object) ['toArray' => fn () => [9], 'b' => 2])->union(['c' => 3])->keys()->all()",
    fn () => collect((object) ['toArray' => fn () => [9], 'b' => 2])->union(['c' => 3])->keys()->all(),
);
probe(
    'plain-object-toArray-member-union-keeps-its-values',
    "array_diff_key(collect((object) ['toArray' => fn () => [9], 'b' => 2])->union(['c' => 3])->all(), ['toArray' => null])",
    fn () => array_diff_key(
        collect((object) ['toArray' => fn () => [9], 'b' => 2])->union(['c' => 3])->all(),
        ['toArray' => null],
    ),
);

// ==== A read-only operation leaves the RECEIVER exactly as it found it, whatever the operand ====
probe('order-union-leaves-the-receiver-alone', "\$c = collect([1, 2, 3]); \$c->union([7 => 'x', 3 => 'y']); \$c", function () {
    $c = collect([1, 2, 3]);
    $c->union([7 => 'x', 3 => 'y']);

    return d8Views($c);
});
probe('order-union-result', "collect([1, 2, 3])->union([7 => 'x', 3 => 'y'])", fn () => d8Views(
    collect([1, 2, 3])->union([7 => 'x', 3 => 'y']),
));

// On a LIST, union / replace / replaceRecursive answer a list only when the operand's new keys continue it in order.
probe('union-list-out-of-order-operand', "(new Collection(['a']))->union([2 => 'c', 1 => 'b'])", fn () => arrayablePairs((new Collection(['a']))->union([2 => 'c', 1 => 'b'])->all()));
probe('union-list-in-order-operand', "(new Collection(['a']))->union([1 => 'b', 2 => 'c'])", fn () => arrayablePairs((new Collection(['a']))->union([1 => 'b', 2 => 'c'])->all()));
// A string key named like an array property is an ordinary key PHP appends, so the result is keyed.
probe('union-list-length-key-operand', "(new Collection(['a']))->union(['length' => 5])", fn () => arrayablePairs((new Collection(['a']))->union(['length' => 5])->all()));
probe('union-list-length-key-then-int-operand', "(new Collection(['a']))->union(['length' => 5])->union([1 => 'x'])", fn () => arrayablePairs((new Collection(['a']))->union(['length' => 5])->union([1 => 'x'])->all()));
probe('union-list-two-operands-out-of-order', "(new Collection(['a']))->union([1 => 'b'])->union([3 => 'd', 2 => 'c'])", fn () => arrayablePairs((new Collection(['a']))->union([1 => 'b'])->union([3 => 'd', 2 => 'c'])->all()));
probe('union-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->union([3 => 'd', 'k' => 'e'])", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->union([3 => 'd', 'k' => 'e'])->all()));
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

// ---- Family F ------------------------------------------------------------

$fViews = fn (Collection $c) => ['all' => $c->all(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all()];
probe('C32-F-union-null-is-a-new-instance', '$a = collect([1]); $b = $a->union(null); $b->push(2);', function () { $a = collect([1]); $b = $a->union(null); $b->push(2); return ['same' => $a === $b, 'receiver' => $a->all(), 'result' => $b->all()]; });
probe('C32-F-union-null-keeps-keys', "collect([5 => 'a', 'k' => 'b'])->union(null)", fn () => $fViews(collect([5 => 'a', 'k' => 'b'])->union(null)));

// union / replace / replaceRecursive: the receiver's keys first, then the keys the operand adds, in its order
probe('C32-F-union-assoc-then-list', "collect(['a' => 1])->union([5])", fn () => $fViews(collect(['a' => 1])->union([5])));

emit();
