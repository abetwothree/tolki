<?php

/**
 * Ground truth for MessageSelector::choose().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Tests\Translation\TranslationMessageSelectorTest;
use Illuminate\Translation\MessageSelector;

$s = new MessageSelector;

if (! class_exists(TranslationMessageSelectorTest::class)) {
    require repoRoot() . '/packages/lang/stubs/MessageSelectorTest.php';
}

foreach (TranslationMessageSelectorTest::chooseTestData() as $i => [$expected, $id, $number]) {
    probe(
        sprintf('choose-laravel-data-%02d', $i),
        sprintf('choose(%s, %s, "en")', json_encode($id, JSON_UNESCAPED_UNICODE), json_encode($number)),
        fn () => ['line' => $id, 'number' => $number, 'expected' => $expected, 'chosen' => $s->choose($id, $number, 'en')],
    );
}

// Inputs Laravel's tests leave out: floats, negatives, odd whitespace, malformed conditions and locales.
probe('choose-float-uses-range', "choose('{0} zero|{1} one|[2,*] many', 2.75, 'pl')", fn () => $s->choose('{0} zero|{1} one|[2,*] many', 2.75, 'pl'));
probe('choose-float-half-is-plural', "choose('singular|plural', 0.5, 'en')", fn () => $s->choose('singular|plural', 0.5, 'en'));
probe('choose-negative-one-singular', "choose('item|items', -1, 'en')", fn () => $s->choose('item|items', -1, 'en'));
probe('choose-negative-two-plural', "choose('item|items', -2, 'en')", fn () => $s->choose('item|items', -2, 'en'));
probe('choose-negative-ru-one', "choose('файл|файла|файлов', -1, 'ru')", fn () => $s->choose('файл|файла|файлов', -1, 'ru'));
probe('choose-negative-ru-two', "choose('файл|файла|файлов', -2, 'ru')", fn () => $s->choose('файл|файла|файлов', -2, 'ru'));
probe('choose-negative-ru-five', "choose('файл|файла|файлов', -5, 'ru')", fn () => $s->choose('файл|файла|файлов', -5, 'ru'));
probe('choose-negative-ru-twenty-one', "choose('файл|файла|файлов', -21, 'ru')", fn () => $s->choose('файл|файла|файлов', -21, 'ru'));
probe('choose-negative-exact-condition', "choose('{-1} minus one|[*,*] other', -1, 'en')", fn () => $s->choose('{-1} minus one|[*,*] other', -1, 'en'));
probe('choose-numeric-string-number', "choose('item|items', '-3', 'en')", fn () => $s->choose('item|items', '-3', 'en'));
probe('choose-null-number', "choose('item|items', null, 'en')", fn () => $s->choose('item|items', null, 'en'));
// PHP's <=> answers 1 for NAN against any string, from either side, so no range bound holds.
probe('choose-nan-misses-a-numeric-range', "choose('{0} none|{1} one|[2,*] many', NAN, 'en')", fn () => $s->choose('{0} none|{1} one|[2,*] many', NAN, 'en'));
probe('choose-nan-misses-a-star-range', "choose('[*,*] all|none', NAN, 'en')", fn () => $s->choose('[*,*] all|none', NAN, 'en'));
probe('choose-plural-segment-keeps-spaces', "choose('one | many', 2, 'en')", fn () => $s->choose('one | many', 2, 'en'));
probe('choose-first-segment-keeps-spaces', "choose('one | many', 1, 'en')", fn () => $s->choose('one | many', 1, 'en'));
probe('choose-inline-trims-php-whitespace', "choose(\"{1} \\t one \\n|[2,*] many\", 1, 'en')", fn () => $s->choose("{1} \t one \n|[2,*] many", 1, 'en'));
probe('choose-inline-trims-nul-vertical-tab-and-carriage-return', "choose(\"{1}\\0\\x0Bone\\r|[2,*] many\", 1, 'en')", fn () => $s->choose("{1}\0\x0Bone\r|[2,*] many", 1, 'en'));
probe('choose-inline-keeps-nbsp', "choose(\"{1}\\u{00A0}one\\u{00A0}|[2,*] many\", 1, 'en')", fn () => $s->choose("{1}\u{00A0}one\u{00A0}|[2,*] many", 1, 'en'));
probe('choose-inline-keeps-form-feed', "choose(\"{1}\\x0Bone\\f|[2,*] many\", 1, 'en')", fn () => $s->choose("{1}\x0Bone\f|[2,*] many", 1, 'en'));
probe('choose-inline-spans-lines', "choose(\"{1}a\\r\\nb|[2,*]c\", 1, 'en')", fn () => $s->choose("{1}a\r\nb|[2,*]c", 1, 'en'));
probe('choose-condition-with-spaces-is-text', "choose('{ 1 } one|many', 1, 'en')", fn () => $s->choose('{ 1 } one|many', 1, 'en'));
probe('choose-non-ascii-digit-is-text', "choose('{١}one|many', 1, 'en')", fn () => $s->choose('{١}one|many', 1, 'en'));
probe('choose-range-empty-start', "choose('[,5] low|[6,*] high', 3, 'en')", fn () => $s->choose('[,5] low|[6,*] high', 3, 'en'));
probe('choose-range-extra-comma', "choose('[1,2,3] a|b', 2, 'en')", fn () => $s->choose('[1,2,3] a|b', 2, 'en'));
probe('choose-range-reversed', "choose('[5,1] a|b', 3, 'en')", fn () => $s->choose('[5,1] a|b', 3, 'en'));
probe('choose-range-star-star', "choose('[*,*] all|none', 7, 'en')", fn () => $s->choose('[*,*] all|none', 7, 'en'));
probe('choose-exact-loose-float', "choose('{1.0}one|many', 1, 'en')", fn () => $s->choose('{1.0}one|many', 1, 'en'));
probe('choose-exact-star-never-matches', "choose('{*}any|other', 5, 'en')", fn () => $s->choose('{*}any|other', 5, 'en'));
probe('choose-empty-condition', "choose('{}none|[1,*]some', 0, 'en')", fn () => $s->choose('{}none|[1,*]some', 0, 'en'));
probe('choose-null-locale', "choose('item|items', 5, null)", fn () => $s->choose('item|items', 5, null));
probe('choose-hyphen-locale', "choose('item|items', 5, 'en-US')", fn () => $s->choose('item|items', 5, 'en-US'));
probe('choose-index-past-segments', "choose('a|b', 5, 'ru')", fn () => $s->choose('a|b', 5, 'ru'));
probe('choose-empty-line', "choose('', 1, 'en')", fn () => $s->choose('', 1, 'en'));
probe('choose-lone-pipe', "choose('|', 2, 'en')", fn () => $s->choose('|', 2, 'en'));

emit();
