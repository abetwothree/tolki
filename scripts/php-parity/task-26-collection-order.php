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
// The same question one level down: a set operation's OPERAND. PHP never calls the
// member, so the Closure stays a value and array_intersect's string cast kills it.
probe(
    'plain-object-toArray-member-as-an-operand-is-never-unwrapped',
    "collect(['b' => 2, 'c' => 3])->intersect((object) ['toArray' => fn () => [9], 'b' => 2])",
    fn () => collect(['b' => 2, 'c' => 3])->intersect((object) ['toArray' => fn () => [9], 'b' => 2])->all(),
);

// ==== F-15: Collection's key lookups are a literal array_key_exists, never a dot path.
// ==== Recorded so the JS extension is documented against ground truth, not settled here.
probe('get-dot-path-is-a-literal-key', "collect(['a' => ['b' => 1]])->get('a.b', 'fallback')", fn () => collect(['a' => ['b' => 1]])->get('a.b', 'fallback'));
probe('has-dot-path-is-a-literal-key', "collect(['a' => ['b' => 1]])->has('a.b')", fn () => collect(['a' => ['b' => 1]])->has('a.b'));
probe('getOrPut-dot-path-is-a-literal-key', "\$c = collect(['a' => ['b' => 1]]); \$returned = \$c->getOrPut('a.b', 9)", function () {
    $c = collect(['a' => ['b' => 1]]);
    $returned = $c->getOrPut('a.b', 9);

    return ['returned' => $returned, 'all' => $c->all()];
});

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

// ==== F-25 Stage 2: the POSITIONAL READERS, which answer by insertion order, not by key ====
probe('order-first', 'collect(base)->first()', fn () => collect(d8Base())->first());
probe('order-last', 'collect(base)->last()', fn () => collect(d8Base())->last());
probe('order-first-callback', "collect(base)->first(fn (\$v) => \$v !== 'c')", fn () => collect(d8Base())->first(fn ($v) => $v !== 'c'));
probe('order-last-callback', "collect(base)->last(fn (\$v) => \$v !== 'b')", fn () => collect(d8Base())->last(fn ($v) => $v !== 'b'));
probe('order-first-callback-key-order', '$c = collect(base); $c->first(recording $key)', function () {
    $seen = [];
    collect(d8Base())->first(function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return false;
    });

    return $seen;
});
probe('order-first-no-match-default', "collect(base)->first(fn (\$v) => false, 'fallback')", fn () => collect(d8Base())->first(fn ($v) => false, 'fallback'));
probe('order-last-no-match-default', "collect(base)->last(fn (\$v) => false, 'fallback')", fn () => collect(d8Base())->last(fn ($v) => false, 'fallback'));
probe('order-slice', 'collect(base)->slice(1)', fn () => d8Views(collect(d8Base())->slice(1)));
probe('order-slice-with-length', 'collect(base)->slice(1, 1)', fn () => d8Views(collect(d8Base())->slice(1, 1)));
probe('order-slice-negative-offset', 'collect(base)->slice(-2)', fn () => d8Views(collect(d8Base())->slice(-2)));
probe('order-slice-negative-length', 'collect(base)->slice(1, -1)', fn () => d8Views(collect(d8Base())->slice(1, -1)));
probe('order-slice-offset-past-the-start', 'collect(base)->slice(-5, 1)', fn () => d8Views(collect(d8Base())->slice(-5, 1)));
probe('order-slice-does-not-mutate', '$c = collect(base); $c->slice(1); $c', function () {
    $c = collect(d8Base());
    $c->slice(1);

    return d8Views($c);
});
probe('order-skip', 'collect(base)->skip(1)', fn () => d8Views(collect(d8Base())->skip(1)));
probe('order-take', 'collect(base)->take(2)', fn () => d8Views(collect(d8Base())->take(2)));
probe('order-take-negative', 'collect(base)->take(-2)', fn () => d8Views(collect(d8Base())->take(-2)));
probe('order-mixed-slice', "collect([2 => 'c', 'x' => 'a', 1 => 'b'])->slice(1)", fn () => d8Views(
    collect([2 => 'c', 'x' => 'a', 1 => 'b'])->slice(1),
));

// ==== A read-only operation leaves the RECEIVER exactly as it found it, whatever the operand ====
probe('order-union-leaves-the-receiver-alone', "\$c = collect([1, 2, 3]); \$c->union([7 => 'x', 3 => 'y']); \$c", function () {
    $c = collect([1, 2, 3]);
    $c->union([7 => 'x', 3 => 'y']);

    return d8Views($c);
});
probe('order-diff-leaves-the-receiver-alone', "\$c = collect([1, 2, 3]); \$c->diff([7 => 'x', 3 => 'y']); \$c", function () {
    $c = collect([1, 2, 3]);
    $c->diff([7 => 'x', 3 => 'y']);

    return d8Views($c);
});
probe('order-union-result', "collect([1, 2, 3])->union([7 => 'x', 3 => 'y'])", fn () => d8Views(
    collect([1, 2, 3])->union([7 => 'x', 3 => 'y']),
));

// ==== `add`/`offsetSet(null)` append where PHP's `$array[] =` does: past the highest integer key ====
probe('append-key-past-the-highest-integer-key', "\$c = collect([5 => 'a']); \$c->add('z')", function () {
    $c = collect([5 => 'a']);
    $c->add('z');

    return d8Views($c);
});
probe('append-key-skips-an-occupied-slot', "\$c = collect(['x' => 1, 3 => 'b', 'y' => 2]); \$c->add('z')", function () {
    $c = collect(['x' => 1, 3 => 'b', 'y' => 2]);
    $c->add('z');

    return d8Views($c);
});
probe('append-key-with-no-integer-key-is-zero', "\$c = collect(['a' => 1]); \$c->add('z')", function () {
    $c = collect(['a' => 1]);
    $c->add('z');

    return d8Views($c);
});
probe('append-key-on-an-empty-collection-is-zero', "\$c = collect([]); \$c->add('z')", function () {
    $c = collect([]);
    $c->add('z');

    return d8Views($c);
});
probe('append-key-on-the-out-of-order-base', "\$c = collect(base); \$c->add('z')", function () {
    $c = collect(d8Base());
    $c->add('z');

    return d8Views($c);
});
probe('append-key-twice-keeps-counting-up', "\$c = collect([5 => 'a']); \$c->add('y'); \$c->add('z')", function () {
    $c = collect([5 => 'a']);
    $c->add('y');
    $c->add('z');

    return d8Views($c);
});
probe('append-key-offsetSet-null-matches-add', "\$c = collect([5 => 'a']); \$c->offsetSet(null, 'z')", function () {
    $c = collect([5 => 'a']);
    $c->offsetSet(null, 'z');

    return d8Views($c);
});
// PHP 8.3+ counts on from a negative key too; the JS port floors the next key at 0 (see `add`).
probe('append-key-after-a-negative-key', "\$c = collect([-3 => 'a']); \$c->add('z')", function () {
    $c = collect([-3 => 'a']);
    $c->add('z');

    return d8Views($c);
});

// ==== the two writers D8's mutator sweep did not reach ====
probe('order-pull', '$c = collect(base); $returned = $c->pull(0)', function () {
    $c = collect(d8Base());
    $returned = $c->pull(0);

    return ['returned' => $returned] + d8Views($c);
});
// PHP has no Collection::set; ArrayAccess is the nearest analogue of the JS extension.
probe('order-array-set-new-key', "\$c = collect(base); \$c['k'] = 'z'", function () {
    $c = collect(d8Base());
    $c['k'] = 'z';

    return d8Views($c);
});
probe('order-array-set-existing-key', "\$c = collect(base); \$c[0] = 'z'", function () {
    $c = collect(d8Base());
    $c[0] = 'z';

    return d8Views($c);
});

emit();
