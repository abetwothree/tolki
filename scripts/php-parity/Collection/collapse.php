<?php

/**
 * Ground truth for Collection::collapse().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

probe('collapse-null', 'collect(null)->collapse()->all()', fn () => collect(null)->collapse()->all());
probe('C32-E-collapse-nested-collections', "collect([collect([1,2,3]), collect([4,5,6])])->collapse() and collect([[o1],[o2]])->collapse() count", fn () => ['collections' => (new Collection([new Collection([1, 2, 3]), new Collection([4, 5, 6])]))->collapse()->all(), 'objects' => (new Collection([[new stdClass], [new stdClass]]))->collapse()->count()]);
probe('C32-E-array-item-all-member-is-data', "\$row = ['all' => fn () => [9], 'b' => 2]: collect([\$row]) and collect(['x' => \$row]) ->collapse()->keys() and ->flatten() (a closure as 'Closure')", function () {
    $row = ['all' => fn () => [9], 'b' => 2];
    $named = fn (Collection $c) => $c->map(fn ($v) => $v instanceof Closure ? 'Closure' : $v)->all();

    return [
        'collapseKeys' => (new Collection([$row]))->collapse()->keys()->all(),
        'collapseKeyedKeys' => (new Collection(['x' => $row]))->collapse()->keys()->all(),
        'flatten' => $named((new Collection([$row]))->flatten()),
        'flattenKeyed' => $named((new Collection(['x' => $row]))->flatten()),
    ];
});
probe('C32-E-collapse-out-of-order-collection-item', "collect([collect([2 => 'c', 0 => 'a'])])->collapse(), and whether it is a list", fn () => [
    'pairs' => c32e_pairs((new Collection([new Collection([2 => 'c', 0 => 'a'])]))->collapse()),
    'is-list' => array_is_list((new Collection([new Collection([2 => 'c', 0 => 'a'])]))->collapse()->all()),
]);

// Collection::collapse(), collapseWithKeys() and flatten() over mixed collection types (laravel/framework#61811).
probe('collapse-mixed-collection-types', '(new Collection([new Collection([1, 2]), new LazyCollection([3, 4]), [5]]))->collapse()->all()', fn () => (new Collection([new Collection([1, 2]), new LazyCollection([3, 4]), [5]]))->collapse()->all());

emit();
