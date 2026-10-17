<?php

/**
 * Ground truth for Collection::keys().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('keys/values over the same fixture', 'collect([10,20,30,40])->keys()', function () {
    return ['keys' => (new Collection(nums()))->keys()->all(), 'values' => (new Collection(nums()))->values()->all()];
});
probe('C15 keys assoc', '(new Collection([\'name\' => \'taylor\', \'framework\' => \'laravel\']))->keys()->all()', fn () => (new Collection(['name' => 'taylor', 'framework' => 'laravel']))->keys()->all());

// ==== CollectionTest parity: keys, splice, pop, shift, pad
probe('K1 keys of numeric-looking string keys', 'array_map(fn ($k) => [gettype($k), $k], (new Collection([\'1.5\' => \'a\', \'Infinity\' => \'b\', \'-1\' => \'c\', \'01\' => \'d\', \'1e3\' => \'e\', \'10\' => \'f\', \'1e+21\' => \'g\']))->keys()->all())', function () {
    $keys = (new Collection(['1.5' => 'a', 'Infinity' => 'b', '-1' => 'c', '01' => 'd', '1e3' => 'e', '10' => 'f', '1e+21' => 'g']))->keys()->all();
    return array_map(fn ($k) => [gettype($k), $k], $keys);
});
probe('keys-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->keys()", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->keys()->all()));
probe('keys-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->keys()", fn () => arrayablePairs((new Collection(MIXED))->keys()->all()));
probe('keys-collision', "(new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->keys()", fn () => arrayablePairs((new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->keys()->all()));
probe('keys-out-of-order-key-types', "(new Collection([-1 => 'a', 'x' => 'X', 0 => 'b', '01' => 's']))->keys()", fn () => arrayablePairs((new Collection([-1 => 'a', 'x' => 'X', 0 => 'b', '01' => 's']))->keys()->all()));

emit();
