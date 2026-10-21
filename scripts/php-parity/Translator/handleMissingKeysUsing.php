<?php

/**
 * Ground truth for Translator::handleMissingKeysUsing().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

probe('missing-key-handler-receives-arguments', "get('nope', ['x' => '1']) with a handler recording its arguments", function () {
    $seen = null;
    $t = langTranslator([]);
    $t->handleMissingKeysUsing(function (...$args) use (&$seen) {
        $seen = $args;
    });
    $t->get('nope', ['x' => '1']);

    return $seen;
});
probe('missing-key-handler-receives-locale-and-fallback', "get('nope', [], 'fr', false) with a handler recording its arguments", function () {
    $seen = null;
    $t = langTranslator([]);
    $t->handleMissingKeysUsing(function (...$args) use (&$seen) {
        $seen = $args;
    });
    $t->get('nope', [], 'fr', false);

    return $seen;
});
probe('missing-key-handler-result-is-replaced', "handler returns 'Missing :x'; get('nope', ['x' => '1'])", fn () => langTranslator([])->handleMissingKeysUsing(fn () => 'Missing :x')->get('nope', ['x' => '1']));
probe('missing-key-handler-null-keeps-key', "handler returns null; get('nope')", fn () => langTranslator([])->handleMissingKeysUsing(fn () => null)->get('nope'));
probe('missing-key-handler-not-recursive', "handler returns \$t->get('other'); get('nope')", function () {
    $t = langTranslator([]);
    $t->handleMissingKeysUsing(fn () => $t->get('other'));

    return $t->get('nope');
});
probe('missing-key-handler-skipped-for-a-found-line', "get('g.a') on a found line; the handler's call count", function () {
    $calls = 0;
    $t = langTranslator(['en' => ['g' => ['a' => 'A']]]);
    $t->handleMissingKeysUsing(function () use (&$calls) {
        $calls++;
    });
    $t->get('g.a');

    return $calls;
});
probe('missing-key-handler-returns-translator', '$t->handleMissingKeysUsing(null) === $t', function () {
    $t = langTranslator([]);

    return $t->handleMissingKeysUsing(null) === $t;
});
probe('missing-key-handler-throw-disables-it', "a throwing handler, then a second handler; get('a') throws, get('b')", function () {
    $t = langTranslator([]);
    $t->handleMissingKeysUsing(fn () => throw new RuntimeException('boom'));

    try {
        $t->get('a');
    } catch (RuntimeException) {
    }

    $t->handleMissingKeysUsing(fn () => 'second');

    return $t->get('b');
});
probe('missing-key-handler-runs-for-each-missing-key', "[get('a'), get('b'), \$calls] with a counting handler returning 'X'", function () {
    $calls = 0;
    $t = langTranslator([]);
    $t->handleMissingKeysUsing(function () use (&$calls) {
        $calls++;

        return 'X';
    });

    return [$t->get('a'), $t->get('b'), $calls];
});

emit();
