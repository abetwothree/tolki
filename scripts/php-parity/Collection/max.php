<?php

/**
 * Ground truth for Collection::max().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

// max() keeps an earlier value that no later value exceeds.
probe('max-keeps-earlier-larger-value', '(new Collection([3, 1, 2]))->max()', fn () => (new Collection([3, 1, 2]))->max());
probe('max-key-keeps-earlier-larger-value', "(new Collection([['foo' => 20], ['foo' => 10]]))->max('foo')", fn () => (new Collection([['foo' => 20], ['foo' => 10]]))->max('foo'));
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
probe('C32-H-max-numeric-strings', "(new Collection(['10', '9', '8']))->max()", fn () => (new Collection(['10', '9', '8']))->max());
probe('C32-H-max-dot-path', "(new Collection([['a' => ['b' => 3]], ['a' => ['b' => 7]]]))->max('a.b')", fn () => (new Collection([['a' => ['b' => 3]], ['a' => ['b' => 7]]]))->max('a.b'));
probe('C32-H-min-max-uncomparable-arrays', "[max, min] of [[1], ['a' => 1]] and of [['a' => 1], [1]], two arrays each of which PHP's <=> calls larger", fn () => [
    'max' => [(new Collection([[1], ['a' => 1]]))->max(), (new Collection([['a' => 1], [1]]))->max()],
    'min' => [(new Collection([[1], ['a' => 1]]))->min(), (new Collection([['a' => 1], [1]]))->min()],
]);
probe('C32-H-max-null-callback-answers', "[max(fn () => null), max(fn (\$v) => \$v === 1 ? null : 0)] on [1, 2]", fn () => [(new Collection([1, 2]))->max(fn () => null), (new Collection([1, 2]))->max(fn ($v) => $v === 1 ? null : 0)]);

emit();
