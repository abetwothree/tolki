<?php

/**
 * Ground truth for Collection::splice().
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

probe('splice(1,1) on assoc — keys preserved on BOTH halves', '$c->splice(1,1)', function () {
    $c = new Collection(['x' => 1, 'y' => 2, 'z' => 3]);
    $cut = $c->splice(1, 1);

    return ['remaining' => $c->all(), 'cut' => $cut->all()];
});

probe('splice(1) — one-arg form removes to the end', '$c->splice(1)', function () {
    $c = new Collection(['foo' => 'f', 'baz' => 'z']);
    $cut = $c->splice(1);

    return ['remaining' => $c->all(), 'cut' => $cut->all()];
});

probe('splice with replacement', '$c->splice(1,1,"bar")', function () {
    $c = new Collection(['foo', 'baz']);
    $cut = $c->splice(1, 1, 'bar');

    return ['remaining' => $c->all(), 'cut' => $cut->all()];
});

probe('X6 splice mutates and returns the removed items', 'collect([10,20,30,40])->splice(1,2)', function () {
    $c = new Collection(nums());
    $removed = $c->splice(1, 2);

    return ['removed' => $removed->all(), 'after' => $c->all()];
});

probe('X7 splice one-arg form removes offset to end', 'collect([10,20,30,40])->splice(1)', function () {
    $c = new Collection(nums());
    $removed = $c->splice(1);

    return ['removed' => $removed->all(), 'after' => $c->all()];
});

probe('splice inserts a scalar replacement as one element', 'collect([10,20,30,40])->splice(1,2,99)', function () {
    $c = new Collection([10, 20, 30, 40]);
    $removed = $c->splice(1, 2, 99);

    return ['removed' => $removed->all(), 'remaining' => $c->all()];
});

probe('splice with a scalar replacement on string keys', "collect(['a'=>1,'b'=>2,'c'=>3,'d'=>4])->splice(1,2,99)", function () {
    $c = new Collection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4]);
    $removed = $c->splice(1, 2, 99);

    return ['removed' => $removed->all(), 'remaining' => $c->all()];
});

// B1 — splice with an associative replacement
probe('splice with an assoc replacement on a list', 'collect([1,2,3])->splice(1,1,["foo"=>"bar"])', function () {
    $c = collect([1, 2, 3]);
    $removed = $c->splice(1, 1, ['foo' => 'bar']);
    return ['removed' => $removed->all(), 'after' => $c->all()];
});
probe('S1 splice on assoc with scalar replacement mid', '$c = new Collection([\'a\' => 1, \'b\' => 2, \'c\' => 3]); [\'removed\' => $c->splice(1, 1, \'bar\')->all(), \'after\' => $c->all()]', function () {
    $c = new Collection(['a' => 1, 'b' => 2, 'c' => 3]);
    $removed = $c->splice(1, 1, 'bar');
    return ['removed' => $removed->all(), 'after' => $c->all()];
});
probe('S2 splice assoc insert scalar, length 0', '$c = new Collection([\'foo\' => \'f\', \'baz\' => \'z\']); [\'removed\' => $c->splice(1, 0, \'bar\')->all(), \'after\' => $c->all()]', function () {
    $c = new Collection(['foo' => 'f', 'baz' => 'z']);
    $removed = $c->splice(1, 0, 'bar');
    return ['removed' => $removed->all(), 'after' => $c->all()];
});
probe('S3 splice assoc insert array', '$c = new Collection([\'foo\' => \'f\', \'baz\' => \'z\']); $c->splice(1, 0, [\'bar\']); $c->all()', function () {
    $c = new Collection(['foo' => 'f', 'baz' => 'z']);
    $c->splice(1, 0, ['bar']);
    return $c->all();
});
probe('S4 splice assoc (1,1) no replacement', '$c = new Collection([\'foo\' => \'f\', \'baz\' => \'z\']); [\'removed\' => $c->splice(1, 1)->all(), \'after\' => $c->all()]', function () {
    $c = new Collection(['foo' => 'f', 'baz' => 'z']);
    $removed = $c->splice(1, 1);
    return ['removed' => $removed->all(), 'after' => $c->all()];
});
probe('splice-negative-int-keys', "\$c = new Collection([-1 => 'a', 'x' => 'b', -5 => 'c']); \$c->splice(1, 1, ['z']); and \$d = new Collection(['x' => 'a', -3 => 'b', -7 => 'c']); \$d->splice(0, 3)", function () {
    $one = new Collection([-1 => 'a', 'x' => 'b', -5 => 'c']);
    $removed = $one->splice(1, 1, ['z']);
    $two = new Collection(['x' => 'a', -3 => 'b', -7 => 'c']);
    $removedTwo = $two->splice(0, 3);

    return [
        'replaced' => ['removed' => $removed->all(), 'rest' => $one->all()],
        'emptied' => ['removed' => $removedTwo->all(), 'rest' => $two->all()],
    ];
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

mutation('splice-out-of-order-offset', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->splice(1)", OUT_OF_ORDER, fn (Collection $c) => $c->splice(1));
mutation('splice-out-of-order-offset-length', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->splice(0, 1)", OUT_OF_ORDER, fn (Collection $c) => $c->splice(0, 1));
mutation('splice-out-of-order-replacement', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->splice(1, 1, ['R'])", OUT_OF_ORDER, fn (Collection $c) => $c->splice(1, 1, ['R']));
mutation('splice-mixed-offset-length', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->splice(0, 1)", MIXED, fn (Collection $c) => $c->splice(0, 1));
mutation('splice-mixed-replacement', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->splice(1, 1, ['R'])", MIXED, fn (Collection $c) => $c->splice(1, 1, ['R']));
mutation('splice-string-keys-out-of-order-replacement', "\$c = new Collection(['k' => 'K', 'j' => 'J']); \$c->splice(0, 1, [2 => 'c', 0 => 'a', 1 => 'b'])", ['k' => 'K', 'j' => 'J'], fn (Collection $c) => $c->splice(0, 1, OUT_OF_ORDER));
mutation('splice-collision-offset-length', "\$c = new Collection([1 => 'a', 'x' => 'b', '1' => 'c']); \$c->splice(0, 1)", [1 => 'a', 'x' => 'b', '1' => 'c'], fn (Collection $c) => $c->splice(0, 1));
mutation('splice-out-of-order-replacement-collision', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->splice(1, 1, [1 => 'p', 'x' => 'q', '1' => 'r'])", OUT_OF_ORDER, fn (Collection $c) => $c->splice(1, 1, [1 => 'p', 'x' => 'q', '1' => 'r']));

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];
probe('C32-B-splice-null-length', "\$c = collect([1, 2, 3, 4]); \$c->splice(1, null, ['x'])", function () { $c = collect([1, 2, 3, 4]); $r = $c->splice(1, null, ['x']); return ['returned' => $r->all(), 'all' => $c->all()]; });

// splice: a keyed backing and a replacement, each in the order PHP's array holds it
probe('C32-B-splice-keyed-order', "splice(1, 0, ['p', 'q']) on collect(['a' => 1, 'b' => 2]) and splice(1, 1, ['p']) on collect(['a' => 1, 'b' => 2, 'c' => 3]): keys/values/first and the removed items", fn () => array_map(function (array $call) {
    [$items, $length, $replacement] = $call;
    $c = collect($items);
    $removed = $c->splice(1, $length, $replacement);

    return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'first' => $c->first(), 'removed' => $removed->all()];
}, [[['a' => 1, 'b' => 2], 0, ['p', 'q']], [['a' => 1, 'b' => 2, 'c' => 3], 1, ['p']]]));
probe('C32-B-splice-replacement-order', "splice(1, 0, [2 => 'c', 0 => 'a', 1 => 'b']) on collect(['x', 'y']) and on collect(['a' => 1, 'b' => 2]): keys/values", fn () => array_map(function (array $items) {
    $c = collect($items);
    $c->splice(1, 0, [2 => 'c', 0 => 'a', 1 => 'b']);

    return ['keys' => $c->keys()->all(), 'values' => $c->values()->all()];
}, [['x', 'y'], ['a' => 1, 'b' => 2]]));

emit();
