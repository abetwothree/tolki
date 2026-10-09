<?php

/**
 * Ground truth for Collection::partition().
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

// partition
probe('C32-D-partition-null-key-truthiness', "(new Collection([1, 0, '', 'a', null, [], '0']))->partition(null)", fn () => array_map(fn ($p) => pairs($p->values()), (new Collection([1, 0, '', 'a', null, [], '0']))->partition(null)->all()));
probe('C32-D-partition-two-arg-null', "(new Collection([['v' => null], ['v' => 0], ['v' => 1]]))->partition('v', null)", fn () => array_map(fn ($p) => $p->keys()->all(), (new Collection([['v' => null], ['v' => 0], ['v' => 1]]))->partition('v', null)->all()));
probe('C32-D-partition-not-equal-operator', "(new Collection([['v' => 1], ['v' => '1'], ['v' => 2]]))->partition('v', '!=', 1)", fn () => array_map(fn ($p) => $p->keys()->all(), (new Collection([['v' => 1], ['v' => '1'], ['v' => 2]]))->partition('v', '!=', 1)->all()));
probe('C32-D-partition-outer-keys', "(new Collection(['a' => 1, 'b' => 2]))->partition(fn (\$v) => \$v > 1)->keys()", fn () => (new Collection(['a' => 1, 'b' => 2]))->partition(fn ($v) => $v > 1)->keys()->all());
// The engine's message names the calling file and line, so record only its path-free head.
probe('C32-D-partition-no-args', "(new Collection([1]))->partition()", function () {
    try {
        return (new Collection([1]))->partition()->count();
    } catch (\ArgumentCountError $e) {
        return get_class($e) . ': ' . preg_replace('/ passed in .*$/', ' passed', $e->getMessage());
    }
});
probe('C32-D-partition-null-empty-objects', "(new Collection([new DateTime('@0'), new stdClass]))->partition(null) counts", fn () => array_map(fn ($p) => $p->count(), (new Collection([new DateTime('@0'), new stdClass]))->partition(null)->all()));
probe('C32-D-partition-bool-false-two-arg', "(new Collection([['v' => false], ['v' => 0], ['v' => null], ['v' => 1]]))->partition('v', false) keys", fn () => array_map(fn ($p) => $p->keys()->all(), (new Collection([['v' => false], ['v' => 0], ['v' => null], ['v' => 1]]))->partition('v', false)->all()));
probe('C32-D-partition-collection-rows', "c32c_rows(list | keyed)->partition('k', 'b'): each half's keys and each row's 'v'", fn () => array_map(fn (bool $keyed) => array_map(fn (Collection $half) => [
    $half->keys()->all(),
    $half->pluck('v')->all(),
], c32c_rows($keyed)->partition('k', 'b')->all()), ['list' => false, 'keyed' => true]));

probe('C32-D-partition-offset-get', "(new Collection(['a' => 1, 'b' => 2]))->partition(fn (\$v) => \$v > 1): its [0] and [1]", function () {
    $halves = (new Collection(['a' => 1, 'b' => 2]))->partition(fn ($v) => $v > 1);

    return [pairs($halves[0]), pairs($halves[1])];
});

emit();
