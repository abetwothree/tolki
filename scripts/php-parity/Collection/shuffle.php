<?php

/**
 * Ground truth for Collection::shuffle().
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
probe('C32-G-shuffle-list', "(new Collection(\$items))->shuffle() over ['a' => 1, 'b' => 2, 'c' => 3], [2 => 'c', 0 => 'a', 1 => 'b'] and ['x' => 1, 5 => 2]: array_is_list, the count and the sorted values", fn () => array_map(function (array $items) {
    $shuffled = (new Collection($items))->shuffle()->all();
    $values = array_values($shuffled);
    sort($values);

    return [array_is_list($shuffled), count($shuffled), $values];
}, ['keyed' => ['a' => 1, 'b' => 2, 'c' => 3], 'out-of-order' => [2 => 'c', 0 => 'a', 1 => 'b'], 'mixed' => ['x' => 1, 5 => 2]]));

emit();
