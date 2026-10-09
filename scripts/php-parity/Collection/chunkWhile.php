<?php

/**
 * Ground truth for Collection::chunkWhile().
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

// Task 3/4/6 — Collection::chunkWhile (Collection.php:1554 → LazyCollection::chunkWhile) and
// EnumeratesValues::chunkBy (:939). Lists feed arr tests, assoc arrays feed obj tests, both feed collection.

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
probe('K2 chunkWhile callback key types', '(new Collection([\'a\' => 0, \'01\' => \'d\', \'1.5\' => \'x\', \'1e3\' => \'e\', \' 1\' => \'g\', \'-1\' => \'c\', \'10\' => \'f\']))->chunkWhile(fn ($v, $k) => true), recording [gettype($k), $k] per call', function () {
    $seen = [];
    (new Collection(['a' => 0, '01' => 'd', '1.5' => 'x', '1e3' => 'e', ' 1' => 'g', '-1' => 'c', '10' => 'f']))
        ->chunkWhile(function ($v, $k) use (&$seen) { $seen[] = [gettype($k), $k]; return true; });
    return $seen;
});

probe('chunkWhile-out-of-order-never', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunkWhile(fn () => false)", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->chunkWhile(fn () => false)));
probe('chunkWhile-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunkWhile(fn (\$v, \$k, \$chunk) => false) => [key, chunk] seen", fn () => chunkWhileSeen(OUT_OF_ORDER, false));
probe('chunkWhile-out-of-order-growing-chunk-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->chunkWhile(fn (\$v, \$k, \$chunk) => true) => [key, chunk] seen", fn () => chunkWhileSeen(OUT_OF_ORDER, true));
probe('chunkWhile-mixed-callback-order', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->chunkWhile(fn (\$v, \$k, \$chunk) => false) => [key, chunk] seen", fn () => chunkWhileSeen(MIXED, false));
probe('chunkWhile-out-of-order-last-equal', "(new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkWhile(fn (\$v, \$k, \$chunk) => \$chunk->last() === \$v)", fn () => arrayablePairs((new Collection([2 => 1, 0 => 1, 1 => 2]))->chunkWhile(fn ($v, $k, $chunk) => $chunk->last() === $v)));
probe('C32-G-chunkWhile-kept-chunk', "each \$chunk (new Collection([1, 2, 3]))->chunkWhile() hands its callback, kept, then \$kept[0]->push(99): the chunks, and what each kept chunk holds", function () {
    $kept = [];
    $chunks = (new Collection([1, 2, 3]))->chunkWhile(function ($value, $key, $chunk) use (&$kept) {
        $kept[] = $chunk;

        return true;
    });
    $kept[0]->push(99);

    return ['chunks' => $chunks->map(fn (Collection $chunk) => $chunk->all())->all(), 'kept' => array_map(fn (Collection $chunk) => $chunk->all(), $kept)];
});

emit();
