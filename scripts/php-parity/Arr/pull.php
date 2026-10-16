<?php

/**
 * Ground truth for Arr::pull().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('Arr::pull — first-level key containing dots', 'Arr::pull($a, "joe@example.com")', function () {
    $a = ['joe@example.com' => 'Joe', 'jane@localhost' => 'Jane'];
    $v = Arr::pull($a, 'joe@example.com');

    return ['pulled' => $v, 'remaining' => $a];
});

// ---- pull
probe('pull-nested-dotted-key', "Arr::pull(\$a=['emails'=>['joe@example.com'=>'Joe','jane@localhost'=>'Jane']], 'emails.joe@example.com')", function () {
    $a = ['emails' => ['joe@example.com' => 'Joe', 'jane@localhost' => 'Jane']];
    $v = Arr::pull($a, 'emails.joe@example.com');
    return ['value' => $v, 'array' => $a];
});
probe('pull-list-non-canonical-index', "\$a = ['x', 'y']; Arr::pull(\$a, '01', 'd')", function () {
    $a = ['x', 'y'];
    $value = Arr::pull($a, '01', 'd');

    return ['value' => $value, 'array' => $a];
});

// ==== D7: a dot path walks into an associative array inside a list, which the port holds as a plain-object row.
probe('pull-list-of-assoc-rows', "\$a = [['a' => 1, 'b' => 2]]; [Arr::pull(\$a, '0.a'), \$a]", function () {
    $a = [['a' => 1, 'b' => 2]];

    return [Arr::pull($a, '0.a'), $a];
});
probe('pull-nested-assoc-in-a-row', "\$a = [['a' => ['x' => 1, 'y' => 2]]]; [Arr::pull(\$a, '0.a.x'), \$a]", function () {
    $a = [['a' => ['x' => 1, 'y' => 2]]];

    return [Arr::pull($a, '0.a.x'), $a];
});
probe('pull-assoc-through-a-list-row', "\$a = ['rows' => [['a' => 1, 'b' => 2]]]; [Arr::pull(\$a, 'rows.0.a'), \$a]", function () {
    $a = ['rows' => [['a' => 1, 'b' => 2]]];

    return [Arr::pull($a, 'rows.0.a'), $a];
});

probe('pull-nested-keeps-other-keys', "Arr::pull(\$a, 'm.0'), Arr::pull(\$l, '0.0') on [2 => 'c', 0 => 'a', 1 => 'b']", function () {
    $a = ['m' => [2 => 'c', 0 => 'a', 1 => 'b']];
    $l = [[2 => 'c', 0 => 'a', 1 => 'b']];
    $v = Arr::pull($a, 'm.0');
    $lv = Arr::pull($l, '0.0');

    return [
        'assoc' => ['value' => $v, 'data' => $a],
        'assoc_keys' => array_keys($a['m']),
        'list' => ['value' => $lv, 'data' => $l],
        'list_keys' => array_keys($l[0]),
    ];
});

emit();
