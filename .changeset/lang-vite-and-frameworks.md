---
"@tolki/lang": minor
---

`@tolki/lang` can now load a Laravel app's lang files for you, and plugs into Vue, React and Svelte. Everything new is optional: `vue`, `react`, `svelte` and `vite` are optional peers, so you only need the one you use.

- `createLang` builds one app-wide lang from a locale, a fallback and either lines you already have or a `load` function that fetches a locale when it is first needed, and `bindLang` gives you `__`, `trans` and `transChoice` bound to it.
- `htmlLocale` reads the locale from the page's `<html lang>` tag, in Laravel's spelling, so the first render never depends on `navigator.language`.
- `@tolki/lang/vite-laravel` is a Vite plugin that runs the `lang:export` command of the Composer package `abetwothree/laravel-lang-export`, serves the exported files to your app and re-runs the command when your lang files change.
- `virtual:tolki-lang` is the module that plugin serves; add `@tolki/lang/client` to your `tsconfig` types so it is typed.
- `@tolki/lang/vue`, `@tolki/lang/react` and `@tolki/lang/svelte` each give you `createLang` and a hook or context to read the lang in a component: a Vue plugin with `useLang`, `LangProvider` and `useLang` for React, and `setLang` and `getLang` for Svelte. Peers: `vue` ^3.5.0, `react` ^19.0.0, `svelte` ^5.7.0, `vite` ^7.0.0 || ^8.0.0.
