<?php

/**
 * Task 5 ground truth — replace / replaceRecursive purity and null guards.
 *
 * Run: php scripts/php-parity/task-05-replace.php > docs/php-parity/task-05-replace.json
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Collection;

probe('replace does not mutate', '$c->replace(["b"=>2])', function () {
    $c = new Collection(['a' => 1]);
    $r = $c->replace(['b' => 2]);

    return ['result' => $r->all(), 'source' => $c->all()];
});

probe('replace(null)', '$c->replace(null)', function () {
    return (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->replace(null)->all();
});

probe('replaceRecursive nested', '$c->replaceRecursive(["a"=>["y"=>2]])', function () {
    $c = new Collection(['a' => ['x' => 1]]);
    $r = $c->replaceRecursive(['a' => ['y' => 2]]);

    return ['result' => $r->all(), 'source' => $c->all()];
});

probe('replaceRecursive(null)', '$c->replaceRecursive(null)', function () {
    return (new Collection(['a' => 1]))->replaceRecursive(null)->all();
});

emit();
