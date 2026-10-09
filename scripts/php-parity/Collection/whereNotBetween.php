<?php

/**
 * Ground truth for Collection::whereNotBetween().
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
probe('whereNotBetween over numeric strings and falsy values', 'collect($between)->whereNotBetween("v",["1","5"])->pluck("v")', fn () => collect($between)->whereNotBetween('v', ['1', '5'])->pluck('v')->all());

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));
probe('C32-D-whereNotBetween-collection-values', "whereNotBetween('v', new Collection([1, 3])) over v = 0..4", fn () => $vs([0, 1, 2, 3, 4])->whereNotBetween('v', new Collection([1, 3]))->keys()->all());

emit();
