<?php

/**
 * Ground truth for Collection::mergeRecursive().
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

// ---- Family F ------------------------------------------------------------

$fViews = fn (Collection $c) => ['all' => $c->all(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all()];
probe('C32-F-mergeRecursive-null-is-a-new-instance', '$a = collect([1]); $b = $a->mergeRecursive(null); $b->push(2);', function () { $a = collect([1]); $b = $a->mergeRecursive(null); $b->push(2); return ['same' => $a === $b, 'receiver' => $a->all(), 'result' => $b->all()]; });
probe('C32-F-mergeRecursive-null-renumbers', "collect([5 => 'a', 'k' => 'b'])->mergeRecursive(null)", fn () => $fViews(collect([5 => 'a', 'k' => 'b'])->mergeRecursive(null)));

// mergeRecursive: integer keys append at every depth; a leaf meeting an array joins it under the next int key
probe('C32-F-mergeRecursive-list-list-appends', 'collect([1, [2, 3]])->mergeRecursive([4, [5]])', fn () => collect([1, [2, 3]])->mergeRecursive([4, [5]])->all());
probe('C32-F-mergeRecursive-spec-merging-arrays', "collect([1, [4, 5, 7], ['b' => 4, 'c' => 5, 'd' => [8, 9], 'e' => ['x' => 1, 'y' => 2]]])->mergeRecursive(collect([2, [6, 8], ['b' => 5, 'c' => 6, 'd' => [10, 11], 'e' => ['x' => 3, 'z' => 4]], 3]))", fn () => collect([1, [4, 5, 7], ['b' => 4, 'c' => 5, 'd' => [8, 9], 'e' => ['x' => 1, 'y' => 2]]])->mergeRecursive(collect([2, [6, 8], ['b' => 5, 'c' => 6, 'd' => [10, 11], 'e' => ['x' => 3, 'z' => 4]], 3]))->all());
probe('C32-F-mergeRecursive-spec-target-longer', "collect([1, [2, 3, 4], ['a' => 7, 'b' => 8, 'c' => 9]])->mergeRecursive(collect([5, [6]]))", fn () => collect([1, [2, 3, 4], ['a' => 7, 'b' => 8, 'c' => 9]])->mergeRecursive(collect([5, [6]]))->all());
probe('C32-F-mergeRecursive-scalar-meets-assoc', "collect(['a' => 1])->mergeRecursive(['a' => ['x' => 1]])", fn () => $fViews(collect(collect(['a' => 1])->mergeRecursive(['a' => ['x' => 1]])->get('a'))));
probe('C32-F-mergeRecursive-assoc-meets-scalar', "collect(['a' => ['x' => 1]])->mergeRecursive(['a' => 2])", fn () => $fViews(collect(collect(['a' => ['x' => 1]])->mergeRecursive(['a' => 2])->get('a'))));
probe('C32-F-mergeRecursive-list-meets-assoc', "collect(['a' => [1, 2]])->mergeRecursive(['a' => ['x' => 3]])", fn () => $fViews(collect(collect(['a' => [1, 2]])->mergeRecursive(['a' => ['x' => 3]])->get('a'))));
probe('C32-F-mergeRecursive-nested-int-keys-append', "collect(['a' => [5 => 'p']])->mergeRecursive(['a' => [5 => 'q']])", fn () => $fViews(collect(collect(['a' => [5 => 'p']])->mergeRecursive(['a' => [5 => 'q']])->get('a'))));
probe('C32-F-mergeRecursive-scalar-operand', 'collect([1])->mergeRecursive(2)', fn () => collect([1])->mergeRecursive(2)->all());
probe('C32-F-mergeRecursive-spec-existing-and-new-keys', "collect(['a' => 5, 'b' => [3, 4], 'c' => ['z' => 5, 'y' => [9, 0]]])->mergeRecursive(collect(['a' => 6, 'b' => [5, 6], 'c' => ['z' => 6, 'y' => [10, 11]], 'd' => 'new']))", fn () => collect(['a' => 5, 'b' => [3, 4], 'c' => ['z' => 5, 'y' => [9, 0]]])->mergeRecursive(collect(['a' => 6, 'b' => [5, 6], 'c' => ['z' => 6, 'y' => [10, 11]], 'd' => 'new']))->all());
probe('C32-F-mergeRecursive-spec-object-and-arrays', "collect(['a' => 1, 'b' => [2, 3], 'c' => ['x' => 4, 'y' => 5]])->mergeRecursive(collect(['a' => [6, 7], 'b' => 4, 'c' => ['x' => [8, 9]]]))", fn () => collect(['a' => 1, 'b' => [2, 3], 'c' => ['x' => 4, 'y' => 5]])->mergeRecursive(collect(['a' => [6, 7], 'b' => 4, 'c' => ['x' => [8, 9]]]))->all());
probe('C32-F-mergeRecursive-spec-object-then-list', "collect(['a' => 1, 'b' => ['x' => 2, 'y' => 3], 'c' => [4, 5]])->mergeRecursive(collect([[6, 7], 4, ['x' => [8, 9]]]))", fn () => $fViews(collect(['a' => 1, 'b' => ['x' => 2, 'y' => 3], 'c' => [4, 5]])->mergeRecursive(collect([[6, 7], 4, ['x' => [8, 9]]]))));
probe('C32-F-mergeRecursive-list-meets-scalar', "collect(['a' => [1, 2, 3]])->mergeRecursive(collect(['a' => 4]))", fn () => collect(['a' => [1, 2, 3]])->mergeRecursive(collect(['a' => 4]))->all());
probe('C32-F-mergeRecursive-scalar-meets-list', "collect(['a' => 7])->mergeRecursive(collect(['a' => [1, 2, 3]]))", fn () => collect(['a' => 7])->mergeRecursive(collect(['a' => [1, 2, 3]]))->all());
probe('C32-F-mergeRecursive-null-meets-scalar', "collect(['a' => null])->mergeRecursive(['a' => 1])", fn () => collect(['a' => null])->mergeRecursive(['a' => 1])->all());
probe('C32-F-mergeRecursive-assoc-then-list', "collect(['a' => 1, 'b' => 2])->mergeRecursive([3, 4])", fn () => $fViews(collect(['a' => 1, 'b' => 2])->mergeRecursive([3, 4])));

emit();
