<?php

/**
 * Ground truth for Collection::pull().
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

probe('pull removes and returns the value', 'collect([10,20,30,40])->pull(1)', function () {
    $c = new Collection(nums());
    $pulled = $c->pull(1);

    return ['pulled' => $pulled, 'after' => $c->all()];
});

// ==== the two writers D8's mutator sweep did not reach ====
probe('order-pull', '$c = collect(base); $returned = $c->pull(0)', function () {
    $c = collect(d8Base());
    $returned = $c->pull(0);

    return ['returned' => $returned] + d8Views($c);
});
probe('C32-B-pull-string-index-on-list', "\$c = collect(['a', 'b', 'c']); \$c->pull('1')", function () { $c = collect(['a', 'b', 'c']); return ['returned' => $c->pull('1'), 'all' => $c->all(), 'count' => $c->count()]; });
probe('C32-B-pull-missing-on-list-keeps-list', "\$c = collect(['foo', 'bar']); \$c->pull(2); \$c->pull(-1)", function () { $c = collect(['foo', 'bar']); $a = $c->pull(2); $b = $c->pull(-1); return ['returned' => [$a, $b], 'all' => $c->all(), 'json' => $c->toJson()]; });
probe('C32-B-pull-keeps-sibling-collections', "\$c = collect(['a' => collect([1]), 'b' => 2]); \$c->pull('b')", function () { $c = collect(['a' => collect([1]), 'b' => 2]); $c->pull('b'); return $c->get('a') instanceof Collection; });
probe('C32-B-pull-returns-stored-collection', "collect(['a' => collect(['x' => 1])])->pull('a') instanceof Collection", fn () => collect(['a' => collect(['x' => 1])])->pull('a') instanceof Collection);
probe('C32-B-pull-dot-into-nested-collection', "\$c = collect(['a' => collect(['x' => 1, 'y' => 2])]); \$c->pull('a.x')", function () { $c = collect(['a' => collect(['x' => 1, 'y' => 2])]); $r = $c->pull('a.x'); return ['returned' => $r, 'nestedIsCollection' => $c->get('a') instanceof Collection, 'toArray' => $c->toArray()]; });
probe('C32-B-pull-null-key', "\$c = collect([1, 2]); \$c->pull(null)", function () { $c = collect([1, 2]); $r = $c->pull(null); return ['returned' => $r, 'all' => $c->all()]; });
// PHP takes an ArrayAccess element by value there, so the unset only reaches a copy; the notice is silenced.
probe('C32-B-pull-array-inside-collection-stays', "\$c = collect(['a' => collect(['x' => ['y' => 1, 'z' => 2]])]); @\$c->pull('a.x.y')", function () { $c = collect(['a' => collect(['x' => ['y' => 1, 'z' => 2]])]); $r = @$c->pull('a.x.y'); return ['returned' => $r, 'toArray' => $c->toArray()]; });
probe('C32-B-pull-dot-path-inside-collection-per-segment', "\$c = collect(['a' => collect(['x.y' => 1])]); \$c->pull('a.x.y')", function () { $c = collect(['a' => collect(['x.y' => 1])]); $r = $c->pull('a.x.y'); return ['returned' => $r, 'toArray' => $c->toArray()]; });
probe('C32-B-pull-through-array-into-collection', "\$c = collect(['a' => ['b' => collect(['x' => 1, 'y' => 2])]]); \$c->pull('a.b.x')", function () { $c = collect(['a' => ['b' => collect(['x' => 1, 'y' => 2])]]); $r = $c->pull('a.b.x'); return ['returned' => $r, 'toArray' => $c->toArray()]; });
probe('C32-B-pull-through-array-keeps-the-collection', "\$c = collect(['a' => ['b' => collect(['x' => 1])]]); \$c->pull('a.b.x'); \$c->get('a')['b'] instanceof Collection", function () { $c = collect(['a' => ['b' => collect(['x' => 1])]]); $c->pull('a.b.x'); return $c->get('a')['b'] instanceof Collection; });
probe('C32-B-pull-float-key-exists-as-its-string-form', "@pull(1.5) on collect(['a', 'b', 'c']) and on collect(['1.5' => 'x', 1 => 'y'])", function () {
    $list = collect(['a', 'b', 'c']);
    $record = collect(['1.5' => 'x', 1 => 'y']);

    return [
        'list' => ['returned' => @$list->pull(1.5), 'all' => $list->all()],
        'record' => ['returned' => @$record->pull(1.5), 'all' => $record->all()],
    ];
});

// pull: a dot path read and removed through the array an item holds
probe('C32-B-pull-dot-path-through-nested-arrays', "pull('a.b'), pull('a.b.c'), pull('a.2') and pull('a.z', 'd') through the array under 'a': what each returns, and the keys and values 'a' holds after", fn () => array_map(function (array $call) {
    [$items, $key, $default] = $call;
    $c = collect($items);
    $returned = $c->pull($key, $default);

    return ['returned' => $returned, 'keys' => array_keys($c->get('a')), 'values' => array_values($c->get('a'))];
}, [
    [['a' => ['b' => 1, 'c' => 2]], 'a.b', null],
    [['a' => ['b' => ['c' => 1, 'd' => 2]]], 'a.b.c', null],
    [['a' => [2 => 'x', 0 => 'y', 1 => 'z']], 'a.2', null],
    [['a' => ['b' => 1]], 'a.z', 'd'],
]));
probe('C32-B-pull-dot-path-missing-below-nested-array', "\$c = collect(['a' => ['b' => ['c' => 1]]]); \$c->pull('a.b.z', 'd'), and what 'a' holds after", function () { $c = collect(['a' => ['b' => ['c' => 1]]]); $returned = $c->pull('a.b.z', 'd'); return ['returned' => $returned, 'a' => $c->get('a')]; });

// keys no PHP array can hold: each call over a list and a keyed backing, and what each holds after
$overBackings = fn (callable $call) => array_map(fn (Collection $c) => ['outcome' => c32c_outcome(fn () => $call($c)), 'all' => $c->all()], [collect(['a', 'b']), collect(['a' => 1, 'b' => 2])]);
$illegalKeys = ['array' => ['a'], 'object' => new stdClass, 'closure' => fn () => 1];
probe('C32-B-pull-illegal-key', "pull(\$key) over both backings, for \$key = ['a'], new stdClass and fn () => 1", fn () => array_map(fn ($key) => $overBackings(fn (Collection $c) => $c->pull($key)), $illegalKeys));

emit();
