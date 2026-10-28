# Vue

`@tolki/lang/vue` installs a `createLang()` into a Vue 3.5 app. Templates get `__`, `trans` and `transChoice`, the `useLang()` composable gives a `locale` you can bind with `v-model`, and every one of them re-renders when the locale changes. <Badge type="info" text="JS only" />

## Setup with Inertia

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

`createLang` from `@tolki/lang/vue` takes the same options as the core [`createLang`](./index.md#loading-locales-on-demand): the locale, a fallback, `lines` you already have, and `load`. What it returns is the lang itself and a Vue plugin, so `app.use(lang)` installs it and `lang.setLocale()` works anywhere. [The Vite plugin](./vite.md) supplies `load` and `locales`.

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

### Server-side rendering

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

::: warning
Never create the lang at module level on a server. The plugin subscribes once to each app it installs into, and it stops listening only when the app unmounts. A server-rendered app is never unmounted, so a `Lang` shared across requests would add a listener on every request and never remove it. It would also share one locale between requests that run at the same time. A `createLang()` inside `setup` has neither problem.
:::

The client has to start in the locale the server rendered, or hydration reports a mismatch. That is why `app.ts` reads `<html lang>`, which Laravel set from the same `app()->getLocale()` that the server rendered with.

## In templates

The plugin adds `__`, `trans` and `transChoice` as global properties, so a template calls them without an import. They read the lang the app was given.

```vue
<template>
  <h1>{{ __("Welcome") }}</h1>
  <p>{{ trans("messages.welcome", { name: user.name }) }}</p>
  <p>{{ transChoice("messages.apples", count) }}</p>
</template>
```

`__` works only in precompiled templates: single-file components, which every Vite app uses. A template that Vue compiles in the browser, such as a `template:` string or markup in the page's DOM, looks globals up through a `with` proxy that rejects names starting with an underscore, so `__` does not resolve there. `trans` and `transChoice` work in both. If you compile templates at run time, call `trans`.

## useLang

In a `<script setup>`, `useLang()` gives the same reads, plus the current `locale`, `setLocale` and `lang`, the framework-agnostic lang behind them. It throws an `Error` when the app has no lang installed.

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

## Typing

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

## Switching locale on navigation

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

## Next

- [Vite Plugin](./vite.md) exports the lines and serves `load`.
- [React](./react.md) and [Svelte](./svelte.md) have the same API for the other two frameworks.
