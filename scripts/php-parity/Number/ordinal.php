<?php

/**
 * Ground truth for Number::ordinal().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

// ICU formats a locale without ordinal rules with its default locale's, read once from the environment, not from
// Locale::setDefault(), so the transcript pins it to en_US_POSIX whatever LANG says.
putenv('LC_ALL=C');

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

probe('ordinal-locale-unknown', "Number::ordinal(1, 'xx')", fn () => Number::ordinal(1, 'xx'));
probe('ordinal-locale-malformed', "Number::ordinal(1, '-en')", fn () => Number::ordinal(1, '-en'));

probe('ordinal-inputs', 'numberOrdinalInputs(), each as numberSpelling() writes it', fn () => array_map(numberSpelling(...), numberOrdinalInputs()));

foreach (numberOrdinalLocales() as $locale) {
    probe(
        "ordinal-of-{$locale}",
        "Number::ordinal(n, '{$locale}') for each of numberOrdinalInputs()",
        fn () => array_map(fn ($n) => Number::ordinal($n, $locale), numberOrdinalInputs()),
    );
}

// ICU crashes the process on -INF where the negative rule writes the number without its ordinal text.
probe('ordinal-negative-infinity', "Number::ordinal(-INF, \$locale) for each locale whose rule set has no '>#,##0>'", function () {
    $locales = array_values(array_filter(
        numberOrdinalLocales(),
        fn ($locale) => ! str_contains((new NumberFormatter($locale, NumberFormatter::ORDINAL))->getPattern(), '>#,##0>'),
    ));

    return array_combine($locales, array_map(fn ($locale) => Number::ordinal(-INF, $locale), $locales));
});

// A fraction that rounds up past an indicator's divisor sends ICU's rule sets into a loop it aborts.
probe('ordinal-rounds-past-a-divisor', "Number::ordinal(99.6, 'af'), Number::ordinal(99.6, 'bg'), Number::ordinal(1099.5, 'bg')", fn () => [
    Number::ordinal(99.6, 'af'),
    Number::ordinal(99.6, 'bg'),
    Number::ordinal(1099.5, 'bg'),
]);

probe('ordinal-locale-spellings', "Number::ordinal(21, \$locale) for 'pt_BR', 'pt-BR', 'pt_br', 'PT-br' and 'zh_hant_tw'", fn () => array_map(
    fn ($locale) => Number::ordinal(21, $locale),
    ['pt_BR', 'pt-BR', 'pt_br', 'PT-br', 'zh_hant_tw'],
));

// ICU picks a fraction's plural text through an int32 cast of the double, which saturates where an int's cast wraps.
probe('ordinal-large-fractions', "Number::ordinal(\$n, \$locale) by numberSpelling(\$n) for 2147483653.3, 4294967297.4, 4294967298.25 and -4294967297.4 in 'en', 'fr', 'sv' and 'hi'", function () {
    $answers = [];

    foreach ([2147483653.3, 4294967297.4, 4294967298.25, -4294967297.4] as $n) {
        foreach (['en', 'fr', 'sv', 'hi'] as $locale) {
            $answers[numberSpelling($n)][$locale] = Number::ordinal($n, $locale);
        }
    }

    return $answers;
});

emit();
