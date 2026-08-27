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

probe('intersectAssocUsing(null)', '$c->intersectAssocUsing(null, $cb)', function () {
    $strcasecmp = fn ($a, $b) => strtolower((string) $a) === strtolower((string) $b);

    return (new Collection(['a' => 'green']))->intersectAssocUsing(null, $strcasecmp)->all();
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

// Task 12 (parity-review-fixes) — C5: diff must accept a mismatched operand
// shape instead of treating an array `other` as absent. C6: intersect* must
// treat a nullish first operand as empty, like diff already does.
probe('diff and intersect accept any array operand', 'collect(["a"=>10,"b"=>20])->diff([20])', function () {
    return [
        'assoc_diff_list' => (new Collection(['a' => 10, 'b' => 20]))->diff([20])->all(),
        'list_diff_assoc' => (new Collection([10, 20]))->diff(['x' => 20])->all(),
        'null_intersect' => (new Collection(null))->intersect(['a' => 1])->all(),
        'null_diff' => (new Collection(null))->diff(['a' => 1])->all(),
    ];
});

// Extra probes beyond the brief — intersectAssoc/intersectAssocUsing/intersectByKeys
// must agree with intersect's null-first-operand-is-empty behaviour (C6/R5).
probe('intersectAssoc/intersectAssocUsing/intersectByKeys treat a nullish first operand as empty too', 'collect(null)->intersectAssoc(...)', function () {
    $strcasecmp = fn ($a, $b) => strtolower((string) $a) === strtolower((string) $b);

    return [
        'null_intersect_assoc' => (new Collection(null))->intersectAssoc(['a' => 1])->all(),
        'null_intersect_assoc_using' => (new Collection(null))->intersectAssocUsing(['a' => 1], $strcasecmp)->all(),
        'null_intersect_by_keys' => (new Collection(null))->intersectByKeys(['a' => 1])->all(),
    ];
});

// Task 14 (parity-review-fixes) — C7: diff/intersect compare values by
// (string) cast in real PHP, not strict ===. @ suppresses the "Array to
// string conversion" warning array_intersect emits for array operands.
probe('diff and intersect compare by string cast', 'array_diff([0],["0"])', function () {
    return [
        'diff_int_string' => array_diff([0], ['0']),
        'diff_null_empty' => array_diff([null], ['']),
        'diff_int_empty' => array_diff([0], ['']),
        'diff_int_exponential_string' => array_diff([100], ['1e2']),
        'intersect_int_string' => array_intersect([0], ['0']),
        'intersect_int_empty' => array_intersect([0], ['']),
        'intersect_bool_one' => array_intersect([true], ['1']),
        'intersect_arrays' => @array_intersect([['id' => 1], ['id' => 2]], [['id' => 1]]),
    ];
});

emit();
