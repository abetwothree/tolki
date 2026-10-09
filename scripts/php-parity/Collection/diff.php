<?php

/**
 * Ground truth for Collection::diff().
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

probe('diff — values only', '$c->diff(["x"=>"Hello"])', function () {
    return (new Collection(['id' => 1, 'first_word' => 'Hello']))
        ->diff(['x' => 'Hello'])->all();
});

probe('diff is case-sensitive', '$c->diff([...])', function () {
    return (new Collection(['en_GB', 'fr', 'HR']))->diff(['en_gb', 'hr'])->all();
});

probe('diff(null) returns items unchanged', '$c->diff(null)', function () {
    return (new Collection(['id' => 1, 'first_word' => 'Hello']))->diff(null)->all();
});

probe('diff on array-backed collection', '$c->diff([2,4])', function () {
    return (new Collection([1, 2, 3, 4]))->diff([2, 4])->all();
});

// Task 12 (parity-review-fixes) — C5: diff must accept a mismatched operand
// shape instead of treating an array `other` as absent. C6: intersect* must
// treat a nullish first operand as empty, like diff already does.
probe('diff and intersect accept any array operand', 'collect(["a"=>10,"b"=>20])->diff([20])', function () {
    return [
        'assoc_diff_list' => (new Collection(['a' => 10, 'b' => 20]))->diff([20])->all(),
        'list_diff_assoc' => (new Collection([10, 20]))->diff(['x' => 20])->all(),
        'assoc_intersect_list' => (new Collection(['a' => 1, 'b' => 2]))->intersect([2])->all(),
        'list_intersect_assoc' => (new Collection([10, 20]))->intersect(['x' => 20])->all(),
        'null_intersect' => (new Collection(null))->intersect(['a' => 1])->all(),
        'null_diff' => (new Collection(null))->diff(['a' => 1])->all(),
    ];
});

probe('X13 diff compares values only', 'collect([10,20,30,40])->diff([20,40])', function () {
    return (new Collection(nums()))->diff([20, 40])->all();
});

// Collection::diff/intersect both run getArrayableItems() over the operand, so
// an operand of any shape - list, assoc, scalar, null - is defined behaviour.
probe('diff accepts an operand of any shape', 'collect(null)->diff([1,2])', function () {
    return [
        'null_data_list_other' => (new Collection(null))->diff([1, 2])->all(),
        'list_data_assoc_other' => (new Collection([10, 20]))->diff(['x' => 20])->all(),
        'assoc_data_list_other' => (new Collection(['a' => 10, 'b' => 20]))->diff([20])->all(),
        'assoc_data_scalar_other' => (new Collection(['a' => 1, 'b' => 'x']))->diff('x')->all(),
        'list_data_scalar_other' => (new Collection([1, 'x']))->diff('x')->all(),
        'list_data_int_other' => (new Collection([1, 2]))->diff(2)->all(),
        'assoc_data_null_other' => (new Collection(['a' => 1]))->diff(null)->all(),
        'list_data_null_other' => (new Collection([1, 2]))->diff(null)->all(),
    ];
});

// C1 — getArrayableItems operand unwrapping
probe('diff with a Collection operand', 'collect(["a"=>10,"b"=>20])->diff(collect([20]))', fn () => collect(['a' => 10, 'b' => 20])->diff(collect([20]))->all());
probe('diff with a Traversable operand', 'collect(["a"=>10,"b"=>20])->diff(new ArrayIterator([20]))', fn () => collect(['a' => 10, 'b' => 20])->diff(new ArrayIterator([20]))->all());
probe('getArrayableItems rejects a bare object', 'collect([1])->diff(new stdClass())', fn () => collect([1])->diff(new stdClass())->all());
probe('diff over array items collapses to "Array"', 'collect([["id"=>1],["id"=>2]])->diff([["id"=>1]])', fn () => collect([['id' => 1], ['id' => 2]])->diff([['id' => 1]])->all());
probe('C21 diff collection', '(new Collection([\'id\' => 1, \'first_word\' => \'Hello\']))->diff(new Collection([\'first_word\' => \'Hello\', \'last_word\' => \'World\']))->all()', fn () => (new Collection(['id' => 1, 'first_word' => 'Hello']))->diff(new Collection(['first_word' => 'Hello', 'last_word' => 'World']))->all());
probe('order-diff-leaves-the-receiver-alone', "\$c = collect([1, 2, 3]); \$c->diff([7 => 'x', 3 => 'y']); \$c", function () {
    $c = collect([1, 2, 3]);
    $c->diff([7 => 'x', 3 => 'y']);

    return d8Views($c);
});
probe('diff-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->diff(['a'])", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->diff(['a'])->all()));
probe('C32-F-plain-object-all-member-is-data-by-value', "collect(['a', 'b'])->diff((object) ['all' => \$invokable]) / ->intersect(...), \$invokable answering ['b'] when called and 'zzz' as a string, since array_diff cannot cast a Closure; ->intersectUsing((object) ['all' => fn () => ['b']], fn (\$x, \$y) => \$x === \$y ? 0 : 1); collect(['a' => 1])->replaceRecursive((object) ['all' => fn () => ['b' => 2]]) keys", function () {
    $invokable = new class { public function __invoke() { return ['b']; } public function __toString(): string { return 'zzz'; } };

    return [
        'diff' => collect(['a', 'b'])->diff((object) ['all' => $invokable])->all(),
        'intersect' => collect(['a', 'b'])->intersect((object) ['all' => $invokable])->all(),
        'intersectUsing' => collect(['a', 'b'])->intersectUsing((object) ['all' => fn () => ['b']], fn ($x, $y) => $x === $y ? 0 : 1)->all(),
        'replaceRecursiveKeys' => collect(['a' => 1])->replaceRecursive((object) ['all' => fn () => ['b' => 2]])->keys()->all(),
    ];
});

emit();
