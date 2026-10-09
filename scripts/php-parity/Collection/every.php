<?php

/**
 * Ground truth for Collection::every().
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

// ==== the same insertion order drives the two predicate readers ====
probe('every-out-of-order-key-order', '$keys seen by collect(base)->every($cb returning true)', function () {
    $seen = [];
    collect(e0Base())->every(function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return true;
    });

    return $seen;
});
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

probe('C32-C-every-two-args-key-value', '(new Collection([["age" => 18], ["age" => 18]]))->every("age", 18) / (new Collection([["status" => "active"], ["status" => "active"]]))->every("status", "active")', fn () => [
    (new Collection([['age' => 18], ['age' => 18]]))->every('age', 18),
    (new Collection([['status' => 'active'], ['status' => 'active']]))->every('status', 'active'),
]);
probe('C32-C-every-two-args-null-value', '(new Collection([["x" => null], ["x" => null]]))->every("x", null) / (new Collection([["x" => 1]]))->every("x", null)', fn () => [
    (new Collection([['x' => null], ['x' => null]]))->every('x', null),
    (new Collection([['x' => 1]]))->every('x', null),
]);
probe('C32-C-every-callback-key-types', 'key types an always-true every callback sees on ["a", "b"] and on ["1" => "a", "x" => "b"]', fn () => [
    'list' => $c32KeysSeen(fn ($cb) => (new Collection(['a', 'b']))->every($cb), true),
    'record' => $c32KeysSeen(fn ($cb) => (new Collection(['1' => 'a', 'x' => 'b']))->every($cb), true),
]);
probe('C32-C-every-path-php-falsy', '(new Collection([["a" => "0"]]))->every("a") / (new Collection([["a" => []]]))->every("a") / (new Collection(["0"]))->every(null)', fn () => [
    (new Collection([['a' => '0']]))->every('a'),
    (new Collection([['a' => []]]))->every('a'),
    (new Collection(['0']))->every(null),
]);
probe('C32-C-every-null-operator', "(new Collection([['x' => 5], ['x' => '5']]))->every('x', null, 5) / (new Collection([['x' => 5], ['x' => 6]]))->every('x', null, 5)", fn () => [
    (new Collection([['x' => 5], ['x' => '5']]))->every('x', null, 5),
    (new Collection([['x' => 5], ['x' => 6]]))->every('x', null, 5),
]);

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));

probe('C32-E-callback-key-types-sweep', "[gettype(\$k), \$k] for each key a callback sees on ['a', 'b'] and on ['1' => 'a', 'x' => 'b']; sortKeysUsing lists the distinct keys it compared, sorted", function () {
    $out = [];
    foreach (['list' => ['a', 'b'], 'record' => ['1' => 'a', 'x' => 'b']] as $name => $items) {
        $trace = function (callable $run) use ($items): array {
            $seen = [];
            $run(new Collection($items), function ($k) use (&$seen) { $seen[] = [gettype($k), $k]; });

            return $seen;
        };
        $out['every'][$name] = $trace(fn ($c, $note) => $c->every(function ($v, $k) use ($note) { $note($k); return true; }));
        $out['each'][$name] = $trace(fn ($c, $note) => $c->each(function ($v, $k) use ($note) { $note($k); }));
        $out['groupBy'][$name] = $trace(fn ($c, $note) => $c->groupBy(function ($v, $k) use ($note) { $note($k); return 'g'; }));
        $out['countBy'][$name] = $trace(fn ($c, $note) => $c->countBy(function ($v, $k) use ($note) { $note($k); return 'g'; }));
        $out['sortBy'][$name] = $trace(fn ($c, $note) => $c->sortBy(function ($v, $k) use ($note) { $note($k); return $v; }));
        $out['reduceSpread'][$name] = $trace(fn ($c, $note) => $c->reduceSpread(function ($carry, $v, $k) use ($note) { $note($k); return [$carry]; }, null));
        $out['mapWithKeys'][$name] = $trace(fn ($c, $note) => $c->mapWithKeys(function ($v, $k) use ($note) { $note($k); return [$v => $v]; }));
        $out['keyBy'][$name] = $trace(fn ($c, $note) => $c->keyBy(function ($v, $k) use ($note) { $note($k); return $v; }));
        $compared = $trace(fn ($c, $note) => $c->sortKeysUsing(function ($a, $b) use ($note) { $note($a); $note($b); return strcmp((string) $a, (string) $b); }));
        $distinct = array_values(array_unique(array_map('json_encode', $compared)));
        sort($distinct);
        $out['sortKeysUsing'][$name] = array_map(fn (string $pair) => json_decode($pair, true), $distinct);
    }

    return $out;
});

emit();
