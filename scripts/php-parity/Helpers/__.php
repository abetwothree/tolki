<?php

/**
 * Ground truth for the __() helper.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

langBind(langTranslator(['en' => ['g' => ['a' => 'A']]]));

probe('underscore-null-key', '__(null)', fn () => __(null));
probe('underscore-translates', "__('g.a')", fn () => __('g.a'));
probe('underscore-locale-argument', "__('g.a', [], 'es') with an es line", function () {
    langBind(langTranslator(['en' => ['g' => ['a' => 'A']], 'es' => ['g' => ['a' => 'A-es']]]));

    return __('g.a', [], 'es');
});

emit();
