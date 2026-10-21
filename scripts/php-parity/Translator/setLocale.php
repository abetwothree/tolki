<?php

/**
 * Ground truth for Translator::setLocale().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$set = fn (string $locale) => langTranslator([])->setLocale($locale);

probe('set-locale-rejects-parent-path', "setLocale('../secret')", fn () => $set('../secret'));
probe('set-locale-rejects-backslash', "setLocale('..\\\\secret')", fn () => $set('..\\secret'));
probe('set-locale-rejects-lone-backslash', "setLocale('en\\\\US')", fn () => $set('en\\US'));
probe('set-locale-rejects-dots', "setLocale('..')", fn () => $set('..'));
probe('set-locale-rejects-nul', "setLocale(\"en\\0\")", fn () => $set("en\0"));
probe('set-locale-rejects-slash', "setLocale('en/US')", fn () => $set('en/US'));
probe('set-locale-keeps-previous-locale', 'getLocale() after the five rejected setLocale calls', function () use ($set) {
    $t = langTranslator([]);

    foreach (['../secret', '..\\secret', '..', "en\0", 'en/US'] as $locale) {
        try {
            $t->setLocale($locale);
        } catch (InvalidArgumentException) {
        }
    }

    return $t->getLocale();
});
probe('set-locale-accepts-region', "setLocale('en_US'); getLocale()", function () {
    $t = langTranslator([]);
    $t->setLocale('en_US');

    return $t->getLocale();
});

emit();
