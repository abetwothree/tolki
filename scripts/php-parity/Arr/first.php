<?php

/**
 * Ground truth for Arr::first().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;

// --- first / last on assoc
probe('first-assoc-no-match', "Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn (\$v) => \$v > 300)", fn () => Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn ($v) => $v > 300));
probe('first-assoc-closure-default', "Arr::first(assoc, fn > 300, fn () => 'baz')", fn () => Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn ($v) => $v > 300, fn () => 'baz'));
probe('first-assoc-falsy-match', "Arr::first(['a' => 0, 'b' => 10, 'c' => 20], fn (\$v) => \$v === 0)", fn () => Arr::first(['a' => 0, 'b' => 10, 'c' => 20], fn ($v) => $v === 0));
probe('first-assoc-key-callback', "Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn (\$v, \$k) => \$k !== 'a')", fn () => Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn ($v, $k) => $k !== 'a'));
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
$intKeyed = [1 => 'a', 'x' => 'b'];
probe('callback-key first', 'Arr::first([1 => "a", "x" => "b"], $cb returning false)', fn () => $keyTypes(fn ($cb) => Arr::first($intKeyed, $cb), false));

// ==== Arr::first / Arr::last read the same insertion order, which is what dataFirst/dataLast port ====
probe('arr-first-out-of-order', 'Arr::first([2 => "c", 0 => "a", 1 => "b"])', fn () => Arr::first(e0Base()));
probe('arr-first-out-of-order-callback', "Arr::first(base, fn (\$v) => \$v !== 'c')", fn () => Arr::first(e0Base(), fn ($v) => $v !== 'c'));
probe('arr-first-out-of-order-key-order', '$keys seen by Arr::first(base, $cb returning false)', function () {
    $seen = [];
    Arr::first(e0Base(), function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return false;
    });

    return $seen;
});

probe('first-out-of-order', "Arr::first([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => Arr::first(OUT_OF_ORDER));
probe('first-mixed', "Arr::first(['x' => 1, 0 => 2, 'y' => 3])", fn () => Arr::first(MIXED));
probe('first-out-of-order-callback', "Arr::first([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => \$v !== 'a')", fn () => Arr::first(OUT_OF_ORDER, fn ($v) => $v !== 'a'));
probe('first-out-of-order-callback-order', "Arr::first([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::first(OUT_OF_ORDER, $cb), false));

// PHP's array key casts: 1 and '1' are one key (first position, last value), true is 1,
// null is '' and 1.5 is 1. The array literals are written as a PHP user would write them.
probe('first-collision', "Arr::first([1 => 'a', '1' => 'b'])", fn () => Arr::first([1 => 'a', '1' => 'b']));
probe('first-true-key-collision', "Arr::first([1 => 'a', true => 'b'])", fn () => Arr::first([1 => 'a', true => 'b']));

// ==== laravel/framework#61957: a Traversable is walked as it goes, so the read stops at the first match ====
probe('first-traversable-stops-at-the-match', 'Arr::first(generator 1..100, fn ($v) => $v === 2) and the items read', function () {
    $read = [];
    $result = Arr::first(countedGenerator(100, $read), fn ($v) => $v === 2);

    return [$result, count($read)];
});
probe('first-traversable-no-match-reads-all', "Arr::first(generator 1..100, fn () => false, 'none') and the items read", function () {
    $read = [];
    $result = Arr::first(countedGenerator(100, $read), fn () => false, 'none');

    return [$result, count($read)];
});
probe('first-traversable-without-callback-reads-one', 'Arr::first(generator 1..100) and the items read', function () {
    $read = [];
    $result = Arr::first(countedGenerator(100, $read));

    return [$result, count($read)];
});
probe('first-lazy-collection-stops-at-the-match', 'Arr::first(LazyCollection::times(100)->tapEach(count), fn ($v) => $v === 2)', function () {
    $n = 0;
    $result = Arr::first(LazyCollection::times(100)->tapEach(function () use (&$n) {
        $n++;
    }), fn ($v) => $v === 2);

    return [$result, $n];
});
probe('first-traversable-empty', "Arr::first(empty generator, fn () => true, 'none')", fn () => Arr::first((function () {
    yield from [];
})(), fn () => true, 'none'));
probe('first-traversable-closure-default', "Arr::first(generator, fn () => false, fn () => 'lazy')", fn () => Arr::first(traversable(), fn () => false, fn () => 'lazy'));
$products = fn () => (function () {
    yield from ['Laptop', 'Monitor'];
    yield from ['Keyboard', 'Mouse'];
})();
probe('first-yield-from', "Arr::first(yield from ['Laptop', 'Monitor'], ['Keyboard', 'Mouse'], fn (\$p) => \$p === 'Laptop')", fn () => Arr::first($products(), fn ($p) => $p === 'Laptop'));
probe('first-yield-from-keys', "keys seen by Arr::first(yield from ['Laptop', 'Monitor'], ['Keyboard', 'Mouse'], fn () => false)", fn () => keysSeen(fn ($cb) => Arr::first($products(), $cb), false));
probe('first-traversable-keys', 'keys seen by Arr::first(generator yielding 10, 20, 30, fn () => false)', fn () => keysSeen(fn ($cb) => Arr::first((function () {
    yield 10;
    yield 20;
    yield 30;
})(), $cb), false));
probe('first-traversable-php-truthiness', "Arr::first(generator 1, 2, 3, fn (\$v) => \$v === 1 ? '0' : 'yes')", fn () => Arr::first((function () {
    yield 1;
    yield 2;
    yield 3;
})(), fn ($v) => $v === 1 ? '0' : 'yes'));
probe('first-collection-keys', "keys seen by Arr::first(collect(['x' => 1, 'y' => 2]), fn () => false)", fn () => keysSeen(fn ($cb) => Arr::first(new Collection(['x' => 1, 'y' => 2]), $cb), false));
probe('first-collection-callback', "Arr::first(collect(['x' => 1, 'y' => 2]), fn (\$v) => \$v > 1)", fn () => Arr::first(new Collection(['x' => 1, 'y' => 2]), fn ($v) => $v > 1));
$oneTwoThree = fn () => (function () {
    yield 1;
    yield 2;
    yield 3;
})();
probe('first-generator-after-a-match', 'Arr::first($gen, fn ($v) => $v === 2), then $gen->current() and $gen->valid()', function () use ($oneTwoThree) {
    $gen = $oneTwoThree();
    $result = Arr::first($gen, fn ($v) => $v === 2);

    return [$result, $gen->current(), $gen->valid()];
});
probe('first-generator-rewalked-after-a-match', 'foreach over $gen after Arr::first($gen, fn ($v) => $v === 2)', function () use ($oneTwoThree) {
    $gen = $oneTwoThree();
    Arr::first($gen, fn ($v) => $v === 2);
    $rest = [];

    foreach ($gen as $v) {
        $rest[] = $v;
    }

    return $rest;
});
probe('first-array-stops-at-the-match', 'calls made by Arr::first([1, 2, 3], fn ($v) => $v === 2)', function () {
    $calls = 0;
    Arr::first([1, 2, 3], function ($v) use (&$calls) {
        $calls++;

        return $v === 2;
    });

    return $calls;
});
probe('first-assoc-stops-at-the-match', "calls made by Arr::first(['a' => 1, 'b' => 2, 'c' => 3], fn (\$v) => \$v === 2)", function () {
    $calls = 0;
    Arr::first(['a' => 1, 'b' => 2, 'c' => 3], function ($v) use (&$calls) {
        $calls++;

        return $v === 2;
    });

    return $calls;
});
probe('first-scalar-callback', "Arr::first('abc', fn () => true)", fn () => Arr::first('abc', fn () => true));

probe('first-collection-no-callback', "Arr::first(collect(['x' => 1, 'y' => 2]))", fn () => Arr::first(new Collection(['x' => 1, 'y' => 2])));
probe('first-assoc-keys', "keys seen by Arr::first(['a' => 1, 'b' => 2], fn () => false)", fn () => keysSeen(fn ($cb) => Arr::first(['a' => 1, 'b' => 2], $cb), false));
probe('first-collection-list', 'Arr::first(collect([10, 20]))', fn () => Arr::first(new Collection([10, 20])));
probe('first-collection-list-callback', "Arr::first(collect([10, 20]), fn (\$v) => \$v > 10)", fn () => Arr::first(new Collection([10, 20]), fn ($v) => $v > 10));
probe('first-collection-list-keys', 'keys seen by Arr::first(collect([10, 20]), fn () => false)', fn () => keysSeen(fn ($cb) => Arr::first(new Collection([10, 20]), $cb), false));

emit();
