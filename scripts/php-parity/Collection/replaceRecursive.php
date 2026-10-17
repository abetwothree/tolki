<?php

/**
 * Ground truth for Collection::replaceRecursive().
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

probe('replaceRecursive nested', '$c->replaceRecursive(["a"=>["y"=>2]])', function () {
    $c = new Collection(['a' => ['x' => 1]]);
    $r = $c->replaceRecursive(['a' => ['y' => 2]]);

    return ['result' => $r->all(), 'source' => $c->all()];
});

probe('replaceRecursive(null)', '$c->replaceRecursive(null)', function () {
    return (new Collection(['a' => 1]))->replaceRecursive(null)->all();
});

probe('replaceRecursive array nested', '$c->replaceRecursive([["y"=>2]])', function () {
    $c = new Collection([['x' => 1], 2]);
    $r = $c->replaceRecursive([['y' => 2]]);

    return ['result' => $r->all(), 'source' => $c->all()];
});

probe('replaceRecursive array (null)', '$c->replaceRecursive(null)', function () {
    return (new Collection([1]))->replaceRecursive(null)->all();
});

probe('X10 replaceRecursive does not mutate', 'collect([[a=>1],[b=>2]])->replaceRecursive([[c=>3]])', function () {
    $c = new Collection([['a' => 1], ['b' => 2]]);
    $out = $c->replaceRecursive([['c' => 3]]);

    return ['result' => $out->all(), 'source' => $c->all()];
});
probe('C24 replaceRecursive list fixture', '(new Collection([\'a\', \'b\', [\'c\', \'d\']]))->replaceRecursive([\'z\', 2 => [1 => \'e\'], \'f\'])->all()', fn () => (new Collection(['a', 'b', ['c', 'd']]))->replaceRecursive(['z', 2 => [1 => 'e'], 'f'])->all());
probe('D7 replaceRecursive nested list replaced by offset map', '(new Collection([\'k\' => [\'c\', \'d\']]))->replaceRecursive([\'k\' => [1 => \'e\']])->all()', fn () => (new Collection(['k' => ['c', 'd']]))->replaceRecursive(['k' => [1 => 'e']])->all());
probe('R1 replaceRecursive nested map replaced by list', '(new Collection([\'k\' => [0 => \'c\', 1 => \'d\']]))->replaceRecursive([\'k\' => [\'x\']])->all()', fn () => (new Collection(['k' => [0 => 'c', 1 => 'd']]))->replaceRecursive(['k' => ['x']])->all());
probe('replaceRecursive-list-with-assoc', "(new Collection(['k' => ['c']]))->replaceRecursive(['k' => ['x' => 1]])", fn () => (new Collection(['k' => ['c']]))->replaceRecursive(['k' => ['x' => 1]])->all());

// ---- replaceRecursive recurses only when both values are arrays; an object is a leaf
probe('replaceRecursive-list-element-map', "(new Collection(['y' => [1, 2]]))->replaceRecursive(['y' => [[1 => 'x']]])", fn () => (new Collection(['y' => [1, 2]]))->replaceRecursive(['y' => [[1 => 'x']]])->all());
probe('replaceRecursive-list-elements-kept-whole', "(new Collection([1, 2]))->replaceRecursive([[1 => 'x']]); (new Collection(['a', 'b', 'c']))->replaceRecursive(['x', [4 => 'e'], 'z'])", fn () => [
    'pair' => (new Collection([1, 2]))->replaceRecursive([[1 => 'x']])->all(),
    'three' => (new Collection(['a', 'b', 'c']))->replaceRecursive(['x', [4 => 'e'], 'z'])->all(),
]);
probe('replaceRecursive-nested-list-meets-map', "(new Collection([['c'], ['a' => 1]]))->replaceRecursive([['x' => 1], ['x']])", fn () => (new Collection([['c'], ['a' => 1]]))->replaceRecursive([['x' => 1], ['x']])->all());
probe('replaceRecursive-object-leaf', 'replaceRecursive with a DateTime or stdClass on either side: d and q are the replacer instances', function () {
    $date = new DateTime('@1');
    $object = (object) ['x' => 2];
    $result = (new Collection(['d' => new DateTime('@0'), 'p' => (object) ['x' => 1], 'q' => ['a' => 1]]))
        ->replaceRecursive(['d' => $date, 'p' => ['y' => 2], 'q' => $object])
        ->all();

    return ['d' => $result['d'] === $date, 'p' => $result['p'], 'q' => $result['q'] === $object];
});
probe('replaceRecursive-nested-toArray-entry', "a nested 'toArray' closure entry merges as data, with an array or a Collection operand", function () {
    $toArray = fn () => ['unwrapped'];
    $plain = (new Collection(['a' => ['x' => 1]]))->replaceRecursive(['a' => ['toArray' => $toArray]])->all();
    $wrapped = (new Collection(['a' => ['x' => 1]]))->replaceRecursive(new Collection(['a' => ['toArray' => $toArray]]))->all();

    return [
        'plain' => ['keys' => array_keys($plain['a']), 'kept' => $plain['a']['toArray'] === $toArray],
        'wrapped' => ['keys' => array_keys($wrapped['a']), 'kept' => $wrapped['a']['toArray'] === $toArray],
    ];
});
probe('replaceRecursive-list-collection-operand', "(new Collection([['a' => 1]]))->replaceRecursive(new Collection([['b' => 2]]))", fn () => (new Collection([['a' => 1]]))->replaceRecursive(new Collection([['b' => 2]]))->all());
probe('replaceRecursive-collection-operand', "(new Collection(['a' => ['x' => 1]]))->replaceRecursive(new Collection(['a' => ['y' => 2]]))", fn () => (new Collection(['a' => ['x' => 1]]))->replaceRecursive(new Collection(['a' => ['y' => 2]]))->all());
probe('replaceRecursive-list-string-key-replacer', "(new Collection(['a','b','c']))->replaceRecursive(['k' => 'x'])", fn () => (new Collection(['a', 'b', 'c']))->replaceRecursive(['k' => 'x'])->all());
probe('replaceRecursive-list-sparse-replacer', "(new Collection(['a']))->replaceRecursive([3 => 'd'])", fn () => (new Collection(['a']))->replaceRecursive([3 => 'd'])->all());
probe('replaceRecursive-list-mixed-key-replacer', "(new Collection(['a','b']))->replaceRecursive([1 => 'z', 'k' => 'x'])", fn () => (new Collection(['a', 'b']))->replaceRecursive([1 => 'z', 'k' => 'x'])->all());
probe('replaceRecursive-traversable-backing', "collect(gen(1,2))->replaceRecursive([0 => 9])", fn () => (new Collection(traversable()))->replaceRecursive([0 => 9])->all());
probe('replaceRecursive-list-out-of-order-operand', "(new Collection(['a']))->replaceRecursive([2 => 'c', 1 => 'b'])", fn () => arrayablePairs((new Collection(['a']))->replaceRecursive([2 => 'c', 1 => 'b'])->all()));
probe('replaceRecursive-list-in-order-operand', "(new Collection(['a']))->replaceRecursive([1 => 'b', 2 => 'c'])", fn () => arrayablePairs((new Collection(['a']))->replaceRecursive([1 => 'b', 2 => 'c'])->all()));

// ---- Family F ------------------------------------------------------------

$fViews = fn (Collection $c) => ['all' => $c->all(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all()];
probe('C32-F-replaceRecursive-sparse-replacer', "collect(['a', 'b', ['c', 'd']])->replaceRecursive(['z', 2 => [1 => 'e']])", fn () => collect(['a', 'b', ['c', 'd']])->replaceRecursive(['z', 2 => [1 => 'e']])->all());
probe('C32-F-replaceRecursive-assoc-then-list', "collect(['a' => 1])->replaceRecursive(['x'])", fn () => $fViews(collect(['a' => 1])->replaceRecursive(['x'])));

emit();
