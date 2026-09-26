<?php

/**
 * Ground truth for the @tolki/collection release-readiness pass (C32-<family>-* rows).
 *
 * Families: A construction/output, B keyed access/mutation, C predicates/search, D filtering/subsets,
 * E mapping/grouping, F set operations, G slicing/ordering, H aggregates/pipeline.
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require_once repoRoot() . '/packages/collection/stubs/Common.php';

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

// ---- Family A ------------------------------------------------------------

class C32ASub extends Collection {}
class C32AArrayableAndJsonSerializable implements Arrayable, JsonSerializable {
    public function toArray() { return ['from' => 'toArray']; }
    public function jsonSerialize(): mixed { return ['from' => 'jsonSerialize']; }
}
class C32AArrayableAndJsonable implements Arrayable, Jsonable {
    public function toArray() { return ['from' => 'toArray']; }
    public function toJson($options = 0) { return '{"from":"toJson"}'; }
}
class C32ABadJsonable implements Jsonable {
    public function toJson($options = 0) { return 'not-json'; }
}
class C32AThrowingJsonable implements Jsonable {
    public function toJson($options = 0) { throw new RuntimeException('toJson failed'); }
}
class C32AJsonSerializeToString implements JsonSerializable {
    public function jsonSerialize(): string { return 'foobar'; }
}
class C32AParent {}
class C32AChild extends C32AParent {}

// --- construction (getArrayableItems)
probe('C32-A-construct-false', 'new Collection(false)', fn () => (new Collection(false))->all());
probe('C32-A-construct-zero', 'new Collection(0)', fn () => (new Collection(0))->all());
probe('C32-A-construct-empty-string', "new Collection('')", fn () => (new Collection(''))->all());
probe('C32-A-construct-traversable-list', 'new Collection(new ArrayObject([1, 2, 3]))', fn () => (new Collection(new ArrayObject([1, 2, 3])))->all());
probe('C32-A-construct-traversable-keyed', "new Collection(new ArrayObject(['foo' => 1, 'bar' => 2, 'baz' => 3]))", fn () => (new Collection(new ArrayObject(['foo' => 1, 'bar' => 2, 'baz' => 3])))->all());
probe('C32-A-construct-generator-list', 'new Collection((function () { yield 1; yield 2; })())', fn () => (new Collection((function () { yield 1; yield 2; })()))->all());
probe('C32-A-construct-stdclass', "new Collection((object) ['foo' => 'bar'])", fn () => (new Collection((object) ['foo' => 'bar']))->all());
probe('C32-A-construct-jsonable', 'new Collection(new TestJsonableObject)', fn () => (new Collection(new TestJsonableObject))->all());
probe('C32-A-construct-jsonable-toJson-throws', 'new Collection(new C32AThrowingJsonable)', fn () => (new Collection(new C32AThrowingJsonable))->all());
probe('C32-A-construct-jsonserializable', 'new Collection(new TestJsonSerializeObject)', fn () => (new Collection(new TestJsonSerializeObject))->all());
probe('C32-A-construct-jsonserializable-scalar', 'new Collection(new TestJsonSerializeWithScalarValueObject)', fn () => (new Collection(new TestJsonSerializeWithScalarValueObject))->all());
probe('C32-A-construct-arrayable-keyed', 'new Collection(new TestArrayableObject)', fn () => (new Collection(new TestArrayableObject))->all());
probe('C32-A-construct-traversable-beats-jsonserializable', "new Collection(new TestTraversableAndJsonSerializableObject(['a' => 1, 'b' => 2]))", fn () => (new Collection(new TestTraversableAndJsonSerializableObject(['a' => 1, 'b' => 2])))->all());
probe('C32-A-construct-colliding-keys', "keys, values and count of new Collection([true => 'a', 1 => 'b', 0 => 'z']), [null => 'n', '' => 'e'] and [1.5 => 'f', 1 => 'i']", fn () => array_map(fn (Collection $c) => ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'count' => $c->count()], [
    'bool' => new Collection([true => 'a', 1 => 'b', 0 => 'z']),
    'null' => @(new Collection([null => 'n', '' => 'e'])),
    'float' => @(new Collection([1.5 => 'f', 1 => 'i'])),
]));

// --- copy semantics (PHP arrays are values)
probe('C32-A-construct-from-collection-copies', '$a = collect([1, 2]); $b = new Collection($a); $b->push(3); [$a->all(), $b->all()]', function () { $a = collect([1, 2]); $b = new Collection($a); $b->push(3); return [$a->all(), $b->all()]; });
probe('C32-A-construct-from-array-copies', '$arr = [1, 2]; $c = new Collection($arr); $c->push(3); [$arr, $c->all()]', function () { $arr = [1, 2]; $c = new Collection($arr); $c->push(3); return [$arr, $c->all()]; });
probe('C32-A-collect-method-copies', '$a = collect([1, 2]); $b = $a->collect(); $b->push(3); [$a->all(), $b->all()]', function () { $a = collect([1, 2]); $b = $a->collect(); $b->push(3); return [$a->all(), $b->all()]; });
probe('C32-A-all-returns-a-copy', '$a = collect([1, 2]); $x = $a->all(); $x[] = 3; $a->all()', function () { $a = collect([1, 2]); $x = $a->all(); $x[] = 3; return $a->all(); });
probe('C32-A-wrap-collection-copies', '$a = collect([1]); $b = Collection::wrap($a); $b->push(2); [$a->all(), $b->all(), $a === $b]', function () { $a = collect([1]); $b = Collection::wrap($a); $b->push(2); return [$a->all(), $b->all(), $a === $b]; });
probe('C32-A-make-collection-copies', '$a = collect([1]); $b = Collection::make($a); $b->push(2); [$a->all(), $b->all()]', function () { $a = collect([1]); $b = Collection::make($a); $b->push(2); return [$a->all(), $b->all()]; });
probe('C32-A-construct-from-record-put-copies', "\$arr = ['a' => 1]; \$c = new Collection(\$arr); \$c->put('b', 2); caller/all/keys/values", function () { $arr = ['a' => 1]; $c = new Collection($arr); $c->put('b', 2); return ['caller' => $arr, 'all' => $c->all(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all()]; });
probe('C32-A-construct-from-record-unshift-copies', "\$arr = ['b' => 2]; \$c = new Collection(\$arr); \$c->unshift(1); caller/all/keys/values", function () { $arr = ['b' => 2]; $c = new Collection($arr); $c->unshift(1); return ['caller' => $arr, 'all' => $c->all(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all()]; });
probe('C32-A-construct-from-array-unshift-copies', '$arr = [2, 3]; $c = new Collection($arr); $c->unshift(1); [$arr, $c->all()]', function () { $arr = [2, 3]; $c = new Collection($arr); $c->unshift(1); return [$arr, $c->all()]; });

// --- collect() returns the base class
probe('C32-A-collect-method-returns-base-class', 'get_class(C32ASub::make([1])->collect())', fn () => get_class(C32ASub::make([1])->collect()));

// --- toBase
probe('C32-A-toBase-is-base-class', '$base = C32ASub::make([1, 2])->toBase(); [get_class($base), $base->all()]', function () { $base = C32ASub::make([1, 2])->toBase(); return [get_class($base), $base->all()]; });
probe('C32-A-toBase-copies', '$sub = C32ASub::make([1, 2]); $base = $sub->toBase(); $base->push(3); [$sub->all(), $base->all()]', function () { $sub = C32ASub::make([1, 2]); $base = $sub->toBase(); $base->push(3); return [$sub->all(), $base->all()]; });

// --- empty
probe('C32-A-empty-extra-argument-is-ignored', 'Collection::empty(false)->all()', fn () => Collection::empty(false)->all());

// --- static factories keep the subclass
probe('C32-A-static-factories-keep-subclass', 'get_class of C32ASub::make/wrap/empty/range/times/times(cb)/fromJson', fn () => [
    'make' => get_class(C32ASub::make([1])),
    'wrap' => get_class(C32ASub::wrap([1])),
    'empty' => get_class(C32ASub::empty()),
    'range' => get_class(C32ASub::range(1, 3)),
    'times' => get_class(C32ASub::times(3)),
    'times-callback' => get_class(C32ASub::times(3, fn ($i) => $i * 10)),
    'fromJson' => get_class(C32ASub::fromJson('[1]')),
]);

// --- wrap
probe('C32-A-wrap-assoc-array', "Collection::wrap(['a' => 1])->all()", fn () => Collection::wrap(['a' => 1])->all());
probe('C32-A-wrap-null', 'Collection::wrap(null)->all()', fn () => Collection::wrap(null)->all());
probe('C32-A-wrap-false', 'Collection::wrap(false)->all()', fn () => Collection::wrap(false)->all());

// --- range
probe('C32-A-range-descending', 'Collection::range(5, 1)->all()', fn () => Collection::range(5, 1)->all());
probe('C32-A-range-descending-through-zero', 'Collection::range(2, -2)->all()', fn () => Collection::range(2, -2)->all());
probe('C32-A-range-descending-negative', 'Collection::range(-2, -4)->all()', fn () => Collection::range(-2, -4)->all());
probe('C32-A-range-ascending-through-zero', 'Collection::range(-2, 2)->all()', fn () => Collection::range(-2, 2)->all());
probe('C32-A-range-ascending-negative', 'Collection::range(-4, -2)->all()', fn () => Collection::range(-4, -2)->all());
probe('C32-A-range-descending-step', 'Collection::range(10, 1, 3)->all()', fn () => Collection::range(10, 1, 3)->all());
probe('C32-A-range-single', 'Collection::range(3, 3)->all()', fn () => Collection::range(3, 3)->all());
probe('C32-A-range-float-step', 'Collection::range(0, 1, 0.1)->all()', fn () => Collection::range(0, 1, 0.1)->all());
probe('C32-A-range-step-zero-throws', 'Collection::range(1, 5, 0)', fn () => Collection::range(1, 5, 0)->all());
probe('C32-A-range-negative-step-increasing-throws', 'Collection::range(1, 5, -1)', fn () => Collection::range(1, 5, -1)->all());
probe('C32-A-range-step-exceeds-span-throws', 'Collection::range(1, 2, 3)', fn () => Collection::range(1, 2, 3)->all());
probe('C32-A-range-step-equals-span', 'Collection::range(0, 10, 10)->all()', fn () => Collection::range(0, 10, 10)->all());
probe('C32-A-range-negative-step-descending', 'Collection::range(5, 1, -2)->all()', fn () => Collection::range(5, 1, -2)->all());
probe('C32-A-range-float-step-stops-at-end', 'Collection::range(0, 1, 0.4)->all()', fn () => Collection::range(0, 1, 0.4)->all());
probe('C32-A-range-float-size-rounds-half-up', 'Collection::range(0.2, 0.5, 0.1)->all()', fn () => Collection::range(0.2, 0.5, 0.1)->all());
probe('C32-A-range-descending-float-step', 'Collection::range(1, 0, 0.3)->all()', fn () => Collection::range(1, 0, 0.3)->all());
probe('C32-A-range-descending-float-stops-at-end', 'Collection::range(4, 1.5)->all()', fn () => Collection::range(4, 1.5)->all());
$rangeOutcome = function (array $arguments) {
    try {
        return Collection::range(...$arguments)->all();
    } catch (\Throwable $e) {
        return [get_class($e), $e->getMessage()];
    }
};
probe('C32-A-range-non-finite-arguments-throw', 'Collection::range() given NAN, INF or -INF as the step, the start or the end', fn () => array_map($rangeOutcome, [[1, 5, NAN], [1, 5, INF], [1, 5, -INF], [NAN, 5], [INF, 5], [-INF, 5], [0, NAN], [0, INF], [0, -INF]]));
probe('C32-A-range-checks-the-step-first', 'Collection::range(NAN, NAN, NAN) and Collection::range(NAN, 5, 0)', fn () => array_map($rangeOutcome, [[NAN, NAN, NAN], [NAN, 5, 0]]));

// --- times
probe('C32-A-times-fractional-count', 'Collection::times(2.7)->all()', fn () => Collection::times(2.7)->all());
probe('C32-A-times-non-finite-count', 'Collection::times(NAN), times(INF) and times(-INF)', fn () => array_map(function ($count) {
    try {
        return Collection::times($count)->all();
    } catch (\Throwable $e) {
        return [get_class($e), $e->getMessage()];
    }
}, [NAN, INF, -INF]));

// --- fromJson
probe('C32-A-fromJson-invalid-is-empty', "Collection::fromJson('{bad')->all()", fn () => Collection::fromJson('{bad')->all());
probe('C32-A-fromJson-scalar-is-wrapped', "Collection::fromJson('5')->all()", fn () => Collection::fromJson('5')->all());
probe('C32-A-fromJson-null-is-empty', "Collection::fromJson('null')->all()", fn () => Collection::fromJson('null')->all());
probe('C32-A-fromJson-list', "Collection::fromJson('[\"a\",\"b\"]')->all()", fn () => Collection::fromJson('["a","b"]')->all());
probe('C32-A-fromJson-integer-keys-out-of-order', "Collection::fromJson('{\"2\":\"a\",\"1\":\"b\"}')->keys()->all()", fn () => Collection::fromJson('{"2":"a","1":"b"}')->keys()->all());

// --- jsonSerialize / toJson / toPrettyJson / __toString
probe('C32-A-jsonSerialize-php-fixtures', 'testJsonSerialize fixtures', fn () => collect([new TestArrayableObject, new TestJsonableObject, new TestJsonSerializeObject, new C32AJsonSerializeToString, 'baz'])->jsonSerialize());
probe('C32-A-jsonSerialize-prefers-jsonSerialize-over-toArray', 'collect([new C32AArrayableAndJsonSerializable])->jsonSerialize()', fn () => collect([new C32AArrayableAndJsonSerializable])->jsonSerialize());
probe('C32-A-jsonSerialize-prefers-toJson-over-toArray', 'collect([new C32AArrayableAndJsonable])->jsonSerialize()', fn () => collect([new C32AArrayableAndJsonable])->jsonSerialize());
probe('C32-A-jsonSerialize-invalid-jsonable-is-null', 'collect([new C32ABadJsonable])->jsonSerialize()', fn () => collect([new C32ABadJsonable])->jsonSerialize());
probe('C32-A-jsonSerialize-other-object-is-kept', '$o = new C32AParent; collect([$o])->jsonSerialize()[0] === $o', function () { $o = new C32AParent; return collect([$o])->jsonSerialize()[0] === $o; });
probe('C32-A-jsonSerialize-keyed', "collect(['a' => new TestArrayableObject, 'b' => 1])->jsonSerialize()", fn () => collect(['a' => new TestArrayableObject, 'b' => 1])->jsonSerialize());
probe('C32-A-toArray-plain-item-members-are-data', "\$item = collect([['toArray' => fn () => [9], 'b' => 2]])->toArray()[0]; [array_keys(\$item), \$item['b']]", function () { $item = collect([['toArray' => fn () => [9], 'b' => 2]])->toArray()[0]; return [array_keys($item), $item['b']]; });
probe('C32-A-jsonSerialize-plain-item-members-are-data', "\$item = collect([['toArray' => fn () => [9], 'toJson' => fn () => '[1]', 'jsonSerialize' => fn () => 1, 'b' => 2]])->jsonSerialize()[0]; [array_keys(\$item), \$item['b']]", function () { $item = collect([['toArray' => fn () => [9], 'toJson' => fn () => '[1]', 'jsonSerialize' => fn () => 1, 'b' => 2]])->jsonSerialize()[0]; return [array_keys($item), $item['b']]; });
probe('C32-A-toJson-integer-keys-in-order-are-a-list', "collect([0 => 'a', 1 => 'b'])->toJson()", fn () => collect([0 => 'a', 1 => 'b'])->toJson());
probe('C32-A-toJson-integer-keys-from-one-are-an-object', "collect([1 => 'a', 2 => 'b'])->toJson()", fn () => collect([1 => 'a', 2 => 'b'])->toJson());
probe('C32-A-toJson-emptied-keyed-is-a-list', "collect(['a' => 1])->forget('a')->toJson()", fn () => collect(['a' => 1])->forget('a')->toJson());
probe('C32-A-toJson-integer-keys-out-of-order', "collect([2 => 'a', 1 => 'b'])->toJson()", fn () => collect([2 => 'a', 1 => 'b'])->toJson());
probe('C32-A-toJson-list-keys-out-of-order-are-an-object', "collect([1 => 'b', 0 => 'a'])->toJson()", fn () => collect([1 => 'b', 0 => 'a'])->toJson());
probe('C32-A-json-encode-collection', 'json_encode(collect([1, 2]))', fn () => json_encode(collect([1, 2])));
probe('C32-A-json-encode-nested-collection', "json_encode(['users' => collect([['id' => 1]])])", fn () => json_encode(['users' => collect([['id' => 1]])]));
probe('C32-A-toJson-escapes-slash-and-unicode', "collect(['a/b', 'é'])->toJson()", fn () => collect(['a/b', 'é'])->toJson());
probe('C32-A-toPrettyJson-list', 'collect([1, [2]])->toPrettyJson()', fn () => collect([1, [2]])->toPrettyJson());
probe('C32-A-toPrettyJson-empty', 'collect()->toPrettyJson()', fn () => collect()->toPrettyJson());
probe('C32-A-string-concat-is-json', "collect(['foo']) . ''", fn () => collect(['foo']) . '');
probe('C32-A-escape-when-casting-to-string', "(string) collect(['<b>'])->escapeWhenCastingToString()", fn () => (string) collect(['<b>'])->escapeWhenCastingToString());
probe('C32-A-escape-when-casting-concat', "collect(['<b>'])->escapeWhenCastingToString() . ''", fn () => collect(['<b>'])->escapeWhenCastingToString() . '');
probe('C32-A-escape-when-casting-to-string-all-characters', "(string) collect([\"&'<>&amp;\"])->escapeWhenCastingToString()", fn () => (string) collect(["&'<>&amp;"])->escapeWhenCastingToString());
probe('C32-A-escape-when-casting-to-string-off', "(string) collect(['<b>'])->escapeWhenCastingToString()->escapeWhenCastingToString(false)", fn () => (string) collect(['<b>'])->escapeWhenCastingToString()->escapeWhenCastingToString(false));
probe('C32-A-escape-when-casting-leaves-toJson', "collect(['<b>'])->escapeWhenCastingToString()->toJson()", fn () => collect(['<b>'])->escapeWhenCastingToString()->toJson());

// --- dump (VarDumper's output is discarded so it stays out of the transcript)
probe('C32-A-dump-returns-same-instance', '$c = collect([1]); $c->dump() === $c', function () {
    VarDumper::setHandler(fn () => null);

    try {
        $c = collect([1]);

        return $c->dump() === $c;
    } finally {
        VarDumper::setHandler(null);
    }
});

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
probe('C32-A-iterate-integer-keys-out-of-order', "foreach (collect([2 => 'a', 1 => 'b']) as \$v) { \$seen[] = \$v; }", function () {
    $seen = [];

    foreach (collect([2 => 'a', 1 => 'b']) as $v) {
        $seen[] = $v;
    }

    return $seen;
});

// --- count / isEmpty
probe('C32-A-isEmpty-after-put-on-empty-list', "collect([])->put('x', 1)->isEmpty()", fn () => collect([])->put('x', 1)->isEmpty());
probe('C32-A-isEmpty-null-item', 'collect([null])->isEmpty()', fn () => collect([null])->isEmpty());

// --- ensure (message parity; the class is UnexpectedValueException)
probe('C32-A-ensure-scalar-message', "collect([1, 2, 3, 'foo'])->ensure('int')", fn () => collect([1, 2, 3, 'foo'])->ensure('int'));
probe('C32-A-ensure-class-message', 'collect([new stdClass, new stdClass, new stdClass, Collection::class])->ensure(stdClass::class)', fn () => collect([new stdClass, new stdClass, new stdClass, Collection::class])->ensure(stdClass::class));
probe('C32-A-ensure-inheritance-message', 'collect([new Error, new Error, new Collection])->ensure(Throwable::class)', fn () => collect([new \Error, new \Error, new Collection])->ensure(\Throwable::class));
probe('C32-A-ensure-multiple-message', "collect([new Error, new Error, new Collection])->ensure([Throwable::class, 'int'])", fn () => collect([new \Error, new \Error, new Collection])->ensure([\Throwable::class, 'int']));
probe('C32-A-ensure-null-passes', "collect([null])->ensure('null')->all()", fn () => collect([null])->ensure('null')->all());
probe('C32-A-ensure-array-rejects-null', "collect([null])->ensure('array')", fn () => collect([null])->ensure('array'));
probe('C32-A-ensure-subclass-passes', 'collect([new C32AChild])->ensure(C32AParent::class)->count()', fn () => collect([new C32AChild])->ensure(C32AParent::class)->count());
probe('C32-A-ensure-returns-same-instance', '$c = collect([1]); $c->ensure(\'int\') === $c', function () { $c = collect([1]); return $c->ensure('int') === $c; });
probe('C32-A-ensure-keyed-position', "collect(['a' => 1, 'b' => 'x'])->ensure('int')", fn () => collect(['a' => 1, 'b' => 'x'])->ensure('int'));
probe('C32-A-ensure-numeric-prefix-key-position', "collect(['3x' => 'a'])->ensure('int')", fn () => collect(['3x' => 'a'])->ensure('int'));
probe('C32-A-ensure-assoc-types', "collect(['hello', 'world'])->ensure(['first' => 'string'])->all()", fn () => collect(['hello', 'world'])->ensure(['first' => 'string'])->all());
probe('C32-A-ensure-debug-type-names', "the message collect([\$item])->ensure('string') throws for 1, 1.5, NAN, true and ['a' => 1]", fn () => array_map(function ($item) {
    try {
        collect([$item])->ensure('string');
    } catch (UnexpectedValueException $e) {
        return $e->getMessage();
    }
}, [1, 1.5, NAN, true, ['a' => 1]]));
probe('C32-A-ensure-array-accepts-assoc', "collect([['a' => 1]])->ensure('array')->count()", fn () => collect([['a' => 1]])->ensure('array')->count());
probe('C32-A-ensure-class-name-string', "collect([new C32AChild])->ensure('C32AChild')->count()", fn () => collect([new C32AChild])->ensure('C32AChild')->count());

// ---- Family B ------------------------------------------------------------

// ---- Family B: keyed access & mutation (C32-B-*) ----
$views = fn (Collection $c, $k) => ['all' => $c->all(), 'count' => $c->count(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'get' => $c->get($k), 'has' => $c->has($k), 'last' => $c->last()];

probe('C32-B-put-string-key-on-list', "\$c = collect([1, 2]); \$c->put('x', 3); views", function () use ($views) { $c = collect([1, 2]); $c->put('x', 3); return $views($c, 'x'); });
probe('C32-B-offsetSet-string-key-on-list', "\$c = collect([1, 2]); \$c->offsetSet('x', 3); views", function () use ($views) { $c = collect([1, 2]); $c->offsetSet('x', 3); return $views($c, 'x'); });
probe('C32-B-getOrPut-string-key-on-list', "\$c = collect([1, 2]); \$r = \$c->getOrPut('x', 3); views", function () use ($views) { $c = collect([1, 2]); $r = $c->getOrPut('x', 3); return ['returned' => $r] + $views($c, 'x'); });
probe('C32-B-getOrPut-memoizes-on-empty', "\$c = collect(); getOrPut('k', counter) twice", function () { $c = collect(); $calls = 0; $f = function () use (&$calls) { return 'v' . ++$calls; }; return ['first' => $c->getOrPut('k', $f), 'second' => $c->getOrPut('k', $f), 'calls' => $calls, 'all' => $c->all()]; });
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
probe('C32-B-prepend-string-key-on-list-order', "\$c = collect(['b', 'c'])->prepend('a', 'k'); values/keys/first/last", function () { $c = collect(['b', 'c'])->prepend('a', 'k'); return ['values' => $c->values()->all(), 'keys' => $c->keys()->all(), 'first' => $c->first(), 'last' => $c->last()]; });
probe('C32-B-push-onto-string-keyed-last', "collect(['a' => 1])->push('z')->last()", fn () => collect(['a' => 1])->push('z')->last());
probe('C32-B-has-null-key', "[collect(['a' => 1])->has(null), collect(['' => 1])->has(null)]", fn () => [collect(['a' => 1])->has(null), collect(['' => 1])->has(null)]);
probe('C32-B-has-empty-key-list', "[collect(['a' => 1])->has([]), collect([])->has([])]", fn () => [collect(['a' => 1])->has([]), collect([])->has([])]);
probe('C32-B-has-array-ignores-extra-args', "[collect(['first' => 1])->has(['first'], 'third'), collect(['first' => 1])->hasAny(['third'], 'first')]", fn () => [collect(['first' => 1])->has(['first'], 'third'), collect(['first' => 1])->hasAny(['third'], 'first')]);
probe('C32-B-hasAny-null-key', "[collect(['' => 1])->hasAny(null), collect(['a' => 1])->hasAny(null), collect(['' => 1])->hasAny([null])]", fn () => [collect(['' => 1])->hasAny(null), collect(['a' => 1])->hasAny(null), collect(['' => 1])->hasAny([null])]);
probe('C32-B-hasAny-dot-path-is-literal', "[collect(['a' => ['b' => 1]])->hasAny('a.b'), collect(['a.b' => 1])->hasAny('a.b')]", fn () => [collect(['a' => ['b' => 1]])->hasAny('a.b'), collect(['a.b' => 1])->hasAny('a.b')]);
probe('C32-B-get-null-on-list', "collect([1, 2, 3])->get(null)", fn () => collect([1, 2, 3])->get(null));
probe('C32-B-get-null-empty-string-key', "collect(['' => 'x'])->get(null)", fn () => collect(['' => 'x'])->get(null));
probe('C32-B-pull-string-index-on-list', "\$c = collect(['a', 'b', 'c']); \$c->pull('1')", function () { $c = collect(['a', 'b', 'c']); return ['returned' => $c->pull('1'), 'all' => $c->all(), 'count' => $c->count()]; });
probe('C32-B-pull-missing-on-list-keeps-list', "\$c = collect(['foo', 'bar']); \$c->pull(2); \$c->pull(-1)", function () { $c = collect(['foo', 'bar']); $a = $c->pull(2); $b = $c->pull(-1); return ['returned' => [$a, $b], 'all' => $c->all(), 'json' => $c->toJson()]; });
probe('C32-B-pull-keeps-sibling-collections', "\$c = collect(['a' => collect([1]), 'b' => 2]); \$c->pull('b')", function () { $c = collect(['a' => collect([1]), 'b' => 2]); $c->pull('b'); return $c->get('a') instanceof Collection; });
probe('C32-B-pull-returns-stored-collection', "collect(['a' => collect(['x' => 1])])->pull('a') instanceof Collection", fn () => collect(['a' => collect(['x' => 1])])->pull('a') instanceof Collection);
probe('C32-B-pull-dot-into-nested-collection', "\$c = collect(['a' => collect(['x' => 1, 'y' => 2])]); \$c->pull('a.x')", function () { $c = collect(['a' => collect(['x' => 1, 'y' => 2])]); $r = $c->pull('a.x'); return ['returned' => $r, 'nestedIsCollection' => $c->get('a') instanceof Collection, 'toArray' => $c->toArray()]; });
probe('C32-B-forget-dot-path-is-literal', "collect(['a' => ['b' => 1]])->forget('a.b')->all()", fn () => collect(['a' => ['b' => 1]])->forget('a.b')->all());
probe('C32-B-forget-max-int-key-then-push', "collect([5 => 'a', 6 => 'b'])->forget(6)->push('x')->all()", fn () => collect([5 => 'a', 6 => 'b'])->forget(6)->push('x')->all());
probe('C32-B-offsetExists-falsy-values', "collect([0, false, '', [], '0']) offsetExists(0..4)", function () { $c = collect([0, false, '', [], '0']); return array_map(fn ($k) => $c->offsetExists($k), [0, 1, 2, 3, 4]); });
probe('C32-B-offsetExists-zero-on-record', "collect(['a' => 0])->offsetExists('a')", fn () => collect(['a' => 0])->offsetExists('a'));
probe('C32-B-offsetUnset-negative-on-list', "\$c = collect(['a', 'b', 'c']); \$c->offsetUnset(-1); \$c->all()", function () { $c = collect(['a', 'b', 'c']); $c->offsetUnset(-1); return $c->all(); });
probe('C32-B-offsetUnset-string-on-list', "\$c = collect(['a', 'b', 'c']); \$c->offsetUnset('x'); \$c->all()", function () { $c = collect(['a', 'b', 'c']); $c->offsetUnset('x'); return $c->all(); });
probe('C32-B-splice-null-length', "\$c = collect([1, 2, 3, 4]); \$c->splice(1, null, ['x'])", function () { $c = collect([1, 2, 3, 4]); $r = $c->splice(1, null, ['x']); return ['returned' => $r->all(), 'all' => $c->all()]; });
probe('C32-B-shift-negative-on-empty-throws', "collect([])->shift(-1)", fn () => collect([])->shift(-1));
probe('C32-B-pop-one-on-list-returns-value', "\$c = collect([1, 2, 3]); \$c->pop(1)", function () { $c = collect([1, 2, 3]); return ['returned' => $c->pop(1), 'all' => $c->all()]; });
probe('C32-B-shift-one-on-list-returns-value', "\$c = collect([1, 2, 3]); \$c->shift(1)", function () { $c = collect([1, 2, 3]); return ['returned' => $c->shift(1), 'all' => $c->all()]; });
probe('C32-B-pull-null-key', "\$c = collect([1, 2]); \$c->pull(null)", function () { $c = collect([1, 2]); $r = $c->pull(null); return ['returned' => $r, 'all' => $c->all()]; });
// PHP takes an ArrayAccess element by value there, so the unset only reaches a copy; the notice is silenced.
probe('C32-B-pull-array-inside-collection-stays', "\$c = collect(['a' => collect(['x' => ['y' => 1, 'z' => 2]])]); @\$c->pull('a.x.y')", function () { $c = collect(['a' => collect(['x' => ['y' => 1, 'z' => 2]])]); $r = @$c->pull('a.x.y'); return ['returned' => $r, 'toArray' => $c->toArray()]; });
probe('C32-B-pull-dot-path-inside-collection-per-segment', "\$c = collect(['a' => collect(['x.y' => 1])]); \$c->pull('a.x.y')", function () { $c = collect(['a' => collect(['x.y' => 1])]); $r = $c->pull('a.x.y'); return ['returned' => $r, 'toArray' => $c->toArray()]; });
probe('C32-B-pull-through-array-into-collection', "\$c = collect(['a' => ['b' => collect(['x' => 1, 'y' => 2])]]); \$c->pull('a.b.x')", function () { $c = collect(['a' => ['b' => collect(['x' => 1, 'y' => 2])]]); $r = $c->pull('a.b.x'); return ['returned' => $r, 'toArray' => $c->toArray()]; });
probe('C32-B-pull-through-array-keeps-the-collection', "\$c = collect(['a' => ['b' => collect(['x' => 1])]]); \$c->pull('a.b.x'); \$c->get('a')['b'] instanceof Collection", function () { $c = collect(['a' => ['b' => collect(['x' => 1])]]); $c->pull('a.b.x'); return $c->get('a')['b'] instanceof Collection; });
probe('C32-B-forget-repeated-key-on-list', "collect(['a', 'b', 'c'])->forget([1, 1])->all()", fn () => collect(['a', 'b', 'c'])->forget([1, 1])->all());
probe('C32-B-push-many-onto-string-keyed', "\$c = collect(['a' => 1])->push('y', 'z'); keys/values/last", function () { $c = collect(['a' => 1])->push('y', 'z'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-get-stored-null-beats-default', "collect(['a' => null])->get('a', 'd')", fn () => collect(['a' => null])->get('a', 'd'));
probe('C32-B-pad-past-a-string-key-order', "\$c = collect([5 => 'a', 'x' => 'b'])->pad(4, 0); keys/values", function () { $c = collect([5 => 'a', 'x' => 'b'])->pad(4, 0); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all()]; });
probe('C32-B-put-int-key-onto-string-keyed-order', "\$c = collect(['a' => 1]); \$c->put(0, 'z'); keys/values/last", function () { $c = collect(['a' => 1]); $c->put(0, 'z'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });

// ---- Family C ------------------------------------------------------------

enum C32StaffEnum
{
    case Taylor;
    case Joe;
}

$c32KeysSeen = function (callable $run, bool $answer = false): array {
    $seen = [];
    $run(function ($v, $k) use (&$seen, $answer) {
        $seen[] = [gettype($k), $k];

        return $answer;
    });

    return $seen;
};

probe('C32-C-every-two-args-key-value', '(new Collection([["age" => 18], ["age" => 18]]))->every("age", 18) / (new Collection([["status" => "active"], ["status" => "active"]]))->every("status", "active")', fn () => [
    (new Collection([['age' => 18], ['age' => 18]]))->every('age', 18),
    (new Collection([['status' => 'active'], ['status' => 'active']]))->every('status', 'active'),
]);
probe('C32-C-every-two-args-null-value', '(new Collection([["x" => null], ["x" => null]]))->every("x", null) / (new Collection([["x" => 1]]))->every("x", null)', fn () => [
    (new Collection([['x' => null], ['x' => null]]))->every('x', null),
    (new Collection([['x' => 1]]))->every('x', null),
]);
probe('C32-C-every-callback-key-types', 'key types an always-true every callback sees on ["a", "b"] and on ["1" => "a", "x" => "b"]', fn () => [
    'list' => $c32KeysSeen(fn ($cb) => (new Collection(['a', 'b']))->every($cb), true),
    'record' => $c32KeysSeen(fn ($cb) => (new Collection(['1' => 'a', 'x' => 'b']))->every($cb), true),
]);
probe('C32-C-every-path-php-falsy', '(new Collection([["a" => "0"]]))->every("a") / (new Collection([["a" => []]]))->every("a") / (new Collection(["0"]))->every(null)', fn () => [
    (new Collection([['a' => '0']]))->every('a'),
    (new Collection([['a' => []]]))->every('a'),
    (new Collection(['0']))->every(null),
]);
probe('C32-C-callback-php-truthiness', 'callbacks returning "0" or [] are falsy: contains / first / search / every / hasSole / hasMany', fn () => [
    'contains' => (new Collection([1]))->contains(fn () => '0'),
    'first' => (new Collection([1, 2]))->first(fn () => '0'),
    'first-array' => (new Collection([1, 2]))->first(fn () => []),
    'search' => (new Collection([1, 2]))->search(fn () => '0'),
    'every' => (new Collection([1, 2]))->every(fn () => '0'),
    'hasSole' => (new Collection([1]))->hasSole(fn () => '0'),
    'hasMany' => (new Collection([1, 2]))->hasMany(fn () => []),
]);

/** The items ['a', 'b'] (or ['a'] alone), as a list or keyed 'x', 'y'. */
function c32c_items(bool $keyed, bool $one = false): array
{
    $items = $keyed ? ['x' => 'a', 'y' => 'b'] : ['a', 'b'];

    return $one ? array_slice($items, 0, 1, true) : $items;
}

/** What $run answers for a callback answering '0', [] and new DateTime('@0'), or the short name of what it throws. */
function c32c_truthiness(callable $run): array
{
    return array_map(function ($result) use ($run) {
        try {
            return pairs($run(fn () => $result));
        } catch (\Throwable $e) {
            return (new ReflectionClass($e))->getShortName();
        }
    }, ['0', [], new DateTime('@0')]);
}

probe('C32-C-arr-callback-php-truthiness', "Arr::first / last / every / some / sole / where / reject / partition over c32c_items(list | keyed), sole over its first item alone, with a callback answering '0', [] and new DateTime('@0')", fn () => array_map(fn (bool $keyed) => [
    'first' => c32c_truthiness(fn ($cb) => Arr::first(c32c_items($keyed), $cb)),
    'last' => c32c_truthiness(fn ($cb) => Arr::last(c32c_items($keyed), $cb)),
    'every' => c32c_truthiness(fn ($cb) => Arr::every(c32c_items($keyed), $cb)),
    'some' => c32c_truthiness(fn ($cb) => Arr::some(c32c_items($keyed), $cb)),
    'sole' => c32c_truthiness(fn ($cb) => Arr::sole(c32c_items($keyed, true), $cb)),
    'where' => c32c_truthiness(fn ($cb) => Arr::where(c32c_items($keyed), $cb)),
    'reject' => c32c_truthiness(fn ($cb) => Arr::reject(c32c_items($keyed), $cb)),
    'partition' => c32c_truthiness(fn ($cb) => Arr::partition(c32c_items($keyed), $cb)),
], ['list' => false, 'keyed' => true]));
probe('C32-C-collection-callback-php-truthiness', "each callback method over new Collection(c32c_items(list | keyed)), sole / hasSole / containsOneItem over its first item alone, with a callback answering '0', [] and new DateTime('@0'); before's callback answers it for 'b' only, chunkWhile records each chunk's values, when / unless take it as the condition and record whether fn () => 'called' ran", fn () => array_map(fn (bool $keyed) => [
    'filter' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->filter($cb)),
    'where' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->where($cb)),
    'reject' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->reject($cb)),
    'first' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->first($cb)),
    'last' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->last($cb)),
    'firstWhere' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->firstWhere($cb)),
    'firstOrFail' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->firstOrFail($cb)),
    'sole' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed, true)))->sole($cb)),
    'every' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->every($cb)),
    'some' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->some($cb)),
    'contains' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->contains($cb)),
    'doesntContain' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->doesntContain($cb)),
    'containsStrict' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->containsStrict($cb)),
    'doesntContainStrict' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->doesntContainStrict($cb)),
    'search' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->search($cb)),
    'before' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->before(fn ($v) => $v === 'b' ? $cb() : false)),
    'after' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->after($cb)),
    'hasSole' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed, true)))->hasSole($cb)),
    'containsOneItem' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed, true)))->containsOneItem($cb)),
    'hasMany' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->hasMany($cb)),
    'containsManyItems' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->containsManyItems($cb)),
    'partition' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->partition($cb)),
    'chunkWhile' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->chunkWhile($cb)->map(fn (Collection $chunk) => $chunk->values()->all())),
    'percentage' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->percentage($cb)),
    'when' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->when($cb(), fn () => 'called') === 'called'),
    'unless' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->unless($cb(), fn () => 'called') === 'called'),
], ['list' => false, 'keyed' => true]));
probe('C32-C-ordered-first-last-callback-php-truthiness', "(new Collection([2 => 'a', 0 => 'b']))->first(\$cb) / last(\$cb), \$cb answering '0', [] and new DateTime('@0')", fn () => [
    'first' => c32c_truthiness(fn ($cb) => (new Collection([2 => 'a', 0 => 'b']))->first($cb)),
    'last' => c32c_truthiness(fn ($cb) => (new Collection([2 => 'a', 0 => 'b']))->last($cb)),
]);
probe('C32-C-no-args-forms-throw', '(new Collection([1]))->some() / every() / firstWhere()', function () {
    $out = [];
    foreach (['some', 'every', 'firstWhere'] as $method) {
        try {
            $out[$method] = (new Collection([1]))->{$method}();
        } catch (\Throwable $e) {
            $out[$method] = get_class($e);
        }
    }

    return $out;
});
probe('C32-C-string-key-one-arg-forms-throw', '(new Collection([["name" => "foo"]]))->hasSole("name") / hasMany("name") / sole("name") / firstOrFail("name")', function () {
    $out = [];
    foreach (['hasSole', 'hasMany', 'sole', 'firstOrFail'] as $method) {
        try {
            $out[$method] = (new Collection([['name' => 'foo']]))->{$method}('name');
        } catch (\Throwable $e) {
            $out[$method] = get_class($e);
        }
    }

    return $out;
});
probe('C32-C-two-args-null-value', 'contains / hasSole / hasMany / sole / firstWhere with ("a", null) over [["a" => null], ["a" => 1]]', fn () => [
    'contains' => (new Collection([['a' => null], ['a' => 1]]))->contains('a', null),
    'contains-none' => (new Collection([['a' => 1]]))->contains('a', null),
    'hasSole' => (new Collection([['a' => null], ['a' => 1]]))->hasSole('a', null),
    'hasMany' => (new Collection([['a' => null], ['a' => 0], ['a' => 1]]))->hasMany('a', null),
    'sole' => (new Collection([['a' => null], ['a' => 1]]))->sole('a', null),
    'firstWhere' => (new Collection([['a' => 1], ['a' => null]]))->firstWhere('a', null),
]);
probe('C32-C-hasSole-hasMany-keep-falsy-items', '(new Collection([0]))->hasSole() / (new Collection([null]))->hasSole() / (new Collection([0, null]))->hasMany()', fn () => [
    (new Collection([0]))->hasSole(),
    (new Collection([null]))->hasSole(),
    (new Collection([0, null]))->hasMany(),
]);
probe('C32-C-collection-rows', 'rows that are Collections: contains("v", 1) / where("v", 1)->count() / firstWhere("v", 1)->all() / value("v")', fn () => [
    (new Collection([new Collection(['v' => 1])]))->contains('v', 1),
    (new Collection([new Collection(['v' => 1])]))->where('v', 1)->count(),
    (new Collection([new Collection(['v' => 1])]))->firstWhere('v', 1)->all(),
    (new Collection([new Collection(['v' => 1])]))->value('v'),
]);

/** Three Collection rows, 'k' => b, a, b and 'v' => 1, 2, 3, as a list or keyed 'x', 'y', 'z'. */
function c32c_rows(bool $keyed): Collection
{
    $rows = [new Collection(['k' => 'b', 'v' => 1]), new Collection(['k' => 'a', 'v' => 2]), new Collection(['k' => 'b', 'v' => 3])];

    return new Collection($keyed ? array_combine(['x', 'y', 'z'], $rows) : $rows);
}

probe('C32-C-collection-rows-by-backing', "c32c_rows(list | keyed): contains('k', 'a') / where('k', 'b')->keys() / firstWhere('k', 'a')->all() / value('v')", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->contains('k', 'a'),
    c32c_rows($keyed)->where('k', 'b')->keys()->all(),
    c32c_rows($keyed)->firstWhere('k', 'a')->all(),
    c32c_rows($keyed)->value('v'),
], ['list' => false, 'keyed' => true]));
probe('C32-C-value-collection-row-null', "(new Collection([new Collection(['v' => null]), new Collection(['v' => 1])]))->value('v', 'def')", fn () => (new Collection([new Collection(['v' => null]), new Collection(['v' => 1])]))->value('v', 'def'));
probe('C32-C-contains-unit-enum-operand', '(new Collection([["n" => C32StaffEnum::Joe]]))->contains("n", "Joe") / contains("n", C32StaffEnum::Joe) / contains("n", "!=", "Joe")', fn () => [
    (new Collection([['n' => C32StaffEnum::Joe]]))->contains('n', 'Joe'),
    (new Collection([['n' => C32StaffEnum::Joe]]))->contains('n', C32StaffEnum::Joe),
    (new Collection([['n' => C32StaffEnum::Joe]]))->contains('n', '!=', 'Joe'),
]);
probe('C32-C-callback-key-types-numeric-string-record', 'key types each callback sees on ["1" => "a", "x" => "b"]: containsStrict / search / hasSole / sole / firstOrFail', fn () => [
    'containsStrict' => $c32KeysSeen(fn ($cb) => (new Collection(['1' => 'a', 'x' => 'b']))->containsStrict($cb)),
    'search' => $c32KeysSeen(fn ($cb) => (new Collection(['1' => 'a', 'x' => 'b']))->search($cb)),
    'hasSole' => $c32KeysSeen(fn ($cb) => (new Collection(['1' => 'a', 'x' => 'b']))->hasSole($cb)),
    'sole' => $c32KeysSeen(function ($cb) {
        try {
            (new Collection(['1' => 'a', 'x' => 'b']))->sole($cb);
        } catch (\Throwable) {
        }
    }),
    'firstOrFail' => $c32KeysSeen(function ($cb) {
        try {
            (new Collection(['1' => 'a', 'x' => 'b']))->firstOrFail($cb);
        } catch (\Throwable) {
        }
    }),
]);
probe('C32-C-search-numeric-string-record-key', 'gettype and value of (new Collection(["1" => "a", "x" => "b"]))->search("a")', function () {
    $key = (new Collection(['1' => 'a', 'x' => 'b']))->search('a');

    return [gettype($key), $key];
});
probe('C32-C-before-after-string-key-first', '(new Collection(["foo" => "bar", 1, 2, 3, 4, 5]))->before(1) / after("bar")', fn () => [
    (new Collection(['foo' => 'bar', 1, 2, 3, 4, 5]))->before(1),
    (new Collection(['foo' => 'bar', 1, 2, 3, 4, 5]))->after('bar'),
]);
probe('C32-C-first-empty-no-default', '(new Collection([]))->first() / (new Collection(["a" => null]))->first(null, "d")', fn () => [
    (new Collection([]))->first(),
    (new Collection(['a' => null]))->first(null, 'd'),
]);
probe('C32-C-value-default', '(new Collection([["a" => 1]]))->value("b", fn () => "d") / value("b", "d") / (new Collection([]))->value("a")', fn () => [
    (new Collection([['a' => 1]]))->value('b', fn () => 'd'),
    (new Collection([['a' => 1]]))->value('b', 'd'),
    (new Collection([]))->value('a'),
]);
probe('C32-C-multiple-items-found-count', '(new MultipleItemsFoundException(2))->count / getCount()', function () {
    $e = new \Illuminate\Support\MultipleItemsFoundException(2);

    return [$e->count, $e->getCount()];
});
probe('C32-C-random-record-count-is-list', 'array_is_list((new Collection(["a" => 1, "b" => 2, "c" => 3]))->random(2)->all()) / random(0) / random(3, true) on [10, 20, 30]', fn () => [
    array_is_list((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->random(2)->all()),
    (new Collection(['a' => 1]))->random(0)->all(),
    array_is_list((new Collection([10, 20, 30]))->random(3, true)->all()),
]);
probe('C32-C-random-negative-count', '(new Collection([1, 2, 3]))->random(-1)->all()', fn () => (new Collection([1, 2, 3]))->random(-1)->all());
probe('C32-C-random-float-count', '(new Collection([1, 2, 3]))->random(1.2)->count() / random(2.9)->count(), with deprecations', fn () => [
    (new Collection([1, 2, 3]))->random(1.2)->count(),
    (new Collection([1, 2, 3]))->random(2.9)->count(),
]);
probe('C32-C-random-callable-count', '(new Collection([1, 2, 3]))->random(fn ($c) => $c instanceof Collection ? 2 : 0)->count() / random(fn () => 0)->all() / random(fn () => 5)', function () {
    $out = [
        (new Collection([1, 2, 3]))->random(fn ($c) => $c instanceof Collection ? 2 : 0)->count(),
        (new Collection([1, 2, 3]))->random(fn () => 0)->all(),
    ];
    try {
        (new Collection([1, 2, 3]))->random(fn () => 5);
    } catch (\Throwable $e) {
        $out[] = [get_class($e), $e->getMessage()];
    }

    return $out;
});

// ---- Family D ------------------------------------------------------------

/**
 * A non-list result is recorded through `pairs()`, since a JSON object loses key order.
 */


/** Encode $value so JSON keeps its key order: each non-list array, at any depth, becomes [key, value] pairs. */
function pairs(mixed $value): mixed
{
    if ($value instanceof Collection) {
        $value = $value->all();
    }
    if (! is_array($value)) {
        return $value;
    }
    if (array_is_list($value)) {
        return array_map(pairs(...), $value);
    }
    $out = [];
    foreach ($value as $key => $item) {
        $out[] = [$key, pairs($item)];
    }
    return $out;
}

// reject(): value form compares with PHP ==, and the no-argument form keeps PHP-falsy values
probe('C32-D-reject-none-php-falsy', "(new Collection([[], '0', 0.0, 'a', '', null, true]))->reject()->values()", fn () => pairs((new Collection([[], '0', 0.0, 'a', '', null, true]))->reject()->values()));
probe('C32-D-reject-false-loose', "(new Collection([null, 0, '', 'a', [], true, false]))->reject(false)->values()", fn () => pairs((new Collection([null, 0, '', 'a', [], true, false]))->reject(false)->values()));
probe('C32-D-reject-null-loose', "(new Collection([0, '', false, [], 'a', '0']))->reject(null)->values()", fn () => pairs((new Collection([0, '', false, [], 'a', '0']))->reject(null)->values()));
probe('C32-D-reject-zero-loose', "(new Collection(['a', '0', 0, null, false, '', '0.0']))->reject(0)->values()", fn () => pairs((new Collection(['a', '0', 0, null, false, '', '0.0']))->reject(0)->values()));
probe('C32-D-reject-numeric-string-loose', "(new Collection([1, '01', '1.0', true, '1e0', 'x']))->reject('1')->values()", fn () => pairs((new Collection([1, '01', '1.0', true, '1e0', 'x']))->reject('1')->values()));
probe('C32-D-reject-array-value', "(new Collection([[1, 2], [2, 1], ['1', '2'], 'x']))->reject([1, 2])->values()", fn () => pairs((new Collection([[1, 2], [2, 1], ['1', '2'], 'x']))->reject([1, 2])->values()));

// where(): one-argument form, null key, dot path, loose null/true
probe('C32-D-where-one-arg-truthiness', "(new Collection([['v' => 1], ['v' => 'a'], ['v' => 0], ['v' => '0'], ['v' => ''], ['v' => null], ['v' => []], ['v' => true], ['v' => false]]))->where('v')->keys()", fn () => (new Collection([['v' => 1], ['v' => 'a'], ['v' => 0], ['v' => '0'], ['v' => ''], ['v' => null], ['v' => []], ['v' => true], ['v' => false]]))->where('v')->keys()->all());
probe('C32-D-where-null-key-items', "(new Collection([1, 2, 3, 4]))->where(null, '>', 2)", fn () => pairs((new Collection([1, 2, 3, 4]))->where(null, '>', 2)));
probe('C32-D-where-dot-path', "(new Collection([['a' => ['b' => 1]], ['a' => ['b' => 2]], ['a.b' => 2]]))->where('a.b', 2)->keys()", fn () => (new Collection([['a' => ['b' => 1]], ['a' => ['b' => 2]], ['a.b' => 2]]))->where('a.b', 2)->keys()->all());
probe('C32-D-where-eq-null-loose', "(new Collection([['v' => 0], ['v' => ''], ['v' => false], ['v' => null], ['v' => '0'], ['v' => []], ['v' => 'a']]))->where('v', '=', null)->keys()", fn () => (new Collection([['v' => 0], ['v' => ''], ['v' => false], ['v' => null], ['v' => '0'], ['v' => []], ['v' => 'a']]))->where('v', '=', null)->keys()->all());
probe('C32-D-where-missing-key-null', "(new Collection([['a' => 1], ['b' => 2]]))->where('missing', null)->keys()", fn () => (new Collection([['a' => 1], ['b' => 2]]))->where('missing', null)->keys()->all());
probe('C32-D-where-strict-array-by-value', "(new Collection([['v' => [1, 2]], ['v' => ['1', '2']], ['v' => [2, 1]]]))->whereStrict('v', [1, 2])->keys()", fn () => (new Collection([['v' => [1, 2]], ['v' => ['1', '2']], ['v' => [2, 1]]]))->whereStrict('v', [1, 2])->keys()->all());

// whereNull/whereNotNull: keyed backing and dot path
probe('C32-D-whereNull-keyed', "(new Collection(['a' => null, 'b' => 0, 'c' => null]))->whereNull()", fn () => pairs((new Collection(['a' => null, 'b' => 0, 'c' => null]))->whereNull()));
probe('C32-D-whereNotNull-dot-path', "(new Collection([['a' => ['b' => null]], ['a' => ['b' => 0]], ['a' => []]]))->whereNotNull('a.b')->keys()", fn () => (new Collection([['a' => ['b' => null]], ['a' => ['b' => 0]], ['a' => []]]))->whereNotNull('a.b')->keys()->all());

// whereIn / whereNotIn: in_array's loose == is PHP's, not JS's
$vs = fn (array $values) => new Collection(array_map(fn ($v) => ['v' => $v], $values));
probe('C32-D-whereIn-null-loose', "whereIn('v', [null]) over v = 0, '', false, null, '0', 'a', []", fn () => $vs([0, '', false, null, '0', 'a', []])->whereIn('v', [null])->keys()->all());
probe('C32-D-whereIn-numeric-string-loose', "whereIn('v', ['1e1']) over v = 10, '10', '1e1', '010', 'x'", fn () => $vs([10, '10', '1e1', '010', 'x'])->whereIn('v', ['1e1'])->keys()->all());
probe('C32-D-whereIn-true-loose', "whereIn('v', [true]) over v = 'x', 1, 0, '', null, '0', [1]", fn () => $vs(['x', 1, 0, '', null, '0', [1]])->whereIn('v', [true])->keys()->all());
probe('C32-D-whereIn-array-loose', "whereIn('v', [[1, 2]]) over v = [1, 2], ['1', '2'], [2, 1]", fn () => $vs([[1, 2], ['1', '2'], [2, 1]])->whereIn('v', [[1, 2]])->keys()->all());
probe('C32-D-whereInStrict-array', "whereInStrict('v', [[1, 2]]) over v = [1, 2], ['1', '2']", fn () => $vs([[1, 2], ['1', '2']])->whereInStrict('v', [[1, 2]])->keys()->all());
probe('C32-D-whereNotIn-null-loose', "whereNotIn('v', [null]) over v = 0, '', false, null, '0', 'a', []", fn () => $vs([0, '', false, null, '0', 'a', []])->whereNotIn('v', [null])->keys()->all());
probe('C32-D-whereNotIn-true-loose', "whereNotIn('v', [true]) over v = 'x', 1, 0, '', null, '0', [1]", fn () => $vs(['x', 1, 0, '', null, '0', [1]])->whereNotIn('v', [true])->keys()->all());
probe('C32-D-whereNotInStrict-array', "whereNotInStrict('v', [[1, 2]]) over v = [1, 2], ['1', '2']", fn () => $vs([[1, 2], ['1', '2']])->whereNotInStrict('v', [[1, 2]])->keys()->all());
probe('C32-D-whereIn-collection-values', "whereIn('v', new Collection(['a' => 1, 'b' => 3])) over v = 1..4", fn () => $vs([1, 2, 3, 4])->whereIn('v', new Collection(['a' => 1, 'b' => 3]))->keys()->all());
probe('C32-D-whereIn-null-key', "(new Collection([1, 2, 3]))->whereIn(null, [1, 3])", fn () => pairs((new Collection([1, 2, 3]))->whereIn(null, [1, 3])));

// whereBetween: reset()/end() on the given values
probe('C32-D-whereBetween-three-values', "whereBetween('v', [1, 5, 3]) over v = 0..6", fn () => $vs([0, 1, 2, 3, 4, 5, 6])->whereBetween('v', [1, 5, 3])->keys()->all());
probe('C32-D-whereBetween-keyed-values', "whereBetween('v', ['max' => 3, 'min' => 1]) over v = 0..4", fn () => $vs([0, 1, 2, 3, 4])->whereBetween('v', ['max' => 3, 'min' => 1])->keys()->all());
probe('C32-D-whereBetween-collection-values', "whereBetween('v', new Collection([1, 3])) over v = 0..4", fn () => $vs([0, 1, 2, 3, 4])->whereBetween('v', new Collection([1, 3]))->keys()->all());
probe('C32-D-whereNotBetween-collection-values', "whereNotBetween('v', new Collection([1, 3])) over v = 0..4", fn () => $vs([0, 1, 2, 3, 4])->whereNotBetween('v', new Collection([1, 3]))->keys()->all());
probe('C32-D-whereBetween-null-item', "whereBetween('v', [0, 2]) over v = null, 0, 1, '', false", fn () => $vs([null, 0, 1, '', false])->whereBetween('v', [0, 2])->keys()->all());

// whereInstanceOf with an associative class list
probe('C32-D-whereInstanceOf-assoc-types', "(new Collection([new stdClass, new ArrayObject, new SplStack]))->whereInstanceOf(['a' => stdClass::class, 'b' => SplStack::class])->keys()", fn () => (new Collection([new stdClass, new ArrayObject, new SplStack]))->whereInstanceOf(['a' => stdClass::class, 'b' => SplStack::class])->keys()->all());

// unique(): array_unique(SORT_REGULAR) vs first-seen loose
probe('C32-D-unique-loose-bool-mix', "(new Collection([1, '1', true, 'a']))->unique()", fn () => pairs((new Collection([1, '1', true, 'a']))->unique()));
probe('C32-D-unique-loose-zero-strings', "(new Collection(['a', 0, 'b', '0']))->unique()", fn () => pairs((new Collection(['a', 0, 'b', '0']))->unique()));
probe('C32-D-unique-loose-falsy', "(new Collection([null, 0, '', false]))->unique()", fn () => pairs((new Collection([null, 0, '', false]))->unique()));
probe('C32-D-unique-loose-numeric-strings', "(new Collection([10, '1e1', 'abc', 'ABC', '10.0']))->unique()", fn () => pairs((new Collection([10, '1e1', 'abc', 'ABC', '10.0']))->unique()));
probe('C32-D-unique-keyed', "(new Collection(['a' => 1, 'b' => 1, 'c' => 2]))->unique()", fn () => pairs((new Collection(['a' => 1, 'b' => 1, 'c' => 2]))->unique()));
probe('C32-D-unique-key-loose', "(new Collection([['id' => 1], ['id' => '1'], ['id' => true], ['id' => 2]]))->unique('id')", fn () => pairs((new Collection([['id' => 1], ['id' => '1'], ['id' => true], ['id' => 2]]))->unique('id')));
probe('C32-D-unique-arrays-strict', "(new Collection([[1, 2], ['1', 2], [1, 2]]))->uniqueStrict()", fn () => pairs((new Collection([[1, 2], ['1', 2], [1, 2]]))->uniqueStrict()));
probe('C32-D-unique-arrays-loose', "(new Collection([[1, 2], ['1', 2], [1, 2]]))->unique()", fn () => pairs((new Collection([[1, 2], ['1', 2], [1, 2]]))->unique()));
probe('C32-D-unique-dot-path', "(new Collection([['a' => ['b' => 1]], ['a' => ['b' => 1]], ['a' => ['b' => 2]]]))->unique('a.b')->keys()", fn () => (new Collection([['a' => ['b' => 1]], ['a' => ['b' => 1]], ['a' => ['b' => 2]]]))->unique('a.b')->keys()->all());

// duplicates(): keys of the duplicate are the whole point
probe('C32-D-duplicates-keyed', "(new Collection(['a' => 1, 'b' => 2, 'c' => 1]))->duplicates()", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 1]))->duplicates()));
probe('C32-D-duplicates-list-first-key', "(new Collection(['x', 'y', 'x']))->duplicates()->keys()", fn () => (new Collection(['x', 'y', 'x']))->duplicates()->keys()->all());
probe('C32-D-duplicates-callback-key-arg', "(new Collection(['a' => 1, 'b' => 2]))->duplicates(fn (\$v, \$k) => \$k === 'b' ? 1 : \$v)", fn () => pairs((new Collection(['a' => 1, 'b' => 2]))->duplicates(fn ($v, $k) => $k === 'b' ? 1 : $v)));
probe('C32-D-duplicates-loose-sort-regular', "(new Collection(['a', 0, 'b', '0', 'a']))->duplicates()", fn () => pairs((new Collection(['a', 0, 'b', '0', 'a']))->duplicates()));

// only / except
$kv = ['first' => 'Taylor', 'last' => 'Otwell', 'email' => 'e'];
probe('C32-D-only-null-first-arg', "(new Collection(\$kv))->only(null, 'first')", fn () => pairs((new Collection($kv))->only(null, 'first')));
probe('C32-D-only-array-then-extra-arg', "(new Collection(\$kv))->only(['first'], 'last')", fn () => pairs((new Collection($kv))->only(['first'], 'last')));
probe('C32-D-except-array-then-extra-arg', "(new Collection(\$kv))->except(['first'], 'last')", fn () => pairs((new Collection($kv))->except(['first'], 'last')));
probe('C32-D-only-dot-key-literal', "(new Collection(['a' => ['b' => 1], 'a.b' => 2]))->only('a.b')", fn () => pairs((new Collection(['a' => ['b' => 1], 'a.b' => 2]))->only('a.b')));
probe('C32-D-only-dot-key-nested-miss', "(new Collection(['a' => ['b' => 1, 'c' => 2]]))->only('a.b')", fn () => pairs((new Collection(['a' => ['b' => 1, 'c' => 2]]))->only('a.b')));
probe('C32-D-except-dot-key-literal-first', "(new Collection(['a.b' => 1, 'a' => ['b' => 2]]))->except('a.b')", fn () => pairs((new Collection(['a.b' => 1, 'a' => ['b' => 2]]))->except('a.b')));
probe('C32-D-only-keyed-collection-arg', "(new Collection(\$kv))->only(new Collection(['x' => 'first', 'y' => 'email']))", fn () => pairs((new Collection($kv))->only(new Collection(['x' => 'first', 'y' => 'email']))));
probe('C32-D-except-keyed-collection-arg', "(new Collection(\$kv))->except(new Collection(['x' => 'first', 'y' => 'email']))", fn () => pairs((new Collection($kv))->except(new Collection(['x' => 'first', 'y' => 'email']))));
probe('C32-D-only-list-keys', "(new Collection(['a', 'b', 'c', 'd']))->only([3, 1])", fn () => pairs((new Collection(['a', 'b', 'c', 'd']))->only([3, 1])));
probe('C32-D-except-list-numeric-string', "(new Collection(['a', 'b', 'c']))->except('1')", fn () => pairs((new Collection(['a', 'b', 'c']))->except('1')));
probe('C32-D-only-empty-array', "(new Collection(\$kv))->only([])", fn () => pairs((new Collection($kv))->only([])));
probe('C32-D-except-empty-array', "(new Collection(\$kv))->except([])", fn () => pairs((new Collection($kv))->except([])));

// select
probe('C32-D-select-dot-path-literal', "(new Collection([['id' => 1, 'details' => ['age' => 30, 'city' => 'NY']]]))->select(['id', 'details.age'])", fn () => pairs((new Collection([['id' => 1, 'details' => ['age' => 30, 'city' => 'NY']]]))->select(['id', 'details.age'])));
probe('C32-D-select-object-null-prop', "(new Collection([(object) ['a' => null, 'b' => 1]]))->select('a', 'b')", fn () => pairs((new Collection([(object) ['a' => null, 'b' => 1]]))->select('a', 'b')));
probe('C32-D-select-array-null-value', "(new Collection([['a' => null, 'b' => 1]]))->select('a', 'b')", fn () => pairs((new Collection([['a' => null, 'b' => 1]]))->select('a', 'b')));
probe('C32-D-select-scalar-items', "(new Collection([1, 'x', null]))->select('a')", fn () => pairs((new Collection([1, 'x', null]))->select('a')));
probe('C32-D-select-object-method-name', "(new Collection([new Collection(['a' => 1])]))->select('all', 'a')", fn () => pairs((new Collection([new Collection(['a' => 1])]))->select('all', 'a')));
probe('C32-D-select-null-then-key', "(new Collection([['a' => 1, 'b' => 2]]))->select(null, 'a')", fn () => pairs((new Collection([['a' => 1, 'b' => 2]]))->select(null, 'a')));
probe('C32-D-select-int-key', "(new Collection([[10, 20, 30]]))->select([0, 2])", fn () => pairs((new Collection([[10, 20, 30]]))->select([0, 2])));

// partition
probe('C32-D-partition-null-key-truthiness', "(new Collection([1, 0, '', 'a', null, [], '0']))->partition(null)", fn () => array_map(fn ($p) => pairs($p->values()), (new Collection([1, 0, '', 'a', null, [], '0']))->partition(null)->all()));
probe('C32-D-partition-two-arg-null', "(new Collection([['v' => null], ['v' => 0], ['v' => 1]]))->partition('v', null)", fn () => array_map(fn ($p) => $p->keys()->all(), (new Collection([['v' => null], ['v' => 0], ['v' => 1]]))->partition('v', null)->all()));
probe('C32-D-partition-not-equal-operator', "(new Collection([['v' => 1], ['v' => '1'], ['v' => 2]]))->partition('v', '!=', 1)", fn () => array_map(fn ($p) => $p->keys()->all(), (new Collection([['v' => 1], ['v' => '1'], ['v' => 2]]))->partition('v', '!=', 1)->all()));
probe('C32-D-partition-outer-keys', "(new Collection(['a' => 1, 'b' => 2]))->partition(fn (\$v) => \$v > 1)->keys()", fn () => (new Collection(['a' => 1, 'b' => 2]))->partition(fn ($v) => $v > 1)->keys()->all());
// The engine's message names the calling file and line, so record only its path-free head.
probe('C32-D-partition-no-args', "(new Collection([1]))->partition()", function () {
    try {
        return (new Collection([1]))->partition()->count();
    } catch (\ArgumentCountError $e) {
        return get_class($e) . ': ' . preg_replace('/ passed in .*$/', ' passed', $e->getMessage());
    }
});

// skipUntil / skipWhile / takeUntil / takeWhile (eager wrappers over LazyCollection)
probe('C32-D-skipUntil-list-keys', "(new Collection([1, 2, 3, 4]))->skipUntil(3)", fn () => pairs((new Collection([1, 2, 3, 4]))->skipUntil(3)));
probe('C32-D-skipUntil-keyed', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->skipUntil(2)", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->skipUntil(2)));
probe('C32-D-skipUntil-strict-value', "(new Collection([1, 2, 3, 4]))->skipUntil('3')", fn () => pairs((new Collection([1, 2, 3, 4]))->skipUntil('3')));
probe('C32-D-skipUntil-callback-key', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->skipUntil(fn (\$v, \$k) => \$k === 'b')", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->skipUntil(fn ($v, $k) => $k === 'b')));
probe('C32-D-skipWhile-keyed', "(new Collection(['a' => 1, 'b' => 2, 'c' => 1]))->skipWhile(1)", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 1]))->skipWhile(1)));
probe('C32-D-skipWhile-list-keys', "(new Collection([1, 1, 2, 1]))->skipWhile(1)", fn () => pairs((new Collection([1, 1, 2, 1]))->skipWhile(1)));
probe('C32-D-skipWhile-strict-value', "(new Collection([1, 1, 2]))->skipWhile('1')", fn () => pairs((new Collection([1, 1, 2]))->skipWhile('1')));
probe('C32-D-skipWhile-callback-key', "(new Collection(['x', 'y', 'z']))->skipWhile(fn (\$v, \$k) => \$k < 1)", fn () => pairs((new Collection(['x', 'y', 'z']))->skipWhile(fn ($v, $k) => $k < 1)));
probe('C32-D-takeUntil-strict-value', "(new Collection([1, 2, 3, 4]))->takeUntil('3')", fn () => pairs((new Collection([1, 2, 3, 4]))->takeUntil('3')));
probe('C32-D-takeUntil-keyed', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->takeUntil(3)", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->takeUntil(3)));
probe('C32-D-takeUntil-callback-key', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->takeUntil(fn (\$v, \$k) => \$k === 'c')", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->takeUntil(fn ($v, $k) => $k === 'c')));
probe('C32-D-takeWhile-strict-value', "(new Collection([1, 1, 2]))->takeWhile('1')", fn () => pairs((new Collection([1, 1, 2]))->takeWhile('1')));
probe('C32-D-takeWhile-keyed', "(new Collection(['a' => 1, 'b' => 1, 'c' => 2, 'd' => 1]))->takeWhile(1)", fn () => pairs((new Collection(['a' => 1, 'b' => 1, 'c' => 2, 'd' => 1]))->takeWhile(1)));
probe('C32-D-takeWhile-callback-key', "(new Collection(['x', 'y', 'z']))->takeWhile(fn (\$v, \$k) => \$k < 2)", fn () => pairs((new Collection(['x', 'y', 'z']))->takeWhile(fn ($v, $k) => $k < 2)));
probe('C32-D-takeWhile-null-value', "(new Collection([null, null, 0]))->takeWhile(null)", fn () => pairs((new Collection([null, null, 0]))->takeWhile(null)));
probe('C32-D-takeUntil-empty', "(new Collection([]))->takeUntil(1)", fn () => pairs((new Collection([]))->takeUntil(1)));
probe('C32-D-skipUntil-out-of-order-keys', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->skipUntil('a')", fn () => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->skipUntil('a')));

probe('C32-D-filter-keeps-empty-objects', "(new Collection([new DateTime('@0'), new stdClass, new ArrayObject, new SplObjectStorage, 'x']))->filter()->count()", fn () => (new Collection([new DateTime('@0'), new stdClass, new ArrayObject, new SplObjectStorage, 'x']))->filter()->count());
probe('C32-D-filter-callback-string-zero', "(new Collection([1, 2]))->filter(fn (\$v) => \$v > 1 ? '0' : 'x')", fn () => pairs((new Collection([1, 2]))->filter(fn ($v) => $v > 1 ? '0' : 'x')));
probe('C32-D-reject-none-empty-objects', "(new Collection([new DateTime('@0'), new stdClass]))->reject()->count()", fn () => (new Collection([new DateTime('@0'), new stdClass]))->reject()->count());
probe('C32-D-where-one-arg-empty-object', "(new Collection([['v' => new DateTime('@0')], ['v' => new stdClass]]))->where('v')->count()", fn () => (new Collection([['v' => new DateTime('@0')], ['v' => new stdClass]]))->where('v')->count());
probe('C32-D-partition-null-empty-objects', "(new Collection([new DateTime('@0'), new stdClass]))->partition(null) counts", fn () => array_map(fn ($p) => $p->count(), (new Collection([new DateTime('@0'), new stdClass]))->partition(null)->all()));
probe('C32-D-partition-bool-false-two-arg', "(new Collection([['v' => false], ['v' => 0], ['v' => null], ['v' => 1]]))->partition('v', false) keys", fn () => array_map(fn ($p) => $p->keys()->all(), (new Collection([['v' => false], ['v' => 0], ['v' => null], ['v' => 1]]))->partition('v', false)->all()));
probe('C32-D-data-get-literal-dotted-key', "data_get(['a.b' => 1, 'a' => ['b' => 2]], 'a.b') and data_get(['a.b' => 1], 'a.b', 'miss')", fn () => [data_get(['a.b' => 1, 'a' => ['b' => 2]], 'a.b'), data_get(['a.b' => 1], 'a.b', 'miss')]);
probe('C32-D-where-wildcard-path', "(new Collection([['a' => [['b' => 1], ['b' => 2]]], ['a' => [['b' => 3]]]]))->where('a.*.b', [1, 2])->keys()", fn () => (new Collection([['a' => [['b' => 1], ['b' => 2]]], ['a' => [['b' => 3]]]]))->where('a.*.b', [1, 2])->keys()->all());
probe('C32-D-unique-non-transitive-loose', "(new Collection(['abc', '0', false, '']))->unique()", fn () => pairs((new Collection(['abc', '0', false, '']))->unique()));
probe('C32-D-unique-strict-null-key', "(new Collection([1, '1', 1, true]))->unique(null, true)", fn () => pairs((new Collection([1, '1', 1, true]))->unique(null, true)));
probe('C32-D-duplicates-non-transitive-loose', "(new Collection(['abc', '0', false, '']))->duplicates()", fn () => pairs((new Collection(['abc', '0', false, '']))->duplicates()));
probe('C32-D-duplicates-out-of-order', "(new Collection([2 => 'a', 0 => 'b', 1 => 'a']))->duplicates()", fn () => pairs((new Collection([2 => 'a', 0 => 'b', 1 => 'a']))->duplicates()));
probe('C32-D-duplicates-list-then-push', "(new Collection(['x', 'y', 'x']))->duplicates()->push('z')", fn () => pairs((new Collection(['x', 'y', 'x']))->duplicates()->push('z')));
probe('C32-D-select-collection-rows', "(new Collection([new Collection(['a' => 1, 'b' => 2])]))->select('a')", fn () => pairs((new Collection([new Collection(['a' => 1, 'b' => 2])]))->select('a')));
probe('C32-D-select-prototype-key-names', "(new Collection([['a' => 1]]))->select('toString', 'constructor', 'a')", fn () => pairs((new Collection([['a' => 1]]))->select('toString', 'constructor', 'a')));

/** The rows as a list, or keyed 'x', 'y', 'z' in order. */
function c32d_items(bool $keyed, array $rows): Collection
{
    return new Collection($keyed ? array_combine(array_slice(['x', 'y', 'z'], 0, count($rows)), $rows) : $rows);
}

probe('C32-D-item-paths-by-backing', "where('a.b', 2) and where('a.*.b', [1, 2]) keys, pluck('a.b'), value('a.b') and value('a.b', 'miss'), keyBy(['a', 'b']) and keyBy(['id', 'name']) keys, over a list and over 'x', 'y', 'z'", fn () => array_map(fn (bool $keyed) => [
    'whereDotPath' => c32d_items($keyed, [['a' => ['b' => 1]], ['a' => ['b' => 2]], ['a.b' => 2]])->where('a.b', 2)->keys()->all(),
    'whereWildcardPath' => c32d_items($keyed, [['a' => [['b' => 1], ['b' => 2]]], ['a' => [['b' => 3]]]])->where('a.*.b', [1, 2])->keys()->all(),
    'pluckDotPath' => c32d_items($keyed, [['a.b' => 1, 'a' => ['b' => 2]]])->pluck('a.b')->all(),
    'valueDotPath' => c32d_items($keyed, [['a.b' => 1, 'a' => ['b' => 2]]])->value('a.b'),
    'valueDotPathMiss' => c32d_items($keyed, [['a.b' => 1]])->value('a.b', 'miss'),
    'keyByNestedPath' => c32d_items($keyed, [['a' => ['b' => 'z']]])->keyBy(['a', 'b'])->keys()->all(),
    'keyByUnreachablePath' => c32d_items($keyed, [['id' => 1, 'name' => 'John']])->keyBy(['id', 'name'])->keys()->all(),
], ['list' => false, 'keyed' => true]));
probe('C32-D-item-paths-filtered-values', "what the filters keep, read as values: where('a.b', 2) and where('a.*.b', [1, 2]) over plain rows, and where('k', 'b'), whereIn('k', ['a']), whereNotIn('k', ['a']) and whereNotBetween('v', [2, 2]) over c32c_rows as each row's 'v'", fn () => array_map(fn (bool $keyed) => [
    'whereDotPath' => c32d_items($keyed, [['a' => ['b' => 1]], ['a' => ['b' => 2]], ['a.b' => 2]])->where('a.b', 2)->values()->all(),
    'whereWildcardPath' => c32d_items($keyed, [['a' => [['b' => 1], ['b' => 2]]], ['a' => [['b' => 3]]]])->where('a.*.b', [1, 2])->values()->all(),
    'where' => c32c_rows($keyed)->where('k', 'b')->pluck('v')->all(),
    'whereIn' => c32c_rows($keyed)->whereIn('k', ['a'])->pluck('v')->all(),
    'whereNotIn' => c32c_rows($keyed)->whereNotIn('k', ['a'])->pluck('v')->all(),
    'whereNotBetween' => c32c_rows($keyed)->whereNotBetween('v', [2, 2])->pluck('v')->all(),
], ['list' => false, 'keyed' => true]));
probe('C32-D-unique-collection-rows', "c32c_rows(list | keyed)->unique('k'): keys and each row's 'v'", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->unique('k')->keys()->all(),
    c32c_rows($keyed)->unique('k')->pluck('v')->all(),
], ['list' => false, 'keyed' => true]));
probe('C32-D-duplicates-collection-rows', "c32c_rows(list | keyed)->duplicates('k'): keys and values", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->duplicates('k')->keys()->all(),
    c32c_rows($keyed)->duplicates('k')->values()->all(),
], ['list' => false, 'keyed' => true]));
probe('C32-D-partition-collection-rows', "c32c_rows(list | keyed)->partition('k', 'b'): each half's keys and each row's 'v'", fn () => array_map(fn (bool $keyed) => array_map(fn (Collection $half) => [
    $half->keys()->all(),
    $half->pluck('v')->all(),
], c32c_rows($keyed)->partition('k', 'b')->all()), ['list' => false, 'keyed' => true]));

/** The c32c rows as plain arrays, the shape a JS Map row stands for. */
function c32d_array_rows(bool $keyed): Collection
{
    $rows = [['k' => 'b', 'v' => 1], ['k' => 'a', 'v' => 2], ['k' => 'b', 'v' => 3]];

    return new Collection($keyed ? array_combine(['x', 'y', 'z'], $rows) : $rows);
}

probe('C32-D-array-rows-by-backing', "c32d_array_rows(list | keyed): contains('k', 'a'), where('k', 'b') v's, firstWhere('k', 'a'), value('v'), pluck('v') and pluck('v', 'k'), sortBy('k') v's, groupBy('k') and keyBy('k') v's, whereIn('k', ['a']) v's", fn () => array_map(fn (bool $keyed) => [
    'contains' => c32d_array_rows($keyed)->contains('k', 'a'),
    'where' => c32d_array_rows($keyed)->where('k', 'b')->pluck('v')->all(),
    'firstWhere' => c32d_array_rows($keyed)->firstWhere('k', 'a'),
    'value' => c32d_array_rows($keyed)->value('v'),
    'pluck' => c32d_array_rows($keyed)->pluck('v')->all(),
    'pluckKeyed' => c32d_array_rows($keyed)->pluck('v', 'k')->all(),
    'sortBy' => c32d_array_rows($keyed)->sortBy('k')->pluck('v')->all(),
    'groupBy' => c32d_array_rows($keyed)->groupBy('k')->map(fn (Collection $group) => $group->pluck('v')->all())->all(),
    'keyBy' => c32d_array_rows($keyed)->keyBy('k')->map(fn (array $row) => $row['v'])->all(),
    'whereIn' => c32d_array_rows($keyed)->whereIn('k', ['a'])->pluck('v')->all(),
], ['list' => false, 'keyed' => true]));
probe('C32-D-where-in-collection-rows', "c32c_rows(list | keyed): whereIn('k', ['a']) / whereNotIn('k', ['a']) / whereNotBetween('v', [2, 2]) keys, containsStrict('k', 'a')", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->whereIn('k', ['a'])->keys()->all(),
    c32c_rows($keyed)->whereNotIn('k', ['a'])->keys()->all(),
    c32c_rows($keyed)->whereNotBetween('v', [2, 2])->keys()->all(),
    c32c_rows($keyed)->containsStrict('k', 'a'),
], ['list' => false, 'keyed' => true]));

/** An ArrayAccess that is not Enumerable, whose offsetExists is isset. */
class C32D_Access implements ArrayAccess
{
    public function __construct(private array $items) {}
    public function offsetExists(mixed $offset): bool { return isset($this->items[$offset]); }
    public function offsetGet(mixed $offset): mixed { return $this->items[$offset]; }
    public function offsetSet(mixed $offset, mixed $value): void { $this->items[$offset] = $value; }
    public function offsetUnset(mixed $offset): void { unset($this->items[$offset]); }
}

probe('C32-D-data-get-collection-target', "data_get over a Collection: 'a.b', '*.b' over Collection rows, a null value with a default, and the protected 'items' property", fn () => [
    data_get(new Collection(['a' => ['b' => 1]]), 'a.b'),
    data_get(new Collection([new Collection(['b' => 1]), new Collection(['b' => 2])]), '*.b'),
    data_get(new Collection(['v' => null]), 'v', 'def'),
    data_get(new Collection(['a' => 1]), 'items'),
]);
probe('C32-D-data-has-collection-target', "data_has over a Collection: a null value, 'a.b', a missing key; and data_has with a null or an empty key", fn () => [
    data_has(new Collection(['v' => null]), 'v'),
    data_has(new Collection(['a' => ['b' => 1]]), 'a.b'),
    data_has(new Collection(['a' => 1]), 'b'),
    data_has(['a' => 1], null),
    data_has(['a' => 1], []),
]);
probe('C32-D-data-get-arrayaccess-target', "an ArrayAccess that is not Enumerable: data_get 'a', data_has 'n' (null) and 'a', data_get 'missing' with a default", function () {
    $target = new C32D_Access(['a' => 1, 'n' => null]);

    return [data_get($target, 'a'), data_has($target, 'n'), data_has($target, 'a'), data_get($target, 'missing', 'def')];
});

/** An ArrayAccess whose offsetExists gives the same answer for every offset. */
class C32D_AnsweringAccess implements ArrayAccess
{
    public function __construct(private array $items, private mixed $answer) {}
    #[\ReturnTypeWillChange]
    public function offsetExists(mixed $offset) { return $this->answer; }
    public function offsetGet(mixed $offset): mixed { return $this->items[$offset]; }
    public function offsetSet(mixed $offset, mixed $value): void { $this->items[$offset] = $value; }
    public function offsetUnset(mixed $offset): void { unset($this->items[$offset]); }
}

probe('C32-D-data-get-offset-exists-php-truthiness', "[data_get(\$t, 'a'), data_has(\$t, 'a')] for \$t = new C32D_AnsweringAccess(['a' => 1], \$answer), offsetExists answering '0', [], new DateTime('@0') and 'x'", fn () => array_map(fn ($answer) => [
    data_get(new C32D_AnsweringAccess(['a' => 1], $answer), 'a'),
    data_has(new C32D_AnsweringAccess(['a' => 1], $answer), 'a'),
], ['0', [], new DateTime('@0'), 'x']));

/** An object with one public property that holds null. */
class C32D_Point { public $p = null; }

probe('C32-D-data-get-array-path-dotted-segment', "data_get(['a.b' => 1, 'a' => ['b' => 2]], ['a.b'])", fn () => data_get(['a.b' => 1, 'a' => ['b' => 2]], ['a.b']));
probe('C32-D-data-has-array-and-object-targets', "data_has(['a' => null], 'a') / data_has([10, 20], '1') / data_has([10], '01') / data_has(new C32D_Point, 'p') / data_has(new C32D_Point, 'q')", fn () => [
    data_has(['a' => null], 'a'),
    data_has([10, 20], '1'),
    data_has([10], '01'),
    data_has(new C32D_Point, 'p'),
    data_has(new C32D_Point, 'q'),
]);

// ---- Family E ------------------------------------------------------------

enum C32E_Pure { case A; }
enum C32E_Int: int { case A = 1; case B = 2; }
enum C32E_Str: string { case A = 'A'; case B = 'B'; }
enum C32E_Staff { case Taylor; case Joe; case James; }
class C32E_Args { public array $args; public function __construct(...$args) { $this->args = $args; } }
class C32E_Accessor { public function __construct(protected array $attributes) {}
    public function __get($k) { return $k === 'some' ? $this->attributes['some'] : null; }
    public function __isset($k) { return $k === 'some'; } }
/** Each entry as [key, gettype(key), value]; nested Collections become ['Collection' => entries], preserving order. */
function c32e_pairs($items): array { $out = []; foreach ($items as $k => $v) { $out[] = [$k, gettype($k), $v instanceof Collection ? ['Collection' => c32e_pairs($v)] : $v]; } return $out; }

probe('C32-E-mapWithKeys-overwriting-keys', "collect([['id'=>1,'name'=>'A'],['id'=>2,'name'=>'B'],['id'=>1,'name'=>'C']])->mapWithKeys(fn (\$i) => [\$i['id'] => \$i['name']])", fn () => c32e_pairs((new Collection([['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B'], ['id' => 1, 'name' => 'C']]))->mapWithKeys(fn ($i) => [$i['id'] => $i['name']])));
probe('C32-E-mapWithKeys-multiple-rows-order', "collect(rows 1..3)->mapWithKeys(fn (\$i) => [\$i['id'] => \$i['name'], \$i['name'] => \$i['id']])->keys()", fn () => (new Collection([['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B'], ['id' => 3, 'name' => 'C']]))->mapWithKeys(fn ($i) => [$i['id'] => $i['name'], $i['name'] => $i['id']])->keys()->all());
probe('C32-E-mapWithKeys-callback-key-type', "collect([1 => 'a', 'x' => 'b'])->mapWithKeys(fn (\$v, \$k) => [\$v => gettype(\$k)])", fn () => (new Collection([1 => 'a', 'x' => 'b']))->mapWithKeys(fn ($v, $k) => [$v => gettype($k)])->all());
probe('C32-E-mapWithKeys-returns-collection', "collect([1, 2])->mapWithKeys(fn (\$v) => collect(['k'.\$v => \$v]))", fn () => (new Collection([1, 2]))->mapWithKeys(fn ($v) => new Collection(['k'.$v => $v]))->all());
probe('C32-E-keyed-results-empty', "collect([])->mapWithKeys(...), ->groupBy('x'), ->countBy(), ->keyBy('x'), ->flip()", fn () => ['mapWithKeys' => (new Collection([]))->mapWithKeys(fn ($v) => [$v => $v])->all(), 'groupBy' => (new Collection([]))->groupBy('x')->all(), 'countBy' => (new Collection([]))->countBy()->all(), 'keyBy' => (new Collection([]))->keyBy('x')->all(), 'flip' => (new Collection([]))->flip()->all()]);
probe('C32-E-mapToDictionary-int-key-order', "collect([3, 1, 3, 2])->mapToDictionary(fn (\$v, \$k) => [\$v => \$k])", fn () => c32e_pairs((new Collection([3, 1, 3, 2]))->mapToDictionary(fn ($v, $k) => [$v => $k])));
probe('C32-E-mapToDictionary-multi-pair-takes-first', "collect([1, 2])->mapToDictionary(fn (\$v) => ['a' => \$v, 'b' => \$v * 10])", fn () => (new Collection([1, 2]))->mapToDictionary(fn ($v) => ['a' => $v, 'b' => $v * 10])->all());
probe('C32-E-mapToDictionary-list-return', "collect([['id'=>1,'name'=>'A'],['id'=>2,'name'=>'B']])->mapToDictionary(fn (\$i) => [\$i['name'], \$i['id']])", fn () => c32e_pairs((new Collection([['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B']]))->mapToDictionary(fn ($i) => [$i['name'], $i['id']])));
probe('C32-E-mapToDictionary-one-item-list-return', "collect([['name'=>'A'],['name'=>'B']])->mapToDictionary(fn (\$i) => [\$i['name']])", fn () => c32e_pairs((new Collection([['name' => 'A'], ['name' => 'B']]))->mapToDictionary(fn ($i) => [$i['name']])));
probe('C32-E-mapToGroups-int-key-order', "collect([3, 1, 3])->mapToGroups(fn (\$v, \$k) => [\$v => \$k])", fn () => c32e_pairs((new Collection([3, 1, 3]))->mapToGroups(fn ($v, $k) => [$v => $k])));
probe('C32-E-mapSpread-scalar-row', "collect([10, 20])->mapSpread(fn (...\$a) => \$a)", fn () => (new Collection([10, 20]))->mapSpread(fn (...$a) => $a)->all());
probe('C32-E-eachSpread-scalar-row', "collect([10, 20])->eachSpread(fn (...\$a) => null)", fn () => (new Collection([10, 20]))->eachSpread(fn (...$a) => null)->all());
probe('C32-E-mapInto-constructor-args', "collect(['first', 'second'])->mapInto(C32E_Args::class) ctor args", fn () => (new Collection(['first', 'second']))->mapInto(C32E_Args::class)->map(fn ($o) => $o->args)->all());
probe('C32-E-mapInto-constructor-args-assoc', "collect(['x' => 'first'])->mapInto(C32E_Args::class) ctor args", fn () => (new Collection(['x' => 'first']))->mapInto(C32E_Args::class)->map(fn ($o) => $o->args)->all());
probe('C32-E-mapInto-backed-enums', "collect([1, 2])->mapInto(IntEnum) and collect(['A','B'])->mapInto(StrEnum): case names", fn () => ['int' => array_map(fn ($e) => $e->name, (new Collection([1, 2]))->mapInto(C32E_Int::class)->all()), 'string' => array_map(fn ($e) => $e->name, (new Collection(['A', 'B']))->mapInto(C32E_Str::class)->all())]);
probe('C32-E-each-mixed-keys', "collect([1, 2, 'foo' => 'bar', 'bam' => 'baz'])->each(copy)", function () { $r = []; (new Collection([1, 2, 'foo' => 'bar', 'bam' => 'baz']))->each(function ($v, $k) use (&$r) { $r[] = [$k, gettype($k), $v]; }); return $r; });
probe('C32-E-each-stop-on-string-key', "same, returning false on the first string key", function () { $r = []; (new Collection([1, 2, 'foo' => 'bar', 'bam' => 'baz']))->each(function ($v, $k) use (&$r) { $r[] = [$k, gettype($k), $v]; if (is_string($k)) { return false; } }); return $r; });
probe('C32-E-each-key-type-array-items', "collect([['a' => 1], ['b' => 2]])->each(gettype(\$k)) and collect([5 => ['a' => 1]])", function () { $r = []; (new Collection([['a' => 1], ['b' => 2]]))->each(function ($v, $k) use (&$r) { $r[] = gettype($k); }); (new Collection([5 => ['a' => 1]]))->each(function ($v, $k) use (&$r) { $r[] = gettype($k); }); return $r; });
probe('C32-E-groupBy-groups-are-collections', "collect([['r'=>1],['r'=>1]])->groupBy('r')->get(1): class and count", fn () => ['class' => get_class((new Collection([['r' => 1], ['r' => 1]]))->groupBy('r')->get(1)), 'count' => (new Collection([['r' => 1], ['r' => 1]]))->groupBy('r')->get(1)->count()]);
probe('C32-E-groupBy-multilevel-shape', "groupBy(['skilllevel', fn => roles], true) with users as leaves", fn () => c32e_pairs((new Collection([10 => ['user' => 1, 'skilllevel' => 1, 'roles' => ['Role_1', 'Role_3']], 20 => ['user' => 2, 'skilllevel' => 1, 'roles' => ['Role_1', 'Role_2']], 30 => ['user' => 3, 'skilllevel' => 2, 'roles' => ['Role_1']], 40 => ['user' => 4, 'skilllevel' => 2, 'roles' => ['Role_2']]]))->groupBy(['skilllevel', fn ($i) => $i['roles']], true)->map(fn ($l1) => $l1->map(fn ($l2) => $l2->map(fn ($r) => $r['user'])))));
probe('C32-E-groupBy-enum-key', "groupBy('name') over pure A, int-backed A (1), string-backed A ('A'): group keys => item keys", fn () => c32e_pairs((new Collection([['name' => C32E_Pure::A], ['name' => C32E_Int::A], ['name' => C32E_Str::A]]))->groupBy('name')->map(fn ($g) => $g->keys()->all())));
probe('C32-E-groupBy-backed-enum-key', "groupBy('rating') over int-backed A, B: counts", fn () => c32e_pairs((new Collection([['rating' => C32E_Int::A], ['rating' => C32E_Int::B]]))->groupBy('rating')->map->count()));
probe('C32-E-groupBy-bool-key-order', "collect([['a'=>true],['a'=>false],['a'=>true]])->groupBy('a'): counts", fn () => c32e_pairs((new Collection([['a' => true], ['a' => false], ['a' => true]]))->groupBy('a')->map->count()));
probe('C32-E-groupBy-float-key', "@collect([1, 2])->groupBy(fn () => 1.5): counts", fn () => c32e_pairs(@(new Collection([1, 2]))->groupBy(fn () => 1.5)->map->count()));
probe('C32-E-groupBy-int-key-order', "collect([['r'=>2],['r'=>1],['r'=>2]])->groupBy('r')->keys()", fn () => (new Collection([['r' => 2], ['r' => 1], ['r' => 2]]))->groupBy('r')->keys()->all());
probe('C32-E-groupBy-callback-key-type', "collect(['a', 'b'])->groupBy(fn (\$v, \$k) => gettype(\$k))->keys()", fn () => (new Collection(['a', 'b']))->groupBy(fn ($v, $k) => gettype($k))->keys()->all());
probe('C32-E-groupBy-preserve-keys-list-backing', "collect(['a','b','c'])->groupBy(fn (\$v, \$k) => \$k % 2 ? 'odd' : 'even', true)", fn () => c32e_pairs((new Collection(['a', 'b', 'c']))->groupBy(fn ($v, $k) => $k % 2 ? 'odd' : 'even', true)));
probe('C32-E-groupBy-empty-and-null-array-arg', "collect([1, 2, 1])->groupBy([]) and ->groupBy([null])", fn () => ['empty' => c32e_pairs((new Collection([1, 2, 1]))->groupBy([])), 'null' => c32e_pairs((new Collection([1, 2, 1]))->groupBy([null]))]);
probe('C32-E-keyBy-int-key-order', "collect([['id'=>3],['id'=>1],['id'=>2]])->keyBy('id')->keys()", fn () => (new Collection([['id' => 3], ['id' => 1], ['id' => 2]]))->keyBy('id')->keys()->all());
probe('C32-E-keyBy-enum-keys', "keyBy over int-backed B then A, and keyBy(fn => pure A)", fn () => ['int' => c32e_pairs((new Collection([['id' => 1, 's' => C32E_Int::B], ['id' => 2, 's' => C32E_Int::A]]))->keyBy('s')->map(fn ($r) => $r['id'])), 'pure' => (new Collection([1]))->keyBy(fn () => C32E_Pure::A)->keys()->all()]);
probe('C32-E-keyBy-stringable-keys', "keyBy(fn => object with __toString) and keyBy(fn => new Stringable('Lara'))", fn () => ['toString' => (new Collection([1]))->keyBy(fn () => new class { public function __toString() { return 'Framework'; } })->keys()->all(), 'stringable' => (new Collection([1]))->keyBy(fn () => new Stringable('Lara'))->keys()->all()]);
probe('C32-E-keyBy-callback-key-type', "collect([1 => 'a', 'x' => 'b'])->keyBy(fn (\$v, \$k) => \$v.':'.gettype(\$k))->keys()", fn () => (new Collection([1 => 'a', 'x' => 'b']))->keyBy(fn ($v, $k) => $v.':'.gettype($k))->keys()->all());
probe('C32-E-keyBy-array-path', "collect([['a'=>['b'=>'z']]])->keyBy(['a','b']) and collect([['id'=>1,'name'=>'John']])->keyBy(['id','name'])", fn () => ['nested' => (new Collection([['a' => ['b' => 'z']]]))->keyBy(['a', 'b'])->keys()->all(), 'jsdoc' => (new Collection([['id' => 1, 'name' => 'John']]))->keyBy(['id', 'name'])->keys()->all()]);
probe('C32-E-countBy-bools', "collect([true, true, false, false, false])->countBy()", fn () => c32e_pairs((new Collection([true, true, false, false, false]))->countBy()));
probe('C32-E-countBy-pure-enum', "collect([Staff::James, Staff::Joe, Staff::Taylor])->countBy()", fn () => c32e_pairs((new Collection([C32E_Staff::James, C32E_Staff::Joe, C32E_Staff::Taylor]))->countBy()));
probe('C32-E-countBy-key-backed-enum', "collect([['key'=>IntEnum::A],['key'=>IntEnum::B],['key'=>IntEnum::B]])->countBy('key')", fn () => c32e_pairs((new Collection([['key' => C32E_Int::A], ['key' => C32E_Int::B], ['key' => C32E_Int::B]]))->countBy('key')));
probe('C32-E-countBy-callback-bool', "collect([1, 2, 3, 4, 5])->countBy(fn (\$i) => \$i % 2 === 0)", fn () => c32e_pairs((new Collection([1, 2, 3, 4, 5]))->countBy(fn ($i) => $i % 2 === 0)));
probe('C32-E-countBy-callback-string-enum', "collect(['A','A','B','A'])->countBy(fn (\$i) => StrEnum::from(\$i))", fn () => c32e_pairs((new Collection(['A', 'A', 'B', 'A']))->countBy(fn ($i) => C32E_Str::from($i))));
probe('C32-E-countBy-int-key-order', "collect([3, 1, 3])->countBy()", fn () => c32e_pairs((new Collection([3, 1, 3]))->countBy()));
probe('C32-E-countBy-float', "@collect([1.5, 1.7, 2.5])->countBy()", fn () => c32e_pairs(@(new Collection([1.5, 1.7, 2.5]))->countBy()));
probe('C32-E-countBy-callback-key-type', "collect(['a', 'b'])->countBy(fn (\$v, \$k) => gettype(\$k))", fn () => c32e_pairs((new Collection(['a', 'b']))->countBy(fn ($v, $k) => gettype($k))));
probe('C32-E-pluck-accessor', "collect([accessor(some=foo), accessor(some=bar)])->pluck('some')", fn () => (new Collection([new C32E_Accessor(['some' => 'foo']), new C32E_Accessor(['some' => 'bar'])]))->pluck('some')->all());
probe('C32-E-pluck-int-key-order', "collect([['id'=>3,'n'=>'c'],['id'=>1,'n'=>'a'],['id'=>2,'n'=>'b']])->pluck('n', 'id')", fn () => c32e_pairs((new Collection([['id' => 3, 'n' => 'c'], ['id' => 1, 'n' => 'a'], ['id' => 2, 'n' => 'b']]))->pluck('n', 'id')));
probe('C32-E-pluck-key-path-casts', "@collect([k=null, k=true, k=false, k=1.5])->pluck('v', 'k')", fn () => c32e_pairs(@(new Collection([['k' => null, 'v' => 'n'], ['k' => true, 'v' => 't'], ['k' => false, 'v' => 'f'], ['k' => 1.5, 'v' => 'fl']]))->pluck('v', 'k')));
probe('C32-E-pluck-key-closure-casts', "collect([['v'=>'x'],['v'=>'y']])->pluck('v', fn (\$r) => \$r['v'] === 'x') and @->pluck('v', fn () => 1.5)", fn () => ['bool' => c32e_pairs((new Collection([['v' => 'x'], ['v' => 'y']]))->pluck('v', fn ($r) => $r['v'] === 'x')), 'float' => c32e_pairs(@(new Collection([['v' => 'x']]))->pluck('v', fn () => 1.5))]);
probe('C32-E-pluck-nested-collections', "collect([collect(['a'=>1]), collect(['a'=>2])])->pluck('a')", fn () => (new Collection([new Collection(['a' => 1]), new Collection(['a' => 2])]))->pluck('a')->all());
probe('C32-E-flip-int-key-order', "collect(['x' => 3, 'y' => 1])->flip() and the testFlipSkipsUnsupportedValues order", fn () => ['ints' => c32e_pairs((new Collection(['x' => 3, 'y' => 1]))->flip()), 'skips' => c32e_pairs(@(new Collection(['string' => 'taylor', 'integer' => 1, 'null' => null, 'false' => false, 'true' => true, 'float' => 1.5, 'array' => [], 'object' => new stdClass]))->flip())]);
probe('C32-E-collapse-nested-collections', "collect([collect([1,2,3]), collect([4,5,6])])->collapse() and collect([[o1],[o2]])->collapse() count", fn () => ['collections' => (new Collection([new Collection([1, 2, 3]), new Collection([4, 5, 6])]))->collapse()->all(), 'objects' => (new Collection([[new stdClass], [new stdClass]]))->collapse()->count()]);
probe('C32-E-collapseWithKeys-int-key-order', "collect([[1=>'a'],[3=>'c'],[2=>'b'],'drop'])->collapseWithKeys()", fn () => c32e_pairs((new Collection([[1 => 'a'], [3 => 'c'], [2 => 'b'], 'drop']))->collapseWithKeys()));
probe('C32-E-collapseWithKeys-skips-object-item', "collect([[1, 2], new DateTime('@0')])->collapseWithKeys()", fn () => c32e_pairs((new Collection([[1, 2], new DateTime('@0')]))->collapseWithKeys()));
probe('C32-E-keyed-results-mixed-key-order', "a string key produced before an int key: groupBy/countBy/keyBy/pluck/mapToDictionary/collapseWithKeys/flip ->keys()", fn () => [
    'groupBy' => (new Collection([['k' => 's'], ['k' => 5]]))->groupBy('k')->keys()->all(),
    'countBy' => (new Collection(['s', 5]))->countBy()->keys()->all(),
    'keyBy' => (new Collection([['k' => 's'], ['k' => 5]]))->keyBy('k')->keys()->all(),
    'pluck' => (new Collection([['k' => 's', 'v' => 1], ['k' => 5, 'v' => 2]]))->pluck('v', 'k')->keys()->all(),
    'mapToDictionary' => (new Collection(['s', 5]))->mapToDictionary(fn ($v) => [$v => $v])->keys()->all(),
    'collapseWithKeys' => (new Collection([['s' => 1], [5 => 2]]))->collapseWithKeys()->keys()->all(),
    'flip' => (new Collection(['s', 5]))->flip()->keys()->all(),
]);
probe('C32-E-dot-list-backing', "collect(['a', 'b'])->dot() and collect(['0' => 'a', '1' => 'b'])->undot()", fn () => ['dot' => c32e_pairs(Collection::make(['a', 'b'])->dot()), 'undot' => c32e_pairs(Collection::make(['0' => 'a', '1' => 'b'])->undot()), 'dot-is-list' => array_is_list(Collection::make(['a', 'b'])->dot()->all())]);
probe('C32-E-array-item-all-member-is-data', "\$row = ['all' => fn () => [9], 'b' => 2]: collect([\$row]) and collect(['x' => \$row]) ->collapse()->keys() and ->flatten() (a closure as 'Closure')", function () {
    $row = ['all' => fn () => [9], 'b' => 2];
    $named = fn (Collection $c) => $c->map(fn ($v) => $v instanceof Closure ? 'Closure' : $v)->all();

    return [
        'collapseKeys' => (new Collection([$row]))->collapse()->keys()->all(),
        'collapseKeyedKeys' => (new Collection(['x' => $row]))->collapse()->keys()->all(),
        'flatten' => $named((new Collection([$row]))->flatten()),
        'flattenKeyed' => $named((new Collection(['x' => $row]))->flatten()),
    ];
});
probe('C32-E-mapSpread-string-keyed-row', "collect([['all' => fn () => [9], 'b' => 2]])->mapSpread(fn (...\$a) => count(\$a))", fn () => (new Collection([['all' => fn () => [9], 'b' => 2]]))->mapSpread(fn (...$a) => count($a))->all());

// Collection rows are ArrayAccess, so data_get reads through them.
probe('C32-E-groupBy-collection-rows', "c32c_rows(list | keyed)->groupBy('k'): each group's 'v' values", fn () => array_map(fn (bool $keyed) => c32c_rows($keyed)->groupBy('k')->map(fn (Collection $group) => $group->pluck('v')->all())->all(), ['list' => false, 'keyed' => true]));
probe('C32-E-keyBy-collection-rows', "c32c_rows(list | keyed)->keyBy('k'): each row's 'v'", fn () => array_map(fn (bool $keyed) => c32c_rows($keyed)->keyBy('k')->map(fn (Collection $row) => $row['v'])->all(), ['list' => false, 'keyed' => true]));
probe('C32-E-pluck-collection-rows', "c32c_rows(list | keyed)->pluck('v') and ->pluck('v', 'k')", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->pluck('v')->all(),
    c32c_rows($keyed)->pluck('v', 'k')->all(),
], ['list' => false, 'keyed' => true]));

probe('C32-E-callback-key-types-sweep', "[gettype(\$k), \$k] for each key a callback sees on ['a', 'b'] and on ['1' => 'a', 'x' => 'b']; sortKeysUsing lists the distinct keys it compared, sorted", function () {
    $out = [];
    foreach (['list' => ['a', 'b'], 'record' => ['1' => 'a', 'x' => 'b']] as $name => $items) {
        $trace = function (callable $run) use ($items): array {
            $seen = [];
            $run(new Collection($items), function ($k) use (&$seen) { $seen[] = [gettype($k), $k]; });

            return $seen;
        };
        $out['every'][$name] = $trace(fn ($c, $note) => $c->every(function ($v, $k) use ($note) { $note($k); return true; }));
        $out['each'][$name] = $trace(fn ($c, $note) => $c->each(function ($v, $k) use ($note) { $note($k); }));
        $out['groupBy'][$name] = $trace(fn ($c, $note) => $c->groupBy(function ($v, $k) use ($note) { $note($k); return 'g'; }));
        $out['countBy'][$name] = $trace(fn ($c, $note) => $c->countBy(function ($v, $k) use ($note) { $note($k); return 'g'; }));
        $out['sortBy'][$name] = $trace(fn ($c, $note) => $c->sortBy(function ($v, $k) use ($note) { $note($k); return $v; }));
        $out['reduceSpread'][$name] = $trace(fn ($c, $note) => $c->reduceSpread(function ($carry, $v, $k) use ($note) { $note($k); return [$carry]; }, null));
        $out['mapWithKeys'][$name] = $trace(fn ($c, $note) => $c->mapWithKeys(function ($v, $k) use ($note) { $note($k); return [$v => $v]; }));
        $out['keyBy'][$name] = $trace(fn ($c, $note) => $c->keyBy(function ($v, $k) use ($note) { $note($k); return $v; }));
        $compared = $trace(fn ($c, $note) => $c->sortKeysUsing(function ($a, $b) use ($note) { $note($a); $note($b); return strcmp((string) $a, (string) $b); }));
        $distinct = array_values(array_unique(array_map('json_encode', $compared)));
        sort($distinct);
        $out['sortKeysUsing'][$name] = array_map(fn (string $pair) => json_decode($pair, true), $distinct);
    }

    return $out;
});

// A computed key PHP cannot store throws; the message depends on how each method writes the key.
probe('C32-E-keyBy-array-key', "(new Collection([1]))->keyBy(fn () => [1, 2])", fn () => (new Collection([1]))->keyBy(fn () => [1, 2])->all());
probe('C32-E-keyBy-assoc-key', "(new Collection([1]))->keyBy(fn () => ['a' => 1])", fn () => (new Collection([1]))->keyBy(fn () => ['a' => 1])->all());
probe('C32-E-keyBy-date-key', "(new Collection([1]))->keyBy(fn () => new DateTime('@0'))", fn () => (new Collection([1]))->keyBy(fn () => new DateTime('@0'))->all());
probe('C32-E-groupBy-nested-array-key', "(new Collection([1]))->groupBy(fn () => [[1, 2]])", fn () => (new Collection([1]))->groupBy(fn () => [[1, 2]])->all());
probe('C32-E-groupBy-nested-assoc-key', "(new Collection([1]))->groupBy(fn () => [['a' => 1]])", fn () => (new Collection([1]))->groupBy(fn () => [['a' => 1]])->all());
probe('C32-E-groupBy-date-key', "(new Collection([1]))->groupBy(fn () => new DateTime('@0'))", fn () => (new Collection([1]))->groupBy(fn () => new DateTime('@0'))->all());
probe('C32-E-groupBy-assoc-return', "(new Collection([1, 2]))->groupBy(fn (\$x) => ['p' => \$x, 'q' => 'z'])", fn () => c32e_pairs((new Collection([1, 2]))->groupBy(fn ($x) => ['p' => $x, 'q' => 'z'])));
probe('C32-E-countBy-array-key', "(new Collection([1]))->countBy(fn () => [1, 2])", fn () => (new Collection([1]))->countBy(fn () => [1, 2])->all());
probe('C32-E-countBy-assoc-key', "(new Collection([1]))->countBy(fn () => ['a' => 1])", fn () => (new Collection([1]))->countBy(fn () => ['a' => 1])->all());
probe('C32-E-countBy-date-key', "(new Collection([1]))->countBy(fn () => new DateTime('@0'))", fn () => (new Collection([1]))->countBy(fn () => new DateTime('@0'))->all());
probe('C32-E-countBy-stringable-key', "(new Collection([1]))->countBy(fn () => new Stringable('Lara'))", fn () => (new Collection([1]))->countBy(fn () => new Stringable('Lara'))->all());
probe('C32-E-countBy-tostring-key', "(new Collection([1]))->countBy(fn () => an object with __toString)", fn () => (new Collection([1]))->countBy(fn () => new class { public function __toString() { return 'Framework'; } })->all());
probe('C32-E-countBy-null-key', "(new Collection([['url' => null], ['url' => 'a'], []]))->countBy('url')", fn () => (new Collection([['url' => null], ['url' => 'a'], []]))->countBy('url')->all());
probe('C32-E-pluck-array-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => [1, 2])", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => [1, 2])->all());
probe('C32-E-pluck-assoc-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => ['a' => 1])", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => ['a' => 1])->all());
probe('C32-E-pluck-date-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => new DateTime('@0'))", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => new DateTime('@0'))->all());
probe('C32-E-pluck-enum-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => C32E_Int::B)", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => C32E_Int::B)->all());
probe('C32-E-pluck-stringable-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => new Stringable('Lara'))", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => new Stringable('Lara'))->all());
probe('C32-E-pluck-tostring-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => an object with __toString)", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => new class { public function __toString() { return 'Framework'; } })->all());
probe('C32-E-pluck-closure-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => fn () => 1)", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => fn () => 1)->all());
probe('C32-E-pluck-nested-array-row', "(new Collection([['n' => 1]]))->pluck('n') and ->pluck('*')", fn () => ['path' => (new Collection([['n' => 1]]))->pluck('n')->all(), 'wildcard' => (new Collection([['n' => 1]]))->pluck('*')->all()]);
probe('C32-E-keyed-results-out-of-order-receiver', "a receiver whose integer keys run 2, 0: keyBy('id'), groupBy('g') and countBy() keys, mapToDictionary(fn => [\$v => \$k]), and flip() over 'x', 'y', 'x'", fn () => [
    'keyBy' => (new Collection([2 => ['id' => 5], 0 => ['id' => 4]]))->keyBy('id')->keys()->all(),
    'groupBy' => (new Collection([2 => ['g' => 5], 0 => ['g' => 4]]))->groupBy('g')->keys()->all(),
    'countBy' => (new Collection([2 => 5, 0 => 4]))->countBy()->keys()->all(),
    'mapToDictionary' => c32e_pairs((new Collection([2 => 5, 0 => 4]))->mapToDictionary(fn ($v, $k) => [$v => $k])),
    'flip' => c32e_pairs((new Collection([2 => 'x', 0 => 'y', 1 => 'x']))->flip()),
]);

// ---- Family F ------------------------------------------------------------

$fViews = fn (Collection $c) => ['all' => $c->all(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all()];
$fRows = fn (Collection $c) => $c->map(fn ($row) => $row instanceof Collection ? $row->all() : $row)->all();

// merge / union / mergeRecursive with null hand back a NEW instance (PHP: newInstance(array_merge(...)))
probe('C32-F-merge-null-is-a-new-instance', '$a = collect([1]); $b = $a->merge(null); $b->push(2);', function () { $a = collect([1]); $b = $a->merge(null); $b->push(2); return ['same' => $a === $b, 'receiver' => $a->all(), 'result' => $b->all()]; });
probe('C32-F-union-null-is-a-new-instance', '$a = collect([1]); $b = $a->union(null); $b->push(2);', function () { $a = collect([1]); $b = $a->union(null); $b->push(2); return ['same' => $a === $b, 'receiver' => $a->all(), 'result' => $b->all()]; });
probe('C32-F-mergeRecursive-null-is-a-new-instance', '$a = collect([1]); $b = $a->mergeRecursive(null); $b->push(2);', function () { $a = collect([1]); $b = $a->mergeRecursive(null); $b->push(2); return ['same' => $a === $b, 'receiver' => $a->all(), 'result' => $b->all()]; });

// merge: integer keys are renumbered and appended, string keys overwrite
probe('C32-F-merge-assoc-then-list', "collect(['a' => 1, 'b' => 2])->merge([3, 4])", fn () => $fViews(collect(['a' => 1, 'b' => 2])->merge([3, 4])));
probe('C32-F-merge-int-keyed-record-then-list', "collect(['a' => 1, 5 => 'x'])->merge(['y'])", fn () => $fViews(collect(['a' => 1, 5 => 'x'])->merge(['y'])));
probe('C32-F-merge-same-int-key-appends', "collect([5 => 'a'])->merge([5 => 'b'])", fn () => $fViews(collect([5 => 'a'])->merge([5 => 'b'])));
probe('C32-F-merge-scalar-operand', "collect(['hello'])->merge(1)", fn () => collect(['hello'])->merge(1)->all());

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

// multiply: always a list of the values
probe('C32-F-multiply-assoc', "collect(['a' => 1, 'b' => 2])->multiply(2)", fn () => collect(['a' => 1, 'b' => 2])->multiply(2)->all());

// replace / replaceRecursive: the PHP tests' own sparse int-keyed replacers
probe('C32-F-replace-sparse-int-keyed-replacer', "collect(['a', 'b', 'c'])->replace([1 => 'd', 2 => 'e'])", fn () => collect(['a', 'b', 'c'])->replace([1 => 'd', 2 => 'e'])->all());
probe('C32-F-replaceRecursive-sparse-replacer', "collect(['a', 'b', ['c', 'd']])->replaceRecursive(['z', 2 => [1 => 'e']])", fn () => collect(['a', 'b', ['c', 'd']])->replaceRecursive(['z', 2 => [1 => 'e']])->all());

// zip: array_map pads every shorter side, the receiver included, with null
probe('C32-F-zip-receiver-shorter', "collect(['a', 'b'])->zip([1, 2, 3])", fn () => $fRows(collect(['a', 'b'])->zip([1, 2, 3])));
probe('C32-F-zip-empty-receiver', 'collect([])->zip([1, 2])', fn () => $fRows(collect([])->zip([1, 2])));
probe('C32-F-zip-null-operand', 'collect([1, 2])->zip(null)', fn () => $fRows(collect([1, 2])->zip(null)));
probe('C32-F-zip-assoc-receiver-longer-operand', "collect(['a' => 1, 'b' => 2])->zip(['x' => 'p', 'y' => 'q', 'z' => 'r'])", fn () => $fRows(collect(['a' => 1, 'b' => 2])->zip(['x' => 'p', 'y' => 'q', 'z' => 'r'])));

// *Using: PHP's comparator contract is an int (0 = equal)
probe('C32-F-diffUsing-spaceship-comparator', 'collect([1, 2, 3])->diffUsing([2], fn ($a, $b) => $a <=> $b)', fn () => collect([1, 2, 3])->diffUsing([2], fn ($a, $b) => $a <=> $b)->all());
probe('C32-F-intersectUsing-spaceship-comparator', 'collect([1, 2, 3])->intersectUsing([2, 3], fn ($a, $b) => $a <=> $b)', fn () => collect([1, 2, 3])->intersectUsing([2, 3], fn ($a, $b) => $a <=> $b)->all());
probe('C32-F-diffUsing-list-keeps-keys', "collect(['a', 'b', 'c'])->diffUsing(['a'], 'strcasecmp')", fn () => collect(['a', 'b', 'c'])->diffUsing(['a'], 'strcasecmp')->all());

// null operands the types reject today
probe('C32-F-assoc-and-key-diffs-null-operand', "collect(['a' => 1])->diffAssoc(null) / ->diffAssocUsing(null, 'strcasecmp') / ->diffKeysUsing(null, 'strcasecmp')", fn () => ['diffAssoc' => collect(['a' => 1])->diffAssoc(null)->all(), 'diffAssocUsing' => collect(['a' => 1])->diffAssocUsing(null, 'strcasecmp')->all(), 'diffKeysUsing' => collect(['a' => 1])->diffKeysUsing(null, 'strcasecmp')->all()]);
probe('C32-F-crossJoin-null-and-scalar-operands', "collect([1, 2])->crossJoin(null) / ->crossJoin('x')", fn () => ['null' => collect([1, 2])->crossJoin(null)->all(), 'scalar' => collect([1, 2])->crossJoin('x')->all()]);
probe('C32-F-combine-null-operand-on-empty', 'collect([])->combine(null)', fn () => collect([])->combine(null)->all());
probe('C32-F-combine-null-operand-throws', "collect(['a'])->combine(null)", fn () => collect(['a'])->combine(null)->all());

// a plain object's `all` member is data, never an Enumerable to unwrap (PHP casts the object with (array))
probe('C32-F-plain-object-all-member-is-data', "collect(['all' => 1, 'b' => 2])->intersectByKeys((object) ['all' => fn () => ['b' => 2]]) / ->union(...) keys / ->replace(...) keys / ->diffKeys(...) / ->combine(...) keys", fn () => [
    'intersectByKeys' => collect(['all' => 1, 'b' => 2])->intersectByKeys((object) ['all' => fn () => ['b' => 2]])->all(),
    'unionKeys' => collect(['a' => 1])->union((object) ['all' => fn () => ['b' => 2]])->keys()->all(),
    'replaceKeys' => collect(['a' => 1])->replace((object) ['all' => fn () => ['b' => 2]])->keys()->all(),
    'diffKeys' => collect(['all' => 1, 'b' => 2])->diffKeys((object) ['all' => fn () => ['b' => 2]])->all(),
    'combineKeys' => collect(['k'])->combine((object) ['all' => fn () => ['v']])->keys()->all(),
]);
probe('C32-F-combine-int-key-order', "(new Collection([3, 1, 2]))->combine(['c', 'a', 'b'])->keys()", fn () => (new Collection([3, 1, 2]))->combine(['c', 'a', 'b'])->keys()->all());

// ---- Family G ------------------------------------------------------------

// Key-preserving probes return [[key, value], ...] so integer keys and order survive json_encode.
$pairs = function ($items) use (&$pairs) {
    $out = [];
    foreach ($items instanceof Collection ? $items->all() : $items as $k => $v) {
        $out[] = [$k, $v instanceof Collection ? $pairs($v) : $v];
    }

    return $out;
};

probe('C32-G-sort-comparator', '(new Collection([5, 3, 1, 2, 4]))->sort(fn ($a, $b) => $a <=> $b)->values()->all()',
    fn () => (new Collection([5, 3, 1, 2, 4]))->sort(fn ($a, $b) => $a <=> $b)->values()->all());
probe('C32-G-sort-comparator-desc', '(new Collection([5, 3, 1, 2, 4]))->sort(fn ($a, $b) => $b <=> $a)->values()->all()',
    fn () => (new Collection([5, 3, 1, 2, 4]))->sort(fn ($a, $b) => $b <=> $a)->values()->all());
probe('C32-G-sort-comparator-assoc', "(new Collection(['a' => 3, 'b' => 1, 'c' => 2]))->sort(fn (\$x, \$y) => \$x <=> \$y)->all()",
    fn () => $pairs((new Collection(['a' => 3, 'b' => 1, 'c' => 2]))->sort(fn ($x, $y) => $x <=> $y)));
probe('C32-G-sort-comparator-rows', "(new Collection([['n' => 2], ['n' => 1], ['n' => 3]]))->sort(fn (\$a, \$b) => \$a['n'] <=> \$b['n'])->values()->all()",
    fn () => (new Collection([['n' => 2], ['n' => 1], ['n' => 3]]))->sort(fn ($a, $b) => $a['n'] <=> $b['n'])->values()->all());
probe('C32-G-sortDesc-callback-throws', '(new Collection([1, 3, 2]))->sortDesc(fn ($v) => $v)',
    fn () => (new Collection([1, 3, 2]))->sortDesc(fn ($v) => $v)->all());
probe('C32-G-sortBy-callback-key-types-list', '(new Collection([10, 20]))->sortBy(fn ($v, $k) => ...) recording [gettype($k), $k]', function () {
    $seen = [];
    (new Collection([10, 20]))->sortBy(function ($v, $k) use (&$seen) {
        $seen[] = [gettype($k), $k];

        return $v;
    });

    return $seen;
});
probe('C32-G-sortBy-callback-key-types-int-keys', "(new Collection([5 => 'a', 7 => 'b']))->sortBy(fn (\$v, \$k) => ...) recording [gettype(\$k), \$k]", function () {
    $seen = [];
    (new Collection([5 => 'a', 7 => 'b']))->sortBy(function ($v, $k) use (&$seen) {
        $seen[] = [gettype($k), $k];

        return $v;
    });

    return $seen;
});
probe('C32-G-sortBy-callback-by-key', "(new Collection(['x' => 1, 'a' => 2, 'm' => 3]))->sortBy(fn (\$v, \$k) => \$k)->all()",
    fn () => $pairs((new Collection(['x' => 1, 'a' => 2, 'm' => 3]))->sortBy(fn ($v, $k) => $k)));
probe('C32-G-sortKeysUsing-key-types', "(new Collection(['a', 'b', 'c']))->sortKeysUsing(fn (\$a, \$b) => ...) recording gettype of each key", function () {
    $seen = [];
    (new Collection(['a', 'b', 'c']))->sortKeysUsing(function ($a, $b) use (&$seen) {
        $seen[] = gettype($a);
        $seen[] = gettype($b);

        return $a <=> $b;
    });

    return array_values(array_unique($seen));
});
probe('C32-G-sortKeysUsing-int-keys-desc', "(new Collection([5 => 'e', 2 => 'b', 9 => 'z']))->sortKeysUsing(fn (\$a, \$b) => \$b <=> \$a)->values()->all()",
    fn () => (new Collection([5 => 'e', 2 => 'b', 9 => 'z']))->sortKeysUsing(fn ($a, $b) => $b <=> $a)->values()->all());
probe('C32-G-split-int-keys-renumber', "(new Collection([5 => 'a', 6 => 'b', 7 => 'c']))->split(2)",
    fn () => $pairs((new Collection([5 => 'a', 6 => 'b', 7 => 'c']))->split(2)));
probe('C32-G-split-assoc-keys', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->split(2)",
    fn () => $pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->split(2)));
probe('C32-G-split-more-groups-than-items', '(new Collection([1, 2, 3]))->split(5)',
    fn () => $pairs((new Collection([1, 2, 3]))->split(5)));
probe('C32-G-split-infinite-groups', '(new Collection([1, 2, 3]))->split(INF)',
    fn () => @(new Collection([1, 2, 3]))->split(INF)->all());
probe('C32-G-splitIn-keeps-keys', '(new Collection(range(1, 10)))->splitIn(3)',
    fn () => $pairs((new Collection(range(1, 10)))->splitIn(3)));
probe('C32-G-splitIn-more-groups-than-items', '(new Collection([1, 2, 3]))->splitIn(5)',
    fn () => $pairs((new Collection([1, 2, 3]))->splitIn(5)));
probe('C32-G-splitIn-empty', '(new Collection([]))->splitIn(2)->all()',
    fn () => (new Collection([]))->splitIn(2)->all());
probe('C32-G-sliding-assoc', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->sliding()",
    fn () => $pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->sliding()));
probe('C32-G-sliding-size-over-count', '(new Collection([1, 2, 3]))->sliding(5)->all()',
    fn () => (new Collection([1, 2, 3]))->sliding(5)->all());
probe('C32-G-chunk-assoc-no-preserve', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->chunk(2, false)",
    fn () => $pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->chunk(2, false)));
probe('C32-G-chunk-fractional-size', '(new Collection([1, 2, 3, 4, 5]))->chunk(2.5)',
    fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->chunk(2.5)));
probe('C32-G-nth-assoc', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5]))->nth(2)",
    fn () => $pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5]))->nth(2)));
probe('C32-G-forPage-edges', "forPage(-1, 2), forPage(2, 0), forPage(1, -1) over ['one','two','three','four']", fn () => [
    'negative_page' => $pairs((new Collection(['one', 'two', 'three', 'four']))->forPage(-1, 2)),
    'zero_per_page' => $pairs((new Collection(['one', 'two', 'three', 'four']))->forPage(2, 0)),
    'negative_per_page' => $pairs((new Collection(['one', 'two', 'three', 'four']))->forPage(1, -1)),
]);
probe('C32-G-forPage-assoc', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->forPage(2, 1)->all()",
    fn () => (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->forPage(2, 1)->all());
probe('C32-G-take-assoc-negative', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->take(-2)->all()",
    fn () => (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->take(-2)->all());
probe('C32-G-skip-negative', '(new Collection([1, 2, 3]))->skip(-1)',
    fn () => $pairs((new Collection([1, 2, 3]))->skip(-1)));
probe('C32-G-sortBy-descriptor-mixed-directions', "sortBy([['name', 'asc'], ['age', 'desc']]) over four people",
    fn () => (new Collection([['name' => 'b', 'age' => 1], ['name' => 'a', 'age' => 1], ['name' => 'a', 'age' => 3], ['name' => 'b', 'age' => 2]]))->sortBy([['name', 'asc'], ['age', 'desc']])->values()->all());
probe('C32-G-sortByDesc-descriptor-mixed-directions', "sortByDesc([['name', 'asc'], ['age', 'desc']]) over four people",
    fn () => (new Collection([['name' => 'b', 'age' => 1], ['name' => 'a', 'age' => 1], ['name' => 'a', 'age' => 3], ['name' => 'b', 'age' => 2]]))->sortByDesc([['name', 'asc'], ['age', 'desc']])->values()->all());
probe('C32-G-sortByDesc-id-then-name', "sortByDesc(['id'])->sortByDesc(['id', 'name']) (testSortByCallableStringDesc)",
    fn () => (new Collection([['id' => 1, 'name' => 'foo'], ['id' => 2, 'name' => 'bar'], ['id' => 2, 'name' => 'baz']]))->sortByDesc(['id'])->sortByDesc(['id', 'name'])->values()->all());
probe('C32-G-sortBy-ties-stable', "sortBy('k') over [k=1 a, k=0 b, k=1 c] ->pluck('id')",
    fn () => (new Collection([['k' => 1, 'id' => 'a'], ['k' => 0, 'id' => 'b'], ['k' => 1, 'id' => 'c']]))->sortBy('k')->pluck('id')->all());
probe('C32-G-sortBy-string-Ascending-direction', "sortBy([['n', 'Ascending']]) - a plain string, not the enum",
    fn () => (new Collection([['n' => 2], ['n' => 1], ['n' => 3]]))->sortBy([['n', 'Ascending']])->pluck('n')->all());
probe('C32-G-sortByMany-mixed-case-default-flag', "sortBy(['item']) over img1/Img101/img10/Img11 (testSortByMany, default flag)",
    fn () => (new Collection([['item' => 'img1'], ['item' => 'Img101'], ['item' => 'img10'], ['item' => 'Img11']]))->sortBy(['item'])->pluck('item')->all());
probe('C32-G-sortByMany-umlaut-default-flag', "sortBy(['item']) over Österreich/Oesterreich/Zeta (testSortByMany, default flag)",
    fn () => (new Collection([['item' => 'Österreich'], ['item' => 'Oesterreich'], ['item' => 'Zeta']]))->sortBy(['item'])->pluck('item')->all());
probe('C32-G-sortByMany-null-desc-default-flag', "sortBy([['first','desc'],['second','desc']]) over [f/null, f/s] (testNaturalSortByManyWithNull, default flag)",
    fn () => (new Collection([['first' => 'f', 'second' => null], ['first' => 'f', 'second' => 's']]))->sortBy([['first', 'desc'], ['second', 'desc']])->values()->all());
probe('C32-G-sortByMany-null-values', "sortBy(['first','second']) and sortByDesc(['first','second']) over [f/null, f/s, a/z]", fn () => [
    'asc' => (new Collection([['first' => 'f', 'second' => null], ['first' => 'f', 'second' => 's'], ['first' => 'a', 'second' => 'z']]))->sortBy(['first', 'second'])->values()->all(),
    'desc' => (new Collection([['first' => 'f', 'second' => null], ['first' => 'f', 'second' => 's'], ['first' => 'a', 'second' => 'z']]))->sortByDesc(['first', 'second'])->values()->all(),
]);
probe('C32-G-sortBy-dot-path', "(new Collection([(object) ['id' => 1, 'foo' => ['bar' => 'B']], (object) ['id' => 2, 'foo' => ['bar' => 'A']]]))->sortBy('foo.bar')->pluck('id')->all()",
    fn () => (new Collection([(object) ['id' => 1, 'foo' => ['bar' => 'B']], (object) ['id' => 2, 'foo' => ['bar' => 'A']]]))->sortBy('foo.bar')->pluck('id')->all());
probe('C32-G-sliding-subclass', 'get_class of (new SubCollection([1, 2, 3]))->sliding() and of its first window', function () {
    $sub = new class([1, 2, 3]) extends Collection {};

    return [get_class($sub->sliding()) === get_class($sub), get_class($sub->sliding()->first()) === get_class($sub)];
});
probe('C32-G-sortBy-collection-rows', "c32c_rows(list | keyed)->sortBy('k'): keys and each row's 'v'", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->sortBy('k')->keys()->all(),
    c32c_rows($keyed)->sortBy('k')->pluck('v')->all(),
], ['list' => false, 'keyed' => true]));
probe('C32-G-sortBy-descriptors-collection-rows', "c32c_rows(list | keyed)->sortBy([['k', 'asc'], ['v', 'desc']]): keys and each row's 'v'", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->sortBy([['k', 'asc'], ['v', 'desc']])->keys()->all(),
    c32c_rows($keyed)->sortBy([['k', 'asc'], ['v', 'desc']])->pluck('v')->all(),
], ['list' => false, 'keyed' => true]));

// ---- Family H ------------------------------------------------------------

class C32HUser { public function __construct(public $email) {} }
class C32HToString { public function __construct(public $v) {} public function __toString(): string { return 'S:'.$this->v; } }

// sum: PHP `+` coerces numeric strings; JS `+` concatenates them.
probe('C32-H-sum-numeric-strings', "(new Collection(['1', '2', '3']))->sum()", fn () => (new Collection(['1', '2', '3']))->sum());
probe('C32-H-sum-float-strings', "(new Collection(['1.5', '2']))->sum()", fn () => (new Collection(['1.5', '2']))->sum());
probe('C32-H-sum-key-numeric-strings', "(new Collection([['foo' => '4'], ['foo' => '2']]))->sum('foo')", fn () => (new Collection([['foo' => '4'], ['foo' => '2']]))->sum('foo'));
probe('C32-H-sum-non-numeric-string', "(new Collection([1, 'a']))->sum()", fn () => (new Collection([1, 'a']))->sum());
probe('C32-H-sum-null-and-bools', "[sum([1, null, 2]), sum([true, true, false])]", fn () => [(new Collection([1, null, 2]))->sum(), (new Collection([true, true, false]))->sum()]);
probe('C32-H-sum-dot-path', "(new Collection([['a' => ['b' => 1]], ['a' => ['b' => 2]]]))->sum('a.b')", fn () => (new Collection([['a' => ['b' => 1]], ['a' => ['b' => 2]]]))->sum('a.b'));

// avg
probe('C32-H-avg-non-numeric-string', "(new Collection([10, 'house', 20]))->avg()", fn () => (new Collection([10, 'house', 20]))->avg());
probe('C32-H-avg-callback-arity', "(new Collection(['a' => 1]))->avg(fn (...\$args) => count(\$args))", fn () => (new Collection(['a' => 1]))->avg(fn (...$args) => count($args)));

// min / max
probe('C32-H-min-numeric-strings', "(new Collection(['10', '9', '8']))->min()", fn () => (new Collection(['10', '9', '8']))->min());
probe('C32-H-max-numeric-strings', "(new Collection(['10', '9', '8']))->max()", fn () => (new Collection(['10', '9', '8']))->max());
probe('C32-H-min-max-callback-arity', "[min(fn (...\$a) => count(\$a)), max(...)] on ['a' => 1]", fn () => [(new Collection(['a' => 1]))->min(fn (...$a) => count($a)), (new Collection(['a' => 1]))->max(fn (...$a) => count($a))]);
probe('C32-H-min-max-strings', "[min, max] of ['b', 'a', 'c']", fn () => [(new Collection(['b', 'a', 'c']))->min(), (new Collection(['b', 'a', 'c']))->max()]);
probe('C32-H-max-dot-path', "(new Collection([['a' => ['b' => 3]], ['a' => ['b' => 7]]]))->max('a.b')", fn () => (new Collection([['a' => ['b' => 3]], ['a' => ['b' => 7]]]))->max('a.b'));

// median
probe('C32-H-median-numeric-strings', "[median(['10', '9', '8']), median(['10', '9'])]", fn () => [(new Collection(['10', '9', '8']))->median(), (new Collection(['10', '9']))->median()]);
probe('C32-H-median-rows-without-key', "(new Collection([['value' => 1, 'age' => 20], ['value' => 3, 'age' => 30], ['value' => 2, 'age' => 25]]))->median()", fn () => (new Collection([['value' => 1, 'age' => 20], ['value' => 3, 'age' => 30], ['value' => 2, 'age' => 25]]))->median());
probe('C32-H-median-array-key', "(new Collection([['a' => ['b' => 1]], ['a' => ['b' => 9]], ['a' => ['b' => 5]]]))->median(['a', 'b'])", fn () => (new Collection([['a' => ['b' => 1]], ['a' => ['b' => 9]], ['a' => ['b' => 5]]]))->median(['a', 'b']));

// percentage: PHP round() on the exact double; JS Math.round(x * 10^p) re-rounds after scaling.
probe('C32-H-percentage-fp-below-half', "(new Collection(range(1, 2000)))->percentage(fn (\$v) => \$v <= 9, 1)", fn () => (new Collection(range(1, 2000)))->percentage(fn ($v) => $v <= 9, 1));
probe('C32-H-percentage-precision-zero-and-negative', "[percentage(..., 0), percentage(..., -1)] on [1, 1, 2]", fn () => [(new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, 0), (new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, -1)]);

// implode
probe('C32-H-implode-class-instances-by-key', "(new Collection([new C32HUser('foo'), new C32HUser('bar')]))->implode('email', ',')", fn () => (new Collection([new C32HUser('foo'), new C32HUser('bar')]))->implode('email', ','));
probe('C32-H-implode-tostring-objects-are-plucked', "(new Collection([new C32HToString('a'), new C32HToString('b')]))->implode(',')", fn () => (new Collection([new C32HToString('a'), new C32HToString('b')]))->implode(','));
probe('C32-H-implode-scalar-casts', "(new Collection([true, false, null, 1.0, 2.50, 0]))->implode(',')", fn () => (new Collection([true, false, null, 1.0, 2.50, 0]))->implode(','));
probe('C32-H-implode-missing-key', "(new Collection([['a' => 1], ['b' => 2]]))->implode('a', ',')", fn () => (new Collection([['a' => 1], ['b' => 2]]))->implode('a', ','));
probe('C32-H-implode-nested-collections-by-key', "(new Collection([new Collection(['a' => 'x']), new Collection(['a' => 'y'])]))->implode('a', ',')", fn () => (new Collection([new Collection(['a' => 'x']), new Collection(['a' => 'y'])]))->implode('a', ','));

// join
probe('C32-H-join-null-last-item', "(new Collection(['a', null]))->join(', ', ' and ')", fn () => (new Collection(['a', null]))->join(', ', ' and '));
probe('C32-H-join-bool-items', "(new Collection([true, false, true]))->join(', ', ' and ')", fn () => (new Collection([true, false, true]))->join(', ', ' and '));

// reduce without an initial value: $initial = null, every item reaches the callback
probe('C32-H-reduce-no-initial-trace', "carries/values/keys seen by (new Collection([10, 20, 30]))->reduce(fn (\$c, \$v, \$k) => \$v)", function () { $seen = []; (new Collection([10, 20, 30]))->reduce(function ($c, $v, $k) use (&$seen) { $seen[] = [$c, $v, $k]; return $v; }); return $seen; });
probe('C32-H-reduce-no-initial-single', "(new Collection([5]))->reduce(fn (\$c, \$v) => [\$c, \$v])", fn () => (new Collection([5]))->reduce(fn ($c, $v) => [$c, $v]));

// reduceSpread
probe('C32-H-reduceSpread-throws-boolean', "(new Collection([1]))->reduceSpread(fn () => false, null)", fn () => (new Collection([1]))->reduceSpread(fn () => false, null));
probe('C32-H-reduceSpread-throws-integer', "(new Collection([1]))->reduceSpread(fn () => 5, null)", fn () => (new Collection([1]))->reduceSpread(fn () => 5, null));
probe('C32-H-reduceSpread-throws-double', "(new Collection([1]))->reduceSpread(fn () => 1.5, null)", fn () => (new Collection([1]))->reduceSpread(fn () => 1.5, null));
probe('C32-H-reduceSpread-throws-null', "(new Collection([1]))->reduceSpread(fn () => null, null)", fn () => (new Collection([1]))->reduceSpread(fn () => null, null));
probe('C32-H-reduceSpread-throws-string', "(new Collection([1]))->reduceSpread(fn () => 'x', null)", fn () => (new Collection([1]))->reduceSpread(fn () => 'x', null));
probe('C32-H-reduceSpread-throws-object', "(new Collection([1]))->reduceSpread(fn () => new stdClass, null)", fn () => (new Collection([1]))->reduceSpread(fn () => new stdClass, null));
probe('C32-H-reduceSpread-list-key-type', "(new Collection(['a', 'b']))->reduceSpread(fn (\$acc, \$v, \$k) => [\$acc.gettype(\$k).\$k], '')", fn () => (new Collection(['a', 'b']))->reduceSpread(fn ($acc, $v, $k) => [$acc.gettype($k).$k], ''));
probe('C32-H-reduceSpread-empty', "(new Collection([]))->reduceSpread(fn () => false, 1, 2)", fn () => (new Collection([]))->reduceSpread(fn () => false, 1, 2));

// pipeThrough
probe('C32-H-pipeThrough-order', "(new Collection(['a']))->pipeThrough([push('b'), implode(''), strtoupper])", fn () => (new Collection(['a']))->pipeThrough([fn ($d) => $d->push('b'), fn ($d) => $d->implode(''), fn ($s) => strtoupper($s)]));
probe('C32-H-pipeThrough-empty-returns-receiver', "\$c->pipeThrough([]) === \$c", function () { $c = new Collection([1]); return $c->pipeThrough([]) === $c; });

// when / unless (Conditionable)
probe('C32-H-when-php-falsy-values', "[when('0', ...) === \$c, when([], ...) === \$c]", function () { $c = new Collection([1]); return [$c->when('0', fn () => 'called') === $c, $c->when([], fn () => 'called') === $c]; });
probe('C32-H-unless-php-falsy-values', "[unless('0', fn () => 'called'), unless([], fn () => 'called')]", fn () => [(new Collection([1]))->unless('0', fn () => 'called'), (new Collection([1]))->unless([], fn () => 'called')]);
probe('C32-H-when-null-callback-throws', "(new Collection([1]))->when(true, null)", fn () => (new Collection([1]))->when(true, null));
probe('C32-H-unless-null-callback-throws', "(new Collection([1]))->unless(false, null)", fn () => (new Collection([1]))->unless(false, null));
probe('C32-H-when-default-receives-value', "(new Collection([1]))->when(0, fn () => 'cb', fn (\$c, \$v) => var_export(\$v, true))", fn () => (new Collection([1]))->when(0, fn () => 'cb', fn ($c, $v) => var_export($v, true)));
probe('C32-H-when-callback-returns-scalar', "[when(true, fn () => false), when(true, fn () => 42)]", fn () => [(new Collection([1]))->when(true, fn () => false), (new Collection([1]))->when(true, fn () => 42)]);
probe('C32-H-when-closure-value', "(new Collection([1, 2]))->when(fn (\$c) => \$c->count(), fn (\$c, \$v) => \$v * 10)", fn () => (new Collection([1, 2]))->when(fn ($c) => $c->count(), fn ($c, $v) => $v * 10));
probe('C32-H-when-callable-string-value-not-invoked', "(new Collection([1]))->when('strlen', fn (\$c, \$v) => \$v)", fn () => (new Collection([1]))->when('strlen', fn ($c, $v) => $v));
probe('C32-H-whenEmpty-callback-receives-true', "(new Collection)->whenEmpty(fn (\$c, \$v) => var_export(\$v, true))", fn () => (new Collection)->whenEmpty(fn ($c, $v) => var_export($v, true)));
probe('C32-H-whenNotEmpty-default-receives-false', "(new Collection)->whenNotEmpty(fn () => 'cb', fn (\$c, \$v) => var_export(\$v, true))", fn () => (new Collection)->whenNotEmpty(fn () => 'cb', fn ($c, $v) => var_export($v, true)));
probe('C32-H-whenEmpty-scalar-return', "(new Collection)->whenEmpty(fn () => 'scalar')", fn () => (new Collection)->whenEmpty(fn () => 'scalar'));

// mode over array items
probe('C32-H-mode-array-items', "(new Collection([[1], [1]]))->mode()", fn () => (new Collection([[1], [1]]))->mode());
probe('C32-H-mode-assoc-items', "(new Collection([['a' => 1], ['a' => 1]]))->mode()", fn () => (new Collection([['a' => 1], ['a' => 1]]))->mode());
probe('C32-H-mode-date-items', "(new Collection([new DateTime('@0'), new DateTime('@0')]))->mode()", fn () => (new Collection([new DateTime('@0'), new DateTime('@0')]))->mode());
probe('C32-H-mode-enum-items', "(new Collection([C32E_Int::B, C32E_Int::B]))->mode()", fn () => (new Collection([C32E_Int::B, C32E_Int::B]))->mode());
probe('C32-H-mode-stringable-items', "(new Collection([new Stringable('Lara'), new Stringable('Lara')]))->mode()", fn () => (new Collection([new Stringable('Lara'), new Stringable('Lara')]))->mode());
probe('C32-H-mode-tostring-items', "(new Collection([\$o, \$o]))->mode(), \$o an object with __toString", function () {
    $o = new class { public function __toString() { return 'Framework'; } };

    return (new Collection([$o, $o]))->mode();
});
probe('C32-H-mode-float-items', "@(new Collection([1.5, 1.7, 2.5]))->mode()", fn () => @(new Collection([1.5, 1.7, 2.5]))->mode());

emit();
