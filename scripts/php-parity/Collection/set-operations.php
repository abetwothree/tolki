<?php

/**
 * Ground truth for Collection's set operations on an out-of-order receiver.
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
$fRows = fn (Collection $c) => $c->map(fn ($row) => $row instanceof Collection ? $row->all() : $row)->all();

// out-of-order integer keys, which only a Map holds in JS: the receiver's order, and an operand's
$fKeysValues = fn (Collection $c) => ['keys' => $c->keys()->all(), 'values' => $c->values()->all()];
probe('C32-F-receiver-out-of-order', "each set operation on collect([2 => 'c', 0 => 'a', 1 => 'b']): the kept keys and values, or the rows built", fn () => [
    'diff' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->diff(['a'])),
    'diffUsing' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->diffUsing(['A'], 'strcasecmp')),
    'diffAssoc' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->diffAssoc([0 => 'a'])),
    'diffKeys' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->diffKeys([0 => 'x'])),
    'diffKeysUsing' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->diffKeysUsing([0 => 'x'], 'strcasecmp')),
    'intersect' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->intersect(['c', 'b'])),
    'intersectUsing' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->intersectUsing(['C', 'B'], 'strcasecmp')),
    'intersectAssoc' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->intersectAssoc([2 => 'c', 1 => 'b'])),
    'intersectAssocUsing' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->intersectAssocUsing([2 => 'c', 1 => 'b'], 'strcasecmp')),
    'intersectByKeys' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->intersectByKeys([2 => 'x', 1 => 'y'])),
    'crossJoin' => collect([2 => 'c', 0 => 'a', 1 => 'b'])->crossJoin(['x'])->all(),
    'zip' => $fRows(collect([2 => 'c', 0 => 'a', 1 => 'b'])->zip(['x', 'y', 'z'])),
    'multiply' => collect([2 => 'c', 0 => 'a', 1 => 'b'])->multiply(2)->all(),
]);

emit();
