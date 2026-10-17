<?php

/**
 * Ground truth for Collection::whereNotInStrict().
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
probe('C32-D-whereNotInStrict-array', "whereNotInStrict('v', [[1, 2]]) over v = [1, 2], ['1', '2']", fn () => $vs([[1, 2], ['1', '2']])->whereNotInStrict('v', [[1, 2]])->keys()->all());

emit();
