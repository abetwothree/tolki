<?php

/**
 * Ground truth for Collection::pop().
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

probe('pop() on an assoc collection', '(new Collection(["x"=>1,"y"=>2,"z"=>3]))->pop()', function () {
    $c = new Collection(['x' => 1, 'y' => 2, 'z' => 3]);
    $popped = $c->pop();

    return ['returned' => $popped, 'remaining' => $c->all()];
});

probe('pop(2) — reverse order, source keys kept', '(new Collection([...]))->pop(2)', function () {
    $c = new Collection(['x' => 1, 'y' => 2, 'z' => 3]);
    $popped = $c->pop(2);

    return ['returned' => $popped->all(), 'remaining' => $c->all()];
});

probe('pop(0) — count < 1', '(new Collection(["x"=>1]))->pop(0)', function () {
    $c = new Collection(['x' => 1]);

    return ['returned' => $c->pop(0)->all(), 'remaining' => $c->all()];
});

probe('X1 pop mutates and returns the last value', 'collect([10,20,30,40])->pop()', function () {
    $c = new Collection(nums());
    $one = $c->pop();
    $d = new Collection(nums());
    $two = $d->pop(2);

    return ['pop' => $one, 'after' => $c->all(), 'pop2' => $two->all(), 'after2' => $d->all()];
});
probe('D8 pop(2) on assoc returns list', '$c = new Collection([\'a\' => 1, \'b\' => 2, \'c\' => 3]); [\'returned\' => $c->pop(2)->all(), \'remaining\' => $c->all()]', function () {
    $c = new Collection(['a' => 1, 'b' => 2, 'c' => 3]);
    return ['returned' => $c->pop(2)->all(), 'remaining' => $c->all()];
});
probe('P1 pop on assoc', '$c = new Collection([\'foo\' => \'f\', \'bar\' => \'b\']); [\'popped\' => $c->pop(), \'first\' => $c->first(), \'all\' => $c->all()]', function () {
    $c = new Collection(['foo' => 'f', 'bar' => 'b']);
    return ['popped' => $c->pop(), 'first' => $c->first(), 'all' => $c->all()];
});
probe('P2 pop(2)/pop(6) on assoc', '$c = new Collection([\'foo\' => \'f\', \'bar\' => \'b\', \'baz\' => \'z\']); [\'two\' => $c->pop(2)->all(), \'first\' => $c->first(), \'six\' => (new Collection([\'foo\' => \'f\', \'bar\' => \'b\', \'baz\' => \'z\']))->pop(6)->all()]', function () {
    $c = new Collection(['foo' => 'f', 'bar' => 'b', 'baz' => 'z']);
    $two = $c->pop(2)->all();
    $first = $c->first();
    $six = (new Collection(['foo' => 'f', 'bar' => 'b', 'baz' => 'z']))->pop(6)->all();
    return ['two' => $two, 'first' => $first, 'six' => $six];
});

// CollectionTest::testPopReturnsAndRemovesLastXItemsInCollection — the list-backed half;
// the assoc-backed half is already "P2 pop(2)/pop(6) on assoc" earlier in this file.
probe('pop-list-count-exceeds-length', "(new Collection(['foo','bar','baz']))->pop(2) then a fresh pop(6)", function () {
    $c = new Collection(['foo', 'bar', 'baz']);
    $two = $c->pop(2)->all();
    $first = $c->first();
    $six = (new Collection(['foo', 'bar', 'baz']))->pop(6)->all();

    return ['two' => $two, 'first' => $first, 'six' => $six];
});

// Popping from an already-empty backing with the default count. Count > 1 on an empty
// backing is already "D6 shift/pop on collect(null)" (pop3 => []) in docs/php-parity/Collection/shift.json.
probe('pop-empty-default-count', "(new Collection([]))->pop()", fn () => (new Collection([]))->pop());
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
probe('order-pop-then-push', "\$c = collect(base); \$c->pop(); \$c->push('x')", function () {
    $c = collect(d8Base());
    $c->pop();
    $c->push('x');

    return d8Views($c);
});

mutation('pop-out-of-order', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->pop()", OUT_OF_ORDER, fn (Collection $c) => $c->pop());
mutation('pop-out-of-order-count-2', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->pop(2)", OUT_OF_ORDER, fn (Collection $c) => $c->pop(2));
mutation('pop-mixed', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->pop()", MIXED, fn (Collection $c) => $c->pop());
mutation('pop-mixed-count-2', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->pop(2)", MIXED, fn (Collection $c) => $c->pop(2));
mutation('pop-collision', "\$c = new Collection([1 => 'a', 'x' => 'b', '1' => 'c']); \$c->pop()", [1 => 'a', 'x' => 'b', '1' => 'c'], fn (Collection $c) => $c->pop());
mutation('pop-collision-three-times', "\$c = new Collection([1 => 'a', 'x' => 'b', '1' => 'c']); [\$c->pop(), \$c->pop(), \$c->pop()]", [1 => 'a', 'x' => 'b', '1' => 'c'], fn (Collection $c) => [$c->pop(), $c->pop(), $c->pop()]);

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];
probe('C32-B-pop-one-on-list-returns-value', "\$c = collect([1, 2, 3]); \$c->pop(1)", function () { $c = collect([1, 2, 3]); return ['returned' => $c->pop(1), 'all' => $c->all()]; });

emit();
