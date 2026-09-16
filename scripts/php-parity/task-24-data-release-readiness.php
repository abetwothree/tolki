<?php

/**
 * Ground truth for docs/superpowers/plans/<date>-tolki-data-release-readiness.md (Part A).
 *
 * Only behaviours NOT already captured elsewhere in docs/php-parity/ appear here; everything
 * reused is listed in the plan's reuse table and cited from its existing file.
 * Run: pnpm php:parity
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

/** A plain object with an own field, for the probes that write through a nested object. */
class D4Point
{
    public function __construct(public int $x) {}
}

// ==== typed accessors: the InvalidArgumentException wording (Arr::string / Arr::array are
// ==== already captured as "string-int-value" / "array-int-value" in task-23).
probe('boolean-string-value', "Arr::boolean(['string' => 'foo bar'], 'string')", fn () => Arr::boolean(['string' => 'foo bar'], 'string'));
probe('float-string-value', "Arr::float(['string' => 'foo bar'], 'string')", fn () => Arr::float(['string' => 'foo bar'], 'string'));
probe('integer-string-value', "Arr::integer(['string' => 'foo bar'], 'string')", fn () => Arr::integer(['string' => 'foo bar'], 'string'));
probe('integer-float-value', "Arr::integer(['a' => 1.5], 'a')", fn () => Arr::integer(['a' => 1.5], 'a'));
probe('boolean-list-int-key', "Arr::boolean(['foo bar'], 0)", fn () => Arr::boolean(['foo bar'], 0));
probe('float-list-int-key', "Arr::float(['foo bar'], 0)", fn () => Arr::float(['foo bar'], 0));
probe('integer-list-int-key', "Arr::integer(['foo bar'], 0)", fn () => Arr::integer(['foo bar'], 0));
probe('string-list-int-key', "Arr::string([1234], 0)", fn () => Arr::string([1234], 0));
probe('boolean-missing-key-default', "Arr::boolean([], 'missing', true) and Arr::boolean([], 'missing', false)", fn () => [
    'true' => Arr::boolean([], 'missing', true),
    'false' => Arr::boolean([], 'missing', false),
]);
// fix-round-1: dataFloat's "falls back to the default for a missing key" cited the
// boolean probe above by mistake. Arr::float has its own explicit-default form.
probe('float-missing-key-default', "Arr::float([], 'missing', 1.5)", fn () => Arr::float([], 'missing', 1.5));
// fix-round-1: dataInteger's "rejects a non-whole number" needed an array-backing pin,
// not just the assoc-key row above.
probe('integer-float-value-list', "Arr::integer([1.5], 0)", fn () => Arr::integer([1.5], 0));

// ==== P-31: a missing key with NO default. Laravel defaults the third argument to null,
// ==== Arr::get hands the null straight back, and the is_* check then rejects it.
probe('boolean-missing-key-no-default', "Arr::boolean([], 'missing')", fn () => Arr::boolean([], 'missing'));
probe('boolean-list-missing-index-no-default', "Arr::boolean([true, false], 5)", fn () => Arr::boolean([true, false], 5));
probe('float-missing-key-no-default', "Arr::float([], 'missing')", fn () => Arr::float([], 'missing'));
probe('float-list-missing-index-no-default', "Arr::float([], 0)", fn () => Arr::float([], 0));
probe('integer-missing-key-no-default', "Arr::integer([], 'missing')", fn () => Arr::integer([], 'missing'));
probe('integer-list-missing-index-no-default', "Arr::integer([], 0)", fn () => Arr::integer([], 0));
probe('string-missing-key-no-default', "Arr::string([], 'missing')", fn () => Arr::string([], 'missing'));
probe('string-list-missing-index-no-default', "Arr::string([], 0)", fn () => Arr::string([], 0));

// ==== take (ArrTest::testTake) — no `take` row exists anywhere in docs/php-parity/.
$take = [1, 2, 3, 4, 5, 6];
probe('take-positive', "Arr::take([1..6], 3)", fn () => Arr::take($take, 3));
probe('take-negative', "Arr::take([1..6], -3)", fn () => Arr::take($take, -3));
probe('take-zero', "Arr::take([1..6], 0)", fn () => Arr::take($take, 0));
probe('take-over-size', "Arr::take([1..6], 10)", fn () => Arr::take($take, 10));
probe('take-negative-over-size', "Arr::take([1..6], -10)", fn () => Arr::take($take, -10));
probe('take-empty', "Arr::take([], 3) and Arr::take([], -3)", fn () => ['positive' => Arr::take([], 3), 'negative' => Arr::take([], -3)]);
probe('take-assoc-positive', "Arr::take(['a'=>1,'b'=>2,'c'=>3,'d'=>4], 2)", fn () => Arr::take(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4], 2));
probe('take-assoc-negative', "Arr::take(['a'=>1,'b'=>2,'c'=>3,'d'=>4], -2)", fn () => Arr::take(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4], -2));

// CollectionTest::testTakeLast — a negative take keeps the ORIGINAL keys.
probe('collection-take-negative-keeps-keys', "(new Collection(['taylor','dayle','shawn']))->take(-2)", fn () => (new Collection(['taylor', 'dayle', 'shawn']))->take(-2)->all());
probe('collection-take-positive-keeps-keys', "(new Collection(['taylor','dayle','shawn']))->take(2)", fn () => (new Collection(['taylor', 'dayle', 'shawn']))->take(2)->all());
probe('collection-take-zero', "(new Collection(['taylor','dayle','shawn']))->take(0)", fn () => (new Collection(['taylor', 'dayle', 'shawn']))->take(0)->all());

// ==== search (CollectionTest::testSearchInStrictMode / testSearchReturnsFalseWhenItemIsNotFound)
probe('search-strict-falsy', "search over [false,0,1,[],''] in strict mode", function () {
    $c = new Collection([false, 0, 1, [], '']);

    return [
        "'false'" => $c->search('false', true),
        "'1'" => $c->search('1', true),
        'false' => $c->search(false, true),
        '0' => $c->search(0, true),
        '1' => $c->search(1, true),
        '[]' => $c->search([], true),
        "''" => $c->search('', true),
    ];
});
probe('search-loose-falsy', "search over [false,0,1,[],''] loosely", function () {
    $c = new Collection([false, 0, 1, [], '']);

    return ['0' => $c->search(0), "''" => $c->search(''), "'1'" => $c->search('1')];
});
probe('search-string-key-hit', "(new Collection(['foo'=>'bar','baz'=>'qux']))->search('qux')", fn () => (new Collection(['foo' => 'bar', 'baz' => 'qux']))->search('qux'));
probe('search-not-found', "search for a missing value, list and assoc", fn () => [
    'list' => (new Collection([1, 2, 3]))->search(9),
    'assoc' => (new Collection(['a' => 1]))->search(9),
]);
probe('search-callback', "(new Collection([1,2,3]))->search(fn(\$v) => \$v > 2)", fn () => (new Collection([1, 2, 3]))->search(fn ($v) => $v > 2));
probe('search-callback-not-found', "(new Collection([1,2,3]))->search(fn(\$v) => \$v > 9)", fn () => (new Collection([1, 2, 3]))->search(fn ($v) => $v > 9));
probe('search-callback-key-arg', "(new Collection(['a','b','c']))->search(fn(\$v,\$k) => \$k === 2)", fn () => (new Collection(['a', 'b', 'c']))->search(fn ($v, $k) => $k === 2));
probe('search-assoc-callback-key-arg', "(new Collection(['x'=>1,'y'=>2]))->search(fn(\$v,\$k) => \$k === 'y')", fn () => (new Collection(['x' => 1, 'y' => 2]))->search(fn ($v, $k) => $k === 'y'));

// ==== before / after in strict mode over the same falsy fixture
probe('before-strict-falsy', "before(1, true) and before(false, true) over [false,0,1,[],'']", fn () => [
    'one' => (new Collection([false, 0, 1, [], '']))->before(1, true),
    'first' => (new Collection([false, 0, 1, [], '']))->before(false, true),
]);
probe('after-strict-falsy', "after(0, true) and after('', true) over [false,0,1,[],'']", fn () => [
    'zero' => (new Collection([false, 0, 1, [], '']))->after(0, true),
    'last' => (new Collection([false, 0, 1, [], '']))->after('', true),
]);

// ==== hasAll (ArrTest::testHasAllMethod) — no `hasAll` row exists anywhere in docs/php-parity/.
$hasAll = ['name' => 'Taylor', 'age' => '', 'city' => null];
probe('hasAll-empty-and-null-values-count-as-present', "Arr::hasAll(['name'=>'Taylor','age'=>'','city'=>null], …)", fn () => [
    "'name'" => Arr::hasAll($hasAll, 'name'),
    "'age'" => Arr::hasAll($hasAll, 'age'),
    "'city'" => Arr::hasAll($hasAll, 'city'),
    "['age','car']" => Arr::hasAll($hasAll, ['age', 'car']),
    "['city','some']" => Arr::hasAll($hasAll, ['city', 'some']),
    "['name','age','city']" => Arr::hasAll($hasAll, ['name', 'age', 'city']),
    "['name','age','city','country']" => Arr::hasAll($hasAll, ['name', 'age', 'city', 'country']),
]);
probe('hasAll-dot-paths', "Arr::hasAll(['user'=>['name'=>'Taylor']], 'user.name' | 'user.age')", fn () => [
    'hit' => Arr::hasAll(['user' => ['name' => 'Taylor']], 'user.name'),
    'miss' => Arr::hasAll(['user' => ['name' => 'Taylor']], 'user.age'),
]);
probe('hasAll-all-missing', "Arr::hasAll(\$hasAll, 'foo') and Arr::hasAll(\$hasAll, ['foo','bar','baz','bar'])", fn () => [
    'scalar' => Arr::hasAll($hasAll, 'foo'),
    'list' => Arr::hasAll($hasAll, ['foo', 'bar', 'baz', 'bar']),
]);
probe('hasAll-empty-key-list', "Arr::hasAll(['a' => 1], [])", fn () => Arr::hasAll(['a' => 1], []));
probe('hasAll-through-list', "Arr::hasAll([['name' => 'John']], '0.name')", fn () => Arr::hasAll([['name' => 'John']], '0.name'));
// fix-round-1: "is false for an empty key list" only had an assoc-backing pin.
probe('hasAll-empty-key-list-list', "Arr::hasAll([1, 2, 3], [])", fn () => Arr::hasAll([1, 2, 3], []));

// ==== hasAny (ArrTest::testHasAnyMethod) — "hasAny-stray-arg-hit" exists; these do not.
probe('hasAny-variadic', "Arr::hasAny(['name'=>'Taylor','age'=>''], 'surname', 'name')", fn () => Arr::hasAny(['name' => 'Taylor', 'age' => ''], 'surname', 'name'));
probe('hasAny-dot-over-null-and-empty', "Arr::hasAny over null/'' values and dot paths", fn () => [
    'null value' => Arr::hasAny(['name' => null, 'email' => ''], ['name']),
    'dot over null' => Arr::hasAny(['user' => ['name' => null]], ['user.name']),
    'all missing' => Arr::hasAny(['a' => 1], ['x', 'y']),
]);
probe('hasAny-null-keys', "Arr::hasAny(['a' => 1], null)", fn () => Arr::hasAny(['a' => 1], null));
// fix-round-1: "hasAny-variadic" is a FALSE case (PHP drops the loose 2nd/3rd args) and was
// wrongly cited for TRUE-returning array-form and bare-key calls. These are the real thing.
probe('hasAny-true-hits', "Arr::hasAny — array-form and bare-key calls that actually return true", fn () => [
    'array form assoc' => Arr::hasAny(['name' => 'Taylor'], ['surname', 'name']),
    'bare key assoc' => Arr::hasAny(['name' => 'Taylor'], 'name'),
    'array form list' => Arr::hasAny([1, 2, 3], [5, 1]),
]);
// fix-round-1: the null/empty-value-still-counts-as-present behaviour needed a list-backing pin.
probe('hasAny-list-null-and-empty', "Arr::hasAny over a list with a null value and a partial key set", fn () => [
    'null value' => Arr::hasAny([null, 'x'], [0]),
    'stray plus real' => Arr::hasAny(['Taylor', 'Otwell'], [5, 0]),
    'all missing' => Arr::hasAny([1], [5, 9]),
]);

// ==== chunk (CollectionTest::testChunkWhenGivenZeroAsSize / testChunkWhenGivenLessThanZero)
$ten = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
probe('collection-chunk-zero', "(new Collection([1..10]))->chunk(0)", fn () => (new Collection($ten))->chunk(0)->toArray());
probe('collection-chunk-negative', "(new Collection([1..10]))->chunk(-1)", fn () => (new Collection($ten))->chunk(-1)->toArray());
probe('collection-chunk-last-chunk-keys', "(new Collection([1..10]))->chunk(3)->get(3)", fn () => (new Collection($ten))->chunk(3)->get(3)->all());
probe('collection-chunk-assoc-preserves-keys', "(new Collection(['a'=>1,'b'=>2,'c'=>3]))->chunk(2)", fn () => (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->chunk(2)->toArray());
probe('arr-chunk-zero-and-negative', "array_chunk guard via Collection::chunk on an assoc backing", fn () => [
    'zero' => (new Collection(['a' => 1, 'b' => 2]))->chunk(0)->toArray(),
    'negative' => (new Collection(['a' => 1, 'b' => 2]))->chunk(-1)->toArray(),
]);

// ==== join (ArrTest::testJoin) — only the two-element form is captured today.
probe('join-single', "Arr::join(['a'], ', ', ' and ')", fn () => Arr::join(['a'], ', ', ' and '));
probe('join-empty', "Arr::join([], ', ', ' and ')", fn () => Arr::join([], ', ', ' and '));
probe('join-three-no-final-glue', "Arr::join(['a','b','c'], ', ')", fn () => Arr::join(['a', 'b', 'c'], ', '));
probe('join-assoc-numbers', "Arr::join(['a'=>1,'b'=>2,'c'=>3], ', ')", fn () => Arr::join(['a' => 1, 'b' => 2, 'c' => 3], ', '));

// ==== divide (ArrTest::testDivide) — only the null-key/int-key row is captured today.
probe('divide-empty', "Arr::divide([])", fn () => Arr::divide([]));
probe('divide-array-values', "Arr::divide(['a' => [1, 2], 'b' => 'x'])", fn () => Arr::divide(['a' => [1, 2], 'b' => 'x']));
probe('divide-list', "Arr::divide(['Null', 'one'])", fn () => Arr::divide(['Null', 'one']));

// ==== crossJoin: the empty-dimension collapse in positional (list) form
probe('crossJoin-list-empty-dimension', "Arr::crossJoin([1, 2], [])", fn () => Arr::crossJoin([1, 2], []));

// ==== random (ArrTest::testRandom / testRandomOnEmptyArray) — DETERMINISTIC INVARIANTS ONLY.
$rand = [1, 2, 3, 4];
probe('random-zero-count', "Arr::random([1,2,3,4], 0)", fn () => Arr::random($rand, 0));
probe('random-empty-zero-count', "Arr::random([], 0) — does NOT throw", fn () => Arr::random([], 0));
probe('random-numeric-string-counts', "Arr::random([1,2,3,4], '0'|'1'|'2'): count and key shape only", fn () => [
    "'0'" => ['count' => count(Arr::random($rand, '0')), 'keys' => array_keys(Arr::random($rand, '0'))],
    "'1'" => ['count' => count(Arr::random($rand, '1')), 'keys' => array_keys(Arr::random($rand, '1'))],
    "'2'" => ['count' => count(Arr::random($rand, '2')), 'keys' => array_keys(Arr::random($rand, '2'))],
]);
probe('random-preserve-keys-invariant', "Arr::random([1,2,3,4], 2, true): keys are a subset of the source keys", function () use ($rand) {
    $drawn = Arr::random($rand, 2, true);

    return [
        'count' => count($drawn),
        'keys are original' => array_values(array_diff(array_keys($drawn), array_keys($rand))) === [],
        'values are original' => array_values(array_diff($drawn, $rand)) === [],
    ];
});
probe('random-single-no-count-type', "gettype(Arr::random([1,2,3,4]))", fn () => gettype(Arr::random($rand)));

// ==== shuffle (ArrTest::testShuffleKeepsSameValues) — DETERMINISTIC: sort before comparing.
probe('shuffle-keeps-same-values', "sort(Arr::shuffle(range(0, 25)))", function () {
    $s = Arr::shuffle(range(0, 25));
    sort($s);

    return ['sorted' => $s, 'keys' => array_keys($s)];
});

// ==== sole: the empty-input throw with no callback (the callback forms live in task-23).
probe('sole-empty-no-callback', "Arr::sole([])", fn () => Arr::sole([]));
probe('sole-multi-no-callback', "Arr::sole(['a' => 1, 'b' => 2])", fn () => Arr::sole(['a' => 1, 'b' => 2]));
probe('sole-single-no-callback', "Arr::sole(['only' => 42])", fn () => Arr::sole(['only' => 42]));

// ==== set: creating a dot path under a key that does not exist yet (ArrTest::testSet)
probe('set-creates-missing-path', "set(['products'=>['desk'=>['price'=>100]]], 'table.price', 500)", function () {
    $a = ['products' => ['desk' => ['price' => 100]]];
    Arr::set($a, 'table', 500);
    $flat = $a;
    Arr::set($a, 'table.price', 500);

    return ['flat write' => $flat, 'then dotted write' => $a];
});

// ==== partition: key preservation (ArrTest::testPartition, CollectionTest::testPartitionPreservesKeys)
probe('partition-preserves-keys', "Arr::partition(['John','Jane','Greg'], fn(\$v) => \$v !== 'Greg')", fn () => Arr::partition(['John', 'Jane', 'Greg'], fn ($v) => $v !== 'Greg'));
probe('partition-empty', "Arr::partition([], fn () => true)", fn () => Arr::partition([], fn () => true));
probe('partition-assoc-preserves-keys', "Arr::partition(['a'=>1,'b'=>2,'c'=>3], fn(\$v) => \$v > 1)", fn () => Arr::partition(['a' => 1, 'b' => 2, 'c' => 3], fn ($v) => $v > 1));

// ==== where / reject / whereNotNull: key preservation and the no-callback reject form
probe('where-preserves-int-keys', "Arr::where(['100','200','300','400'], fn(\$v) => \$v === '200' || \$v === '400')", fn () => Arr::where(['100', '200', '300', '400'], fn ($v) => $v === '200' || $v === '400'));
probe('reject-preserves-int-keys', "Arr::reject([1,2,3,4,5], fn(\$v) => \$v % 2 === 0)", fn () => Arr::reject([1, 2, 3, 4, 5], fn ($v) => $v % 2 === 0));
probe('reject-no-callback', "(new Collection([1, null, 2, false, 3, '']))->reject()", fn () => (new Collection([1, null, 2, false, 3, '']))->reject()->all());
probe('whereNotNull-all-null', "Arr::whereNotNull([null, null]) and Arr::whereNotNull(['a'=>null])", fn () => [
    'list' => Arr::whereNotNull([null, null]),
    'assoc' => Arr::whereNotNull(['a' => null]),
]);
probe('whereNotNull-list-preserves-keys', "Arr::whereNotNull([null, 0, false, '', null, []])", fn () => Arr::whereNotNull([null, 0, false, '', null, []]));

// ==== except(null) is a no-op on a Collection (CollectionTest::testExcept)
// fix-round-1: "removes a dot-notation path" wrongly cited task-23's "except-mixed-list",
// a 2-key call with a different fixture. This is the actual single dot-path call.
probe('except-single-dot-path', "Arr::except(['name'=>'taylor','framework'=>['language'=>'PHP','name'=>'Laravel']], 'framework.language')", fn () => Arr::except(['name' => 'taylor', 'framework' => ['language' => 'PHP', 'name' => 'Laravel']], 'framework.language'));
probe('collection-except-null', "(new Collection(['a'=>1,'b'=>2]))->except(null)", fn () => (new Collection(['a' => 1, 'b' => 2]))->except(null)->all());
probe('collection-except-self', "\$c->except(\$c)", function () {
    $c = new Collection(['a' => 1, 'b' => 2]);

    return $c->except($c)->all();
});

// ==== select on an existing bare key (select-missing / select-null already exist)
probe('select-bare-existing-key', "Arr::select(['a'=>['name'=>'Taylor','age'=>1],'b'=>['name'=>'Abigail','age'=>2]], 'name')", fn () => Arr::select(['a' => ['name' => 'Taylor', 'age' => 1], 'b' => ['name' => 'Abigail', 'age' => 2]], 'name'));
// fix-round-1: select-missing / select-null (task-23) only cover the assoc-of-assoc
// backing; "returns an empty row per item" needed a list-of-assoc pin too.
probe('select-missing-and-null-list', "Arr::select over a list backing — missing key and null key", fn () => [
    'missing' => Arr::select([['name' => 'T'], ['name' => 'A']], 'nonExistingKey'),
    'null' => Arr::select([['name' => 'T'], ['name' => 'A']], null),
]);

// ==== prependKeysWith over a list (the 'test.' assoc literal already exists)
probe('prependKeysWith-list', "Arr::prependKeysWith(['a', 'b', 'c'], 'item_')", fn () => Arr::prependKeysWith(['a', 'b', 'c'], 'item_'));

// ==== count on empty (CollectionTest::testCountable)
probe('count-empty', "count([]) via Collection", fn () => ['empty' => (new Collection([]))->count(), 'nested' => (new Collection([[1, 2], [3]]))->count()]);
// fix-round-1: "count-empty" is an emptiness check; "counts only the top level" needs its
// own pin, on a fixture where a recursive-leaf-count bug would produce a different number.
probe('count-nested-top-level-only', "Collection count only counts top-level items, never descends", fn () => [
    'assoc' => (new Collection(['a' => ['b' => 1, 'c' => 2], 'd' => 3]))->count(),
    'list' => (new Collection([[1, 2], [3]]))->count(),
]);

// ==== map: empty input and source immutability (ArrTest::testMapWithEmptyArray / testMap)
probe('map-empty', "Arr::map([], fn(\$v) => \$v)", fn () => Arr::map([], fn ($v) => $v));
probe('map-source-unchanged', "Arr::map does not mutate its source", function () {
    $src = ['a' => 1, 'b' => 2];
    $mapped = Arr::map($src, fn ($v) => $v * 2);

    return ['source' => $src, 'mapped' => $mapped];
});
probe('map-list-index-key', "Arr::map(['a','b'], fn(\$v,\$k) => \"\$k-\$v\")", fn () => Arr::map(['a', 'b'], fn ($v, $k) => "{$k}-{$v}"));

// ==== values on empty
probe('values-empty', "(new Collection([]))->values()", fn () => (new Collection([]))->values()->all());

// ==== contains: the loose block and the 2-arg / 3-arg key-value-operator forms
// (CollectionTest::testContains, testContainsWithOperator). Recorded for the record — @tolki/data
// exposes only the (data, value, strict) signature today; the plan decides whether to widen it.
probe('contains-loose-list', "contains over [null] and [0]", function () {
    $r = [];
    $c = new Collection([null]);
    $r['[null]'] = ['false' => $c->contains(false), 'null' => $c->contains(null), '[]' => $c->contains([]), '0' => $c->contains(0), "''" => $c->contains('')];
    $c = new Collection([0]);
    $r['[0]'] = ["'0'" => $c->contains('0'), 'false' => $c->contains(false), 'null' => $c->contains(null)];

    return $r;
});
probe('contains-two-args-key-value', "(new Collection([['v'=>1],['v'=>3],['v'=>5]]))->contains('v', 1)", fn () => (new Collection([['v' => 1], ['v' => 3], ['v' => 5]]))->contains('v', 1));
probe('contains-three-args-operator', "(new Collection([['v'=>1],['v'=>3],['v'=>'4'],['v'=>5]]))->contains('v', <op>, 4)", function () {
    $c = new Collection([['v' => 1], ['v' => 3], ['v' => '4'], ['v' => 5]]);

    return ["'='" => $c->contains('v', '=', 4), "'=='" => $c->contains('v', '==', 4), "'==='" => $c->contains('v', '===', 4), "'>'" => $c->contains('v', '>', 4)];
});
probe('containsStrict-numeric-string', "(new Collection([1, 3, 5, '02']))->containsStrict('02') and ->containsStrict(2)", fn () => [
    "'02'" => (new Collection([1, 3, 5, '02']))->containsStrict('02'),
    '2' => (new Collection([1, 3, 5, '02']))->containsStrict(2),
]);

// ==== fix-round-1 (batch A7-A9 citation sweep): dataSort/dataSortDesc's plain-scalar object
// test cited "sort(Desc)-rows-natural-keys", whose actual fixture is Desk/Chair rows, not
// {c:3,a:1,b:2}. Dedicated probes for the exact scalar-object call, ascending and descending.
probe('sort-scalar-keys', "array_keys(Arr::sort(['c'=>3,'a'=>1,'b'=>2]))", fn () => array_keys(Arr::sort(['c' => 3, 'a' => 1, 'b' => 2])));
probe('sortDesc-scalar-keys', "array_keys(Arr::sortDesc(['c'=>3,'a'=>1,'b'=>2]))", fn () => array_keys(Arr::sortDesc(['c' => 3, 'a' => 1, 'b' => 2])));

// fix-round-1: "sorts rows with a closure selector and a dot-notation key" only cited the
// no-selector natural-sort probes; the closure/dot-key/list calls it also makes need their own.
probe('sort-rows-closure-keys', "array_keys(Arr::sort(['a'=>['name'=>'Desk'],'b'=>['name'=>'Chair']], fn(\$v)=>\$v['name']))", fn () => array_keys(Arr::sort(['a' => ['name' => 'Desk'], 'b' => ['name' => 'Chair']], fn ($v) => $v['name'])));
probe('sort-rows-dot-key-keys', "array_keys(Arr::sort(['a'=>['meta'=>['k'=>2]],'b'=>['meta'=>['k'=>1]]], 'meta.k'))", fn () => array_keys(Arr::sort(['a' => ['meta' => ['k' => 2]], 'b' => ['meta' => ['k' => 1]]], 'meta.k')));
probe('sort-rows-list-closure', "array_values(Arr::sort([['name'=>'Desk'],['name'=>'Chair']], fn(\$v)=>\$v['name']))", fn () => array_values(Arr::sort([['name' => 'Desk'], ['name' => 'Chair']], fn ($v) => $v['name'])));

// fix-round-1: "sorts rows descending with a closure selector and a dot-notation key" also
// makes a list-backed dot-key call the natural-sort probes above don't cover.
probe('sortDesc-rows-list-dot-key', "array_values(Arr::sortDesc([['meta'=>['k'=>1]],['meta'=>['k'=>2]]], 'meta.k'))", fn () => array_values(Arr::sortDesc([['meta' => ['k' => 1]], ['meta' => ['k' => 2]]], 'meta.k')));

// fix-round-1: "orders nested numbers descending, numerically" also asserts a list-backed
// call; "sortRecursiveDesc-numbers" only covers the object-backed one.
probe('sortRecursiveDesc-numbers-list', "Arr::sortRecursiveDesc([[1,9,10]])", fn () => Arr::sortRecursiveDesc([[1, 9, 10]]));

// fix-round-1: "descends every level of the ArrTest fixture" uses a 3-key subset of the
// canonical $srd literal (no numbered_index); cite the exact subset instead of the 4-key one.
probe('sortRecursiveDesc-three-groups', "Arr::sortRecursiveDesc(['empty'=>[],'nested'=>['level1'=>['level2'=>['level3'=>[2,3,1]],'values'=>[4,5,6]]],'mixed'=>['a'=>1,2=>'b','c'=>3,1=>'d']])", fn () => Arr::sortRecursiveDesc([
    'empty' => [],
    'nested' => ['level1' => ['level2' => ['level3' => [2, 3, 1]], 'values' => [4, 5, 6]]],
    'mixed' => ['a' => 1, 2 => 'b', 'c' => 3, 1 => 'd'],
]));

// fix-round-1: dataWhere's "passes the key to the callback" list-backed assertion
// (['a','b','c'], key>0) wasn't the call "callback-key where" actually makes (that probe
// only records key TYPES on a different fixture). This is the real call.
probe('where-list-key-predicate', "array_values(Arr::where(['a','b','c'], fn(\$v,\$k)=>\$k>0))", fn () => array_values(Arr::where(['a', 'b', 'c'], fn ($v, $k) => $k > 0)));

// fix-round-1: dataReject's "passes the key to the callback" cited "callback-key reject", a
// key-TYPE probe on a different fixture; this is the actual ['a'=>1,'b'=>2] call it makes.
probe('reject-key-predicate', "Arr::reject(['a'=>1,'b'=>2], fn(\$v,\$k)=>\$k==='a')", fn () => Arr::reject(['a' => 1, 'b' => 2], fn ($v, $k) => $k === 'a'));

// fix-round-1: dataPartition's "passes the key to the callback" cited "callback-key
// partition", whose callback always returns true and only records key types. This is real.
probe('partition-key-predicate', "Arr::partition([1=>'a','x'=>'b'], fn(\$v,\$k)=>is_numeric(\$k))", fn () => Arr::partition([1 => 'a', 'x' => 'b'], fn ($v, $k) => is_numeric($k)));

// fix-round-1 (Important 2 — missing array-backed siblings): dataSort's sortByMany and
// per-key-direction tests were object-only; add the equivalent list-backed calls.
$sbmList = [
    ['name' => 'John', 'age' => 8, 'meta' => ['key' => 3]],
    ['name' => 'John', 'age' => 10, 'meta' => ['key' => 5]],
    ['name' => 'Dave', 'age' => 10, 'meta' => ['key' => 3]],
    ['name' => 'John', 'age' => 8, 'meta' => ['key' => 2]],
];
probe('sortByMany-keys-list', "array_values(Arr::sort(\$sbmList, ['name','age','meta.key']))", fn () => array_values(Arr::sort($sbmList, ['name', 'age', 'meta.key'])));
probe('sortByMany-order-list', "array_values(Arr::sort(\$sbmList, ['name',['age',false],['meta.key',true]]))", fn () => array_values(Arr::sort($sbmList, ['name', ['age', false], ['meta.key', true]])));

// fix-round-1 (Important 2): dataMap's "leaves the source untouched" was object-only.
probe('map-source-unchanged-list', "Arr::map does not mutate its list source", function () {
    $src = [1, 2];
    $mapped = Arr::map($src, fn ($v) => $v * 2);

    return ['source' => $src, 'mapped' => $mapped];
});

// fix-round-2 (A10 sweep of A1-A6 citations): "prependKeysWith-list" recorded a 3-item
// ['a','b','c']/'item_' call; "prefixes a list's indices" actually calls with 2 items and
// a 'p.' prefix. This is the real call.
probe('prependKeysWith-two-item-list', "Arr::prependKeysWith(['a', 'b'], 'p.')", fn () => Arr::prependKeysWith(['a', 'b'], 'p.'));

// fix-round-2: dataExcept's "removes a numeric key given as a number or as its string form"
// makes a second call with the key as a string; "except-int-key" only covers the int form.
probe('except-string-key', "Arr::except([1 => 'hAz', 2 => 'x'], '2')", fn () => Arr::except([1 => 'hAz', 2 => 'x'], '2'));

// fix-round-2: dataTake's "returns everything when the limit exceeds the size" also makes
// two assoc-backed calls; "take-over-size" / "take-negative-over-size" are list-only.
probe('take-assoc-over-size', "Arr::take(['a'=>1,'b'=>2], 10)", fn () => Arr::take(['a' => 1, 'b' => 2], 10));
probe('take-assoc-negative-over-size', "Arr::take(['a'=>1,'b'=>2], -10)", fn () => Arr::take(['a' => 1, 'b' => 2], -10));

// fix-round-2: dataSelect's "accepts a bare string key" also makes a list-backed call;
// "select-bare-existing-key" only covers the assoc-of-assoc backing.
probe('select-bare-key-list', "array_values(Arr::select([['a'=>1,'b'=>2],['a'=>3,'b'=>4]], 'a'))", fn () => array_values(Arr::select([['a' => 1, 'b' => 2], ['a' => 3, 'b' => 4]], 'a')));

// ==== A11: dataPop, dataExceptValues, dataOnlyValues — Task A10's smoke-only scan found
// these still at two it() cases each with named Laravel tests they don't cover.

// CollectionTest::testPopReturnsAndRemovesLastXItemsInCollection — the list-backed half;
// the assoc-backed half is already "P2 pop(2)/pop(6) on assoc" in task-23-obj-release-readiness.json.
probe('pop-list-count-exceeds-length', "(new Collection(['foo','bar','baz']))->pop(2) then a fresh pop(6)", function () {
    $c = new Collection(['foo', 'bar', 'baz']);
    $two = $c->pop(2)->all();
    $first = $c->first();
    $six = (new Collection(['foo', 'bar', 'baz']))->pop(6)->all();

    return ['two' => $two, 'first' => $first, 'six' => $six];
});

// Popping from an already-empty backing with the default count. Count > 1 on an empty
// backing is already "D6 shift/pop on collect(null)" (pop3 => []) in task-23-obj-release-readiness.json.
probe('pop-empty-default-count', "(new Collection([]))->pop()", fn () => (new Collection([]))->pop());

// ArrTest::testExceptValues — the list literal's key-preservation row; the assoc rows are
// already captured ("exceptValues-assoc-strict" / "-loose" / "-empty" in task-23).
probe('exceptValues-list-keeps-gap', "Arr::exceptValues(['foo','bar','baz','qux'], ['foo','baz'])", fn () => Arr::exceptValues(['foo', 'bar', 'baz', 'qux'], ['foo', 'baz']));

// ArrTest::testOnlyValues — the list literal's key-preservation row; the assoc rows are
// already captured ("onlyValues-empty-data" / "-empty-values-assoc" / "-strict-numstr-assoc" / "-loose-numstr-assoc" in task-23).
probe('onlyValues-list-keeps-gap', "Arr::onlyValues(['foo','bar','baz','qux'], ['foo','baz'])", fn () => Arr::onlyValues(['foo', 'bar', 'baz', 'qux'], ['foo', 'baz']));

// ==== C6: whether dataReplace/dataReplaceRecursive may route a list backing through
// arr.replace/arr.replaceRecursive. Those two return a JS list, so they drop a string key
// and fill a gap with undefined. array_replace keeps both, so obj has to serve both backings.
// task-05-replace.json and task-23 only cover same-shape and int-keyed replacers.

probe('replace-list-string-key-replacer', "(new Collection(['a','b','c']))->replace(['k' => 'x'])", fn () => (new Collection(['a', 'b', 'c']))->replace(['k' => 'x'])->all());
probe('replace-list-sparse-replacer', "(new Collection(['a']))->replace([3 => 'd'])", fn () => (new Collection(['a']))->replace([3 => 'd'])->all());
probe('replace-list-mixed-key-replacer', "(new Collection(['a','b']))->replace([1 => 'z', 'k' => 'x'])", fn () => (new Collection(['a', 'b']))->replace([1 => 'z', 'k' => 'x'])->all());
probe('replaceRecursive-list-string-key-replacer', "(new Collection(['a','b','c']))->replaceRecursive(['k' => 'x'])", fn () => (new Collection(['a', 'b', 'c']))->replaceRecursive(['k' => 'x'])->all());
probe('replaceRecursive-list-sparse-replacer', "(new Collection(['a']))->replaceRecursive([3 => 'd'])", fn () => (new Collection(['a']))->replaceRecursive([3 => 'd'])->all());
probe('replaceRecursive-list-mixed-key-replacer', "(new Collection(['a','b']))->replaceRecursive([1 => 'z', 'k' => 'x'])", fn () => (new Collection(['a', 'b']))->replaceRecursive([1 => 'z', 'k' => 'x'])->all());

// ==== C10: a scalar backing on the key-aware setops. dataDiffAssoc, dataIntersectAssoc and
// dataIntersectByKeys handed a scalar straight to arr instead of wrapping it, so they answered
// empty. Collection wraps a scalar as a one-item list, which is what dispatch's arrWrap does.

probe('intersect-scalar-backing', "(new Collection(5))->intersect([5])", fn () => (new Collection(5))->intersect([5])->all());
probe('diffAssoc-scalar-backing', "(new Collection(5))->diffAssoc([1, 99, 3])", fn () => (new Collection(5))->diffAssoc([1, 99, 3])->all());
probe('intersectAssoc-scalar-backing', "(new Collection(5))->intersectAssoc([5])", fn () => (new Collection(5))->intersectAssoc([5])->all());
probe('intersectByKeys-scalar-backing', "(new Collection(5))->intersectByKeys([1])", fn () => (new Collection(5))->intersectByKeys([1])->all());

// fix-round-1: intersectAssocUsing was left out of the C10 sweep. Its sibling's label records
// intersectAssoc, a different call, so it cannot be cited for this one.
probe('intersectAssocUsing-scalar-backing', "(new Collection(5))->intersectAssocUsing([5], fn (\$a, \$b) => strcasecmp((string) \$a, (string) \$b))", fn () => (new Collection(5))->intersectAssocUsing([5], fn ($a, $b) => strcasecmp((string) $a, (string) $b))->all());

// ==== D7 (F-23 routed by P-40): union was left out of the C10 scalar sweep. It is the one
// setop whose backing is its LEFT operand, so a scalar backing must win over the operand.
probe('d7-union-scalar-backing', "(new Collection(5))->union([9]) and (new Collection('x'))->union([9])", fn () => [
    'int' => (new Collection(5))->union([9])->all(),
    'string' => (new Collection('x'))->union([9])->all(),
]);
probe('d7-union-traversable-backing', "(new Collection(new ArrayIterator([1, 2])))->union(['d' => 4]) and ->union([9, 9, 9])", fn () => [
    'keyed-operand' => (new Collection(new ArrayIterator([1, 2])))->union(['d' => 4])->all(),
    'list-operand' => (new Collection(new ArrayIterator([1, 2])))->union([9, 9, 9])->all(),
]);

// ==== D7 (F-23(4)): combine's keys backing. It never normalised one either, so every
// backing but a list or a plain object reached array_combine as an empty key set.
probe('d7-combine-scalar-backing', "(new Collection(5))->combine(['x']), (new Collection('k'))->combine(['x']) and (new Collection(null))->combine([])", fn () => [
    'int' => (new Collection(5))->combine(['x'])->all(),
    'string' => (new Collection('k'))->combine(['x'])->all(),
    'null' => (new Collection(null))->combine([])->all(),
]);
probe('d7-combine-traversable-backing', "(new Collection(new ArrayIterator(['k1', 'k2'])))->combine(['x', 'y'])", fn () => (new Collection(new ArrayIterator(['k1', 'k2'])))->combine(['x', 'y'])->all());

// ==== P-39: what a Traversable backing answers, against what a string backing answers.
// Collection materialises a Traversable through iterator_to_array, so take(2) sees its
// elements; a string is not Traversable, so (array) wraps it as one item.

probe('take-traversable-backing', "(new Collection(new ArrayIterator([1, 2, 3])))->take(2)", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->take(2)->all());
probe('random-traversable-backing-count', "count((new Collection(new ArrayIterator([1, 2, 3])))->random(2)->all())", fn () => count((new Collection(new ArrayIterator([1, 2, 3])))->random(2)->all()));
probe('flatten-traversable-backing', "(new Collection(new ArrayIterator([1, 2, 3])))->flatten()", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->flatten()->all());
probe('has-traversable-backing', "(new Collection(new ArrayIterator([1, 2, 3])))->has(0)", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->has(0));
probe('has-traversable-backing-last-index', "(new Collection(new ArrayIterator([1, 2, 3])))->has(2)", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->has(2));
probe('has-traversable-backing-past-end', "(new Collection(new ArrayIterator([1, 2, 3])))->has(3)", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->has(3));
probe('values-traversable-backing', "(new Collection(new ArrayIterator([1, 2, 3])))->values()", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->values()->all());
probe('take-string-backing', "(new Collection('abc'))->take(2)", fn () => (new Collection('abc'))->take(2)->all());
probe('flatten-string-backing', "(new Collection('abc'))->flatten()", fn () => (new Collection('abc'))->flatten()->all());
probe('values-string-backing', "(new Collection('abc'))->values()", fn () => (new Collection('abc'))->values()->all());

// ==== Carried in: data.spec.ts asserted dataInteger([], 0, 5) === 5 with no citation.
// Arr::integer defaults to null and throws on a missing key, but an explicit default is returned.
probe('integer-list-missing-index-with-default', "Arr::integer([], 0, 5)", fn () => Arr::integer([], 0, 5));

// ==== Group 0 (carried in from the D1-D3 review): two Collection rows the port gets wrong.

// Collection.php:1502 seeds firstOrFail with a fresh stdClass precisely so that a STORED
// null is a found item. Only an absent item can equal that placeholder.
probe('firstOrFail-stored-null-list', "(new Collection([null]))->firstOrFail()", fn () => (new Collection([null]))->firstOrFail());
probe('firstOrFail-stored-null-assoc', "(new Collection(['a' => null]))->firstOrFail()", fn () => (new Collection(['a' => null]))->firstOrFail());
probe('firstOrFail-stored-null-with-callback', "(new Collection([1, null]))->firstOrFail(fn (\$v) => is_null(\$v))", fn () => (new Collection([1, null]))->firstOrFail(fn ($v) => is_null($v)));

// EnumeratesValues.php:843 starts reduce at $initial and never throws; an empty backing
// with no initial value simply hands $initial (null) straight back.
probe('reduce-empty-no-initial', "(new Collection([]))->reduce(fn (\$c, \$v) => \$c + \$v) and the assoc backing", fn () => [
    'list' => (new Collection([]))->reduce(fn ($c, $v) => $c + $v),
    'assoc' => (new Collection((object) []))->reduce(fn ($c, $v) => $c + $v),
]);

// ==== D4 (F-12): PHP key semantics on the WRITE path. Arr::set, Arr::push and Arr::forget
// hand every dot segment straight to the array subscript, so PHP's own key cast applies:
// "01" and "" stay string keys, "1" and "-1" become integers, and a dotted "1.5" is two
// segments. json_encode cannot show int-vs-string keys, so each row records them separately.

$d4Segments = ['01', '1', '-1', '1.5', ''];

/** Render a probe result as its JSON shape plus the PHP type of every top-level key. */
$d4Shape = fn (array $array): array => [
    'json' => json_decode(json_encode($array, JSON_UNESCAPED_SLASHES), true),
    'keys' => array_map(fn ($k) => gettype($k) . ':' . $k, array_keys($array)),
];

$d4Set = function (array $array, string $key) use ($d4Shape): array {
    Arr::set($array, $key, 'V');

    return $d4Shape($array);
};

probe('set-list-key-cast', "Arr::set(['a','b'], \$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Set) {
    return array_combine($d4Segments, array_map(fn ($s) => $d4Set(['a', 'b'], $s), $d4Segments));
});
probe('set-record-key-cast', "Arr::set(['x'=>1], \$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Set) {
    return array_combine($d4Segments, array_map(fn ($s) => $d4Set(['x' => 1], $s), $d4Segments));
});
probe('set-nested-list-key-cast', "Arr::set([['a','b']], '0.'.\$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = [['a', 'b']];
        Arr::set($array, '0.' . $s, 'V');

        return $d4Shape($array[0]);
    }, $d4Segments));
});
probe('set-nested-record-key-cast', "Arr::set([['x'=>1]], '0.'.\$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = [['x' => 1]];
        Arr::set($array, '0.' . $s, 'V');

        return $d4Shape($array[0]);
    }, $d4Segments));
});

probe('push-list-key-cast', "Arr::push([['a']], \$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = [['a']];
        Arr::push($array, $s, 'V');

        return $d4Shape($array);
    }, $d4Segments));
});
probe('push-record-key-cast', "Arr::push(['k'=>['a']], \$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = ['k' => ['a']];
        Arr::push($array, $s, 'V');

        return $d4Shape($array);
    }, $d4Segments));
});

probe('forget-record-key-cast', "Arr::forget(['a'=>['x','y','z']], 'a.'.\$seg) for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = ['a' => ['x', 'y', 'z']];
        Arr::forget($array, 'a.' . $s);

        return $d4Shape($array['a']);
    }, $d4Segments));
});
probe('forget-list-key-cast', "Arr::forget([['x','y','z']], '0.'.\$seg) for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = [['x', 'y', 'z']];
        Arr::forget($array, '0.' . $s);

        return $d4Shape($array[0]);
    }, $d4Segments));
});

// Arr::undot keeps a non-canonical key a string key, at the top level and inside a path.
probe('undot-noncanonical-index', "Arr::undot(['01' => 'a']) and Arr::undot(['0.01' => 'a'])", function () use ($d4Shape) {
    return ['top level' => $d4Shape(Arr::undot(['01' => 'a'])), 'nested' => $d4Shape(Arr::undot(['0.01' => 'a'])[0])];
});

// The read side of the same cast, for the round trip: an empty segment names the "" key,
// and "01" never reaches a list's index 1.
probe('get-write-path-key-cast', "Arr::get with an empty segment, a non-canonical index, and a stored '01' key", fn () => [
    "[['' => 1]] '0.'" => Arr::get([['' => 1]], '0.'),
    "[['a','b']] '0.01'" => Arr::get([['a', 'b']], '0.01'),
    "[['01' => 'z']] '0.01'" => Arr::get([['01' => 'z']], '0.01'),
    "['a','b'] '01'" => Arr::get(['a', 'b'], '01'),
]);
probe('set-then-get-noncanonical-index', "\$a = []; Arr::set(\$a, '01', 5); Arr::get(\$a, '01')", function () {
    $a = [];
    Arr::set($a, '01', 5);

    return Arr::get($a, '01');
});
probe('set-then-get-noncanonical-index-nested', "\$a = [[]]; Arr::set(\$a, '0.01', 5); Arr::get(\$a, '0.01')", function () {
    $a = [[]];
    Arr::set($a, '0.01', 5);

    return ['written' => $a, 'read back' => Arr::get($a, '0.01')];
});

probe('forget-top-level-key-cast', "Arr::forget(['products', ['desk', [100]]], \$seg) for \$seg in '01','1',''", function () use ($d4Shape) {
    return array_combine(['01', '1', ''], array_map(function ($s) use ($d4Shape) {
        $array = ['products', ['desk', [100]]];
        Arr::forget($array, $s);

        return $d4Shape($array);
    }, ['01', '1', '']));
});

// An empty MIDDLE segment is a real "" key too, not a segment to skip.
probe('set-empty-middle-segment', "\$a = []; Arr::set(\$a, '0..1', 'V')", function () use ($d4Shape) {
    $a = [];
    Arr::set($a, '0..1', 'V');

    return ['outer' => $d4Shape($a), 'inner' => $d4Shape($a[0])];
});

// ==== D5 (F-18): what the caller's own value looks like after a write helper runs.
// Arr::add takes $array BY VALUE, and a PHP array is a value all the way down, so the
// caller's nested array is untouched. Arr::push takes it by REFERENCE and mutates it —
// recorded so the port's settled "only pop/shift/splice/unshift mutate" rule is an
// explicit, documented divergence rather than an unnoticed one.
probe('add-leaves-the-caller-value-untouched', "\$src = [['desk' => 100]]; Arr::add(\$src, '0.chair', 150)", function () {
    $src = [['desk' => 100]];
    $result = Arr::add($src, '0.chair', 150);

    return ['source' => $src, 'result' => $result];
});
probe('add-list-leaves-the-caller-value-untouched', "\$src = [[100]]; Arr::add(\$src, '0.1', 150)", function () {
    $src = [[100]];
    $result = Arr::add($src, '0.1', 150);

    return ['source' => $src, 'result' => $result];
});
probe('add-existing-key-is-a-no-op', "\$src = [['desk' => 100]]; Arr::add(\$src, '0.desk', 150)", function () {
    $src = [['desk' => 100]];

    return Arr::add($src, '0.desk', 150);
});
probe('push-mutates-the-caller-by-reference', "\$src = [['a']]; Arr::push(\$src, '0', 'b')", function () {
    $src = [['a']];
    $result = Arr::push($src, '0', 'b');

    return ['source' => $src, 'result' => $result];
});
probe('push-missing-index-stores-an-empty-array', "\$src = [1, 2, 3]; Arr::push(\$src, 4)", function () {
    $src = [1, 2, 3];
    Arr::push($src, 4);

    return ['source' => $src, 'keys' => array_keys($src)];
});

// ==== D5 (F-24a): a dot path under a list index replaces the scalar with a record.
probe('set-dot-path-under-a-list-index', "\$a = ['a', 'b']; Arr::set(\$a, '0.x', 5)", function () {
    $a = ['a', 'b'];
    Arr::set($a, '0.x', 5);

    return $a;
});

// ==== Citation-integrity sweep over the D4-D5 batch: five assertions named a real label
// whose recorded call used a different fixture. These are the calls they actually make.

probe('firstOrFail-stored-null-assoc-with-callback', "(new Collection(['a' => 1, 'b' => null]))->firstOrFail(fn (\$v) => is_null(\$v))", fn () => (new Collection(['a' => 1, 'b' => null]))->firstOrFail(fn ($v) => is_null($v)));

probe('set-scalar-element-empty-trailing-segment', "\$a = ['a']; Arr::set(\$a, '0.', 'value')", function () use ($d4Shape) {
    $a = ['a'];
    Arr::set($a, '0.', 'value');

    return ['outer' => $d4Shape($a), 'inner' => $d4Shape($a[0])];
});

probe('forget-list-noncanonical-among-several-keys', "Arr::forget([['x','y','z']], ['0.01', '0.2'])", function () use ($d4Shape) {
    $a = [['x', 'y', 'z']];
    Arr::forget($a, ['0.01', '0.2']);

    return $d4Shape($a[0]);
});

probe('add-nested-list-leaves-the-caller-value-untouched', "\$src = ['products', ['desk']]; Arr::add(\$src, '1.1', 200)", function () {
    $src = ['products', ['desk']];
    $result = Arr::add($src, '1.1', 200);

    return ['source' => $src, 'result' => $result];
});
probe('add-nested-record-leaves-the-caller-value-untouched', "\$src = ['a' => ['z' => 1]]; Arr::add(\$src, 'a.y', 2)", function () {
    $src = ['a' => ['z' => 1]];
    $result = Arr::add($src, 'a.y', 2);

    return ['source' => $src, 'result' => $result];
});

// ==== fix-round-1 Group H: the own-property channel. PHP holds '01', '' and '-1' as real
// ==== array keys, so the write is readable again and survives the other helpers; the port
// ==== stores them as the list's own properties, which only some helpers carry.
$h1Shape = function (array $a) {
    $keys = [];
    foreach (array_keys($a) as $k) {
        $keys[] = gettype($k) . ':' . $k;
    }

    return ['json' => $a, 'keys' => $keys];
};
$h1Base = function () {
    $a = ['a', 'b'];
    Arr::set($a, '01', 'V');

    return $a;
};
probe('own-key-channel-round-trip', "\$a = ['a','b']; Arr::set(\$a, '01', 'V'); then Arr::get / Arr::has", function () use ($h1Shape, $h1Base) {
    return [
        'written' => $h1Shape($h1Base()),
        'get' => Arr::get($h1Base(), '01', '<<miss>>'),
        'has' => Arr::has($h1Base(), '01'),
    ];
});
probe('own-key-channel-negative-index-round-trip', "\$a = ['a','b']; Arr::set(\$a, '-1', 'V'); then Arr::get / Arr::has", function () use ($h1Shape) {
    $a = ['a', 'b'];
    Arr::set($a, '-1', 'V');

    return [
        'written' => $h1Shape($a),
        'get' => Arr::get($a, '-1', '<<miss>>'),
        'has' => Arr::has($a, '-1'),
    ];
});
probe('own-key-channel-survives-other-helpers', "on \$a = ['a','b'] + Arr::set(\$a,'01','V'): except, add, set, only, forget", function () use ($h1Shape, $h1Base) {
    $added = $h1Base();
    $set = $h1Base();
    Arr::set($set, '2', 'c');
    $forgotten = $h1Base();
    Arr::forget($forgotten, '01');

    return [
        "except ['zzz']" => $h1Shape(Arr::except($h1Base(), ['zzz'])),
        "add '2'" => $h1Shape(Arr::add($added, '2', 'c')),
        "set '2'" => $h1Shape($set),
        'only [0]' => $h1Shape(Arr::only($h1Base(), [0])),
        "forget '01'" => $h1Shape($forgotten),
    ];
});

// ==== fix-round-1 Group D: what Arr::set does when a path descends through a nested
// ==== OBJECT. Arr::set's descend test is `is_array`, so an object is no container.
probe('add-nested-object-is-replaced-wholesale', "\$src = [new D4Point(1)]; Arr::add(\$src, '0.y', 2)", function () {
    $src = [new D4Point(1)];
    $result = Arr::add($src, '0.y', 2);

    return [
        'source' => $src,
        'source_type' => get_debug_type($src[0]),
        'result' => $result,
        'result_type' => get_debug_type($result[0]),
    ];
});
probe('add-assoc-nested-object-is-replaced-wholesale', "\$src = ['a' => new D4Point(1)]; Arr::add(\$src, 'a.y', 2)", function () {
    $src = ['a' => new D4Point(1)];
    $result = Arr::add($src, 'a.y', 2);

    return [
        'source' => $src,
        'source_type' => get_debug_type($src['a']),
        'result' => $result,
        'result_type' => get_debug_type($result['a']),
    ];
});
probe('add-nested-arrayaccess-is-replaced-wholesale', "\$src = [new ArrayObject(['z' => 1])]; Arr::add(\$src, '0.y', 2)", function () {
    $src = [new ArrayObject(['z' => 1])];
    $result = Arr::add($src, '0.y', 2);

    return [
        'source_count' => count($src[0]),
        'result' => $result,
        'result_type' => get_debug_type($result[0]),
    ];
});

// ==== fix-round-1 Group A: the existing push-mutates row uses the STRING key '0'. The
// ==== defect was on the integer key, so the contrast needs its own recorded call.
probe('push-integer-key-mutates-the-caller-by-reference', "\$src = [['x']]; Arr::push(\$src, 0, 'y')", function () {
    $src = [['x']];
    $result = Arr::push($src, 0, 'y');

    return ['source' => $src, 'result' => $result];
});

// ==== Task D6 Step 4b: what mapWithKeys does with a LIST return (the PHP equivalent of a
// ==== JavaScript [key, value] tuple). Both wrap the same foreach over the returned array.
probe('d6-map-with-keys-list-return', "Arr::mapWithKeys(['a' => 1, 'b' => 2], fn (\$v, \$k) => [\"key_\$k\", \$v * 2])", function () {
    return [
        'arr-assoc' => Arr::mapWithKeys(['a' => 1, 'b' => 2], fn ($v, $k) => ["key_$k", $v * 2]),
        'collection-assoc' => (new Collection(['a' => 1, 'b' => 2]))->mapWithKeys(fn ($v, $k) => ["key_$k", $v * 2])->all(),
        'collection-list' => (new Collection([1, 2]))->mapWithKeys(fn ($v, $k) => ["key_$k", $v * 2])->all(),
        'arr-single-row' => Arr::mapWithKeys(['a' => 1], fn ($v, $k) => ["key_$k", $v * 2]),
        'arr-pair-return' => Arr::mapWithKeys(['a' => 1, 'b' => 2], fn ($v, $k) => [$k => $v * 2]),
    ];
});

// ==== Task D6 Step 2: the set operations neither @tolki/arr nor @tolki/obj ports yet.
probe('d6-diff-keys', "(new Collection(['id' => 1, 'first_word' => 'Hello']))->diffKeys(['id' => 123, 'foo_bar' => 'Hello'])", function () {
    return [
        'assoc' => (new Collection(['id' => 1, 'first_word' => 'Hello']))->diffKeys(['id' => 123, 'foo_bar' => 'Hello'])->all(),
        'assoc-value-ignored' => (new Collection(['a' => 1, 'b' => 2]))->diffKeys(['a' => 999])->all(),
        'list' => (new Collection([1, 2, 3]))->diffKeys([9, 9])->all(),
        'list-keyed-operand' => (new Collection([1, 2]))->diffKeys(['a' => 1, 1 => 5])->all(),
        'nullish-operand' => (new Collection(['a' => 1]))->diffKeys(null)->all(),
        'collection-operand' => (new Collection(['a' => 1, 'b' => 2]))->diffKeys(new Collection(['a' => 9]))->all(),
    ];
});
probe('d6-diff-using', "(new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue']))->diffUsing(['A' => 'GREEN', 'yellow'], 'strcasecmp')", function () {
    return [
        'assoc' => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue']))->diffUsing(['A' => 'GREEN', 'yellow'], 'strcasecmp')->all(),
        'list' => (new Collection(['green', 'brown', 'blue']))->diffUsing(['GREEN', 'yellow'], 'strcasecmp')->all(),
        'nullish-operand' => (new Collection(['a' => 'green']))->diffUsing(null, 'strcasecmp')->all(),
        'collection-operand' => (new Collection(['a' => 'green', 'b' => 'brown']))->diffUsing(new Collection(['GREEN']), 'strcasecmp')->all(),
    ];
});
probe('d6-intersect-using', "(new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue']))->intersectUsing(['A' => 'GREEN', 'yellow'], 'strcasecmp')", function () {
    return [
        'assoc' => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue']))->intersectUsing(['A' => 'GREEN', 'yellow'], 'strcasecmp')->all(),
        'list' => (new Collection(['green', 'brown', 'blue']))->intersectUsing(['GREEN', 'yellow'], 'strcasecmp')->all(),
        'nullish-operand' => (new Collection(['a' => 'green']))->intersectUsing(null, 'strcasecmp')->all(),
        'collection-operand' => (new Collection(['a' => 'green', 'b' => 'brown']))->intersectUsing(new Collection(['GREEN']), 'strcasecmp')->all(),
    ];
});
probe('d6-diff-assoc-using-and-diff-keys-using-on-a-list', "(new Collection([1, 2, 3]))->diffAssocUsing([1, 9, 3], 'strcasecmp') / ->diffKeysUsing(['a' => 1, 1 => 5], 'strcasecmp')", function () {
    return [
        'diffAssocUsing-list' => (new Collection([1, 2, 3]))->diffAssocUsing([1, 9, 3], 'strcasecmp')->all(),
        'diffKeysUsing-list' => (new Collection([1, 2]))->diffKeysUsing(['a' => 1, 1 => 5], 'strcasecmp')->all(),
        'diffAssocUsing-assoc' => (new Collection(['a' => 'green', 'b' => 'brown']))->diffAssocUsing(['A' => 'green', 'c' => 'blue'], 'strcasecmp')->all(),
        'diffKeysUsing-assoc' => (new Collection(['id' => 1, 'first_word' => 'Hello']))->diffKeysUsing(['ID' => 123, 'foo_bar' => 'Hello'], 'strcasecmp')->all(),
    ];
});

// ==== Task D6 Step 3 (F-14): a Collection row is spread through its ITEMS, because
// ==== `$chunk[] = $key` appends to the Collection and `...$chunk` walks the Traversable.
probe('d6-map-spread-collection-row', "\$rows = [new Collection([1, 'a'])]; Arr::mapSpread(\$rows, fn (\$n, \$c, \$k) => \"\$n-\$c-\$k\")", function () {
    $rows = [new Collection([1, 'a']), new Collection([2, 'b'])];
    $listResult = Arr::mapSpread($rows, fn ($n, $c, $k) => "$n-$c-$k");
    $assocRows = ['x' => new Collection([1, 'a']), 'y' => new Collection([2, 'b'])];
    $assocResult = Arr::mapSpread($assocRows, fn ($n, $c, $k) => "$n-$c-$k");

    return [
        'list' => $listResult,
        'assoc' => $assocResult,
        'row-mutated-to' => $rows[0]->all(),
        'collection-mapSpread' => (new Collection([new Collection([1, 'a']), new Collection([2, 'b'])]))
            ->mapSpread(fn ($n, $c, $k) => "$n-$c-$k")->all(),
    ];
});

// ==== Task D6 Step 4c: Arr::set descends by is_array too, so a nested object on the path
// ==== is replaced wholesale rather than written into. The add twin is recorded above.
probe('d6-set-assoc-nested-object-is-replaced-wholesale', "\$src = ['a' => new D4Point(1)]; Arr::set(\$src, 'a.y', 2)", function () {
    $src = ['a' => new D4Point(1)];
    Arr::set($src, 'a.y', 2);

    return [
        'result' => $src,
        'result_type' => get_debug_type($src['a']),
    ];
});

// ==== Task D6 Step 4c: the other half of the descend test — a nested LIST is a container,
// ==== so Arr::add and Arr::set write into it rather than replacing it.
probe('d6-nested-list-is-descended-not-replaced', "\$src = ['a' => ['q']]; Arr::add(\$src, 'a.1', 'y') and Arr::set(\$src, 'a.1', 'y')", function () {
    $added = ['a' => ['q']];
    $addResult = Arr::add($added, 'a.1', 'y');
    $set = ['a' => ['q']];
    Arr::set($set, 'a.1', 'y');

    return ['add' => $addResult, 'set' => $set, 'source-after-add' => $added];
});

// ==== Task D6 Step 5 (F-17): the two combine keys the type prints differently from PHP.
probe('d6-combine-key-cast-minus-zero-and-1e19', "(new Collection([-0.0, 1e19]))->combine([1, 2]): the keys as PHP stores them", function () {
    return array_map(
        fn ($key) => [get_debug_type($key), (string) $key],
        array_keys((new Collection([-0.0, 1e19]))->combine([1, 2])->all())
    );
});

// ==== Task D6 citation audit: the LIST forms of the operand edges the rows above record
// ==== only for a keyed backing, so @tolki/arr's assertions cite a call of their own shape.
probe('d6-list-operand-edges', "(new Collection([1, 2]))->diffKeys([999]) / ->diffKeys(null) / ->diffKeys(new Collection([9])) and the diffUsing / intersectUsing twins", function () {
    $caseless = 'strcasecmp';

    return [
        'diffKeys-value-ignored' => (new Collection([1, 2]))->diffKeys([999])->all(),
        'diffKeys-nullish-operand' => (new Collection([1, 2]))->diffKeys(null)->all(),
        'diffKeys-collection-operand' => (new Collection([1, 2]))->diffKeys(new Collection([9]))->all(),
        'diffUsing-nullish-operand' => (new Collection(['green']))->diffUsing(null, $caseless)->all(),
        'diffUsing-collection-operand' => (new Collection(['green', 'brown']))->diffUsing(new Collection(['GREEN']), $caseless)->all(),
        'intersectUsing-nullish-operand' => (new Collection(['green']))->intersectUsing(null, $caseless)->all(),
        'intersectUsing-collection-operand' => (new Collection(['green', 'brown']))->intersectUsing(new Collection(['GREEN']), $caseless)->all(),
    ];
});

// ==== Task D6 citation audit: prepend onto an EXISTING integer key of a keyed array, and
// ==== the list form of the nested-list descend the row above records for a keyed one.
probe('d6-prepend-existing-integer-key', "Arr::prepend([1 => 'a', 'b' => 2], 'z', 1)", function () {
    $result = Arr::prepend([1 => 'a', 'b' => 2], 'z', 1);

    return ['result' => $result, 'keys' => array_keys($result)];
});
probe('d6-nested-list-in-a-list-is-descended', "\$src = [['q']]; Arr::add(\$src, '0.1', 'y')", function () {
    $src = [['q']];

    return ['add' => Arr::add($src, '0.1', 'y'), 'source-after-add' => $src];
});

// ==== fix-round-2 Group B: Collection::sole with no filter. `unless($filter == null)`
// ==== returns a proxy that SKIPS the forwarded filter, so a falsy sole item survives.
probe('r2-sole-no-filter-keeps-a-falsy-item', "(new Collection([null]))->sole() / ([0]) / ([1,2,3])", function () {
    $count = null;

    try {
        (new Collection([1, 2, 3]))->sole();
    } catch (\Illuminate\Support\MultipleItemsFoundException $e) {
        $count = $e->getMessage();
    }

    return [
        '[null]' => (new Collection([null]))->sole(),
        '[0]' => (new Collection([0]))->sole(),
        "['']" => (new Collection(['']))->sole(),
        '[1,2,3]' => $count,
    ];
});

// ==== fix-round-2 Group C: no recorded row carried the '01.x' shape — a non-canonical index
// ==== HEAD with a rest. The write stores "01" on the array itself and rebuilds no element.
probe('r2-set-noncanonical-index-head-with-rest', "\$a = ['a','b']; Arr::set(\$a, '01.x', 5)", function () {
    $a = ['a', 'b'];
    Arr::set($a, '01.x', 5);

    return [
        'written' => $a,
        'keys' => array_map(fn ($key) => get_debug_type($key) . ':' . $key, array_keys($a)),
    ];
});

// ==== fix-round-3 Group A/E: the whole operatorForWhere operand table. "contains-three-args-
// ==== operator" records only four of the eleven operators, and NO row anywhere in
// ==== docs/php-parity/ records a relational operator against null, or NAN under `<=>`.
probe('r3-operator-table', "(new Collection([['v' => \$retrieved]]))->contains('v', <op>, \$value) for all eleven operators", function () {
    $operators = ['=', '==', '!=', '<>', '<', '>', '<=', '>=', '===', '!==', '<=>'];
    $pairs = [
        '4 vs 4' => [4, 4],
        '4 vs "4"' => [4, '4'],
        'null vs 4' => [null, 4],
        '1 vs null' => [1, null],
        '0 vs null' => [0, null],
        'null vs null' => [null, null],
        '-1 vs null' => [-1, null],
        '"abc" vs null' => ['abc', null],
        '"" vs null' => ['', null],
        '"10" vs "9"' => ['10', '9'],
        'NAN vs 1' => [NAN, 1],
        '1 vs NAN' => [1, NAN],
        'NAN vs NAN' => [NAN, NAN],
    ];

    $table = [];

    foreach ($pairs as $name => [$retrieved, $value]) {
        foreach ($operators as $operator) {
            $table[$name][$operator] = (new Collection([['v' => $retrieved]]))->contains('v', $operator, $value);
        }
    }

    // The raw operators too: `contains` only reports the truthiness of `<=>`, and the
    // int is what says an uncomparable pair answers 1 rather than 0.
    $table['raw spaceship'] = [
        '1 <=> null' => 1 <=> null,
        'null <=> 1' => null <=> 1,
        'NAN <=> 1' => NAN <=> 1,
        '1 <=> NAN' => 1 <=> NAN,
        'NAN <=> NAN' => NAN <=> NAN,
        '0 <=> null' => 0 <=> null,
        '-1 <=> null' => -1 <=> null,
    ];

    return $table;
});

// ==== fix-round-3 Group E: obj.spec's citations pointed at the list-backed rows above.
// ==== PHP's array is both, so the same calls keyed by string record the record backing.
probe('r3-assoc-backed-contains', "(new Collection(['a'=>['v'=>1],'b'=>['v'=>3],'c'=>['v'=>'4'],'d'=>['v'=>5]]))->contains(...) and the containsStrict twins", function () {
    $rows = ['a' => ['v' => 1], 'b' => ['v' => 3], 'c' => ['v' => '4'], 'd' => ['v' => 5]];
    $three = ['a' => ['v' => 1], 'b' => ['v' => 3], 'c' => ['v' => 5]];

    return [
        'operator' => [
            "'='" => (new Collection($rows))->contains('v', '=', 4),
            "'=='" => (new Collection($rows))->contains('v', '==', 4),
            "'==='" => (new Collection($rows))->contains('v', '===', 4),
            "'>'" => (new Collection($rows))->contains('v', '>', 4),
        ],
        'key-value' => [
            '1' => (new Collection($three))->contains('v', 1),
            '2' => (new Collection($three))->contains('v', 2),
        ],
        'null-key' => [
            '> 1' => (new Collection(['a' => 1, 'b' => 2]))->contains(null, '>', 1),
            '> 9' => (new Collection(['a' => 1, 'b' => 2]))->contains(null, '>', 9),
        ],
        'containsStrict-numeric-string' => [
            "'02'" => (new Collection(['a' => 1, 'b' => 3, 'c' => 5, 'd' => '02']))->containsStrict('02'),
            '2' => (new Collection(['a' => 1, 'b' => 3, 'c' => 5, 'd' => '02']))->containsStrict(2),
        ],
        'containsStrict-two-args' => [
            'array' => (new Collection(['r' => ['tags' => ['a', 'b']]]))->containsStrict('tags', ['a', 'b']),
            'reordered' => (new Collection(['r' => ['t' => ['x' => 1, 'y' => 2]]]))->containsStrict('t', ['y' => 2, 'x' => 1]),
            'null' => (new Collection(['r' => ['name' => null], 's' => ['name' => 'x']]))->containsStrict('name', null),
            'null-missing' => (new Collection(['r' => ['a' => 1]]))->containsStrict('name', null),
            'null-none' => (new Collection(['r' => ['name' => 'x']]))->containsStrict('name', null),
        ],
        'containsStrict-callback-null' => (new Collection(['a' => null, 'b' => 1]))->containsStrict(fn ($value) => $value === null),
    ];
});

// ==== fix-round-3 Group E: the two LIST-backed twins arr.spec needs. "contains-two-args-
// ==== key-value" records only the matching value, and the callback row is record-backed.
probe('r3-list-backed-contains', "(new Collection([['v'=>1],['v'=>3],['v'=>5]]))->contains('v', 2) and (new Collection([null, 1]))->containsStrict(fn (\$v) => is_null(\$v))", fn () => [
    'key-value-no-match' => (new Collection([['v' => 1], ['v' => 3], ['v' => 5]]))->contains('v', 2),
    'containsStrict-callback-null' => (new Collection([null, 1]))->containsStrict(fn ($v) => is_null($v)),
]);

// ==== fix-round-3 Group E: the record-backed twins of the three list rows obj.spec cites.
probe('r3-assoc-backed-leaf-rules', "Arr::flatten(['a' => \$o]), Arr::collapse(['g2' => \$o]), array_replace_recursive(['a' => \$o], ['a' => ['x' => 5]])", function () {
    $sized = new class
    {
        public $x = 1;

        public $y = 2;
    };

    $flattened = Arr::flatten(['a' => $sized]);

    return [
        'flatten-single-object-entry' => [
            'count' => count($flattened),
            'kept' => $flattened[0] === $sized,
        ],
        'collapse-only-object-assoc' => Arr::collapse(['g2' => $sized]),
        'replaceRecursive-object-under-array' => array_replace_recursive(['a' => $sized], ['a' => ['x' => 5]]),
    ];
});

// ==== fix-round-3 Group E: obj-writes.test-d.ts:149 asserted a prepend call this row
// ==== never recorded, and :169's `-0.5` note had no probe behind it at all.
probe('r3-prepend-extra-keys', "Arr::prepend([1 => 'a', 2 => 'b', 'c' => 3], 'z', 2) and @Arr::prepend(['a' => 1], 'v', -0.5)", function () {
    $middle = Arr::prepend([1 => 'a', 2 => 'b', 'c' => 3], 'z', 2);
    $minusHalf = @Arr::prepend(['a' => 1], 'v', -0.5);

    return [
        'existing-integer-key-2' => [
            'result' => $middle,
            'keys' => array_map(fn ($key) => get_debug_type($key) . ':' . $key, array_keys($middle)),
        ],
        'negative-float-above-minus-one' => [
            'result' => $minusHalf,
            'keys' => array_map(fn ($key) => get_debug_type($key) . ':' . $key, array_keys($minusHalf)),
        ],
    ];
});

// ==== fix-round-3 Group B/F: a BOOLEAN value in contains' key/value form, which this port's
// ==== `strict` parameter occupies, plus the non-string operator and the null-key form.
probe('r3-contains-boolean-value', "(new Collection([['active'=>true],['active'=>false]]))->contains('active', true) and the forms around it", function () {
    $rows = [['active' => true], ['active' => false]];
    $mixed = ['date', 'class', ['foo' => 50], ''];

    return [
        'key-true' => (new Collection($rows))->contains('active', true),
        'key-false' => (new Collection($rows))->contains('active', false),
        'key-true-no-match' => (new Collection([['active' => false]]))->contains('active', true),
        'key-operator-true' => (new Collection($rows))->contains('active', '=', true),
        // The reading that treats a member-less string key as a path: PHP does NOT take it
        // for containsStrict, which is why CollectionTest asserts false here.
        'containsStrict-key-of-a-row' => (new Collection($mixed))->containsStrict('foo'),
        'contains-key-of-a-row' => (new Collection($mixed))->contains('foo'),
        // A non-string operator misses every case arm and lands on `default:`, an `=`.
        'non-string-operator' => (new Collection([['v' => 5], ['v' => 6]]))->contains('v', 5, 6),
        'null-key-operator' => (new Collection([['v' => 1], ['v' => 3], ['v' => 5]]))->contains(null, '>', 1),
        'diffKeysUsing-nullish-operand' => (new Collection([1, 2]))->diffKeysUsing(null, 'strcasecmp'),
    ];
});

// ==== fix-round-3 Group C: no row records Arr::set descending a LIST backing into a nested
// ==== object. "add-nested-object-is-replaced-wholesale" records only the Arr::add twin.
probe('r3-set-list-nested-object-is-replaced-wholesale', "\$src = [new D4Point(1)]; Arr::set(\$src, '0.y', 2)", function () {
    $src = [new D4Point(1)];
    Arr::set($src, '0.y', 2);

    return [
        'result' => $src,
        'result_type' => get_debug_type($src[0]),
    ];
});

// ==== fix-round-4 Group A: "r3-operator-table" pairs NAN only with numbers, so nothing
// ==== recorded that PHP casts BOTH sides to bool against a bool or null, NAN included.
probe('r4-nan-bool-null-table', "(new Collection([['v' => NAN]]))->contains('v', <op>, true|false|null) for all eleven operators", function () {
    $operators = ['=', '==', '!=', '<>', '<', '>', '<=', '>=', '===', '!==', '<=>'];
    $pairs = [
        'NAN vs true' => [NAN, true],
        'true vs NAN' => [true, NAN],
        'NAN vs false' => [NAN, false],
        'false vs NAN' => [false, NAN],
        'NAN vs null' => [NAN, null],
        'null vs NAN' => [null, NAN],
    ];

    $table = [];

    foreach ($pairs as $name => [$retrieved, $value]) {
        foreach ($operators as $operator) {
            $table[$name][$operator] = (new Collection([['v' => $retrieved]]))->contains('v', $operator, $value);
        }
    }

    // The raw ints too: `contains` only reports the truthiness of `<=>`, and 0 is what
    // says `NAN <=> true` is an ORDERED tie rather than the 1 an uncomparable pair gives.
    $table['raw spaceship'] = [
        'NAN <=> true' => NAN <=> true,
        'true <=> NAN' => true <=> NAN,
        'NAN <=> false' => NAN <=> false,
        'false <=> NAN' => false <=> NAN,
        'NAN <=> null' => NAN <=> null,
        'null <=> NAN' => null <=> NAN,
    ];

    return $table;
});

// ==== fix-round-4 Group C: nothing recorded `===`/`!==` over two ARRAYS. PHP compares those
// ==== by value (keys, order and types), and only a real object by identity.
probe('r4-strict-operators', "(new Collection([['v' => \$retrieved]]))->contains('v', '==='|'!==', \$value) over arrays and objects", function () {
    $point = new D4Point(1);
    $stamp = new DateTimeImmutable('@0');

    $pairs = [
        '[1,2] vs [1,2]' => [[1, 2], [1, 2]],
        '[1,2] vs [1,"2"]' => [[1, 2], [1, '2']],
        '[1,2] vs [2,1]' => [[1, 2], [2, 1]],
        '[] vs []' => [[], []],
        "['a'=>1,'b'=>2] vs the same pairs" => [['a' => 1, 'b' => 2], ['a' => 1, 'b' => 2]],
        "['a'=>1,'b'=>2] vs the same pairs reordered" => [['a' => 1, 'b' => 2], ['b' => 2, 'a' => 1]],
        '[[1]] vs [[1]]' => [[[1]], [[1]]],
        'D4Point(1) vs another D4Point(1)' => [$point, new D4Point(1)],
        'D4Point(1) vs itself' => [$point, $point],
        'DateTimeImmutable@0 vs another' => [$stamp, new DateTimeImmutable('@0')],
        '[1,2] vs 1' => [[1, 2], 1],
    ];

    $table = [];

    foreach ($pairs as $name => [$retrieved, $value]) {
        foreach (['=', '==', '!=', '<>', '===', '!=='] as $operator) {
            $table[$name][$operator] = (new Collection([['v' => $retrieved]]))->contains('v', $operator, $value);
        }
    }

    return $table;
});

// ==== fix-round-4 Group B: operatorForWhere's `is_object` guard. An ARRAY never reaches it,
// ==== so the port's plain object — which models an array — must not either.
probe('r4-object-scalar-guard', "(new Collection([['v' => \$retrieved]]))->contains('v', <op>, \$value) over object/array against scalar", function () {
    $operators = ['=', '==', '!=', '<>', '<', '>', '<=', '>=', '===', '!==', '<=>'];
    $pairs = [
        'stdClass vs ""' => [new D4Point(1), ''],
        '"" vs stdClass' => ['', new D4Point(1)],
        '"abc" vs stdClass' => ['abc', new D4Point(1)],
        'stdClass vs "abc"' => [new D4Point(1), 'abc'],
        'stdClass vs true' => [new D4Point(1), true],
        'assoc array vs "abc"' => [['x' => 1], 'abc'],
        '"abc" vs assoc array' => ['abc', ['x' => 1]],
        'assoc array vs true' => [['x' => 1], true],
        'empty array vs null' => [[], null],
        'empty array vs "abc"' => [[], 'abc'],
    ];

    $table = [];

    foreach ($pairs as $name => [$retrieved, $value]) {
        foreach ($operators as $operator) {
            $table[$name][$operator] = (new Collection([['v' => $retrieved]]))->contains('v', $operator, $value);
        }
    }

    return $table;
});

// ==== fix-round-4 Group D: undot's non-array backings. Collection::undot() runs Arr::undot over
// ==== $this->all(), so the wrap is what decides — no row recorded any of these four.
probe('r4-undot-backings', "(new Collection(5|'a.b'|new ArrayIterator(['a.b'])|null|true))->undot()", fn () => [
    'int' => (new Collection(5))->undot(),
    'string' => (new Collection('a.b'))->undot(),
    'traversable' => (new Collection(new ArrayIterator(['a.b'])))->undot(),
    'null' => (new Collection(null))->undot(),
    'bool' => (new Collection(true))->undot(),
    'list' => (new Collection([1, 2, 3]))->undot(),
]);

emit();
