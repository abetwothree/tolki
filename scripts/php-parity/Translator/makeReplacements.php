<?php

/**
 * Ground truth for Translator::makeReplacements(), read through get() on a line that is its own missing key.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Tests\Translation\Fixtures\Enums\Bar;
use Illuminate\Tests\Translation\Fixtures\Enums\Baz;

/** Record one replacement row: the line is a key no lines define, so get() answers it with the replacements made. */
$replace = function (string $label, string $line, array $replacements, string $shown) {
    probe($label, "t([])->get({$shown})", fn () => langTranslator([])->get($line, $replacements));
};

$replace('replace-case-variants', 'breeze :0 :Foo :BAR', ['john', 'foo' => 'bar', 'bar' => 'foo'], "'breeze :0 :Foo :BAR', ['john', 'foo' => 'bar', 'bar' => 'foo']");
$replace('replace-longest-key-first', 'breeze :foo :foobar', ['foo' => 'bar', 'foobar' => 'taylor'], "'breeze :foo :foobar', ['foo' => 'bar', 'foobar' => 'taylor']");
$replace('replace-longest-key-first-with-spaces', 'breeze :foo :foobar', ['foo' => 'foo bar baz', 'foobar' => 'taylor'], "'breeze :foo :foobar', ['foo' => 'foo bar baz', 'foobar' => 'taylor']");
$replace('replace-adjacent-placeholders', 'bar :i:c :u', ['i' => 'one', 'c' => 'two', 'u' => 'three'], "'bar :i:c :u', ['i' => 'one', 'c' => 'two', 'u' => 'three']");
$replace('replace-is-atomic', 'Hello :foo!', ['foo' => 'baz:bar', 'bar' => 'abcdef'], "'Hello :foo!', ['foo' => 'baz:bar', 'bar' => 'abcdef']");
$replace('replace-follows-line-order', ':greeting :name', ['name' => 'David', 'greeting' => 'Greetings'], "':greeting :name', ['name' => 'David', 'greeting' => 'Greetings']");
$replace('replace-list', ':0 and :1', ['john', 'jane'], "':0 and :1', ['john', 'jane']");
$replace('replace-null-is-empty', 'foo :message', ['message' => null], "'foo :message', ['message' => null]");
$replace('replace-int', ':n', ['n' => 5], "':n', ['n' => 5]");
$replace('replace-float', ':n', ['n' => 0.1 + 0.2], "':n', ['n' => 0.1 + 0.2]");
$replace('replace-large-float', ':n', ['n' => 1e20], "':n', ['n' => 1e20]");
probe('replace-nan', "t([])->get(':n :N', ['n' => NAN])", fn () => @langTranslator([])->get(':n :N', ['n' => NAN]));
$replace('replace-bools', ':a|:b', ['a' => true, 'b' => false], "':a|:b', ['a' => true, 'b' => false]");
$replace('replace-case-variants-overwrite', ':name :Name :NAME', ['name' => 'a', 'Name' => 'b'], "':name :Name :NAME', ['name' => 'a', 'Name' => 'b']");
$replace('replace-empty-key', 'a:b', ['' => 'X'], "'a:b', ['' => 'X']");
$replace('replace-multibyte-case', ':Name :NAME', ['name' => 'élan'], "':Name :NAME', ['name' => 'élan']");
$replace('replace-sharp-s-title-case', ':NAME :Name', ['name' => 'ßtraße'], "':NAME :Name', ['name' => 'ßtraße']");
$replace('replace-digraph-title-case', ':NAME :Name', ['name' => 'ǆemal'], "':NAME :Name', ['name' => 'ǆemal']");
$replace('replace-empty-replacements-keep-line', ':name', [], "':name', []");
$replace('replace-stringable-object', ':a', ['a' => new LangMoney(5)], "':a', ['a' => new LangMoney(5)]");
$replace('replace-string-backed-enum', ':a', ['a' => Baz::February], "':a', ['a' => Baz::February]");
$replace('replace-int-backed-enum', ':a', ['a' => Bar::Thirteen], "':a', ['a' => Bar::Thirteen]");
$replace('replace-array-value-throws', ':a', ['a' => [1]], "':a', ['a' => [1]]");
$replace('replace-opaque-object-throws', ':a', ['a' => new LangOpaque], "':a', ['a' => new LangOpaque]");
$replace('replace-tag', 'We have some nice <docs-link>documentation</docs-link>', ['docs-link' => fn ($c) => "<a href=\"https://laravel.com/docs\">$c</a>"], "'We have some nice <docs-link>documentation</docs-link>', ['docs-link' => fn (\$c) => \"<a href=\\\"https://laravel.com/docs\\\">\$c</a>\"]");
$replace('replace-tag-repeats', '<bold-this>bold</bold-this> something else <bold-this>also bold</bold-this>', ['bold-this' => fn ($c) => "<b>$c</b>"], "'<bold-this>bold</bold-this> something else <bold-this>also bold</bold-this>', ['bold-this' => fn (\$c) => \"<b>\$c</b>\"]");
$replace('replace-tag-closure-int', '<b>x</b>', ['b' => fn () => 5], "'<b>x</b>', ['b' => fn () => 5]");
$replace('replace-tag-skips-newline', "<b>x\ny</b>", ['b' => fn ($c) => "[$c]"], "\"<b>x\\ny</b>\", ['b' => fn (\$c) => \"[\$c]\"]");
$replace('replace-tag-matches-carriage-return', "<b>x\ry</b>", ['b' => fn ($c) => "[$c]"], "\"<b>x\\ry</b>\", ['b' => fn (\$c) => \"[\$c]\"]");
$replace('replace-tag-is-lazy', '<b>a<b>c</b>d</b>', ['b' => fn ($c) => "[$c]"], "'<b>a<b>c</b>d</b>', ['b' => fn (\$c) => \"[\$c]\"]");
$replace('replace-tag-leaves-colon-placeholder', ':b <b>x</b>', ['b' => fn ($c) => "[$c]"], "':b <b>x</b>', ['b' => fn (\$c) => \"[\$c]\"]");
$replace('replace-tag-output-gets-placeholders', '<b>x</b>', ['b' => fn () => ':name', 'name' => 'Ann'], "'<b>x</b>', ['b' => fn () => ':name', 'name' => 'Ann']");
$replace('replace-tag-key-is-a-pattern', '<aXb>hi</aXb>', ['a.b' => fn ($c) => strtoupper($c)], "'<aXb>hi</aXb>', ['a.b' => fn (\$c) => strtoupper(\$c)]");

emit();
