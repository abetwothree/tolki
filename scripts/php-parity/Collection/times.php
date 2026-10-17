<?php

/**
 * Ground truth for Collection::times().
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

// --- times
probe('C32-A-times-fractional-count', 'Collection::times(2.7)->all()', fn () => Collection::times(2.7)->all());
probe('C32-A-times-non-finite-count', 'Collection::times(NAN), times(INF) and times(-INF)', fn () => array_map(function ($count) {
    try {
        return Collection::times($count)->all();
    } catch (\Throwable $e) {
        return [get_class($e), $e->getMessage()];
    }
}, [NAN, INF, -INF]));
probe('C32-A-times-past-maximum-array-size', 'Collection::times(1e19), times(2147483648) and times(1073741824): the class and message thrown', fn () => array_map(fn ($count) => c32c_outcome(fn () => Collection::times($count)->all()), ['1e19' => 1e19, '2147483648' => 2147483648, '1073741824' => 1073741824]));

emit();
