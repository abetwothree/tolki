<?php

/**
 * Ground truth for Translator::determineLocalesUsing().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

probe('determine-locales-receives-locales', "t([]) with a recording resolver; get('g.a')", function () {
    $seen = null;
    $t = langTranslator([]);
    $t->determineLocalesUsing(function ($locales) use (&$seen) {
        $seen = $locales;

        return $locales;
    });
    $t->get('g.a');

    return $seen;
});
probe('determine-locales-receives-duplicates', "t([], 'en', 'en') with a recording resolver; get('g.a')", function () {
    $seen = null;
    $t = langTranslator([], 'en', 'en');
    $t->determineLocalesUsing(function ($locales) use (&$seen) {
        $seen = $locales;

        return $locales;
    });
    $t->get('g.a');

    return $seen;
});
probe('determine-locales-adds-locale', "t(['fr' => ['g' => ['a' => 'fr']]]) with a resolver returning ['en', 'fr', 'en']; get('g.a')", function () {
    $t = langTranslator(['fr' => ['g' => ['a' => 'fr']]]);
    $t->determineLocalesUsing(fn () => ['en', 'fr', 'en']);

    return $t->get('g.a');
});

emit();
