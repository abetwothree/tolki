# Svelte

`@tolki/lang/svelte` gives Svelte 5.7 or later a lang through context. A parent calls `setLang()`, or you pass `langContext(lang)` to `mount()`, `hydrate()` or `render()`, and a component below calls `getLang()`. Everything it reads is tracked, so the component updates when the locale changes.

<Badge type="info" text="JS only" />

## Setup with Inertia

Inertia owns the root component, so hand the lang over as context. `createLang` is the core function, re-exported from `@tolki/lang/svelte`, and takes the options of [`createLang`](./index.md#loading-locales-on-demand). `langContext(lang)` builds the context map that `getLang()` finds.

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

[The Vite plugin](./vite.md) supplies `load` and `locales`. Have Laravel put the locale in the `<html>` tag and share it with Inertia, as the [Vue page](./vue.md#setup-with-inertia) shows. A client app without server-side rendering uses `mount` where the example uses `hydrate`.

### Server-side rendering

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

::: warning
**Warning:** Never create the lang at module level on a server. One `Lang` shared across requests would share its locale between requests that run at the same time. Create it inside `setup`, so each request has its own.
:::

The client has to start in the locale the server rendered, or hydration reports a mismatch.

## Your own root component

When your app owns the root, skip the context and call `setLang()` while the root component initializes. Every component below can call `getLang()`.

```svelte
<script lang="ts">
  import { setLang } from "@tolki/lang/svelte";
  import type { Lang } from "@tolki/lang";

  import Greeting from "./Greeting.svelte";

  const { lang }: { lang: Lang } = $props();

  setLang(lang);
</script>

<Greeting />
```

`setLang()` reads the lang once, when the component initializes, as a provider reads its prop. It returns the same object `getLang()` does.

## getLang

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

Importing a JSON file as a type needs `"resolveJsonModule": true` in `tsconfig.json`. Pass a type argument, as in `getLang<typeof lines>()`, to override the registered lines for one call.

## Switching locale on navigation

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

## Next

- [Vite Plugin](./vite.md) exports the lines and serves `load`.
- [Vue](./vue.md) and [React](./react.md) have the same API for the other two frameworks.
