<?php

/**
 * Ground truth for Collection::pipeThrough().
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

// pipeThrough
probe('C32-H-pipeThrough-order', "(new Collection(['a']))->pipeThrough([push('b'), implode(''), strtoupper])", fn () => (new Collection(['a']))->pipeThrough([fn ($d) => $d->push('b'), fn ($d) => $d->implode(''), fn ($s) => strtoupper($s)]));
probe('C32-H-pipeThrough-empty-returns-receiver', "\$c->pipeThrough([]) === \$c", function () { $c = new Collection([1]); return $c->pipeThrough([]) === $c; });

emit();
