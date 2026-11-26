<?php

/**
 * Ground truth for PHP's NumberFormatter ordinal rule sets, which Number::ordinal() formats with.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

// ICU formats a locale without ordinal rules with its default locale's, read once from the environment, not from
// Locale::setDefault(), so the transcript pins it to en_US_POSIX whatever LANG says.
putenv('LC_ALL=C');

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

$fallbackTags = [
    'az_IQ', 'az_IR', 'az_RU', 'ha_CM', 'ha_SD', 'kk_AF', 'kk_CN', 'kk_IR', 'kk_MN', 'ku_IQ', 'ku_IR', 'ku_LB', 'ky_CN',
    'mn_CN', 'ms_CC', 'pa_PK', 'sd_IN', 'tg_PK', 'ug_KZ', 'ug_MN', 'uz_AF', 'uz_CN', 'es_JP',
    'az_Arab', 'bm_Nkoo', 'dje_Arab', 'dyo_Arab', 'en_Dsrt', 'en_Shaw', 'ha_Arab', 'ku_Arab', 'ky_Arab', 'ky_Latn',
    'ml_Arab', 'mn_Mong', 'mni_Mtei', 'ms_Arab', 'sat_Deva', 'sd_Khoj', 'sd_Sind', 'so_Arab', 'tg_Arab', 'ug_Cyrl',
    'wo_Arab', 'yo_Arab',
    'uz_Latn_AF', 'zh_Hant_TW', 'sr_Latn_ME', 'es_419', 'hi_Latn',
];

probe('ordinal-rule-set-of-fallback-tags', 'the index into ordinal-rule-sets of each tag, most of them outside the ICU locales', fn () => array_combine(
    $fallbackTags,
    array_map(
        fn (string $tag) => array_search((new NumberFormatter($tag, NumberFormatter::ORDINAL))->getPattern(), $sets, true),
        $fallbackTags,
    ),
));

emit();
