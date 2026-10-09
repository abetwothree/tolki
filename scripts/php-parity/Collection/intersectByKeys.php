<?php

/**
 * Ground truth for Collection::intersectByKeys().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

probe('intersectByKeys(null)', '$c->intersectByKeys(null)', function () {
    return (new Collection(['name' => 'M']))->intersectByKeys(null)->all();
});
probe('C19 intersectByKeys 2', '(new Collection([\'name\' => \'taylor\', \'family\' => \'otwell\', \'age\' => 26]))->intersectByKeys(new Collection([\'height\' => 180, \'name\' => \'amir\', \'family\' => \'moharami\']))->all()', fn () => (new Collection(['name' => 'taylor', 'family' => 'otwell', 'age' => 26]))->intersectByKeys(new Collection(['height' => 180, 'name' => 'amir', 'family' => 'moharami']))->all());
probe('C20 intersectByKeys 1', '(new Collection([\'name\' => \'Mateus\', \'age\' => 18]))->intersectByKeys(new Collection([\'name\' => \'Mateus\', \'surname\' => \'Guimaraes\']))->all()', fn () => (new Collection(['name' => 'Mateus', 'age' => 18]))->intersectByKeys(new Collection(['name' => 'Mateus', 'surname' => 'Guimaraes']))->all());
probe('intersectByKeys-list-collection-operand', "(new Collection([1, 2, 3]))->intersectByKeys(new Collection([9, 9]))", fn () => (new Collection([1, 2, 3]))->intersectByKeys(new Collection([9, 9]))->values()->all());
probe('intersectByKeys-list-keyed-operand', "(new Collection([1, 2, 3]))->intersectByKeys(['a' => 'x', 'b' => 'y']), ->intersectByKeys([0 => 'x', 2 => 'y']), ->intersectByKeys(new ArrayIterator([2 => 'z']))", fn () => [
    'assoc' => (new Collection([1, 2, 3]))->intersectByKeys(['a' => 'x', 'b' => 'y'])->values()->all(),
    'offset' => (new Collection([1, 2, 3]))->intersectByKeys([0 => 'x', 2 => 'y'])->values()->all(),
    'iterator' => (new Collection([1, 2, 3]))->intersectByKeys(new ArrayIterator([2 => 'z']))->values()->all(),
]);
probe('intersectByKeys-scalar-backing', "(new Collection(5))->intersectByKeys([1])", fn () => (new Collection(5))->intersectByKeys([1])->all());
probe('intersectByKeys-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->intersectByKeys([0 => 'z', 2 => 'z'])", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->intersectByKeys([0 => 'z', 2 => 'z'])->all()));

// a plain object's `all` member is data, never an Enumerable to unwrap (PHP casts the object with (array))
probe('C32-F-plain-object-all-member-is-data', "collect(['all' => 1, 'b' => 2])->intersectByKeys((object) ['all' => fn () => ['b' => 2]]) / ->union(...) keys / ->replace(...) keys / ->diffKeys(...) / ->combine(...) keys", fn () => [
    'intersectByKeys' => collect(['all' => 1, 'b' => 2])->intersectByKeys((object) ['all' => fn () => ['b' => 2]])->all(),
    'unionKeys' => collect(['a' => 1])->union((object) ['all' => fn () => ['b' => 2]])->keys()->all(),
    'replaceKeys' => collect(['a' => 1])->replace((object) ['all' => fn () => ['b' => 2]])->keys()->all(),
    'diffKeys' => collect(['all' => 1, 'b' => 2])->diffKeys((object) ['all' => fn () => ['b' => 2]])->all(),
    'combineKeys' => collect(['k'])->combine((object) ['all' => fn () => ['v']])->keys()->all(),
]);

emit();
