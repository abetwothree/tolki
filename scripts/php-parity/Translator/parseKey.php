<?php

/**
 * Ground truth for Translator::parseKey().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$parse = fn (string $key) => langTranslator([])->parseKey($key);

probe('parse-key-group-item', "parseKey('g.a')", fn () => $parse('g.a'));
probe('parse-key-group-only', "parseKey('g')", fn () => $parse('g'));
probe('parse-key-nested-item', "parseKey('g.a.b')", fn () => $parse('g.a.b'));
probe('parse-key-namespaced', "parseKey('ns::g.a')", fn () => $parse('ns::g.a'));
probe('parse-key-namespaced-group-only', "parseKey('ns::g')", fn () => $parse('ns::g'));
probe('parse-key-extra-separator', "parseKey('a::b::c.d')", fn () => $parse('a::b::c.d'));
probe('parse-key-leading-dot', "parseKey('.a')", fn () => $parse('.a'));
probe('parse-key-empty', "parseKey('')", fn () => $parse(''));
probe('parse-key-trailing-separator', "parseKey('a::')", fn () => $parse('a::'));

emit();
