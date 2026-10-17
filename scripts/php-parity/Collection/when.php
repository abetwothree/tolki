<?php

/**
 * Ground truth for Collection::when().
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

// when / unless (Conditionable)
probe('C32-H-when-php-falsy-values', "[when('0', ...) === \$c, when([], ...) === \$c]", function () { $c = new Collection([1]); return [$c->when('0', fn () => 'called') === $c, $c->when([], fn () => 'called') === $c]; });
probe('C32-H-when-null-callback-throws', "(new Collection([1]))->when(true, null)", fn () => (new Collection([1]))->when(true, null));
probe('C32-H-when-unless-null-callback-untaken', "[\$c->when(false, null) === \$c, \$c->unless(true, null) === \$c]", function () { $c = new Collection([1]); return [$c->when(false, null) === $c, $c->unless(true, null) === $c]; });
probe('C32-H-when-default-receives-value', "(new Collection([1]))->when(0, fn () => 'cb', fn (\$c, \$v) => var_export(\$v, true))", fn () => (new Collection([1]))->when(0, fn () => 'cb', fn ($c, $v) => var_export($v, true)));
probe('C32-H-when-callback-returns-scalar', "[when(true, fn () => false), when(true, fn () => 42)]", fn () => [(new Collection([1]))->when(true, fn () => false), (new Collection([1]))->when(true, fn () => 42)]);
probe('C32-H-when-closure-value', "(new Collection([1, 2]))->when(fn (\$c) => \$c->count(), fn (\$c, \$v) => \$v * 10)", fn () => (new Collection([1, 2]))->when(fn ($c) => $c->count(), fn ($c, $v) => $v * 10));
probe('C32-H-when-callable-string-value-not-invoked', "(new Collection([1]))->when('strlen', fn (\$c, \$v) => \$v)", fn () => (new Collection([1]))->when('strlen', fn ($c, $v) => $v));

emit();
