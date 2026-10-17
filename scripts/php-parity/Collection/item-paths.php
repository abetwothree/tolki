<?php

/**
 * Ground truth for dotted item paths in Collection's filters.
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

probe('C32-D-item-paths-by-backing', "where('a.b', 2) and where('a.*.b', [1, 2]) keys, pluck('a.b'), value('a.b') and value('a.b', 'miss'), keyBy(['a', 'b']) and keyBy(['id', 'name']) keys, over a list and over 'x', 'y', 'z'", fn () => array_map(fn (bool $keyed) => [
    'whereDotPath' => c32d_items($keyed, [['a' => ['b' => 1]], ['a' => ['b' => 2]], ['a.b' => 2]])->where('a.b', 2)->keys()->all(),
    'whereWildcardPath' => c32d_items($keyed, [['a' => [['b' => 1], ['b' => 2]]], ['a' => [['b' => 3]]]])->where('a.*.b', [1, 2])->keys()->all(),
    'pluckDotPath' => c32d_items($keyed, [['a.b' => 1, 'a' => ['b' => 2]]])->pluck('a.b')->all(),
    'valueDotPath' => c32d_items($keyed, [['a.b' => 1, 'a' => ['b' => 2]]])->value('a.b'),
    'valueDotPathMiss' => c32d_items($keyed, [['a.b' => 1]])->value('a.b', 'miss'),
    'keyByNestedPath' => c32d_items($keyed, [['a' => ['b' => 'z']]])->keyBy(['a', 'b'])->keys()->all(),
    'keyByUnreachablePath' => c32d_items($keyed, [['id' => 1, 'name' => 'John']])->keyBy(['id', 'name'])->keys()->all(),
], ['list' => false, 'keyed' => true]));
probe('C32-D-item-paths-filtered-values', "what the filters keep, read as values: where('a.b', 2) and where('a.*.b', [1, 2]) over plain rows, and where('k', 'b'), whereIn('k', ['a']), whereNotIn('k', ['a']) and whereNotBetween('v', [2, 2]) over c32c_rows as each row's 'v'", fn () => array_map(fn (bool $keyed) => [
    'whereDotPath' => c32d_items($keyed, [['a' => ['b' => 1]], ['a' => ['b' => 2]], ['a.b' => 2]])->where('a.b', 2)->values()->all(),
    'whereWildcardPath' => c32d_items($keyed, [['a' => [['b' => 1], ['b' => 2]]], ['a' => [['b' => 3]]]])->where('a.*.b', [1, 2])->values()->all(),
    'where' => c32c_rows($keyed)->where('k', 'b')->pluck('v')->all(),
    'whereIn' => c32c_rows($keyed)->whereIn('k', ['a'])->pluck('v')->all(),
    'whereNotIn' => c32c_rows($keyed)->whereNotIn('k', ['a'])->pluck('v')->all(),
    'whereNotBetween' => c32c_rows($keyed)->whereNotBetween('v', [2, 2])->pluck('v')->all(),
], ['list' => false, 'keyed' => true]));

emit();
