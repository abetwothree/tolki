---
"@tolki/lang": minor
---

`@tolki/lang` can now load a Laravel app's lang files for you, and plugs into Vue, React and Svelte.

- `createLang` builds a lang from a locale, a fallback and either lines you already have or a `load` function that fetches a locale when it is first needed. The lang gives you `__`, `trans` and `transChoice`.
- `bindLang` wraps a lang's reads so each one reports to a tracker first; the Vue, React and Svelte entries are built on it.
- `htmlLocale` reads the locale from the page's `<html lang>` tag and answers it in the spelling your locales use, so the first render never depends on `navigator.language`.
- `@tolki/lang/vite-laravel` is a Vite plugin, `import laravelLangExport from "@tolki/lang/vite-laravel"`. It runs the `lang:export` command of the Composer package `abetwothree/laravel-lang-export`, serves the exported files to your app and re-runs the command when your lang files change.
- `virtual:tolki-lang` is the module that plugin serves; add `@tolki/lang/client` to your `tsconfig` types so it is typed.
- `@tolki/lang/vue` gives you `createLang` (a Vue plugin) and `useLang`.
- `@tolki/lang/react` gives you `createLang`, `LangProvider` and `useLang`.
- `@tolki/lang/svelte` gives you `createLang`, `setLang`, `getLang` and `langContext`.
- `vue`, `react`, `svelte` and `vite` are optional peers; install only the one you use. Ranges: `vue` ^3.5.0, `react` ^19.0.0, `svelte` ^5.7.0, `vite` ^7.0.0 || ^8.0.0.
- `@tolki/lang/package.json` can now be imported.
