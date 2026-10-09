<?php

/**
 * Ground truth for PHP's array_map().
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

// ---- forget
$f = function ($array, $keys) { Arr::forget($array, $keys); return $array; };

// ==== CollectionTest parity: keys, splice, pop, shift, pad
probe('K1 keys of numeric-looking string keys', 'array_map(fn ($k) => [gettype($k), $k], (new Collection([\'1.5\' => \'a\', \'Infinity\' => \'b\', \'-1\' => \'c\', \'01\' => \'d\', \'1e3\' => \'e\', \'10\' => \'f\', \'1e+21\' => \'g\']))->keys()->all())', function () {
    $keys = (new Collection(['1.5' => 'a', 'Infinity' => 'b', '-1' => 'c', '01' => 'd', '1e3' => 'e', '10' => 'f', '1e+21' => 'g']))->keys()->all();
    return array_map(fn ($k) => [gettype($k), $k], $keys);
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

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));
// array_map is an internal caller, so the float coerces to an int as non-strict code does (with a deprecation)
probe('C32-F-multiply-fractional-count', "array_map([collect([1, 2]), 'multiply'], [2.5])[0]", fn () => @array_map([collect([1, 2]), 'multiply'], [2.5])[0]->all());
probe('C32-F-multiply-non-finite-count', "array_map([collect([1, 2]), 'multiply'], [\$count]) for NAN, INF and -INF: the class and message thrown", fn () => array_map(fn (float $count) => c32c_outcome(fn () => array_map([collect([1, 2]), 'multiply'], [$count])[0]->all()), ['NAN' => NAN, 'INF' => INF, '-INF' => -INF]));
probe('C32-F-multiply-out-of-int-range-count', "array_map([collect([1, 2]), 'multiply'], [\$count]) for 1e19, -1e19, 2**63, -2**63 and the float below -2**63: the answer, or the class and message thrown", fn () => array_map(fn (float $count) => c32c_outcome(fn () => array_map([collect([1, 2]), 'multiply'], [$count])[0]->all()), ['1e19' => 1e19, '-1e19' => -1e19, '2**63' => 9223372036854775808.0, '-2**63' => -9223372036854775808.0, 'below -2**63' => -9223372036854777856.0]));

// ---- Family G ------------------------------------------------------------

// Key-preserving probes return [[key, value], ...] so integer keys and order survive json_encode.
$pairs = function ($items) use (&$pairs) {
    $out = [];
    foreach ($items instanceof Collection ? $items->all() : $items as $k => $v) {
        $out[] = [$k, $v instanceof Collection ? $pairs($v) : $v];
    }

    return $out;
};
// array_map is an internal caller, so a float precision coerces to an int as non-strict code does (with a deprecation)
probe('C32-H-percentage-fractional-precision', "array_map([\$c, 'percentage'], [\$cb], [\$precision]) on [1, 1, 2] with \$cb = fn (\$v) => \$v === 1, for 1.5, -1.5, 2.9, -0.0 and 0.5", fn () => array_map(fn (float $precision) => @array_map([new Collection([1, 1, 2]), 'percentage'], [fn ($v) => $v === 1], [$precision])[0], ['1.5' => 1.5, '-1.5' => -1.5, '2.9' => 2.9, '-0.0' => -0.0, '0.5' => 0.5]));
probe('C32-H-percentage-precision-bounds', "array_map([\$c, 'percentage'], [\$cb], [\$precision]) on [1, 1, 2] for -2**63 and the largest float below 2**63", fn () => array_map(fn (float $precision) => array_map([new Collection([1, 1, 2]), 'percentage'], [fn ($v) => $v === 1], [$precision])[0], ['-2**63' => -9223372036854775808.0, 'below 2**63' => 9223372036854774784.0]));
probe('C32-H-percentage-non-int-precision', "array_map([\$c, 'percentage'], [\$cb], [\$precision]) on [1, 1, 2] for NAN, INF, -INF, 1e19, -1e19 and 2**63, and on [] for NAN: the class and message thrown", fn () => [
    'items' => array_map(fn (float $precision) => c32c_outcome(fn () => array_map([new Collection([1, 1, 2]), 'percentage'], [fn ($v) => $v === 1], [$precision])[0]), ['NAN' => NAN, 'INF' => INF, '-INF' => -INF, '1e19' => 1e19, '-1e19' => -1e19, '2**63' => 9223372036854775808.0]),
    'empty' => c32c_outcome(fn () => array_map([new Collection([]), 'percentage'], [fn ($v) => $v === 1], [NAN])[0]),
]);

emit();
