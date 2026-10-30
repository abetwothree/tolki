# @tolki/lang

## 0.2.1

### Patch Changes

- 4f2ec6a: Fix export paths to include a default pseudo require import
- Updated dependencies [5a9be1d]
- Updated dependencies [c2d0ebc]
- Updated dependencies [5a9be1d]
- Updated dependencies [5a9be1d]
  - @tolki/data@1.0.2
  - @tolki/str@1.7.1
  - @tolki/utils@1.6.3

## 0.2.0

### Minor Changes

- c647f7c: `@tolki/lang` can now load a Laravel app's lang files for you, and plugs into Vue, React and Svelte.
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

### Patch Changes

- Updated dependencies [c647f7c]
- Updated dependencies [c647f7c]
  - @tolki/types@1.11.0
  - @tolki/utils@1.6.2

## 0.1.0

### Minor Changes

- 73a813d: New package: Laravel's translator for JavaScript, so a lang string filled in the browser matches the same string filled by Laravel.
  - `Translator` reads a per-locale strings object with `get`, `has`, `choice`, `string` and `array`, including fallback locales and `package::group.key` keys.
  - `makeReplacements` fills `:name`, `:Name` and `:NAME` placeholders and `<tag>` callbacks, longest key first.
  - `choose` and `getPluralIndex` pick a plural form from `{0}` and `[2,*]` ranges or from each locale's plural rules.
  - `normalizeLocale` turns a browser locale such as `en-US` into Laravel's `en_US`.
  - `createHelpers` gives you `__`, `trans` and `transChoice` bound to one translator.

### Patch Changes

- Updated dependencies [eb563dc]
- Updated dependencies [adee162]
- Updated dependencies [40d89eb]
  - @tolki/data@1.0.1
  - @tolki/types@1.10.0
  - @tolki/utils@1.6.1
