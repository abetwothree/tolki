<?php

/**
 * Ground truth for the trans() helper.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

langBind(langTranslator(['en' => ['g' => ['a' => 'A']]]));

probe('trans-without-key-returns-translator', 'get_class(trans())', fn () => get_class(trans()));
probe('trans-translates', "trans('g.a')", fn () => trans('g.a'));
probe('trans-locale-argument', "trans('g.a', [], 'es') with an es line", function () {
    langBind(langTranslator(['en' => ['g' => ['a' => 'A']], 'es' => ['g' => ['a' => 'A-es']]]));

    return trans('g.a', [], 'es');
});
probe('trans-whole-group-reads-fallback-locale', "trans('g', [], 'ru') on locale ru, fallback en, with no ru group g", function () {
    langBind(langTranslator(['en' => ['g' => ['a' => 'A']], 'ru' => []], 'ru', 'en'));

    return trans('g', [], 'ru');
});

emit();
