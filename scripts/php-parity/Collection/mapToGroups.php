<?php

/**
 * Ground truth for Collection::mapToGroups().
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
probe('C32-E-mapToGroups-int-key-order', "collect([3, 1, 3])->mapToGroups(fn (\$v, \$k) => [\$v => \$k])", fn () => c32e_pairs((new Collection([3, 1, 3]))->mapToGroups(fn ($v, $k) => [$v => $k])));

emit();
