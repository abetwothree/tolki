<?php

/**
 * Ground truth for Collection::unshift().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('X5 unshift mutates and renumbers integer keys', 'collect([10,20,30,40])->unshift(1,2)', function () {
    $c = new Collection(nums());
    $c->unshift(1, 2);

    return $c->all();
});

probe('unshift via Collection', 'collect([10,20,30,40])->unshift(1,2)', function () {
    return collect([10, 20, 30, 40])->unshift(1, 2)->all();
});

// ---- divergences
probe('D1 unshift assoc item onto assoc', '$c = new Collection([\'b\' => 2]); $c->unshift([\'a\' => 1]); $c->all()', function () {
    $c = new Collection(['b' => 2]);
    $c->unshift(['a' => 1]);
    return $c->all();
});
probe('D1b unshift two assoc items onto assoc', '$c = new Collection([\'b\' => 2]); $c->unshift([\'a\' => 1], [\'d\' => \'house\']); $c->all()', function () {
    $c = new Collection(['b' => 2]);
    $c->unshift(['a' => 1], ['d' => 'house']);
    return $c->all();
});
probe('D1c testUnshiftWithOneItem sequence on assoc', '$c = new Collection([\'x\' => 4]); $c->unshift([\'a\', \'b\', \'c\']); $c->unshift([\'who\' => \'Jonny\', \'preposition\' => \'from\', \'where\' => \'Laroe\']); $c->unshift(\'Jonny from Laroe\')->toArray()', function () {
    $c = new Collection(['x' => 4]);
    $c->unshift(['a', 'b', 'c']);
    $c->unshift(['who' => 'Jonny', 'preposition' => 'from', 'where' => 'Laroe']);
    return $c->unshift('Jonny from Laroe')->toArray();
});
probe('D1d unshift spread string-keyed', '$c = new Collection([\'b\' => 2]); $c->unshift(...[\'a\' => 1]); $c->all()', function () {
    $c = new Collection(['b' => 2]);
    $c->unshift(...['a' => 1]);
    return $c->all();
});
probe('D1e unshift int-keyed item overlapping', '$c = new Collection([\'z\' => 3]); $c->unshift([0 => \'zero\'], 9); $c->all()', function () {
    $c = new Collection(['z' => 3]);
    $c->unshift([0 => 'zero'], 9);
    return $c->all();
});
probe('D1f unshift with no items on assoc', '(new Collection([5 => \'a\', \'x\' => \'b\']))->unshift()->all()', function () {
    $c = new Collection([5 => 'a', 'x' => 'b']);
    return $c->unshift()->all();
});

// ==== CollectionTest parity: unshift(null) and callback key types
probe('U1 unshift(null) onto assoc', '$c = new Collection([\'a\' => 1]); $c->unshift(null); $c->all()', function () { $c = new Collection(['a' => 1]); $c->unshift(null); return $c->all(); });
probe('unshift-negative-int-key', "(new Collection([-1 => 'a', 'x' => 'b']))->unshift('z')", fn () => (new Collection([-1 => 'a', 'x' => 'b']))->unshift('z')->all());
probe('unshift-fresh-object-and-null-items', "(new Collection(null))->unshift(['a' => 1], null, 'x')", fn () => (new Collection(null))->unshift(['a' => 1], null, 'x')->all());

// ---- unshift keeps the array's own order, which a Map-built Collection holds separately in JS
probe('unshift-numeric-key-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->unshift('x')", function () {
    $c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']);
    $c->unshift('x');

    return ['all' => $c->all(), 'values' => $c->values()->all(), 'keys' => $c->keys()->all()];
});
probe('unshift-mixed-key-order', "(new Collection([2 => 'c', 'x' => 'v', 0 => 'a']))->unshift('n')", function () {
    $c = new Collection([2 => 'c', 'x' => 'v', 0 => 'a']);
    $c->unshift('n');

    return ['all' => $c->all(), 'values' => $c->values()->all(), 'keys' => $c->keys()->all()];
});
probe('unshift-no-items-numeric-key-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->unshift()", fn () => (new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->unshift()->all());
probe('order-unshift', "\$c = collect(base); \$c->unshift('x', 'y')", function () {
    $c = collect(d8Base());
    $c->unshift('x', 'y');

    return d8Views($c);
});

probe('unshift-out-of-order-returns-same-instance', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->unshift('U') === \$c", function () {
    $c = new Collection(OUT_OF_ORDER);

    return $c->unshift('U') === $c;
});
probe('unshift-out-of-order-after', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->unshift('U'); \$c->all()", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->unshift('U')->all()));
probe('unshift-out-of-order-two-values-after', "\$c = new Collection([2 => 'c', 0 => 'a', 1 => 'b']); \$c->unshift('U', 'V'); \$c->all()", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->unshift('U', 'V')->all()));
probe('unshift-mixed-after', "\$c = new Collection(['x' => 1, 0 => 2, 'y' => 3]); \$c->unshift('U'); \$c->all()", fn () => arrayablePairs((new Collection(MIXED))->unshift('U')->all()));
probe('unshift-collision-after', "\$c = new Collection([1 => 'a', 'x' => 'b', '1' => 'c']); \$c->unshift('U'); \$c->all()", fn () => arrayablePairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->unshift('U')->all()));

emit();
