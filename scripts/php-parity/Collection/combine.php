<?php

/**
 * Ground truth for Collection::combine().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

probe('X19 combine on matching counts', "collect(['a','b','c'])->combine([1,2,3])", function () {
    return (new Collection(['a', 'b', 'c']))->combine([1, 2, 3])->all();
});
probe('C10 combine list keys, offset values', '(new Collection([\'name\', \'family\']))->combine([1 => \'taylor\', 2 => \'otwell\'])->toArray()', fn () => (new Collection(['name', 'family']))->combine([1 => 'taylor', 2 => 'otwell'])->toArray());
probe('C11 combine offset keys, list values', '(new Collection([1 => \'name\', 2 => \'family\']))->combine([\'taylor\', \'otwell\'])->toArray()', fn () => (new Collection([1 => 'name', 2 => 'family']))->combine(['taylor', 'otwell'])->toArray());
probe('C12 combine offset both', '(new Collection([1 => \'name\', 2 => \'family\']))->combine([2 => \'taylor\', 3 => \'otwell\'])->toArray()', fn () => (new Collection([1 => 'name', 2 => 'family']))->combine([2 => 'taylor', 3 => 'otwell'])->toArray());
probe('C13 combine lists -> int keys', '(new Collection([1, 2, 3]))->combine([4, 5, 6])->toArray()', fn () => (new Collection([1, 2, 3]))->combine([4, 5, 6])->toArray());
probe('D5 combine null/bool/float keys', '(new Collection([\'k\' => null|true|false|1.5|\'7\']))->combine([1])->all(), keyed \'null\',\'true\',\'false\',\'float\',\'numstr\'', fn () => [
    'null' => (new Collection(['k' => null]))->combine([1])->all(),
    'true' => (new Collection(['k' => true]))->combine([1])->all(),
    'false' => (new Collection(['k' => false]))->combine([1])->all(),
    'float' => (new Collection(['k' => 1.5]))->combine([1])->all(),
    'numstr' => (new Collection(['k' => '7']))->combine([1])->all(),
]);

// ---- array_combine keys a float by its (string) cast: INF, -0, 14 digits rounded half to even, E notation
probe('combine-float-keys', "@(new Collection([INF, -INF, NAN, -0.0, 1.5, -1.5, 1e21, 1.5e300, 1.5e-7, 0.00001, 0.0001, 0.1 + 0.2, 1 / 3, 10000000000000.5, 10000000000001.5, 5e-324, 99999999999999.98]))->combine(range(1, 17)): the keys", fn () => @(new Collection([INF, -INF, NAN, -0.0, 1.5, -1.5, 1e21, 1.5e300, 1.5e-7, 0.00001, 0.0001, 0.1 + 0.2, 1 / 3, 10000000000000.5, 10000000000001.5, 5e-324, 99999999999999.98]))->combine(range(1, 17))->keys()->all());
probe('combine-large-int-key', "(new Collection([4611686018427387904, -7]))->combine([1, 2]): each key as [type, string]", fn () => array_map(fn ($key) => [gettype($key), (string) $key], (new Collection([4611686018427387904, -7]))->combine([1, 2])->keys()->all()));
probe('combine-list-keyed-values', "(new Collection([1, 2]))->combine(['a' => 'x', 'b' => 'y']) and ->combine(new Collection(['a' => 'x', 'b' => 'y']))", fn () => [
    'keyed' => (new Collection([1, 2]))->combine(['a' => 'x', 'b' => 'y'])->all(),
    'collection' => (new Collection([1, 2]))->combine(new Collection(['a' => 'x', 'b' => 'y']))->all(),
]);
probe('combine-collection-values', "(new Collection(['a', 'b']))->combine(new Collection(['x', 'y']))", fn () => (new Collection(['a', 'b']))->combine(new Collection(['x', 'y']))->all());

// ==== D7 (F-23(4)): combine's keys backing. It never normalised one either, so every
// backing but a list or a plain object reached array_combine as an empty key set.
probe('d7-combine-scalar-backing', "(new Collection(5))->combine(['x']), (new Collection('k'))->combine(['x']) and (new Collection(null))->combine([])", fn () => [
    'int' => (new Collection(5))->combine(['x'])->all(),
    'string' => (new Collection('k'))->combine(['x'])->all(),
    'null' => (new Collection(null))->combine([])->all(),
]);
probe('d7-combine-traversable-backing', "(new Collection(new ArrayIterator(['k1', 'k2'])))->combine(['x', 'y'])", fn () => (new Collection(new ArrayIterator(['k1', 'k2'])))->combine(['x', 'y'])->all());

// ==== Task D6 Step 5 (F-17): the two combine keys the type prints differently from PHP.
probe('d6-combine-key-cast-minus-zero-and-1e19', "(new Collection([-0.0, 1e19]))->combine([1, 2]): the keys as PHP stores them", function () {
    return array_map(
        fn ($key) => [get_debug_type($key), (string) $key],
        array_keys((new Collection([-0.0, 1e19]))->combine([1, 2])->all())
    );
});

probe('combine-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->combine(['x', 'y', 'z'])", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->combine(['x', 'y', 'z'])->all()));
probe('combine-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->combine(['p', 'q', 'r'])", fn () => arrayablePairs((new Collection(MIXED))->combine(['p', 'q', 'r'])->all()));
probe('combine-out-of-order-values-operand', "(new Collection(['p', 'q', 'r']))->combine([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => arrayablePairs((new Collection(['p', 'q', 'r']))->combine(OUT_OF_ORDER)->all()));
probe('combine-collision', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->combine(['p', 'q'])", fn () => arrayablePairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->combine(['p', 'q'])->all()));
probe('combine-fewer-values', '(new Collection([1, 2]))->combine([3])->all()', fn () => (new Collection([1, 2]))->combine([3])->all());
probe('combine-more-values', '(new Collection([1]))->combine([2, 3])->all()', fn () => (new Collection([1]))->combine([2, 3])->all());
probe('C32-F-combine-null-operand-on-empty', 'collect([])->combine(null)', fn () => collect([])->combine(null)->all());
probe('C32-F-combine-null-operand-throws', "collect(['a'])->combine(null)", fn () => collect(['a'])->combine(null)->all());
probe('C32-F-combine-int-key-order', "(new Collection([3, 1, 2]))->combine(['c', 'a', 'b'])->keys()", fn () => (new Collection([3, 1, 2]))->combine(['c', 'a', 'b'])->keys()->all());

emit();
