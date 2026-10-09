<?php

/**
 * Ground truth for Collection::merge().
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

// merge / union / mergeRecursive with null hand back a NEW instance (PHP: newInstance(array_merge(...)))
probe('C32-F-merge-null-is-a-new-instance', '$a = collect([1]); $b = $a->merge(null); $b->push(2);', function () { $a = collect([1]); $b = $a->merge(null); $b->push(2); return ['same' => $a === $b, 'receiver' => $a->all(), 'result' => $b->all()]; });
probe('C32-F-merge-null-renumbers', "collect([5 => 'a', 'k' => 'b'])->merge(null)", fn () => $fViews(collect([5 => 'a', 'k' => 'b'])->merge(null)));

// merge: integer keys are renumbered and appended, string keys overwrite
probe('C32-F-merge-assoc-then-list', "collect(['a' => 1, 'b' => 2])->merge([3, 4])", fn () => $fViews(collect(['a' => 1, 'b' => 2])->merge([3, 4])));
probe('C32-F-merge-int-keyed-record-then-list', "collect(['a' => 1, 5 => 'x'])->merge(['y'])", fn () => $fViews(collect(['a' => 1, 5 => 'x'])->merge(['y'])));
probe('C32-F-merge-same-int-key-appends', "collect([5 => 'a'])->merge([5 => 'b'])", fn () => $fViews(collect([5 => 'a'])->merge([5 => 'b'])));
probe('C32-F-merge-scalar-operand', "collect(['hello'])->merge(1)", fn () => collect(['hello'])->merge(1)->all());
probe('C32-F-merge-string-key-keeps-its-place', "collect(['a' => 1, 'b' => 2])->merge(['c' => 3, 'a' => 9])", fn () => $fViews(collect(['a' => 1, 'b' => 2])->merge(['c' => 3, 'a' => 9])));
probe('C32-F-merge-list-then-out-of-order-int-keys', "collect([1])->merge([3 => 'x', 1 => 'y'])", fn () => $fViews(collect([1])->merge([3 => 'x', 1 => 'y'])));
probe('C32-F-merge-out-of-order-receiver', "collect([2 => 'c', 0 => 'a', 1 => 'b'])->merge(['d'])", fn () => $fViews(collect([2 => 'c', 0 => 'a', 1 => 'b'])->merge(['d'])));

emit();
