<?php

/**
 * Ground truth for Collection::doesntContainStrict().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

probe('doesntContainStrict-list-null-callback', '(new Collection([1, null, 2]))->doesntContainStrict(fn ($v) => is_null($v))', fn () => (new Collection([1, null, 2]))->doesntContainStrict(fn ($v) => is_null($v)));
probe('C32-C-doesntContainStrict-three-args', "(new Collection([['v' => 1]]))->doesntContainStrict('v', 1) / doesntContainStrict('v', '=', 1) / (new Collection(['v']))->doesntContainStrict('v', '=', 1): with a third argument containsStrict() reads the key alone", fn () => [
    (new Collection([['v' => 1]]))->doesntContainStrict('v', 1),
    (new Collection([['v' => 1]]))->doesntContainStrict('v', '=', 1),
    (new Collection(['v']))->doesntContainStrict('v', '=', 1),
]);

emit();
