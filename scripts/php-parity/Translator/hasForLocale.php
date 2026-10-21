<?php

/**
 * Ground truth for Translator::hasForLocale().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$t2 = ['en' => ['Hello' => 'Hello', 'Empty' => '', 'g' => ['a' => 'A', 'same' => 'g.same']], 'lv' => ['g' => ['b' => 'B']]];

probe('has-for-locale-ignores-fallback', "t(T2, 'en', 'lv')->hasForLocale('g.b')", fn () => langTranslator($t2, 'en', 'lv')->hasForLocale('g.b'));
probe('has-for-locale-own-line', "t(T2, 'en', 'lv')->hasForLocale('g.a')", fn () => langTranslator($t2, 'en', 'lv')->hasForLocale('g.a'));

emit();
