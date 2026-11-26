<?php

/**
 * Ground truth for PHP's NumberFormatter ordinal rule sets, which Number::ordinal() formats with.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$patterns = [];

foreach (ResourceBundle::getLocales('') as $locale) {
    $patterns[$locale] = (new NumberFormatter($locale, NumberFormatter::ORDINAL))->getPattern();
}

$sets = array_values(array_unique($patterns));

probe('ordinal-rule-sets', 'every distinct NumberFormatter::ORDINAL getPattern() of the ICU locales, in locale order', fn () => $sets);
probe('ordinal-rule-set-of-each-locale', "each ICU locale's index into ordinal-rule-sets", fn () => array_map(
    fn (string $pattern) => array_search($pattern, $sets, true),
    $patterns,
));

emit();
