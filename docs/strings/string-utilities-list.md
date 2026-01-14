# Tolki String Utilities List

## String Utilities List

These are the string utilities that can be used independently as single functions.

[after](#after), [afterLast](#afterlast), [apa](#apa), [ascii](#ascii), [before](#before), [beforeLast](#beforelast), [between](#between), [betweenFirst](#betweenfirst), [camel](#camel), [charAt](#charat), [chopEnd](#chopend), [chopStart](#chopstart), [contains](#contains), [containsAll](#containsall), [doesntContain](#doesntcontain), [deduplicate](#deduplicate), [doesntEndWith](#doesntendwith), [doesntStartWith](#doesntstartwith), [endsWith](#endswith), [excerpt](#excerpt), [finish](#finish), [fromBase64](#frombase64), [headline](#headline), [inlineMarkdown](#inlinemarkdown), [is](#is), [isAscii](#isascii), [isJson](#isjson), [isUrl](#isurl), [isUlid](#isulid), [isUuid](#isuuid), [kebab](#kebab), [lcfirst](#lcfirst), [length](#length), [limit](#limit), [lower](#lower), [markdown](#markdown), [mask](#mask), [match](#match), [matchAll](#matchall), [isMatch](#ismatch), [numbers](#numbers), [padBoth](#padboth), [padLeft](#padleft), [padRight](#padright), [pascal](#pascal), [password](#password), [position](#position), [random](#random), [remove](#remove), [repeat](#repeat), [replace](#replace), [replaceArray](#replacearray), [replaceEnd](#replaceend), [replaceFirst](#replacefirst), [replaceLast](#replacelast), [replaceMatches](#replacematches), [replaceStart](#replacestart), [reverse](#reverse), [snake](#snake), [snakeCacheSize](#snakecachesize), [squish](#squish), [start](#start), [startsWith](#startswith), [stripTags](#striptags), [studly](#studly), [studlyCacheSize](#studlycachesize), [swap](#swap), [take](#take), [toStringOr](#tostringor), [ucfirst](#ucfirst), [ucsplit](#ucsplit), [ucwords](#ucwords), [unwrap](#unwrap), [wordCount](#wordcount), [wordWrap](#wordwrap), [words](#words), [wrap](#wrap)

## String Utilities Details

### after

Return the remainder of a string after the last occurrence of a given value.

```javascript
import { after } from "@tolki/str";

const result = after("This is my name", "This is");

// result is " my name"
```

### afterLast

Return the remainder of a string after the last occurrence of a given value.

```javascript
import { afterLast } from "@tolki/str";

const result = afterLast("App\Http\Controllers\Controller", "\\");

// result is "Controller"
```

### apa

Convert the given string to [APA-style](https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case) title case.

```javascript
import { apa } from "@tolki/str";

const result = apa("Creating A Project");

// result is "Creating a Project"
```

### ascii

Transliterate a UTF-8 value to ASCII.

Uses the [`transliteration`](https://www.npmjs.com/package/transliteration) package.

```javascript
import { ascii } from "@tolki/str";

const result = ascii("û");

// result is "u"
```

### before

Get the portion of a string before the first occurrence of a given value.

```javascript
import { before } from "@tolki/str";

const result = before("This is my name", "my");

// result is "This is "
```

### beforeLast

Get the portion of a string before the last occurrence of a given value.

```javascript
import { beforeLast } from "@tolki/str";

const result = beforeLast("This is my name", "is");

// result is "This "
```

### between

Get the portion of a string between two given values.

```javascript
import { between } from "@tolki/str";

const result = between("This is my name", "This", "name");

// result is " is my "
```

### betweenFirst

Get the smallest possible portion of a string between two given values.

```javascript
import { betweenFirst } from "@tolki/str";

const result = betweenFirst("[a] bc [d]", "[", "]");

// result is "a"
```

### camel

Convert a value to camel case.

```javascript
import { camel } from "@tolki/str";

const result = camel("foo_bar");

// result is "fooBar"
```

### charAt

Get the character at the specified index.

```javascript
import { charAt } from "@tolki/str";

const result = charAt("This is my name.", 6);

// result is "s"
```

### chopStart

Remove the given string(s) if it exists at the start of the haystack.

```javascript
import { chopStart } from "@tolki/str";

const result = chopStart("https://laravel.com", "https://");

// result is "laravel.com"
```

You may also pass an array of string as the second argument:

```javascript
import { chopStart } from "@tolki/str";

const result = chopStart("http://laravel.com", ["https://", "http://"]);

// result is "laravel.com"
```

### chopEnd

Remove the given string(s) if it exists at the end of the haystack.

```javascript
import { chopEnd } from "@tolki/str";

const result = chopEnd("app/Models/Photograph.php", ".php");

// result is "app/Models/Photograph"
```

You may also pass an array of string as the second argument:

```javascript
import { chopEnd } from "@tolki/str";

const result = chopEnd("laravel.com/index.php", ["/index.html", "/index.php"]);

// result is "laravel.com"
```

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

### excerpt

Extracts an excerpt from text that matches the first instance of a phrase.

```javascript
import { excerpt } from "@tolki/str";

const result = excerpt("This is my name", "my", { radius: 3 });

// result is "... is my na ..."
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

### finish

Cap a string with a single instance of a given value.

```javascript
import { finish } from "@tolki/str";

const result = finish("this/string", "/");

// result is 'this/string/'

const result2 = finish("this/string/", "/");

// result2 is also 'this/string/'
```

### fromBase64

Decode the given Base64 encoded string.

```javascript
import { fromBase64 } from "@tolki/str";

const result = fromBase64("TGFyYXZlbA==");

// result is 'Laravel'
```

### headline

Convert the given string to proper case for each word.

```javascript
import { headline } from "@tolki/str";

const result = headline("steve_jobs");

// result is "Steve Jobs"

const result2 = headline("EmailNotificationSent");

// result2 is "Email Notification Sent"
```

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

### isAscii

Determine if a given string is 7 bit ASCII.

```javascript
import { isAscii } from "@tolki/str";

const result = isAscii("Taylor");

// result is true

const result2 = isAscii("û");

// result2 is false
```

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

### isUlid

Determine if a given value is a valid ULID.

```javascript
import { isUlid } from "@tolki/str";

const result = isUlid("01gd6r360bp37zj17nxb55yv40");

// result is true

const result2 = isUlid("tolkijs");

// result2 is false
```

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

### kebab

Convert a string to kebab case.

```javascript
import { kebab } from "@tolki/str";

const result = kebab("fooBar");

// result is "foo-bar"
```

### lcfirst

Make a string's first character lowercase.

```javascript
import { lcfirst } from "@tolki/str";

const result = lcfirst("Foo Bar");

// result is "foo Bar"
```

### length

Return the length of the given string.

```javascript
import { length } from "@tolki/str";

const result = length("Tolki JS");

// result is 8
```

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

const result = limit("The quick brown fox jumps over the lazy dog", 12, "...", true);

// result is "The quick..."
```

### lower

Convert the given string to lower-case.

```javascript
import { lower } from "@tolki/str";

const result = lower("LARAVEL");

// result is "laravel"
```

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

### mask

Masks a portion of a string with a repeated character.

```javascript
import { mask } from "@tolki/str";

const result = mask('taylor@example.com', '*', 3);

// result is "tay***************"
```

If needed, you provide a negative value for the third argument, which instructs the function to begin masking from the end of the string. A fourth argument may also provided to specify the number of masked characters.

```javascript
import { mask } from "@tolki/str";

const result = mask('taylor@example.com', '*', -15, 3);

// result is "tay***@example.com"
```

### match

Get the string matching the given pattern.

```javascript
import { match } from "@tolki/str";

const result = match('/bar/', 'foo bar');

// result is "bar"

const result2 = match('/foo (.*)/', 'foo bar');

// result2 is "bar"
```

### matchAll

Get the string(s) matching the given pattern.

```javascript
import { matchAll } from "@tolki/str";

const result = matchAll('/bar/', 'bar foo bar');

// result is ["bar", "bar"]
```

If no matches are found, an empty array will be returned.

### isMatch

Determine if a given string matches a given pattern.

```javascript
import { isMatch } from "@tolki/str";

const result = isMatch("/foo (.*)/", "foo bar");

// result is true

const result2 = isMatch("/foo (.*)/", "laravel");

// result2 is false
```

### numbers

### padBoth

### padLeft

### padRight

### pascal

### password

### position

### random

### remove

### repeat

### replace

### replaceArray

### replaceEnd

### replaceFirst

### replaceLast

### replaceMatches

### replaceStart

### reverse

### snake

### snakeCacheSize

### squish

### start

### startsWith

### stripTags

### studly

### studlyCacheSize

### swap

### take

### toStringOr

### ucfirst

### ucsplit

### ucwords

### unwrap

### wordCount

### wordWrap

### words

### wrap
