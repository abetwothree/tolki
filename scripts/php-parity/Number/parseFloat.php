<?php

/**
 * Ground truth for Number::parseFloat().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

probe('parseFloat-locale-spellings', "Number::parseFloat('1.234,5', …) for pt_BR and pt-BR", fn () => array_combine(['pt_BR', 'pt-BR'], array_map(fn ($l) => Number::parseFloat('1.234,5', $l), ['pt_BR', 'pt-BR'])));

emit();
