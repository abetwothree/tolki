<?php

/**
 * Ground truth for Collection::zip().
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

// ---- Family F ------------------------------------------------------------

$fViews = fn (Collection $c) => ['all' => $c->all(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all()];
$fRows = fn (Collection $c) => $c->map(fn ($row) => $row instanceof Collection ? $row->all() : $row)->all();

// zip: array_map pads every shorter side, the receiver included, with null
probe('C32-F-zip-receiver-shorter', "collect(['a', 'b'])->zip([1, 2, 3])", fn () => $fRows(collect(['a', 'b'])->zip([1, 2, 3])));
probe('C32-F-zip-empty-receiver', 'collect([])->zip([1, 2])', fn () => $fRows(collect([])->zip([1, 2])));
probe('C32-F-zip-null-operand', 'collect([1, 2])->zip(null)', fn () => $fRows(collect([1, 2])->zip(null)));
probe('C32-F-zip-assoc-receiver-longer-operand', "collect(['a' => 1, 'b' => 2])->zip(['x' => 'p', 'y' => 'q', 'z' => 'r'])", fn () => $fRows(collect(['a' => 1, 'b' => 2])->zip(['x' => 'p', 'y' => 'q', 'z' => 'r'])));
probe('C32-F-zip-operand-shorter', 'collect([1, 2, 3])->zip([4, 5])', fn () => $fRows(collect([1, 2, 3])->zip([4, 5])));
probe('C32-F-zip-assoc-operand', "collect([1, 2])->zip(['a' => 'x', 'b' => 'y'])", fn () => $fRows(collect([1, 2])->zip(['a' => 'x', 'b' => 'y'])));

emit();
