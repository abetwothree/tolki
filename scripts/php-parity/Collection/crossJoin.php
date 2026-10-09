<?php

/**
 * Ground truth for Collection::crossJoin().
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

probe('collection-crossJoin-list-keyed-operand', "(new Collection([1, 2]))->crossJoin(['k' => 'a', 'j' => 'b'])", fn () => (new Collection([1, 2]))->crossJoin(['k' => 'a', 'j' => 'b'])->all());

// ---- Collection::crossJoin is Arr::crossJoin($this->items, ...$lists): the items are one dimension, keys or not
probe('collection-crossJoin-assoc-items', "(new Collection(['size' => ['S', 'M']]))->crossJoin(['color' => ['red', 'blue']]), (['a' => 1, 'b' => 2])->crossJoin(['x', 'y']), (['a' => [1, 2]])->crossJoin(['b' => ['x']], ['c' => ['I', 'II']]), (['a' => 1, 'b' => 2])->crossJoin(['c' => 3, 'd' => 4])", fn () => [
    'nested' => (new Collection(['size' => ['S', 'M']]))->crossJoin(['color' => ['red', 'blue']])->all(),
    'scalars' => (new Collection(['a' => 1, 'b' => 2]))->crossJoin(['x', 'y'])->all(),
    'three' => (new Collection(['a' => [1, 2]]))->crossJoin(['b' => ['x']], ['c' => ['I', 'II']])->all(),
    'keyed-operand' => (new Collection(['a' => 1, 'b' => 2]))->crossJoin(['c' => 3, 'd' => 4])->all(),
]);
$fRows = fn (Collection $c) => $c->map(fn ($row) => $row instanceof Collection ? $row->all() : $row)->all();
probe('C32-F-crossJoin-null-and-scalar-operands', "collect([1, 2])->crossJoin(null) / ->crossJoin('x')", fn () => ['null' => collect([1, 2])->crossJoin(null)->all(), 'scalar' => collect([1, 2])->crossJoin('x')->all()]);

// out-of-order integer keys, which only a Map holds in JS: the receiver's order, and an operand's
$fKeysValues = fn (Collection $c) => ['keys' => $c->keys()->all(), 'values' => $c->values()->all()];
probe('C32-F-operand-out-of-order', "collect([1])->crossJoin([2 => 'c', 0 => 'a']) / collect([1, 2])->zip([2 => 'c', 0 => 'a']) / collect(['x', 'y'])->combine([2 => 'c', 0 => 'a'])", fn () => [
    'crossJoin' => collect([1])->crossJoin([2 => 'c', 0 => 'a'])->all(),
    'zip' => $fRows(collect([1, 2])->zip([2 => 'c', 0 => 'a'])),
    'combine' => $fKeysValues(collect(['x', 'y'])->combine([2 => 'c', 0 => 'a'])),
]);

emit();
