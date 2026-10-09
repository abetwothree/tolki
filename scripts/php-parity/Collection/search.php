<?php

/**
 * Ground truth for Collection::search().
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

// The core defect: an array needle against a list of arrays.
search('search-array-needle-strict', "collect([[1,2],[3]])->search([1,2], true)", [[1, 2], [3]], [1, 2], true);
search('search-array-needle-loose', "collect([[1,2],[3]])->search([1,2], false)", [[1, 2], [3]], [1, 2], false);
search('search-array-needle-wrong-order-strict', "collect([[1,2]])->search([2,1], true)", [[1, 2]], [2, 1], true);
search('search-empty-array-needle-loose', "collect([[]])->search([], false)", [[]], [], false);

// Keyed needle against a keyed backing: the answer is the record's own key.
search('search-keyed-needle-strict', "collect(['x'=>['a'=>1]])->search(['a'=>1], true)", ['x' => ['a' => 1]], ['a' => 1], true);
search('search-keyed-needle-loose', "collect(['x'=>['a'=>1]])->search(['a'=>1], false)", ['x' => ['a' => 1]], ['a' => 1], false);

// `===` on arrays is key-ORDER sensitive; `==` is not. This is the pair that
// separates `strictEqual` from `looseEqual` in @tolki/utils.
search('search-reordered-keys-strict', "collect([['b'=>2,'a'=>1]])->search(['a'=>1,'b'=>2], true)", [['b' => 2, 'a' => 1]], ['a' => 1, 'b' => 2], true);
search('search-reordered-keys-loose', "collect([['b'=>2,'a'=>1]])->search(['a'=>1,'b'=>2], false)", [['b' => 2, 'a' => 1]], ['a' => 1, 'b' => 2], false);

// `===` on arrays compares element TYPES too; `==` casts them.
search('search-numeric-string-element-strict', "collect([[1,2]])->search([1,'2'], true)", [[1, 2]], [1, '2'], true);
search('search-numeric-string-element-loose', "collect([[1,2]])->search([1,'2'], false)", [[1, 2]], [1, '2'], false);

// Scalar needles, the cells the port already agreed on, kept as a control.
search('search-int-needle-on-numeric-string-strict', "collect(['1',2])->search(1, true)", ['1', 2], 1, true);
search('search-int-needle-on-numeric-string-loose', "collect(['1',2])->search(1, false)", ['1', 2], 1, false);
search('search-string-needle-strict', "collect([0,'a'])->search('a', true)", [0, 'a'], 'a', true);
search('search-string-needle-loose', "collect([0,'a'])->search('a', false)", [0, 'a'], 'a', false);

// PHP's `0 == null` is true, which JavaScript's `==` denies.
search('search-null-needle-on-zero-strict', "collect([0])->search(null, true)", [0], null, true);
search('search-null-needle-on-zero-loose', "collect([0])->search(null, false)", [0], null, false);
probe('search-traversable-backing', "collect(gen(1,2))->search(2)", fn () => (new Collection(traversable()))->search(2));

// ---- 4. Search and predicates.
probe('search-out-of-order-duplicate-value', "(new Collection([2 => 'x', 0 => 'x', 1 => 'y']))->search('x')", fn () => (new Collection([2 => 'x', 0 => 'x', 1 => 'y']))->search('x'));
probe('search-mixed-duplicate-value', "(new Collection(['x' => 'v', 0 => 'v', 'y' => 'w']))->search('v')", fn () => (new Collection(['x' => 'v', 0 => 'v', 'y' => 'w']))->search('v'));
probe('search-out-of-order-callback', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->search(fn () => true)", fn () => (new Collection(OUT_OF_ORDER))->search(fn () => true));
probe('search-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->search(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->search($cb), false));
probe('search-out-of-order-early-exit-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->search(fn (\$v, \$k) => \$v === 'a') => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->search($cb), fn ($v) => $v === 'a'));
probe('search-mixed-callback', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->search(fn () => true)", fn () => (new Collection(MIXED))->search(fn () => true));
probe('search-mixed-callback-order', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->search(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(MIXED))->search($cb), false));
// [5 => 'a', 0 => 'b', '5' => 'c'] is [5 => 'c', 0 => 'b']: 'a' is gone, and 'c' sits first.
probe('search-collision', "(new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->search('a')", fn () => (new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->search('a'));
probe('search-collision-callback-order', "(new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->search(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->search($cb), false));
probe('C32-C-search-numeric-string-record-key', 'gettype and value of (new Collection(["1" => "a", "x" => "b"]))->search("a")', function () {
    $key = (new Collection(['1' => 'a', 'x' => 'b']))->search('a');

    return [gettype($key), $key];
});

emit();
