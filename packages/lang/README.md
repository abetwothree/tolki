<p align="center"><img src="https://raw.githubusercontent.com/abetwothree/tolki/refs/heads/master/docs/vitepress/public/tolki-logo-short.svg" width="50%" alt="Laravel Tolki JS Logo"></p>

# Tolki JS Language Package

This package provides Laravel's translator functionality in JavaScript.

Documentation: https://tolki.abe.dev/localization/

<!-- AUTO-GENERATED-DOCS:START -->

## Localization Installation

The [`@tolki/lang`](https://www.npmjs.com/package/@tolki/lang) package is a port of Laravel's translator. It replaces `:name` placeholders, picks plural forms for `{0} none|[1,*] many` lines and looks up dot keys, so the strings your Laravel app already has work on the JavaScript side. You can install it via npm, yarn, or pnpm:

```bash [npm]
npm install @tolki/lang
```

```bash [yarn]
yarn add @tolki/lang
```

```bash [pnpm]
pnpm add @tolki/lang
```

### The lines object

The translator does not read files. You pass it the lines, one object per locale, laid out like Laravel's `lang` folder. Inside a locale, a top-level array or plain object is a group, like a PHP file such as `lang/en/messages.php`. Any other value is a JSON line, like an entry in `lang/en.json`. A package's group is the top-level key `"<namespace>::<group>"`.

```js
import { Translator } from "@tolki/lang";

const lines = {
  en: {
    "I love programming.": "I love programming.",
    messages: {
      welcome: "Welcome, :name",
      apples: "{0} none|[1,*] :count apples",
    },
    "courier::mail": { sent: "Sent" },
  },
};

const translator = new Translator(lines, "en");

translator.get("I love programming.");
// => "I love programming."

translator.get("messages.welcome", { name: "ann" });
// => "Welcome, ann"

translator.get("courier::mail.sent");
// => "Sent"
```

A JSON line is looked up by its whole key, dots included, and a key that matches no line is answered as it came. <!-- docs/php-parity/Translator/get.json, "get-json-line"; docs/php-parity/Translator/get.json, "get-missing-returns-key" -->

```js
import { Translator } from "@tolki/lang";

const translator = new Translator(
  { en: { "Hello. World": "Hola. Mundo" } },
  "en",
);

translator.get("Hello. World");
// => "Hola. Mundo"

translator.get("messages.missing");
// => "messages.missing"
```

The key `"*"` reads a locale's JSON lines as one group, so `get("*.Hello")` reads the JSON line `Hello`. <!-- docs/php-parity/Translator/get.json, "get-star-group-reads-json-lines" -->

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { Hello: "Hola :name" } }, "en");

translator.get("*.Hello", { name: "Ann" });
// => "Hola Ann"
```

#### Building the lines on the server

With Laravel and Inertia, the server can build this object and share it as a prop. For the current locale and the fallback locale, read the JSON file with `lang_path()` when it exists, and each group file with the translator's loader.

```php
Inertia::share('lines', function () {
    $loader = app('translator')->getLoader();
    $lines = [];

    foreach (array_unique([app()->getLocale(), config('app.fallback_locale')]) as $locale) {
        $json = lang_path("{$locale}.json");

        $lines[$locale] = [
            ...(is_file($json) ? json_decode(file_get_contents($json), true) : []),
            'messages' => $loader->load($locale, 'messages'),
            'courier::mail' => $loader->load($locale, 'mail', 'courier'),
        ];
    }

    return $lines;
});
```

Read the groups through the loader rather than with `trans()`: for a locale without a group, `trans()` answers the fallback locale's whole group, which `hasForLocale()` and `choice()` would then take for the current locale's. <!-- docs/php-parity/Helpers/trans.json, "trans-whole-group-reads-fallback-locale" -->

Share the fallback locale's lines as well: after `setFallback()`, a group line the current locale lacks is read from the fallback locale, as in Laravel, and the translator can only read lines the page was sent. <!-- docs/php-parity/Translator/getFallback.json, "fallback-starts-null"; docs/php-parity/Translator/get.json, "get-group-reads-fallback-locale" -->

Share only the groups the page needs, because everything in the object ships to the browser.

### Quick start

Create a translator with the lines and the current locale, set a fallback locale, and bind the helpers `__`, `trans` and `transChoice` to it with `createHelpers`.

```js
import { Translator, createHelpers } from "@tolki/lang";

const translator = new Translator(
  {
    en: {
      Welcome: "Welcome",
      messages: { apples: "{0} none|[1,*] :count apples" },
    },
    es: { Welcome: "Bienvenido" },
  },
  "es",
);

translator.setFallback("en");

const { __, transChoice } = createHelpers(translator);

__("Welcome");
// => "Bienvenido"

transChoice("messages.apples", 5);
// => "5 apples"
```

The `es` lines have no `messages.apples`, so the lookup reads the fallback locale, `en`.

Laravel's constructor leaves the fallback locale empty, and only its service provider sets it from `config('app.fallback_locale')`. So a new `Translator` has no fallback until you call `setFallback()`. Without one, `choice()` on a key with no line picks plural index 0, so `transChoice("item|items", 5)` answers `item`. After `setFallback("en")` it answers `items`. <!-- docs/php-parity/Translator/choice.json, "choice-without-fallback-uses-first-form"; docs/php-parity/Translator/choice.json, "choice-with-fallback-uses-its-rule" -->

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({}, "en");

translator.choice("item|items", 5);
// => "item"

translator.setFallback("en");

translator.choice("item|items", 5);
// => "items"
```

Types come from the lines you pass. In TypeScript, the keys of `get`, `array`, `__` and `trans` complete in your editor, and a result is typed by the line it names. A key that names a group is typed `<group> | string`, because a locale without that group answers the key itself. Use `array()` to get a group typed exactly. It throws when the key does not name a group. <!-- docs/php-parity/Translator/array.json, "array-throws-for-line" -->

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { g: { a: "A", b: "B" } } }, "en");

translator.array("g");
// => { a: "A", b: "B" }

translator.array("g.a");
// => throws InvalidArgumentException
```

### Translating one string

The standalone functions need no translator. They are the stateless parts of Laravel's translator, and they are tree-shakable, so a page that shows one string from its props imports only what it uses.

```js
import { choose, makeReplacements } from "@tolki/lang";

makeReplacements("Welcome, :name", { name: "ann" });
// => "Welcome, ann"

choose("{0} none|[1,*] :count apples", 5, "en");
// => ":count apples"
```

See [`choose`](https://tolki.abe.dev/localization/translator.html#choose), [`getPluralIndex`](https://tolki.abe.dev/localization/translator.html#getpluralindex), [`makeReplacements`](https://tolki.abe.dev/localization/translator.html#makereplacements) and [`normalizeLocale`](https://tolki.abe.dev/localization/translator.html#normalizelocale) for each one.

Laravel's plural table spells locales `en_US`, so a hyphenated BCP 47 tag such as `en-US` or `pt-BR` gets Laravel's default rule, plural index 0. `choose("item|items", 5, "en-US")` answers `item`, as Laravel does. <!-- docs/php-parity/MessageSelector/getPluralIndex.json, "plural-index-en-US"; docs/php-parity/MessageSelector/choose.json, "choose-hyphen-locale" --> Pass the locale through `normalizeLocale()` first, and give your lines the same spelling.

```js
import { choose, normalizeLocale } from "@tolki/lang";

choose("item|items", 5, "en-US");
// => "item"

normalizeLocale("en-US");
// => "en_US"

choose("item|items", 5, normalizeLocale("en-US"));
// => "items"
```

### One translator per request

`createHelpers` keeps no state of its own, and neither do the standalone functions. The helpers read the translator you give them, and the translator holds its locale. Under server-side rendering, create a translator for each request, so two requests never share a locale. A translator built once at module level would carry one request's locale into the next.

```js
import { Translator, createHelpers } from "@tolki/lang";

const lines = { en: { Hi: "Hi" }, es: { Hi: "Hola" } };

function renderFor(locale) {
  const { __ } = createHelpers(new Translator(lines, locale));

  return __("Hi");
}

renderFor("es");
// => "Hola"

renderFor("en");
// => "Hi"
```

The translator never changes the lines object it was given, so one `lines` object can serve every request.

### Next

- [Translator Reference](https://tolki.abe.dev/localization/translator.html) lists every export with an example.
- [Differences from Laravel](https://tolki.abe.dev/localization/differences.html) lists what this port does not do the way PHP does.

## Translator Reference

These are the exports of `@tolki/lang`: the `Translator` class with Laravel's public methods, the stateless functions, and the helpers `__`, `trans` and `transChoice` that `createHelpers` binds to a translator. Sections are alphabetical. Methods are called on a translator, so each example builds one from a small lines object. See [Installation & Usage](https://tolki.abe.dev/localization/index.html) for the shape of the lines.

### Translator Reference

[\_\_](#__) [addLines](#addlines) [array](#array) [choice](#choice) [choose](#choose) [createHelpers](#createhelpers) [determineLocalesUsing](#determinelocalesusing) [get](#get) [getFallback](#getfallback) [getLocale](#getlocale) [getPluralIndex](#getpluralindex) [handleMissingKeysUsing](#handlemissingkeysusing) [has](#has) [hasForLocale](#hasforlocale) [locale](#locale) [makeReplacements](#makereplacements) [normalizeLocale](#normalizelocale) [parseKey](#parsekey) [setFallback](#setfallback) [setLoaded](#setloaded) [setLocale](#setlocale) [string](#string) [stringable](#stringable) [trans](#trans) [transChoice](#transchoice) [Translator](#translator)

### Translator Details

#### \_\_

Translate the given message. Exported as `__` from the object that `createHelpers` returns. It answers `null` for a `null` key.

Laravel: [`__()`](https://laravel.com/docs/localization#retrieving-translation-strings)

<!-- docs/php-parity/Helpers/__.json, "underscore-translates"; docs/php-parity/Helpers/__.json, "underscore-null-key" -->

```js
import { Translator, createHelpers } from "@tolki/lang";

const { __ } = createHelpers(
  new Translator({ en: { messages: { welcome: "Welcome, :name" } } }, "en"),
);

__("messages.welcome", { name: "ann" });
// => "Welcome, ann"

__(null);
// => null
```

#### addLines

Add translation lines to the given locale.

Exported as the `addLines` method of `Translator`. Lines are keyed `group.item`, a key without a dot names a whole group, and the group `*` adds a JSON line. A package group takes its namespace as the third argument. The call merges into the lines the translator already holds and never changes the object you passed to the constructor. A JSON line's key is taken literally, dots included. <!-- docs/php-parity/Translator/addLines.json, "add-lines-merges-into-a-loaded-group"; docs/php-parity/Translator/addLines.json, "add-lines-json-group"; docs/php-parity/Translator/addLines.json, "add-lines-namespace" -->

Laravel: [`addLines()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_addLines)

```js
import { Translator } from "@tolki/lang";

const lines = { en: { messages: { welcome: "Welcome" } } };
const translator = new Translator(lines, "en");

translator.addLines({ "messages.bye": "Bye", "*.Hello": "Hola" }, "en");
translator.addLines({ "mail.sent": "Sent" }, "en", "courier");

translator.get("messages");
// => { welcome: "Welcome", bye: "Bye" }

translator.get("Hello");
// => "Hola"

translator.get("courier::mail.sent");
// => "Sent"

lines;
// => { en: { messages: { welcome: "Welcome" } } }
```

#### array

Get the specified array translation value.

Exported as the `array` method of `Translator`. It answers a copy of the group, typed exactly, and throws `InvalidArgumentException` when the key names a line or nothing. <!-- docs/php-parity/Translator/array.json, "array-returns-group"; docs/php-parity/Translator/array.json, "array-throws-for-line"; docs/php-parity/Translator/array.json, "array-throws-for-missing-key" -->

Laravel: [`array()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_array)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator(
  { en: { g: { list: ["a", "b"], a: "A" } } },
  "en",
);

translator.array("g.list");
// => ["a", "b"]

translator.array("g.a");
// => throws InvalidArgumentException

translator.array("g.missing");
// => throws InvalidArgumentException
```

#### choice

Get a translation according to an integer value.

Exported as the `choice` method of `Translator`. It reads the line with `get()`, adds `count` to the replacements unless you gave one, and picks the form with [`choose`](#choose) for the locale that has the key, or the fallback locale. A key that names a group throws `TypeError`, as PHP's `explode()` does. With no fallback locale set, a key with no line uses plural index 0. <!-- docs/php-parity/Translator/choice.json, "choice-fills-count"; docs/php-parity/Translator/choice.json, "choice-on-a-group-throws"; docs/php-parity/Translator/choice.json, "choice-without-fallback-uses-first-form" -->

Laravel: [`choice()`](https://laravel.com/docs/localization#pluralization)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator(
  { en: { apples: "{0} none|[1,*] :count apples", g: { a: "A" } } },
  "en",
);

translator.choice("apples", 5);
// => "5 apples"

translator.choice("apples", 0);
// => "none"

translator.choice("g", 2);
// => throws TypeError
```

A countable number is counted: an array, a `Map`, a `Set` or an object with a `count()` method. <!-- docs/php-parity/Translator/choice.json, "choice-counts-list"; docs/php-parity/Translator/choice.json, "choice-counts-collection" -->

```js
import { Translator } from "@tolki/lang";

const translator = new Translator(
  { en: { apples: "one|:count apples" } },
  "en",
);

translator.choice("apples", ["a", "b", "c"]);
// => "3 apples"
```

#### choose

Select a proper translation string based on the given number.

Exported as `choose` from `@tolki/lang`. It splits the line on `|`, takes the first segment whose `{n}` or `[from,to]` condition matches, and otherwise picks the form the locale's plural rule gives. Pass the locale spelled as Laravel does, `en_US` and not `en-US`. See [`normalizeLocale`](#normalizelocale). <!-- docs/php-parity/MessageSelector/choose.json, "choose-laravel-data-00"; docs/php-parity/MessageSelector/choose.json, "choose-hyphen-locale" -->

Laravel: [`MessageSelector::choose()`](https://laravel.com/docs/localization#pluralization)

```js
import { choose } from "@tolki/lang";

choose("{0} none|{1} one|[2,*] many", 0, "en");
// => "none"

choose("{0} none|{1} one|[2,*] many", 1, "en");
// => "one"

choose("{0} none|{1} one|[2,*] many", 5, "en");
// => "many"

choose("item|items", 5, "en");
// => "items"
```

#### createHelpers

Create `__`, `trans` and `transChoice` bound to one translator.

Exported as `createHelpers` from `@tolki/lang`. It keeps no state of its own, so two translators in two requests never share a locale.

Laravel: [`__()`, `trans()` and `trans_choice()`](https://laravel.com/docs/localization#retrieving-translation-strings)

```js
import { Translator, createHelpers } from "@tolki/lang";

const { __, trans, transChoice } = createHelpers(
  new Translator({ en: { Hi: "Hi", apples: "one|:count apples" } }, "en"),
);

__("Hi");
// => "Hi"

trans("Hi");
// => "Hi"

transChoice("apples", 2);
// => "2 apples"
```

#### determineLocalesUsing

Specify a callback that should be invoked to determine the applicable locale array.

Exported as the `determineLocalesUsing` method of `Translator`. The callback receives the locales a lookup would read, the locale and the fallback, and answers the ones it reads. Duplicates are dropped. <!-- docs/php-parity/Translator/determineLocalesUsing.json, "determine-locales-receives-locales"; docs/php-parity/Translator/determineLocalesUsing.json, "determine-locales-adds-locale"; docs/php-parity/Translator/determineLocalesUsing.json, "determine-locales-receives-duplicates" -->

Laravel: [`determineLocalesUsing()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_determineLocalesUsing)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { g: { a: "A" } }, es: {} }, "es");

translator.get("g.a");
// => "g.a"

translator.determineLocalesUsing((locales) => [...locales, "en"]);

translator.get("g.a");
// => "A"
```

#### get

Get the translation for the given key.

Exported as the `get` method of `Translator`. A key is a JSON line's whole key, or `group.item` (`ns::group.item` for a package). It answers the line with its placeholders replaced, a copy of the group for a group key, and the key itself when nothing matches. <!-- docs/php-parity/Translator/get.json, "get-json-line-replaces"; docs/php-parity/Translator/get.json, "get-missing-returns-key"; docs/php-parity/Translator/get.json, "get-whole-group-walks-replacements" -->

Laravel: [`get()`](https://laravel.com/docs/localization#retrieving-translation-strings)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator(
  {
    en: {
      Hello: "Hello, :name",
      messages: { welcome: "Welcome, :name", bye: "Bye, :name" },
    },
  },
  "en",
);

translator.get("Hello", { name: "ann" });
// => "Hello, ann"

translator.get("messages.welcome", { name: "ann" });
// => "Welcome, ann"

translator.get("messages", { name: "ann" });
// => { welcome: "Welcome, ann", bye: "Bye, ann" }

translator.get("messages.missing");
// => "messages.missing"
```

A placeholder matches its name in three cases: `:name`, `:Name` and `:NAME`. The longest name is replaced first. <!-- docs/php-parity/Translator/makeReplacements.json, "replace-case-variants"; docs/php-parity/Translator/makeReplacements.json, "replace-longest-key-first" -->

Laravel: [`Replacing Parameters In Translation Strings`](https://laravel.com/docs/localization#replacing-parameters-in-translation-strings)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: {} }, "en");

translator.get(":name :Name :NAME", { name: "ann" });
// => "ann Ann ANN"
```

The values print as PHP prints them: `null` is empty, `true` is `1`, `false` is empty, and a float such as `0.1 + 0.2` is `0.3`. <!-- docs/php-parity/Translator/makeReplacements.json, "replace-null-is-empty"; docs/php-parity/Translator/makeReplacements.json, "replace-bools"; docs/php-parity/Translator/makeReplacements.json, "replace-float" -->

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: {} }, "en");

translator.get(":a|:b|:c|:d", { a: null, b: true, c: false, d: 0.1 + 0.2 });
// => "|1||0.3"
```

#### getFallback

Get the fallback locale being used.

Exported as the `getFallback` method of `Translator`. A new translator has none, so it answers `null`. <!-- docs/php-parity/Translator/getFallback.json, "fallback-starts-null"; docs/php-parity/Translator/getFallback.json, "fallback-is-set" -->

Laravel: [`getFallback()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_getFallback)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({}, "en");

translator.getFallback();
// => null

translator.setFallback("es");

translator.getFallback();
// => "es"
```

#### getLocale

Get the default locale being used.

Exported as the `getLocale` method of `Translator`, and as `locale`.

Laravel: [`getLocale()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_getLocale)

<!-- docs/php-parity/Translator/getLocale.json, "get-locale-reads-current" -->

```js
import { Translator } from "@tolki/lang";

new Translator({}, "es").getLocale();
// => "es"
```

#### getPluralIndex

Get the index to use for pluralization.

Exported as `getPluralIndex` from `@tolki/lang`. The rule comes from Laravel's table of locales, and an unknown or `null` locale gets the default rule, which is always index 0. The table spells locales `en_US`, so `en-US` is unknown. <!-- docs/php-parity/MessageSelector/getPluralIndex.json, "plural-index-ru"; docs/php-parity/MessageSelector/getPluralIndex.json, "plural-index-en-US"; docs/php-parity/MessageSelector/getPluralIndex.json, "plural-index-null-number" -->

Laravel: [`MessageSelector::getPluralIndex()`](https://laravel.com/docs/localization#pluralization-language)

```js
import { getPluralIndex } from "@tolki/lang";

getPluralIndex("en", 1);
// => 0

getPluralIndex("en", 5);
// => 1

getPluralIndex("ru", 2);
// => 1

getPluralIndex("en-US", 5);
// => 0
```

#### handleMissingKeysUsing

Register a callback that is responsible for handling missing translation keys.

Exported as the `handleMissingKeysUsing` method of `Translator`, which answers the translator. The callback receives the key, the replacements, the locale and whether the fallback was read, and its answer takes the place of the key, with the replacements applied. It does not run for a found line, and `null` stops it. <!-- docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-receives-arguments"; docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-result-is-replaced"; docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-skipped-for-a-found-line"; docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-null-keeps-key" -->

Laravel: [`handleMissingKeysUsing()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_handleMissingKeysUsing)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { Hi: "Hi" } }, "en");

translator.handleMissingKeysUsing(() => "Missing :x");

translator.get("nope", { x: "1" });
// => "Missing 1"

translator.get("Hi");
// => "Hi"

translator.handleMissingKeysUsing(null);

translator.get("nope");
// => "nope"
```

If the callback throws, it is switched off, because PHP resets its guard flag without `finally`. <!-- docs/php-parity/Translator/handleMissingKeysUsing.json, "missing-key-handler-throw-disables-it" -->

#### has

Determine if a translation exists.

Exported as the `has` method of `Translator`. It reads the fallback locale unless you pass `false` as the third argument. A group line that is equal to its key does not count. The missing-key callback does not run. <!-- docs/php-parity/Translator/has.json, "has-reads-fallback"; docs/php-parity/Translator/has.json, "has-group-line-equal-to-key"; docs/php-parity/Translator/has.json, "has-skips-missing-key-handler" -->

Laravel: [`has()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_has)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator(
  { en: { g: { a: "A" } }, es: { g: { b: "B" } } },
  "es",
);

translator.setFallback("en");

translator.has("g.a");
// => true

translator.has("g.a", null, false);
// => false

translator.has("g.z");
// => false
```

#### hasForLocale

Determine if a translation exists for a given locale.

Exported as the `hasForLocale` method of `Translator`. The fallback locale is ignored. <!-- docs/php-parity/Translator/hasForLocale.json, "has-for-locale-ignores-fallback" -->

Laravel: [`hasForLocale()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_hasForLocale)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator(
  { en: { g: { a: "A" } }, es: { g: { b: "B" } } },
  "es",
);

translator.setFallback("en");

translator.hasForLocale("g.a");
// => false

translator.hasForLocale("g.b");
// => true
```

#### locale

Get the default locale being used.

Exported as the `locale` method of `Translator`, an alias of [`getLocale`](#getlocale).

Laravel: [`locale()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_locale)

<!-- docs/php-parity/Translator/getLocale.json, "locale-alias-reads-current" -->

```js
import { Translator } from "@tolki/lang";

new Translator({}, "es").locale();
// => "es"
```

#### makeReplacements

Make the place-holder replacements on a line.

Exported as `makeReplacements` from `@tolki/lang`. It replaces `:name`, `:Name` and `:NAME`, and a function value formats the text between `<name>` and `</name>`. The values are cast as PHP casts them. An array, or an object with no string form, throws `TypeError`. See [Differences from Laravel](https://tolki.abe.dev/localization/differences.html#objects-need-a-handler). <!-- docs/php-parity/Translator/makeReplacements.json, "replace-case-variants"; docs/php-parity/Translator/makeReplacements.json, "replace-tag"; docs/php-parity/Translator/makeReplacements.json, "replace-array-value-throws" -->

Laravel: [`makeReplacements()`](https://laravel.com/docs/localization#replacing-parameters-in-translation-strings)

```js
import { makeReplacements } from "@tolki/lang";

makeReplacements("Hello :name", { name: "ann" });
// => "Hello ann"

makeReplacements(":Name :NAME", { name: "ann" });
// => "Ann ANN"

makeReplacements("<b>hi</b>", { b: (text) => `[${text}]` });
// => "[hi]"

makeReplacements(":a", { a: [1] });
// => throws TypeError
```

Tag callbacks and placeholder values are inserted unescaped, as in PHP, so never pass a line built from untrusted values to `v-html` or `dangerouslySetInnerHTML`. <!-- docs/php-parity/Translator/makeReplacements.json, "replace-value-keeps-html"; docs/php-parity/Translator/makeReplacements.json, "replace-tag" -->

A list of values replaces `:0`, `:1` and so on. <!-- docs/php-parity/Translator/makeReplacements.json, "replace-list" -->

```js
import { makeReplacements } from "@tolki/lang";

makeReplacements(":0 and :1", ["tea", "milk"]);
// => "tea and milk"
```

#### normalizeLocale

Turn a BCP 47 tag into the spelling Laravel's plural table uses.

Exported as `normalizeLocale` from `@tolki/lang`.

```js
import { normalizeLocale } from "@tolki/lang";

normalizeLocale("en-US");
// => "en_US"

normalizeLocale("pt-br");
// => "pt_BR"

normalizeLocale("fr");
// => "fr"
```

#### parseKey

Parse a key into namespace, group, and item.

Exported as the `parseKey` method of `Translator`. A key without a namespace has `*` for one, and a key that names a whole group has `null` for its item. <!-- docs/php-parity/Translator/parseKey.json, "parse-key-namespaced"; docs/php-parity/Translator/parseKey.json, "parse-key-group-only" -->

Laravel: [`parseKey()`](https://api.laravel.com/docs/master/Illuminate/Support/NamespacedItemResolver.html#method_parseKey)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({}, "en");

translator.parseKey("courier::mail.sent");
// => ["courier", "mail", "sent"]

translator.parseKey("messages");
// => ["*", "messages", null]

translator.parseKey("messages.welcome");
// => ["*", "messages", "welcome"]
```

#### setFallback

Set the fallback locale being used.

Exported as the `setFallback` method of `Translator`. Pass `null` for none.

Laravel: [`setFallback()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_setFallback)

<!-- docs/php-parity/Translator/getFallback.json, "fallback-is-set" -->

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { Hi: "Hi" } }, "es");

translator.get("Hi");
// => "Hi"

translator.setFallback("en");

translator.getFallback();
// => "en"
```

#### setLoaded

Set the loaded translation lines.

Exported as the `setLoaded` method of `Translator`. It replaces every line the translator holds. <!-- docs/php-parity/Translator/setLoaded.json, "set-loaded-replaces-lines" -->

Laravel: [`setLoaded()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_setLoaded)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { Hi: "Hi" } }, "en");

translator.setLoaded({ en: { Hi: "Hello" } });

translator.get("Hi");
// => "Hello"
```

#### setLocale

Set the default locale.

Exported as the `setLocale` method of `Translator`. A locale that holds `/`, `\`, `..` or a NUL byte throws `InvalidArgumentException`, and a region such as `en-US` is accepted. <!-- docs/php-parity/Translator/setLocale.json, "set-locale-accepts-region"; docs/php-parity/Translator/setLocale.json, "set-locale-rejects-parent-path"; docs/php-parity/Translator/setLocale.json, "set-locale-keeps-previous-locale" -->

Laravel: [`setLocale()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_setLocale)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({}, "en");

translator.setLocale("pt-BR");

translator.getLocale();
// => "pt-BR"

translator.setLocale("../etc");
// => throws InvalidArgumentException

translator.getLocale();
// => "pt-BR"
```

#### string

Get the specified string translation value.

Exported as the `string` method of `Translator`. It throws `InvalidArgumentException` when the key names a group. A key with no line answers the key. <!-- docs/php-parity/Translator/string.json, "string-returns-line"; docs/php-parity/Translator/string.json, "string-throws-for-group"; docs/php-parity/Translator/string.json, "string-returns-missing-key" -->

Laravel: [`string()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_string)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { g: { a: "A" } } }, "en");

translator.string("g.a");
// => "A"

translator.string("g.zzz");
// => "g.zzz"

translator.string("g");
// => throws InvalidArgumentException
```

#### stringable

Add a handler to be executed in order to format a given class to a string during translation replacements.

Exported as the `stringable` method of `Translator`. It takes the class and the handler. The handler runs for exact instances of the class, not for a subclass, and its output is cased like any other value. <!-- docs/php-parity/Translator/stringable.json, "stringable-handler-formats-its-class"; docs/php-parity/Translator/stringable.json, "stringable-handler-output-is-cased"; docs/php-parity/Translator/stringable.json, "stringable-handler-skips-a-subclass" -->

Laravel: [`Object Replacement Formatting`](https://laravel.com/docs/localization#object-replacement-formatting)

```js
import { Translator } from "@tolki/lang";

class Money {
  constructor(cents) {
    this.cents = cents;
  }
}

const translator = new Translator({ en: {} }, "en");

translator.stringable(Money, (money) => `$${money.cents / 100}`);

translator.get("Total: :total", { total: new Money(550) });
// => "Total: $5.5"
```

#### trans

Translate the given message. Exported as `trans` from the object that `createHelpers` returns. With no key it answers the translator.

Laravel: [`trans()`](https://laravel.com/docs/localization#retrieving-translation-strings)

<!-- docs/php-parity/Helpers/trans.json, "trans-translates"; docs/php-parity/Helpers/trans.json, "trans-without-key-returns-translator" -->

```js
import { Translator, createHelpers } from "@tolki/lang";

const translator = new Translator({ en: { Hi: "Hi" } }, "en");
const { trans } = createHelpers(translator);

trans("Hi");
// => "Hi"

trans() === translator;
// => true
```

#### transChoice

Translates the given message based on a count. Exported as `transChoice` from the object that `createHelpers` returns, the port of `trans_choice()`. It calls [`choice`](#choice).

Laravel: [`trans_choice()`](https://laravel.com/docs/localization#pluralization)

<!-- docs/php-parity/Helpers/trans_choice.json, "trans-choice-with-fallback"; docs/php-parity/Helpers/trans_choice.json, "trans-choice-without-fallback" -->

```js
import { Translator, createHelpers } from "@tolki/lang";

const translator = new Translator(
  { en: { apples: "one|:count apples" } },
  "en",
);
const { transChoice } = createHelpers(translator);

transChoice("apples", 3);
// => "3 apples"
```

#### Translator

Create a new translator instance.

Exported as the class `Translator` from `@tolki/lang`. It takes the lines, one object per locale, and the default locale. The lines you pass count as already loaded, and the translator never changes them. Every group `get()` returns is a fresh copy. A key, group or locale named `constructor` or `__proto__` reads only own data.

Laravel: [`Translator`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html)

```js
import { Translator } from "@tolki/lang";

const lines = { en: { g: { a: "A" } } };
const translator = new Translator(lines, "en");

translator.get("g").a = "changed";

translator.get("g.a");
// => "A"

translator.get("constructor");
// => "constructor"
```

## Differences from Laravel

`@tolki/lang` follows Laravel's `Translator` and `MessageSelector` wherever JavaScript can hold the same data. These are the places where it cannot, or chooses not to.

### One object for the JSON and group files

Laravel loads `lang/en.json` and the `lang/en/*.php` files separately. This port takes one object per locale, in which a top-level array or plain object is a group and any other value is a JSON line. The key `"*"` reads the JSON lines as a group, so `get("*.Hello")` reads the JSON line `Hello`, as in Laravel. <!-- docs/php-parity/Translator/get.json, "get-star-group-reads-json-lines"; docs/php-parity/Translator/get.json, "get-json-line-is-not-a-group" -->

```js
import { Translator } from "@tolki/lang";

const translator = new Translator(
  { en: { Hello: "Hola", messages: { welcome: "Bienvenido" } } },
  "en",
);

translator.get("*.Hello");
// => "Hola"

translator.get("messages.welcome");
// => "Bienvenido"
```

This merged shape changes three results of `addLines()`:

- `addLines({ "*.x.y": "xy" }, "en")` stores one JSON line with the key `x.y`. Laravel splits the rest of the key on dots, so it answers the key `x.y` with `x.y` and never finds the line. <!-- docs/php-parity/Translator/addLines.json, "add-lines-json-dotted-key" -->

  ```js
  import { Translator } from "@tolki/lang";

  const translator = new Translator({ en: {} }, "en");

  translator.addLines({ "*.x.y": "xy" }, "en");

  translator.get("x.y");
  // => "xy"
  ```

- `addLines()` drops a non-numeric item written into a group that is a list. Laravel keeps it under that key, next to the list's own indexes. A list stays a list here, as it does in `@tolki/collection`. <!-- docs/php-parity/Translator/addLines.json, "add-lines-keeps-a-string-key-in-a-list-group" -->

  ```js
  import { Translator } from "@tolki/lang";

  const translator = new Translator({ en: { g: ["a", "b"] } }, "en");

  translator.addLines({ "g.x": "X" }, "en");

  translator.get("g");
  // => ["a", "b"]

  translator.addLines({ "g.1": "B" }, "en");

  translator.get("g");
  // => ["a", "B"]
  ```

- `addLines()` replaces a JSON line with a group when both share a key, because one object cannot hold both. Laravel keeps both: after `addLines({ "Hello.x": "X" }, "en")` it still answers `get("Hello")` with the JSON line. <!-- docs/php-parity/Translator/addLines.json, "add-lines-keeps-a-json-line-beside-a-group" -->

  ```js
  import { Translator } from "@tolki/lang";

  const translator = new Translator({ en: { Hello: "Hola" } }, "en");

  translator.addLines({ "Hello.x": "X" }, "en");

  translator.get("Hello");
  // => { x: "X" }
  ```

`setLoaded()` takes the same per-locale object as the constructor. Laravel's `setLoaded()` takes its loaded array, keyed by namespace, then group, then locale, such as `['*' => ['messages' => ['en' => [...]]]]`. <!-- docs/php-parity/Translator/setLoaded.json, "set-loaded-replaces-lines" -->

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { g: { a: "old" } } }, "en");

translator.setLoaded({ en: { g: { a: "new" } } });

translator.get("g.a");
// => "new"
```

### Types follow the constructor's lines

The keys and results are typed from the lines you pass to the constructor. A group that only `addLines()` added is typed as a string, the answer for a key with no line, even though `get()` answers the group. Read such a group with `array()`, which is typed as a group, or cast the result.

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { messages: { hi: "Hi" } } }, "en");

translator.addLines({ "extra.bye": "Bye" }, "en");

translator.get("extra");
// => { bye: "Bye" }

translator.array("extra");
// => { bye: "Bye" }
```

### Locales and the fallback

Laravel's plural table spells locales `en_US`, so a hyphenated BCP 47 tag gets the default rule, which is always index 0, so `getPluralIndex("en-US", 5)` is 0. This port matches Laravel and adds [`normalizeLocale`](https://tolki.abe.dev/localization/translator.html#normalizelocale) to convert a tag, which you apply to the locale and to the keys of your lines alike. <!-- docs/php-parity/MessageSelector/getPluralIndex.json, "plural-index-en-US"; docs/php-parity/MessageSelector/getPluralIndex.json, "plural-index-pt-BR" -->

```js
import { getPluralIndex, normalizeLocale } from "@tolki/lang";

getPluralIndex("pt-BR", 2);
// => 0

getPluralIndex(normalizeLocale("pt-BR"), 2);
// => 1

getPluralIndex(normalizeLocale("pt-BR"), 1);
// => 0
```

A new `Translator` has no fallback locale, as in Laravel, where only the service provider sets one. Call `setFallback()`. See [the warning on setting a fallback](https://tolki.abe.dev/localization/index.html#quick-start). <!-- docs/php-parity/Translator/getFallback.json, "fallback-starts-null"; docs/php-parity/Translator/choice.json, "choice-without-fallback-uses-first-form" -->

### Tag keys match literally

Laravel builds the pattern for a tag callback from the key as it is, so a key `a.b` also matches `<aXb>`. This port escapes the key, and `a.b` matches only `<a.b>`. <!-- docs/php-parity/Translator/makeReplacements.json, "replace-tag-key-is-a-pattern" -->

```js
import { makeReplacements } from "@tolki/lang";

makeReplacements("<a.b>hi</a.b> <aXb>hi</aXb>", {
  "a.b": (text) => text.toUpperCase(),
});
// => "HI <aXb>hi</aXb>"
```

### Replacements are not escaped

Tag callbacks and placeholder values are inserted unescaped, as in PHP, so never pass a line built from untrusted values to `v-html` or `dangerouslySetInnerHTML`. <!-- docs/php-parity/Translator/makeReplacements.json, "replace-value-keeps-html"; docs/php-parity/Translator/makeReplacements.json, "replace-tag" -->

```js
import { makeReplacements } from "@tolki/lang";

makeReplacements("Hi :name", { name: "<b>Ann</b>" });
// => "Hi <b>Ann</b>"

makeReplacements("<b>hi</b>", { b: (text) => `<i>${text}</i>` });
// => "<i>hi</i>"
```

### Objects need a handler

PHP can print an object that has `__toString`, an enum case, and a Carbon date. In JavaScript only an object with its own `toString` and an `@tolki/enum` case can. A `Date`, or any object without its own `toString`, throws `TypeError`, as PHP throws for a `DateTime`, unless `stringable(Class, handler)` covers its class. A handler runs for exact instances of the class, so register a subclass too. <!-- docs/php-parity/Translator/makeReplacements.json, "replace-opaque-object-throws"; docs/php-parity/Translator/stringable.json, "stringable-handler-skips-a-subclass" -->

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: {} }, "en");

translator.get("Due :date", { date: new Date(0) });
// => throws TypeError

translator.stringable(Date, (date) => date.toISOString().slice(0, 10));

translator.get("Due :date", { date: new Date(0) });
// => "Due 1970-01-01"
```

Laravel's one-argument form, `stringable(fn (Money $money) => …)`, reads the class from the parameter's type. JavaScript has no parameter types to read, so only the two-argument form exists.

### Title case

For `:Name`, PHP title-cases the first character with `mb_ucfirst`. This port uses `ucfirst` from `@tolki/str`, which upper-cases it. These two characters are known to differ: `ß`, which PHP title-cases to `Ss` and this port to `SS`, and `ǆ`, which PHP title-cases to `ǅ` and this port to `Ǆ`. <!-- docs/php-parity/Translator/makeReplacements.json, "replace-sharp-s-title-case"; docs/php-parity/Translator/makeReplacements.json, "replace-digraph-title-case" -->

```js
import { makeReplacements } from "@tolki/lang";

makeReplacements(":Name", { name: "ßtraße" });
// => "SStraße"

makeReplacements(":Name", { name: "ǆemal" });
// => "Ǆemal"
```

### No file loading

The caller passes the lines. There is no loader, so the translator never reads `lang/en.json` or `lang/en/messages.php`, and there is no `addNamespace`, `addPath` or `addJsonPath`. Build the lines object on the server, as shown in [Installation & Usage](https://tolki.abe.dev/localization/index.html#building-the-lines-on-the-server), or import your JSON files.

### Not ported

- `load`, `isLoaded`, `getLoader`, `addNamespace`, `addPath`, `addJsonPath`, `FileLoader`, `ArrayLoader` and `TranslationServiceProvider`: loading lang files is the caller's job here.
- `getSelector` and `setSelector`: the selector is the stateless functions `choose` and `getPluralIndex`.
- `NamespacedItemResolver::setParsedKey` and `flushParsedKeys`, and the parse cache: the cache is invisible except through those two, which exist for the config repository.
- `Macroable`, and `stringable()` with a single closure argument: JavaScript has neither macros on this class nor parameter types to read.
- The `name` of a pure (unit) enum: an `@tolki/enum` case always has a `value`.
- `PotentiallyTranslatedString`, `CreatesPotentiallyTranslatedStrings` and `HasLocalePreference`: they are plumbing for validation and notifications.

<!-- AUTO-GENERATED-DOCS:END -->
