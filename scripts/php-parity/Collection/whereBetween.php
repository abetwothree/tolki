<?php

/**
 * Ground truth for Collection::whereBetween().
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

// B6 follow-up — whereNotBetween is a non-sort consumer of the same comparison.
$between = [['v' => '9'], ['v' => '10'], ['v' => '1'], ['v' => 5], ['v' => null], ['v' => 0]];
probe('whereBetween over the same items', 'collect($between)->whereBetween("v",["1","5"])->pluck("v")', fn () => collect($between)->whereBetween('v', ['1', '5'])->pluck('v')->all());

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));

// whereBetween: reset()/end() on the given values
probe('C32-D-whereBetween-three-values', "whereBetween('v', [1, 5, 3]) over v = 0..6", fn () => $vs([0, 1, 2, 3, 4, 5, 6])->whereBetween('v', [1, 5, 3])->keys()->all());
probe('C32-D-whereBetween-keyed-values', "whereBetween('v', ['max' => 3, 'min' => 1]) over v = 0..4", fn () => $vs([0, 1, 2, 3, 4])->whereBetween('v', ['max' => 3, 'min' => 1])->keys()->all());
probe('C32-D-whereBetween-collection-values', "whereBetween('v', new Collection([1, 3])) over v = 0..4", fn () => $vs([0, 1, 2, 3, 4])->whereBetween('v', new Collection([1, 3]))->keys()->all());
probe('C32-D-whereBetween-null-item', "whereBetween('v', [0, 2]) over v = null, 0, 1, '', false", fn () => $vs([null, 0, 1, '', false])->whereBetween('v', [0, 2])->keys()->all());

emit();
