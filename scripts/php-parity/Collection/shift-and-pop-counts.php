<?php

/**
 * Ground truth for how Collection::shift() and pop() read a count.
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
$takeCounts = ['2.5' => 2.5, '1.5' => 1.5, '0.5' => 0.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19];
foreach (['shift', 'pop'] as $takeMethod) {
    probe("C32-B-{$takeMethod}-fractional-and-non-finite-counts", "{$takeMethod}(\$count) over collect([1, 2, 3, 4]) and collect(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4]) for 2.5, 1.5, 0.5, NAN, INF and 1e19, and over collect([9]) and collect([]) for 1.5: what it returns, or the class and message thrown, and what the collection holds after", fn () => [
        'list' => array_map(fn ($count) => $takeOutcome($takeMethod, [1, 2, 3, 4], $count), $takeCounts),
        'keyed' => array_map(fn ($count) => $takeOutcome($takeMethod, ['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4], $count), $takeCounts),
        'one item' => $takeOutcome($takeMethod, [9], 1.5),
        'empty' => $takeOutcome($takeMethod, [], 1.5),
    ]);
}
probe('C32-B-shift-and-pop-counts-out-of-order-keys', "shift(\$count) and pop(\$count) over collect([2 => 'c', 0 => 'a', 1 => 'b']) for 2.5, 1.5 and NAN: what each returns, or the class and message thrown, and the keys and values left", fn () => array_map(fn (string $method) => array_map(function ($count) use ($method, $keysAndValues) {
    $c = collect([2 => 'c', 0 => 'a', 1 => 'b']);
    $returned = c32c_outcome(fn () => $c->$method($count)->all());

    return ['returned' => $returned] + $keysAndValues($c);
}, ['2.5' => 2.5, '1.5' => 1.5, 'NAN' => NAN]), ['shift' => 'shift', 'pop' => 'pop']));

emit();
