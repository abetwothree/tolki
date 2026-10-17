<?php

/**
 * Ground truth for Arr::hasAll().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ==== hasAll (ArrTest::testHasAllMethod) — no `hasAll` row exists anywhere in docs/php-parity/.
$hasAll = ['name' => 'Taylor', 'age' => '', 'city' => null];
probe('hasAll-empty-and-null-values-count-as-present', "Arr::hasAll(['name'=>'Taylor','age'=>'','city'=>null], …)", fn () => [
    "'name'" => Arr::hasAll($hasAll, 'name'),
    "'age'" => Arr::hasAll($hasAll, 'age'),
    "'city'" => Arr::hasAll($hasAll, 'city'),
    "['age','car']" => Arr::hasAll($hasAll, ['age', 'car']),
    "['city','some']" => Arr::hasAll($hasAll, ['city', 'some']),
    "['name','age','city']" => Arr::hasAll($hasAll, ['name', 'age', 'city']),
    "['name','age','city','country']" => Arr::hasAll($hasAll, ['name', 'age', 'city', 'country']),
]);
probe('hasAll-dot-paths', "Arr::hasAll(['user'=>['name'=>'Taylor']], 'user.name' | 'user.age')", fn () => [
    'hit' => Arr::hasAll(['user' => ['name' => 'Taylor']], 'user.name'),
    'miss' => Arr::hasAll(['user' => ['name' => 'Taylor']], 'user.age'),
]);
probe('hasAll-all-missing', "Arr::hasAll(\$hasAll, 'foo') and Arr::hasAll(\$hasAll, ['foo','bar','baz','bar'])", fn () => [
    'scalar' => Arr::hasAll($hasAll, 'foo'),
    'list' => Arr::hasAll($hasAll, ['foo', 'bar', 'baz', 'bar']),
]);
probe('hasAll-empty-key-list', "Arr::hasAll(['a' => 1], [])", fn () => Arr::hasAll(['a' => 1], []));
probe('hasAll-through-list', "Arr::hasAll([['name' => 'John']], '0.name')", fn () => Arr::hasAll([['name' => 'John']], '0.name'));
// fix-round-1: "is false for an empty key list" only had an assoc-backing pin.
probe('hasAll-empty-key-list-list', "Arr::hasAll([1, 2, 3], [])", fn () => Arr::hasAll([1, 2, 3], []));

emit();
