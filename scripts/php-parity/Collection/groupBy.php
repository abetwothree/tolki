<?php

/**
 * Ground truth for Collection::groupBy().
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
probe('C32-E-groupBy-groups-are-collections', "collect([['r'=>1],['r'=>1]])->groupBy('r')->get(1): class and count", fn () => ['class' => get_class((new Collection([['r' => 1], ['r' => 1]]))->groupBy('r')->get(1)), 'count' => (new Collection([['r' => 1], ['r' => 1]]))->groupBy('r')->get(1)->count()]);
probe('C32-E-groupBy-multilevel-shape', "groupBy(['skilllevel', fn => roles], true) with users as leaves", fn () => c32e_pairs((new Collection([10 => ['user' => 1, 'skilllevel' => 1, 'roles' => ['Role_1', 'Role_3']], 20 => ['user' => 2, 'skilllevel' => 1, 'roles' => ['Role_1', 'Role_2']], 30 => ['user' => 3, 'skilllevel' => 2, 'roles' => ['Role_1']], 40 => ['user' => 4, 'skilllevel' => 2, 'roles' => ['Role_2']]]))->groupBy(['skilllevel', fn ($i) => $i['roles']], true)->map(fn ($l1) => $l1->map(fn ($l2) => $l2->map(fn ($r) => $r['user'])))));
probe('C32-E-groupBy-enum-key', "groupBy('name') over pure A, int-backed A (1), string-backed A ('A'): group keys => item keys", fn () => c32e_pairs((new Collection([['name' => C32E_Pure::A], ['name' => C32E_Int::A], ['name' => C32E_Str::A]]))->groupBy('name')->map(fn ($g) => $g->keys()->all())));
probe('C32-E-groupBy-backed-enum-key', "groupBy('rating') over int-backed A, B: counts", fn () => c32e_pairs((new Collection([['rating' => C32E_Int::A], ['rating' => C32E_Int::B]]))->groupBy('rating')->map->count()));
probe('C32-E-groupBy-bool-key-order', "collect([['a'=>true],['a'=>false],['a'=>true]])->groupBy('a'): counts", fn () => c32e_pairs((new Collection([['a' => true], ['a' => false], ['a' => true]]))->groupBy('a')->map->count()));
probe('C32-E-groupBy-float-key', "@collect([1, 2])->groupBy(fn () => 1.5): counts", fn () => c32e_pairs(@(new Collection([1, 2]))->groupBy(fn () => 1.5)->map->count()));
probe('C32-E-groupBy-int-key-order', "collect([['r'=>2],['r'=>1],['r'=>2]])->groupBy('r')->keys()", fn () => (new Collection([['r' => 2], ['r' => 1], ['r' => 2]]))->groupBy('r')->keys()->all());
probe('C32-E-groupBy-callback-key-type', "collect(['a', 'b'])->groupBy(fn (\$v, \$k) => gettype(\$k))->keys()", fn () => (new Collection(['a', 'b']))->groupBy(fn ($v, $k) => gettype($k))->keys()->all());
probe('C32-E-groupBy-preserve-keys-list-backing', "collect(['a','b','c'])->groupBy(fn (\$v, \$k) => \$k % 2 ? 'odd' : 'even', true)", fn () => c32e_pairs((new Collection(['a', 'b', 'c']))->groupBy(fn ($v, $k) => $k % 2 ? 'odd' : 'even', true)));
probe('C32-E-groupBy-empty-and-null-array-arg', "collect([1, 2, 1])->groupBy([]) and ->groupBy([null])", fn () => ['empty' => c32e_pairs((new Collection([1, 2, 1]))->groupBy([])), 'null' => c32e_pairs((new Collection([1, 2, 1]))->groupBy([null]))]);
probe('C32-E-keyed-results-mixed-key-order', "a string key produced before an int key: groupBy/countBy/keyBy/pluck/mapToDictionary/collapseWithKeys/flip ->keys()", fn () => [
    'groupBy' => (new Collection([['k' => 's'], ['k' => 5]]))->groupBy('k')->keys()->all(),
    'countBy' => (new Collection(['s', 5]))->countBy()->keys()->all(),
    'keyBy' => (new Collection([['k' => 's'], ['k' => 5]]))->keyBy('k')->keys()->all(),
    'pluck' => (new Collection([['k' => 's', 'v' => 1], ['k' => 5, 'v' => 2]]))->pluck('v', 'k')->keys()->all(),
    'mapToDictionary' => (new Collection(['s', 5]))->mapToDictionary(fn ($v) => [$v => $v])->keys()->all(),
    'collapseWithKeys' => (new Collection([['s' => 1], [5 => 2]]))->collapseWithKeys()->keys()->all(),
    'flip' => (new Collection(['s', 5]))->flip()->keys()->all(),
]);

// Collection rows are ArrayAccess, so data_get reads through them.
probe('C32-E-groupBy-collection-rows', "c32c_rows(list | keyed)->groupBy('k'): each group's 'v' values", fn () => array_map(fn (bool $keyed) => c32c_rows($keyed)->groupBy('k')->map(fn (Collection $group) => $group->pluck('v')->all())->all(), ['list' => false, 'keyed' => true]));
probe('C32-E-groupBy-nested-array-key', "(new Collection([1]))->groupBy(fn () => [[1, 2]])", fn () => (new Collection([1]))->groupBy(fn () => [[1, 2]])->all());
probe('C32-E-groupBy-nested-assoc-key', "(new Collection([1]))->groupBy(fn () => [['a' => 1]])", fn () => (new Collection([1]))->groupBy(fn () => [['a' => 1]])->all());
probe('C32-E-groupBy-date-key', "(new Collection([1]))->groupBy(fn () => new DateTime('@0'))", fn () => (new Collection([1]))->groupBy(fn () => new DateTime('@0'))->all());
probe('C32-E-groupBy-assoc-return', "(new Collection([1, 2]))->groupBy(fn (\$x) => ['p' => \$x, 'q' => 'z'])", fn () => c32e_pairs((new Collection([1, 2]))->groupBy(fn ($x) => ['p' => $x, 'q' => 'z'])));
probe('C32-E-groupBy-groups-keep-subclass', "get_class of C32ASub([['a' => 1, 'b' => 'x']])->groupBy(['a', 'b']), of its group 1 and of that group's group 'x'", function () {
    $grouped = (new C32ASub([['a' => 1, 'b' => 'x']]))->groupBy(['a', 'b']);

    return [get_class($grouped), get_class($grouped->get(1)), get_class($grouped->get(1)->get('x'))];
});
probe('C32-E-groupBy-preserve-keys-mixed-order', "collect(['x' => 'p', 5 => 'q'])->groupBy(fn () => 'g', true)", fn () => c32e_pairs((new Collection(['x' => 'p', 5 => 'q']))->groupBy(fn () => 'g', true)));

emit();
