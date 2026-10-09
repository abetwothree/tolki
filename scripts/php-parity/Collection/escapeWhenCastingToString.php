<?php

/**
 * Ground truth for Collection::escapeWhenCastingToString().
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

probe('C32-A-escape-when-casting-to-string', "(string) collect(['<b>'])->escapeWhenCastingToString()", fn () => (string) collect(['<b>'])->escapeWhenCastingToString());
probe('C32-A-escape-when-casting-concat', "collect(['<b>'])->escapeWhenCastingToString() . ''", fn () => collect(['<b>'])->escapeWhenCastingToString() . '');
probe('C32-A-escape-when-casting-to-string-all-characters', "(string) collect([\"&'<>&amp;\"])->escapeWhenCastingToString()", fn () => (string) collect(["&'<>&amp;"])->escapeWhenCastingToString());
probe('C32-A-escape-when-casting-to-string-off', "(string) collect(['<b>'])->escapeWhenCastingToString()->escapeWhenCastingToString(false)", fn () => (string) collect(['<b>'])->escapeWhenCastingToString()->escapeWhenCastingToString(false));
probe('C32-A-escape-when-casting-leaves-toJson', "collect(['<b>'])->escapeWhenCastingToString()->toJson()", fn () => collect(['<b>'])->escapeWhenCastingToString()->toJson());

emit();
