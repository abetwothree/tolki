<?php

/**
 * Task 3 ground truth — splice's container type, one-arg form, and return contract.
 *
 * Run: php scripts/php-parity/task-03-splice.php > docs/php-parity/task-03-splice.json
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Collection;

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

probe('splice on numeric keys — reindexes', 'array_splice([10=>a,20=>b,30=>c],1,1)', function () {
    $a = [10 => 'a', 20 => 'b', 30 => 'c'];
    $cut = array_splice($a, 1, 1);

    return ['remaining' => $a, 'cut' => $cut];
});

probe('splice discards replacement keys', 'array_splice($a,1,1,["foo"=>"bar"])', function () {
    $simple = ['x' => 1, 'y' => 2, 'z' => 3];
    array_splice($simple, 1, 1, ['foo' => 'bar']);

    $multi = ['a' => 1, 'b' => 2, 'c' => 3];
    array_splice($multi, 1, 1, ['x' => 10, 'y' => 20]);

    $collision = ['a' => 1, 'b' => 2, 'c' => 3];
    array_splice($collision, 1, 1, ['a' => 9]);

    $insert = ['a' => 1, 'b' => 2, 'c' => 3];
    array_splice($insert, 1, 0, [10]);

    return ['simple' => $simple, 'multi' => $multi, 'collision' => $collision, 'insert' => $insert];
});

emit();
