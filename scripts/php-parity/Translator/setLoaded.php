<?php

/**
 * Ground truth for Translator::setLoaded().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

probe('set-loaded-replaces-lines', "t(['en' => ['g' => ['a' => 'old']]]); setLoaded(['*' => ['g' => ['en' => ['a' => 'new']]]]); get('g.a')", function () {
    $t = langTranslator(['en' => ['g' => ['a' => 'old']]]);
    $t->setLoaded(['*' => ['g' => ['en' => ['a' => 'new']]]]);

    return $t->get('g.a');
});

emit();
