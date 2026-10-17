<?php

/**
 * Ground truth for the static factories a Collection subclass inherits.
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

// --- static factories keep the subclass
probe('C32-A-static-factories-keep-subclass', 'get_class of C32ASub::make/wrap/empty/range/times/times(cb)/fromJson', fn () => [
    'make' => get_class(C32ASub::make([1])),
    'wrap' => get_class(C32ASub::wrap([1])),
    'empty' => get_class(C32ASub::empty()),
    'range' => get_class(C32ASub::range(1, 3)),
    'times' => get_class(C32ASub::times(3)),
    'times-callback' => get_class(C32ASub::times(3, fn ($i) => $i * 10)),
    'fromJson' => get_class(C32ASub::fromJson('[1]')),
]);

emit();
