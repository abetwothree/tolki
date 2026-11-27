<?php

/**
 * Ground truth for Str::of()->split().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

probe('split-length-astral', "Str::of(…)->split(n)->all() for ('😀a😀', 1), ('😀a😀b', 2), ('😀😀😀', 2) and ('', 1)", fn () => [Str::of('😀a😀')->split(1)->all(), Str::of('😀a😀b')->split(2)->all(), Str::of('😀😀😀')->split(2)->all(), Str::of('')->split(1)->all()]);
probe('split-length-below-one', "Str::of('abc')->split(0) and ->split(-1)", fn () => [attempt(fn () => Str::of('abc')->split(0)), attempt(fn () => Str::of('abc')->split(-1))]);

emit();
