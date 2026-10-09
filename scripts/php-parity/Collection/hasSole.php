<?php

/**
 * Ground truth for Collection::hasSole().
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
probe('C32-C-hasSole-hasMany-keep-falsy-items', '(new Collection([0]))->hasSole() / (new Collection([null]))->hasSole() / (new Collection([0, null]))->hasMany()', fn () => [
    (new Collection([0]))->hasSole(),
    (new Collection([null]))->hasSole(),
    (new Collection([0, null]))->hasMany(),
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

emit();
