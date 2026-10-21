<?php

/**
 * Ground truth for Translator::has().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$t2 = ['en' => ['Hello' => 'Hello', 'Empty' => '', 'g' => ['a' => 'A', 'same' => 'g.same']], 'lv' => ['g' => ['b' => 'B']]];
$t = fn () => langTranslator($t2, 'en', 'lv');

probe('has-group-line', "t(T2, 'en', 'lv')->has('g.a')", fn () => $t()->has('g.a'));
probe('has-missing-key', "t(T2, 'en', 'lv')->has('g.zzz')", fn () => $t()->has('g.zzz'));
probe('has-json-line-equal-to-key', "t(T2, 'en', 'lv')->has('Hello')", fn () => $t()->has('Hello'));
probe('has-json-empty-line', "t(T2, 'en', 'lv')->has('Empty')", fn () => $t()->has('Empty'));
probe('has-group-line-equal-to-key', "t(T2, 'en', 'lv')->has('g.same')", fn () => $t()->has('g.same'));
probe('has-reads-fallback', "t(T2, 'en', 'lv')->has('g.b')", fn () => $t()->has('g.b'));
probe('has-locale-argument', "t(T2, 'en', 'lv')->has('g.b', 'lv')", fn () => $t()->has('g.b', 'lv'));
probe('has-skips-missing-key-handler', "[\$t->has('g.zzz'), \$calls] with a counting handler returning 'X'", function () use ($t) {
    $calls = 0;
    $translator = $t();
    $translator->handleMissingKeysUsing(function () use (&$calls) {
        $calls++;

        return 'X';
    });

    return [$translator->has('g.zzz'), $calls];
});

emit();
