<?php

/**
 * Ground truth for Collection::chunk().
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

// ==== chunk (CollectionTest::testChunkWhenGivenZeroAsSize / testChunkWhenGivenLessThanZero)
$ten = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
probe('collection-chunk-zero', "(new Collection([1..10]))->chunk(0)", fn () => (new Collection($ten))->chunk(0)->toArray());
probe('collection-chunk-negative', "(new Collection([1..10]))->chunk(-1)", fn () => (new Collection($ten))->chunk(-1)->toArray());
probe('collection-chunk-last-chunk-keys', "(new Collection([1..10]))->chunk(3)->get(3)", fn () => (new Collection($ten))->chunk(3)->get(3)->all());
probe('collection-chunk-assoc-preserves-keys', "(new Collection(['a'=>1,'b'=>2,'c'=>3]))->chunk(2)", fn () => (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->chunk(2)->toArray());
probe('arr-chunk-zero-and-negative', "array_chunk guard via Collection::chunk on an assoc backing", fn () => [
    'zero' => (new Collection(['a' => 1, 'b' => 2]))->chunk(0)->toArray(),
    'negative' => (new Collection(['a' => 1, 'b' => 2]))->chunk(-1)->toArray(),
]);

// ---- 1. Structure.
probe('chunk-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunk(2)", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->chunk(2)));
probe('chunk-out-of-order-renumbered', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunk(2, false)", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->chunk(2, false)));
probe('chunk-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->chunk(2)", fn () => arrayablePairs((new Collection(MIXED))->chunk(2)));
probe('chunk-mixed-renumbered', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->chunk(2, false)", fn () => arrayablePairs((new Collection(MIXED))->chunk(2, false)));
probe('chunk-collision-renumbered', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->chunk(2, false)", fn () => arrayablePairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->chunk(2, false)));
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
probe('C32-G-chunk-assoc-no-preserve', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->chunk(2, false)",
    fn () => $pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->chunk(2, false)));
probe('C32-G-chunk-fractional-size', '(new Collection([1, 2, 3, 4, 5]))->chunk(2.5)',
    fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->chunk(2.5)));

// Counts: a float reaches array_chunk(), array_slice(), range() or %, each of which casts it or throws.
probe('C32-G-chunk-counts', "(new Collection([1, 2, 3, 4, 5]))->chunk(\$size) for 1.5, 0.5, NAN, INF, -INF and 1e19, and (new Collection([]))->chunk(\$size) for NAN, INF and 1e19: the chunks, or the class and message thrown", fn () => [
    ...array_map(fn (float $size) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->chunk($size))), ['1.5' => 1.5, '0.5' => 0.5, 'NAN' => NAN, 'INF' => INF, '-INF' => -INF, '1e19' => 1e19]),
    ...array_map(fn (float $size) => c32c_outcome(fn () => $pairs(@(new Collection([]))->chunk($size))), ['empty NAN' => NAN, 'empty INF' => INF, 'empty 1e19' => 1e19]),
]);

emit();
