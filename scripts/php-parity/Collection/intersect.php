<?php

/**
 * Ground truth for Collection::intersect().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('intersect — values only, left keys', '$c->intersect([...])', function () {
    return (new Collection(['id' => 1, 'first_word' => 'Hello']))
        ->intersect(['first_world' => 'Hello', 'last_word' => 'World'])->all();
});

probe('intersect(null)', '$c->intersect(null)', function () {
    return (new Collection(['id' => 1]))->intersect(null)->all();
});

probe('intersect on array-backed collection', '$c->intersect([2,4,6])', function () {
    return (new Collection([1, 2, 3, 4]))->intersect([2, 4, 6])->all();
});

probe('X12 intersect compares values only', 'collect([10,20,30,40])->intersect([20,40])', function () {
    return (new Collection(nums()))->intersect([20, 40])->all();
});

probe('X14 intersect variants treat null as empty', 'collect([10,20,30,40])->intersect(null)', function () {
    return [
        'intersect' => (new Collection(nums()))->intersect(null)->all(),
        'intersectAssoc' => (new Collection(nums()))->intersectAssoc(null)->all(),
        'intersectByKeys' => (new Collection(nums()))->intersectByKeys(null)->all(),
    ];
});

probe('intersect accepts an operand of any shape', 'collect([1])->intersect(["x"=>1])', function () {
    return [
        'list_data_assoc_other' => (new Collection([1]))->intersect(['x' => 1])->all(),
        'assoc_data_list_other' => (new Collection(['a' => 1]))->intersect([1])->all(),
        'assoc_data_list_other_two' => (new Collection(['a' => 1, 'b' => 2]))->intersect([2])->all(),
        'nums_assoc_other' => (new Collection([10, 20, 30, 40]))->intersect(['a' => 20, 'b' => 40])->all(),
        'null_data_list_other' => (new Collection(null))->intersect([1, 2])->all(),
        'assoc_data_scalar_other' => (new Collection(['a' => 1, 'b' => 'x']))->intersect('x')->all(),
        'list_data_scalar_other' => (new Collection([1, 'x']))->intersect('x')->all(),
        'assoc_data_null_other' => (new Collection(['a' => 1]))->intersect(null)->all(),
    ];
});
probe('intersect with a Collection operand', 'collect(["a"=>10,"b"=>20])->intersect(collect([20]))', fn () => collect(['a' => 10, 'b' => 20])->intersect(collect([20]))->all());

// C2 — intersect over object items
probe('intersect over array items collapses to "Array"', 'collect([["id"=>1],["id"=>2]])->intersect([["id"=>1]])', fn () => collect([['id' => 1], ['id' => 2]])->intersect([['id' => 1]])->all());

// ==== C10: a scalar backing on the key-aware setops. dataDiffAssoc, dataIntersectAssoc and
// dataIntersectByKeys handed a scalar straight to arr instead of wrapping it, so they answered
// empty. Collection wraps a scalar as a one-item list, which is what dispatch's arrWrap does.

probe('intersect-scalar-backing', "(new Collection(5))->intersect([5])", fn () => (new Collection(5))->intersect([5])->all());
// The same question one level down: a set operation's OPERAND. PHP never calls the
// member, so the Closure stays a value and array_intersect's string cast kills it.
probe(
    'plain-object-toArray-member-as-an-operand-is-never-unwrapped',
    "collect(['b' => 2, 'c' => 3])->intersect((object) ['toArray' => fn () => [9], 'b' => 2])",
    fn () => collect(['b' => 2, 'c' => 3])->intersect((object) ['toArray' => fn () => [9], 'b' => 2])->all(),
);

emit();
