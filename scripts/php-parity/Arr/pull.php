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
// ---- callback key types: PHP hands a callback an integer key as an int
$keyTypes = function (callable $run, mixed $result = true): array {
    $seen = [];

    try {
        $run(function ($value, $key) use (&$seen, $result) {
            $seen[] = gettype($key);

            return $result;
        });
    } catch (\Throwable) {
    }

    return $seen;
};
probe('pull-list-non-canonical-index', "\$a = ['x', 'y']; Arr::pull(\$a, '01', 'd')", function () {
    $a = ['x', 'y'];
    $value = Arr::pull($a, '01', 'd');

    return ['value' => $value, 'array' => $a];
});

emit();
