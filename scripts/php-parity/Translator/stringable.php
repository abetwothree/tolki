<?php

/**
 * Ground truth for Translator::stringable().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$stringable = function () {
    $t = langTranslator([]);
    $t->stringable(fn (LangMoney $m) => 'm' . $m->cents);

    return $t;
};

probe('stringable-handler-formats-its-class', "\$t->stringable(fn (LangMoney \$m) => 'm' . \$m->cents); \$t->get(':a', ['a' => new LangMoney(5)])", fn () => $stringable()->get(':a', ['a' => new LangMoney(5)]));
probe('stringable-handler-skips-a-subclass', "\$t->get(':a', ['a' => new LangEuro(5)])", fn () => $stringable()->get(':a', ['a' => new LangEuro(5)]));
probe('stringable-handler-output-is-cased', "\$t->get(':A', ['a' => new LangMoney(5)])", fn () => $stringable()->get(':A', ['a' => new LangMoney(5)]));

emit();
