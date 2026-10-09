<?php

/**
 * Ground truth for Collection::chunkBy().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

$calls = [];
(new Collection([10, 11, 20]))->chunkWhile(function ($v, $k, $chunk) use (&$calls) {
    $calls[] = [$v, $k, $chunk->toArray()];

    return $chunk->last() + 1 === $v;
});

$calls = [];
(new Collection(['x' => 10, 'y' => 11, 'z' => 20]))->chunkWhile(function ($v, $k, $chunk) use (&$calls) {
    $calls[] = [$v, $k, $chunk->toArray()];

    return $chunk->last() + 1 === $v;
});

// chunkBy — the six CollectionTest cases plus loose comparison, missing keys and the callback's key argument.
probe('chunkBy with a callback', '[1,1,2,2,3,3,3] chunkBy(identity)', fn () => (new Collection([1, 1, 2, 2, 3, 3, 3]))->chunkBy(fn ($v) => $v)->toArray());
// valueRetriever(null) -> fn ($item) => data_get($item, null), and data_get() with a null key
// returns $item itself, so a null key behaves exactly like the identity callback above. PHP has
// no `undefined`; this one probe stands in for both `null` and `undefined` on the TypeScript side.
probe('chunkBy with a null key falls back to identity comparison, like a callback', '[1,1,2,2,3] chunkBy(null)',
    fn () => (new Collection([1, 1, 2, 2, 3]))->chunkBy(null)->toArray());
probe('chunkBy with a string key', "products chunkBy('parent')", fn () => (new Collection([
    ['parent' => 'a', 'name' => '1'], ['parent' => 'a', 'name' => '2'],
    ['parent' => 'b', 'name' => '3'], ['parent' => 'b', 'name' => '4'],
    ['parent' => 'a', 'name' => '5'],
]))->chunkBy('parent')->toArray());
probe('chunkBy with a bare string key (assoc)', "['p'=>['parent'=>'a'],'q'=>['parent'=>'a'],'r'=>['parent'=>'b']] chunkBy('parent')", fn () => (new Collection([
    'p' => ['parent' => 'a'],
    'q' => ['parent' => 'a'],
    'r' => ['parent' => 'b'],
]))->chunkBy('parent')->toArray());
probe('chunkBy preserves keys', "['a'=>1,'b'=>1,'c'=>2,'d'=>2,'e'=>1] chunkBy(identity)",
    fn () => (new Collection(['a' => 1, 'b' => 1, 'c' => 2, 'd' => 2, 'e' => 1]))->chunkBy(fn ($v) => $v)->toArray());
probe('chunkBy with dot notation (list of objects)', "[{address:{city:NY}},{…NY},{…LA}] chunkBy('address.city')", fn () => (new Collection([
    (object) ['address' => (object) ['city' => 'NY']],
    (object) ['address' => (object) ['city' => 'NY']],
    (object) ['address' => (object) ['city' => 'LA']],
]))->chunkBy('address.city')->map(fn ($chunk) => $chunk->count())->toArray());
probe('chunkBy with dot notation (assoc of arrays)', "['p'=>…NY,'q'=>…NY,'r'=>…LA] chunkBy('address.city')", fn () => (new Collection([
    'p' => ['address' => ['city' => 'NY']],
    'q' => ['address' => ['city' => 'NY']],
    'r' => ['address' => ['city' => 'LA']],
]))->chunkBy('address.city')->toArray());
probe('chunkBy on an empty collection', "[] chunkBy('key')", fn () => (new Collection([]))->chunkBy('key')->toArray());
probe('chunkBy with a single item', "[['key'=>'a']] chunkBy('key')", fn () => (new Collection([['key' => 'a']]))->chunkBy('key')->toArray());
probe('chunkBy compares with loose ==', '[1,"1",2,"2",null,0,"",false,"a","A"] chunkBy(identity)',
    fn () => (new Collection([1, '1', 2, '2', null, 0, '', false, 'a', 'A']))->chunkBy(fn ($v) => $v)->toArray());
probe('chunkBy compares with loose == (assoc)', "['a'=>1,'b'=>'1','c'=>2,'d'=>'2','e'=>null,'f'=>0,'g'=>'','h'=>false,'i'=>'a','j'=>'A'] chunkBy(identity)",
    fn () => (new Collection(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => null, 'f' => 0, 'g' => '', 'h' => false, 'i' => 'a', 'j' => 'A']))->chunkBy(fn ($v) => $v)->toArray());
probe('chunkBy on a key none of the items have', "[['x'=>1],['y'=>2],['x'=>1]] chunkBy('key')",
    fn () => (new Collection([['x' => 1], ['y' => 2], ['x' => 1]]))->chunkBy('key')->toArray());
probe('chunkBy callback receives the key too (assoc)', "['a'=>1,'b'=>1,'c'=>1] chunkBy(key === 'b' ? 'x' : 'y')",
    fn () => (new Collection(['a' => 1, 'b' => 1, 'c' => 1]))->chunkBy(fn ($v, $k) => $k === 'b' ? 'x' : 'y')->toArray());
probe('chunkBy callback receives the index too (list)', '[1,1,1] chunkBy(index === 1 ? "x" : "y")',
    fn () => (new Collection([1, 1, 1]))->chunkBy(fn ($v, $k) => $k === 1 ? 'x' : 'y')->toArray());
probe('chunkBy outer keys are a list', "['a'=>1,'b'=>2] chunkBy(identity) keys",
    fn () => (new Collection(['a' => 1, 'b' => 2]))->chunkBy(fn ($v) => $v)->keys()->toArray());
probe('L7 chunkBy single item assoc', '(new Collection([\'x\' => [\'key\' => \'a\']]))->chunkBy(\'key\')->map->all()->all()', fn () => (new Collection(['x' => ['key' => 'a']]))->chunkBy('key')->map->all()->all());
// ---- callback key types: PHP hands a callback an integer key as an int
$keyTypes = function (callable $run, mixed $result = true): array {
    $seen = [];

    try {
        $run(function ($value, $key) use (&$seen, $result) {
            $seen[] = gettype($key);

            return $result;
        });
    } catch (\Throwable) {
    }

    return $seen;
};

// ==== Task 11 fix group C: pins for behaviour changes nothing pinned yet
probe('chunkBy-noncanonical-key-type', "(new Collection(['01' => 'a', 'x' => 'b']))->chunkBy(fn (\$v, \$k) => [gettype(\$k), \$k]): the key on each call", function () {
    $seen = [];
    (new Collection(['01' => 'a', 'x' => 'b']))->chunkBy(function ($v, $k) use (&$seen) {
        $seen[] = [gettype($k), $k];

        return $k;
    });

    return $seen;
});

probe('chunkBy-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunkBy(fn (\$v, \$k) => \$v)", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->chunkBy(fn ($v, $k) => $v)));
probe('chunkBy-out-of-order-runs', "(new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkBy(fn (\$v, \$k) => \$v)", fn () => arrayablePairs((new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkBy(fn ($v, $k) => $v)));
probe('chunkBy-out-of-order-runs-callback-order', "(new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkBy(fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkBy($cb), fn ($v) => $v));
probe('chunkBy-mixed-runs-callback-order', "(new Collection(['x' => 1, 0 => 1, 'y' => 2]))->chunkBy(fn (\$v, \$k) => \$v) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(['x' => 1, 0 => 1, 'y' => 2]))->chunkBy($cb), fn ($v) => $v));
probe('chunkBy-mixed-runs', "(new Collection(['x' => 1, 0 => 1, 'y' => 2]))->chunkBy(fn (\$v, \$k) => \$v)", fn () => arrayablePairs((new Collection(['x' => 1, 0 => 1, 'y' => 2]))->chunkBy(fn ($v, $k) => $v)));

emit();
