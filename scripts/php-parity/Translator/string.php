<?php

/**
 * Ground truth for Translator::string().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

$t1 = ['en' => ['foo::bar' => ['foo' => 'foo', 'baz' => 'breeze :foo', 'qux' => ['tree :foo', 'breeze :foo', 'beep' => ['rock' => 'tree :foo']]]]];

probe('string-returns-line', "t(T1)->string('foo::bar.baz', ['foo' => 'bar'])", fn () => langTranslator($t1)->string('foo::bar.baz', ['foo' => 'bar']));
probe('string-throws-for-group', "t(T1)->string('foo::bar.qux')", fn () => langTranslator($t1)->string('foo::bar.qux'));
probe('string-returns-missing-key', "t(T1)->string('nope')", fn () => langTranslator($t1)->string('nope'));

emit();
