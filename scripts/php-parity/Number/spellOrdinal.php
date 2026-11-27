<?php

/**
 * Ground truth for Number::spellOrdinal().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

probe('spellOrdinal-locale-unknown', "Number::spellOrdinal(2, 'xx')", fn () => Number::spellOrdinal(2, 'xx'));
probe('spellOrdinal-uses-default-locale', "useLocale('pt_BR'); spellOrdinal(2) === spellOrdinal(2, 'pt_BR')", function () {
    Number::useLocale('pt_BR');

    try {
        return Number::spellOrdinal(2) === Number::spellOrdinal(2, 'pt_BR');
    } finally {
        Number::useLocale('en');
    }
});

emit();
