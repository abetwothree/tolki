<?php

/**
 * Ground truth for Collection::shift().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

probe('shift() on an assoc collection', '(new Collection([...]))->shift()', function () {
    $c = new Collection(['x' => 1, 'y' => 2, 'z' => 3]);
    $shifted = $c->shift();

    return ['returned' => $shifted, 'remaining' => $c->all()];
});

probe('shift(-1) — negative count', '(new Collection(["x"=>1]))->shift(-1)', function () {
    return (new Collection(['x' => 1]))->shift(-1);
});

probe('shift(3) on empty', '(new Collection([]))->shift(3)', function () {
    return (new Collection([]))->shift(3);
});

probe('shift(0) on non-empty', '(new Collection(["x"=>1]))->shift(0)', function () {
    return (new Collection(['x' => 1]))->shift(0)->all();
});

probe('X2 shift mutates and returns the first value', 'collect([10,20,30,40])->shift()', function () {
    $c = new Collection(nums());
    $one = $c->shift();
    $d = new Collection(nums());
    $two = $d->shift(2);

    return ['shift' => $one, 'after' => $c->all(), 'shift2' => $two->all(), 'after2' => $d->all()];
});

probe('X3 shift throws on a negative count', 'collect([10,20,30,40])->shift(-1)', function () {
    return (new Collection(nums()))->shift(-1);
});

probe('X4 shift on empty returns null only for a count of 1', 'collect([])->shift(3)', function () {
    return ['count3' => (new Collection([]))->shift(3), 'count1' => (new Collection([]))->shift()];
});
probe('D6 shift/pop on collect(null)', '[\'shift2\' => (new Collection(null))->shift(2), \'shift1\' => (new Collection(null))->shift(), \'pop3\' => (new Collection(null))->pop(3)->all()]', fn () => [
    'shift2' => (new Collection(null))->shift(2),
    'shift1' => (new Collection(null))->shift(),
    'pop3' => (new Collection(null))->pop(3)->all(),
]);
probe('SH1 shift sequence on assoc', '$c = new Collection([\'first\' => \'Taylor\', \'last\' => \'Otwell\']); [$c->shift(), $c->first(), $c->shift(), $c->first()]', function () {
    $c = new Collection(['first' => 'Taylor', 'last' => 'Otwell']);
    $a = $c->shift(); $f1 = $c->first(); $b = $c->shift(); $f2 = $c->first();
    return [$a, $f1, $b, $f2];
});
probe('SH2 shift(2), shift(6), shift(0) on assoc', '$c = new Collection([\'a\' => \'foo\', \'b\' => \'bar\', \'c\' => \'baz\']); [\'two\' => $c->shift(2)->all(), \'first\' => $c->first(), \'rem\' => $c->all(), \'six\' => (new Collection([\'a\' => \'foo\', \'b\' => \'bar\', \'c\' => \'baz\']))->shift(6)->all(), \'zero\' => $c0->shift(0)->all(), \'after0\' => $c0->all()]', function () {
    $c = new Collection(['a' => 'foo', 'b' => 'bar', 'c' => 'baz']);
    $two = $c->shift(2)->all(); $first = $c->first(); $rem = $c->all();
    $six = (new Collection(['a' => 'foo', 'b' => 'bar', 'c' => 'baz']))->shift(6)->all();
    $c0 = new Collection(['a' => 'foo', 'b' => 'bar', 'c' => 'baz']);
    $zero = $c0->shift(0)->all();
    return ['two' => $two, 'first' => $first, 'rem' => $rem, 'six' => $six, 'zero' => $zero, 'after0' => $c0->all()];
});
probe('SH3 shift(-2) throws', '(new Collection([\'a\' => 1]))->shift(-2)', fn () => (new Collection(['a' => 1]))->shift(-2));
probe('shift-negative-int-keys', "\$c = new Collection(['x' => 'a', -1 => 'b', 'y' => 'c']); \$c->shift(); and \$d = new Collection(['x' => 'a', -1 => 'b', -2 => 'c', 'y' => 'd']); \$d->shift(2)", function () {
    $one = new Collection(['x' => 'a', -1 => 'b', 'y' => 'c']);
    $shifted = $one->shift();
    $two = new Collection(['x' => 'a', -1 => 'b', -2 => 'c', 'y' => 'd']);
    $shiftedTwo = $two->shift(2);

    return [
        'one' => ['shifted' => $shifted, 'rest' => $one->all()],
        'two' => ['shifted' => $shiftedTwo->all(), 'rest' => $two->all()],
    ];
});

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
probe('order-shift-past-the-end', '$c = collect(base); $returned = $c->shift(5)', function () {
    $c = collect(d8Base());
    $returned = $c->shift(5);

    return ['returned' => $returned->all()] + d8Views($c);
});

// ==== the same order questions with a string key in the middle, which several of these
// ==== renumber around: array_shift/array_splice/array_pad keep a string key, renumber the rest.
probe('order-mixed-shift', "\$c = collect([2 => 'c', 'x' => 'a', 1 => 'b']); \$returned = \$c->shift()", function () {
    $c = collect([2 => 'c', 'x' => 'a', 1 => 'b']);
    $returned = $c->shift();

    return ['returned' => $returned] + d8Views($c);
});

mutation('shift-out-of-order', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->shift()", OUT_OF_ORDER, fn (Collection $c) => $c->shift());
mutation('shift-out-of-order-count-2', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->shift(2)", OUT_OF_ORDER, fn (Collection $c) => $c->shift(2));
mutation('shift-mixed', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->shift()", MIXED, fn (Collection $c) => $c->shift());
mutation('shift-mixed-count-2', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->shift(2)", MIXED, fn (Collection $c) => $c->shift(2));
mutation('shift-collision', "\$c = new Collection([1 => 'a', 'x' => 'b', '1' => 'c']); \$c->shift()", [1 => 'a', 'x' => 'b', '1' => 'c'], fn (Collection $c) => $c->shift());
// A count of 0 returns before the items are touched, so the out-of-order keys stay as they are.
mutation('shift-out-of-order-count-0', "\$c = new Collection([2 => 'c', 0 => 'a']); \$c->shift(0)", [2 => 'c', 0 => 'a'], fn (Collection $c) => $c->shift(0));
probe('C32-B-shift-negative-on-empty-throws', "collect([])->shift(-1)", fn () => collect([])->shift(-1));
probe('C32-B-shift-one-on-list-returns-value', "\$c = collect([1, 2, 3]); \$c->shift(1)", function () { $c = collect([1, 2, 3]); return ['returned' => $c->shift(1), 'all' => $c->all()]; });

// shift($count) on an empty collection answers an empty collection unless $count is 1 (laravel/framework#61723).
$counts = ['0' => 0, '1' => 1, '2' => 2, '3' => 3, '0.5' => 0.5, '1.5' => 1.5, '2.5' => 2.5, 'NAN' => NAN, 'INF' => INF];
probe('shift-empty-counts', 'shift() and shift($count) on collect([]) for 0, 1, 2, 3, 0.5, 1.5, 2.5, NAN and INF: what it returns and what is left', fn () => ['none' => shifted([])] + array_map(fn ($count) => shifted([], $count), $counts));
probe('shift-null-backed-counts', 'shift(), shift(0) and shift(2) on new Collection(null)', fn () => ['none' => shifted(null), '0' => shifted(null, 0), '2' => shifted(null, 2)]);
probe('shift-empty-subclass', 'get_class() of shift(2) and shift(0) on an empty subclass of Collection', fn () => ['2' => get_class((new Task33Basket([]))->shift(2)), '0' => get_class((new Task33Basket([]))->shift(0))]);
probe('shift-drained-then-again', '$c = collect([1, 2, 3]); $c->shift(2) three times, then $c->shift()', function () {
    $c = new Collection([1, 2, 3]);

    return [shown($c->shift(2)), shown($c->shift(2)), shown($c->shift(2)), $c->shift()];
});

emit();
