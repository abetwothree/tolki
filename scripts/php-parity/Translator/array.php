<?php

/**
 * Ground truth for Translator::array().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$t1 = ['en' => ['foo::bar' => ['foo' => 'foo', 'baz' => 'breeze :foo', 'qux' => ['tree :foo', 'breeze :foo', 'beep' => ['rock' => 'tree :foo']]]]];

probe('array-returns-group', "t(['en' => ['foo::bar' => ['baz' => ['breeze :foo']]]])->array('foo::bar.baz', ['foo' => 'bar'])", fn () => langTranslator(['en' => ['foo::bar' => ['baz' => ['breeze :foo']]]])->array('foo::bar.baz', ['foo' => 'bar']));
probe('array-throws-for-line', "t(T1)->array('foo::bar.baz')", fn () => langTranslator($t1)->array('foo::bar.baz'));
probe('array-throws-for-missing-key', "t([])->array('g.a')", fn () => langTranslator([])->array('g.a'));
probe('array-throws-for-json-number', "t(['en' => ['n' => 5]])->array('n')", fn () => langTranslator(['en' => ['n' => 5]])->array('n'));

emit();
