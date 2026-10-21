# Differences from Laravel

`@tolki/lang` follows Laravel's `Translator` and `MessageSelector` wherever JavaScript can hold the same data. These are the places where it cannot, or chooses not to.

## One object for the JSON and group files

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

## Locales and the fallback

Laravel's plural table spells locales `en_US`, so a hyphenated BCP 47 tag gets the default rule, which is always index 0, so `getPluralIndex("en-US", 5)` is 0. This port matches Laravel and adds [`normalizeLocale`](./translator.md#normalizelocale) to convert a tag, which you apply to the locale and to the keys of your lines alike. <!-- docs/php-parity/MessageSelector/getPluralIndex.json, "plural-index-en-US"; docs/php-parity/MessageSelector/getPluralIndex.json, "plural-index-pt-BR" -->

```js
import { getPluralIndex, normalizeLocale } from "@tolki/lang";

getPluralIndex("pt-BR", 2);
// => 0

getPluralIndex(normalizeLocale("pt-BR"), 2);
// => 1

getPluralIndex(normalizeLocale("pt-BR"), 1);
// => 0
```

A new `Translator` has no fallback locale, as in Laravel, where only the service provider sets one. Call `setFallback()`. See [the warning on setting a fallback](./index.md#quick-start). <!-- docs/php-parity/Translator/getFallback.json, "fallback-starts-null"; docs/php-parity/Translator/choice.json, "choice-without-fallback-uses-first-form" -->

## Tag keys match literally

Laravel builds the pattern for a tag callback from the key as it is, so a key `a.b` also matches `<aXb>`. This port escapes the key, and `a.b` matches only `<a.b>`. <!-- docs/php-parity/Translator/makeReplacements.json, "replace-tag-key-is-a-pattern" -->

```js
import { makeReplacements } from "@tolki/lang";

makeReplacements("<a.b>hi</a.b> <aXb>hi</aXb>", {
  "a.b": (text) => text.toUpperCase(),
});
// => "HI <aXb>hi</aXb>"
```

## Objects need a handler

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

## Title case

For `:Name`, PHP title-cases the first character with `mb_ucfirst`. This port uses `ucfirst` from `@tolki/str`, which upper-cases it. These two characters are known to differ: `ß`, which PHP title-cases to `Ss` and this port to `SS`, and `ǆ`, which PHP title-cases to `ǅ` and this port to `Ǆ`. <!-- docs/php-parity/Translator/makeReplacements.json, "replace-sharp-s-title-case"; docs/php-parity/Translator/makeReplacements.json, "replace-digraph-title-case" -->

```js
import { makeReplacements } from "@tolki/lang";

makeReplacements(":Name", { name: "ßtraße" });
// => "SStraße"

makeReplacements(":Name", { name: "ǆemal" });
// => "Ǆemal"
```

## No file loading

The caller passes the lines. There is no loader, so the translator never reads `lang/en.json` or `lang/en/messages.php`, and there is no `addNamespace`, `addPath` or `addJsonPath`. Build the lines object on the server, as shown in [Installation & Usage](./index.md#building-the-lines-on-the-server), or import your JSON files.

## Not ported

- `load`, `isLoaded`, `getLoader`, `addNamespace`, `addPath`, `addJsonPath`, `FileLoader`, `ArrayLoader` and `TranslationServiceProvider`: loading lang files is the caller's job here.
- `getSelector` and `setSelector`: the selector is the stateless functions `choose` and `getPluralIndex`.
- `NamespacedItemResolver::setParsedKey` and `flushParsedKeys`, and the parse cache: the cache is invisible except through those two, which exist for the config repository.
- `Macroable`, and `stringable()` with a single closure argument: JavaScript has neither macros on this class nor parameter types to read.
- The `name` of a pure (unit) enum: an `@tolki/enum` case always has a `value`.
- `PotentiallyTranslatedString`, `CreatesPotentiallyTranslatedStrings` and `HasLocalePreference`: they are plumbing for validation and notifications.
