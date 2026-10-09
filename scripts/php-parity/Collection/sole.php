<?php

/**
 * Ground truth for Collection::sole().
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
probe('C32-C-multiple-items-found-count', '(new MultipleItemsFoundException(2))->count / getCount()', function () {
    $e = new \Illuminate\Support\MultipleItemsFoundException(2);

    return [$e->count, $e->getCount()];
});

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

emit();
