<?php

/**
 * Ground truth for Number::parse().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

probe('parse-locale-spellings', "Number::parse('1.234,5', locale: …) for pt_BR and pt-BR", fn () => array_combine(['pt_BR', 'pt-BR'], array_map(fn ($l) => Number::parse('1.234,5', locale: $l), ['pt_BR', 'pt-BR'])));
probe('parse-locale-unknown', "Number::parse('1.234,5', locale: 'xx')", fn () => Number::parse('1.234,5', locale: 'xx'));

emit();
