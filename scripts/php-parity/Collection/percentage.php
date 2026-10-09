<?php

/**
 * Ground truth for Collection::percentage().
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

// percentage: PHP's round() compares the value with the double nearest its midpoint; toFixed() and Math.round() do not.
probe('C32-H-percentage-fp-below-half', "(new Collection(range(1, 2000)))->percentage(fn (\$v) => \$v <= 9, 1)", fn () => (new Collection(range(1, 2000)))->percentage(fn ($v) => $v <= 9, 1));
probe('C32-H-percentage-precision-zero-and-negative', "[percentage(..., 0), percentage(..., -1)] on [1, 1, 2]", fn () => [(new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, 0), (new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, -1)]);
probe('C32-H-percentage-fp-just-below-half-rounds-up', "(new Collection(range(1, 2000)))->percentage(fn (\$v) => \$v <= 3, 1)", fn () => (new Collection(range(1, 2000)))->percentage(fn ($v) => $v <= 3, 1));
probe('C32-H-percentage-scaled-just-short-of-whole', "(new Collection(range(1, 35)))->percentage(fn (\$v) => \$v <= 3, 15)", fn () => (new Collection(range(1, 35)))->percentage(fn ($v) => $v <= 3, 15));
probe('C32-H-percentage-beyond-double-digits', "(new Collection(range(1, 9)))->percentage(fn (\$v) => \$v === 1, 15)", fn () => (new Collection(range(1, 9)))->percentage(fn ($v) => $v === 1, 15));
probe('C32-H-percentage-extreme-precision', "[percentage(=== 1, -400), percentage(=== 1, 400), percentage(=== 5, 400)] on [1, 1, 2]", fn () => [(new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, -400), (new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, 400), (new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 5, 400)]);

emit();
