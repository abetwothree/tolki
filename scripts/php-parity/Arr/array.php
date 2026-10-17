<?php

/**
 * Ground truth for Arr::array().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// Arr::array() is the guard Arr::push() calls internally; probed directly here so
// arrayItem's own pinned tests (the JS port of Arr::array()) trace to an exact-match row.
probe('Arr::array requires an array at the key', 'Arr::array([1,2,3], 0)', function () {
    return Arr::array([1, 2, 3], 0);
});

probe('Arr::array through an explicit null', 'Arr::array([null,["valid"]], 0)', function () {
    return Arr::array([null, ['valid']], 0);
});

probe('Arr::array through a float', 'Arr::array([1.5], 0)', function () {
    return Arr::array([1.5], 0);
});

// --- typed getters: gettype wording for Arr::array
probe('array-list-value', "Arr::array(['string' => 'foo bar', 'array' => ['foo', 'bar']], 'array')", fn () => Arr::array(['string' => 'foo bar', 'array' => ['foo', 'bar']], 'array'));
probe('array-null-value', "Arr::array(['a' => null], 'a')", fn () => Arr::array(['a' => null], 'a'));
probe('array-int-value', "Arr::array(['a' => 5], 'a')", fn () => Arr::array(['a' => 5], 'a'));
probe('array-float-value', "Arr::array(['a' => 1.5], 'a')", fn () => Arr::array(['a' => 1.5], 'a'));
probe('array-bool-value', "Arr::array(['a' => true], 'a')", fn () => Arr::array(['a' => true], 'a'));
probe('array-missing-on-list', "Arr::array([['name' => 'John']], 'name')", fn () => Arr::array([['name' => 'John']], 'name'));

emit();
