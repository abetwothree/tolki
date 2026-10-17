<?php

/**
 * Ground truth for Collection::mapToDictionary().
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
probe('C32-E-mapToDictionary-int-key-order', "collect([3, 1, 3, 2])->mapToDictionary(fn (\$v, \$k) => [\$v => \$k])", fn () => c32e_pairs((new Collection([3, 1, 3, 2]))->mapToDictionary(fn ($v, $k) => [$v => $k])));
probe('C32-E-mapToDictionary-multi-pair-takes-first', "collect([1, 2])->mapToDictionary(fn (\$v) => ['a' => \$v, 'b' => \$v * 10])", fn () => (new Collection([1, 2]))->mapToDictionary(fn ($v) => ['a' => $v, 'b' => $v * 10])->all());
probe('C32-E-mapToDictionary-list-return', "collect([['id'=>1,'name'=>'A'],['id'=>2,'name'=>'B']])->mapToDictionary(fn (\$i) => [\$i['name'], \$i['id']])", fn () => c32e_pairs((new Collection([['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B']]))->mapToDictionary(fn ($i) => [$i['name'], $i['id']])));
probe('C32-E-mapToDictionary-one-item-list-return', "collect([['name'=>'A'],['name'=>'B']])->mapToDictionary(fn (\$i) => [\$i['name']])", fn () => c32e_pairs((new Collection([['name' => 'A'], ['name' => 'B']]))->mapToDictionary(fn ($i) => [$i['name']])));
probe('C32-E-mapToDictionary-empty-return', "@collect([1, 2])->mapToDictionary(fn () => [])", fn () => c32e_pairs(@(new Collection([1, 2]))->mapToDictionary(fn () => [])));

emit();
