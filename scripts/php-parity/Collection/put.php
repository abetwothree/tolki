<?php

/**
 * Ground truth for Collection::put().
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

// put/offsetSet/getOrPut forward an unconstrained key into an ARRAY-backed
// collection, so "__proto__" reaches the array write too, not just the object one.
probe('"__proto__" is an ordinary key on an array-backed collection too', 'collect([1,2])->put("__proto__", ["polluted" => true])', function () {
    $put = new Collection([1, 2]);
    $put->put('__proto__', ['polluted' => true]);

    $index = new Collection([1, 2]);
    $index->put(2, 3);

    $getOrPut = new Collection([1, 2]);
    $getOrPut->getOrPut('__proto__', ['polluted' => true]);

    return [
        'list_put_proto' => $put->all(),
        'list_put_proto_still_maps' => $put->map(fn ($v) => $v)->all(),
        'list_put_index' => $index->all(),
        'list_get_or_put_proto' => $getOrPut->all(),
    ];
});

// B9 — "length" is an ordinary key in PHP
probe('put uses "length" as an ordinary key', 'collect([1,2])->put("length",5)', fn () => collect([1, 2])->put('length', 5)->all());
probe('order-put', "\$c = collect(base); \$c->put('k', 'z')", function () {
    $c = collect(d8Base());
    $c->put('k', 'z');

    return d8Views($c);
});
probe('order-put-existing-key', "\$c = collect(base); \$c->put(0, 'z')", function () {
    $c = collect(d8Base());
    $c->put(0, 'z');

    return d8Views($c);
});
probe('C32-A-construct-from-record-put-copies', "\$arr = ['a' => 1]; \$c = new Collection(\$arr); \$c->put('b', 2); caller/all/keys/values", function () { $arr = ['a' => 1]; $c = new Collection($arr); $c->put('b', 2); return ['caller' => $arr, 'all' => $c->all(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all()]; });

// --- count / isEmpty
probe('C32-A-isEmpty-after-put-on-empty-list', "collect([])->put('x', 1)->isEmpty()", fn () => collect([])->put('x', 1)->isEmpty());

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];

probe('C32-B-put-string-key-on-list', "\$c = collect([1, 2]); \$c->put('x', 3); views", function () use ($views) { $c = collect([1, 2]); $c->put('x', 3); return $views($c, 'x'); });
probe('C32-B-put-string-key-on-empty', "\$c = collect(); \$c->put('foo', 1); views", function () use ($views) { $c = collect(); $c->put('foo', 1); return $views($c, 'foo'); });
probe('C32-B-put-gap-int-key-on-list', "\$c = collect([1, 2]); \$c->put(5, 3); views", function () use ($views) { $c = collect([1, 2]); $c->put(5, 3); return $views($c, 5); });
probe('C32-B-put-negative-key-on-list', "\$c = collect([1, 2]); \$c->put(-1, 3); views", function () use ($views) { $c = collect([1, 2]); $c->put(-1, 3); return $views($c, -1); });
probe('C32-B-put-non-canonical-int-string-on-list', "\$c = collect([1, 2]); \$c->put('01', 3); views", function () use ($views) { $c = collect([1, 2]); $c->put('01', 3); return $views($c, '01'); });
probe('C32-B-put-float-key-on-list', "\$c = collect([1, 2]); @\$c->put(1.5, 3); \$c->all()", function () { $c = collect([1, 2]); @$c->put(1.5, 3); return $c->all(); });
probe('C32-B-put-bool-key-on-list', "\$c = collect([1, 2]); \$c->put(true, 3); \$c->all()", function () { $c = collect([1, 2]); $c->put(true, 3); return $c->all(); });
probe('C32-B-put-length-zero-on-list', "\$c = collect([1, 2]); \$c->put('length', 0); views", function () use ($views) { $c = collect([1, 2]); $c->put('length', 0); return $views($c, 'length'); });
probe('C32-B-put-method-name-then-push', "\$c = collect([1, 2]); \$c->put('push', 9)->push(3); \$c->all()", function () { $c = collect([1, 2]); $c->put('push', 9)->push(3); return $c->all(); });
probe('C32-B-put-string-key-then-pop', "\$c = collect([1, 2]); \$c->put('x', 3); \$c->pop()", function () { $c = collect([1, 2]); $c->put('x', 3); return ['returned' => $c->pop(), 'all' => $c->all()]; });
probe('C32-B-put-string-key-then-shift', "\$c = collect([1, 2]); \$c->put('x', 3); \$c->shift()", function () { $c = collect([1, 2]); $c->put('x', 3); return ['returned' => $c->shift(), 'all' => $c->all()]; });
probe('C32-B-put-string-key-then-push', "\$c = collect([1, 2]); \$c->put('x', 3)->push(4); \$c->all()", function () { $c = collect([1, 2]); $c->put('x', 3)->push(4); return $c->all(); });
probe('C32-B-put-string-key-then-transform', "\$c = collect([1, 2]); \$c->put('x', 3)->transform(fn (\$v) => \$v * 10)->all()", fn () => collect([1, 2])->put('x', 3)->transform(fn ($v) => $v * 10)->all());
probe('C32-B-put-int-key-onto-string-keyed-order', "\$c = collect(['a' => 1]); \$c->put(0, 'z'); keys/values/last", function () { $c = collect(['a' => 1]); $c->put(0, 'z'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });

// keys no PHP array can hold: each call over a list and a keyed backing, and what each holds after
$overBackings = fn (callable $call) => array_map(fn (Collection $c) => ['outcome' => c32c_outcome(fn () => $call($c)), 'all' => $c->all()], [collect(['a', 'b']), collect(['a' => 1, 'b' => 2])]);
$illegalKeys = ['array' => ['a'], 'object' => new stdClass, 'closure' => fn () => 1];
probe('C32-B-put-illegal-key', "put(\$key, 9) and offsetSet(\$key, 9) over collect(['a', 'b']) and collect(['a' => 1, 'b' => 2]), for \$key = ['a'], new stdClass and fn () => 1", fn () => array_map(fn ($key) => [
    'put' => $overBackings(fn (Collection $c) => $c->put($key, 9)->all()),
    'offsetSet' => $overBackings(fn (Collection $c) => $c->offsetSet($key, 9)),
], $illegalKeys));

emit();
