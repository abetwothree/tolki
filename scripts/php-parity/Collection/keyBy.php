<?php

/**
 * Ground truth for Collection::keyBy().
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

// PHP has no inherited __proto__ setter, so "__proto__" is an ordinary string
// key everywhere. Each row is a Collection method that builds a keyed result.
probe('"__proto__" is an ordinary array key in every keyed Collection result', 'collect([["k"=>"__proto__"]])->keyBy("k")', function () {
    $hostile = static fn (): array => ['a' => 1, '__proto__' => ['polluted' => true], 'c' => 3];

    return [
        'keyBy' => (new Collection([['k' => '__proto__', 'v' => 1]]))->keyBy('k')->all(),
        'groupBy' => (new Collection([['k' => '__proto__']]))->groupBy('k')->toArray(),
        'groupBy_preserve_keys' => (new Collection(['__proto__' => ['k' => 'z']]))->groupBy('k', true)->toArray(),
        'countBy' => (new Collection(['__proto__']))->countBy()->all(),
        'mapToDictionary' => (new Collection([['n' => '__proto__', 'i' => 1]]))->mapToDictionary(fn ($x) => [$x['n'] => $x['i']])->all(),
        'sortKeys' => (new Collection($hostile()))->sortKeys()->all(),
        'sortKeysUsing' => (new Collection($hostile()))->sortKeysUsing(fn ($a, $b) => strcmp((string) $a, (string) $b))->all(),
        'unshift' => (new Collection($hostile()))->unshift(9)->all(),
        'mergeRecursive' => (new Collection(['z' => 1]))->mergeRecursive($hostile())->all(),
        'mergeRecursive_nested' => (new Collection(['z' => ['q' => 1]]))->mergeRecursive(['z' => ['__proto__' => ['polluted' => true]]])->all(),
        'diffAssoc' => (new Collection($hostile()))->diffAssoc([])->all(),
        'diffKeys' => (new Collection($hostile()))->diffKeys([])->all(),
        'diffUsing' => (new Collection($hostile()))->diffUsing([], fn ($a, $b) => 1)->all(),
        'duplicates' => (new Collection(['a' => 1, '__proto__' => 1, 'c' => 3]))->duplicates()->all(),
        'offsetSet' => (static function () {
            $c = new Collection(['a' => 1]);
            $c['__proto__'] = 2;

            return $c->all();
        })(),
        'pull_leaves_the_rest' => (static function () use ($hostile) {
            $c = new Collection($hostile());
            $c->pull('nope');

            return $c->all();
        })(),
    ];
});
probe('collection-keyBy-scalar-key-cast', "(new Collection(['a' => ['k' => true], 'b' => ['k' => false], 'c' => ['k' => null]]))->keyBy('k') and @(new Collection([['v' => 1]]))->keyBy(fn () => 2.5): the keys", fn () => [
    'field' => array_keys((new Collection(['a' => ['k' => true], 'b' => ['k' => false], 'c' => ['k' => null]]))->keyBy('k')->all()),
    'float' => array_keys(@(new Collection([['v' => 1]]))->keyBy(fn () => 2.5)->all()),
]);

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
probe('C32-E-keyBy-int-key-order', "collect([['id'=>3],['id'=>1],['id'=>2]])->keyBy('id')->keys()", fn () => (new Collection([['id' => 3], ['id' => 1], ['id' => 2]]))->keyBy('id')->keys()->all());
probe('C32-E-keyBy-enum-keys', "keyBy over int-backed B then A, and keyBy(fn => pure A)", fn () => ['int' => c32e_pairs((new Collection([['id' => 1, 's' => C32E_Int::B], ['id' => 2, 's' => C32E_Int::A]]))->keyBy('s')->map(fn ($r) => $r['id'])), 'pure' => (new Collection([1]))->keyBy(fn () => C32E_Pure::A)->keys()->all()]);
probe('C32-E-keyBy-stringable-keys', "keyBy(fn => object with __toString) and keyBy(fn => new Stringable('Lara'))", fn () => ['toString' => (new Collection([1]))->keyBy(fn () => new class { public function __toString() { return 'Framework'; } })->keys()->all(), 'stringable' => (new Collection([1]))->keyBy(fn () => new Stringable('Lara'))->keys()->all()]);
probe('C32-E-keyBy-callback-key-type', "collect([1 => 'a', 'x' => 'b'])->keyBy(fn (\$v, \$k) => \$v.':'.gettype(\$k))->keys()", fn () => (new Collection([1 => 'a', 'x' => 'b']))->keyBy(fn ($v, $k) => $v.':'.gettype($k))->keys()->all());
probe('C32-E-keyBy-array-path', "collect([['a'=>['b'=>'z']]])->keyBy(['a','b']) and collect([['id'=>1,'name'=>'John']])->keyBy(['id','name'])", fn () => ['nested' => (new Collection([['a' => ['b' => 'z']]]))->keyBy(['a', 'b'])->keys()->all(), 'jsdoc' => (new Collection([['id' => 1, 'name' => 'John']]))->keyBy(['id', 'name'])->keys()->all()]);
probe('C32-E-keyBy-collection-rows', "c32c_rows(list | keyed)->keyBy('k'): each row's 'v'", fn () => array_map(fn (bool $keyed) => c32c_rows($keyed)->keyBy('k')->map(fn (Collection $row) => $row['v'])->all(), ['list' => false, 'keyed' => true]));

// A computed key PHP cannot store throws; the message depends on how each method writes the key.
probe('C32-E-keyBy-array-key', "(new Collection([1]))->keyBy(fn () => [1, 2])", fn () => (new Collection([1]))->keyBy(fn () => [1, 2])->all());
probe('C32-E-keyBy-assoc-key', "(new Collection([1]))->keyBy(fn () => ['a' => 1])", fn () => (new Collection([1]))->keyBy(fn () => ['a' => 1])->all());
probe('C32-E-keyBy-date-key', "(new Collection([1]))->keyBy(fn () => new DateTime('@0'))", fn () => (new Collection([1]))->keyBy(fn () => new DateTime('@0'))->all());
probe('C32-E-keyed-results-out-of-order-receiver', "a receiver whose integer keys run 2, 0: keyBy('id'), groupBy('g') and countBy() keys, mapToDictionary(fn => [\$v => \$k]), and flip() over 'x', 'y', 'x'", fn () => [
    'keyBy' => (new Collection([2 => ['id' => 5], 0 => ['id' => 4]]))->keyBy('id')->keys()->all(),
    'groupBy' => (new Collection([2 => ['g' => 5], 0 => ['g' => 4]]))->groupBy('g')->keys()->all(),
    'countBy' => (new Collection([2 => 5, 0 => 4]))->countBy()->keys()->all(),
    'mapToDictionary' => c32e_pairs((new Collection([2 => 5, 0 => 4]))->mapToDictionary(fn ($v, $k) => [$v => $k])),
    'flip' => c32e_pairs((new Collection([2 => 'x', 0 => 'y', 1 => 'x']))->flip()),
]);

emit();
