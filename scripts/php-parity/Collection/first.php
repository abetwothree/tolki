<?php

/**
 * Ground truth for Collection::first().
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

// ==== F-25 Stage 2: the POSITIONAL READERS, which answer by insertion order, not by key ====
probe('order-first', 'collect(base)->first()', fn () => collect(d8Base())->first());
probe('order-first-callback', "collect(base)->first(fn (\$v) => \$v !== 'c')", fn () => collect(d8Base())->first(fn ($v) => $v !== 'c'));
probe('order-first-callback-key-order', '$c = collect(base); $c->first(recording $key)', function () {
    $seen = [];
    collect(d8Base())->first(function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return false;
    });

    return $seen;
});
probe('order-first-no-match-default', "collect(base)->first(fn (\$v) => false, 'fallback')", fn () => collect(d8Base())->first(fn ($v) => false, 'fallback'));
probe('C32-C-ordered-first-last-callback-php-truthiness', "(new Collection([2 => 'a', 0 => 'b']))->first(\$cb) / last(\$cb), \$cb answering '0', [] and new DateTime('@0')", fn () => [
    'first' => c32c_truthiness(fn ($cb) => (new Collection([2 => 'a', 0 => 'b']))->first($cb)),
    'last' => c32c_truthiness(fn ($cb) => (new Collection([2 => 'a', 0 => 'b']))->last($cb)),
]);
probe('C32-C-first-empty-no-default', '(new Collection([]))->first() / (new Collection(["a" => null]))->first(null, "d")', fn () => [
    (new Collection([]))->first(),
    (new Collection(['a' => null]))->first(null, 'd'),
]);

emit();
