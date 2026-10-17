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
probe('C32-B-push-onto-string-keyed-last', "collect(['a' => 1])->push('z')->last()", fn () => collect(['a' => 1])->push('z')->last());
probe('C32-B-push-many-onto-string-keyed', "\$c = collect(['a' => 1])->push('y', 'z'); keys/values/last", function () { $c = collect(['a' => 1])->push('y', 'z'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-push-many-past-negative-keys-order', "\$c = collect([-2 => 'a'])->push('p', 'q', 'r'); keys/values/last", function () { $c = collect([-2 => 'a'])->push('p', 'q', 'r'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-push-many-onto-mixed-keys-order', "\$c = collect(['x' => 'a', -2 => 'b'])->push('p', 'q'); keys/values/last", function () { $c = collect(['x' => 'a', -2 => 'b'])->push('p', 'q'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-push-many-across-the-index-limit-order', "\$c = collect([4294967293 => 'a', 'x' => 'b'])->push('p', 'q'); keys/values/last", function () { $c = collect([4294967293 => 'a', 'x' => 'b'])->push('p', 'q'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-push-onto-string-keyed-toJson', "collect(['a' => 1])->push('z')->toJson()", fn () => collect(['a' => 1])->push('z')->toJson());

emit();
