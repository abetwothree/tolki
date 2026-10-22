<?php

/**
 * Ground truth for the trans_choice() helper.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

probe('trans-choice-without-fallback', "trans_choice('x|y', 2)", function () {
    langBind(langTranslator([]));

    return trans_choice('x|y', 2);
});
probe('trans-choice-with-fallback', "trans_choice('x|y', 2) with fallback 'en'", function () {
    langBind(langTranslator([], 'en', 'en'));

    return trans_choice('x|y', 2);
});
probe('trans-choice-replace-and-locale', "trans_choice('x', 2, ['n' => 'N'], 'ru') on a ru line ':n один|:n два|:n много'", function () {
    langBind(langTranslator(['ru' => ['x' => ':n один|:n два|:n много']]));

    return trans_choice('x', 2, ['n' => 'N'], 'ru');
});

emit();
