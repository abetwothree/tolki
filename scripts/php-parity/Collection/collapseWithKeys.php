<?php

/**
 * Ground truth for Collection::collapseWithKeys().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

// collapseWithKeys() with string outer keys (laravel/framework#61539); it used to crash.
probe('collapseWithKeys-string-keys', "(new Collection(['first' => ['a' => 1, 'b' => 2], 'second' => ['c' => 3]]))->collapseWithKeys()", fn () => pairs((new Collection(['first' => ['a' => 1, 'b' => 2], 'second' => ['c' => 3]]))->collapseWithKeys()));
probe('collapseWithKeys-mixed-keys', "(new Collection([5 => ['a' => 1], 'second' => new Collection(['b' => 2, 'a' => 3])]))->collapseWithKeys()", fn () => pairs((new Collection([5 => ['a' => 1], 'second' => new Collection(['b' => 2, 'a' => 3])]))->collapseWithKeys()));
probe('collapseWithKeys-string-keys-lists', "(new Collection(['first' => [1, 2], 'second' => [3]]))->collapseWithKeys()", fn () => pairs((new Collection(['first' => [1, 2], 'second' => [3]]))->collapseWithKeys()));
probe('C32-E-collapseWithKeys-int-key-order', "collect([[1=>'a'],[3=>'c'],[2=>'b'],'drop'])->collapseWithKeys()", fn () => c32e_pairs((new Collection([[1 => 'a'], [3 => 'c'], [2 => 'b'], 'drop']))->collapseWithKeys()));
probe('C32-E-collapseWithKeys-skips-object-item', "collect([[1, 2], new DateTime('@0')])->collapseWithKeys()", fn () => c32e_pairs((new Collection([[1, 2], new DateTime('@0')]))->collapseWithKeys()));
probe('C32-E-collapseWithKeys-out-of-order', "collect([2 => ['c' => 1], 0 => ['a' => 1], 1 => ['b' => 1]])->collapseWithKeys()", fn () => c32e_pairs((new Collection([2 => ['c' => 1], 0 => ['a' => 1], 1 => ['b' => 1]]))->collapseWithKeys()));
probe('C32-E-collapseWithKeys-collection-items', "collect([collect([2 => 'c', 0 => 'a'])]) and collect([collect([1, 2]), [3]]), each ->collapseWithKeys()", fn () => [
    'out-of-order' => c32e_pairs((new Collection([new Collection([2 => 'c', 0 => 'a'])]))->collapseWithKeys()),
    'collection-then-list' => c32e_pairs((new Collection([new Collection([1, 2]), [3]]))->collapseWithKeys()),
]);
probe('collapseWithKeys-mixed-collection-types', "(new Collection([new Collection(['a' => 1, 'b' => 2]), new LazyCollection(['b' => 3, 'c' => 4])]))->collapseWithKeys()", fn () => shown((new Collection([new Collection(['a' => 1, 'b' => 2]), new LazyCollection(['b' => 3, 'c' => 4])]))->collapseWithKeys()->all()));
probe('collapseWithKeys-lazy-lists', '(new Collection([new LazyCollection([1, 2]), [3]]))->collapseWithKeys()', fn () => shown((new Collection([new LazyCollection([1, 2]), [3]]))->collapseWithKeys()->all()));
probe('collapseWithKeys-lazy-only', "(new Collection([new LazyCollection(['a' => 1]), new LazyCollection(['a' => 2, 'b' => 3])]))->collapseWithKeys()", fn () => shown((new Collection([new LazyCollection(['a' => 1]), new LazyCollection(['a' => 2, 'b' => 3])]))->collapseWithKeys()->all()));
probe('collapseWithKeys-lazy-then-array', "(new Collection([new LazyCollection(['a' => 1, 'b' => 2]), ['b' => 9]]))->collapseWithKeys()", fn () => shown((new Collection([new LazyCollection(['a' => 1, 'b' => 2]), ['b' => 9]]))->collapseWithKeys()->all()));
probe('collapseWithKeys-lazy-int-keys', "(new Collection([[5 => 'a'], new LazyCollection([5 => 'b', 6 => 'c'])]))->collapseWithKeys()", fn () => shown((new Collection([[5 => 'a'], new LazyCollection([5 => 'b', 6 => 'c'])]))->collapseWithKeys()->all()));
probe('collapseWithKeys-array-item-all-member-is-data', "(new Collection([['all' => fn () => ['z' => 9], 'b' => 2]]))->collapseWithKeys()->keys()->all()", fn () => (new Collection([['all' => fn () => ['z' => 9], 'b' => 2]]))->collapseWithKeys()->keys()->all());
probe('collapseWithKeys-null-item', "(new Collection([null, ['a' => 1]]))->collapseWithKeys(), then (new Collection([null]))->collapseWithKeys()", fn () => [shown((new Collection([null, ['a' => 1]]))->collapseWithKeys()->all()), (new Collection([null]))->collapseWithKeys()->all()]);

emit();
