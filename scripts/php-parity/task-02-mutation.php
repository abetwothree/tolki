<?php

/**
 * Task 2 ground truth — the pop / shift / unshift mutation contract.
 *
 * Run: php scripts/php-parity/task-02-mutation.php > docs/php-parity/task-02-mutation.json
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Collection;

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

probe('push/prepend equivalent of array_unshift', 'array_unshift on assoc', function () {
    $a = ['x' => 1, 'y' => 2];
    array_unshift($a, 9);

    return $a;
});

emit();
