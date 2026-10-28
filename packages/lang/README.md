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

With Laravel, you can skip writing this by hand: [Exporting from Laravel](#exporting-from-laravel) writes the same object to JSON files for you.

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

### Exporting from Laravel

The [`abetwothree/laravel-lang-export`](https://github.com/abetwothree/laravel-lang) Composer package writes your Laravel translations as one JSON file per locale, in the shape the lines object takes. It loads every file through Laravel's own translation loader, so the output matches what `__()` resolves, package namespaces and `lang/vendor` overrides included.

```bash
composer require abetwothree/laravel-lang-export
php artisan lang:export
```

That writes `resources/js/lang/en.json`, one file per locale, and a `manifest.json` that lists the locales and the directories the lines came from. Run the command yourself, or let the Vite plugin run it. The plugin exports before a build and when the dev server starts, re-exports a lang file when you save it, and serves the files as a module that `createLang` can load from. See [Vite Plugin](https://tolki.abe.dev/localization/vite.html).

```js
// vite.config.ts
import laravelLangExport from "@tolki/lang/vite-laravel";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [laravelLangExport()],
});
```

[Building the lines on the server](#building-the-lines-on-the-server) stays the way to go when you do not want the exporter: it shares the lines with the page as a prop.

### Loading locales on demand

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

Call `subscribe(listener)` to hear about every change. It returns a function that stops the calls. `getVersion()` counts the changes, which is the snapshot that React's `useSyncExternalStore` wants. The [Vue](https://tolki.abe.dev/localization/vue.html), [React](https://tolki.abe.dev/localization/react.html) and [Svelte](https://tolki.abe.dev/localization/svelte.html) pages show the bindings that use them.

### Next

- [Vite Plugin](https://tolki.abe.dev/localization/vite.html) exports your lang files and serves them as a module.
- [Vue](https://tolki.abe.dev/localization/vue.html), [React](https://tolki.abe.dev/localization/react.html) and [Svelte](https://tolki.abe.dev/localization/svelte.html) bind a `createLang` to your components.
- [Translator Reference](https://tolki.abe.dev/localization/translator.html) lists every export with an example.
- [Differences from Laravel](https://tolki.abe.dev/localization/differences.html) lists what this port does not do the way PHP does.

## Vite Plugin

`@tolki/lang/vite-laravel` is a Vite plugin that runs the `lang:export` command of [`abetwothree/laravel-lang-export`](https://github.com/abetwothree/laravel-lang), watches your lang files, and serves the exported locales as a module that [`createLang`](https://tolki.abe.dev/localization/index.html#loading-locales-on-demand) loads from.

### Installation

Install the Composer package in your Laravel app, and the Vite plugin comes with `@tolki/lang`. Vite 7 or 8 is the peer dependency.

```bash
composer require abetwothree/laravel-lang-export
```

```bash [npm]
npm install @tolki/lang
```

```bash [yarn]
yarn add @tolki/lang
```

```bash [pnpm]
pnpm add @tolki/lang
```

Add the plugin to `vite.config.ts`. The default export and the named `laravelLangExport` are the same function.

```ts
// vite.config.ts
import laravelLangExport from "@tolki/lang/vite-laravel";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [laravelLangExport()],
});
```

The exporter writes `resources/js/lang/{locale}.json` for each locale and a `manifest.json`. Its [output contract](https://github.com/abetwothree/laravel-lang/blob/main/docs/output-contract.md) lists what each file holds. Git-ignoring `resources/js/lang` is fine, unless you set `runOnBuildStart: false`, because the plugin exports before it builds.

### Options

Every option is optional. The four export options become artisan flags on every run, a full export and a one-file export alike. When you leave one out, the flag is left out and `config/lang-export.php` decides.

| Option            | Default                              | Artisan flag                           |
| ----------------- | ------------------------------------ | -------------------------------------- |
| `command`         | `"php artisan lang:export"`          |                                        |
| `sourceCommand`   | `` `${command} --source={file}` ``   | `--source=`, through the `{file}` slot |
| `output`          | the exporter's `resources/js/lang`   | `--output=`                            |
| `locales`         | every locale                         | `--locale=`, once for each locale      |
| `only`            | every group                          | `--only=`, once for each pattern       |
| `except`          | no group left out                    | `--except=`, once for each pattern     |
| `runOnDevStart`   | `true`                               |                                        |
| `runOnBuildStart` | `true`                               |                                        |
| `reload`          | `true`                               |                                        |
| `failOnError`     | `true` in `vite build`, else `false` |                                        |
| `quiet`           | `true`                               | `--quiet`, added once                  |

- `command` runs through Node's `exec()` from the Vite root, so a shell alias such as `sail` is not available. Give the whole command, such as `"./vendor/bin/sail artisan lang:export"`.
- `sourceCommand` exports one changed file. `{file}` becomes the shell-escaped path. Set it to `false` to always run the full command.
- `output` is passed to artisan, which resolves it against the Laravel base path. The plugin resolves it against the Vite root, so the two must agree, as they do when the Vite root is the Laravel root, as in a standard app. The plugin reads `manifest.json` from the same directory, or from `resources/js/lang` when you leave `output` out.
- `runOnDevStart` and `runOnBuildStart` choose whether to export once when `vite dev` starts and before bundling in `vite build`. `laravel-lang-export` skips files whose bytes are unchanged, so a run with no changes costs one PHP boot ([output contract](https://github.com/abetwothree/laravel-lang/blob/main/docs/output-contract.md#writes)).
- `reload` sends a full page reload after a successful export during `vite dev`.
- `failOnError` decides whether a failed export throws. A failed build stops, while a failed dev run logs the error and keeps the server up.
- `quiet` appends `--quiet` to every command unless your command or template already holds it.

```ts
// vite.config.ts
import laravelLangExport from "@tolki/lang/vite-laravel";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    laravelLangExport({
      locales: ["en", "es"],
      except: ["validation"],
    }),
  ],
});
```

Pass a flag here, rather than in `command`, so the one-file export gets the same flags as the full one. `laravel-lang-export` fingerprints the options that shape the files, and a mismatch turns a one-file run into a full export that can remove locale files ([output contract](https://github.com/abetwothree/laravel-lang/blob/main/docs/output-contract.md#command)).

### Dev and build

In `vite build`, the plugin runs one full export before bundling. A failed export fails the build.

In `vite dev`, the plugin runs one full export when the server starts, then watches the directories the manifest lists under `watch`. It reads the list again whenever `manifest.json` changes.

- A `.php` or `.json` file that you add or change inside the Vite root runs `--source=<path relative to the root>`, which exports that file alone.
- A file outside the root, such as a package that Composer symlinks from elsewhere, a deleted file or directory, or two or more changes that queue behind a running export, runs one full export.
- A file with any other extension, such as an editor swap file, runs nothing.
- Exports never overlap. Changes that arrive while one runs wait, then run as one export.

After a successful export, the dev server reloads the page.

#### Sail

When PHP runs in a Sail container, point `command` at Sail. The plugin passes paths relative to the Vite root, which `laravel-lang-export` can match inside the container, because it compares absolute paths as strings ([output contract](https://github.com/abetwothree/laravel-lang/blob/main/docs/output-contract.md#caller-obligations)).

```ts
// vite.config.ts
import laravelLangExport from "@tolki/lang/vite-laravel";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    laravelLangExport({
      command: "./vendor/bin/sail artisan lang:export",
    }),
  ],
});
```

A package outside the Vite root, such as a path repository, re-exports in full, because `laravel-lang-export` cannot match an absolute host path against one inside the container.

### The virtual module

The plugin serves a module named `virtual:tolki-lang`. It exports `locales`, the locales the manifest lists, and `load(locale)`, which answers a locale's lines. Pass `load` straight to `createLang`.

```ts
import { createLang } from "@tolki/lang";
import { load } from "virtual:tolki-lang";

const lang = createLang({ locale: "en", fallback: "en", load });
await lang.ready;
```

For the browser, `load` imports the locale's file with `import()`, so each locale becomes its own content-hashed chunk, and a visitor downloads only the locales they use. For the server build, the module imports every locale up front, so `load` answers at once and `createLang` needs no `await`. A locale the manifest does not list throws an `Error` that names the locales that were exported. A manifest locale that holds `/`, `\`, `..` or a NUL byte is left out.

When the manifest is missing or unreadable, the plugin warns and `locales` is empty.

Do not import the files with `import.meta.glob("./lang/*.json")`. That pattern also matches `manifest.json`, which lists directories on your server, and Vite would ship it as a public file.

#### Types

Add the types for `virtual:tolki-lang` to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@tolki/lang/client"]
  }
}
```

Or reference them from a `.d.ts` file in your project:

```ts
/// <reference types="@tolki/lang/client" />
```

They declare `locales` as `readonly string[]`, and `load` as a function from a locale to its lines or a promise of them.

### Loading without the module

You can give `createLang` any `load` function. This one fetches each locale from `public/lang`:

```ts
import { createLang } from "@tolki/lang";

const lang = createLang({
  locale: "en",
  fallback: "en",
  load: async (locale) => {
    const response = await fetch(`/lang/${locale}.json`);

    return response.json();
  },
});
```

**Warning:** Do not expose `manifest.json`. The exporter writes it next to the locale files, and its `watch` list holds the paths of your lang directories, which can be absolute server paths when a directory sits outside the project. If you export to a folder under `public`, delete the manifest from what you deploy, or export to `resources/js/lang` and copy only the `{locale}.json` files into `public/lang`. Every line in a locale file ships to the browser as well, so use the `only` and `except` options to leave out groups such as `validation` that the page never shows.

### Next

- [Vue](https://tolki.abe.dev/localization/vue.html), [React](https://tolki.abe.dev/localization/react.html) and [Svelte](https://tolki.abe.dev/localization/svelte.html) bind the lang you create to your components.
- [Installation & Usage](https://tolki.abe.dev/localization/index.html) covers `createLang`, `ready` and `setLocale`.

## Vue

`@tolki/lang/vue` installs a `createLang()` into a Vue 3.5 app. Templates get `__`, `trans` and `transChoice`, the `useLang()` composable gives a `locale` you can bind with `v-model`, and every one of them re-renders when the locale changes.

### Setup with Inertia

Create the lang in `resources/js/app.ts`, read the starting locale from the page's `<html lang>`, and wait for `lang.ready` before you mount, so the first render already has its lines. `htmlLocale(locales)` answers the locale from `<html lang="pt-BR">` in the spelling the exporter wrote, `pt_BR`, and answers `null` when no listed locale matches. The locale never comes from `navigator.language`, so the client always starts in the locale the server rendered.

```ts
// resources/js/app.ts
import { createInertiaApp } from "@inertiajs/vue3";
import { htmlLocale } from "@tolki/lang";
import { createLang } from "@tolki/lang/vue";
import { load, locales } from "virtual:tolki-lang";
import { createSSRApp, h } from "vue";

createInertiaApp({
  resolve: (name) => import(`./Pages/${name}.vue`),
  async setup({ el, App, props, plugin }) {
    const lang = createLang({
      locale: htmlLocale(locales) ?? "en",
      fallback: "en",
      load,
    });

    await lang.ready;

    createSSRApp({ render: () => h(App, props) })
      .use(plugin)
      .use(lang)
      .mount(el);
  },
});
```

`createLang` from `@tolki/lang/vue` takes the same options as the core [`createLang`](https://tolki.abe.dev/localization/index.html#loading-locales-on-demand): the locale, a fallback, `lines` you already have, and `load`. What it returns is the lang itself and a Vue plugin, so `app.use(lang)` installs it and `lang.setLocale()` works anywhere. [The Vite plugin](https://tolki.abe.dev/localization/vite.html) supplies `load` and `locales`.

Have Laravel put the locale in the `<html>` tag and share it with Inertia. If a locale in `<html lang>` is not one the exporter wrote, `htmlLocale` answers `null` and the `?? "en"` takes over.

```php
// resources/views/app.blade.php
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
```

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'locale' => app()->getLocale(),
    ];
}
```

#### Server-side rendering

On the server, build one `createLang()` for each request, inside `setup`, and read the locale from `page.props.locale`. The module the Vite plugin serves to the server build loads every locale up front, so the lang has its lines at once and there is nothing to await.

```ts
// resources/js/ssr.ts
import { createInertiaApp } from "@inertiajs/vue3";
import createServer from "@inertiajs/vue3/server";
import { createLang } from "@tolki/lang/vue";
import { renderToString } from "@vue/server-renderer";
import { load } from "virtual:tolki-lang";
import { createSSRApp, h } from "vue";

createServer((page) =>
  createInertiaApp({
    page,
    render: renderToString,
    resolve: (name) => import(`./Pages/${name}.vue`),
    setup({ App, props, plugin }) {
      return createSSRApp({ render: () => h(App, props) })
        .use(plugin)
        .use(
          createLang({
            locale: page.props.locale as string,
            fallback: "en",
            load,
          }),
        );
    },
  }),
);
```

**Warning:** Never create the lang at module level on a server. The plugin subscribes once to each app it installs into, and it stops listening only when the app unmounts. A server-rendered app is never unmounted, so a `Lang` shared across requests would add a listener on every request and never remove it. It would also share one locale between requests that run at the same time. A `createLang()` inside `setup` has neither problem.

The client has to start in the locale the server rendered, or hydration reports a mismatch. That is why `app.ts` reads `<html lang>`, which Laravel set from the same `app()->getLocale()` that the server rendered with.

### In templates

The plugin adds `__`, `trans` and `transChoice` as global properties, so a template calls them without an import. They read the lang the app was given.

```vue
<template>
  <h1>{{ __("Welcome") }}</h1>
  <p>{{ trans("messages.welcome", { name: user.name }) }}</p>
  <p>{{ transChoice("messages.apples", count) }}</p>
</template>
```

`__` works only in precompiled templates: single-file components, which every Vite app uses. A template that Vue compiles in the browser, such as a `template:` string or markup in the page's DOM, looks globals up through a `with` proxy that rejects names starting with an underscore, so `__` does not resolve there. `trans` and `transChoice` work in both. If you compile templates at run time, call `trans`.

### useLang

In a script-setup block, `useLang()` gives the same reads, plus the current `locale`, `setLocale` and `lang`, the framework-agnostic lang behind them. It throws an `Error` when the app has no lang installed.

`locale` is a writable computed ref. Setting it loads the locale, then switches, so `v-model` on a `<select>` works. The old locale stays on screen until the new lines arrive.

```vue
<script setup lang="ts">
import { locales } from "virtual:tolki-lang";
import { useLang } from "@tolki/lang/vue";

const { __, locale } = useLang();
</script>

<template>
  <label>
    {{ __("Language") }}
    <select v-model="locale">
      <option v-for="code in locales" :key="code" :value="code">
        {{ code }}
      </option>
    </select>
  </label>
</template>
```

A failed load leaves the locale as it was. To handle the failure, call `await setLocale(code)` from the composable and catch the rejection.

`has`, `hasForLocale`, `getLocale`, `getFallback`, `isLocale` and `isLoaded` are there too, and each re-renders its reader when the lang changes. Use `lang.translator` for anything the reads do not cover, such as `addLines()`.

### Typing

Without any setup, `__` answers `string` or a group. Name your lines once, and keys complete in your editor and results are typed by the line they name. Augment `LangRegister` from `@tolki/lang` with the type of your default locale's file:

```ts
// resources/js/lang.d.ts
import type en from "./lang/en.json";

declare module "@tolki/lang" {
  interface LangRegister {
    lines: typeof en;
  }
}
```

Importing a JSON file as a type needs `"resolveJsonModule": true` in `tsconfig.json`. The registered lines type `useLang()`, `createLang()` and the template globals alike. Pass a type argument, as in `useLang<typeof lines>()`, to override it for one call.

### Switching locale on navigation

An Inertia visit can change the locale, such as a language link that sets a cookie. Inertia has no part in the lang, so listen for its `navigate` event and hand the page's locale to `setLocale`. The event fires on every page visit, and `setLocale` notifies the app even when the locale is the same, so check `isLocale` first.

```ts
import { router } from "@inertiajs/vue3";

router.on("navigate", async (event) => {
  const locale = event.detail.page.props.locale as string;

  if (!lang.isLocale(locale)) {
    await lang.setLocale(locale);
  }
});
```

Register it in `app.ts`, right after you create `lang`. A client app without server-side rendering uses `createApp` where the example uses `createSSRApp`. `setLocale` does not change `<html lang>`, so set `document.documentElement.lang` in the same handler if the page needs it.

### Next

- [Vite Plugin](https://tolki.abe.dev/localization/vite.html) exports the lines and serves `load`.
- [React](https://tolki.abe.dev/localization/react.html) and [Svelte](https://tolki.abe.dev/localization/svelte.html) have the same API for the other two frameworks.

## React

`@tolki/lang/react` hands a lang to a React 19 tree. `<LangProvider>` provides it, `useLang()` reads it, and a component that reads it renders again when the locale changes.

### Setup with Inertia

Create the lang outside the tree, once for the page on the client and once for each request on the server, then give it to `<LangProvider lang={lang}>`. `createLang` is the core function, re-exported from `@tolki/lang/react`, and takes the options of [`createLang`](https://tolki.abe.dev/localization/index.html#loading-locales-on-demand).

On the client, read the starting locale from the page's `<html lang>` with `htmlLocale(locales)`, and wait for `lang.ready` before `hydrateRoot`, so the first render already has its lines and matches the server's markup. The locale never comes from `navigator.language`.

```tsx
// resources/js/app.tsx
import { createInertiaApp } from "@inertiajs/react";
import { htmlLocale } from "@tolki/lang";
import { createLang, LangProvider } from "@tolki/lang/react";
import { load, locales } from "virtual:tolki-lang";
import { hydrateRoot } from "react-dom/client";

createInertiaApp({
  resolve: (name) => import(`./Pages/${name}.tsx`),
  async setup({ el, App, props }) {
    const lang = createLang({
      locale: htmlLocale(locales) ?? "en",
      fallback: "en",
      load,
    });

    await lang.ready;

    hydrateRoot(
      el,
      <LangProvider lang={lang}>
        <App {...props} />
      </LangProvider>,
    );
  },
});
```

[The Vite plugin](https://tolki.abe.dev/localization/vite.html) supplies `load` and `locales`. Have Laravel put the locale in the `<html>` tag and share it with Inertia, as the [Vue page](https://tolki.abe.dev/localization/vue.html#setup-with-inertia) shows. A client app without server-side rendering uses `createRoot` where the example uses `hydrateRoot`.

#### Server-side rendering

On the server, build one `createLang()` for each request, inside `setup`, from `page.props.locale`. The module the Vite plugin serves to the server build loads every locale up front, so the lang has its lines at once and there is nothing to await.

```tsx
// resources/js/ssr.tsx
import { createInertiaApp } from "@inertiajs/react";
import createServer from "@inertiajs/react/server";
import { createLang, LangProvider } from "@tolki/lang/react";
import { renderToString } from "react-dom/server";
import { load } from "virtual:tolki-lang";

createServer((page) =>
  createInertiaApp({
    page,
    render: renderToString,
    resolve: (name) => import(`./Pages/${name}.tsx`),
    setup: ({ App, props }) => {
      const lang = createLang({
        locale: page.props.locale as string,
        fallback: "en",
        load,
      });

      return (
        <LangProvider lang={lang}>
          <App {...props} />
        </LangProvider>
      );
    },
  }),
);
```

**Warning:** Never create the lang at module level on a server. One `Lang` shared across requests would share its locale between requests that run at the same time. Create it inside `setup`, so each request has its own.

The client has to start in the locale the server rendered, or hydration reports a mismatch.

### useLang

`useLang()` gives the reads `__`, `trans` and `transChoice`, plus `has`, `hasForLocale`, `getLocale`, `getFallback`, `isLocale` and `isLoaded`, the current `locale`, `setLocale`, and `lang`, the framework-agnostic lang behind them. It throws an `Error` when no `<LangProvider>` is above the component.

Every component that calls `useLang()` renders again when the lang changes, and a memoized child that receives `__` as a prop gets a new function, so it renders again too. `setLocale` loads the locale, then switches. The old locale stays on screen until the new lines arrive.

```tsx
import { useLang } from "@tolki/lang/react";
import { locales } from "virtual:tolki-lang";

export function LanguageSwitcher() {
  const { __, locale, setLocale } = useLang();

  return (
    <label>
      {__("Language")}
      <select value={locale} onChange={(e) => void setLocale(e.target.value)}>
        {locales.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </label>
  );
}
```

A failed load leaves the locale as it was and rejects the promise `setLocale` returns. To handle it, `await setLocale(code)` in a `try` block.

```tsx
import { useLang } from "@tolki/lang/react";

export function Apples({ count }: { count: number }) {
  const { __, transChoice } = useLang();

  return (
    <>
      <h1>{__("Welcome")}</h1>
      <p>{transChoice("messages.apples", count)}</p>
    </>
  );
}
```

### Typing

Without any setup, `__` answers `string` or a group, and JSX does not take a group as a child. So either name your lines once, or wrap the call in `String()`. To name them, augment `LangRegister` from `@tolki/lang` with the type of your default locale's file. Keys then complete in your editor, and a result is typed by the line it names.

```ts
// resources/js/lang.d.ts
import type en from "./lang/en.json";

declare module "@tolki/lang" {
  interface LangRegister {
    lines: typeof en;
  }
}
```

Importing a JSON file as a type needs `"resolveJsonModule": true` in `tsconfig.json`. Pass a type argument, as in `useLang<typeof lines>()`, to override the registered lines for one call.

### Switching locale on navigation

An Inertia visit can change the locale. Inertia has no part in the lang, so listen for its `navigate` event and hand the page's locale to `setLocale`. `setLocale` notifies the tree even when the locale is the same, so check `isLocale` first.

```ts
import { router } from "@inertiajs/react";

router.on("navigate", async (event) => {
  const locale = event.detail.page.props.locale as string;

  if (!lang.isLocale(locale)) {
    await lang.setLocale(locale);
  }
});
```

Register it in `app.tsx`, right after you create `lang`. `setLocale` does not change `<html lang>`, so set `document.documentElement.lang` in the same handler if the page needs it.

### Next

- [Vite Plugin](https://tolki.abe.dev/localization/vite.html) exports the lines and serves `load`.
- [Vue](https://tolki.abe.dev/localization/vue.html) and [Svelte](https://tolki.abe.dev/localization/svelte.html) have the same API for the other two frameworks.

## Svelte

`@tolki/lang/svelte` gives Svelte 5.7 or later a lang through context. A parent calls `setLang()`, or you pass `langContext(lang)` to `mount()`, `hydrate()` or `render()`, and a component below calls `getLang()`. Everything it reads is tracked, so the component updates when the locale changes.

### Setup with Inertia

Inertia owns the root component, so hand the lang over as context. `createLang` is the core function, re-exported from `@tolki/lang/svelte`, and takes the options of [`createLang`](https://tolki.abe.dev/localization/index.html#loading-locales-on-demand). `langContext(lang)` builds the context map that `getLang()` finds.

On the client, read the starting locale from the page's `<html lang>` with `htmlLocale(locales)`, and wait for `lang.ready` before `hydrate`, so the first render already has its lines and matches the server's markup. The locale never comes from `navigator.language`.

```ts
// resources/js/app.ts
import { createInertiaApp } from "@inertiajs/svelte";
import { htmlLocale } from "@tolki/lang";
import { createLang, langContext } from "@tolki/lang/svelte";
import { load, locales } from "virtual:tolki-lang";
import { hydrate } from "svelte";

createInertiaApp({
  resolve: (name) => import(`./Pages/${name}.svelte`),
  async setup({ el, App, props }) {
    const lang = createLang({
      locale: htmlLocale(locales) ?? "en",
      fallback: "en",
      load,
    });

    await lang.ready;

    hydrate(App, { target: el, props, context: langContext(lang) });
  },
});
```

[The Vite plugin](https://tolki.abe.dev/localization/vite.html) supplies `load` and `locales`. Have Laravel put the locale in the `<html>` tag and share it with Inertia, as the [Vue page](https://tolki.abe.dev/localization/vue.html#setup-with-inertia) shows. A client app without server-side rendering uses `mount` where the example uses `hydrate`.

#### Server-side rendering

On the server, build one `createLang()` for each request, inside `setup`, from `page.props.locale`, and pass its context to `render`. The module the Vite plugin serves to the server build loads every locale up front, so the lang has its lines at once and there is nothing to await.

```ts
// resources/js/ssr.ts
import { createInertiaApp } from "@inertiajs/svelte";
import createServer from "@inertiajs/svelte/server";
import { createLang, langContext } from "@tolki/lang/svelte";
import { load } from "virtual:tolki-lang";
import { render } from "svelte/server";

createServer((page) =>
  createInertiaApp({
    page,
    resolve: (name) => import(`./Pages/${name}.svelte`),
    setup({ App, props }) {
      const lang = createLang({
        locale: page.props.locale as string,
        fallback: "en",
        load,
      });

      return render(App, { props, context: langContext(lang) });
    },
  }),
);
```

**Warning:** Never create the lang at module level on a server. One `Lang` shared across requests would share its locale between requests that run at the same time. Create it inside `setup`, so each request has its own.

The client has to start in the locale the server rendered, or hydration reports a mismatch.

### Your own root component

When your app owns the root, skip the context and call `setLang()` while the root component initializes. Every component below can call `getLang()`.

```svelte
<script lang="ts">
  import { setLang } from "@tolki/lang/svelte";
  import type { Lang } from "@tolki/lang";

  import Greeting from "./Greeting.svelte";

  const { lang }: { lang: Lang } = $props();

  setLang(lang);
</script>

```

`setLang()` reads the lang once, when the component initializes, as a provider reads its prop. It returns the same object `getLang()` does.

### getLang

`getLang()` gives the reads `__`, `trans` and `transChoice`, plus `has`, `hasForLocale`, `getLocale`, `getFallback`, `isLocale` and `isLoaded`, the current `locale`, `setLocale`, and `lang`, the framework-agnostic lang behind them. It throws an `Error` when no lang is in context.

Each read subscribes the component, so a destructured `__` still updates it when the locale changes. Assigning to `locale` loads the locale, then switches, so `bind:value` works on a `<select>`. The old locale stays on screen until the new lines arrive.

```svelte
<script lang="ts">
  import { getLang } from "@tolki/lang/svelte";
  import { locales } from "virtual:tolki-lang";

  const lang = getLang();
  const { __, transChoice } = lang;
</script>

<h1>{__("Welcome")}</h1>
<p>{transChoice("messages.apples", 2)}</p>

<label>
  {__("Language")}
  <select bind:value={lang.locale}>
    {#each locales as code (code)}
      <option value={code}>{code}</option>
    {/each}
  </select>
</label>
```

A failed load leaves the locale as it was. To handle the failure, call `await lang.setLocale(code)` and catch the rejection.

### Typing

Without any setup, `__` answers `string` or a group. Name your lines once, and keys complete in your editor and results are typed by the line they name. Augment `LangRegister` from `@tolki/lang` with the type of your default locale's file:

```ts
// resources/js/lang.d.ts
import type en from "./lang/en.json";

declare module "@tolki/lang" {
  interface LangRegister {
    lines: typeof en;
  }
}
```

Importing a JSON file as a type needs `"resolveJsonModule": true` in `tsconfig.json`. Pass a type argument, as in `getLang<typeof lines>()`, to override the registered lines for one call.

### Switching locale on navigation

An Inertia visit can change the locale. Inertia has no part in the lang, so listen for its `navigate` event and hand the page's locale to `setLocale`. `setLocale` notifies the app even when the locale is the same, so check `isLocale` first.

```ts
import { router } from "@inertiajs/svelte";

router.on("navigate", async (event) => {
  const locale = event.detail.page.props.locale as string;

  if (!lang.isLocale(locale)) {
    await lang.setLocale(locale);
  }
});
```

Register it in `app.ts`, right after you create `lang`. `setLocale` does not change `<html lang>`, so set `document.documentElement.lang` in the same handler if the page needs it.

### Next

- [Vite Plugin](https://tolki.abe.dev/localization/vite.html) exports the lines and serves `load`.
- [Vue](https://tolki.abe.dev/localization/vue.html) and [React](https://tolki.abe.dev/localization/react.html) have the same API for the other two frameworks.

## Translator Reference

These are the exports of `@tolki/lang`: the `Translator` class with Laravel's public methods, the stateless functions, and the helpers `__`, `trans` and `transChoice` that `createHelpers` binds to a translator. Sections are alphabetical. Methods are called on a translator, so each example builds one from a small lines object. See [Installation & Usage](https://tolki.abe.dev/localization/index.html) for the shape of the lines.

### Translator Reference

[\_\_](#__) [addLines](#addlines) [array](#array) [bindLang](#bindlang) [choice](#choice) [choose](#choose) [createHelpers](#createhelpers) [createLang](#createlang) [determineLocalesUsing](#determinelocalesusing) [get](#get) [getFallback](#getfallback) [getLocale](#getlocale) [getPluralIndex](#getpluralindex) [handleMissingKeysUsing](#handlemissingkeysusing) [has](#has) [hasForLocale](#hasforlocale) [htmlLocale](#htmllocale) [locale](#locale) [makeReplacements](#makereplacements) [normalizeLocale](#normalizelocale) [parseKey](#parsekey) [setFallback](#setfallback) [setLoaded](#setloaded) [setLocale](#setlocale) [string](#string) [stringable](#stringable) [trans](#trans) [transChoice](#transchoice) [Translator](#translator)

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

Exported as the `addLines` method of `Translator`. Lines are keyed `group.item`, and the group `*` adds a JSON line. A key without a dot writes the item `""` of a group with that name, so `get("nodot")` answers `{ "": "v" }`. A package group takes its namespace as the third argument. The call merges into the lines the translator already holds and never changes the object you passed to the constructor. A JSON line's key is taken literally, dots included. <!-- docs/php-parity/Translator/addLines.json, "add-lines-merges-into-a-loaded-group"; docs/php-parity/Translator/addLines.json, "add-lines-json-group"; docs/php-parity/Translator/addLines.json, "add-lines-namespace"; docs/php-parity/Translator/addLines.json, "add-lines-key-without-dot" -->

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

#### bindLang

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

#### createLang

Create a translator that loads locales on demand and tells subscribers when its answers change.

Exported as `createLang` from `@tolki/lang`. The options are the starting `locale`, an optional `fallback`, the `lines` at hand and a `load` function that fetches a locale's lines, at once or as a promise. A module namespace from `import()` is unwrapped to its default export. It answers the helpers `__`, `trans` and `transChoice`, the reads `has`, `hasForLocale`, `getLocale`, `getFallback`, `isLocale` and `isLoaded`, and the `translator` behind them.

- `ready` is a promise that settles once the starting locale and the fallback are loaded. It rejects when a load fails.
- `setLocale(locale)` and `setFallback(locale)` load the locale before they switch, and the last call wins. A failed load rejects and changes nothing. `setFallback(null)` clears the fallback.
- `load(locale)` fetches a locale without switching, and notifies subscribers only when it loaded something new.
- `subscribe(listener)` calls the listener after each change and returns a function that stops the calls. `getVersion()` counts the changes.

A loaded file replaces each top-level key it holds, a group, a `namespace::group` or a JSON line. Lines added earlier with `addLines()` under other keys survive. A locale that holds `/`, `\`, `..` or a NUL byte throws `InvalidArgumentException` from `createLang`, `setLocale`, `setFallback` and `load`, without calling the loader. A synchronous loader that throws makes `createLang` throw. See [Loading locales on demand](https://tolki.abe.dev/localization/index.html#loading-locales-on-demand).

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

#### htmlLocale

Read the locale the page declares on its `<html lang>`.

Exported as `htmlLocale` from `@tolki/lang`. Pass the locales your lines hold. The tag must be one of them, in either spelling: `<html lang="pt-BR">` answers `pt-BR` when the list holds it, else `pt_BR` when the list holds that. It answers `null` without a document, for an empty `lang`, or when no listed locale matches. Without a list, it answers the tag run through [`normalizeLocale`](#normalizelocale).

It needs a document, so the example does not run in Node.

```js
import { htmlLocale } from "@tolki/lang";

// With <html lang="pt-BR">:
htmlLocale(["pt_BR", "en"]); // "pt_BR"
htmlLocale(["en", "es"]); // null
htmlLocale(); // "pt_BR"
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

### File loading

The `Translator` loads nothing. It never reads `lang/en.json` or `lang/en/messages.php`, and it has no `addNamespace`, `addPath` or `addJsonPath`. The caller passes the lines, one object per locale.

Loading is a separate layer, which is JavaScript only. [`createLang`](https://tolki.abe.dev/localization/translator.html#createlang) wraps a translator and calls the `load` function you give it when a locale is first needed. The [Vite plugin](https://tolki.abe.dev/localization/vite.html) runs `php artisan lang:export` from the `abetwothree/laravel-lang-export` package, which loads every file through Laravel's own loader and writes one JSON file per locale. The plugin serves those files as `virtual:tolki-lang`, whose `load` is what `createLang` takes. Nothing reads PHP in the browser: the exporter reads it in your Laravel app.

You can skip the exporter. Build the lines object on the server, as shown in [Installation & Usage](https://tolki.abe.dev/localization/index.html#building-the-lines-on-the-server), or import your JSON files.

### Not ported

- `load`, `isLoaded`, `getLoader`, `addNamespace`, `addPath`, `addJsonPath`, `FileLoader`, `ArrayLoader` and `TranslationServiceProvider`: the `Translator` does not load files. `createLang` loads locales through a function you give it, and the exporter does the file reading.
- `getSelector` and `setSelector`: the selector is the stateless functions `choose` and `getPluralIndex`.
- `NamespacedItemResolver::setParsedKey` and `flushParsedKeys`, and the parse cache: the cache is invisible except through those two, which exist for the config repository.
- `Macroable`, and `stringable()` with a single closure argument: JavaScript has neither macros on this class nor parameter types to read.
- The `name` of a pure (unit) enum: an `@tolki/enum` case always has a `value`.
- `PotentiallyTranslatedString`, `CreatesPotentiallyTranslatedStrings` and `HasLocalePreference`: they are plumbing for validation and notifications.

<!-- AUTO-GENERATED-DOCS:END -->
