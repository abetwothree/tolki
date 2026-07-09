# Tolki String Utilities List

<script setup>
import {
  after,
  afterLast,
  apa,
  ascii,
  before,
  beforeLast,
  between,
  betweenFirst,
  camel,
  charAt,
  chopStart,
  chopEnd,
  contains,
  containsAll,
  counted,
  doesntContain,
  deduplicate,
  doesntEndWith,
  doesntStartWith,
  endsWith,
  excerpt,
  finish,
  fromBase64,
  headline,
  initials,
  inlineMarkdown,
  is,
  isAscii,
  isJson,
  isUrl,
  isUlid,
  isUuid,
  kebab,
  lcfirst,
  length,
  limit,
  lower,
  markdown,
  mask,
  match,
  matchAll,
  isMatch,
  numbers,
  padBoth,
  padLeft,
  padRight,
  pascal,
  pluralPascal,
  plural,
  pluralStudly,
  position,
  remove,
  repeat,
  replaceArray,
  replace,
  replaceFirst,
  replaceLast,
  replaceMatches,
  replaceStart,
  replaceEnd,
  reverse,
  singular,
  slug,
  snake,
  squish,
  start,
  startsWith,
  stripTags,
  studly,
  substr,
  substrCount,
  substrReplace,
  swap,
  take,
  title,
  toBase64,
  transliterate,
  trim,
  ltrim,
  rtrim,
  ucfirst,
  ucsplit,
  ucwords,
  upper,
  unwrap,
  wordCount,
  wordWrap,
  words,
  wrap,
} from "@tolki/str";

// inlineMarkdown/markdown take an options object; the playground exposes its
// two boolean keys directly instead of requiring hand-written JSON.
const inlineMarkdownDemo = (value, html, allowUnsafeLinks) =>
  inlineMarkdown(value, { html, allowUnsafeLinks });
const markdownDemo = (value, html, allowUnsafeLinks) =>
  markdown(value, { html, allowUnsafeLinks });

// replaceMatches' `replace` argument can be a closure; the playground offers
// a preset dropdown of representative callbacks instead of a free-form input.
const replaceCallbackOptions = [
  { label: "number ${match}", value: (m) => `number ${m[0]}` },
  { label: "match.toUpperCase()", value: (m) => m[0].toUpperCase() },
];
</script>

## String Utilities List

These are the string utilities that can be used independently as single functions.

<div class="collection-method-list" markdown="1">

[after](#after) [afterLast](#afterlast) [apa](#apa) [ascii](#ascii) [before](#before) [beforeLast](#beforelast) [between](#between) [betweenFirst](#betweenfirst) [camel](#camel) [charAt](#charat) [chopEnd](#chopend) [chopStart](#chopstart) [contains](#contains) [containsAll](#containsall) [counted](#counted) [doesntContain](#doesntcontain) [deduplicate](#deduplicate) [doesntEndWith](#doesntendwith) [doesntStartWith](#doesntstartwith) [endsWith](#endswith) [excerpt](#excerpt) [finish](#finish) [fromBase64](#frombase64) [headline](#headline) [initials](#initials) [inlineMarkdown](#inlinemarkdown) [is](#is) [isAscii](#isascii) [isJson](#isjson) [isUrl](#isurl) [isUlid](#isulid) [isUuid](#isuuid) [kebab](#kebab) [lcfirst](#lcfirst) [length](#length) [limit](#limit) [lower](#lower) [markdown](#markdown) [mask](#mask) [match](#match) [matchAll](#matchall) [isMatch](#ismatch) [numbers](#numbers) [padBoth](#padboth) [padLeft](#padleft) [padRight](#padright) [pascal](#pascal) [pluralPascal](#pluralpascal) [password](#password) [plural](#plural) [pluralStudly](#pluralstudly) [position](#position) [random](#random) [remove](#remove) [repeat](#repeat) [replace](#replace) [replaceArray](#replacearray) [replaceFirst](#replacefirst) [replaceLast](#replacelast) [replaceMatches](#replacematches) [replaceStart](#replacestart) [replaceEnd](#replaceend) [reverse](#reverse) [singular](#singular) [slug](#slug) [snake](#snake) [squish](#squish) [start](#start) [startsWith](#startswith) [stripTags](#striptags) [studly](#studly) [substr](#substr) [substrCount](#substrcount) [substrReplace](#substrreplace) [swap](#swap) [take](#take) [title](#title) [toBase64](#tobase64) [transliterate](#transliterate) [trim](#trim) [ltrim](#ltrim) [rtrim](#rtrim) [ucfirst](#ucfirst) [ucsplit](#ucsplit) [ucwords](#ucwords) [upper](#upper) [ulid](#ulid) [unwrap](#unwrap) [uuid](#uuid) [uuid7](#uuid7) [wordCount](#wordcount) [wordWrap](#wordwrap) [words](#words) [wrap](#wrap) [str](#str) [of](#of)

</div>

## String Utilities Details

### after

Return the remainder of a string after the first occurrence of a given value.

```javascript
import { after } from "@tolki/str";

const result = after("This is my name", "This is");

// result is " my name"
```

<FnTry
  :fn="after"
  :args="[
    { name: 'subject', default: 'This is my name' },
    { name: 'search', default: 'This is' },
  ]"
/>

### afterLast

Return the remainder of a string after the last occurrence of a given value.

```javascript
import { afterLast } from "@tolki/str";

const result = afterLast("App\Http\Controllers\Controller", "\\");

// result is "Controller"
```

<FnTry
  :fn="afterLast"
  :args="[
    { name: 'subject', default: 'App/Http/Controllers/Controller' },
    { name: 'search', default: '/' },
  ]"
/>

### apa

Convert the given string to [APA-style](https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case) title case.

```javascript
import { apa } from "@tolki/str";

const result = apa("Creating A Project");

// result is "Creating a Project"
```

<FnTry
  :fn="apa"
  :args="[
    { name: 'value', default: 'Creating A Project' },
  ]"
/>

### ascii

Transliterate a UTF-8 value to ASCII.

Uses the [`transliteration`](https://www.npmjs.com/package/transliteration) package.

```javascript
import { ascii } from "@tolki/str";

const result = ascii("û");

// result is "u"
```

<FnTry
  :fn="ascii"
  :args="[
    { name: 'value', default: 'û' },
  ]"
/>

### before

Get the portion of a string before the first occurrence of a given value.

```javascript
import { before } from "@tolki/str";

const result = before("This is my name", "my");

// result is "This is "
```

<FnTry
  :fn="before"
  :args="[
    { name: 'subject', default: 'This is my name' },
    { name: 'search', default: 'my' },
  ]"
/>

### beforeLast

Get the portion of a string before the last occurrence of a given value.

```javascript
import { beforeLast } from "@tolki/str";

const result = beforeLast("This is my name", "is");

// result is "This "
```

<FnTry
  :fn="beforeLast"
  :args="[
    { name: 'subject', default: 'This is my name' },
    { name: 'search', default: 'is' },
  ]"
/>

### between

Get the portion of a string between two given values.

```javascript
import { between } from "@tolki/str";

const result = between("This is my name", "This", "name");

// result is " is my "
```

<FnTry
  :fn="between"
  :args="[
    { name: 'subject', default: 'This is my name' },
    { name: 'from', default: 'This' },
    { name: 'to', default: 'name' },
  ]"
/>

### betweenFirst

Get the smallest possible portion of a string between two given values.

```javascript
import { betweenFirst } from "@tolki/str";

const result = betweenFirst("[a] bc [d]", "[", "]");

// result is "a"
```

<FnTry
  :fn="betweenFirst"
  :args="[
    { name: 'subject', default: '[a] bc [d]' },
    { name: 'from', default: '[' },
    { name: 'to', default: ']' },
  ]"
/>

### camel

Convert a value to camel case.

```javascript
import { camel } from "@tolki/str";

const result = camel("foo_bar");

// result is "fooBar"
```

<FnTry
  :fn="camel"
  :args="[
    { name: 'value', default: 'foo_bar' },
  ]"
/>

### charAt

Get the character at the specified index.

```javascript
import { charAt } from "@tolki/str";

const result = charAt("This is my name.", 6);

// result is "s"
```

<FnTry
  :fn="charAt"
  :args="[
    { name: 'subject', default: 'This is my name.' },
    { name: 'index', type: 'number', default: 6 },
  ]"
/>

### chopStart

Remove the given string(s) if it exists at the start of the haystack.

```javascript
import { chopStart } from "@tolki/str";

const result = chopStart("https://laravel.com", "https://");

// result is "laravel.com"
```

<FnTry
  :fn="chopStart"
  :args="[
    { name: 'subject', default: 'https://laravel.com' },
    { name: 'needle', default: 'https://' },
  ]"
/>

You may also pass an array of string as the second argument:

```javascript
import { chopStart } from "@tolki/str";

const result = chopStart("http://laravel.com", ["https://", "http://"]);

// result is "laravel.com"
```

<FnTry
  :fn="chopStart"
  :args="[
    { name: 'subject', default: 'http://laravel.com' },
    { name: 'needle', type: 'json', default: ['https://', 'http://'] },
  ]"
/>

### chopEnd

Remove the given string(s) if it exists at the end of the haystack.

```javascript
import { chopEnd } from "@tolki/str";

const result = chopEnd("app/Models/Photograph.php", ".php");

// result is "app/Models/Photograph"
```

<FnTry
  :fn="chopEnd"
  :args="[
    { name: 'subject', default: 'app/Models/Photograph.php' },
    { name: 'needle', default: '.php' },
  ]"
/>

You may also pass an array of string as the second argument:

```javascript
import { chopEnd } from "@tolki/str";

const result = chopEnd("laravel.com/index.php", ["/index.html", "/index.php"]);

// result is "laravel.com"
```

<FnTry
  :fn="chopEnd"
  :args="[
    { name: 'subject', default: 'laravel.com/index.php' },
    { name: 'needle', type: 'json', default: ['/index.html', '/index.php'] },
  ]"
/>

### contains

Determine if a given string contains a given substring.

```javascript
import { contains } from "@tolki/str";

const result = contains("This is my name", "my");

// result is true
```

You may also pass an array of strings as the second argument:

```javascript
import { contains } from "@tolki/str";

const result = contains("This is my name", ["my", "foo"]);

// result is true
```

You may also disable case sensitivity by passing true as the third argument:

```javascript
import { contains } from "@tolki/str";

const result = contains("This is my name", "MY", true);

// result is true
```

<FnTry
  :fn="contains"
  :args="[
    { name: 'haystack', default: 'This is my name' },
    { name: 'needles', type: 'json', default: ['my', 'foo'] },
    { name: 'ignoreCase', type: 'boolean', default: false },
  ]"
/>

### containsAll

Determine if a given string contains all array values.

```javascript
import { containsAll } from "@tolki/str";

const result = containsAll("This is my name", ["my", "name"]);

// result is true
```

You may also disable case sensitivity by passing true as the second argument:

```javascript
import { containsAll } from "@tolki/str";

const result = containsAll("This is my name", ["MY", "NAME"], true);

// result is true
```

<FnTry
  :fn="containsAll"
  :args="[
    { name: 'haystack', default: 'This is my name' },
    { name: 'needles', type: 'json', default: ['my', 'name'] },
    { name: 'ignoreCase', type: 'boolean', default: false },
  ]"
/>

### counted

Get the plural form of an English word with the count prepended.

```javascript
import { counted } from "@tolki/str";

const result = counted("order", 1);

// result is "1 order"

const result2 = counted("order", 1000);

// result2 is "1,000 orders"
```

You may also pass an array as the count, in which case its length is used:

```javascript
import { counted } from "@tolki/str";

const result = counted("order", ["a", "b"]);

// result is "2 orders"
```

<FnTry
  :fn="counted"
  :args="[
    { name: 'value', default: 'order' },
    { name: 'count', type: 'number', default: 1000 },
  ]"
/>

### doesntContain

Determine if a given string doesn't contain a given substring.

```javascript
import { doesntContain } from "@tolki/str";

const result = doesntContain("This is name", "my");

// result is true
```

You may also pass an array of strings as the second argument:

```javascript
import { doesntContain } from "@tolki/str";

const result = doesntContain("This is name", ["my", "framework"]);

// result is true
```

You may also disable case sensitivity by passing true as the third argument:

```javascript
import { doesntContain } from "@tolki/str";

const result = doesntContain("This is name", "MY", true);

// result is true
```

<FnTry
  :fn="doesntContain"
  :args="[
    { name: 'haystack', default: 'This is name' },
    { name: 'needles', type: 'json', default: ['my', 'framework'] },
    { name: 'ignoreCase', type: 'boolean', default: false },
  ]"
/>

### deduplicate

Replace consecutive instances of a given character with a single character in the given string.

```javascript
import { deduplicate } from "@tolki/str";

const result = deduplicate("The   Laravel   Framework");

// result is "The Laravel Framework"
```

You can specify which character to deduplicate as the second argument (defaults to space):

```javascript
import { deduplicate } from "@tolki/str";

const result = deduplicate("The---Laravel---Framework", "-");

// result is "The-Laravel-Framework"
```

You can also specify multiple characters to deduplicate by passing an array as the second argument:

```javascript
import { deduplicate } from "@tolki/str";

const result = deduplicate("The---Laravel   Framework", ["-", " "]);

// result is "The-Laravel Framework"
```

<FnTry
  :fn="deduplicate"
  :args="[
    { name: 'value', default: 'The---Laravel   Framework' },
    { name: 'character', type: 'json', default: ['-', ' '] },
  ]"
/>

### doesntEndWith

Determine if a given string doesn't end with a given substring.

```javascript
import { doesntEndWith } from "@tolki/str";

const result = doesntEndWith("This is my name", "dog");

// result is true
```

You may also pass an array of strings as the second argument. If the string ends with any of the substrings, the function will return false.

```javascript
import { doesntEndWith } from "@tolki/str";

const result = doesntEndWith("This is my name", ["this", "foo"]);

// result is true

const result2 = doesntEndWith("This is my name", ["name", "foo"]);

// result2 is false
```

<FnTry
  :fn="doesntEndWith"
  :args="[
    { name: 'haystack', default: 'This is my name' },
    { name: 'needles', type: 'json', default: ['this', 'foo'] },
  ]"
/>

### doesntStartWith

Determine if a given string doesn't start with a given substring.

```javascript
import { doesntStartWith } from "@tolki/str";

const result = doesntStartWith("This is my name", "That");

// result is true
```

You may also pass an array of strings as the second argument. If the string starts with any of the substrings, the function will return false.

```javascript
import { doesntStartWith } from "@tolki/str";

const result = doesntStartWith("This is my name", ["this", "foo"]);

// result is true

const result2 = doesntStartWith("This is my name", ["name", "foo"]);

// result2 is true
```

<FnTry
  :fn="doesntStartWith"
  :args="[
    { name: 'haystack', default: 'This is my name' },
    { name: 'needles', type: 'json', default: ['this', 'foo'] },
  ]"
/>

### endsWith

Determine if a given string ends with a given substring.

```javascript
import { endsWith } from "@tolki/str";

const result = endsWith("This is my name", "name");

// result is true
```

You may also pass an array of strings as the second argument to determine if the string ends with any of the substrings.

```javascript
import { endsWith } from "@tolki/str";

const result = endsWith("This is my name", ["name", "foo"]);

// result is true

const result2 = endsWith("This is my name", ["this", "foo"]);

// result2 is false
```

<FnTry
  :fn="endsWith"
  :args="[
    { name: 'haystack', default: 'This is my name' },
    { name: 'needles', type: 'json', default: ['name', 'foo'] },
  ]"
/>

### excerpt

Extracts an excerpt from text that matches the first instance of a phrase.

```javascript
import { excerpt } from "@tolki/str";

const result = excerpt("This is my name", "my", { radius: 3 });

// result is "...is my na..."
```

The radius option, which defaults to 100, allows you to define the number of characters that should appear on each side of the truncated string.

In addition, you may use the omission option to define the string that will be prepended and appended to the truncated string:

```javascript
import { excerpt } from "@tolki/str";

const result = excerpt("This is my name", "name", {
  radius: 3,
  omission: "(...) ",
});

// result is "(...) my name"
```

<FnTry
  :fn="excerpt"
  :args="[
    { name: 'text', default: 'This is my name' },
    { name: 'phrase', default: 'my' },
    { name: 'options', type: 'json', default: { radius: 3 } },
  ]"
/>

### finish

Cap a string with a single instance of a given value.

```javascript
import { finish } from "@tolki/str";

const result = finish("this/string", "/");

// result is 'this/string/'

const result2 = finish("this/string/", "/");

// result2 is also 'this/string/'
```

<FnTry
  :fn="finish"
  :args="[
    { name: 'value', default: 'this/string' },
    { name: 'cap', default: '/' },
  ]"
/>

### fromBase64

Decode the given Base64 encoded string.

```javascript
import { fromBase64 } from "@tolki/str";

const result = fromBase64("TGFyYXZlbA==");

// result is 'Laravel'
```

<FnTry
  :fn="fromBase64"
  :args="[
    { name: 'value', default: 'TGFyYXZlbA==' },
  ]"
/>

### headline

Convert the given string to proper case for each word.

```javascript
import { headline } from "@tolki/str";

const result = headline("steve_jobs");

// result is "Steve Jobs"

const result2 = headline("EmailNotificationSent");

// result2 is "Email Notification Sent"
```

<FnTry
  :fn="headline"
  :args="[
    { name: 'value', default: 'EmailNotificationSent' },
  ]"
/>

### initials

Get the "initials" representing each word in the provided string, optionally capitalizing.

```javascript
import { initials } from "@tolki/str";

const result = initials("taylor otwell");

// result is "to"

const result2 = initials("taylor otwell", true);

// result2 is "TO"
```

<FnTry
  :fn="initials"
  :args="[
    { name: 'value', default: 'taylor otwell' },
    { name: 'capitalize', type: 'boolean', default: false },
  ]"
/>

### inlineMarkdown

Converts inline Markdown into HTML.

Uses the [`markdown-it`](https://www.npmjs.com/package/markdown-it) package.

```javascript
import { inlineMarkdown } from "@tolki/str";

const result = inlineMarkdown("This is **bold** and this is *italic*.");

// result is 'This is <strong>bold</strong> and this is <em>italic</em>.'
```

#### Inline Markdown Security

By default, the `inlineMarkdown` function disables raw HTML and unsafe links (e.g., `javascript:` URLs) to prevent XSS attacks. You can enable raw HTML by passing `{ html: true }` in the options.

```javascript
import { inlineMarkdown } from "@tolki/str";

const result = inlineMarkdown(
  "This is <strong>bold</strong> and this is <em>italic</em>.",
  { html: true },
);

// result is 'This is <strong>bold</strong> and this is <em>italic</em>.'
```

You can also enable unsafe links by passing `{ allowUnsafeLinks: true }` in the options.

```javascript
import { inlineMarkdown } from "@tolki/str";

const result = inlineMarkdown("[click me](javascript:alert(1))", {
  allowUnsafeLinks: true,
});

// result is '<a href="javascript:alert(1)">click me</a>'
```

<FnTry
  :fn="inlineMarkdownDemo"
  :args="[
    { name: 'value', default: '[click me](javascript:alert(1))' },
    { name: 'html', type: 'boolean', default: false },
    { name: 'allowUnsafeLinks', type: 'boolean', default: false },
  ]"
/>

### is

Determine if a given string matches a given pattern.

```javascript
import { is } from "@tolki/str";

const result = is("foo*", "foobar");

// result is true

const result2 = is("baz*", "foobar");

// result2 is false
```

You can disable case sensitivity by passing true as the third argument:

```javascript
import { is } from "@tolki/str";

const result = is("*.jpg", "photo.JPG", true);

// result is true
```

<FnTry
  :fn="is"
  :args="[
    { name: 'pattern', default: 'foo*' },
    { name: 'value', default: 'foobar' },
    { name: 'ignoreCase', type: 'boolean', default: false },
  ]"
/>

### isAscii

Determine if a given string is 7-bit ASCII.

```javascript
import { isAscii } from "@tolki/str";

const result = isAscii("Taylor");

// result is true

const result2 = isAscii("û");

// result2 is false
```

<FnTry
  :fn="isAscii"
  :args="[
    { name: 'value', default: 'Taylor' },
  ]"
/>

### isJson

Determine if a given value is valid JSON.

```javascript
import { isJson } from "@tolki/str";

const result = isJson("[1,2,3]");

// result is true

const result2 = isJson('{"first": "John", "last": "Doe"}');

// result2 is true

const result3 = isJson('{first: "John", last: "Doe"}');

// result3 is false
```

<FnTry
  :fn="isJson"
  :args="[
    { name: 'value', default: '[1,2,3]' },
  ]"
/>

### isUrl

Determine if a given value is a valid URL.

```javascript
import { isUrl } from "@tolki/str";

const result = isUrl("https://example.com");

// result is true

const result2 = isUrl("tolki js");

// result2 is false
```

You may also specify an array of allowed protocols as the second argument:

```javascript
import { isUrl } from "@tolki/str";

const result = isUrl("https://example.com", ["https", "http"]);

// result is true

const result2 = isUrl("http://example.com", ["https"]);

// result2 is false
```

<FnTry
  :fn="isUrl"
  :args="[
    { name: 'value', default: 'https://example.com' },
    { name: 'protocols', type: 'json', default: ['https', 'http'] },
  ]"
/>

### isUlid

Determine if a given value is a valid ULID.

```javascript
import { isUlid } from "@tolki/str";

const result = isUlid("01gd6r360bp37zj17nxb55yv40");

// result is true

const result2 = isUlid("tolkijs");

// result2 is false
```

<FnTry
  :fn="isUlid"
  :args="[
    { name: 'value', default: '01gd6r360bp37zj17nxb55yv40' },
  ]"
/>

### isUuid

Determine if a given value is a valid UUID.

Uses the [`uuid`](https://www.npmjs.com/package/uuid) package.

```javascript
import { isUuid } from "@tolki/str";

const result = isUuid("a0a2a2d2-0b87-4a18-83f2-2529882be2de");

// result is true

const result2 = isUuid("tolkijs");

// result2 is false
```

You may also validate that the given UUID matches a UUID specification by version (1, 3, 4, 5, 6, 7, or 8):

```javascript
import { isUuid } from "@tolki/str";

const result = isUuid("a0a2a2d2-0b87-4a18-83f2-2529882be2de", 4);

// result is true

const result2 = isUuid("a0a2a2d2-0b87-4a18-83f2-2529882be2de", 5);

// result2 is false
```

<FnTry
  :fn="isUuid"
  :args="[
    { name: 'value', default: 'a0a2a2d2-0b87-4a18-83f2-2529882be2de' },
    { name: 'version', type: 'number', default: 4 },
  ]"
/>

### kebab

Convert a string to kebab case.

```javascript
import { kebab } from "@tolki/str";

const result = kebab("fooBar");

// result is "foo-bar"
```

<FnTry
  :fn="kebab"
  :args="[
    { name: 'value', default: 'fooBar' },
  ]"
/>

### lcfirst

Make a string's first character lowercase.

```javascript
import { lcfirst } from "@tolki/str";

const result = lcfirst("Foo Bar");

// result is "foo Bar"
```

<FnTry
  :fn="lcfirst"
  :args="[
    { name: 'value', default: 'Foo Bar' },
  ]"
/>

### length

Return the length of the given string.

```javascript
import { length } from "@tolki/str";

const result = length("Tolki JS");

// result is 8
```

<FnTry
  :fn="length"
  :args="[
    { name: 'value', default: 'Tolki JS' },
  ]"
/>

### limit

Limit the number of characters in a string.

```javascript
import { limit } from "@tolki/str";

const result = limit("The quick brown fox jumps over the lazy dog", 20);

// result is "The quick brown fox "
```

You may pass a third argument to specify the string to append to the truncated string (defaults to an ellipsis):

```javascript
import { limit } from "@tolki/str";

const result = limit("The quick brown fox jumps over the lazy dog", 20, "...");

// result is "The quick brown fox..."
```

You may also pass a fourth argument to indicate whether to avoid cutting off words (defaults to false):

```javascript
import { limit } from "@tolki/str";

const result = limit(
  "The quick brown fox jumps over the lazy dog",
  12,
  "...",
  true,
);

// result is "The quick..."
```

<FnTry
  :fn="limit"
  :args="[
    { name: 'value', default: 'The quick brown fox jumps over the lazy dog' },
    { name: 'limit', type: 'number', default: 20 },
    { name: 'end', default: '...' },
    { name: 'preserveWords', type: 'boolean', default: false },
  ]"
/>

### lower

Convert the given string to lower-case.

```javascript
import { lower } from "@tolki/str";

const result = lower("LARAVEL");

// result is "laravel"
```

<FnTry
  :fn="lower"
  :args="[
    { name: 'value', default: 'LARAVEL' },
  ]"
/>

### markdown

Converts GitHub flavored Markdown into HTML.

Uses the [`markdown-it`](https://www.npmjs.com/package/markdown-it) package.

```javascript
import { markdown } from "@tolki/str";

const result = markdown("# Laravel");

// result is "<h1>Laravel</h1>"
```

#### Markdown Security

By default, the `markdown` function disables raw HTML and unsafe links (e.g., `javascript:` URLs) to prevent XSS attacks. You can enable raw HTML by passing `{ html: true }` in the options.

```javascript
import { markdown } from "@tolki/str";

const result = markdown(
  "This is <strong>bold</strong> and this is <em>italic</em>.",
  { html: true },
);

// result is '<p>This is <strong>bold</strong> and this is <em>italic</em>.</p>'
```

You can also enable unsafe links by passing `{ allowUnsafeLinks: true }` in the options.

```javascript
import { markdown } from "@tolki/str";

const result = markdown("[click me](javascript:alert(1))", {
  allowUnsafeLinks: true,
});

// result is '<p><a href="javascript:alert(1)">click me</a></p>'
```

<FnTry
  :fn="markdownDemo"
  :args="[
    { name: 'value', default: '[click me](javascript:alert(1))' },
    { name: 'html', type: 'boolean', default: false },
    { name: 'allowUnsafeLinks', type: 'boolean', default: false },
  ]"
/>

### mask

Masks a portion of a string with a repeated character.

```javascript
import { mask } from "@tolki/str";

const result = mask("taylor@example.com", "*", 3);

// result is "tay***************"
```

If needed, you may provide a negative value for the third argument, which instructs the function to begin masking from the end of the string. A fourth argument may also be provided to specify the number of masked characters.

```javascript
import { mask } from "@tolki/str";

const result = mask("taylor@example.com", "*", -15, 3);

// result is "tay***@example.com"
```

<FnTry
  :fn="mask"
  :args="[
    { name: 'value', default: 'taylor@example.com' },
    { name: 'character', default: '*' },
    { name: 'index', type: 'number', default: -15 },
    { name: 'length', type: 'number', default: 3 },
  ]"
/>

### match

Get the string matching the given pattern.

```javascript
import { match } from "@tolki/str";

const result = match("/bar/", "foo bar");

// result is "bar"

const result2 = match("/foo (.*)/", "foo bar");

// result2 is "bar"
```

<FnTry
  :fn="match"
  :args="[
    { name: 'pattern', default: '/foo (.*)/' },
    { name: 'subject', default: 'foo bar' },
  ]"
/>

### matchAll

Get the string(s) matching the given pattern.

```javascript
import { matchAll } from "@tolki/str";

const result = matchAll("/bar/", "bar foo bar");

// result is ["bar", "bar"]
```

If no matches are found, an empty array will be returned.

<FnTry
  :fn="matchAll"
  :args="[
    { name: 'pattern', default: '/bar/' },
    { name: 'subject', default: 'bar foo bar' },
  ]"
/>

### isMatch

Determine if a given string matches a given pattern.

```javascript
import { isMatch } from "@tolki/str";

const result = isMatch("/foo (.*)/", "foo bar");

// result is true

const result2 = isMatch("/foo (.*)/", "laravel");

// result2 is false
```

<FnTry
  :fn="isMatch"
  :args="[
    { name: 'pattern', default: '/foo (.*)/' },
    { name: 'subject', default: 'foo bar' },
  ]"
/>

### orderedUuid

This function is purposely not implemented. Use the `uuid7()` function instead to generate a UUIDv7, which is a time-ordered UUID.

See more details on this [StackOverflow discussion](https://stackoverflow.com/a/79196945).

### numbers

Remove all non-numeric characters from a string.

```javascript
import { numbers } from "@tolki/str";

const result = numbers("(555) 123-4567");

// result is "5551234567"

const result2 = numbers("L4r4v3l!");

// result2 is "443"
```

<FnTry
  :fn="numbers"
  :args="[
    { name: 'value', default: '(555) 123-4567' },
  ]"
/>

### padBoth

Pad both sides of a string with another string to a certain length.

```javascript
import { padBoth } from "@tolki/str";

const result = padBoth("James", 10, "_");

// result is "__James__"

const result2 = padBoth("James", 10);

// result2 is "  James   "
```

<FnTry
  :fn="padBoth"
  :args="[
    { name: 'value', default: 'James' },
    { name: 'length', type: 'number', default: 10 },
    { name: 'pad', default: '_' },
  ]"
/>

### padLeft

Pad the left side of a string with another string to a certain length.

```javascript
import { padLeft } from "@tolki/str";

const result = padLeft("James", 10, "-=");

// result is "-=-=-James"

const result2 = padLeft("James", 10);

// result2 is "     James"
```

<FnTry
  :fn="padLeft"
  :args="[
    { name: 'value', default: 'James' },
    { name: 'length', type: 'number', default: 10 },
    { name: 'pad', default: '-=' },
  ]"
/>

### padRight

Pad the right side of a string with another string to a certain length.

```javascript
import { padRight } from "@tolki/str";

const result = padRight("James", 10, "-");

// result is "James-----"

const result2 = padRight("James", 10);

// result2 is "James     "
```

<FnTry
  :fn="padRight"
  :args="[
    { name: 'value', default: 'James' },
    { name: 'length', type: 'number', default: 10 },
    { name: 'pad', default: '-' },
  ]"
/>

### pascal

Convert a value to Pascal case.

```javascript
import { pascal } from "@tolki/str";

const result = pascal("hello world");

// result is "HelloWorld"
```

<FnTry
  :fn="pascal"
  :args="[
    { name: 'value', default: 'hello world' },
    { name: 'normalize', type: 'boolean', default: false },
  ]"
/>

### pluralPascal

Pluralize the last word of an English, Pascal caps case string.

```javascript
import { pluralPascal } from "@tolki/str";

const result = pluralPascal("HelloWorld");

// result is "HelloWorlds"
```

<FnTry
  :fn="pluralPascal"
  :args="[
    { name: 'value', default: 'HelloWorld' },
    { name: 'count', type: 'number', default: 2 },
  ]"
/>

### password

::: info
`password`, `random`, `ulid`, `uuid`, and `uuid7` (along with their `createXUsing`/`createXNormally` testing helpers) generate a new value on every call, so a live playground would just show a different, unverifiable result each time you touch it — there's no live example for these.
:::

Generate a random, secure password.

```javascript
import { password } from "@tolki/str";

const result = password();

// result is a random, secure password
```

### plural

Get the plural form of an English word.

```javascript
import { plural } from "@tolki/str";

const result = plural("car");

// result is "cars"

const result2 = plural("child");

// result2 is "children"
```

You may provide a second argument to specify the count. If the count is 1, the singular form will be returned.

```javascript
import { plural } from "@tolki/str";

const result = plural("child", 2);

// result is "children"

const result2 = plural("child", 1);

// result2 is "child"
```

You pass a third argument to prepend the count to the resulting string.

```javascript
import { plural } from "@tolki/str";

const result = plural("car", 1000, true);

// result is "1,000 cars"
```

<FnTry
  :fn="plural"
  :args="[
    { name: 'value', default: 'car' },
    { name: 'count', type: 'number', default: 1000 },
    { name: 'prependCount', type: 'boolean', default: true },
  ]"
/>

### pluralStudly

Pluralize the last word of an English, studly caps case string.

```javascript
import { pluralStudly } from "@tolki/str";

const result = pluralStudly("VerifiedHuman");

// result is "VerifiedHumans"

const result2 = pluralStudly("UserFeedback");

// result2 is "UserFeedback"
```

<FnTry
  :fn="pluralStudly"
  :args="[
    { name: 'value', default: 'VerifiedHuman' },
    { name: 'count', type: 'number', default: 2 },
  ]"
/>

### position

Find the multi-byte safe position of the first occurrence of a given substring in a string.

```javascript
import { position } from "@tolki/str";

const result = position("Hello, World!", "Hello");

// result is 0

const result2 = position("Hello, World!", "W");

// result2 is 7
```

<FnTry
  :fn="position"
  :args="[
    { name: 'haystack', default: 'Hello, World!' },
    { name: 'needle', default: 'W' },
    { name: 'offset', type: 'number', default: 0 },
  ]"
/>

### random

Generate a more truly "random" alpha-numeric string.

```javascript
import { random } from "@tolki/str";

const result = random(40);

// result is a random 40-character alpha-numeric string
```

During testing, you can use the `createRandomStringsUsing` function to provide a custom random string generator for predictable results.

```javascript
import { createRandomStringsUsing, random } from "@tolki/str";

createRandomStringsUsing((length) => "A".repeat(length));

const result = random(5);

// result is "AAAAA"
```

You can reset to the default random string generator by calling the `createRandomStringsNormally` function.

```javascript
import {
  createRandomStringsUsing,
  createRandomStringsNormally,
  random,
} from "@tolki/str";

createRandomStringsUsing((length) => "A".repeat(length));

const result = random(5);

// result is "AAAAA"

createRandomStringsNormally();

const result2 = random(5);

// result is a random 5-character alpha-numeric string
```

### remove

Remove any occurrence of the given string in the subject.

```javascript
import { remove } from "@tolki/str";

const result = remove("e", "Peter Piper picked a peck of pickled peppers.");

// result is "Ptr Pipr pickd a pck of pickld ppprs."
```

You can pass false as the third argument to disable case sensitivity:

```javascript
import { remove } from "@tolki/str";

const result = remove(
  "e",
  "Peter Piper picked a peck of pickled peppers.",
  false,
);

// result is "Ptr Pipr pickd a pck of pickld ppprs."
```

<FnTry
  :fn="remove"
  :args="[
    { name: 'search', default: 'e' },
    { name: 'subject', default: 'Peter Piper picked a peck of pickled peppers.' },
    { name: 'caseSensitive', type: 'boolean', default: true },
  ]"
/>

### repeat

Repeat the given string.

```javascript
import { repeat } from "@tolki/str";

const result = repeat("a", 5);

// result is "aaaaa"
```

<FnTry
  :fn="repeat"
  :args="[
    { name: 'string', default: 'a' },
    { name: 'times', type: 'number', default: 5 },
  ]"
/>

### replace

Replace the given value in the given string.

```javascript
import { replace } from "@tolki/str";

const result = replace("11.x", "12.x", "Laravel 11.x");

// result is "Laravel 12.x"
```

The replace function also accepts a fourth argument to disable case sensitivity:

```javascript
import { replace } from "@tolki/str";

const result = replace(
  "php",
  "Laravel",
  "PHP Framework for Web Artisans",
  false,
);

// result is "Laravel Framework for Web Artisans"
```

<FnTry
  :fn="replace"
  :args="[
    { name: 'search', default: 'php' },
    { name: 'replace', default: 'Laravel' },
    { name: 'subject', default: 'PHP Framework for Web Artisans' },
    { name: 'caseSensitive', type: 'boolean', default: false },
  ]"
/>

### replaceArray

Replace a given value in the string sequentially with an array.

```javascript
import { replaceArray } from "@tolki/str";

const result = replaceArray(
  "?",
  ["8:30", "9:00"],
  "The event will take place between ? and ?",
);

// result is "The event will take place between 8:30 and 9:00"
```

<FnTry
  :fn="replaceArray"
  :args="[
    { name: 'search', default: '?' },
    { name: 'replace', type: 'json', default: ['8:30', '9:00'] },
    { name: 'subject', default: 'The event will take place between ? and ?' },
  ]"
/>

### replaceFirst

Replace the first occurrence of a given value in the string.

```javascript
import { replaceFirst } from "@tolki/str";

const result = replaceFirst(
  "the",
  "a",
  "the quick brown fox jumps over the lazy dog",
);

// result is "a quick brown fox jumps over the lazy dog"
```

<FnTry
  :fn="replaceFirst"
  :args="[
    { name: 'search', default: 'the' },
    { name: 'replace', default: 'a' },
    { name: 'subject', default: 'the quick brown fox jumps over the lazy dog' },
  ]"
/>

### replaceLast

Replace the last occurrence of a given value in the string.

```javascript
import { replaceLast } from "@tolki/str";

const result = replaceLast(
  "the",
  "a",
  "the quick brown fox jumps over the lazy dog",
);

// result is "the quick brown fox jumps over a lazy dog"
```

<FnTry
  :fn="replaceLast"
  :args="[
    { name: 'search', default: 'the' },
    { name: 'replace', default: 'a' },
    { name: 'subject', default: 'the quick brown fox jumps over the lazy dog' },
  ]"
/>

### replaceMatches

Replace the patterns matching the given regular expression.

```javascript
import { replaceMatches } from "@tolki/str";

const result = replaceMatches(/[^A-Za-z0-9]+/g, "", "(+1) 501-555-1000");

// result is "15015551000"
```

<FnTry
  :fn="replaceMatches"
  :args="[
    { name: 'pattern', default: '[^A-Za-z0-9]+' },
    { name: 'replace', default: '' },
    { name: 'subject', default: '(+1) 501-555-1000' },
  ]"
/>

The `replaceMatches` function also accepts a closure as the second argument, allowing you to perform the replacement logic within the closure and return the replaced value.

```javascript
import { replaceMatches } from "@tolki/str";

const result = replaceMatches(
  /\d+/g,
  (matches) => `number ${matches[0]}`,
  "My numbers are 123 and 456.",
);

// result is "My numbers are number 123 and number 456."
```

<FnTry
  :fn="replaceMatches"
  :args="[
    { name: 'pattern', default: '\\d+' },
    { name: 'replace', type: 'select', default: replaceCallbackOptions[0].value, options: replaceCallbackOptions },
    { name: 'subject', default: 'My numbers are 123 and 456.' },
  ]"
/>

### replaceStart

Replace the first occurrence of the given value if it appears at the start of the string.

```javascript
import { replaceStart } from "@tolki/str";

const result = replaceStart("Hello", "Laravel", "Hello World");

// result is "Laravel World"

const result2 = replaceStart("World", "Laravel", "Hello World");

// result2 is "Hello World"
```

<FnTry
  :fn="replaceStart"
  :args="[
    { name: 'search', default: 'Hello' },
    { name: 'replace', default: 'Laravel' },
    { name: 'subject', default: 'Hello World' },
  ]"
/>

### replaceEnd

Replace the last occurrence of a given value if it appears at the end of the string.

```javascript
import { replaceEnd } from "@tolki/str";

const result = replaceEnd("World", "Laravel", "Hello World");

// result is "Hello Laravel"

const result2 = replaceEnd("Hello", "Laravel", "Hello World");

// result2 is "Hello World"
```

<FnTry
  :fn="replaceEnd"
  :args="[
    { name: 'search', default: 'World' },
    { name: 'replace', default: 'Laravel' },
    { name: 'subject', default: 'Hello World' },
  ]"
/>

### reverse

Reverse the given string.

```javascript
import { reverse } from "@tolki/str";

const result = reverse("Hello World");

// result is "dlroW olleH"
```

<FnTry
  :fn="reverse"
  :args="[
    { name: 'value', default: 'Hello World' },
  ]"
/>

### singular

Get the singular form of an English word.

Uses the [`pluralize`](https://www.npmjs.com/package/pluralize) package.

```javascript
import { singular } from "@tolki/str";

const result = singular("cars");

// result is "car"

const result2 = singular("children");

// result2 is "child"
```

<FnTry
  :fn="singular"
  :args="[
    { name: 'value', default: 'children' },
  ]"
/>

### slug

Generate a URL-friendly "slug" from a given string.

```javascript
import { slug } from "@tolki/str";

const result = slug("Laravel 5 Framework", "-");

// result is "laravel-5-framework"
```

<FnTry
  :fn="slug"
  :args="[
    { name: 'title', default: 'Laravel 5 Framework' },
    { name: 'separator', default: '-' },
  ]"
/>

### snake

Convert a string to snake case.

```javascript
import { snake } from "@tolki/str";

const result = snake("fooBar");

// result is "foo_bar"

const result2 = snake("fooBar", "-");

// result2 is "foo-bar"
```

<FnTry
  :fn="snake"
  :args="[
    { name: 'value', default: 'fooBar' },
    { name: 'delimiter', default: '_' },
  ]"
/>

### squish

Remove all "extra" blank space from the given string.

```javascript
import { squish } from "@tolki/str";

const result = squish("    laravel    framework    ");

// result is "laravel framework"
```

<FnTry
  :fn="squish"
  :args="[
    { name: 'value', default: '    laravel    framework    ' },
  ]"
/>

### start

Begin a string with a single instance of a given value.

```javascript
import { start } from "@tolki/str";

const result = start("this/string", "/");

// result is "/this/string"

const result2 = start("/this/string", "/");

// result2 is also '/this/string'
```

<FnTry
  :fn="start"
  :args="[
    { name: 'value', default: 'this/string' },
    { name: 'prefix', default: '/' },
  ]"
/>

### startsWith

Determine if a given string starts with a given substring.

```javascript
import { startsWith } from "@tolki/str";

const result = startsWith("This is my name", "This");

// result is true
```

The second argument may also be an array of strings to check against. If the string starts with any of the substrings, the function will return true.

```javascript
import { startsWith } from "@tolki/str";

const result = startsWith("This is my name", ["This", "That", "There"]);

// result is true
```

<FnTry
  :fn="startsWith"
  :args="[
    { name: 'haystack', default: 'This is my name' },
    { name: 'needles', type: 'json', default: ['This', 'That', 'There'] },
  ]"
/>

### stripTags

Strip HTML tags from a string.

```javascript
import { stripTags } from "@tolki/str";

const result = stripTags("<p>Hello <strong>World</strong></p>");

// result is "Hello World"
```

<FnTry
  :fn="stripTags"
  :args="[
    { name: 'value', default: '<p>Hello <strong>World</strong></p>' },
  ]"
/>

### studly

Convert a value to studly caps case.

```javascript
import { studly } from "@tolki/str";

const result = studly("foo_bar");

// result is "FooBar"
```

<FnTry
  :fn="studly"
  :args="[
    { name: 'value', default: 'foo_bar' },
    { name: 'normalize', type: 'boolean', default: false },
  ]"
/>

### substr

Returns the portion of the string specified by the start and length parameters.

```javascript
import { substr } from "@tolki/str";

const result = substr("The Laravel Framework", 4, 7);

// result is "Laravel"
```

<FnTry
  :fn="substr"
  :args="[
    { name: 'string', default: 'The Laravel Framework' },
    { name: 'start', type: 'number', default: 4 },
    { name: 'length', type: 'number', default: 7 },
  ]"
/>

### substrCount

Returns the number of substring occurrences.

```javascript
import { substrCount } from "@tolki/str";

const result = substrCount(
  "If you like ice cream, you will like snow cones.",
  "like",
);

// result is 2
```

<FnTry
  :fn="substrCount"
  :args="[
    { name: 'haystack', default: 'If you like ice cream, you will like snow cones.' },
    { name: 'needle', default: 'like' },
  ]"
/>

### substrReplace

Replace text within a portion of a string.

```javascript
import { substrReplace } from "@tolki/str";

const result = substrReplace("1300", ":", 2);

// result is "13"

const result2 = substrReplace("1300", ":", 2, 0);

// result2 is also "13:00"
```

<FnTry
  :fn="substrReplace"
  :args="[
    { name: 'value', default: '1300' },
    { name: 'replace', default: ':' },
    { name: 'offset', type: 'number', default: 2 },
    { name: 'length', type: 'number', default: 0 },
  ]"
/>

### swap

Swap multiple keywords in a string with other keywords.

```javascript
import { swap } from "@tolki/str";

const result = swap(
  {
    Tacos: "Burritos",
    great: "fantastic",
  },
  "Tacos are great!",
);

// result is "Burritos are fantastic!"
```

<FnTry
  :fn="swap"
  :args="[
    { name: 'map', type: 'json', default: { Tacos: 'Burritos', great: 'fantastic' } },
    { name: 'subject', default: 'Tacos are great!' },
  ]"
/>

### take

Take the first or last {$limit} characters of a string.

```javascript
import { take } from "@tolki/str";

const result = take("Build something amazing!", 5);

// result is "Build"

const result2 = take("Build something amazing!", -5);

// result2 is "zing!"
```

<FnTry
  :fn="take"
  :args="[
    { name: 'value', default: 'Build something amazing!' },
    { name: 'limit', type: 'number', default: 5 },
  ]"
/>

### title

Convert the given string to proper case.

```javascript
import { title } from "@tolki/str";

const result = title("a nice title uses the correct case");

// result is "A Nice Title Uses The Correct Case"
```

<FnTry
  :fn="title"
  :args="[
    { name: 'value', default: 'a nice title uses the correct case' },
  ]"
/>

### toBase64

Convert the given string to Base64 encoding.

```javascript
import { toBase64 } from "@tolki/str";

const result = toBase64("Laravel");

// result is "TGFyYXZlbA=="
```

<FnTry
  :fn="toBase64"
  :args="[
    { name: 'value', default: 'Laravel' },
  ]"
/>

### trans

This function is purposely not implemented. Laravel's `Str::trans` resolves translation keys through the framework's localization system, which has no equivalent in this library. Use a JavaScript i18n library (such as [i18next](https://www.i18next.com/) or [FormatJS](https://formatjs.github.io/)) to translate strings instead.

### transliterate

Transliterate a string to its closest ASCII representation.

Uses the [`any-ascii`](https://www.npmjs.com/package/any-ascii) package.

```javascript
import { transliterate } from "@tolki/str";

const result = transliterate("Æneid");

// result is "Aeneid"

const result2 = transliterate("ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ");

// result2 is "test@laravel.com"
```

<FnTry
  :fn="transliterate"
  :args="[
    { name: 'value', default: 'Æneid' },
  ]"
/>

### trim

Remove all whitespace from both ends of a string.

```javascript
import { trim } from "@tolki/str";

const result = trim(" foo bar ");

// result is "foo bar"
```

<FnTry
  :fn="trim"
  :args="[
    { name: 'value', default: ' foo bar ' },
  ]"
/>

### ltrim

Remove all whitespace from the beginning of a string.

```javascript
import { ltrim } from "@tolki/str";

const result = ltrim("  foo bar  ");

// result is "foo bar   "
```

<FnTry
  :fn="ltrim"
  :args="[
    { name: 'value', default: '  foo bar  ' },
  ]"
/>

### rtrim

Remove all whitespace from the end of a string.

```javascript
import { rtrim } from "@tolki/str";

const result = rtrim("  foo bar  ");

// result is "  foo bar"
```

<FnTry
  :fn="rtrim"
  :args="[
    { name: 'value', default: '  foo bar  ' },
  ]"
/>

### ucfirst

Make a string's first character uppercase.

```javascript
import { ucfirst } from "@tolki/str";

const result = ucfirst("foo bar");

// result is "Foo bar"
```

<FnTry
  :fn="ucfirst"
  :args="[
    { name: 'value', default: 'foo bar' },
  ]"
/>

### ucsplit

Split a string into pieces by uppercase characters.

```javascript
import { ucsplit } from "@tolki/str";

const result = ucsplit("FooBar");

// result is ["Foo", "Bar"]
```

<FnTry
  :fn="ucsplit"
  :args="[
    { name: 'value', default: 'FooBar' },
  ]"
/>

### ucwords

Uppercase the first letter of each word in a string.

```javascript
import { ucwords } from "@tolki/str";

const result = ucwords("laravel framework");

// result is "Laravel Framework"
```

<FnTry
  :fn="ucwords"
  :args="[
    { name: 'value', default: 'laravel framework' },
  ]"
/>

### upper

Convert the given string to upper-case.

```javascript
import { upper } from "@tolki/str";

const result = upper("laravel");

// result is "LARAVEL"
```

<FnTry
  :fn="upper"
  :args="[
    { name: 'value', default: 'laravel' },
  ]"
/>

### ulid

Generate a ULID (Universally Unique Lexicographically Sortable Identifier).

Uses the [`ulid`](https://www.npmjs.com/package/ulid) package.

```javascript
import { ulid } from "@tolki/str";

const result = ulid();

// result is "01F8MECHZX2D7J8F8C8D4B8F8C"
```

During testing, you can use the `createUlidsUsing` function to provide a custom ULID generator for predictable results.

```javascript
import { createUlidsUsing, ulid } from "@tolki/str";

createUlidsUsing(() => "custom-ulid");

const result = ulid();

// result is "custom-ulid"
```

You can reset to the default ULID generator by calling the `createUlidsNormally` function.

```javascript
import { createUlidsUsing, createUlidsNormally, ulid } from "@tolki/str";

createUlidsUsing(() => "custom-ulid");

const result = ulid();

// result is "custom-ulid"

createUlidsNormally();

const result2 = ulid();

// result is a randomly generated ULID
```

### unwrap

Unwrap the string with the given strings.

```javascript
import { unwrap } from "@tolki/str";

const result = unwrap("-Laravel-", "-");

// result is "Laravel"

const result2 = unwrap('{framework: "Laravel"}', "{", "}");

// result2 is 'framework: "Laravel"'
```

<FnTry
  :fn="unwrap"
  :args="[
    { name: 'value', default: '{framework: Laravel}' },
    { name: 'before', default: '{' },
    { name: 'after', default: '}' },
  ]"
/>

### uuid

Generate a UUID (version 4).

Uses the [`uuid`](https://www.npmjs.com/package/uuid) package.

```javascript
import { uuid } from "@tolki/str";

const result = uuid();

// result is a randomly generated UUID (version 4)
```

During testing, you can use the `createUuidsUsing` function to provide a custom UUID generator for predictable results.

```javascript
import { createUuidsUsing, uuid } from "@tolki/str";

createUuidsUsing(() => "custom-uuid");

const result = uuid();

// result is "custom-uuid"
```

You can reset to the default UUID generator by calling the `createUuidsNormally` function.

```javascript
import { createUuidsUsing, createUuidsNormally, uuid } from "@tolki/str";

createUuidsUsing(() => "custom-uuid");

const result = uuid();

// result is "custom-uuid"

createUuidsNormally();

const result2 = uuid();

// result is a randomly generated UUID
```

### uuid7

Generate a UUID (version 7).

Uses the [`uuid`](https://www.npmjs.com/package/uuid) package.

```javascript
import { uuid7 } from "@tolki/str";

const result = uuid7();

// result is a randomly generated UUID (version 7)
```

The `uuid7()` function also uses the `createUuidsUsing` and `createUuidsNormally` functions for testing purposes, as described in the `uuid` function above.

### wordCount

Get the number of words a string contains.

```javascript
import { wordCount } from "@tolki/str";

const result = wordCount("Hello, world!");

// result is 2
```

<FnTry
  :fn="wordCount"
  :args="[
    { name: 'value', default: 'Hello, world!' },
  ]"
/>

### wordWrap

Wrap a string to a given number of characters.

```javascript
import { wordWrap } from "@tolki/str";

const result = wordWrap(
  "The quick brown fox jumped over the lazy dog.",
  20,
  "<br />\n",
);

// result is:
/*
The quick brown fox<br />
jumped over the lazy<br />
dog.
*/
```

<FnTry
  :fn="wordWrap"
  :args="[
    { name: 'value', default: 'The quick brown fox jumped over the lazy dog.' },
    { name: 'characters', type: 'number', default: 20 },
    { name: 'breakStr', default: '<br />' },
    { name: 'cutLongWords', type: 'boolean', default: false },
  ]"
/>

### words

Limit the number of words in a string.

```javascript
import { words } from "@tolki/str";

const result = words("Perfectly balanced, as all things should be.", 3, " >>>");

// result is "Perfectly balanced, as >>>"
```

<FnTry
  :fn="words"
  :args="[
    { name: 'value', default: 'Perfectly balanced, as all things should be.' },
    { name: 'words', type: 'number', default: 3 },
    { name: 'end', default: ' >>>' },
  ]"
/>

### wrap

Wrap the string with the given strings.

```javascript
import { wrap } from "@tolki/str";

const result = wrap("Laravel", '"');

// result is '"Laravel"'

const result2 = wrap("is", "This ", " Laravel!");

// result2 is 'This is Laravel!'
```

<FnTry
  :fn="wrap"
  :args="[
    { name: 'value', default: 'is' },
    { name: 'before', default: 'This ' },
    { name: 'after', default: ' Laravel!' },
  ]"
/>

### str

::: warning
Using the `str` or `of` functions is discouraged for frontend projects because it will import the entire `Stringable` class, all of its methods, and all 3rd party dependencies into your final bundle, which may significantly increase its size.

For frontend projects, it is recommended to use the individual string functions instead for better tree-shaking and smaller bundle sizes.

Also unlike the standalone functions on this page, `str`/`of` return a `Stringable` class instance rather than a plain value, so there's no live playground for them here — try the fluent methods it exposes (like `.append()` or `.snake()`) directly in your own code instead.
:::

Get a new Stringable object from the given string.

```javascript
import { str } from "@tolki/str";

const result = str("Laravel").append(" Otwell");

// result is a Stringable class instance representing "Laravel Otwell"
```

If no string is provided, a Stringable class instance with an empty string will be returned.

```javascript
import { str } from "@tolki/str";

const result = str().snake("FooBar");

// result is a Stringable class instance representing "foo_bar"
```

### of

The `of` function is an alias for the `str` function made for parity with Laravels' `Str::of` method. See the [str](#str) function documentation for details.

```javascript
import { of } from "@tolki/str";

const result = of("Laravel").upper();

// result is a Stringable class instance representing "LARAVEL"
```
