<?php

/**
 * Ground truth for Collection::sortDesc().
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

probe('sortDesc over the same fixture', 'collect([30,10,20])->sortDesc()', function () {
    return (new Collection([30, 10, 20]))->sortDesc()->all();
});

probe('sortDesc ties fall back to original order, not a full reverse', 'collect([[id=a,k=2],[id=b,k=1],[id=c,k=2],[id=d,k=3]])->sortByDesc(fn($i)=>$i["k"])->pluck("id")->values()->all()', function () {
    $items = [
        ['id' => 'a', 'k' => 2],
        ['id' => 'b', 'k' => 1],
        ['id' => 'c', 'k' => 2],
        ['id' => 'd', 'k' => 3],
    ];

    return collect($items)->sortByDesc(fn ($i) => $i['k'])->pluck('id')->values()->all();
});

probe('sortDesc on integer-keyed collection reorders values (PHP)', 'collect([0=>3,1=>1,2=>2])->sortDesc()->all()', function () {
    return collect([0 => 3, 1 => 1, 2 => 2])->sortDesc()->all();
});

// sortDesc's no-callback guard: `sort` was aligned on PHP falsiness in both
// packages, `sortDesc` was not. PHP reads a string as a SORT_* flag, so only
// the numeric-string form has an answer at all.
probe('Collection::sortDesc — a string callback is a sort flag, not a field path', 'sortDesc(""), sortDesc("0"), sortDesc("age")', function () {
    $c = new Collection(['a' => 3, 'b' => 1, 'c' => 2]);

    $attempt = static function ($flag) use ($c) {
        try {
            return $c->sortDesc($flag)->all();
        } catch (\Throwable $e) {
            return ['threw' => get_class($e), 'message' => $e->getMessage()];
        }
    };

    return [
        'empty_string' => $attempt(''),
        'zero_string' => $attempt('0'),
        'non_numeric_string' => $attempt('age'),
    ];
});

// B6 — the same ordering seen through every sort entry point the port mirrors.
$mixed = ['9', '10', '1', 5];
probe('Collection::sortDesc orders numeric strings numerically', 'collect(["9","10","1",5])->sortDesc()->values()', fn () => collect($mixed)->sortDesc()->values()->all());
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
probe('C32-G-sortDesc-callback-throws', '(new Collection([1, 3, 2]))->sortDesc(fn ($v) => $v)',
    fn () => (new Collection([1, 3, 2]))->sortDesc(fn ($v) => $v)->all());

emit();
