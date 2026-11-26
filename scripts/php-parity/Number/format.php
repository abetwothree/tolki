<?php

/**
 * Ground truth for Number::format().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

// Number::format(), percentage() and currency() no longer return "-0" (laravel/framework#61716).
probe('format-negative-zero', 'Number::format(-0.0)', fn () => Number::format(-0.0));
probe('format-rounds-to-zero', 'Number::format(-0.4, precision: 0)', fn () => Number::format(-0.4, precision: 0));
probe('format-rounds-to-zero-one-digit', 'Number::format(-0.04, precision: 1)', fn () => Number::format(-0.04, precision: 1));
probe('format-keeps-sign', 'Number::format(-0.06, precision: 1)', fn () => Number::format(-0.06, precision: 1));
probe('format-default-precision', 'Number::format(-0.4)', fn () => Number::format(-0.4));
probe('format-max-precision-rounds-to-zero', 'Number::format(-0.0004, maxPrecision: 2)', fn () => Number::format(-0.0004, maxPrecision: 2));
probe('format-rounds-to-zero-de', "Number::format(-0.04, precision: 1, locale: 'de')", fn () => Number::format(-0.04, precision: 1, locale: 'de'));

// ICU reads `pt_BR` and `pt-BR` alike, and rejects a locale it has no data for.
$spellings = ['pt_BR', 'pt-BR', 'pt_br', 'PT-br', 'zh_hant_tw', 'ar_EG', 'es_419'];
probe('format-locale-spellings', 'Number::format(1234.5, 2, locale: …) for each spelling', fn () => array_combine($spellings, array_map(fn ($l) => Number::format(1234.5, 2, locale: $l), $spellings)));
probe('format-locale-unknown', "Number::format(1234.5, locale: 'xx')", fn () => Number::format(1234.5, locale: 'xx'));
probe('format-locale-unknown-region', "Number::format(1234.5, locale: 'xx_YY')", fn () => Number::format(1234.5, locale: 'xx_YY'));
probe('format-locale-malformed', "Number::format(1234.5, locale: 'not a locale')", fn () => Number::format(1234.5, locale: 'not a locale'));
probe('format-locale-padded', "Number::format(1234.5, locale: ' pt_BR ')", fn () => Number::format(1234.5, locale: ' pt_BR '));
// ICU's default locale depends on the machine, so pin the equality rather than the text.
probe('format-locale-empty-is-icu-default', "Number::format(1234.5, 2, locale: '') === Number::format(1234.5, 2, locale: Locale::getDefault())", fn () => Number::format(1234.5, 2, locale: '') === Number::format(1234.5, 2, locale: Locale::getDefault()));

emit();
