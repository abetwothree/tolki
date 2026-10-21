<?php

/**
 * Ground truth for the __() helper.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

langBind(langTranslator(['en' => ['g' => ['a' => 'A']]]));

probe('underscore-null-key', '__(null)', fn () => __(null));
probe('underscore-translates', "__('g.a')", fn () => __('g.a'));

emit();
