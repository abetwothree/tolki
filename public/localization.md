---
url: /localization.md
---
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

A JSON line is looked up by its whole key, dots included, and a key that matches no line is answered as it came.&#x20;

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

The key `"*"` reads a locale's JSON lines as one group, so `get("*.Hello")` reads the JSON line `Hello`.&#x20;

```js
import { Translator } from "@tolki/lang";

const translator = new Translator({ en: { Hello: "Hola :name" } }, "en");

translator.get("*.Hello", { name: "Ann" });
// => "Hola Ann"
```

### Building the lines on the server

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

Read the groups through the loader rather than with `trans()`: for a locale without a group, `trans()` answers the fallback locale's whole group, which `hasForLocale()` and `choice()` would then take for the current locale's.&#x20;

Share the fallback locale's lines as well: after `setFallback()`, a group line the current locale lacks is read from the fallback locale, as in Laravel, and the translator can only read lines the page was sent.&#x20;

Share only the groups the page needs, because everything in the object ships to the browser.

With Laravel, you can skip writing this by hand: [Exporting from Laravel](#exporting-from-laravel) writes the same object to JSON files for you.

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
Laravel's constructor leaves the fallback locale empty, and only its service provider sets it from `config('app.fallback_locale')`. So a new `Translator` has no fallback until you call `setFallback()`. Without one, `choice()` on a key with no line picks plural index 0, so `transChoice("item|items", 5)` answers `item`. After `setFallback("en")` it answers `items`.&#x20;

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

Types come from the lines you pass. In TypeScript, the keys of `get`, `array`, `__` and `trans` complete in your editor, and a result is typed by the line it names. A key that names a group is typed `<group> | string`, because a locale without that group answers the key itself. Use `array()` to get a group typed exactly. It throws when the key does not name a group.&#x20;

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
Laravel's plural table spells locales `en_US`, so a hyphenated BCP 47 tag such as `en-US` or `pt-BR` gets Laravel's default rule, plural index 0. `choose("item|items", 5, "en-US")` answers `item`, as Laravel does.  Pass the locale through `normalizeLocale()` first, and give your lines the same spelling.

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

## Exporting from Laravel

The [`abetwothree/laravel-lang-export`](https://github.com/abetwothree/laravel-lang) Composer package writes your Laravel translations as one JSON file per locale, in the shape the lines object takes. It loads every file through Laravel's own translation loader, so the output matches what `__()` resolves, package namespaces and `lang/vendor` overrides included.

```bash
composer require abetwothree/laravel-lang-export
php artisan lang:export
```

That writes `resources/js/lang/en.json`, one file per locale, and a `manifest.json` that lists the locales and the directories the lines came from. Run the command yourself, or let the Vite plugin run it. The plugin exports before a build and when the dev server starts, re-exports a lang file when you save it, and serves the files as a module that `createLang` can load from. See [Vite Plugin](./vite.md).

```ts
// vite.config.ts
import laravelLangExport from "@tolki/lang/vite-laravel";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [laravelLangExport()],
});
```

[Building the lines on the server](#building-the-lines-on-the-server) stays the way to go when you do not want the exporter: it shares the lines with the page as a prop.

## Loading locales on demand

`createLang` builds a translator that loads a locale's lines when it first needs them, and tells subscribers when its answers change. Give it a `load` function that answers a locale's lines, or a promise of them. A loader that imports a JSON file may answer the module, and `createLang` takes its default export.

A synchronous `load` applies its lines before `createLang` returns. Both the starting locale and the fallback load.

```js
import { createLang } from "@tolki/lang";

const files = {
  en: { messages: { apples: "{0} none|[1,*] :count apples" } },
  es: { Welcome: "Bienvenido" },
};

const lang = createLang({
  locale: "es",
  fallback: "en",
  load: (locale) => files[locale],
});

lang.__("Welcome");
// => "Bienvenido"

lang.transChoice("messages.apples", 5);
// => "5 apples"
```

With an asynchronous `load`, the lines arrive later. `lang.ready` is a promise that settles once the starting locale and the fallback are loaded. Until then, a lookup answers the key, as it does for any missing line. If a load fails, `ready` rejects.

```js
import { createLang } from "@tolki/lang";

const files = {
  en: { auth: { failed: "These credentials do not match." } },
  es: { auth: { failed: "Las credenciales no coinciden." } },
};

const lang = createLang({
  locale: "es",
  fallback: "en",
  load: async (locale) => files[locale],
});

lang.__("auth.failed");
// => "auth.failed"

await lang.ready;

lang.__("auth.failed");
// => "Las credenciales no coinciden."
```

`setLocale` loads a locale, then switches to it. The current locale stays in place while the load runs, so the page never shows a half-loaded language. If the load fails, `setLocale` rejects and the locale stays as it was. `setFallback` does the same for the fallback locale and accepts `null` for none.

When calls overlap, the last call wins, whichever load finishes first.

```js
import { createLang } from "@tolki/lang";

const files = {
  en: { Hi: "Hi" },
  es: { Hi: "Hola" },
  de: { Hi: "Hallo" },
};

const lang = createLang({
  locale: "en",
  load: async (locale) => files[locale],
});

await lang.ready;

const toEs = lang.setLocale("es");
const toDe = lang.setLocale("de");

await Promise.all([toEs, toDe]);

lang.getLocale();
// => "de"

lang.__("Hi");
// => "Hallo"
```

A loaded locale file replaces each top-level key it holds, whether that is a group, a `namespace::group` or a JSON line. Lines you added earlier with `translator.addLines()` under other keys survive the load. A locale loads once, even when several calls ask for it at the same time, and a locale whose load failed loads again on the next call.

`load(locale)` fetches a locale without switching to it, for a link the user is likely to click. It notifies subscribers only when it loaded something new.

A locale that holds `/`, `\`, `..` or a NUL byte throws `InvalidArgumentException` from `createLang`, `setLocale`, `setFallback` and `load`, before the loader runs. A locale is a file name on the server, and this keeps it from walking out of the lang directory.

```js
import { createLang } from "@tolki/lang";

const lang = createLang({ locale: "en", load: () => ({}) });

await lang.setLocale("../secrets");
// => throws InvalidArgumentException
```

Call `subscribe(listener)` to hear about every change. It returns a function that stops the calls. `getVersion()` counts the changes, which is the snapshot that React's `useSyncExternalStore` wants. The [Vue](./vue.md), [React](./react.md) and [Svelte](./svelte.md) pages show the bindings that use them.

## Next

* [Vite Plugin](./vite.md) exports your lang files and serves them as a module.
* [Vue](./vue.md), [React](./react.md) and [Svelte](./svelte.md) bind a `createLang` to your components.
* [Translator Reference](./translator.md) lists every export with an example.
* [Differences from Laravel](./differences.md) lists what this port does not do the way PHP does.
