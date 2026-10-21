<?php

/**
 * Ground truth for MessageSelector::getPluralIndex().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Translation\MessageSelector;

$s = new MessageSelector;

probe('plural-index-numbers', 'langPluralNumbers()', fn () => langPluralNumbers());

// The table spells locales with an underscore, so the hyphenated and unknown ones fall to the default rule.
foreach ([...langSelectorLocales(), 'en-US', 'pt-BR', 'xx'] as $locale) {
    probe(
        "plural-index-{$locale}",
        "getPluralIndex('{$locale}', n) for each plural number",
        fn () => array_map(fn ($n) => $s->getPluralIndex($locale, $n), langPluralNumbers()),
    );
}

probe(
    'plural-index-empty-locale',
    "getPluralIndex('', n) for each plural number",
    fn () => array_map(fn ($n) => $s->getPluralIndex('', $n), langPluralNumbers()),
);
probe('plural-index-null-number', "getPluralIndex('en', null)", fn () => $s->getPluralIndex('en', null));
probe('plural-index-numeric-string', "getPluralIndex('ru', '-21')", fn () => $s->getPluralIndex('ru', '-21'));

emit();
