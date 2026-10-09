<?php

/**
 * Ground truth for the keys Collection methods build their results by.
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
probe('C32-E-keyed-results-empty', "collect([])->mapWithKeys(...), ->groupBy('x'), ->countBy(), ->keyBy('x'), ->flip()", fn () => ['mapWithKeys' => (new Collection([]))->mapWithKeys(fn ($v) => [$v => $v])->all(), 'groupBy' => (new Collection([]))->groupBy('x')->all(), 'countBy' => (new Collection([]))->countBy()->all(), 'keyBy' => (new Collection([]))->keyBy('x')->all(), 'flip' => (new Collection([]))->flip()->all()]);
probe('C32-E-keyed-results-mixed-key-order', "a string key produced before an int key: groupBy/countBy/keyBy/pluck/mapToDictionary/collapseWithKeys/flip ->keys()", fn () => [
    'groupBy' => (new Collection([['k' => 's'], ['k' => 5]]))->groupBy('k')->keys()->all(),
    'countBy' => (new Collection(['s', 5]))->countBy()->keys()->all(),
    'keyBy' => (new Collection([['k' => 's'], ['k' => 5]]))->keyBy('k')->keys()->all(),
    'pluck' => (new Collection([['k' => 's', 'v' => 1], ['k' => 5, 'v' => 2]]))->pluck('v', 'k')->keys()->all(),
    'mapToDictionary' => (new Collection(['s', 5]))->mapToDictionary(fn ($v) => [$v => $v])->keys()->all(),
    'collapseWithKeys' => (new Collection([['s' => 1], [5 => 2]]))->collapseWithKeys()->keys()->all(),
    'flip' => (new Collection(['s', 5]))->flip()->keys()->all(),
]);
probe('C32-E-keyed-results-out-of-order-receiver', "a receiver whose integer keys run 2, 0: keyBy('id'), groupBy('g') and countBy() keys, mapToDictionary(fn => [\$v => \$k]), and flip() over 'x', 'y', 'x'", fn () => [
    'keyBy' => (new Collection([2 => ['id' => 5], 0 => ['id' => 4]]))->keyBy('id')->keys()->all(),
    'groupBy' => (new Collection([2 => ['g' => 5], 0 => ['g' => 4]]))->groupBy('g')->keys()->all(),
    'countBy' => (new Collection([2 => 5, 0 => 4]))->countBy()->keys()->all(),
    'mapToDictionary' => c32e_pairs((new Collection([2 => 5, 0 => 4]))->mapToDictionary(fn ($v, $k) => [$v => $k])),
    'flip' => c32e_pairs((new Collection([2 => 'x', 0 => 'y', 1 => 'x']))->flip()),
]);

emit();
