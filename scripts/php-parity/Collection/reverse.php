<?php

/**
 * Ground truth for Collection::reverse().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('reverse over the same fixture', 'collect([10,20,30,40])->reverse()', function () {
    return (new Collection(nums()))->reverse()->all();
});

probe('reverse preserves keys and reverses entry order', 'collect([10,20,30,40])->reverse()', function () {
    return collect([10, 20, 30, 40])->reverse()->all();
});

probe('reverse on string keys', "collect(['a'=>1,'b'=>2,'c'=>3])->reverse()", function () {
    return collect(['a' => 1, 'b' => 2, 'c' => 3])->reverse()->all();
});
probe('C5 reverse assoc', '(new Collection([\'name\' => \'taylor\', \'framework\' => \'laravel\']))->reverse()->all()', fn () => (new Collection(['name' => 'taylor', 'framework' => 'laravel']))->reverse()->all());

probe('reverse-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->reverse()", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->reverse()->all()));
probe('reverse-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->reverse()", fn () => arrayablePairs((new Collection(MIXED))->reverse()->all()));
probe('reverse-string-keys-then-descending-int-keys', "(new Collection(['y' => 'Y', 'x' => 'X', 1 => 'o', 0 => 'z']))->reverse()", fn () => arrayablePairs((new Collection(['y' => 'Y', 'x' => 'X', 1 => 'o', 0 => 'z']))->reverse()->all()));
probe('reverse-collision', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->reverse()", fn () => arrayablePairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->reverse()->all()));

emit();
