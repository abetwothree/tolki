<?php

/**
 * Ground truth for PHP's intl Locale::canonicalize().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$tags = ['zh-hant-tw', 'zh-Hant-TW', 'sr-latn', 'az-cyrl-az', 'uz_Latn', 'zh-Hans', 'pt-br', 'es-419'];

// normalizeLocale follows ICU's canonical casing for script subtags.
probe('canonicalize-script-subtags', 'Locale::canonicalize() for each tag', fn () => array_combine($tags, array_map(fn ($t) => Locale::canonicalize($t), $tags)));

emit();
