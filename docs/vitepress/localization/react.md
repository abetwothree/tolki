# React

`@tolki/lang/react` hands a lang to a React 19 tree. `<LangProvider>` provides it, `useLang()` reads it, and a component that reads it renders again when the locale changes. <Badge type="info" text="JS only" />

## Setup with Inertia

Create the lang outside the tree, once for the page on the client and once for each request on the server, then give it to `<LangProvider lang={lang}>`. `createLang` is the core function, re-exported from `@tolki/lang/react`, and takes the options of [`createLang`](./index.md#loading-locales-on-demand).

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

[The Vite plugin](./vite.md) supplies `load` and `locales`. Have Laravel put the locale in the `<html>` tag and share it with Inertia, as the [Vue page](./vue.md#setup-with-inertia) shows. A client app without server-side rendering uses `createRoot` where the example uses `hydrateRoot`.

### Server-side rendering

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

::: warning
Never create the lang at module level on a server. One `Lang` shared across requests would share its locale between requests that run at the same time. Create it inside `setup`, so each request has its own.
:::

The client has to start in the locale the server rendered, or hydration reports a mismatch.

## useLang

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

## Typing

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

## Switching locale on navigation

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

## Next

- [Vite Plugin](./vite.md) exports the lines and serves `load`.
- [Vue](./vue.md) and [Svelte](./svelte.md) have the same API for the other two frameworks.
