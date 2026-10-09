<?php

/**
 * Ground truth for Collection::push().
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

// B2 — push key classification
foreach (['01' => 'lead', '1e2' => 'exp', '-1' => 'neg', '5' => 'five'] as $k => $v) {
    probe("push onto a {\"{$k}\"}-keyed array", "collect([\"{$k}\"=>\"{$v}\"])->push(9)", fn () => collect([$k => $v])->push(9)->all());
}
probe('order-push', "\$c = collect(base); \$c->push('x')", function () {
    $c = collect(d8Base());
    $c->push('x');

    return d8Views($c);
});

// --- copy semantics (PHP arrays are values)
probe('C32-A-construct-from-collection-copies', '$a = collect([1, 2]); $b = new Collection($a); $b->push(3); [$a->all(), $b->all()]', function () { $a = collect([1, 2]); $b = new Collection($a); $b->push(3); return [$a->all(), $b->all()]; });
probe('C32-A-construct-from-array-copies', '$arr = [1, 2]; $c = new Collection($arr); $c->push(3); [$arr, $c->all()]', function () { $arr = [1, 2]; $c = new Collection($arr); $c->push(3); return [$arr, $c->all()]; });
probe('C32-A-make-collection-copies', '$a = collect([1]); $b = Collection::make($a); $b->push(2); [$a->all(), $b->all()]', function () { $a = collect([1]); $b = Collection::make($a); $b->push(2); return [$a->all(), $b->all()]; });

// --- iteration (foreach reads getIterator(), an ArrayIterator over a copy of the items)
probe('C32-A-iterator-is-a-snapshot', '$c = collect([1, 2]); foreach ($c as $v) { $seen[] = $v; if (count($seen) < 5) { $c->push(9); } } [$seen, $c->all()]', function () {
    $c = collect([1, 2]);
    $seen = [];

    foreach ($c as $v) {
        $seen[] = $v;

        if (count($seen) < 5) {
            $c->push(9);
        }
    }

    return [$seen, $c->all()];
});

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];
probe('C32-B-push-onto-string-keyed-last', "collect(['a' => 1])->push('z')->last()", fn () => collect(['a' => 1])->push('z')->last());
probe('C32-B-push-many-onto-string-keyed', "\$c = collect(['a' => 1])->push('y', 'z'); keys/values/last", function () { $c = collect(['a' => 1])->push('y', 'z'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-push-many-past-negative-keys-order', "\$c = collect([-2 => 'a'])->push('p', 'q', 'r'); keys/values/last", function () { $c = collect([-2 => 'a'])->push('p', 'q', 'r'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-push-many-onto-mixed-keys-order', "\$c = collect(['x' => 'a', -2 => 'b'])->push('p', 'q'); keys/values/last", function () { $c = collect(['x' => 'a', -2 => 'b'])->push('p', 'q'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-push-many-across-the-index-limit-order', "\$c = collect([4294967293 => 'a', 'x' => 'b'])->push('p', 'q'); keys/values/last", function () { $c = collect([4294967293 => 'a', 'x' => 'b'])->push('p', 'q'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-push-onto-string-keyed-toJson', "collect(['a' => 1])->push('z')->toJson()", fn () => collect(['a' => 1])->push('z')->toJson());

emit();
