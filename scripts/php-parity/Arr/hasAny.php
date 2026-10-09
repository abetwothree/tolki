<?php

/**
 * Ground truth for Arr::hasAny().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// --- hasAny: does the stray third argument count?
probe('hasAny-stray-arg-hit', "Arr::hasAny(['name' => 'Taylor', 'email' => 'foo'], 'surname', 'email')", fn () => Arr::hasAny(['name' => 'Taylor', 'email' => 'foo'], 'surname', 'email'));

// ==== hasAny (ArrTest::testHasAnyMethod) — "hasAny-stray-arg-hit" exists; these do not.
probe('hasAny-variadic', "Arr::hasAny(['name'=>'Taylor','age'=>''], 'surname', 'name')", fn () => Arr::hasAny(['name' => 'Taylor', 'age' => ''], 'surname', 'name'));
probe('hasAny-dot-over-null-and-empty', "Arr::hasAny over null/'' values and dot paths", fn () => [
    'null value' => Arr::hasAny(['name' => null, 'email' => ''], ['name']),
    'dot over null' => Arr::hasAny(['user' => ['name' => null]], ['user.name']),
    'all missing' => Arr::hasAny(['a' => 1], ['x', 'y']),
]);
probe('hasAny-null-keys', "Arr::hasAny(['a' => 1], null)", fn () => Arr::hasAny(['a' => 1], null));
// fix-round-1: "hasAny-variadic" is a FALSE case (PHP drops the loose 2nd/3rd args) and was
// wrongly cited for TRUE-returning array-form and bare-key calls. These are the real thing.
probe('hasAny-true-hits', "Arr::hasAny — array-form and bare-key calls that actually return true", fn () => [
    'array form assoc' => Arr::hasAny(['name' => 'Taylor'], ['surname', 'name']),
    'bare key assoc' => Arr::hasAny(['name' => 'Taylor'], 'name'),
    'array form list' => Arr::hasAny([1, 2, 3], [5, 1]),
]);
// fix-round-1: the null/empty-value-still-counts-as-present behaviour needed a list-backing pin.
probe('hasAny-list-null-and-empty', "Arr::hasAny over a list with a null value and a partial key set", fn () => [
    'null value' => Arr::hasAny([null, 'x'], [0]),
    'stray plus real' => Arr::hasAny(['Taylor', 'Otwell'], [5, 0]),
    'all missing' => Arr::hasAny([1], [5, 9]),
]);

emit();
