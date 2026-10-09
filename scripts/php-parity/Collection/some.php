<?php

/**
 * Ground truth for Collection::some().
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

emit();
