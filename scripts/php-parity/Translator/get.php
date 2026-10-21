<?php

/**
 * Ground truth for Translator::get().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$t1 = ['en' => ['foo::bar' => ['foo' => 'foo', 'baz' => 'breeze :foo', 'qux' => ['tree :foo', 'breeze :foo', 'beep' => ['rock' => 'tree :foo']]]]];

probe('get-namespaced-list-item', "t(T1)->get('foo::bar.qux', ['foo' => 'bar'])", fn () => langTranslator($t1)->get('foo::bar.qux', ['foo' => 'bar']));
probe('get-namespaced-line', "t(T1)->get('foo::bar.baz', ['foo' => 'bar'])", fn () => langTranslator($t1)->get('foo::bar.baz', ['foo' => 'bar']));
probe('get-namespaced-line-without-replacements', "t(T1)->get('foo::bar.foo')", fn () => langTranslator($t1)->get('foo::bar.foo'));
probe('get-whole-group-walks-replacements', "t(T1)->get('foo::bar', ['foo' => 'bar'])", fn () => langTranslator($t1)->get('foo::bar', ['foo' => 'bar']));
probe('get-missing-namespaced-group-returns-key', "t(T1)->get('foo::unknown', ['foo' => 'bar'])", fn () => langTranslator($t1)->get('foo::unknown', ['foo' => 'bar']));
probe('get-missing-namespaced-item-returns-key', "t(T1)->get('foo::bar.unknown')", fn () => langTranslator($t1)->get('foo::bar.unknown'));
probe('get-keeps-html', "t(['en' => ['foo' => ['bar' => 'breeze <p>test</p>']]])->get('foo.bar')", fn () => langTranslator(['en' => ['foo' => ['bar' => 'breeze <p>test</p>']]])->get('foo.bar'));
probe('get-group-reads-fallback-locale', "langTranslator(['lv' => ['foo::bar' => ['baz' => 'breeze :foo']]], 'en', 'lv')->get('foo::bar.baz', ['foo' => 'bar'])", fn () => langTranslator(['lv' => ['foo::bar' => ['baz' => 'breeze :foo']]], 'en', 'lv')->get('foo::bar.baz', ['foo' => 'bar']));
probe('get-global-group-line', "t(['en' => ['foo' => ['bar' => 'breeze :foo']]])->get('foo.bar', ['foo' => 'bar'])", fn () => langTranslator(['en' => ['foo' => ['bar' => 'breeze :foo']]])->get('foo.bar', ['foo' => 'bar']));
probe('get-json-line', "t(['en' => ['foo' => 'one']])->get('foo')", fn () => langTranslator(['en' => ['foo' => 'one']])->get('foo'));
probe('get-json-miss-reads-group', "t(['en' => ['foo' => ['bar' => 'one']]])->get('foo.bar')", fn () => langTranslator(['en' => ['foo' => ['bar' => 'one']]])->get('foo.bar'));
probe('get-json-miss-reads-group-and-replaces', "t(['en' => ['foo' => ['bar' => 'one :message']]])->get('foo.bar', ['message' => 'two'])", fn () => langTranslator(['en' => ['foo' => ['bar' => 'one :message']]])->get('foo.bar', ['message' => 'two']));
probe('get-missing-returns-key', "t([])->get('Foo that bar')", fn () => langTranslator([])->get('Foo that bar'));
probe('get-missing-returns-key-and-replaces', "t([])->get('foo :message', ['message' => 'baz'])", fn () => langTranslator([])->get('foo :message', ['message' => 'baz']));
probe('get-json-empty-line-returns-key', "t(['en' => ['Hi' => '']])->get('Hi')", fn () => langTranslator(['en' => ['Hi' => '']])->get('Hi'));
probe('get-json-zero-line-returns-key', "t(['en' => ['Hi' => '0']])->get('Hi')", fn () => langTranslator(['en' => ['Hi' => '0']])->get('Hi'));
probe('get-json-number-line', "t(['en' => ['Hi' => 5]])->get('Hi')", fn () => langTranslator(['en' => ['Hi' => 5]])->get('Hi'));
probe('get-group-number-leaf-returns-key', "t(['en' => ['g' => ['n' => 5]]])->get('g.n')", fn () => langTranslator(['en' => ['g' => ['n' => 5]]])->get('g.n'));
probe('get-json-ignores-fallback', "langTranslator(['es' => ['Hi' => 'Hola']], 'en', 'es')->get('Hi')", fn () => langTranslator(['es' => ['Hi' => 'Hola']], 'en', 'es')->get('Hi'));
probe('get-group-leaves-keep-type-without-replacements', "t(['en' => ['g' => ['n' => 5, 's' => ':x']]])->get('g')", fn () => langTranslator(['en' => ['g' => ['n' => 5, 's' => ':x']]])->get('g'));
probe('get-group-leaves-cast-with-replacements', "t(['en' => ['g' => ['n' => 5, 's' => ':x']]])->get('g', ['x' => 'y'])", fn () => langTranslator(['en' => ['g' => ['n' => 5, 's' => ':x']]])->get('g', ['x' => 'y']));
probe('get-group-null-leaf-with-replacements', "t(['en' => ['g' => ['n' => null, 's' => ':x']]])->get('g', ['x' => 'y'])", fn () => @langTranslator(['en' => ['g' => ['n' => null, 's' => ':x']]])->get('g', ['x' => 'y']));
probe('get-empty-group-returns-key', "t(['en' => ['g' => []]])->get('g')", fn () => langTranslator(['en' => ['g' => []]])->get('g'));
probe('get-dotted-key-inside-group', "t(['en' => ['g' => ['a.b' => 'flat']]])->get('g.a.b')", fn () => langTranslator(['en' => ['g' => ['a.b' => 'flat']]])->get('g.a.b'));
probe('get-list-group-index', "t(['en' => ['g' => ['a', 'b']]])->get('g.1')", fn () => langTranslator(['en' => ['g' => ['a', 'b']]])->get('g.1'));
probe('get-locale-zero-uses-default', "t(['en' => ['g' => ['a' => 'A']]])->get('g.a', [], '0')", fn () => langTranslator(['en' => ['g' => ['a' => 'A']]])->get('g.a', [], '0'));
probe('get-locale-argument', "t(['es' => ['g' => ['a' => 'A-es']]])->get('g.a', [], 'es')", fn () => langTranslator(['es' => ['g' => ['a' => 'A-es']]])->get('g.a', [], 'es'));
probe('get-without-fallback', "langTranslator(['lv' => ['g' => ['a' => 'A']]], 'en', 'lv')->get('g.a', [], null, false)", fn () => langTranslator(['lv' => ['g' => ['a' => 'A']]], 'en', 'lv')->get('g.a', [], null, false));
probe('get-extra-namespace-separator', "t([])->get('a::b::c.d')", fn () => langTranslator([])->get('a::b::c.d'));
probe('get-json-line-is-not-a-group', "t(['en' => ['messages' => 'Messages']])->get('messages.welcome')", fn () => langTranslator(['en' => ['messages' => 'Messages']])->get('messages.welcome'));

emit();
