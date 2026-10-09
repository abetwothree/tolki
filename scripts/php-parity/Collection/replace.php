<?php

/**
 * Ground truth for Collection::replace().
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

probe('replace does not mutate', '$c->replace(["b"=>2])', function () {
    $c = new Collection(['a' => 1]);
    $r = $c->replace(['b' => 2]);

    return ['result' => $r->all(), 'source' => $c->all()];
});

probe('replace(null)', '$c->replace(null)', function () {
    return (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->replace(null)->all();
});

// Numeric-key counterparts of the four probes above, so the arr pins and list-backed tests have a PHP row too.

probe('replace array does not mutate', '$c->replace([9])', function () {
    $c = new Collection([1, 2]);
    $r = $c->replace([9]);

    return ['result' => $r->all(), 'source' => $c->all()];
});

probe('replace array (null)', '$c->replace(null)', function () {
    return (new Collection([1, 2, 3]))->replace(null)->all();
});

probe('X9 replace does not mutate', "collect([10,20,30,40])->replace([1=>'d'])", function () {
    $c = new Collection(nums());
    $out = $c->replace([1 => 'd']);

    return ['result' => $out->all(), 'source' => $c->all()];
});

probe('X11 replace/replaceRecursive treat null as a no-op', 'collect([10,20,30,40])->replace(null)', function () {
    return [
        'replace' => (new Collection(nums()))->replace(null)->all(),
        'replaceRecursive' => (new Collection(nums()))->replaceRecursive(null)->all(),
    ];
});
probe('C16 replace assoc', '(new Collection([\'name\' => \'amir\', \'family\' => \'otwell\']))->replace([\'name\' => \'taylor\', \'age\' => 26])->all()', fn () => (new Collection(['name' => 'amir', 'family' => 'otwell']))->replace(['name' => 'taylor', 'age' => 26])->all());
probe('C23 replace int-keyed replacer on int-keyed', '(new Collection([\'a\', \'b\', \'c\']))->replace([1 => \'d\', 2 => \'e\', 3 => \'f\', 4 => \'g\'])->all()', fn () => (new Collection(['a', 'b', 'c']))->replace([1 => 'd', 2 => 'e', 3 => 'f', 4 => 'g'])->all());
probe('replace-list-replacer', "(new Collection(['a' => 1]))->replace(['x'])", fn () => (new Collection(['a' => 1]))->replace(['x'])->all());

// ---- list-backed Collection with a Collection-like operand (arr sibling of the object-backed rows above)
probe('replace-list-collection-operand', "(new Collection([1, 2, 3]))->replace(new Collection([9]))", fn () => (new Collection([1, 2, 3]))->replace(new Collection([9]))->all());
probe('replace-list-keyed-replacer', "(new Collection(['a', 'b', 'c']))->replace([1 => 'x', 'k' => 'y']), ->replace(['01' => 'x']), ->replace([-1 => 'x']), ->replace(['1.5' => 'x']), (new Collection(['a']))->replace([3 => 'x']), and each through ->replaceRecursive()", fn () => [
    'replace' => [
        'mixed' => (new Collection(['a', 'b', 'c']))->replace([1 => 'x', 'k' => 'y'])->all(),
        'leading-zero' => (new Collection(['a', 'b', 'c']))->replace(['01' => 'x'])->all(),
        'negative' => (new Collection(['a', 'b', 'c']))->replace([-1 => 'x'])->all(),
        'float-string' => (new Collection(['a', 'b', 'c']))->replace(['1.5' => 'x'])->all(),
        'gap' => (new Collection(['a']))->replace([3 => 'x'])->all(),
    ],
    'replaceRecursive' => [
        'mixed' => (new Collection(['a', 'b', 'c']))->replaceRecursive([1 => 'x', 'k' => 'y'])->all(),
        'leading-zero' => (new Collection(['a', 'b', 'c']))->replaceRecursive(['01' => 'x'])->all(),
        'negative' => (new Collection(['a', 'b', 'c']))->replaceRecursive([-1 => 'x'])->all(),
        'float-string' => (new Collection(['a', 'b', 'c']))->replaceRecursive(['1.5' => 'x'])->all(),
        'gap' => (new Collection(['a']))->replaceRecursive([3 => 'x'])->all(),
    ],
]);
probe('replace-scalar-operand', "(new Collection(['a', 'b']))->replace('z'), ->replaceRecursive('z')", fn () => [
    'replace' => (new Collection(['a', 'b']))->replace('z')->all(),
    'replaceRecursive' => (new Collection(['a', 'b']))->replaceRecursive('z')->all(),
]);

// ---- an assoc-backed Collection reads a list operand by index, as a list-backed one reads a keyed operand by key
probe('object-backing-list-operand', "\$c = new Collection([0 => 'a', 1 => 'b', 'x' => 'c']); \$c->replace(['z']), ->replaceRecursive(['z']), ->intersectByKeys(['z']), ->intersectAssoc(['a']), ->intersectAssocUsing(['a'], \$cmp)", function () {
    $c = new Collection([0 => 'a', 1 => 'b', 'x' => 'c']);

    return [
        'replace' => $c->replace(['z'])->all(),
        'replaceRecursive' => $c->replaceRecursive(['z'])->all(),
        'intersectByKeys' => $c->intersectByKeys(['z'])->all(),
        'intersectAssoc' => $c->intersectAssoc(['a'])->all(),
        'intersectAssocUsing' => $c->intersectAssocUsing(['a'], fn ($a, $b) => $a <=> $b)->all(),
    ];
});

// ==== arr.replace/arr.replaceRecursive return a JS list, so they drop a string key and fill
// a gap with undefined; array_replace keeps both, so obj has to serve BOTH backings. The
// earlier files only cover same-shape and int-keyed replacers, which hide the difference.

probe('replace-list-string-key-replacer', "(new Collection(['a','b','c']))->replace(['k' => 'x'])", fn () => (new Collection(['a', 'b', 'c']))->replace(['k' => 'x'])->all());
probe('replace-list-sparse-replacer', "(new Collection(['a']))->replace([3 => 'd'])", fn () => (new Collection(['a']))->replace([3 => 'd'])->all());
probe('replace-list-mixed-key-replacer', "(new Collection(['a','b']))->replace([1 => 'z', 'k' => 'x'])", fn () => (new Collection(['a', 'b']))->replace([1 => 'z', 'k' => 'x'])->all());
probe('replace-traversable-backing', "collect(gen(1,2))->replace([0 => 9])", fn () => (new Collection(traversable()))->replace([0 => 9])->all());
probe('replace-list-out-of-order-operand', "(new Collection(['a']))->replace([2 => 'c', 1 => 'b'])", fn () => arrayablePairs((new Collection(['a']))->replace([2 => 'c', 1 => 'b'])->all()));
probe('replace-list-in-order-operand', "(new Collection(['a']))->replace([1 => 'b', 2 => 'c'])", fn () => arrayablePairs((new Collection(['a']))->replace([1 => 'b', 2 => 'c'])->all()));
probe('replace-two-item-list-out-of-order-operand', "(new Collection(['a', 'b']))->replace([3 => 'd', 2 => 'c'])", fn () => arrayablePairs((new Collection(['a', 'b']))->replace([3 => 'd', 2 => 'c'])->all()));
probe('replace-two-item-list-in-order-operand', "(new Collection(['a', 'b']))->replace([2 => 'c', 3 => 'd'])", fn () => arrayablePairs((new Collection(['a', 'b']))->replace([2 => 'c', 3 => 'd'])->all()));
probe('replace-two-item-list-out-of-order-existing-keys', "(new Collection(['a', 'b']))->replace([1 => 'B', 0 => 'A'])", fn () => arrayablePairs((new Collection(['a', 'b']))->replace([1 => 'B', 0 => 'A'])->all()));
probe('replace-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->replace([1 => 'B', 5 => 'f'])", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->replace([1 => 'B', 5 => 'f'])->all()));
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

// replace / replaceRecursive: the PHP tests' own sparse int-keyed replacers
probe('C32-F-replace-sparse-int-keyed-replacer', "collect(['a', 'b', 'c'])->replace([1 => 'd', 2 => 'e'])", fn () => collect(['a', 'b', 'c'])->replace([1 => 'd', 2 => 'e'])->all());
probe('C32-F-replace-assoc-then-list', "collect(['a' => 1])->replace(['x'])", fn () => $fViews(collect(['a' => 1])->replace(['x'])));
probe('C32-F-replace-out-of-order-int-keys', "collect([1, 2, 3])->replace([7 => 'x', 3 => 'y'])", fn () => $fViews(collect([1, 2, 3])->replace([7 => 'x', 3 => 'y'])));

emit();
