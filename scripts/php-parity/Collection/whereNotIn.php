<?php

/**
 * Ground truth for Collection::whereNotIn().
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

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));
probe('C32-D-whereNotIn-null-loose', "whereNotIn('v', [null]) over v = 0, '', false, null, '0', 'a', []", fn () => $vs([0, '', false, null, '0', 'a', []])->whereNotIn('v', [null])->keys()->all());
probe('C32-D-whereNotIn-true-loose', "whereNotIn('v', [true]) over v = 'x', 1, 0, '', null, '0', [1]", fn () => $vs(['x', 1, 0, '', null, '0', [1]])->whereNotIn('v', [true])->keys()->all());
probe('C32-D-whereNotIn-numbers-and-strings-loose', "whereNotIn('v', [1, 'abc']) over v = 1, '1', 'abc', 'ABC', 2, true", fn () => $vs([1, '1', 'abc', 'ABC', 2, true])->whereNotIn('v', [1, 'abc'])->keys()->all());

emit();
