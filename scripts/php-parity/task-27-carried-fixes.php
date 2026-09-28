<?php

/**
 * Ground truth for the two carried fixes of the data release-readiness batch.
 *
 * Two concerns:
 *  1. `Collection::concat` and `Collection::join` build `new static($this->items)`. A PHP
 *     array is a value, so that copy cannot reach back into the receiver; the JS port
 *     aliases the backing instead, so `push`/`pop` on the copy wrote the original.
 *  2. The positional readers on a backing whose integer keys are out of ascending order —
 *     the PHP array `[2 => 'c', 0 => 'a', 1 => 'b']`, which JavaScript can only express as
 *     `new Map([[2, "c"], [0, "a"], [1, "b"]])` because a plain object always iterates
 *     integer keys ascending.
 *
 * Run: pnpm php:parity
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

/** The out-of-order backing every order probe below starts from. */
function e0Base(): array
{
    return [2 => 'c', 0 => 'a', 1 => 'b'];
}

/** Capture the three views a Collection exposes, in one row. */
function e0Views(Collection $collection): array
{
    return [
        'all' => $collection->all(),
        'values' => $collection->values()->all(),
        'keys' => $collection->keys()->all(),
    ];
}

// ==== concat returns a new collection and leaves the receiver exactly as it found it ====
probe('concat-list-leaves-the-receiver-alone', "\$c = collect([1, 2, 3]); \$c->concat(['z']); \$c", function () {
    $c = collect([1, 2, 3]);
    $c->concat(['z']);

    return e0Views($c);
});
probe('concat-list-result', "collect([1, 2, 3])->concat(['z'])", fn () => e0Views(collect([1, 2, 3])->concat(['z'])));
probe('concat-keyed-leaves-the-receiver-alone', "\$c = collect(['a' => 1, 'b' => 2]); \$c->concat(['z']); \$c", function () {
    $c = collect(['a' => 1, 'b' => 2]);
    $c->concat(['z']);

    return e0Views($c);
});
probe('concat-keyed-result', "collect(['a' => 1, 'b' => 2])->concat(['z'])", fn () => e0Views(collect(['a' => 1, 'b' => 2])->concat(['z'])));
probe('concat-out-of-order-leaves-the-receiver-alone', "\$c = collect(base); \$c->concat(['z']); \$c", function () {
    $c = collect(e0Base());
    $c->concat(['z']);

    return e0Views($c);
});
probe('concat-out-of-order-result', "collect(base)->concat(['z'])", fn () => e0Views(collect(e0Base())->concat(['z'])));
probe('concat-collection-operand-result', "collect([1, 2])->concat(collect(['x' => 'z']))", fn () => e0Views(
    collect([1, 2])->concat(collect(['x' => 'z'])),
));

// ==== join returns a string and leaves the receiver exactly as it found it ====
probe('join-list-leaves-the-receiver-alone', "\$c = collect([1, 2, 3]); \$c->join(', ', ' and '); \$c", function () {
    $c = collect([1, 2, 3]);
    $c->join(', ', ' and ');

    return e0Views($c);
});
probe('join-keyed-leaves-the-receiver-alone', "\$c = collect(['a' => 1, 'b' => 2]); \$c->join(', ', ' and '); \$c", function () {
    $c = collect(['a' => 1, 'b' => 2]);
    $c->join(', ', ' and ');

    return e0Views($c);
});
probe('join-out-of-order-leaves-the-receiver-alone', "\$c = collect(base); \$c->join(', ', ' and '); \$c", function () {
    $c = collect(e0Base());
    $c->join(', ', ' and ');

    return e0Views($c);
});
probe('join-list-result', "collect([1, 2, 3])->join(', ', ' and ')", fn () => collect([1, 2, 3])->join(', ', ' and '));
probe('join-keyed-result', "collect(['a' => 1, 'b' => 2])->join(', ', ' and ')", fn () => collect(['a' => 1, 'b' => 2])->join(', ', ' and '));
probe('join-single-entry-result', "collect(['a' => 1])->join(', ', ' and ')", fn () => collect(['a' => 1])->join(', ', ' and '));
probe('join-empty-result', "collect([])->join(', ', ' and ')", fn () => collect([])->join(', ', ' and '));

// ==== join and implode answer in INSERTION order, which is not the ascending key order ====
probe('join-out-of-order-result', "collect(base)->join(', ', ' and ')", fn () => collect(e0Base())->join(', ', ' and '));
probe('join-out-of-order-no-final-glue', "collect(base)->join(', ')", fn () => collect(e0Base())->join(', '));
probe('implode-out-of-order', "collect(base)->implode('-')", fn () => collect(e0Base())->implode('-'));
probe('implode-out-of-order-pluck', "collect([2 => ['n' => 'c'], 0 => ['n' => 'a']])->implode('n', '-')", fn () => collect([
    2 => ['n' => 'c'],
    0 => ['n' => 'a'],
])->implode('n', '-'));
probe('implode-out-of-order-callback', "collect(base)->implode(fn (\$v) => strtoupper(\$v), '-')", fn () => collect(e0Base())->implode(fn ($v) => strtoupper($v), '-'));

// ==== Arr::first / Arr::last read the same insertion order, which is what dataFirst/dataLast port ====
probe('arr-first-out-of-order', 'Arr::first([2 => "c", 0 => "a", 1 => "b"])', fn () => Arr::first(e0Base()));
probe('arr-last-out-of-order', 'Arr::last([2 => "c", 0 => "a", 1 => "b"])', fn () => Arr::last(e0Base()));
probe('arr-first-out-of-order-callback', "Arr::first(base, fn (\$v) => \$v !== 'c')", fn () => Arr::first(e0Base(), fn ($v) => $v !== 'c'));
probe('arr-last-out-of-order-callback', "Arr::last(base, fn (\$v) => \$v !== 'b')", fn () => Arr::last(e0Base(), fn ($v) => $v !== 'b'));
probe('arr-first-out-of-order-key-order', '$keys seen by Arr::first(base, $cb returning false)', function () {
    $seen = [];
    Arr::first(e0Base(), function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return false;
    });

    return $seen;
});
probe('arr-last-out-of-order-key-order', '$keys seen by Arr::last(base, $cb returning false)', function () {
    $seen = [];
    Arr::last(e0Base(), function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return false;
    });

    return $seen;
});

// ==== the same insertion order drives the two predicate readers ====
probe('every-out-of-order-key-order', '$keys seen by collect(base)->every($cb returning true)', function () {
    $seen = [];
    collect(e0Base())->every(function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return true;
    });

    return $seen;
});
probe('contains-out-of-order-key-order', '$keys seen by collect(base)->contains($cb returning false)', function () {
    $seen = [];
    collect(e0Base())->contains(function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return false;
    });

    return $seen;
});
probe('contains-out-of-order-first-match', "collect(base)->contains(fn (\$v, \$k) => true) stops at the first entry", function () {
    $seen = [];
    collect(e0Base())->contains(function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return true;
    });

    return $seen;
});

emit();
