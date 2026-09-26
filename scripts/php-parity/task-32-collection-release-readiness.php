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
// range() refuses a size past the maximum array size, printing an integer range's bounds or a float range's
probe('C32-A-range-past-maximum-array-size', "Collection::range(\$start, \$end, \$step) past the maximum array size, for integer and float bounds either way round: the class and message thrown", fn () => array_map($rangeOutcome, [
    '1..1073741824' => [1, 1073741824],
    '0..1073741824' => [0, 1073741824],
    '2147483648..1' => [2147483648, 1],
    '1..2147483648 step 2' => [1, 2147483648, 2],
    '1..1e19' => [1, 1e19],
    '1e19..1' => [1e19, 1],
    '0..2147483648 step 0.5' => [0, 2147483648, 0.5],
    '0.5..1e10' => [0.5, 1e10],
    '1..1e22' => [1, 1e22],
]));
// the message prints a float range's figures as C's %.1f does: ties to even, and an infinite size as inf
probe('C32-A-range-size-message-rounding', "Collection::range(\$start, \$end, \$step) past the maximum array size where a printed figure ends in an exact half: the class and message thrown", fn () => array_map($rangeOutcome, [
    '0.25..1e10' => [0.25, 1e10],
    '-0.25..1e10' => [-0.25, 1e10],
    '1.75..1e10' => [1.75, 1e10],
    '0..1e10 step 1.25' => [0, 1e10, 1.25],
]));
probe('C32-A-range-size-message-infinite', "Collection::range(\$start, \$end, \$step) whose size overflows to INF: the class and message thrown", fn () => array_map($rangeOutcome, [
    '0..1 step 5e-324' => [0, 1, 5e-324],
    '-1e308..1e308' => [-1e308, 1e308],
    '0..1e308 step 1e-10' => [0, 1e308, 1e-10],
]));
probe('C32-A-range-size-message-signs-and-carries', "Collection::range(\$start, 1e10) past the maximum array size for a start of -0.0, -0.04, 0.05 and 99.95: the class and message thrown", fn () => array_map($rangeOutcome, [
    '-0.0' => [-0.0, 1e10],
    '-0.04' => [-0.04, 1e10],
    '0.05' => [0.05, 1e10],
    '99.95' => [99.95, 1e10],
]));

// --- times
probe('C32-A-times-fractional-count', 'Collection::times(2.7)->all()', fn () => Collection::times(2.7)->all());
probe('C32-A-times-non-finite-count', 'Collection::times(NAN), times(INF) and times(-INF)', fn () => array_map(function ($count) {
    try {
        return Collection::times($count)->all();
    } catch (\Throwable $e) {
        return [get_class($e), $e->getMessage()];
    }
}, [NAN, INF, -INF]));
probe('C32-A-times-past-maximum-array-size', 'Collection::times(1e19), times(2147483648) and times(1073741824): the class and message thrown', fn () => array_map(fn ($count) => c32c_outcome(fn () => Collection::times($count)->all()), ['1e19' => 1e19, '2147483648' => 2147483648, '1073741824' => 1073741824]));

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
probe('C32-A-ensure-closure-and-anonymous-class-names', "the message collect([\$item])->ensure('int') throws for new class {} and fn () => 1, then collect([fn () => 1])->ensure(Closure::class)->count()", fn () => [
    ...array_map(fn ($item) => c32c_outcome(fn () => collect([$item])->ensure('int')), [new class {}, fn () => 1]),
    collect([fn () => 1])->ensure(Closure::class)->count(),
]);
probe('C32-A-ensure-anonymous-subclass-name', "the message collect([\$item])->ensure('int') throws for new class extends C32AParent {} and new class extends C32AChild {}", fn () => array_map(fn ($item) => c32c_outcome(fn () => collect([$item])->ensure('int')), [new class extends C32AParent {}, new class extends C32AChild {}]));
probe('C32-A-debug-type-float-past-int-range', "get_debug_type() of 1e19, -1e19, -0.0, 2**63 and 2**62, then the message collect([\$item])->ensure('int') throws for 1e19 and -0.0", fn () => [
    'types' => array_map(fn ($value) => get_debug_type($value), ['1e19' => 1e19, '-1e19' => -1e19, '-0.0' => -0.0, '2**63' => 9223372036854775808.0, '2**62' => 4611686018427387904]),
    'ensure' => array_map(fn ($value) => c32c_outcome(fn () => collect([$value])->ensure('int')), ['1e19' => 1e19, '-0.0' => -0.0]),
]);

// --- Arr::from refuses a scalar with the class its @throws names
probe('C32-A-arr-from-scalar-throws', 'Arr::from(123)', fn () => Arr::from(123));

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
probe('C32-B-push-many-past-negative-keys-order', "\$c = collect([-2 => 'a'])->push('p', 'q', 'r'); keys/values/last", function () { $c = collect([-2 => 'a'])->push('p', 'q', 'r'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-push-many-onto-mixed-keys-order', "\$c = collect(['x' => 'a', -2 => 'b'])->push('p', 'q'); keys/values/last", function () { $c = collect(['x' => 'a', -2 => 'b'])->push('p', 'q'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-push-many-across-the-index-limit-order', "\$c = collect([4294967293 => 'a', 'x' => 'b'])->push('p', 'q'); keys/values/last", function () { $c = collect([4294967293 => 'a', 'x' => 'b'])->push('p', 'q'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });
probe('C32-B-push-onto-string-keyed-toJson', "collect(['a' => 1])->push('z')->toJson()", fn () => collect(['a' => 1])->push('z')->toJson());
probe('C32-B-get-has-literal-dotted-key', "[get('products.desk'), has('products.desk')] on collect(['products.desk' => ['price' => 100]])", fn () => [collect(['products.desk' => ['price' => 100]])->get('products.desk'), collect(['products.desk' => ['price' => 100]])->has('products.desk')]);
probe('C32-B-pull-float-key-exists-as-its-string-form', "@pull(1.5) on collect(['a', 'b', 'c']) and on collect(['1.5' => 'x', 1 => 'y'])", function () {
    $list = collect(['a', 'b', 'c']);
    $record = collect(['1.5' => 'x', 1 => 'y']);

    return [
        'list' => ['returned' => @$list->pull(1.5), 'all' => $list->all()],
        'record' => ['returned' => @$record->pull(1.5), 'all' => $record->all()],
    ];
});
probe('C32-B-pad-past-a-string-key-order', "\$c = collect([5 => 'a', 'x' => 'b'])->pad(4, 0); keys/values", function () { $c = collect([5 => 'a', 'x' => 'b'])->pad(4, 0); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all()]; });
probe('C32-B-put-int-key-onto-string-keyed-order', "\$c = collect(['a' => 1]); \$c->put(0, 'z'); keys/values/last", function () { $c = collect(['a' => 1]); $c->put(0, 'z'); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'last' => $c->last()]; });

// splice: a keyed backing and a replacement, each in the order PHP's array holds it
probe('C32-B-splice-keyed-order', "splice(1, 0, ['p', 'q']) on collect(['a' => 1, 'b' => 2]) and splice(1, 1, ['p']) on collect(['a' => 1, 'b' => 2, 'c' => 3]): keys/values/first and the removed items", fn () => array_map(function (array $call) {
    [$items, $length, $replacement] = $call;
    $c = collect($items);
    $removed = $c->splice(1, $length, $replacement);

    return ['keys' => $c->keys()->all(), 'values' => $c->values()->all(), 'first' => $c->first(), 'removed' => $removed->all()];
}, [[['a' => 1, 'b' => 2], 0, ['p', 'q']], [['a' => 1, 'b' => 2, 'c' => 3], 1, ['p']]]));
probe('C32-B-splice-replacement-order', "splice(1, 0, [2 => 'c', 0 => 'a', 1 => 'b']) on collect(['x', 'y']) and on collect(['a' => 1, 'b' => 2]): keys/values", fn () => array_map(function (array $items) {
    $c = collect($items);
    $c->splice(1, 0, [2 => 'c', 0 => 'a', 1 => 'b']);

    return ['keys' => $c->keys()->all(), 'values' => $c->values()->all()];
}, [['x', 'y'], ['a' => 1, 'b' => 2]]));

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
probe('C32-B-put-illegal-key', "put(\$key, 9) and offsetSet(\$key, 9) over collect(['a', 'b']) and collect(['a' => 1, 'b' => 2]), for \$key = ['a'], new stdClass and fn () => 1", fn () => array_map(fn ($key) => [
    'put' => $overBackings(fn (Collection $c) => $c->put($key, 9)->all()),
    'offsetSet' => $overBackings(fn (Collection $c) => $c->offsetSet($key, 9)),
], $illegalKeys));
probe('C32-B-get-illegal-key', "get(\$key) and getOrPut(\$key, 9) over both backings, for \$key = ['a'], new stdClass and fn () => 1", fn () => array_map(fn ($key) => [
    'get' => $overBackings(fn (Collection $c) => $c->get($key)),
    'getOrPut' => $overBackings(fn (Collection $c) => $c->getOrPut($key, 9)),
], $illegalKeys));
probe('C32-B-has-illegal-key', "has([['a']]), has([\$first, ['b']]) and has(['zz', ['b']]) over both backings, \$first the backing's first key", fn () => [
    $overBackings(fn (Collection $c) => $c->has([['a']])),
    $overBackings(fn (Collection $c) => $c->has([$c->keys()->first(), ['b']])),
    $overBackings(fn (Collection $c) => $c->has(['zz', ['b']])),
]);
probe('C32-B-hasAny-illegal-key', "hasAny([['a']]), hasAny([\$first, ['b']]) and hasAny(['zz', ['b']]) over both backings, \$first the backing's first key, then hasAny([['a']]) over collect([])", fn () => [
    $overBackings(fn (Collection $c) => $c->hasAny([['a']])),
    $overBackings(fn (Collection $c) => $c->hasAny([$c->keys()->first(), ['b']])),
    $overBackings(fn (Collection $c) => $c->hasAny(['zz', ['b']])),
    collect([])->hasAny([['a']]),
]);
probe('C32-B-forget-illegal-key', "forget([\$key]) over both backings for \$key = ['a'], new stdClass and fn () => 1, then forget([\$first, ['b']]) with \$first the backing's first key", fn () => [
    'keys' => array_map(fn ($key) => $overBackings(fn (Collection $c) => $c->forget([$key])->all()), $illegalKeys),
    'after-a-legal-key' => $overBackings(fn (Collection $c) => $c->forget([$c->keys()->first(), ['b']])->all()),
]);
probe('C32-B-offset-illegal-key', "offsetGet(\$key), offsetExists(\$key) and offsetUnset(\$key) over both backings, for \$key = ['a'], new stdClass and fn () => 1", fn () => array_map(fn ($key) => [
    'offsetGet' => $overBackings(fn (Collection $c) => $c->offsetGet($key)),
    'offsetExists' => $overBackings(fn (Collection $c) => $c->offsetExists($key)),
    'offsetUnset' => $overBackings(fn (Collection $c) => $c->offsetUnset($key)),
], $illegalKeys));
probe('C32-B-pull-illegal-key', "pull(\$key) over both backings, for \$key = ['a'], new stdClass and fn () => 1", fn () => array_map(fn ($key) => $overBackings(fn (Collection $c) => $c->pull($key)), $illegalKeys));

$keysAndValues = fn (Collection $c) => ['keys' => $c->keys()->all(), 'values' => $c->values()->all()];

// shift() and pop() take their items one by one over range(1, min($count, count())), and PHP's min() answers the count
// of items over a NAN; range() refuses a float end less than one step from 1
$takeOutcome = function (string $method, array $items, $count) {
    $c = collect($items);
    $returned = c32c_outcome(function () use ($c, $method, $count) {
        $result = $c->$method($count);

        return $result instanceof Collection ? $result->all() : $result;
    });

    return ['returned' => $returned, 'all' => $c->all()];
};
$takeCounts = ['2.5' => 2.5, '1.5' => 1.5, '0.5' => 0.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19];
foreach (['shift', 'pop'] as $takeMethod) {
    probe("C32-B-{$takeMethod}-fractional-and-non-finite-counts", "{$takeMethod}(\$count) over collect([1, 2, 3, 4]) and collect(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4]) for 2.5, 1.5, 0.5, NAN, INF and 1e19, and over collect([9]) and collect([]) for 1.5: what it returns, or the class and message thrown, and what the collection holds after", fn () => [
        'list' => array_map(fn ($count) => $takeOutcome($takeMethod, [1, 2, 3, 4], $count), $takeCounts),
        'keyed' => array_map(fn ($count) => $takeOutcome($takeMethod, ['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4], $count), $takeCounts),
        'one item' => $takeOutcome($takeMethod, [9], 1.5),
        'empty' => $takeOutcome($takeMethod, [], 1.5),
    ]);
}
probe('C32-B-shift-and-pop-counts-out-of-order-keys', "shift(\$count) and pop(\$count) over collect([2 => 'c', 0 => 'a', 1 => 'b']) for 2.5, 1.5 and NAN: what each returns, or the class and message thrown, and the keys and values left", fn () => array_map(fn (string $method) => array_map(function ($count) use ($method, $keysAndValues) {
    $c = collect([2 => 'c', 0 => 'a', 1 => 'b']);
    $returned = c32c_outcome(fn () => $c->$method($count)->all());

    return ['returned' => $returned] + $keysAndValues($c);
}, ['2.5' => 2.5, '1.5' => 1.5, 'NAN' => NAN]), ['shift' => 'shift', 'pop' => 'pop']));

// array_pad() and array_splice() read their counts as int parameters: a fraction is dropped (with a deprecation,
// silenced here), and a float no int can hold is refused before anything changes
$padSizes = ['7.5' => 7.5, '-7.5' => -7.5, '0.5' => 0.5, 'NAN' => NAN, 'INF' => INF, '-INF' => -INF, '1e19' => 1e19, '-1e19' => -1e19];
probe('C32-B-pad-fractional-and-non-int-sizes', "pad(\$size, 0) over collect([1, 2, 3]) and collect(['a' => 1, 'b' => 2, 'c' => 3]) for 7.5, -7.5, 0.5, NAN, INF, -INF, 1e19 and -1e19: the keys and values, or the class and message thrown", fn () => array_map(fn (array $items) => array_map(fn ($size) => c32c_outcome(fn () => $keysAndValues(@collect($items)->pad($size, 0))), $padSizes), ['list' => [1, 2, 3], 'keyed' => ['a' => 1, 'b' => 2, 'c' => 3]]));
probe('C32-B-pad-past-maximum-array-size', "collect([1, 2, 3])->pad(\$size, 0) for 1073741825, -1073741825 and 1e18: the class and message thrown", fn () => array_map(fn ($size) => c32c_outcome(fn () => collect([1, 2, 3])->pad($size, 0)->all()), ['1073741825' => 1073741825, '-1073741825' => -1073741825, '1e18' => 1e18]));
probe('C32-B-pad-fractional-size-out-of-order-keys', "collect([2 => 'c', 0 => 'a', 1 => 'b'])->pad(\$size, 'P') for 4.5, -4.5 and NAN: the keys and values, or the class and message thrown", fn () => array_map(fn ($size) => c32c_outcome(fn () => $keysAndValues(@collect([2 => 'c', 0 => 'a', 1 => 'b'])->pad($size, 'P'))), ['4.5' => 4.5, '-4.5' => -4.5, 'NAN' => NAN]));
probe('C32-B-pad-far-past-maximum-array-size', "collect([1, 2, 3])->pad(\$size, 0) for 1e18 and -1e18: the class and message thrown", fn () => array_map(fn ($size) => c32c_outcome(fn () => collect([1, 2, 3])->pad($size, 0)->all()), ['1e18' => 1e18, '-1e18' => -1e18]));
$spliceOutcome = function (array $items, array $arguments) use ($keysAndValues) {
    $c = collect($items);
    $removed = c32c_outcome(fn () => $keysAndValues(@$c->splice(...$arguments)));

    return ['removed' => $removed] + $keysAndValues($c);
};
$spliceBackings = ['list' => [1, 2, 3, 4], 'keyed' => ['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4]];
probe('C32-B-splice-fractional-and-non-finite-offsets', "splice(\$offset) and splice(\$offset, 1) over collect([1, 2, 3, 4]) and collect(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4]) for 1.5, -1.5, NAN, INF and 1e19: the keys and values removed, or the class and message thrown, and the keys and values left", fn () => array_map(fn (array $items) => array_map(fn ($offset) => [
    'offset only' => $spliceOutcome($items, [$offset]),
    'length 1' => $spliceOutcome($items, [$offset, 1]),
], ['1.5' => 1.5, '-1.5' => -1.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19]), $spliceBackings));
probe('C32-B-splice-fractional-and-non-finite-lengths', "splice(1, \$length) and splice(1, \$length, ['x']) over collect([1, 2, 3, 4]) and collect(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4]) for 1.5, -1.5, NAN, INF, -INF and 1e19: the keys and values removed, or the class and message thrown, and the keys and values left", fn () => array_map(fn (array $items) => array_map(fn ($length) => [
    'no replacement' => $spliceOutcome($items, [1, $length]),
    'replacement' => $spliceOutcome($items, [1, $length, ['x']]),
], ['1.5' => 1.5, '-1.5' => -1.5, 'NAN' => NAN, 'INF' => INF, '-INF' => -INF, '1e19' => 1e19]), $spliceBackings));
probe('C32-B-splice-null-length-to-the-end', "splice(1, null) and splice(-1, null) over collect([1, 2, 3, 4]) and collect(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4]): the keys and values removed, and the keys and values left", fn () => array_map(fn (array $items) => [
    '1' => $spliceOutcome($items, [1, null]),
    '-1' => $spliceOutcome($items, [-1, null]),
], $spliceBackings));

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

/** What $run answers, or the class and message of what it throws. */
function c32c_outcome(callable $run): mixed
{
    try {
        return $run();
    } catch (\Throwable $e) {
        return [get_class($e), $e->getMessage()];
    }
}

probe('C32-C-lone-key-forms-by-key-class', 'hasSole / sole / firstOrFail on (new Collection([["name" => "foo"]])) and hasMany on (new Collection([["name" => "foo"], ["name" => "bar"]])) with a lone key 0, "", "0" or 1: the answer, or the class thrown', function () {
    $out = [];
    foreach (['zero' => 0, 'empty-string' => '', 'zero-string' => '0', 'one' => 1] as $label => $key) {
        foreach (['hasSole', 'hasMany', 'sole', 'firstOrFail'] as $method) {
            $items = $method === 'hasMany' ? [['name' => 'foo'], ['name' => 'bar']] : [['name' => 'foo']];
            try {
                $out[$label][$method] = (new Collection($items))->{$method}($key);
            } catch (\Throwable $e) {
                $out[$label][$method] = get_class($e);
            }
        }
    }

    return $out;
});
probe('C32-C-lone-key-type-error-message', 'the TypeError message, up to ", called in", for a lone "name" key to hasSole / hasMany / sole / firstOrFail, and a lone 1 to firstOrFail, on (new Collection([["name" => "foo"]]))', function () {
    $out = [];
    foreach (['hasSole' => ['hasSole', 'name'], 'hasMany' => ['hasMany', 'name'], 'sole' => ['sole', 'name'], 'firstOrFail' => ['firstOrFail', 'name'], 'firstOrFail-int' => ['firstOrFail', 1]] as $label => [$method, $key]) {
        try {
            (new Collection([['name' => 'foo']]))->{$method}($key);
        } catch (\TypeError $e) {
            $out[$label] = explode(', called in', $e->getMessage())[0];
        }
    }

    return $out;
});
probe('C32-C-every-null-operator', "(new Collection([['x' => 5], ['x' => '5']]))->every('x', null, 5) / (new Collection([['x' => 5], ['x' => 6]]))->every('x', null, 5)", fn () => [
    (new Collection([['x' => 5], ['x' => '5']]))->every('x', null, 5),
    (new Collection([['x' => 5], ['x' => 6]]))->every('x', null, 5),
]);
probe('C32-C-random-too-many-count', '(new Collection([1, 2, 3]))->random(4)', fn () => (new Collection([1, 2, 3]))->random(4));
probe('C32-C-random-preserved-string-keys', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->random(3, true)->all() / array_is_list(random(2, true)->all())", fn () => [
    (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->random(3, true)->all(),
    array_is_list((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->random(2, true)->all()),
]);
probe('C32-C-random-non-finite-count', "NAN, INF and -INF as the count of (new Collection([1, 2, 3]))->random(...)->all() and of Arr::random over [1, 2, 3] (list) and ['a' => 1, 'b' => 2, 'c' => 3] (keyed): the answer, or the class and message thrown", fn () => array_map(fn (float $count) => [
    'collection' => c32c_outcome(fn () => (new Collection([1, 2, 3]))->random($count)->all()),
    'list' => c32c_outcome(fn () => Arr::random([1, 2, 3], $count)),
    'keyed' => c32c_outcome(fn () => Arr::random(['a' => 1, 'b' => 2, 'c' => 3], $count)),
], ['NAN' => NAN, 'INF' => INF, '-INF' => -INF]));
probe('C32-C-random-non-numeric-string-count', "'abc' and '1x' as the count of (new Collection([1, 2, 3]))->random(...)->all() and of Arr::random over [1, 2, 3] (list) and ['a' => 1, 'b' => 2, 'c' => 3] (keyed): the class and message thrown", fn () => array_map(fn (string $count) => [
    'collection' => c32c_outcome(fn () => (new Collection([1, 2, 3]))->random($count)->all()),
    'list' => c32c_outcome(fn () => Arr::random([1, 2, 3], $count)),
    'keyed' => c32c_outcome(fn () => Arr::random(['a' => 1, 'b' => 2, 'c' => 3], $count)),
], ['abc' => 'abc', '1x' => '1x']));
probe('C32-C-random-nan-count-on-empty', "Arr::random([], NAN) / Arr::random([], NAN, true) / (new Collection([]))->random(NAN)->all() / (new Collection([]))->random(fn () => NAN)->all(): the empty guard answers before pickArrayKeys", fn () => [
    'list' => Arr::random([], NAN),
    'list-preserving-keys' => Arr::random([], NAN, true),
    'collection' => (new Collection([]))->random(NAN)->all(),
    'collection-callback' => (new Collection([]))->random(fn () => NAN)->all(),
]);
probe('C32-C-filtered-predicates-out-of-order-visits', "keys an always-false callback sees in hasSole / hasMany / sole on (new Collection([2 => 'c', 0 => 'a', 1 => 'b'])), and what sole answers for a callback true only on its first call", function () {
    $base = fn () => new Collection([2 => 'c', 0 => 'a', 1 => 'b']);
    $seen = function (callable $run): array {
        $keys = [];
        try {
            $run(function ($v, $k) use (&$keys) {
                $keys[] = $k;

                return false;
            });
        } catch (\Throwable) {
        }

        return $keys;
    };
    $calls = 0;

    return [
        'hasSole' => $seen(fn ($cb) => $base()->hasSole($cb)),
        'hasMany' => $seen(fn ($cb) => $base()->hasMany($cb)),
        'sole' => $seen(fn ($cb) => $base()->sole($cb)),
        'sole-first-call-only' => $base()->sole(function () use (&$calls) {
            return ++$calls === 1;
        }),
    ];
});
probe('C32-C-random-out-of-order-full-count', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->random(3)->all() and pairs(random(3, true)->all()), which every draw answers alike", fn () => [
    'values' => (new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->random(3)->all(),
    'preserving-keys' => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->random(3, true)->all()),
]);
probe('C32-C-two-args-null-value-others','some / doesntContain / containsStrict / doesntContainStrict with ("a", null) over [["a" => null], ["a" => 1]] and over [["a" => 1]], and firstOrFail("a", null) over [["a" => 1], ["a" => null]] and over [["a" => 1]]', fn () => [
    'some' => [(new Collection([['a' => null], ['a' => 1]]))->some('a', null), (new Collection([['a' => 1]]))->some('a', null)],
    'doesntContain' => [(new Collection([['a' => null], ['a' => 1]]))->doesntContain('a', null), (new Collection([['a' => 1]]))->doesntContain('a', null)],
    'containsStrict' => [(new Collection([['a' => null], ['a' => 1]]))->containsStrict('a', null), (new Collection([['a' => 1]]))->containsStrict('a', null)],
    'doesntContainStrict' => [(new Collection([['a' => null], ['a' => 1]]))->doesntContainStrict('a', null), (new Collection([['a' => 1]]))->doesntContainStrict('a', null)],
    'firstOrFail' => [
        c32c_outcome(fn () => (new Collection([['a' => 1], ['a' => null]]))->firstOrFail('a', null)),
        c32c_outcome(fn () => (new Collection([['a' => 1]]))->firstOrFail('a', null)),
    ],
]);
probe('C32-C-arr-random-fractional-count', "Arr::random over [1, 2, 3] (list) and ['a' => 1, 'b' => 2, 'c' => 3] (keyed), deprecations silenced: how many it picks for 1.2, 2.9 and 1.5 with keys preserved, and what 3.5 and 0.5 throw", fn () => array_map(fn (array $items) => [
    '1.2' => count(@Arr::random($items, 1.2)),
    '2.9' => count(@Arr::random($items, 2.9)),
    '1.5 preserving keys' => count(@Arr::random($items, 1.5, true)),
    '3.5' => c32c_outcome(fn () => @Arr::random($items, 3.5)),
    '0.5' => c32c_outcome(fn () => @Arr::random($items, 0.5)),
], ['list' => [1, 2, 3], 'keyed' => ['a' => 1, 'b' => 2, 'c' => 3]]));

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
probe('C32-D-whereIn-numbers-and-strings-loose', "whereIn('v', [1, '2', ' 3', '4 ', 'abc', '0.5']) over v = 1, '1', '1.0', 2, '02', 3, '3', 4, 'ABC', 'abc', 0.5, '.5', '5'", fn () => $vs([1, '1', '1.0', 2, '02', 3, '3', 4, 'ABC', 'abc', 0.5, '.5', '5'])->whereIn('v', [1, '2', ' 3', '4 ', 'abc', '0.5'])->keys()->all());
probe('C32-D-whereIn-integer-strings-past-2-53-loose', "whereIn('v', ['9007199254740993']) over v = 9007199254740992, '9007199254740993', '9007199254740993.0', '9007199254740992'", fn () => $vs([9007199254740992, '9007199254740993', '9007199254740993.0', '9007199254740992'])->whereIn('v', ['9007199254740993'])->keys()->all());
probe('C32-D-whereIn-inf-loose', "whereIn('v', ['INF', '1e999']) over v = INF, 'INF', '1e999', '1e1000', 'inf'", fn () => $vs([INF, 'INF', '1e999', '1e1000', 'inf'])->whereIn('v', ['INF', '1e999'])->keys()->all());
probe('C32-D-whereNotIn-numbers-and-strings-loose', "whereNotIn('v', [1, 'abc']) over v = 1, '1', 'abc', 'ABC', 2, true", fn () => $vs([1, '1', 'abc', 'ABC', 2, true])->whereNotIn('v', [1, 'abc'])->keys()->all());
probe('C32-D-whereInStrict-scalars', "whereInStrict('v', [1, '2', null, NAN]) over v = 1, '1', 2, '2', null, false, NAN", fn () => $vs([1, '1', 2, '2', null, false, NAN])->whereInStrict('v', [1, '2', null, NAN])->keys()->all());

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

probe('C32-D-partition-offset-get', "(new Collection(['a' => 1, 'b' => 2]))->partition(fn (\$v) => \$v > 1): its [0] and [1]", function () {
    $halves = (new Collection(['a' => 1, 'b' => 2]))->partition(fn ($v) => $v > 1);

    return [pairs($halves[0]), pairs($halves[1])];
});
probe('C32-D-null-keys-copy', "\$c = new Collection(['a' => 1]); only(null), except(null) and select(null), each then put('b', 2): \$c and each copy", function () {
    $c = new Collection(['a' => 1]);
    $copies = [$c->only(null), $c->except(null), $c->select(null)];

    foreach ($copies as $copy) {
        $copy->put('b', 2);
    }

    return array_map(fn (Collection $collection) => $collection->all(), [$c, ...$copies]);
});
probe('C32-D-skip-take-callback-php-truthiness', "skipUntil / skipWhile / takeUntil / takeWhile over new Collection(c32c_items(list | keyed)), with a callback answering '0', [] and new DateTime('@0')", fn () => array_map(fn (bool $keyed) => [
    'skipUntil' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->skipUntil($cb)),
    'skipWhile' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->skipWhile($cb)),
    'takeUntil' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->takeUntil($cb)),
    'takeWhile' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->takeWhile($cb)),
], ['list' => false, 'keyed' => true]));
probe('C32-D-arr-only-repeated-keys', "Arr::only(['a', 'b', 'c'], [2, 0, 2])", fn () => pairs(Arr::only(['a', 'b', 'c'], [2, 0, 2])));
probe('C32-D-select-string-index-and-length', "(new Collection([[10, 20, 30]]))->select(['1', 'length'])", fn () => pairs((new Collection([[10, 20, 30]]))->select(['1', 'length'])));
probe('C32-D-select-integer-string-key', "(new Collection([['a' => 1, 1 => 'x']]))->select('1', 'a')", fn () => pairs((new Collection([['a' => 1, 1 => 'x']]))->select('1', 'a')));
probe('C32-D-select-object-falsy-props', "(new Collection([(object) ['a' => null, 'b' => 1, 'c' => 0, 'd' => '']]))->select('a', 'b', 'c', 'd', 'e')", fn () => pairs((new Collection([(object) ['a' => null, 'b' => 1, 'c' => 0, 'd' => '']]))->select('a', 'b', 'c', 'd', 'e')));
probe('C32-D-select-keyed-collection-arg', "(new Collection([['first' => 'T', 'last' => 'O', 'email' => 'e']]))->select(new Collection(['x' => 'first', 'y' => 'email']))", fn () => pairs((new Collection([['first' => 'T', 'last' => 'O', 'email' => 'e']]))->select(new Collection(['x' => 'first', 'y' => 'email']))));
probe('C32-D-select-array-then-extra-arg', "(new Collection([['first' => 'T', 'last' => 'O']]))->select(['first'], 'last')", fn () => pairs((new Collection([['first' => 'T', 'last' => 'O']]))->select(['first'], 'last')));
probe('C32-D-skip-take-callback-index', "(new Collection(['x', 'y', 'z'])): skipUntil(fn (\$v, \$k) => \$k === 1) and takeUntil(fn (\$v, \$k) => \$k === 1)", fn () => [
    'skipUntil' => pairs((new Collection(['x', 'y', 'z']))->skipUntil(fn ($v, $k) => $k === 1)),
    'takeUntil' => pairs((new Collection(['x', 'y', 'z']))->takeUntil(fn ($v, $k) => $k === 1)),
]);
probe('C32-D-skip-take-out-of-order-keys', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b'])): skipWhile('c'), takeUntil('a') and takeWhile('c')", fn () => [
    'skipWhile' => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->skipWhile('c')),
    'takeUntil' => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->takeUntil('a')),
    'takeWhile' => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->takeWhile('c')),
]);

// Arr::exists casts a null key to '', while Arr::wrap turns a bare null into no keys at all.
probe('C32-D-select-null-key-cast', "select([null, 'a']) and select('a', null) over [['' => 'e', 'a' => 1]], and Arr::select() of it with [null] and with a bare null", fn () => [
    'collection-array' => pairs(@(new Collection([['' => 'e', 'a' => 1]]))->select([null, 'a'])),
    'collection-args' => pairs(@(new Collection([['' => 'e', 'a' => 1]]))->select('a', null)),
    'arr-list' => pairs(@Arr::select([['' => 'e', 'a' => 1]], [null])),
    'arr-bare-null' => pairs(Arr::select([['' => 'e', 'a' => 1]], null)),
]);

/** An ArrayAccess row whose offsets answer apart from its public properties. */
class C32D_SelectAccess implements ArrayAccess
{
    public $a = 'prop-a';
    public $p = 'prop-p';
    public $q = null;
    public function __construct(private array $items) {}
    public function offsetExists(mixed $offset): bool { return array_key_exists($offset, $this->items); }
    public function offsetGet(mixed $offset): mixed { return $this->items[$offset]; }
    public function offsetSet(mixed $offset, mixed $value): void { $this->items[$offset] = $value; }
    public function offsetUnset(mixed $offset): void { unset($this->items[$offset]); }
}

probe('C32-D-select-arrayaccess-rows', "(new Collection([new C32D_SelectAccess(['a' => 'offset-a', 'n' => null])]))->select('a', 'n', 'p', 'q', 'missing'), with public \$a = 'prop-a', \$p = 'prop-p', \$q = null", fn () => pairs((new Collection([new C32D_SelectAccess(['a' => 'offset-a', 'n' => null])]))->select('a', 'n', 'p', 'q', 'missing')));

/** An ArrayAccess row that counts the offsetExists and offsetGet calls it answers. */
class C32D_CountingAccess implements ArrayAccess
{
    public int $exists = 0;
    public int $gets = 0;
    public function __construct(private array $items) {}
    public function offsetExists(mixed $offset): bool { $this->exists++; return array_key_exists($offset, $this->items); }
    public function offsetGet(mixed $offset): mixed { $this->gets++; return $this->items[$offset]; }
    public function offsetSet(mixed $offset, mixed $value): void { $this->items[$offset] = $value; }
    public function offsetUnset(mixed $offset): void { unset($this->items[$offset]); }
}

probe('C32-D-select-arrayaccess-call-counts', "Arr::select([\$row], ['a']) and Arr::select([\$row], ['a', 'missing']) over a fresh C32D_CountingAccess(['a' => 1]): the selection, then the offsetExists and offsetGet calls", fn () => array_map(function (array $keys) {
    $row = new C32D_CountingAccess(['a' => 1]);
    $selected = Arr::select([$row], $keys);

    return [pairs($selected), $row->exists, $row->gets];
}, [['a'], ['a', 'missing']]));
probe('C32-D-select-collection-row-fields', "Arr::select([new Collection(['a' => 1])], ['items', 'a']) and (new Collection([new Collection(['a' => 1])]))->select('items', 'a')", fn () => [
    pairs(Arr::select([new Collection(['a' => 1])], ['items', 'a'])),
    pairs((new Collection([new Collection(['a' => 1])]))->select('items', 'a')),
]);
// array_flip skips a key it cannot store, while array_key_exists throws for one.
probe('C32-D-only-odd-later-args', "only('a', null) over ['null' => 1, 'a' => 2], only('a', ['b']) and only('a', new Collection(['b'])) over ['a' => 1, 'b' => 2], and only(0, [1]) over ['x', 'y']", fn () => [
    'null' => pairs(@(new Collection(['null' => 1, 'a' => 2]))->only('a', null)),
    'array' => pairs(@(new Collection(['a' => 1, 'b' => 2]))->only('a', ['b'])),
    'collection' => pairs(@(new Collection(['a' => 1, 'b' => 2]))->only('a', new Collection(['b']))),
    'list' => pairs(@(new Collection(['x', 'y']))->only(0, [1])),
]);
probe('C32-D-array-key-type-error', "except('a', ['b']) and except('a', new Collection(['b'])) over ['a' => 1, 'b' => 2], Arr::except([], [['b']]), and select('a', ['b']) over an array row, an object row, a scalar row and no rows", fn () => array_map(function (callable $run) {
    try {
        return pairs($run());
    } catch (\TypeError $e) {
        return get_class($e) . ': ' . $e->getMessage();
    }
}, [
    'except-array' => fn () => (new Collection(['a' => 1, 'b' => 2]))->except('a', ['b']),
    'except-collection' => fn () => (new Collection(['a' => 1, 'b' => 2]))->except('a', new Collection(['b'])),
    'arr-except-empty' => fn () => Arr::except([], [['b']]),
    'select-array-row' => fn () => (new Collection([['a' => 1, 'b' => 2]]))->select('a', ['b']),
    'select-object-row' => fn () => @(new Collection([(object) ['a' => 1, 'b' => 2]]))->select('a', ['b']),
    'select-scalar-row' => fn () => (new Collection([1]))->select('a', ['b']),
    'select-no-rows' => fn () => (new Collection([]))->select('a', ['b']),
]));
// Arr::forget asks Arr::exists, which reads a null key as '' and a float as its string form; unset then casts a
// float to its integer part, and explode splits the string form into a path.
probe('C32-D-except-forget-null-key', "except(null), except([null]), except('a', null) and except(new Collection([null])), then forget(null) and forget([null]), over ['' => 1, 'a' => 2]", fn () => [
    'except-null' => pairs((new Collection(['' => 1, 'a' => 2]))->except(null)),
    'except-list' => pairs((new Collection(['' => 1, 'a' => 2]))->except([null])),
    'except-later' => pairs((new Collection(['' => 1, 'a' => 2]))->except('a', null)),
    'except-collection' => pairs((new Collection(['' => 1, 'a' => 2]))->except(new Collection([null]))),
    'forget-null' => pairs((new Collection(['' => 1, 'a' => 2]))->forget(null)),
    'forget-list' => pairs((new Collection(['' => 1, 'a' => 2]))->forget([null])),
]);
probe('C32-D-arr-except-null-key', "Arr::except(['' => 1, 'a' => 2], null), Arr::except(['' => 1, 'a' => 2], [null]) and Arr::except(['a' => ['' => 1]], [null])", fn () => [
    'bare' => pairs(Arr::except(['' => 1, 'a' => 2], null)),
    'list' => pairs(Arr::except(['' => 1, 'a' => 2], [null])),
    'nested' => pairs(@Arr::except(['a' => ['' => 1]], [null])),
]);
probe('C32-D-except-float-key', "except([1.5]) over ['1.5' => 'a', 1 => 'b', 'c' => 'd'], ['1.5' => 'a', 'c' => 'd'] and [1 => ['5' => 'x', 6 => 'y']], and forget([1.5]) over ['1.5' => 'a', 1 => 'b']", fn () => [
    'both' => pairs(@(new Collection(['1.5' => 'a', 1 => 'b', 'c' => 'd']))->except([1.5])),
    'string-only' => pairs(@(new Collection(['1.5' => 'a', 'c' => 'd']))->except([1.5])),
    'nested' => pairs((new Collection([1 => ['5' => 'x', 6 => 'y']]))->except([1.5])),
    'forget-both' => pairs(@(new Collection(['1.5' => 'a', 1 => 'b']))->forget([1.5])),
]);
probe('C32-D-arr-except-float-list-path', "Arr::except([['a', 'b', 'c', 'd', 'e', 'f']], [0.5]) and Arr::except(['a', 'b', 'c'], [1.5])", fn () => [
    pairs(Arr::except([['a', 'b', 'c', 'd', 'e', 'f']], [0.5])),
    pairs(Arr::except(['a', 'b', 'c'], [1.5])),
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
probe('C32-E-pluck-anonymous-subclass-key', "(new Collection([['v' => 1]]))->pluck('v', fn () => new class extends C32AParent {})", fn () => (new Collection([['v' => 1]]))->pluck('v', fn () => new class extends C32AParent {})->all());
probe('C32-E-pluck-nested-array-row', "(new Collection([['n' => 1]]))->pluck('n') and ->pluck('*')", fn () => ['path' => (new Collection([['n' => 1]]))->pluck('n')->all(), 'wildcard' => (new Collection([['n' => 1]]))->pluck('*')->all()]);
probe('C32-E-keyed-results-out-of-order-receiver', "a receiver whose integer keys run 2, 0: keyBy('id'), groupBy('g') and countBy() keys, mapToDictionary(fn => [\$v => \$k]), and flip() over 'x', 'y', 'x'", fn () => [
    'keyBy' => (new Collection([2 => ['id' => 5], 0 => ['id' => 4]]))->keyBy('id')->keys()->all(),
    'groupBy' => (new Collection([2 => ['g' => 5], 0 => ['g' => 4]]))->groupBy('g')->keys()->all(),
    'countBy' => (new Collection([2 => 5, 0 => 4]))->countBy()->keys()->all(),
    'mapToDictionary' => c32e_pairs((new Collection([2 => 5, 0 => 4]))->mapToDictionary(fn ($v, $k) => [$v => $k])),
    'flip' => c32e_pairs((new Collection([2 => 'x', 0 => 'y', 1 => 'x']))->flip()),
]);
probe('C32-E-mapToDictionary-empty-return', "@collect([1, 2])->mapToDictionary(fn () => [])", fn () => c32e_pairs(@(new Collection([1, 2]))->mapToDictionary(fn () => [])));
probe('C32-E-groupBy-groups-keep-subclass', "get_class of C32ASub([['a' => 1, 'b' => 'x']])->groupBy(['a', 'b']), of its group 1 and of that group's group 'x'", function () {
    $grouped = (new C32ASub([['a' => 1, 'b' => 'x']]))->groupBy(['a', 'b']);

    return [get_class($grouped), get_class($grouped->get(1)), get_class($grouped->get(1)->get('x'))];
});
probe('C32-E-groupBy-preserve-keys-mixed-order', "collect(['x' => 'p', 5 => 'q'])->groupBy(fn () => 'g', true)", fn () => c32e_pairs((new Collection(['x' => 'p', 5 => 'q']))->groupBy(fn () => 'g', true)));
probe('C32-E-each-out-of-order-keys', "collect([2 => 'c', 0 => 'a', 1 => 'b'])->each(): keys seen", function () {
    $seen = [];
    (new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->each(function ($v, $k) use (&$seen) { $seen[] = $k; });

    return $seen;
});
probe('C32-E-collapseWithKeys-out-of-order', "collect([2 => ['c' => 1], 0 => ['a' => 1], 1 => ['b' => 1]])->collapseWithKeys()", fn () => c32e_pairs((new Collection([2 => ['c' => 1], 0 => ['a' => 1], 1 => ['b' => 1]]))->collapseWithKeys()));
probe('C32-E-mapInto-pure-enum', "(new Collection(['A']))->mapInto(C32E_Pure::class)", fn () => (new Collection(['A']))->mapInto(C32E_Pure::class)->all());
probe('C32-E-collapseWithKeys-collection-items', "collect([collect([2 => 'c', 0 => 'a'])]) and collect([collect([1, 2]), [3]]), each ->collapseWithKeys()", fn () => [
    'out-of-order' => c32e_pairs((new Collection([new Collection([2 => 'c', 0 => 'a'])]))->collapseWithKeys()),
    'collection-then-list' => c32e_pairs((new Collection([new Collection([1, 2]), [3]]))->collapseWithKeys()),
]);
probe('C32-E-collapse-out-of-order-collection-item', "collect([collect([2 => 'c', 0 => 'a'])])->collapse(), and whether it is a list", fn () => [
    'pairs' => c32e_pairs((new Collection([new Collection([2 => 'c', 0 => 'a'])]))->collapse()),
    'is-list' => array_is_list((new Collection([new Collection([2 => 'c', 0 => 'a'])]))->collapse()->all()),
]);
probe('C32-E-flatMap-record-receiver', "collect(['a' => 1, 'b' => 2])->flatMap(fn (\$v) => [\$v, \$v * 10]), and whether it is a list", fn () => [
    'pairs' => c32e_pairs((new Collection(['a' => 1, 'b' => 2]))->flatMap(fn ($v) => [$v, $v * 10])),
    'is-list' => array_is_list((new Collection(['a' => 1, 'b' => 2]))->flatMap(fn ($v) => [$v, $v * 10])->all()),
]);
probe('C32-E-mapWithKeys-out-of-order-return', "collect([1])->mapWithKeys(fn () => [2 => 'c', 0 => 'a'])", fn () => c32e_pairs((new Collection([1]))->mapWithKeys(fn () => [2 => 'c', 0 => 'a'])));

// ---- Family F ------------------------------------------------------------

$fViews = fn (Collection $c) => ['all' => $c->all(), 'keys' => $c->keys()->all(), 'values' => $c->values()->all()];
$fRows = fn (Collection $c) => $c->map(fn ($row) => $row instanceof Collection ? $row->all() : $row)->all();

// merge / union / mergeRecursive with null hand back a NEW instance (PHP: newInstance(array_merge(...)))
probe('C32-F-merge-null-is-a-new-instance', '$a = collect([1]); $b = $a->merge(null); $b->push(2);', function () { $a = collect([1]); $b = $a->merge(null); $b->push(2); return ['same' => $a === $b, 'receiver' => $a->all(), 'result' => $b->all()]; });
probe('C32-F-union-null-is-a-new-instance', '$a = collect([1]); $b = $a->union(null); $b->push(2);', function () { $a = collect([1]); $b = $a->union(null); $b->push(2); return ['same' => $a === $b, 'receiver' => $a->all(), 'result' => $b->all()]; });
probe('C32-F-mergeRecursive-null-is-a-new-instance', '$a = collect([1]); $b = $a->mergeRecursive(null); $b->push(2);', function () { $a = collect([1]); $b = $a->mergeRecursive(null); $b->push(2); return ['same' => $a === $b, 'receiver' => $a->all(), 'result' => $b->all()]; });
probe('C32-F-merge-null-renumbers', "collect([5 => 'a', 'k' => 'b'])->merge(null)", fn () => $fViews(collect([5 => 'a', 'k' => 'b'])->merge(null)));
probe('C32-F-mergeRecursive-null-renumbers', "collect([5 => 'a', 'k' => 'b'])->mergeRecursive(null)", fn () => $fViews(collect([5 => 'a', 'k' => 'b'])->mergeRecursive(null)));
probe('C32-F-union-null-keeps-keys', "collect([5 => 'a', 'k' => 'b'])->union(null)", fn () => $fViews(collect([5 => 'a', 'k' => 'b'])->union(null)));

// merge: integer keys are renumbered and appended, string keys overwrite
probe('C32-F-merge-assoc-then-list', "collect(['a' => 1, 'b' => 2])->merge([3, 4])", fn () => $fViews(collect(['a' => 1, 'b' => 2])->merge([3, 4])));
probe('C32-F-merge-int-keyed-record-then-list', "collect(['a' => 1, 5 => 'x'])->merge(['y'])", fn () => $fViews(collect(['a' => 1, 5 => 'x'])->merge(['y'])));
probe('C32-F-merge-same-int-key-appends', "collect([5 => 'a'])->merge([5 => 'b'])", fn () => $fViews(collect([5 => 'a'])->merge([5 => 'b'])));
probe('C32-F-merge-scalar-operand', "collect(['hello'])->merge(1)", fn () => collect(['hello'])->merge(1)->all());
probe('C32-F-merge-string-key-keeps-its-place', "collect(['a' => 1, 'b' => 2])->merge(['c' => 3, 'a' => 9])", fn () => $fViews(collect(['a' => 1, 'b' => 2])->merge(['c' => 3, 'a' => 9])));
probe('C32-F-merge-list-then-out-of-order-int-keys', "collect([1])->merge([3 => 'x', 1 => 'y'])", fn () => $fViews(collect([1])->merge([3 => 'x', 1 => 'y'])));
probe('C32-F-merge-out-of-order-receiver', "collect([2 => 'c', 0 => 'a', 1 => 'b'])->merge(['d'])", fn () => $fViews(collect([2 => 'c', 0 => 'a', 1 => 'b'])->merge(['d'])));

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

// multiply: always a list of the values
probe('C32-F-multiply-assoc', "collect(['a' => 1, 'b' => 2])->multiply(2)", fn () => collect(['a' => 1, 'b' => 2])->multiply(2)->all());
// array_map is an internal caller, so the float coerces to an int as non-strict code does (with a deprecation)
probe('C32-F-multiply-fractional-count', "array_map([collect([1, 2]), 'multiply'], [2.5])[0]", fn () => @array_map([collect([1, 2]), 'multiply'], [2.5])[0]->all());
probe('C32-F-multiply-non-finite-count', "array_map([collect([1, 2]), 'multiply'], [\$count]) for NAN, INF and -INF: the class and message thrown", fn () => array_map(fn (float $count) => c32c_outcome(fn () => array_map([collect([1, 2]), 'multiply'], [$count])[0]->all()), ['NAN' => NAN, 'INF' => INF, '-INF' => -INF]));
probe('C32-F-multiply-out-of-int-range-count', "array_map([collect([1, 2]), 'multiply'], [\$count]) for 1e19, -1e19, 2**63, -2**63 and the float below -2**63: the answer, or the class and message thrown", fn () => array_map(fn (float $count) => c32c_outcome(fn () => array_map([collect([1, 2]), 'multiply'], [$count])[0]->all()), ['1e19' => 1e19, '-1e19' => -1e19, '2**63' => 9223372036854775808.0, '-2**63' => -9223372036854775808.0, 'below -2**63' => -9223372036854777856.0]));

// replace / replaceRecursive: the PHP tests' own sparse int-keyed replacers
probe('C32-F-replace-sparse-int-keyed-replacer', "collect(['a', 'b', 'c'])->replace([1 => 'd', 2 => 'e'])", fn () => collect(['a', 'b', 'c'])->replace([1 => 'd', 2 => 'e'])->all());
probe('C32-F-replaceRecursive-sparse-replacer', "collect(['a', 'b', ['c', 'd']])->replaceRecursive(['z', 2 => [1 => 'e']])", fn () => collect(['a', 'b', ['c', 'd']])->replaceRecursive(['z', 2 => [1 => 'e']])->all());

// union / replace / replaceRecursive: the receiver's keys first, then the keys the operand adds, in its order
probe('C32-F-union-assoc-then-list', "collect(['a' => 1])->union([5])", fn () => $fViews(collect(['a' => 1])->union([5])));
probe('C32-F-replace-assoc-then-list', "collect(['a' => 1])->replace(['x'])", fn () => $fViews(collect(['a' => 1])->replace(['x'])));
probe('C32-F-replace-out-of-order-int-keys', "collect([1, 2, 3])->replace([7 => 'x', 3 => 'y'])", fn () => $fViews(collect([1, 2, 3])->replace([7 => 'x', 3 => 'y'])));
probe('C32-F-replaceRecursive-assoc-then-list', "collect(['a' => 1])->replaceRecursive(['x'])", fn () => $fViews(collect(['a' => 1])->replaceRecursive(['x'])));

// zip: array_map pads every shorter side, the receiver included, with null
probe('C32-F-zip-receiver-shorter', "collect(['a', 'b'])->zip([1, 2, 3])", fn () => $fRows(collect(['a', 'b'])->zip([1, 2, 3])));
probe('C32-F-zip-empty-receiver', 'collect([])->zip([1, 2])', fn () => $fRows(collect([])->zip([1, 2])));
probe('C32-F-zip-null-operand', 'collect([1, 2])->zip(null)', fn () => $fRows(collect([1, 2])->zip(null)));
probe('C32-F-zip-assoc-receiver-longer-operand', "collect(['a' => 1, 'b' => 2])->zip(['x' => 'p', 'y' => 'q', 'z' => 'r'])", fn () => $fRows(collect(['a' => 1, 'b' => 2])->zip(['x' => 'p', 'y' => 'q', 'z' => 'r'])));
probe('C32-F-zip-operand-shorter', 'collect([1, 2, 3])->zip([4, 5])', fn () => $fRows(collect([1, 2, 3])->zip([4, 5])));
probe('C32-F-zip-assoc-operand', "collect([1, 2])->zip(['a' => 'x', 'b' => 'y'])", fn () => $fRows(collect([1, 2])->zip(['a' => 'x', 'b' => 'y'])));

// *Using: PHP's comparator contract is an int (0 = equal)
probe('C32-F-diffUsing-spaceship-comparator', 'collect([1, 2, 3])->diffUsing([2], fn ($a, $b) => $a <=> $b)', fn () => collect([1, 2, 3])->diffUsing([2], fn ($a, $b) => $a <=> $b)->all());
probe('C32-F-intersectUsing-spaceship-comparator', 'collect([1, 2, 3])->intersectUsing([2, 3], fn ($a, $b) => $a <=> $b)', fn () => collect([1, 2, 3])->intersectUsing([2, 3], fn ($a, $b) => $a <=> $b)->all());
probe('C32-F-diffUsing-list-keeps-keys', "collect(['a', 'b', 'c'])->diffUsing(['a'], 'strcasecmp')", fn () => collect(['a', 'b', 'c'])->diffUsing(['a'], 'strcasecmp')->all());
// the comparator's answer is cast to an int, so a fraction is dropped and NAN or an infinity becomes 0
probe('C32-F-using-fractional-comparator', "collect([1, 2, 3])->diffUsing([2], fn () => \$answer) and ->intersectUsing([2], fn () => \$answer) for 0.5, -0.99 and 1.5", fn () => array_map(fn (float $answer) => [
    'diffUsing' => collect([1, 2, 3])->diffUsing([2], fn () => $answer)->all(),
    'intersectUsing' => collect([1, 2, 3])->intersectUsing([2], fn () => $answer)->all(),
], ['0.5' => 0.5, '-0.99' => -0.99, '1.5' => 1.5]));
probe('C32-F-using-non-finite-comparator', "collect([1, 2, 3])->diffUsing([2], fn () => \$answer) for NAN, INF and -INF", fn () => array_map(fn (float $answer) => @collect([1, 2, 3])->diffUsing([2], fn () => $answer)->all(), ['NAN' => NAN, 'INF' => INF, '-INF' => -INF]));
probe('C32-F-using-comparator-past-int-range', "diffUsing([2], \$comparator) and intersectUsing([2], \$comparator) over collect([1, 2, 3]) for a comparator answering (\$a <=> \$b) * 2**64, which the int cast wraps to 0, and diffUsing([2]) for one answering (\$a <=> \$b) * 1e19", fn () => [
    'diffUsing 2**64' => @collect([1, 2, 3])->diffUsing([2], fn ($a, $b) => ($a <=> $b) * 18446744073709551616.0)->values()->all(),
    'intersectUsing 2**64' => @collect([1, 2, 3])->intersectUsing([2], fn ($a, $b) => ($a <=> $b) * 18446744073709551616.0)->values()->all(),
    'diffUsing 1e19' => @collect([1, 2, 3])->diffUsing([2], fn ($a, $b) => ($a <=> $b) * 1e19)->values()->all(),
]);
probe('C32-F-diffAssocUsing-mixed-keys-order', "collect(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red'])->diffAssocUsing(collect(['A' => 'green', 'yellow', 'red']), 'strcasecmp')", fn () => $fViews(collect(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red'])->diffAssocUsing(collect(['A' => 'green', 'yellow', 'red']), 'strcasecmp')));

// diffKeys: only the operand's own keys count, so a list operand holds no 'length' key
probe('C32-F-diffKeys-length-key', "collect(['length' => 5, 'b' => 2])->diffKeys(['x'])", fn () => $fViews(collect(['length' => 5, 'b' => 2])->diffKeys(['x'])));
probe('C32-F-diffKeys-signature-examples', "collect(['a' => 1, 'b' => 2, 'c' => 3])->diffKeys(['b' => 2]) / collect([1, 3, 5, 7, 8])->diffKeys([1, 3, 5]) / collect([1, 3, 5])->diffKeys([1, 3, 5, 7, 8])", fn () => [
    'assoc' => collect(['a' => 1, 'b' => 2, 'c' => 3])->diffKeys(['b' => 2])->all(),
    'list' => collect([1, 3, 5, 7, 8])->diffKeys([1, 3, 5])->all(),
    'list-emptied' => collect([1, 3, 5])->diffKeys([1, 3, 5, 7, 8])->all(),
]);

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
probe('C32-F-plain-object-all-member-is-data-by-key', "collect(['a' => 1, 'b' => 2])->diffAssoc((object) ['all' => fn () => ['b' => 2]]) / ->diffAssocUsing(..., 'strcasecmp') / ->diffKeysUsing(..., 'strcasecmp') / ->intersectAssoc(...) / ->intersectAssocUsing(..., 'strcasecmp'), and collect(['a' => 1])->merge(...) keys", fn () => [
    'diffAssoc' => collect(['a' => 1, 'b' => 2])->diffAssoc((object) ['all' => fn () => ['b' => 2]])->all(),
    'diffAssocUsing' => collect(['a' => 1, 'b' => 2])->diffAssocUsing((object) ['all' => fn () => ['b' => 2]], 'strcasecmp')->all(),
    'diffKeysUsing' => collect(['a' => 1, 'b' => 2])->diffKeysUsing((object) ['all' => fn () => ['b' => 2]], 'strcasecmp')->all(),
    'intersectAssoc' => collect(['a' => 1, 'b' => 2])->intersectAssoc((object) ['all' => fn () => ['b' => 2]])->all(),
    'intersectAssocUsing' => collect(['a' => 1, 'b' => 2])->intersectAssocUsing((object) ['all' => fn () => ['b' => 2]], 'strcasecmp')->all(),
    'mergeKeys' => collect(['a' => 1])->merge((object) ['all' => fn () => ['b' => 2]])->keys()->all(),
]);
probe('C32-F-plain-object-all-member-is-data-by-value', "collect(['a', 'b'])->diff((object) ['all' => \$invokable]) / ->intersect(...), \$invokable answering ['b'] when called and 'zzz' as a string, since array_diff cannot cast a Closure; ->intersectUsing((object) ['all' => fn () => ['b']], fn (\$x, \$y) => \$x === \$y ? 0 : 1); collect(['a' => 1])->replaceRecursive((object) ['all' => fn () => ['b' => 2]]) keys", function () {
    $invokable = new class { public function __invoke() { return ['b']; } public function __toString(): string { return 'zzz'; } };

    return [
        'diff' => collect(['a', 'b'])->diff((object) ['all' => $invokable])->all(),
        'intersect' => collect(['a', 'b'])->intersect((object) ['all' => $invokable])->all(),
        'intersectUsing' => collect(['a', 'b'])->intersectUsing((object) ['all' => fn () => ['b']], fn ($x, $y) => $x === $y ? 0 : 1)->all(),
        'replaceRecursiveKeys' => collect(['a' => 1])->replaceRecursive((object) ['all' => fn () => ['b' => 2]])->keys()->all(),
    ];
});
probe('C32-F-combine-int-key-order', "(new Collection([3, 1, 2]))->combine(['c', 'a', 'b'])->keys()", fn () => (new Collection([3, 1, 2]))->combine(['c', 'a', 'b'])->keys()->all());

// out-of-order integer keys, which only a Map holds in JS: the receiver's order, and an operand's
$fKeysValues = fn (Collection $c) => ['keys' => $c->keys()->all(), 'values' => $c->values()->all()];
probe('C32-F-receiver-out-of-order', "each set operation on collect([2 => 'c', 0 => 'a', 1 => 'b']): the kept keys and values, or the rows built", fn () => [
    'diff' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->diff(['a'])),
    'diffUsing' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->diffUsing(['A'], 'strcasecmp')),
    'diffAssoc' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->diffAssoc([0 => 'a'])),
    'diffKeys' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->diffKeys([0 => 'x'])),
    'diffKeysUsing' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->diffKeysUsing([0 => 'x'], 'strcasecmp')),
    'intersect' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->intersect(['c', 'b'])),
    'intersectUsing' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->intersectUsing(['C', 'B'], 'strcasecmp')),
    'intersectAssoc' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->intersectAssoc([2 => 'c', 1 => 'b'])),
    'intersectAssocUsing' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->intersectAssocUsing([2 => 'c', 1 => 'b'], 'strcasecmp')),
    'intersectByKeys' => $fKeysValues(collect([2 => 'c', 0 => 'a', 1 => 'b'])->intersectByKeys([2 => 'x', 1 => 'y'])),
    'crossJoin' => collect([2 => 'c', 0 => 'a', 1 => 'b'])->crossJoin(['x'])->all(),
    'zip' => $fRows(collect([2 => 'c', 0 => 'a', 1 => 'b'])->zip(['x', 'y', 'z'])),
    'multiply' => collect([2 => 'c', 0 => 'a', 1 => 'b'])->multiply(2)->all(),
]);
probe('C32-F-operand-out-of-order', "collect([1])->crossJoin([2 => 'c', 0 => 'a']) / collect([1, 2])->zip([2 => 'c', 0 => 'a']) / collect(['x', 'y'])->combine([2 => 'c', 0 => 'a'])", fn () => [
    'crossJoin' => collect([1])->crossJoin([2 => 'c', 0 => 'a'])->all(),
    'zip' => $fRows(collect([1, 2])->zip([2 => 'c', 0 => 'a'])),
    'combine' => $fKeysValues(collect(['x', 'y'])->combine([2 => 'c', 0 => 'a'])),
]);

probe('C32-F-concat-map-order', "collect(['x'])->concat(\$m)->all() and collect(['x'])->concat(collect(\$m))->all(), \$m = [2 => 'c', 0 => 'a', 1 => 'b']", fn () => [
    collect(['x'])->concat([2 => 'c', 0 => 'a', 1 => 'b'])->all(),
    collect(['x'])->concat(collect([2 => 'c', 0 => 'a', 1 => 'b']))->all(),
]);

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
probe('C32-G-sortKeysUsing-fractional-answers', "(new Collection(['c' => 1, 'a' => 2, 'b' => 3]))->sortKeysUsing(fn (\$x, \$y) => \$x < \$y ? -\$step : (\$x > \$y ? \$step : 0))->keys()->all() for \$step = 0.5 and 1.5", fn () => array_map(
    fn (float $step) => (new Collection(['c' => 1, 'a' => 2, 'b' => 3]))->sortKeysUsing(fn ($x, $y) => $x < $y ? -$step : ($x > $y ? $step : 0))->keys()->all(),
    [0.5, 1.5],
));
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

// Ties and groups over integer keys out of order, which only a Map-built collection holds in JS.
$gTies = [2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']];
probe('C32-G-sort-comparator-out-of-order', "(new Collection([2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']]))->sort(fn (\$a, \$b) => \$a['n'] <=> \$b['n'])",
    fn () => $pairs((new Collection($gTies))->sort(fn ($a, $b) => $a['n'] <=> $b['n'])));
probe('C32-G-sort-comparator-int-cast', "(new Collection([3, 1, 2]))->sort(\$comparator)->values()->all() for a comparator answering a fraction below 1, an infinity and NAN, which uasort() casts to 0", fn () => array_map(fn (Closure $comparator) => @(new Collection([3, 1, 2]))->sort($comparator)->values()->all(), [
    'fraction' => fn ($a, $b) => ($a - $b) / 10,
    'infinity' => fn ($a, $b) => ($a <=> $b) * INF,
    'NAN' => fn () => NAN,
]));
// a bool comparator is deprecated but still sorts: true is 1, and false asks again with the operands swapped, where
// true is -1 (the deprecation notices are silenced)
probe('C32-G-sort-bool-comparator', "usort, uasort and uksort, then Collection::sort() and sortKeysUsing(), with a comparator answering a bool", function () {
    $usort = [3, 1, 2];
    @usort($usort, fn ($a, $b) => $a > $b);
    $usortDescending = [3, 1, 2];
    @usort($usortDescending, fn ($a, $b) => $a < $b);
    $usortLonger = [5, 3, 9, 1, 7, 2, 8];
    @usort($usortLonger, fn ($a, $b) => $a > $b);
    $usortFalse = [3, 1, 2];
    @usort($usortFalse, fn () => false);
    $uasort = [3, 1, 2];
    @uasort($uasort, fn ($a, $b) => $a > $b);
    $uksort = ['c' => 1, 'a' => 2, 'b' => 3];
    @uksort($uksort, fn ($a, $b) => $a > $b);
    $sorted = @(new Collection([3, 1, 2]))->sort(fn ($a, $b) => $a > $b);
    $sortedKeyed = @(new Collection(['x' => 3, 'y' => 1, 'z' => 2]))->sort(fn ($a, $b) => $a > $b);
    $sortedKeys = @(new Collection(['c' => 1, 'a' => 2, 'b' => 3]))->sortKeysUsing(fn ($a, $b) => $a > $b);

    return [
        'usort' => $usort,
        'usort descending' => $usortDescending,
        'usort longer' => $usortLonger,
        'usort always false' => $usortFalse,
        'uasort' => ['keys' => array_keys($uasort), 'values' => array_values($uasort)],
        'uksort' => array_keys($uksort),
        'sort' => ['keys' => $sorted->keys()->all(), 'values' => $sorted->values()->all()],
        'sort keyed' => ['keys' => $sortedKeyed->keys()->all(), 'values' => $sortedKeyed->values()->all()],
        'sortKeysUsing' => $sortedKeys->keys()->all(),
    ];
});
probe('C32-G-sortBy-bool-comparator', "sortBy() with a comparator answering a bool, alone and ahead of 'y', sortBy() with one answering 0.5 ahead of 'y', and Arr::sort() with a bool comparator", fn () => [
    'alone' => @(new Collection([['x' => 3], ['x' => 1], ['x' => 2]]))->sortBy([fn ($p, $q) => $p['x'] > $q['x']])->values()->all(),
    'ahead of y' => @(new Collection([['x' => 1, 'y' => 2], ['x' => 1, 'y' => 1]]))->sortBy([fn ($p, $q) => $p['x'] > $q['x'], 'y'])->values()->all(),
    'zero ahead of y' => (new Collection([['x' => 1, 'y' => 2], ['x' => 1, 'y' => 1]]))->sortBy([fn ($p, $q) => 0, 'y'])->values()->all(),
    'fraction ahead of y' => @(new Collection([['x' => 1, 'y' => 2], ['x' => 1, 'y' => 1]]))->sortBy([fn ($p, $q) => 0.5, 'y'])->values()->all(),
    'Arr::sort list' => @Arr::sort([3, 1, 2], [fn ($a, $b) => $a > $b]),
    'Arr::sort keyed' => @Arr::sort(['c' => 3, 'a' => 1, 'b' => 2], [fn ($a, $b) => $a > $b]),
]);
probe('C32-G-sortByDesc-bool-comparator', "sortByDesc() and Arr::sortDesc() with a comparator answering a bool, which the descending direction never reverses", fn () => [
    'sortByDesc' => @(new Collection([3, 1, 2]))->sortByDesc([fn ($a, $b) => $a > $b])->values()->all(),
    'Arr::sortDesc list' => @Arr::sortDesc([3, 1, 2], [fn ($a, $b) => $a > $b]),
    'Arr::sortDesc keyed' => @Arr::sortDesc(['c' => 3, 'a' => 1, 'b' => 2], [fn ($a, $b) => $a > $b]),
]);
// PHP 8 casts a float past its int range to an int by keeping the low 64 bits, and NAN or an infinity to 0
// each int is written as its digits, which JSON cannot carry exactly as a number past 2^53
probe('C32-G-int-cast-past-int-range', "(string) (int) \$float for 1e19, -1e19, 2**63, -2**63, 2**64, 3 * 2**63, 1.5e19, 1e20, 1e30, -1e30, 2**63 + 2048, 2**64 - 2048, NAN, INF, -INF, -0.0, 2.5 and -2.5", fn () => array_map(fn (float $value) => (string) @((int) $value), [
    '1e19' => 1e19,
    '-1e19' => -1e19,
    '2**63' => 9223372036854775808.0,
    '-2**63' => -9223372036854775808.0,
    '2**64' => 18446744073709551616.0,
    '3 * 2**63' => 27670116110564327424.0,
    '1.5e19' => 1.5e19,
    '1e20' => 1e20,
    '1e30' => 1e30,
    '-1e30' => -1e30,
    '2**63 + 2048' => 9223372036854777856.0,
    '2**64 - 2048' => 18446744073709549568.0,
    'NAN' => NAN,
    'INF' => INF,
    '-INF' => -INF,
    '-0.0' => -0.0,
    '2.5' => 2.5,
    '-2.5' => -2.5,
]));
probe('C32-G-sort-comparator-past-int-range', "usort([3, 1, 2]) and (new Collection([3, 1, 2]))->sort() with a comparator answering (\$a <=> \$b) * 1e19, which the int cast wraps to the opposite sign, and usort() with one answering (\$a <=> \$b) * 2**64, which it wraps to 0", function () {
    $wrapped = [3, 1, 2];
    @usort($wrapped, fn ($a, $b) => ($a <=> $b) * 1e19);
    $zero = [3, 1, 2];
    @usort($zero, fn ($a, $b) => ($a <=> $b) * 18446744073709551616.0);

    return [
        'usort 1e19' => $wrapped,
        'usort 2**64' => $zero,
        'sort 1e19' => @(new Collection([3, 1, 2]))->sort(fn ($a, $b) => ($a <=> $b) * 1e19)->values()->all(),
    ];
});
probe('C32-G-nth-and-split-by-a-count-cast-to-0', "(new Collection([1, 2, 3]))->nth(2**64) and ->split(2**64), whose % casts the count to the int 0: the class and message thrown", fn () => [
    'nth' => c32c_outcome(fn () => @(new Collection([1, 2, 3]))->nth(18446744073709551616.0)->all()),
    'split' => c32c_outcome(fn () => @(new Collection([1, 2, 3]))->split(18446744073709551616.0)->all()),
]);
probe('C32-G-sortBy-out-of-order-ties', "sortBy('n'), sortByDesc('n') and sortBy(['n']) over [2 => ['n' => 1, 'id' => 'p'], 0 => ['n' => 1, 'id' => 'q'], 1 => ['n' => 0, 'id' => 'r']]: the ids in order", fn () => [
    'sortBy' => (new Collection($gTies))->sortBy('n')->pluck('id')->all(),
    'sortByDesc' => (new Collection($gTies))->sortByDesc('n')->pluck('id')->all(),
    'sortBy descriptors' => (new Collection($gTies))->sortBy(['n'])->pluck('id')->all(),
]);
probe('C32-G-sortByMany-desc-direction-forms', "testSortByMany's chain over [['item' => '1'], ['item' => '10'], ['item' => 5], ['item' => 20]]: sortBy(['item']), then sortBy([['item', 'desc']]), sortBy([['item', false]]) and sortBy([['item', SortDirection::Descending]]), each plucked", function () {
    $data = new Collection([['item' => '1'], ['item' => '10'], ['item' => 5], ['item' => 20]]);
    $out = [];

    foreach (['asc' => ['item'], 'desc' => [['item', 'desc']], 'false' => [['item', false]], 'Descending' => [['item', SortDirection::Descending]]] as $label => $comparisons) {
        $data = $data->sortBy($comparisons);
        $out[$label] = $data->pluck('item')->all();
    }

    return $out;
});
probe('C32-G-sortByMany-two-keys', "sortBy(['first', 'second']) and sortByDesc(['first', 'second']) over four rows, and sortBy(['primary', 'secondary']) over rows tying on the first key, then on both", function () {
    $four = [['first' => 'b', 'second' => 2], ['first' => 'a', 'second' => 3], ['first' => 'b', 'second' => 1], ['first' => 'a', 'second' => 1]];

    return [
        'asc' => (new Collection($four))->sortBy(['first', 'second'])->values()->all(),
        'desc' => (new Collection($four))->sortByDesc(['first', 'second'])->values()->all(),
        'first-key-ties' => (new Collection([['primary' => 'a', 'secondary' => 3], ['primary' => 'a', 'secondary' => 1], ['primary' => 'b', 'secondary' => 2]]))->sortBy(['primary', 'secondary'])->values()->all(),
        'both-keys-tie' => (new Collection([['primary' => 'a', 'secondary' => 1], ['primary' => 'a', 'secondary' => 1], ['primary' => 'b', 'secondary' => 2]]))->sortBy(['primary', 'secondary'])->values()->all(),
    ];
});
probe('C32-G-sortBy-descriptor-direction-forms', "sortBy([[\$key, \$direction]]) for SortDirection::Descending, 'Descending', false, SortDirection::Ascending and mixed directions, and sortByDesc([\$comparator]), which leaves a comparator ascending", function () {
    $people = [['name' => 'alice', 'age' => 30], ['name' => 'bob', 'age' => 25], ['name' => 'carol', 'age' => 35]];

    return [
        'Descending case' => (new Collection($people))->sortBy([['name', SortDirection::Descending]])->pluck('name')->all(),
        'Descending string' => (new Collection([['val' => 10], ['val' => 30], ['val' => 20]]))->sortBy([['val', 'Descending']])->pluck('val')->all(),
        'false' => (new Collection([['val' => 1], ['val' => 3], ['val' => 2]]))->sortBy([['val', false]])->pluck('val')->all(),
        'Ascending case' => (new Collection([['name' => 'carol'], ['name' => 'alice'], ['name' => 'bob']]))->sortBy([['name', SortDirection::Ascending]])->pluck('name')->all(),
        'mixed' => (new Collection([['group' => 'a', 'rank' => 2], ['group' => 'a', 'rank' => 1], ['group' => 'b', 'rank' => 3], ['group' => 'b', 'rank' => 4]]))->sortBy([['group', SortDirection::Ascending], ['rank', SortDirection::Descending]])->values()->all(),
        'sortByDesc comparator' => (new Collection([['age' => 2], ['age' => 10]]))->sortByDesc([fn ($a, $b) => $a['age'] <=> $b['age']])->pluck('age')->all(),
    ];
});
probe('C32-G-sort-desc-mixed-keys', "(new Collection([0 => 1, 'x' => 2])) sorted descending by sort(fn (\$a, \$b) => \$b <=> \$a), sortByDesc(fn (\$v) => \$v) and sortDesc()", fn () => [
    'sort' => $pairs((new Collection([0 => 1, 'x' => 2]))->sort(fn ($a, $b) => $b <=> $a)),
    'sortByDesc' => $pairs((new Collection([0 => 1, 'x' => 2]))->sortByDesc(fn ($v) => $v)),
    'sortDesc' => $pairs((new Collection([0 => 1, 'x' => 2]))->sortDesc()),
]);
probe('C32-G-split-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->split(2) and (new Collection([2 => 'c', 'x' => 'a', 1 => 'b']))->split(2)", fn () => [
    'out-of-order' => $pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->split(2)),
    'mixed' => $pairs((new Collection([2 => 'c', 'x' => 'a', 1 => 'b']))->split(2)),
]);
probe('C32-G-splitIn-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->splitIn(2)",
    fn () => $pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->splitIn(2)));

// Counts: a float reaches array_chunk(), array_slice(), range() or %, each of which casts it or throws.
probe('C32-G-chunk-counts', "(new Collection([1, 2, 3, 4, 5]))->chunk(\$size) for 1.5, 0.5, NAN, INF, -INF and 1e19, and (new Collection([]))->chunk(\$size) for NAN, INF and 1e19: the chunks, or the class and message thrown", fn () => [
    ...array_map(fn (float $size) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->chunk($size))), ['1.5' => 1.5, '0.5' => 0.5, 'NAN' => NAN, 'INF' => INF, '-INF' => -INF, '1e19' => 1e19]),
    ...array_map(fn (float $size) => c32c_outcome(fn () => $pairs(@(new Collection([]))->chunk($size))), ['empty NAN' => NAN, 'empty INF' => INF, 'empty 1e19' => 1e19]),
]);
probe('C32-G-nth-counts', "(new Collection([1, 2, 3, 4, 5]))->nth(\$step) for 1.5, 2.5, NAN, INF and 1e19, ->nth(1, \$offset) for 1.5, NAN and 1e19, and (new Collection([]))->nth(NAN)", fn () => [
    'step' => array_map(fn (float $step) => c32c_outcome(fn () => @(new Collection([1, 2, 3, 4, 5]))->nth($step)->all()), ['1.5' => 1.5, '2.5' => 2.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19]),
    'offset' => array_map(fn (float $offset) => c32c_outcome(fn () => @(new Collection([1, 2, 3, 4, 5]))->nth(1, $offset)->all()), ['1.5' => 1.5, 'NAN' => NAN, '1e19' => 1e19]),
    'empty NAN' => c32c_outcome(fn () => @(new Collection([]))->nth(NAN)->all()),
]);
probe('C32-G-nth-out-of-order-offset', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->nth(1, \$offset) for NAN and 1e19: the class and message thrown", fn () => array_map(
    fn (float $offset) => c32c_outcome(fn () => @(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->nth(1, $offset)->all()),
    ['NAN' => NAN, '1e19' => 1e19],
));
probe('C32-G-take-counts', "(new Collection([1, 2, 3, 4, 5, 6]))->take(\$limit) for 1.5, -1.5, NAN, INF, -INF, 1e19 and -1e19", fn () => array_map(
    fn (float $limit) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5, 6]))->take($limit))),
    ['1.5' => 1.5, '-1.5' => -1.5, 'NAN' => NAN, 'INF' => INF, '-INF' => -INF, '1e19' => 1e19, '-1e19' => -1e19],
));
probe('C32-G-slice-counts', "(new Collection([1, 2, 3, 4, 5]))->slice(\$offset) for 1.5, -1.5, NAN, INF and 1e19, and ->slice(0, \$length) for 1.5, NAN, INF and 1e19", fn () => [
    'offset' => array_map(fn (float $offset) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->slice($offset))), ['1.5' => 1.5, '-1.5' => -1.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19]),
    'length' => array_map(fn (float $length) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->slice(0, $length))), ['1.5' => 1.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19]),
]);
probe('C32-G-sliding-counts', "(new Collection([1, 2, 3, 4, 5]))->sliding(\$size) for 1.5, 2.5, NAN, INF and 1e19, ->sliding(2, \$step) for 1.5, NAN, INF and 1e19, and (new Collection([]))->sliding(2, INF)", fn () => [
    'size' => array_map(fn (float $size) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->sliding($size))), ['1.5' => 1.5, '2.5' => 2.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19]),
    'step' => array_map(fn (float $step) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->sliding(2, $step))), ['1.5' => 1.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19]),
    'empty step INF' => c32c_outcome(fn () => $pairs(@(new Collection([]))->sliding(2, INF))),
]);
// split(1e19) is left out: its loop counts to the number of groups, so PHP never returns.
probe('C32-G-split-counts', "(new Collection([1, 2, 3, 4, 5]))->split(\$groups) for 1.5, 2.5, 5.5 and NAN, and (new Collection([]))->split(\$groups) for NAN and INF", fn () => [
    'groups' => array_map(fn (float $groups) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->split($groups))), ['1.5' => 1.5, '2.5' => 2.5, '5.5' => 5.5, 'NAN' => NAN]),
    'empty' => array_map(fn (float $groups) => c32c_outcome(fn () => $pairs(@(new Collection([]))->split($groups))), ['NAN' => NAN, 'INF' => INF]),
]);
probe('C32-G-splitIn-counts', "(new Collection([1, 2, 3, 4, 5]))->splitIn(\$groups) for 1.5, NAN, INF and 1e19", fn () => array_map(
    fn (float $groups) => c32c_outcome(fn () => $pairs(@(new Collection([1, 2, 3, 4, 5]))->splitIn($groups))),
    ['1.5' => 1.5, 'NAN' => NAN, 'INF' => INF, '1e19' => 1e19],
));
probe('C32-G-shuffle-list', "(new Collection(\$items))->shuffle() over ['a' => 1, 'b' => 2, 'c' => 3], [2 => 'c', 0 => 'a', 1 => 'b'] and ['x' => 1, 5 => 2]: array_is_list, the count and the sorted values", fn () => array_map(function (array $items) {
    $shuffled = (new Collection($items))->shuffle()->all();
    $values = array_values($shuffled);
    sort($values);

    return [array_is_list($shuffled), count($shuffled), $values];
}, ['keyed' => ['a' => 1, 'b' => 2, 'c' => 3], 'out-of-order' => [2 => 'c', 0 => 'a', 1 => 'b'], 'mixed' => ['x' => 1, 5 => 2]]));

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
probe('C32-H-sum-leading-numeric-string', "@(new Collection([1, '2abc']))->sum()", fn () => @(new Collection([1, '2abc']))->sum());
probe('C32-H-sum-array-items', "(new Collection([[1], [2]]))->sum()", fn () => (new Collection([[1], [2]]))->sum());
probe('C32-H-sum-object-item', "(new Collection([new stdClass]))->sum()", fn () => (new Collection([new stdClass]))->sum());
probe('C32-H-sum-float-total-non-numeric-string', "(new Collection([1.5, 'a']))->sum()", fn () => (new Collection([1.5, 'a']))->sum());
probe('C32-H-sum-closure-item', "(new Collection([1, fn () => 1]))->sum()", fn () => (new Collection([1, fn () => 1]))->sum());

// avg
probe('C32-H-avg-non-numeric-string', "(new Collection([10, 'house', 20]))->avg()", fn () => (new Collection([10, 'house', 20]))->avg());
probe('C32-H-avg-callback-arity', "(new Collection(['a' => 1]))->avg(fn (...\$args) => count(\$args))", fn () => (new Collection(['a' => 1]))->avg(fn (...$args) => count($args)));

// min / max
probe('C32-H-min-numeric-strings', "(new Collection(['10', '9', '8']))->min()", fn () => (new Collection(['10', '9', '8']))->min());
probe('C32-H-max-numeric-strings', "(new Collection(['10', '9', '8']))->max()", fn () => (new Collection(['10', '9', '8']))->max());
probe('C32-H-min-max-callback-arity', "[min(fn (...\$a) => count(\$a)), max(...)] on ['a' => 1]", fn () => [(new Collection(['a' => 1]))->min(fn (...$a) => count($a)), (new Collection(['a' => 1]))->max(fn (...$a) => count($a))]);
probe('C32-H-min-max-strings', "[min, max] of ['b', 'a', 'c']", fn () => [(new Collection(['b', 'a', 'c']))->min(), (new Collection(['b', 'a', 'c']))->max()]);
probe('C32-H-max-dot-path', "(new Collection([['a' => ['b' => 3]], ['a' => ['b' => 7]]]))->max('a.b')", fn () => (new Collection([['a' => ['b' => 3]], ['a' => ['b' => 7]]]))->max('a.b'));
probe('C32-H-min-max-out-of-order-tie', "[min, max] of [2 => '1', 0 => 1]", fn () => [(new Collection([2 => '1', 0 => 1]))->min(), (new Collection([2 => '1', 0 => 1]))->max()]);
probe('C32-H-min-max-uncomparable-arrays', "[max, min] of [[1], ['a' => 1]] and of [['a' => 1], [1]], two arrays each of which PHP's <=> calls larger", fn () => [
    'max' => [(new Collection([[1], ['a' => 1]]))->max(), (new Collection([['a' => 1], [1]]))->max()],
    'min' => [(new Collection([[1], ['a' => 1]]))->min(), (new Collection([['a' => 1], [1]]))->min()],
]);
probe('C32-H-max-null-callback-answers', "[max(fn () => null), max(fn (\$v) => \$v === 1 ? null : 0)] on [1, 2]", fn () => [(new Collection([1, 2]))->max(fn () => null), (new Collection([1, 2]))->max(fn ($v) => $v === 1 ? null : 0)]);
probe('C32-H-min-max-null-items', "[[min, max] of [null, 3, 1], [min, max] of [null]]", fn () => [[(new Collection([null, 3, 1]))->min(), (new Collection([null, 3, 1]))->max()], [(new Collection([null]))->min(), (new Collection([null]))->max()]]);

// median
probe('C32-H-median-numeric-strings', "[median(['10', '9', '8']), median(['10', '9'])]", fn () => [(new Collection(['10', '9', '8']))->median(), (new Collection(['10', '9']))->median()]);
probe('C32-H-median-rows-without-key', "(new Collection([['value' => 1, 'age' => 20], ['value' => 3, 'age' => 30], ['value' => 2, 'age' => 25]]))->median()", fn () => (new Collection([['value' => 1, 'age' => 20], ['value' => 3, 'age' => 30], ['value' => 2, 'age' => 25]]))->median());
probe('C32-H-median-array-key', "(new Collection([['a' => ['b' => 1]], ['a' => ['b' => 9]], ['a' => ['b' => 5]]]))->median(['a', 'b'])", fn () => (new Collection([['a' => ['b' => 1]], ['a' => ['b' => 9]], ['a' => ['b' => 5]]]))->median(['a', 'b']));
probe('C32-H-median-non-numeric-middle-values', "(new Collection(['b', 'a']))->median()", fn () => (new Collection(['b', 'a']))->median());
probe('C32-H-median-out-of-order-tie', "(new Collection([2 => '5', 0 => 5, 1 => 1]))->median()", fn () => (new Collection([2 => '5', 0 => 5, 1 => 1]))->median());

// percentage: PHP's round() compares the value with the double nearest its midpoint; toFixed() and Math.round() do not.
probe('C32-H-percentage-fp-below-half', "(new Collection(range(1, 2000)))->percentage(fn (\$v) => \$v <= 9, 1)", fn () => (new Collection(range(1, 2000)))->percentage(fn ($v) => $v <= 9, 1));
probe('C32-H-percentage-precision-zero-and-negative', "[percentage(..., 0), percentage(..., -1)] on [1, 1, 2]", fn () => [(new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, 0), (new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, -1)]);
probe('C32-H-percentage-fp-just-below-half-rounds-up', "(new Collection(range(1, 2000)))->percentage(fn (\$v) => \$v <= 3, 1)", fn () => (new Collection(range(1, 2000)))->percentage(fn ($v) => $v <= 3, 1));
probe('C32-H-percentage-scaled-just-short-of-whole', "(new Collection(range(1, 35)))->percentage(fn (\$v) => \$v <= 3, 15)", fn () => (new Collection(range(1, 35)))->percentage(fn ($v) => $v <= 3, 15));
probe('C32-H-percentage-beyond-double-digits', "(new Collection(range(1, 9)))->percentage(fn (\$v) => \$v === 1, 15)", fn () => (new Collection(range(1, 9)))->percentage(fn ($v) => $v === 1, 15));
// array_map is an internal caller, so a float precision coerces to an int as non-strict code does (with a deprecation)
probe('C32-H-percentage-fractional-precision', "array_map([\$c, 'percentage'], [\$cb], [\$precision]) on [1, 1, 2] with \$cb = fn (\$v) => \$v === 1, for 1.5, -1.5, 2.9, -0.0 and 0.5", fn () => array_map(fn (float $precision) => @array_map([new Collection([1, 1, 2]), 'percentage'], [fn ($v) => $v === 1], [$precision])[0], ['1.5' => 1.5, '-1.5' => -1.5, '2.9' => 2.9, '-0.0' => -0.0, '0.5' => 0.5]));
probe('C32-H-percentage-precision-bounds', "array_map([\$c, 'percentage'], [\$cb], [\$precision]) on [1, 1, 2] for -2**63 and the largest float below 2**63", fn () => array_map(fn (float $precision) => array_map([new Collection([1, 1, 2]), 'percentage'], [fn ($v) => $v === 1], [$precision])[0], ['-2**63' => -9223372036854775808.0, 'below 2**63' => 9223372036854774784.0]));
probe('C32-H-percentage-non-int-precision', "array_map([\$c, 'percentage'], [\$cb], [\$precision]) on [1, 1, 2] for NAN, INF, -INF, 1e19, -1e19 and 2**63, and on [] for NAN: the class and message thrown", fn () => [
    'items' => array_map(fn (float $precision) => c32c_outcome(fn () => array_map([new Collection([1, 1, 2]), 'percentage'], [fn ($v) => $v === 1], [$precision])[0]), ['NAN' => NAN, 'INF' => INF, '-INF' => -INF, '1e19' => 1e19, '-1e19' => -1e19, '2**63' => 9223372036854775808.0]),
    'empty' => c32c_outcome(fn () => array_map([new Collection([]), 'percentage'], [fn ($v) => $v === 1], [NAN])[0]),
]);
probe('C32-H-percentage-extreme-precision', "[percentage(=== 1, -400), percentage(=== 1, 400), percentage(=== 5, 400)] on [1, 1, 2]", fn () => [(new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, -400), (new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 1, 400), (new Collection([1, 1, 2]))->percentage(fn ($v) => $v === 5, 400)]);

// implode
probe('C32-H-implode-class-instances-by-key', "(new Collection([new C32HUser('foo'), new C32HUser('bar')]))->implode('email', ',')", fn () => (new Collection([new C32HUser('foo'), new C32HUser('bar')]))->implode('email', ','));
probe('C32-H-implode-tostring-objects-are-plucked', "(new Collection([new C32HToString('a'), new C32HToString('b')]))->implode(',')", fn () => (new Collection([new C32HToString('a'), new C32HToString('b')]))->implode(','));
probe('C32-H-implode-scalar-casts', "(new Collection([true, false, null, 1.0, 2.50, 0]))->implode(',')", fn () => (new Collection([true, false, null, 1.0, 2.50, 0]))->implode(','));
probe('C32-H-implode-missing-key', "(new Collection([['a' => 1], ['b' => 2]]))->implode('a', ',')", fn () => (new Collection([['a' => 1], ['b' => 2]]))->implode('a', ','));
probe('C32-H-implode-nested-collections-by-key', "(new Collection([new Collection(['a' => 'x']), new Collection(['a' => 'y'])]))->implode('a', ',')", fn () => (new Collection([new Collection(['a' => 'x']), new Collection(['a' => 'y'])]))->implode('a', ','));
probe('C32-H-implode-collection-rows-by-backing', "c32c_rows(list | keyed)->implode('k', ',')", fn () => array_map(fn (bool $keyed) => c32c_rows($keyed)->implode('k', ','), ['list' => false, 'keyed' => true]));
probe('C32-H-implode-float-casts', "(new Collection([0.1 + 0.2, 1.0, 1e25, -0.0]))->implode(',')", fn () => (new Collection([0.1 + 0.2, 1.0, 1e25, -0.0]))->implode(','));
probe('C32-H-implode-callback-casts', "(new Collection([1, 2]))->implode(fn (\$v) => \$v > 1, ',')", fn () => (new Collection([1, 2]))->implode(fn ($v) => $v > 1, ','));
probe('C32-H-implode-date-items-are-plucked', "(new Collection([new DateTime('@0'), new DateTime('@1')]))->implode(', ')", fn () => (new Collection([new DateTime('@0'), new DateTime('@1')]))->implode(', '));
probe('C32-H-implode-array-pieces', "@implode(',') of [1, [2, 3]] and ['a', ['b' => 1]], @implode(fn (\$v) => [\$v], ',') of [1, 2], and @implode('a', ',') of [['a' => [1]], ['a' => 2]]", fn () => [
    @(new Collection([1, [2, 3]]))->implode(','),
    @(new Collection(['a', ['b' => 1]]))->implode(','),
    @(new Collection([1, 2]))->implode(fn ($v) => [$v], ','),
    @(new Collection([['a' => [1]], ['a' => 2]]))->implode('a', ','),
]);
probe('C32-H-implode-object-pieces', "implode(',') of [1, new stdClass], [1, new DateTime('@0')], [1, fn () => 1], [1, new C32HToString('T')] and [1, new Collection([2])], then implode(fn () => new stdClass, ',') of [1, 2] and implode('a', ',') of [['a' => new stdClass]]", fn () => [
    c32c_outcome(fn () => (new Collection([1, new stdClass]))->implode(',')),
    c32c_outcome(fn () => (new Collection([1, new DateTime('@0')]))->implode(',')),
    c32c_outcome(fn () => (new Collection([1, fn () => 1]))->implode(',')),
    (new Collection([1, new C32HToString('T')]))->implode(','),
    (new Collection([1, new Collection([2])]))->implode(','),
    c32c_outcome(fn () => (new Collection([1, 2]))->implode(fn () => new stdClass, ',')),
    c32c_outcome(fn () => (new Collection([['a' => new stdClass]]))->implode('a', ',')),
]);

// join
probe('C32-H-join-null-last-item', "(new Collection(['a', null]))->join(', ', ' and ')", fn () => (new Collection(['a', null]))->join(', ', ' and '));
probe('C32-H-join-bool-items', "(new Collection([true, false, true]))->join(', ', ' and ')", fn () => (new Collection([true, false, true]))->join(', ', ' and '));
probe('C32-H-join-float-casts', "(new Collection([0.1 + 0.2, 1.0, 1e25, -0.0]))->join(', ', ' and ')", fn () => (new Collection([0.1 + 0.2, 1.0, 1e25, -0.0]))->join(', ', ' and '));
probe('C32-H-join-array-and-object-pieces', "@join(', ', ' and ') of [1, [2]] and [1, [2], 3], then join(', ', ' and ') of [1, new stdClass]", fn () => [
    @(new Collection([1, [2]]))->join(', ', ' and '),
    @(new Collection([1, [2], 3]))->join(', ', ' and '),
    c32c_outcome(fn () => (new Collection([1, new stdClass]))->join(', ', ' and ')),
]);
probe('C32-H-arr-join-pieces', "Arr::join() casting each piece as implode() does, the final item as . does, and handing a lone item back as it is", fn () => [
    'array piece' => @Arr::join([1, [2, 3]], ','),
    'scalars' => Arr::join([true, false, null, 1.5, 'x'], ','),
    'keyed array piece' => @Arr::join(['a' => 1, 'b' => [2]], ','),
    'object piece' => c32c_outcome(fn () => Arr::join([1, new stdClass], ',')),
    'closure piece' => c32c_outcome(fn () => Arr::join([1, fn () => 1], ',')),
    'toString piece' => Arr::join([1, new C32HToString('T')], ','),
    'final array piece' => @Arr::join([1, [2]], ', ', ' and '),
    'final object piece' => c32c_outcome(fn () => Arr::join([1, new stdClass], ', ', ' and ')),
    'final scalars' => Arr::join([true, null, false], ', ', ' and '),
    'lone array' => Arr::join([[1, 2]], ', ', ' and '),
    'lone bool' => Arr::join([true], ', ', ' and '),
]);
probe('C32-H-join-lone-object-item', "whether (new Collection([new stdClass]))->join(', ', ' and ') and Arr::join([new stdClass], ', ', ' and ') hand the object back as it is", function () {
    $object = new stdClass;

    return [
        'Collection::join' => (new Collection([$object]))->join(', ', ' and ') === $object,
        'Arr::join' => Arr::join([$object], ', ', ' and ') === $object,
    ];
});

// reduce without an initial value: $initial = null, every item reaches the callback
probe('C32-H-reduce-no-initial-trace', "carries/values/keys seen by (new Collection([10, 20, 30]))->reduce(fn (\$c, \$v, \$k) => \$v)", function () { $seen = []; (new Collection([10, 20, 30]))->reduce(function ($c, $v, $k) use (&$seen) { $seen[] = [$c, $v, $k]; return $v; }); return $seen; });
probe('C32-H-reduce-no-initial-single', "(new Collection([5]))->reduce(fn (\$c, \$v) => [\$c, \$v])", fn () => (new Collection([5]))->reduce(fn ($c, $v) => [$c, $v]));
probe('C32-H-reduce-family-out-of-order', "[reduce, reduceInto, reduceSpread] joining each key and value of [2 => 'c', 0 => 'a', 1 => 'b'] onto ''", fn () => [
    (new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->reduce(fn ($c, $v, $k) => $c.$k.$v, ''),
    (new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->reduceInto('', function (&$c, $v, $k) { $c .= $k.$v; }),
    (new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->reduceSpread(fn ($c, $v, $k) => [$c.$k.$v], ''),
]);

// reduceSpread
probe('C32-H-reduceSpread-throws-boolean', "(new Collection([1]))->reduceSpread(fn () => false, null)", fn () => (new Collection([1]))->reduceSpread(fn () => false, null));
probe('C32-H-reduceSpread-throws-integer', "(new Collection([1]))->reduceSpread(fn () => 5, null)", fn () => (new Collection([1]))->reduceSpread(fn () => 5, null));
probe('C32-H-reduceSpread-throws-double', "(new Collection([1]))->reduceSpread(fn () => 1.5, null)", fn () => (new Collection([1]))->reduceSpread(fn () => 1.5, null));
probe('C32-H-reduceSpread-throws-null', "(new Collection([1]))->reduceSpread(fn () => null, null)", fn () => (new Collection([1]))->reduceSpread(fn () => null, null));
probe('C32-H-reduceSpread-throws-string', "(new Collection([1]))->reduceSpread(fn () => 'x', null)", fn () => (new Collection([1]))->reduceSpread(fn () => 'x', null));
probe('C32-H-reduceSpread-throws-object', "(new Collection([1]))->reduceSpread(fn () => new stdClass, null)", fn () => (new Collection([1]))->reduceSpread(fn () => new stdClass, null));
probe('C32-H-reduceSpread-subclass-message', "(new C32ASub([1]))->reduceSpread(fn () => false, null)", fn () => (new C32ASub([1]))->reduceSpread(fn () => false, null));
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
probe('C32-H-when-unless-null-callback-untaken', "[\$c->when(false, null) === \$c, \$c->unless(true, null) === \$c]", function () { $c = new Collection([1]); return [$c->when(false, null) === $c, $c->unless(true, null) === $c]; });
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
