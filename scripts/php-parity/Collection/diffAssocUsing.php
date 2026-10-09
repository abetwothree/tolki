<?php

/**
 * Ground truth for Collection::diffAssocUsing().
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

probe('C8 diffAssocUsing strcasecmp', '(new Collection([\'a\' => \'green\', \'b\' => \'brown\', \'c\' => \'blue\', \'red\']))->diffAssocUsing(new Collection([\'A\' => \'green\', \'yellow\', \'red\']), \'strcasecmp\')->all()', fn () => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red']))->diffAssocUsing(new Collection(['A' => 'green', 'yellow', 'red']), 'strcasecmp')->all());
// ---- callback key types: PHP hands a callback an integer key as an int
$keyTypes = function (callable $run, mixed $result = true): array {
    $seen = [];

    try {
        $run(function ($value, $key) use (&$seen, $result) {
            $seen[] = gettype($key);

            return $result;
        });
    } catch (\Throwable) {
    }

    return $seen;
};

// ---- a list-backed Collection's diffAssocUsing/diffKeysUsing: array_diff_uassoc/array_diff_ukey over the indices
probe('diffAssocUsing-list-collection-operand', "(new Collection([1, 2, 3]))->diffAssocUsing(new Collection([1, 9, 3]), 'strcasecmp')", fn () => (new Collection([1, 2, 3]))->diffAssocUsing(new Collection([1, 9, 3]), 'strcasecmp')->values()->all());
probe('diffAssocUsing-list-string-cast', "(new Collection([1, 2]))->diffAssocUsing(['1', '3'], 'strcasecmp')", fn () => (new Collection([1, 2]))->diffAssocUsing(['1', '3'], 'strcasecmp')->values()->all());
probe('callback-key *Using on a list', "(new Collection([1, 2]))->diffAssocUsing([1, 9], \$cmp) / ->diffKeysUsing([1, 9], \$cmp): every key type the comparator sees", function () {
    $types = function (callable $run): array {
        $seen = [];
        $run(function ($a, $b) use (&$seen) {
            $seen[gettype($a)] = true;
            $seen[gettype($b)] = true;

            return $a <=> $b;
        });

        return array_keys($seen);
    };

    return [
        'diffAssocUsing' => $types(fn ($cmp) => (new Collection([1, 2]))->diffAssocUsing([1, 9], $cmp)),
        'diffKeysUsing' => $types(fn ($cmp) => (new Collection([1, 2]))->diffKeysUsing([1, 9], $cmp)),
    ];
});
probe('d6-diff-assoc-using-and-diff-keys-using-on-a-list', "(new Collection([1, 2, 3]))->diffAssocUsing([1, 9, 3], 'strcasecmp') / ->diffKeysUsing(['a' => 1, 1 => 5], 'strcasecmp')", function () {
    return [
        'diffAssocUsing-list' => (new Collection([1, 2, 3]))->diffAssocUsing([1, 9, 3], 'strcasecmp')->all(),
        'diffKeysUsing-list' => (new Collection([1, 2]))->diffKeysUsing(['a' => 1, 1 => 5], 'strcasecmp')->all(),
        'diffAssocUsing-assoc' => (new Collection(['a' => 'green', 'b' => 'brown']))->diffAssocUsing(['A' => 'green', 'c' => 'blue'], 'strcasecmp')->all(),
        'diffKeysUsing-assoc' => (new Collection(['id' => 1, 'first_word' => 'Hello']))->diffKeysUsing(['ID' => 123, 'foo_bar' => 'Hello'], 'strcasecmp')->all(),
    ];
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

// ---- Family F ------------------------------------------------------------

$fViews = fn (Collection $c) => ['all' => $c->all(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all()];
probe('C32-F-diffAssocUsing-mixed-keys-order', "collect(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red'])->diffAssocUsing(collect(['A' => 'green', 'yellow', 'red']), 'strcasecmp')", fn () => $fViews(collect(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red'])->diffAssocUsing(collect(['A' => 'green', 'yellow', 'red']), 'strcasecmp')));

emit();
