<?php

/**
 * Ground truth for Number::useLocale().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

// useLocale stores any string; the error comes when a formatter reads it.
$with = function (string $locale, callable $run): mixed {
    Number::useLocale($locale);

    try {
        return $run();
    } finally {
        Number::useLocale('en');
    }
};
probe('useLocale-keeps-spelling', "useLocale('pt_BR'); defaultLocale()", fn () => $with('pt_BR', fn () => Number::defaultLocale()));
probe('useLocale-underscore-formats', "useLocale('pt_BR'); format(1234.5, 2)", fn () => $with('pt_BR', fn () => Number::format(1234.5, 2)));
probe('useLocale-accepts-unknown', "useLocale('xx'); defaultLocale()", fn () => $with('xx', fn () => Number::defaultLocale()));
probe('useLocale-unknown-throws-on-use', "useLocale('xx'); format(1234.5)", fn () => $with('xx', fn () => Number::format(1234.5)));

emit();
