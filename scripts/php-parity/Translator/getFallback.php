<?php

/**
 * Ground truth for Translator::getFallback().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

probe('fallback-starts-null', 't([])->getFallback()', fn () => langTranslator([])->getFallback());
probe('fallback-is-set', "t([], 'en', 'en')->getFallback()", fn () => langTranslator([], 'en', 'en')->getFallback());

emit();
