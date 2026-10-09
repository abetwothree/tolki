<?php

/**
 * Ground truth for Collection::diffKeys().
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

// ==== Task D6 Step 2: the set operations neither @tolki/arr nor @tolki/obj ports yet.
probe('d6-diff-keys', "(new Collection(['id' => 1, 'first_word' => 'Hello']))->diffKeys(['id' => 123, 'foo_bar' => 'Hello'])", function () {
    return [
        'assoc' => (new Collection(['id' => 1, 'first_word' => 'Hello']))->diffKeys(['id' => 123, 'foo_bar' => 'Hello'])->all(),
        'assoc-value-ignored' => (new Collection(['a' => 1, 'b' => 2]))->diffKeys(['a' => 999])->all(),
        'list' => (new Collection([1, 2, 3]))->diffKeys([9, 9])->all(),
        'list-keyed-operand' => (new Collection([1, 2]))->diffKeys(['a' => 1, 1 => 5])->all(),
        'nullish-operand' => (new Collection(['a' => 1]))->diffKeys(null)->all(),
        'collection-operand' => (new Collection(['a' => 1, 'b' => 2]))->diffKeys(new Collection(['a' => 9]))->all(),
    ];
});

// ==== Task D6 citation audit: the LIST forms of the operand edges the rows above record
// ==== only for a keyed backing, so @tolki/arr's assertions cite a call of their own shape.
probe('d6-list-operand-edges', "(new Collection([1, 2]))->diffKeys([999]) / ->diffKeys(null) / ->diffKeys(new Collection([9])) and the diffUsing / intersectUsing twins", function () {
    $caseless = 'strcasecmp';

    return [
        'diffKeys-value-ignored' => (new Collection([1, 2]))->diffKeys([999])->all(),
        'diffKeys-nullish-operand' => (new Collection([1, 2]))->diffKeys(null)->all(),
        'diffKeys-collection-operand' => (new Collection([1, 2]))->diffKeys(new Collection([9]))->all(),
        'diffUsing-nullish-operand' => (new Collection(['green']))->diffUsing(null, $caseless)->all(),
        'diffUsing-collection-operand' => (new Collection(['green', 'brown']))->diffUsing(new Collection(['GREEN']), $caseless)->all(),
        'intersectUsing-nullish-operand' => (new Collection(['green']))->intersectUsing(null, $caseless)->all(),
        'intersectUsing-collection-operand' => (new Collection(['green', 'brown']))->intersectUsing(new Collection(['GREEN']), $caseless)->all(),
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

// diffKeys: only the operand's own keys count, so a list operand holds no 'length' key
probe('C32-F-diffKeys-length-key', "collect(['length' => 5, 'b' => 2])->diffKeys(['x'])", fn () => $fViews(collect(['length' => 5, 'b' => 2])->diffKeys(['x'])));
probe('C32-F-diffKeys-signature-examples', "collect(['a' => 1, 'b' => 2, 'c' => 3])->diffKeys(['b' => 2]) / collect([1, 3, 5, 7, 8])->diffKeys([1, 3, 5]) / collect([1, 3, 5])->diffKeys([1, 3, 5, 7, 8])", fn () => [
    'assoc' => collect(['a' => 1, 'b' => 2, 'c' => 3])->diffKeys(['b' => 2])->all(),
    'list' => collect([1, 3, 5, 7, 8])->diffKeys([1, 3, 5])->all(),
    'list-emptied' => collect([1, 3, 5])->diffKeys([1, 3, 5, 7, 8])->all(),
]);

emit();
