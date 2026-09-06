<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Collection;

// Task 3/4/6 — Collection::chunkWhile (Collection.php:1541 → LazyCollection::chunkWhile) and
// EnumeratesValues::chunkBy (:937). Lists feed arr tests, assoc arrays feed obj tests, both feed collection.

// chunkWhile — the three CollectionTest cases plus the shape of the callback's arguments.
probe('chunkWhile on equal adjacent elements', "['A','A','B','B','C','C','C'] chunkWhile(last === current)",
    fn () => (new Collection(['A', 'A', 'B', 'B', 'C', 'C', 'C']))->chunkWhile(fn ($v, $k, $chunk) => $chunk->last() === $v)->toArray());
probe('chunkWhile on contiguously increasing integers', '[1,4,9,10,11,12,15,16,19,20,21] chunkWhile(last + 1 == current)',
    fn () => (new Collection([1, 4, 9, 10, 11, 12, 15, 16, 19, 20, 21]))->chunkWhile(fn ($v, $k, $chunk) => $chunk->last() + 1 == $v)->toArray());
probe('chunkWhile preserving string keys', "['a'=>1,'b'=>1,'c'=>2,'d'=>2,'e'=>3,'f'=>3,'g'=>3] chunkWhile(last === current)",
    fn () => (new Collection(['a' => 1, 'b' => 1, 'c' => 2, 'd' => 2, 'e' => 3, 'f' => 3, 'g' => 3]))->chunkWhile(fn ($v, $k, $chunk) => $chunk->last() === $v)->toArray());
probe('chunkWhile on an empty collection', '[] chunkWhile(true)', fn () => (new Collection([]))->chunkWhile(fn () => true)->toArray());
probe('chunkWhile on a single item never calls back', '[5] chunkWhile(false)', fn () => (new Collection([5]))->chunkWhile(fn () => false)->toArray());
probe('chunkWhile always false splits every item', '[1,2,3] chunkWhile(false)', fn () => (new Collection([1, 2, 3]))->chunkWhile(fn () => false)->toArray());
probe('chunkWhile always true keeps one chunk', '[1,2,3] chunkWhile(true)', fn () => (new Collection([1, 2, 3]))->chunkWhile(fn () => true)->toArray());

$calls = [];
(new Collection([10, 11, 20]))->chunkWhile(function ($v, $k, $chunk) use (&$calls) {
    $calls[] = [$v, $k, $chunk->toArray()];

    return $chunk->last() + 1 === $v;
});
probe('chunkWhile callback receives value, key and the chunk so far (list)', '[10,11,20] chunkWhile(record args)', fn () => $calls);

$calls = [];
(new Collection(['x' => 10, 'y' => 11, 'z' => 20]))->chunkWhile(function ($v, $k, $chunk) use (&$calls) {
    $calls[] = [$v, $k, $chunk->toArray()];

    return $chunk->last() + 1 === $v;
});
probe('chunkWhile callback receives value, key and the chunk so far (assoc)', "['x'=>10,'y'=>11,'z'=>20] chunkWhile(record args)", fn () => $calls);

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

emit();
