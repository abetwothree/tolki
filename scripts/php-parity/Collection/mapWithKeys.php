<?php

/**
 * Ground truth for Collection::mapWithKeys().
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

probe('mapWithKeys-traversable-backing', "collect(gen(1,2))->mapWithKeys(fn (\$v, \$k) => [\$k => \$v])", fn () => (new Collection(traversable()))->mapWithKeys(fn ($value, $key) => [$key => $value])->all());

probe('C32-E-mapWithKeys-overwriting-keys', "collect([['id'=>1,'name'=>'A'],['id'=>2,'name'=>'B'],['id'=>1,'name'=>'C']])->mapWithKeys(fn (\$i) => [\$i['id'] => \$i['name']])", fn () => c32e_pairs((new Collection([['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B'], ['id' => 1, 'name' => 'C']]))->mapWithKeys(fn ($i) => [$i['id'] => $i['name']])));
probe('C32-E-mapWithKeys-multiple-rows-order', "collect(rows 1..3)->mapWithKeys(fn (\$i) => [\$i['id'] => \$i['name'], \$i['name'] => \$i['id']])->keys()", fn () => (new Collection([['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B'], ['id' => 3, 'name' => 'C']]))->mapWithKeys(fn ($i) => [$i['id'] => $i['name'], $i['name'] => $i['id']])->keys()->all());
probe('C32-E-mapWithKeys-callback-key-type', "collect([1 => 'a', 'x' => 'b'])->mapWithKeys(fn (\$v, \$k) => [\$v => gettype(\$k)])", fn () => (new Collection([1 => 'a', 'x' => 'b']))->mapWithKeys(fn ($v, $k) => [$v => gettype($k)])->all());
probe('C32-E-mapWithKeys-returns-collection', "collect([1, 2])->mapWithKeys(fn (\$v) => collect(['k'.\$v => \$v]))", fn () => (new Collection([1, 2]))->mapWithKeys(fn ($v) => new Collection(['k'.$v => $v]))->all());
probe('C32-E-mapWithKeys-out-of-order-return', "collect([1])->mapWithKeys(fn () => [2 => 'c', 0 => 'a'])", fn () => c32e_pairs((new Collection([1]))->mapWithKeys(fn () => [2 => 'c', 0 => 'a'])));

emit();
