<?php

/**
 * Ground truth for Collection::slice().
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

probe('X15 slice with a negative offset and a length', 'collect([10,20,30,40])->slice(-3,2)', function () {
    return (new Collection(nums()))->slice(-3, 2)->all();
});

// ---- LIST-derived shapes on assoc keys
$eight = ['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5, 'f' => 6, 'g' => 7, 'h' => 8];
probe('L1 slice(3) assoc', '(new Collection($eight))->slice(3)->all()', fn () => (new Collection($eight))->slice(3)->all());
probe('L2 slice(-3) assoc', '(new Collection($eight))->slice(-3)->all()', fn () => (new Collection($eight))->slice(-3)->all());
probe('L3 slice(3,3) assoc', '(new Collection($eight))->slice(3, 3)->all()', fn () => (new Collection($eight))->slice(3, 3)->all());
probe('L4 slice(3,-1) assoc', '(new Collection($eight))->slice(3, -1)->all()', fn () => (new Collection($eight))->slice(3, -1)->all());
probe('L5 slice(-5,3) assoc', '(new Collection($eight))->slice(-5, 3)->all()', fn () => (new Collection($eight))->slice(-5, 3)->all());
probe('L6 slice(-6,-2) assoc', '(new Collection($eight))->slice(-6, -2)->all()', fn () => (new Collection($eight))->slice(-6, -2)->all());
probe('order-slice', 'collect(base)->slice(1)', fn () => d8Views(collect(d8Base())->slice(1)));
probe('order-slice-with-length', 'collect(base)->slice(1, 1)', fn () => d8Views(collect(d8Base())->slice(1, 1)));
probe('order-slice-negative-offset', 'collect(base)->slice(-2)', fn () => d8Views(collect(d8Base())->slice(-2)));
probe('order-slice-negative-length', 'collect(base)->slice(1, -1)', fn () => d8Views(collect(d8Base())->slice(1, -1)));
probe('order-slice-offset-past-the-start', 'collect(base)->slice(-5, 1)', fn () => d8Views(collect(d8Base())->slice(-5, 1)));
probe('order-slice-does-not-mutate', '$c = collect(base); $c->slice(1); $c', function () {
    $c = collect(d8Base());
    $c->slice(1);

    return d8Views($c);
});
probe('order-mixed-slice', "collect([2 => 'c', 'x' => 'a', 1 => 'b'])->slice(1)", fn () => d8Views(
    collect([2 => 'c', 'x' => 'a', 1 => 'b'])->slice(1),
));

probe('slice-out-of-order-offset', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->slice(1)", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->slice(1)->all()));
probe('slice-out-of-order-offset-length', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->slice(0, 2)", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->slice(0, 2)->all()));
probe('slice-out-of-order-negative-offset-length', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->slice(-2, 1)", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->slice(-2, 1)->all()));
probe('slice-mixed-offset', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->slice(1)", fn () => arrayablePairs((new Collection(MIXED))->slice(1)->all()));
probe('slice-mixed-offset-length', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->slice(0, 1)", fn () => arrayablePairs((new Collection(MIXED))->slice(0, 1)->all()));
probe('slice-collision-offset', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->slice(1)", fn () => arrayablePairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->slice(1)->all()));
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

$c32KeysSeen = function (callable $run, bool $answer = false): array {
    $seen = [];
    $run(function ($v, $k) use (&$seen, $answer) {
        $seen[] = [gettype($k), $k];

        return $answer;
    });

    return $seen;
};

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));

// ---- Family G ------------------------------------------------------------

// Key-preserving probes return [[key, value], ...] so integer keys and order survive json_encode.
$pairs = function ($items) use (&$pairs) {
    $out = [];
    foreach ($items instanceof Collection ? $items->all() : $items as $k => $v) {
        $out[] = [$k, $v instanceof Collection ? $pairs($v) : $v];
    }

    return $out;
};
probe('C32-G-slice-counts', "(new Collection([1, 2, 3, 4, 5]))->slice(\$offset) for 1.5, -1.5, NAN, INF and 1e19, and ->slice(0, \$length) for 1.5, NAN, INF and 1e19", fn () => [
    'offset' => array_map(fn (float $offset) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->slice($offset))), ['1.5' => 1.5, '-1.5' => -1.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19]),
    'length' => array_map(fn (float $length) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->slice(0, $length))), ['1.5' => 1.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19]),
]);

emit();
