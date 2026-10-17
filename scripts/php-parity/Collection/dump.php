<?php

/**
 * Ground truth for Collection::dump().
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

// --- dump (VarDumper's output is discarded so it stays out of the transcript)
probe('C32-A-dump-returns-same-instance', '$c = collect([1]); $c->dump() === $c', function () {
    VarDumper::setHandler(fn () => null);

    try {
        $c = collect([1]);

        return $c->dump() === $c;
    } finally {
        VarDumper::setHandler(null);
    }
});

emit();
