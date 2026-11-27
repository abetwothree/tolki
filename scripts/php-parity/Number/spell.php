<?php

/**
 * Ground truth for Number::spell().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

probe('spell-locale-spellings', 'Number::spell(21, …) for pt_BR and pt-BR', fn () => array_combine(['pt_BR', 'pt-BR'], array_map(fn ($l) => Number::spell(21, $l), ['pt_BR', 'pt-BR'])));
probe('spell-locale-unknown', "Number::spell(21, 'xx')", fn () => Number::spell(21, 'xx'));
// Words differ between ICU and to-words, so pin that the default locale is read, not the words.
probe('spell-uses-default-locale', "useLocale('pt_BR'); spell(21) === spell(21, 'pt_BR')", function () {
    Number::useLocale('pt_BR');

    try {
        return Number::spell(21) === Number::spell(21, 'pt_BR');
    } finally {
        Number::useLocale('en');
    }
});
probe('spell-after-uses-locale', "Number::spell(1234.5, 'pt_BR', after: 2000)", fn () => Number::spell(1234.5, 'pt_BR', after: 2000));

emit();
