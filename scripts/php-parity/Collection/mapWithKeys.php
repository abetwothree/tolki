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

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];

$c32KeysSeen = function (callable $run, bool $answer = false): array {
    $seen = [];
    $run(function ($v, $k) use (&$seen, $answer) {
        $seen[] = [gettype($k), $k];

        return $answer;
    });

    return $seen;
};

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));

probe('C32-E-mapWithKeys-overwriting-keys', "collect([['id'=>1,'name'=>'A'],['id'=>2,'name'=>'B'],['id'=>1,'name'=>'C']])->mapWithKeys(fn (\$i) => [\$i['id'] => \$i['name']])", fn () => c32e_pairs((new Collection([['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B'], ['id' => 1, 'name' => 'C']]))->mapWithKeys(fn ($i) => [$i['id'] => $i['name']])));
probe('C32-E-mapWithKeys-multiple-rows-order', "collect(rows 1..3)->mapWithKeys(fn (\$i) => [\$i['id'] => \$i['name'], \$i['name'] => \$i['id']])->keys()", fn () => (new Collection([['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B'], ['id' => 3, 'name' => 'C']]))->mapWithKeys(fn ($i) => [$i['id'] => $i['name'], $i['name'] => $i['id']])->keys()->all());
probe('C32-E-mapWithKeys-callback-key-type', "collect([1 => 'a', 'x' => 'b'])->mapWithKeys(fn (\$v, \$k) => [\$v => gettype(\$k)])", fn () => (new Collection([1 => 'a', 'x' => 'b']))->mapWithKeys(fn ($v, $k) => [$v => gettype($k)])->all());
probe('C32-E-mapWithKeys-returns-collection', "collect([1, 2])->mapWithKeys(fn (\$v) => collect(['k'.\$v => \$v]))", fn () => (new Collection([1, 2]))->mapWithKeys(fn ($v) => new Collection(['k'.$v => $v]))->all());
probe('C32-E-keyed-results-empty', "collect([])->mapWithKeys(...), ->groupBy('x'), ->countBy(), ->keyBy('x'), ->flip()", fn () => ['mapWithKeys' => (new Collection([]))->mapWithKeys(fn ($v) => [$v => $v])->all(), 'groupBy' => (new Collection([]))->groupBy('x')->all(), 'countBy' => (new Collection([]))->countBy()->all(), 'keyBy' => (new Collection([]))->keyBy('x')->all(), 'flip' => (new Collection([]))->flip()->all()]);
probe('C32-E-mapWithKeys-out-of-order-return', "collect([1])->mapWithKeys(fn () => [2 => 'c', 0 => 'a'])", fn () => c32e_pairs((new Collection([1]))->mapWithKeys(fn () => [2 => 'c', 0 => 'a'])));

emit();
