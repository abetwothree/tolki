<?php

/**
 * Task 6 ground truth — diff/intersect compare values, not key/value pairs.
 *
 * Run: php scripts/php-parity/task-06-setops.php > docs/php-parity/task-06-setops.json
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Collection;

probe('intersect — values only, left keys', '$c->intersect([...])', function () {
    return (new Collection(['id' => 1, 'first_word' => 'Hello']))
        ->intersect(['first_world' => 'Hello', 'last_word' => 'World'])->all();
});

probe('diff — values only', '$c->diff(["x"=>"Hello"])', function () {
    return (new Collection(['id' => 1, 'first_word' => 'Hello']))
        ->diff(['x' => 'Hello'])->all();
});

probe('diff is case-sensitive', '$c->diff([...])', function () {
    return (new Collection(['en_GB', 'fr', 'HR']))->diff(['en_gb', 'hr'])->all();
});

probe('intersect(null)', '$c->intersect(null)', function () {
    return (new Collection(['id' => 1]))->intersect(null)->all();
});

probe('intersectAssoc — key AND value', '$c->intersectAssoc([...])', function () {
    return (new Collection(['a'=>'green','b'=>'brown','c'=>'blue',0=>'red']))
        ->intersectAssoc(['a'=>'green','b'=>'yellow',0=>'blue',1=>'red'])->all();
});

probe('intersectByKeys(null)', '$c->intersectByKeys(null)', function () {
    return (new Collection(['name' => 'M']))->intersectByKeys(null)->all();
});

// Extra probes beyond the brief — needed to check for collisions this task's
// fix could create in sibling functions that are NOT supposed to change.

probe('intersectAssoc(null)', '$c->intersectAssoc(null)', function () {
    return (new Collection(['a' => 'green']))->intersectAssoc(null)->all();
});

probe('diffAssoc — key AND value (must stay unchanged)', '$c->diffAssoc([...])', function () {
    return (new Collection(['id' => 1, 'first_word' => 'Hello', 'not_affected' => 'value']))
        ->diffAssoc(['id' => 123, 'foo_bar' => 'Hello', 'not_affected' => 'value'])->all();
});

probe('diffAssoc — case-sensitive keys (must stay unchanged)', '$c->diffAssoc([...])', function () {
    return (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 0 => 'red']))
        ->diffAssoc(['A' => 'green', 0 => 'yellow', 1 => 'red'])->all();
});

probe('diff(null) returns items unchanged', '$c->diff(null)', function () {
    return (new Collection(['id' => 1, 'first_word' => 'Hello']))->diff(null)->all();
});

probe('intersect on array-backed collection', '$c->intersect([2,4,6])', function () {
    return (new Collection([1, 2, 3, 4]))->intersect([2, 4, 6])->all();
});

probe('diff on array-backed collection', '$c->diff([2,4])', function () {
    return (new Collection([1, 2, 3, 4]))->diff([2, 4])->all();
});

probe('diffAssoc on array-backed collection', '$c->diffAssoc([1,9,3])', function () {
    return (new Collection([1, 2, 3]))->diffAssoc([1, 9, 3])->all();
});

emit();
