<?php

/**
 * Ground truth for docs/superpowers/plans/<date>-tolki-data-release-readiness.md (Task D8).
 *
 * Two concerns:
 *  1. What `Collection` does with a plain object that merely HAS a `toArray` member
 *     (PHP asks `instanceof Arrayable`; a stdClass with a Closure property is not one).
 *  2. The ORDER every mutator leaves behind on a backing whose integer keys are out of
 *     ascending order — the PHP array `[2 => 'c', 0 => 'a', 1 => 'b']`, which JavaScript
 *     can only express as `new Map([[2, "c"], [0, "a"], [1, "b"]])` because a plain
 *     object always iterates integer keys ascending.
 *
 * Every mutator row records all three views — `all()`, `values()` and `keys()` — because
 * asserting only `all()` is what let the stale-order defect survive several releases.
 * Run: pnpm php:parity
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Collection;

/** The out-of-order backing every order probe below starts from. */
function d8Base(): array
{
    return [2 => 'c', 0 => 'a', 1 => 'b'];
}

/** Capture the three views a Collection exposes, in one row. */
function d8Views(Collection $collection): array
{
    return [
        'all' => $collection->all(),
        'values' => $collection->values()->all(),
        'keys' => $collection->keys()->all(),
    ];
}

/** A real Arrayable: the interface PHP's `getArrayableItems` actually tests for. */
class D8Arrayable implements Arrayable
{
    public function toArray(): array
    {
        return [4, 5, 6];
    }
}

// ==== F-21: a plain object is not an Arrayable, whatever members it carries ====
// A Closure cannot be json_encode()d, so these rows record the KEYS the cast keeps
// plus the scalar members; the point is that the keys survive at all.
probe(
    'plain-object-toArray-member-keeps-its-keys',
    "collect((object) ['toArray' => fn () => [9], 'b' => 2])->keys()->all()",
    fn () => collect((object) ['toArray' => fn () => [9], 'b' => 2])->keys()->all(),
);
probe(
    'plain-object-toArray-member-union-keeps-its-keys',
    "collect((object) ['toArray' => fn () => [9], 'b' => 2])->union(['c' => 3])->keys()->all()",
    fn () => collect((object) ['toArray' => fn () => [9], 'b' => 2])->union(['c' => 3])->keys()->all(),
);
probe(
    'plain-object-toArray-member-union-keeps-its-values',
    "array_diff_key(collect((object) ['toArray' => fn () => [9], 'b' => 2])->union(['c' => 3])->all(), ['toArray' => null])",
    fn () => array_diff_key(
        collect((object) ['toArray' => fn () => [9], 'b' => 2])->union(['c' => 3])->all(),
        ['toArray' => null],
    ),
);
probe(
    'real-arrayable-unwraps-through-toArray',
    'collect(new D8Arrayable)->all()',
    fn () => collect(new D8Arrayable)->all(),
);

// ==== F-25: the order each mutator leaves on [2 => 'c', 0 => 'a', 1 => 'b'] ====
probe('order-initial', "collect([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => d8Views(collect(d8Base())));

probe('order-shift', '$c = collect(base); $returned = $c->shift()', function () {
    $c = collect(d8Base());
    $returned = $c->shift();

    return ['returned' => $returned] + d8Views($c);
});
probe('order-shift-two', '$c = collect(base); $returned = $c->shift(2)', function () {
    $c = collect(d8Base());
    $returned = $c->shift(2);

    return ['returned' => $returned->all()] + d8Views($c);
});
probe('order-pop', '$c = collect(base); $returned = $c->pop()', function () {
    $c = collect(d8Base());
    $returned = $c->pop();

    return ['returned' => $returned] + d8Views($c);
});
probe('order-pop-two', '$c = collect(base); $returned = $c->pop(2)', function () {
    $c = collect(d8Base());
    $returned = $c->pop(2);

    return ['returned' => $returned->all()] + d8Views($c);
});
probe('order-shift-past-the-end', '$c = collect(base); $returned = $c->shift(5)', function () {
    $c = collect(d8Base());
    $returned = $c->shift(5);

    return ['returned' => $returned->all()] + d8Views($c);
});
probe('order-pop-past-the-end', '$c = collect(base); $returned = $c->pop(5)', function () {
    $c = collect(d8Base());
    $returned = $c->pop(5);

    return ['returned' => $returned->all()] + d8Views($c);
});
probe('order-pop-after-emptying', '$c = collect(base); $c->shift(3); $returned = $c->pop()', function () {
    $c = collect(d8Base());
    $c->shift(3);
    $returned = $c->pop();

    return ['returned' => $returned] + d8Views($c);
});
probe('order-push', "\$c = collect(base); \$c->push('x')", function () {
    $c = collect(d8Base());
    $c->push('x');

    return d8Views($c);
});
probe('order-pop-then-push', "\$c = collect(base); \$c->pop(); \$c->push('x')", function () {
    $c = collect(d8Base());
    $c->pop();
    $c->push('x');

    return d8Views($c);
});
probe('order-prepend', "\$c = collect(base); \$c->prepend('x')", function () {
    $c = collect(d8Base());
    $c->prepend('x');

    return d8Views($c);
});
probe('order-prepend-with-key', "\$c = collect(base); \$c->prepend('x', 'k')", function () {
    $c = collect(d8Base());
    $c->prepend('x', 'k');

    return d8Views($c);
});
probe('order-prepend-with-null-key', "\$c = collect(base); \$c->prepend('x', null)", function () {
    $c = collect(d8Base());
    $c->prepend('x', null);

    return d8Views($c);
});
probe('order-prepend-with-existing-key', "\$c = collect(base); \$c->prepend('x', 1)", function () {
    $c = collect(d8Base());
    $c->prepend('x', 1);

    return d8Views($c);
});
probe('order-unshift', "\$c = collect(base); \$c->unshift('x', 'y')", function () {
    $c = collect(d8Base());
    $c->unshift('x', 'y');

    return d8Views($c);
});
probe('order-splice', '$c = collect(base); $returned = $c->splice(1, 1)', function () {
    $c = collect(d8Base());
    $returned = $c->splice(1, 1);

    return ['returned' => $returned->all()] + d8Views($c);
});
probe('order-splice-with-replacement', "\$c = collect(base); \$returned = \$c->splice(1, 1, ['z'])", function () {
    $c = collect(d8Base());
    $returned = $c->splice(1, 1, ['z']);

    return ['returned' => $returned->all()] + d8Views($c);
});
probe('order-splice-two-from-start', '$c = collect(base); $returned = $c->splice(0, 2)', function () {
    $c = collect(d8Base());
    $returned = $c->splice(0, 2);

    return ['returned' => $returned->all()] + d8Views($c);
});
probe('order-splice-to-end', '$c = collect(base); $returned = $c->splice(1)', function () {
    $c = collect(d8Base());
    $returned = $c->splice(1);

    return ['returned' => $returned->all()] + d8Views($c);
});
probe('order-splice-negative-offset', '$c = collect(base); $returned = $c->splice(-2, 1)', function () {
    $c = collect(d8Base());
    $returned = $c->splice(-2, 1);

    return ['returned' => $returned->all()] + d8Views($c);
});
probe('order-splice-negative-length', '$c = collect(base); $returned = $c->splice(1, -1)', function () {
    $c = collect(d8Base());
    $returned = $c->splice(1, -1);

    return ['returned' => $returned->all()] + d8Views($c);
});
probe('order-pad', "collect(base)->pad(5, 'z')", fn () => d8Views(collect(d8Base())->pad(5, 'z')));
probe('order-pad-negative', "collect(base)->pad(-5, 'z')", fn () => d8Views(collect(d8Base())->pad(-5, 'z')));
probe('order-pad-no-padding', "collect(base)->pad(2, 'z')", fn () => d8Views(collect(d8Base())->pad(2, 'z')));
probe('order-pad-does-not-mutate', "\$c = collect(base); \$c->pad(5, 'z'); \$c", function () {
    $c = collect(d8Base());
    $c->pad(5, 'z');

    return d8Views($c);
});
probe('order-forget', '$c = collect(base); $c->forget(0)', function () {
    $c = collect(d8Base());
    $c->forget(0);

    return d8Views($c);
});
probe('order-forget-many', '$c = collect(base); $c->forget([0, 1])', function () {
    $c = collect(d8Base());
    $c->forget([0, 1]);

    return d8Views($c);
});
probe('order-offsetUnset', '$c = collect(base); $c->offsetUnset(0)', function () {
    $c = collect(d8Base());
    $c->offsetUnset(0);

    return d8Views($c);
});
probe('order-transform', '$c = collect(base); $c->transform(fn ($v) => strtoupper($v))', function () {
    $c = collect(d8Base());
    $c->transform(fn ($v) => strtoupper($v));

    return d8Views($c);
});
probe('order-transform-callback-key-order', '$c = collect(base); $c->transform(recording $key)', function () {
    $seen = [];
    $c = collect(d8Base());
    $c->transform(function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return $value;
    });

    return $seen;
});
probe('order-put', "\$c = collect(base); \$c->put('k', 'z')", function () {
    $c = collect(d8Base());
    $c->put('k', 'z');

    return d8Views($c);
});
probe('order-put-existing-key', "\$c = collect(base); \$c->put(0, 'z')", function () {
    $c = collect(d8Base());
    $c->put(0, 'z');

    return d8Views($c);
});
probe('order-offsetSet-null-key', "\$c = collect(base); \$c->offsetSet(null, 'z')", function () {
    $c = collect(d8Base());
    $c->offsetSet(null, 'z');

    return d8Views($c);
});
probe('order-sort', 'collect(base)->sort()', fn () => d8Views(collect(d8Base())->sort()));
probe('order-sortKeys', 'collect(base)->sortKeys()', fn () => d8Views(collect(d8Base())->sortKeys()));
probe('order-sort-does-not-mutate', '$c = collect(base); $c->sort(); $c', function () {
    $c = collect(d8Base());
    $c->sort();

    return d8Views($c);
});

// ==== the same order questions with a string key in the middle, which several of these
// ==== renumber around: array_shift/array_splice/array_pad keep a string key, renumber the rest.
probe('order-mixed-shift', "\$c = collect([2 => 'c', 'x' => 'a', 1 => 'b']); \$returned = \$c->shift()", function () {
    $c = collect([2 => 'c', 'x' => 'a', 1 => 'b']);
    $returned = $c->shift();

    return ['returned' => $returned] + d8Views($c);
});
probe('order-mixed-pad', "collect([2 => 'c', 'x' => 'a', 1 => 'b'])->pad(5, 'p')", fn () => d8Views(
    collect([2 => 'c', 'x' => 'a', 1 => 'b'])->pad(5, 'p'),
));

emit();
