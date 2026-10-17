<?php

/**
 * Ground truth for Collection::every().
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

// ==== the same insertion order drives the two predicate readers ====
probe('every-out-of-order-key-order', '$keys seen by collect(base)->every($cb returning true)', function () {
    $seen = [];
    collect(e0Base())->every(function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return true;
    });

    return $seen;
});

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
probe('C32-C-every-null-operator', "(new Collection([['x' => 5], ['x' => '5']]))->every('x', null, 5) / (new Collection([['x' => 5], ['x' => 6]]))->every('x', null, 5)", fn () => [
    (new Collection([['x' => 5], ['x' => '5']]))->every('x', null, 5),
    (new Collection([['x' => 5], ['x' => 6]]))->every('x', null, 5),
]);

emit();
