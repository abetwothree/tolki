# Localization Installation

The [`@tolki/lang`](https://www.npmjs.com/package/@tolki/lang) package is a port of Laravel's translator. It replaces `:name` placeholders, picks plural forms for `{0} none|[1,*] many` lines and looks up dot keys, so the strings your Laravel app already has work on the JavaScript side. You can install it via npm, yarn, or pnpm:

::: code-group

```bash [npm]
npm install @tolki/lang
```

```bash [yarn]
yarn add @tolki/lang
```

```bash [pnpm]
pnpm add @tolki/lang
```

:::

## The lines object

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

### Building the lines on the server

With Laravel and Inertia, the server can build this object and share it as a prop. For the current locale and the fallback locale, read the JSON file with `lang_path()` when it exists, and add each group with `trans()`, which answers a whole group when you give it only the group's name. <!-- docs/php-parity/Translator/get.json, "get-group-leaves-keep-type-without-replacements" -->

```php
Inertia::share('lines', function () {
    $lines = [];

    foreach (array_unique([app()->getLocale(), config('app.fallback_locale')]) as $locale) {
        $json = lang_path("{$locale}.json");

        $lines[$locale] = [
            ...(is_file($json) ? json_decode(file_get_contents($json), true) : []),
            'messages' => trans('messages', [], $locale),
            'courier::mail' => trans('courier::mail', [], $locale),
        ];
    }

    return $lines;
});
```

Share the fallback locale's lines as well: after `setFallback()`, a group line the current locale lacks is read from the fallback locale, as in Laravel, and the translator can only read lines the page was sent. <!-- docs/php-parity/Translator/getFallback.json, "fallback-starts-null"; docs/php-parity/Translator/get.json, "get-group-reads-fallback-locale" -->

Share only the groups the page needs, because everything in the object ships to the browser.

## Quick start

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

::: warning
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

:::

Types come from the lines you pass. In TypeScript, the keys of `get`, `array`, `__` and `trans` complete in your editor, and a result is typed by the line it names. A key that names a group is typed `<group> | string`, because a locale without that group answers the key itself. Use `array()` to get a group typed exactly. It throws when the key does not name a group. <!-- docs/php-parity/Translator/array.json, "array-throws-for-line" -->

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { g: { a: "A", b: "B" } } }, "en");

translator.array("g");
// => { a: "A", b: "B" }

translator.array("g.a");
// => throws InvalidArgumentException
```

## Translating one string

The standalone functions need no translator. They are the stateless parts of Laravel's translator, and they are tree-shakable, so a page that shows one string from its props imports only what it uses.

```js
import { choose, makeReplacements } from "@tolki/lang";

makeReplacements("Welcome, :name", { name: "ann" });
// => "Welcome, ann"

choose("{0} none|[1,*] :count apples", 5, "en");
// => ":count apples"
```

See [`choose`](./translator.md#choose), [`getPluralIndex`](./translator.md#getpluralindex), [`makeReplacements`](./translator.md#makereplacements) and [`normalizeLocale`](./translator.md#normalizelocale) for each one.

::: warning
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

:::

## One translator per request

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

## Next

- [Translator Reference](./translator.md) lists every export with an example.
- [Differences from Laravel](./differences.md) lists what this port does not do the way PHP does.
