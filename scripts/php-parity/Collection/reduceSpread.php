<?php

/**
 * Ground truth for Collection::reduceSpread().
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

// reduceSpread
probe('C32-H-reduceSpread-throws-boolean', "(new Collection([1]))->reduceSpread(fn () => false, null)", fn () => (new Collection([1]))->reduceSpread(fn () => false, null));
probe('C32-H-reduceSpread-throws-integer', "(new Collection([1]))->reduceSpread(fn () => 5, null)", fn () => (new Collection([1]))->reduceSpread(fn () => 5, null));
probe('C32-H-reduceSpread-throws-double', "(new Collection([1]))->reduceSpread(fn () => 1.5, null)", fn () => (new Collection([1]))->reduceSpread(fn () => 1.5, null));
probe('C32-H-reduceSpread-throws-null', "(new Collection([1]))->reduceSpread(fn () => null, null)", fn () => (new Collection([1]))->reduceSpread(fn () => null, null));
probe('C32-H-reduceSpread-throws-string', "(new Collection([1]))->reduceSpread(fn () => 'x', null)", fn () => (new Collection([1]))->reduceSpread(fn () => 'x', null));
probe('C32-H-reduceSpread-throws-object', "(new Collection([1]))->reduceSpread(fn () => new stdClass, null)", fn () => (new Collection([1]))->reduceSpread(fn () => new stdClass, null));
probe('C32-H-reduceSpread-subclass-message', "(new C32ASub([1]))->reduceSpread(fn () => false, null)", fn () => (new C32ASub([1]))->reduceSpread(fn () => false, null));
probe('C32-H-reduceSpread-list-key-type', "(new Collection(['a', 'b']))->reduceSpread(fn (\$acc, \$v, \$k) => [\$acc.gettype(\$k).\$k], '')", fn () => (new Collection(['a', 'b']))->reduceSpread(fn ($acc, $v, $k) => [$acc.gettype($k).$k], ''));
probe('C32-H-reduceSpread-empty', "(new Collection([]))->reduceSpread(fn () => false, 1, 2)", fn () => (new Collection([]))->reduceSpread(fn () => false, 1, 2));

emit();
