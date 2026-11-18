---
url: /localization/translator.md
---
# Translator Reference

These are the exports of `@tolki/lang`: the `Translator` class with Laravel's public methods, the stateless functions, and the helpers `__`, `trans` and `transChoice` that `createHelpers` binds to a translator. Sections are alphabetical. Methods are called on a translator, so each example builds one from a small lines object. See [Installation & Usage](./index.md) for the shape of the lines.

## Translator Reference

[\_\_](#__) [addLines](#addlines) [array](#array) [bindLang](#bindlang) [choice](#choice) [choose](#choose) [createHelpers](#createhelpers) [createLang](#createlang) [determineLocalesUsing](#determinelocalesusing) [get](#get) [getFallback](#getfallback) [getLocale](#getlocale) [getPluralIndex](#getpluralindex) [handleMissingKeysUsing](#handlemissingkeysusing) [has](#has) [hasForLocale](#hasforlocale) [htmlLocale](#htmllocale) [locale](#locale) [makeReplacements](#makereplacements) [normalizeLocale](#normalizelocale) [parseKey](#parsekey) [setFallback](#setfallback) [setLoaded](#setloaded) [setLocale](#setlocale) [string](#string) [stringable](#stringable) [trans](#trans) [transChoice](#transchoice) [Translator](#translator)

## Translator Details

### \_\_

Translate the given message. Exported as `__` from the object that `createHelpers` returns. It answers `null` for a `null` key.

Laravel: [`__()`](https://laravel.com/docs/localization#retrieving-translation-strings)

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

### addLines

Add translation lines to the given locale.

Exported as the `addLines` method of `Translator`. Lines are keyed `group.item`, and the group `*` adds a JSON line. A key without a dot writes the item `""` of a group with that name, so `get("nodot")` answers `{ "": "v" }`. A package group takes its namespace as the third argument. The call merges into the lines the translator already holds and never changes the object you passed to the constructor. A JSON line's key is taken literally, dots included.&#x20;

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

translator.addLines({ nodot: "v" }, "en");

translator.get("nodot");
// => { "": "v" }
```

### array

Get the specified array translation value.

Exported as the `array` method of `Translator`. It answers a copy of the group, typed exactly, and throws `InvalidArgumentException` when the key names a line or nothing.&#x20;

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

### bindLang

Wrap a lang's reads so each one reports to a tracker first.

Exported as `bindLang` from `@tolki/lang`. It takes a lang and a `track` function, calls `track()` before every read, and answers what the lang answers. The reads are `__`, `trans`, `transChoice`, `has`, `hasForLocale`, `getLocale`, `getFallback`, `isLocale` and `isLoaded`. The Vue, React and Svelte entries are built on it: the tracker is how a view learns what it reads.

```js
import { bindLang, createLang } from "@tolki/lang";

const lang = createLang({ locale: "en", lines: { en: { Hi: "Hi" } } });

let reads = 0;
const tracked = bindLang(lang, () => {
  reads += 1;
});

tracked.__("Hi");
// => "Hi"

tracked.getLocale();
// => "en"

reads;
// => 2
```

### choice

Get a translation according to an integer value.

Exported as the `choice` method of `Translator`. It reads the line with `get()`, adds `count` to the replacements unless you gave one, and picks the form with [`choose`](#choose) for the locale that has the key, or the fallback locale. A key that names a group throws `TypeError`, as PHP's `explode()` does. With no fallback locale set, a key with no line uses plural index 0.&#x20;

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

A countable number is counted: an array, a `Map`, a `Set` or an object with a `count()` method.&#x20;

```js
import { Translator } from "@tolki/lang";

const translator = new Translator(
  { en: { apples: "one|:count apples" } },
  "en",
);

translator.choice("apples", ["a", "b", "c"]);
// => "3 apples"
```

### choose

Select a proper translation string based on the given number.

Exported as `choose` from `@tolki/lang`. It splits the line on `|`, takes the first segment whose `{n}` or `[from,to]` condition matches, and otherwise picks the form the locale's plural rule gives. Pass the locale spelled as Laravel does, `en_US` and not `en-US`. See [`normalizeLocale`](#normalizelocale).&#x20;

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

### createHelpers

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

### createLang

Create a translator that loads locales on demand and tells subscribers when its answers change.

Exported as `createLang` from `@tolki/lang`. The options are the starting `locale`, an optional `fallback`, the `lines` at hand and a `load` function that fetches a locale's lines, at once or as a promise. A module namespace from `import()` is unwrapped to its default export. It answers the helpers `__`, `trans` and `transChoice`, the reads `has`, `hasForLocale`, `getLocale`, `getFallback`, `isLocale` and `isLoaded`, and the `translator` behind them.

* `ready` is a promise that settles once the starting locale and the fallback are loaded. It rejects when a load fails.
* `setLocale(locale)` and `setFallback(locale)` load the locale before they switch, and the last call wins. A failed load rejects and changes nothing. `setFallback(null)` clears the fallback.
* `load(locale)` fetches a locale without switching, and notifies subscribers only when it loaded something new.
* `subscribe(listener)` calls the listener after each change and returns a function that stops the calls. `getVersion()` counts the changes.

**Warning:** A listener that throws never stops a switch. Its error is rethrown in a microtask, which a browser reports as an uncaught error and Node treats as an uncaught exception, so a listener on a server must not throw.

A loaded file replaces each top-level key it holds, a group, a `namespace::group` or a JSON line. Lines added earlier with `addLines()` under other keys survive. A locale that holds `/`, `\`, `..` or a NUL byte throws `InvalidArgumentException` from `createLang`, `setLocale`, `setFallback` and `load`, without calling the loader. A synchronous loader that throws makes `createLang` throw. See [Loading locales on demand](./index.md#loading-locales-on-demand).

```js
import { createLang } from "@tolki/lang";

const files = {
  en: { Welcome: "Welcome" },
  es: { Welcome: "Bienvenido" },
};

const lang = createLang({
  locale: "en",
  load: async (locale) => files[locale],
});

await lang.ready;

let changes = 0;
lang.subscribe(() => {
  changes += 1;
});

lang.translator.addLines({ "extra.x": "X" }, "es");

await lang.setLocale("es");

lang.__("Welcome");
// => "Bienvenido"

lang.__("extra.x");
// => "X"

changes;
// => 1

lang.getVersion();
// => 2
```

### determineLocalesUsing

Specify a callback that should be invoked to determine the applicable locale array.

Exported as the `determineLocalesUsing` method of `Translator`. The callback receives the locales a lookup would read, the locale and the fallback, and answers the ones it reads. Duplicates are dropped.&#x20;

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

### get

Get the translation for the given key.

Exported as the `get` method of `Translator`. A key is a JSON line's whole key, or `group.item` (`ns::group.item` for a package). It answers the line with its placeholders replaced, a copy of the group for a group key, and the key itself when nothing matches.&#x20;

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

A placeholder matches its name in three cases: `:name`, `:Name` and `:NAME`. The longest name is replaced first.&#x20;

Laravel: [`Replacing Parameters In Translation Strings`](https://laravel.com/docs/localization#replacing-parameters-in-translation-strings)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: {} }, "en");

translator.get(":name :Name :NAME", { name: "ann" });
// => "ann Ann ANN"
```

The values print as PHP prints them: `null` is empty, `true` is `1`, `false` is empty, and a float such as `0.1 + 0.2` is `0.3`.&#x20;

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: {} }, "en");

translator.get(":a|:b|:c|:d", { a: null, b: true, c: false, d: 0.1 + 0.2 });
// => "|1||0.3"
```

### getFallback

Get the fallback locale being used.

Exported as the `getFallback` method of `Translator`. A new translator has none, so it answers `null`.&#x20;

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

### getLocale

Get the default locale being used.

Exported as the `getLocale` method of `Translator`, and as `locale`.

Laravel: [`getLocale()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_getLocale)

```js
import { Translator } from "@tolki/lang";

new Translator({}, "es").getLocale();
// => "es"
```

### getPluralIndex

Get the index to use for pluralization.

Exported as `getPluralIndex` from `@tolki/lang`. The rule comes from Laravel's table of locales, and an unknown or `null` locale gets the default rule, which is always index 0. The table spells locales `en_US`, so `en-US` is unknown.&#x20;

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

### handleMissingKeysUsing

Register a callback that is responsible for handling missing translation keys.

Exported as the `handleMissingKeysUsing` method of `Translator`, which answers the translator. The callback receives the key, the replacements, the locale and whether the fallback was read, and its answer takes the place of the key, with the replacements applied. It does not run for a found line, and `null` stops it.&#x20;

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

If the callback throws, it is switched off, because PHP resets its guard flag without `finally`.&#x20;

### has

Determine if a translation exists.

Exported as the `has` method of `Translator`. It reads the fallback locale unless you pass `false` as the third argument. A group line that is equal to its key does not count. The missing-key callback does not run.&#x20;

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

### hasForLocale

Determine if a translation exists for a given locale.

Exported as the `hasForLocale` method of `Translator`. The fallback locale is ignored.&#x20;

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

### htmlLocale

Read the locale the page declares on its `<html lang>`.

Exported as `htmlLocale` from `@tolki/lang`. Pass the locales your lines hold. The tag must match one of them, ignoring case and treating `-` and `_` alike, and it answers the list's own spelling: `<html lang="pt-BR">` answers `pt_BR` when the list holds `pt_BR`, and `<html lang="sr-Latn">` answers `sr_Latn`. It answers `null` without a document, for an empty `lang`, or when no listed locale matches. Without a list, it answers the tag run through [`normalizeLocale`](#normalizelocale).

It needs a document, so the example does not run in Node.

```js
import { htmlLocale } from "@tolki/lang";

// With <html lang="pt-BR">:
htmlLocale(["pt_BR", "en"]); // "pt_BR"
htmlLocale(["en", "es"]); // null
htmlLocale(); // "pt_BR"

// With <html lang="sr-Latn">:
htmlLocale(["sr_Latn", "en"]); // "sr_Latn"
```

### locale

Get the default locale being used.

Exported as the `locale` method of `Translator`, an alias of [`getLocale`](#getlocale).

Laravel: [`locale()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_locale)

```js
import { Translator } from "@tolki/lang";

new Translator({}, "es").locale();
// => "es"
```

### makeReplacements

Make the place-holder replacements on a line.

Exported as `makeReplacements` from `@tolki/lang`. It replaces `:name`, `:Name` and `:NAME`, and a function value formats the text between `<name>` and `</name>`. The values are cast as PHP casts them. An array, or an object with no string form, throws `TypeError`. See [Differences from Laravel](./differences.md#objects-need-a-handler).&#x20;

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

::: warning
Tag callbacks and placeholder values are inserted unescaped, as in PHP, so never pass a line built from untrusted values to `v-html` or `dangerouslySetInnerHTML`.&#x20;
:::

A list of values replaces `:0`, `:1` and so on.&#x20;

```js
import { makeReplacements } from "@tolki/lang";

makeReplacements(":0 and :1", ["tea", "milk"]);
// => "tea and milk"
```

### normalizeLocale

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

### parseKey

Parse a key into namespace, group, and item.

Exported as the `parseKey` method of `Translator`. A key without a namespace has `*` for one, and a key that names a whole group has `null` for its item.&#x20;

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

### setFallback

Set the fallback locale being used.

Exported as the `setFallback` method of `Translator`. Pass `null` for none.

Laravel: [`setFallback()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_setFallback)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { Hi: "Hi" } }, "es");

translator.get("Hi");
// => "Hi"

translator.setFallback("en");

translator.getFallback();
// => "en"
```

### setLoaded

Set the loaded translation lines.

Exported as the `setLoaded` method of `Translator`. It replaces every line the translator holds.&#x20;

Laravel: [`setLoaded()`](https://api.laravel.com/docs/master/Illuminate/Translation/Translator.html#method_setLoaded)

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { Hi: "Hi" } }, "en");

translator.setLoaded({ en: { Hi: "Hello" } });

translator.get("Hi");
// => "Hello"
```

### setLocale

Set the default locale.

Exported as the `setLocale` method of `Translator`. A locale that holds `/`, `\`, `..` or a NUL byte throws `InvalidArgumentException`, and a region such as `en-US` is accepted.&#x20;

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

### string

Get the specified string translation value.

Exported as the `string` method of `Translator`. It throws `InvalidArgumentException` when the key names a group. A key with no line answers the key.&#x20;

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

### stringable

Add a handler to be executed in order to format a given class to a string during translation replacements.

Exported as the `stringable` method of `Translator`. It takes the class and the handler. The handler runs for exact instances of the class, not for a subclass, and its output is cased like any other value.&#x20;

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

### trans

Translate the given message. Exported as `trans` from the object that `createHelpers` returns. With no key it answers the translator.

Laravel: [`trans()`](https://laravel.com/docs/localization#retrieving-translation-strings)

```js
import { Translator, createHelpers } from "@tolki/lang";

const translator = new Translator({ en: { Hi: "Hi" } }, "en");
const { trans } = createHelpers(translator);

trans("Hi");
// => "Hi"

trans() === translator;
// => true
```

### transChoice

Translates the given message based on a count. Exported as `transChoice` from the object that `createHelpers` returns, the port of `trans_choice()`. It calls [`choice`](#choice).

Laravel: [`trans_choice()`](https://laravel.com/docs/localization#pluralization)

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

### Translator

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
