<?php

/**
 * Ground truth for Translator::getLocale().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

probe('get-locale-reads-current', 't([])->getLocale()', fn () => langTranslator([])->getLocale());
probe('locale-alias-reads-current', 't([])->locale()', fn () => langTranslator([])->locale());

emit();
