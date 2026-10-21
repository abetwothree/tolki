<?php

/**
 * Ground truth for Translator::choice().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$t3 = ['en' => ['apples' => '{0} none|{1} one|[2,*] :count apples', ':count foos' => '{1} :count foos|[2,*] :count foos', 'files' => 'file|files'], 'ru' => ['files' => 'файл|файла|файлов']];

probe('choice-fills-count', "t(T3)->choice('apples', 3)", fn () => langTranslator($t3)->choice('apples', 3));
probe('choice-exact-one', "t(T3)->choice('apples', 1)", fn () => langTranslator($t3)->choice('apples', 1));
probe('choice-custom-count', "t(T3)->choice(':count foos', 1234, ['count' => '1,234'])", fn () => langTranslator($t3)->choice(':count foos', 1234, ['count' => '1,234']));
probe('choice-counts-list', "t(T3)->choice('apples', ['a', 'b', 'c'])", fn () => langTranslator($t3)->choice('apples', ['a', 'b', 'c']));
probe('choice-counts-assoc-array', "t(T3)->choice('apples', ['a' => 1, 'b' => 2])", fn () => langTranslator($t3)->choice('apples', ['a' => 1, 'b' => 2]));
probe('choice-counts-collection', "t(T3)->choice('apples', collect([1, 2, 3]))", fn () => langTranslator($t3)->choice('apples', collect([1, 2, 3])));
probe('choice-float', "t(T3)->choice('apples', 1.2)", fn () => langTranslator($t3)->choice('apples', 1.2));
probe('choice-null-count-is-filled', "t(T3)->choice('apples', 3, ['count' => null])", fn () => langTranslator($t3)->choice('apples', 3, ['count' => null]));
probe('choice-list-replace-gains-count', "t([])->choice(':0 :count', 2, ['z'])", fn () => langTranslator([])->choice(':0 :count', 2, ['z']));
probe('choice-uses-fallback-locale-rule', "langTranslator(T3, 'cs', 'en')->choice('files', 5)", fn () => langTranslator($t3, 'cs', 'en')->choice('files', 5));
probe('choice-uses-own-locale-rule', "langTranslator(T3, 'ru', 'en')->choice('files', 5)", fn () => langTranslator($t3, 'ru', 'en')->choice('files', 5));
probe('choice-locale-argument', "langTranslator(T3, 'en', 'en')->choice('files', 5, [], 'ru')", fn () => langTranslator($t3, 'en', 'en')->choice('files', 5, [], 'ru'));
probe('choice-without-fallback-uses-first-form', "t([])->choice('item|items', 5)", fn () => langTranslator([])->choice('item|items', 5));
probe('choice-with-fallback-uses-its-rule', "langTranslator([], 'en', 'en')->choice('item|items', 5)", fn () => langTranslator([], 'en', 'en')->choice('item|items', 5));

emit();
