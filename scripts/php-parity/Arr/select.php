<?php

/**
 * Ground truth for Arr::select().
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

// ---- select
$sel = ['a' => ['name' => 'Taylor', 'role' => 'Developer', 'age' => 1], 'b' => ['name' => 'Abigail', 'role' => 'Infrastructure', 'age' => 2]];
probe('select-name-age', "Arr::select(\$sel, ['name','age'])", fn () => Arr::select($sel, ['name', 'age']));
probe('select-missing', "Arr::select(\$sel, 'nonExistingKey')", fn () => Arr::select($sel, 'nonExistingKey'));
probe('select-null', "Arr::select(\$sel, null)", fn () => Arr::select($sel, null));

// ==== select on an existing bare key (select-missing / select-null already exist)
probe('select-bare-existing-key', "Arr::select(['a'=>['name'=>'Taylor','age'=>1],'b'=>['name'=>'Abigail','age'=>2]], 'name')", fn () => Arr::select(['a' => ['name' => 'Taylor', 'age' => 1], 'b' => ['name' => 'Abigail', 'age' => 2]], 'name'));
// fix-round-1: select-missing / select-null (earlier in this file) only cover the assoc-of-assoc
// backing; "returns an empty row per item" needed a list-of-assoc pin too.
probe('select-missing-and-null-list', "Arr::select over a list backing — missing key and null key", fn () => [
    'missing' => Arr::select([['name' => 'T'], ['name' => 'A']], 'nonExistingKey'),
    'null' => Arr::select([['name' => 'T'], ['name' => 'A']], null),
]);

// fix-round-2: dataSelect's "accepts a bare string key" also makes a list-backed call;
// "select-bare-existing-key" only covers the assoc-of-assoc backing.
probe('select-bare-key-list', "array_values(Arr::select([['a'=>1,'b'=>2],['a'=>3,'b'=>4]], 'a'))", fn () => array_values(Arr::select([['a' => 1, 'b' => 2], ['a' => 3, 'b' => 4]], 'a')));

// Arr::exists casts a null key to '', while Arr::wrap turns a bare null into no keys at all.
probe('C32-D-select-null-key-cast', "select([null, 'a']) and select('a', null) over [['' => 'e', 'a' => 1]], and Arr::select() of it with [null] and with a bare null", fn () => [
    'collection-array' => pairs(@(new Collection([['' => 'e', 'a' => 1]]))->select([null, 'a'])),
    'collection-args' => pairs(@(new Collection([['' => 'e', 'a' => 1]]))->select('a', null)),
    'arr-list' => pairs(@Arr::select([['' => 'e', 'a' => 1]], [null])),
    'arr-bare-null' => pairs(Arr::select([['' => 'e', 'a' => 1]], null)),
]);

probe('C32-D-select-arrayaccess-call-counts', "Arr::select([\$row], ['a']) and Arr::select([\$row], ['a', 'missing']) over a fresh C32D_CountingAccess(['a' => 1]): the selection, then the offsetExists and offsetGet calls", fn () => array_map(function (array $keys) {
    $row = new C32D_CountingAccess(['a' => 1]);
    $selected = Arr::select([$row], $keys);

    return [pairs($selected), $row->exists, $row->gets];
}, [['a'], ['a', 'missing']]));
probe('C32-D-select-collection-row-fields', "Arr::select([new Collection(['a' => 1])], ['items', 'a']) and (new Collection([new Collection(['a' => 1])]))->select('items', 'a')", fn () => [
    pairs(Arr::select([new Collection(['a' => 1])], ['items', 'a'])),
    pairs((new Collection([new Collection(['a' => 1])]))->select('items', 'a')),
]);

emit();
