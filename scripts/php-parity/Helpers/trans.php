<?php

/**
 * Ground truth for the trans() helper.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

langBind(langTranslator(['en' => ['g' => ['a' => 'A']]]));

probe('trans-without-key-returns-translator', 'get_class(trans())', fn () => get_class(trans()));
probe('trans-translates', "trans('g.a')", fn () => trans('g.a'));

emit();
