<?php

/**
 * Ground truth for Collection::toArray().
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

probe('C32-A-toArray-plain-item-members-are-data', "\$item = collect([['toArray' => fn () => [9], 'b' => 2]])->toArray()[0]; [array_keys(\$item), \$item['b']]", function () { $item = collect([['toArray' => fn () => [9], 'b' => 2]])->toArray()[0]; return [array_keys($item), $item['b']]; });

emit();
