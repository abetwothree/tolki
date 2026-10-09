<?php

/**
 * Ground truth for Collection::unless().
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

probe('C32-H-unless-php-falsy-values', "[unless('0', fn () => 'called'), unless([], fn () => 'called')]", fn () => [(new Collection([1]))->unless('0', fn () => 'called'), (new Collection([1]))->unless([], fn () => 'called')]);
probe('C32-H-unless-null-callback-throws', "(new Collection([1]))->unless(false, null)", fn () => (new Collection([1]))->unless(false, null));

emit();
