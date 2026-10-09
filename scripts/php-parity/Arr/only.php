<?php

/**
 * Ground truth for Arr::only().
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

probe('Arr::only with a bare string key', 'Arr::only(["foo"=>1,"bar"=>"baz"], "bar")', function () {
    return Arr::only(['foo' => 1, 'bar' => 'baz'], 'bar');
});

probe('X25 only accepts a bare key and null', 'Arr::only([10,20,30,40],1)', function () {
    return [
        'bare' => Arr::only(nums(), 1),
        'null' => Arr::only(nums(), null),
        'list' => Arr::only(nums(), [1, 3]),
    ];
});

probe('only accepts a bare scalar key', 'Arr::only([10,20,30,40],1)', function () {
    return Arr::only([10, 20, 30, 40], 1);
});

probe('only casts a null key to an empty key list', 'Arr::only([10,20,30,40],null)', function () {
    return Arr::only([10, 20, 30, 40], null);
});

// ==== ArrTest parity: testEvery .. testPartition
// ---- only
probe('only-none-exist', "Arr::only(['name'=>'Desk','price'=>100], ['nonExistingKey'])", fn () => Arr::only(['name' => 'Desk', 'price' => 100], ['nonExistingKey']));
probe('only-mixed-int-as-string', "Arr::only([0=>'foo','bar'=>'baz'], '0')", fn () => Arr::only([0 => 'foo', 'bar' => 'baz'], '0'));
probe('only-mixed-string', "Arr::only([0=>'foo','bar'=>'baz'], 'bar')", fn () => Arr::only([0 => 'foo', 'bar' => 'baz'], 'bar'));

// ---- 2. Subsets and keys.
probe('only-out-of-order', "Arr::only([2 => 'c', 0 => 'a', 1 => 'b'], [0, 2])", fn () => arrayablePairs(Arr::only(OUT_OF_ORDER, [0, 2])));
probe('only-mixed', "Arr::only(['x' => 1, 0 => 2, 'y' => 3], ['y', 'x', 0])", fn () => arrayablePairs(Arr::only(MIXED, ['y', 'x', 0])));
probe('only-string-keys-reordered-selector', "Arr::only(['b' => 1, 'a' => 2], ['a', 'b'])", fn () => arrayablePairs(Arr::only(['b' => 1, 'a' => 2], ['a', 'b'])));
probe('only-collision', "Arr::only([1 => 'a', 'x' => 'b', '1' => 'c'], [1])", fn () => arrayablePairs(Arr::only([1 => 'a', 'x' => 'b', '1' => 'c'], [1])));
probe('C32-D-arr-only-repeated-keys', "Arr::only(['a', 'b', 'c'], [2, 0, 2])", fn () => pairs(Arr::only(['a', 'b', 'c'], [2, 0, 2])));

emit();
