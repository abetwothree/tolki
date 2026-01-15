# Tolki String Utilities List

## String Utilities List

These are the string utilities that can be used independently as single functions.

<div class="collection-method-list" markdown="1">

[after](#after) [afterLast](#afterlast) [apa](#apa) [ascii](#ascii) [before](#before) [beforeLast](#beforelast) [between](#between) [betweenFirst](#betweenfirst) [camel](#camel) [charAt](#charat) [chopEnd](#chopend) [chopStart](#chopstart) [contains](#contains) [containsAll](#containsall) [doesntContain](#doesntcontain) [deduplicate](#deduplicate) [doesntEndWith](#doesntendwith) [doesntStartWith](#doesntstartwith) [endsWith](#endswith) [excerpt](#excerpt) [finish](#finish) [fromBase64](#frombase64) [headline](#headline) [inlineMarkdown](#inlinemarkdown) [is](#is) [isAscii](#isascii) [isJson](#isjson) [isUrl](#isurl) [isUlid](#isulid) [isUuid](#isuuid) [kebab](#kebab) [lcfirst](#lcfirst) [length](#length) [limit](#limit) [lower](#lower) [markdown](#markdown) [mask](#mask) [match](#match) [matchAll](#matchall) [isMatch](#ismatch) [numbers](#numbers) [padBoth](#padboth) [padLeft](#padleft) [padRight](#padright) [pascal](#pascal) [pluralPascal](#pluralpascal) [password](#password) [plural](#plural) [pluralStudly](#pluralstudly) [position](#position) [random](#random) [remove](#remove) [repeat](#repeat) [replace](#replace) [replaceArray](#replacearray) [replaceFirst](#replacefirst) [replaceLast](#replacelast) [replaceMatches](#replacematches) [replaceStart](#replacestart) [replaceEnd](#replaceend) [reverse](#reverse) [singular](#singular) [slug](#slug) [snake](#snake) [squish](#squish) [start](#start) [startsWith](#startswith) [stripTags](#striptags) [studly](#studly) [substr](#substr) [substrCount](#substrcount) [substrReplace](#substrreplace) [swap](#swap) [take](#take) [title](#title) [toBase64](#tobase64) [transliterate](#transliterate) [trim](#trim) [ltrim](#ltrim) [rtrim](#rtrim) [ucfirst](#ucfirst) [ucsplit](#ucsplit) [ucwords](#ucwords) [upper](#upper) [ulid](#ulid) [unwrap](#unwrap) [uuid](#uuid) [uuid7](#uuid7) [wordCount](#wordcount) [wordWrap](#wordwrap) [words](#words) [wrap](#wrap) [str](#str)

</div>

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

const result = limit(
  "The quick brown fox jumps over the lazy dog",
  12,
  "...",
  true,
);

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

const result = mask("taylor@example.com", "*", 3);

// result is "tay***************"
```

If needed, you provide a negative value for the third argument, which instructs the function to begin masking from the end of the string. A fourth argument may also provided to specify the number of masked characters.

```javascript
import { mask } from "@tolki/str";

const result = mask("taylor@example.com", "*", -15, 3);

// result is "tay***@example.com"
```

### match

Get the string matching the given pattern.

```javascript
import { match } from "@tolki/str";

const result = match("/bar/", "foo bar");

// result is "bar"

const result2 = match("/foo (.*)/", "foo bar");

// result2 is "bar"
```

### matchAll

Get the string(s) matching the given pattern.

```javascript
import { matchAll } from "@tolki/str";

const result = matchAll("/bar/", "bar foo bar");

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

### padBoth

Pad both sides of a string with another string to a certain length.

```javascript
import { padBoth } from "@tolki/str";

const result = padBoth("James", 10, "_");

// result is "__James__"

const result2 = padBoth("James", 10);

// result2 is "  James   "
```

### padLeft

Pad the left side of a string with another string to a certain length.

```javascript
import { padLeft } from "@tolki/str";

const result = padLeft("James", 10, "-=");

// result is "-=-=-James"

const result2 = padLeft("James", 10);

// result2 is "     James"
```

### padRight

Pad the right side of a string with another string to a certain length.

```javascript
import { padRight } from "@tolki/str";

const result = padRight("James", 10, "-");

// result is "James-----"

const result2 = padRight("James", 10);

// result2 is "James     "
```

### pascal

Convert a value to Pascal case.

```javascript
import { pascal } from "@tolki/str";

const result = pascal("hello world");

// result is "HelloWorld"
```

### pluralPascal

Pluralize the last word of an English, Pascal caps case string.

```javascript
import { pluralPascal } from "@tolki/str";

const result = pluralPascal("HelloWorld");

// result is "HelloWorlds"
```

### password

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

### pluralStudly

Pluralize the last word of an English, studly caps case string.

```javascript
import { pluralStudly } from "@tolki/str";

const result = pluralStudly("VerifiedHuman");

// result is "VerifiedHumans"

const result2 = pluralStudly("UserFeedback");

// result2 is "UserFeedback"
```

### position

Find the multi-byte safe position of the first occurrence of a given substring in a string.

```javascript
import { position } from "@tolki/str";

const result = position("Hello, World!", "Hello");

// result is 0

const result2 = position("Hello, World!", "W");

// result2 is 7
```

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

### repeat

Repeat the given string.

```javascript
import { repeat } from "@tolki/str";

const result = repeat("a", 5);

// result is "aaaaa"
```

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

### replaceMatches

Replace the patterns matching the given regular expression.

```javascript
import { replaceMatches } from "@tolki/str";

const result = replaceMatches(/[^A-Za-z0-9]+/g, "", "(+1) 501-555-1000");

// result is "15015551000"
```

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

### replaceStart

Replace the first occurrence of the given value if it appears at the start of the string.

```javascript
import { replaceStart } from "@tolki/str";

const result = replaceStart("Hello", "Laravel", "Hello World");

// result is "Laravel World"

const result2 = replaceStart("World", "Laravel", "Hello World");

// result2 is "Hello World"
```

### replaceEnd

Replace the last occurrence of a given value if it appears at the end of the string.

```javascript
import { replaceEnd } from "@tolki/str";

const result = replaceEnd("World", "Laravel", "Hello World");

// result is "Hello Laravel"

const result2 = replaceEnd("Hello", "Laravel", "Hello World");

// result2 is "Hello World"
```

### reverse

Reverse the given string.

```javascript
import { reverse } from "@tolki/str";

const result = reverse("Hello World");

// result is "dlroW olleH"
```

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

### slug

Generate a URL friendly "slug" from a given string.

```javascript
import { slug } from "@tolki/str";

const result = slug("Laravel 5 Framework", "-");

// result is "laravel-5-framework"
```

### snake

Convert a string to snake case.

```javascript
import { snake } from "@tolki/str";

const result = snake("fooBar");

// result is "foo_bar"

const result2 = snake("fooBar", "-");

// result2 is "foo-bar"
```

### squish

Remove all "extra" blank space from the given string.

```javascript
import { squish } from "@tolki/str";

const result = squish("    laravel    framework    ");

// result is "laravel framework"
```

### start

Begin a string with a single instance of a given value.

```javascript
import { start } from "@tolki/str";

const result = start("this/string", "/");

// result is "/this/string"

const result2 = start("/this/string", "/");

// result2 is also '/this/string'
```

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

### stripTags

Strip HTML tags from a string.

```javascript
import { stripTags } from "@tolki/str";

const result = stripTags("<p>Hello <strong>World</strong></p>");

// result is "Hello World"
```

### studly

Convert a value to studly caps case.

```javascript
import { studly } from "@tolki/str";

const result = studly("foo_bar");

// result is "FooBar"
```

### substr

Returns the portion of the string specified by the start and length parameters.

```javascript
import { substr } from "@tolki/str";

const result = substr("The Laravel Framework", 4, 7);

// result is "Laravel"
```

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

### substrReplace

Replace text within a portion of a string.

```javascript
import { substrReplace } from "@tolki/str";

const result = substrReplace("1300", ":", 2);

// result is "13"

const result2 = substrReplace("1300", ":", 2, 0);

// result2 is also "13:00"
```

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

// result is "Burritos are fantastic"
```

### take

Take the first or last {$limit} characters of a string.

```javascript
import { take } from "@tolki/str";

const result = take("Build something amazing!", 5);

// result is "Hello"

const result2 = take("Build something amazing!", -5);

// result2 is "zing!"
```

### title

Convert the given string to proper case.

```javascript
import { title } from "@tolki/str";

const result = title("a nice title uses the correct case");

// result is "A Nice Title Uses The Correct Case"
```

### toBase64

Convert the given string to Base64 encoding.

```javascript
import { toBase64 } from "@tolki/str";

const result = toBase64("Laravel");

// result is "TGFyYXZlbA=="
```

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

### trim

Remove all whitespace from both ends of a string.

```javascript
import { trim } from "@tolki/str";

const result = trim(" foo bar ");

// result is "foo bar"
```

### ltrim

Remove all whitespace from the beginning of a string.

```javascript
import { ltrim } from "@tolki/str";

const result = ltrim("  foo bar  ");

// result is "foo bar   "
```

### rtrim

Remove all whitespace from the end of a string.

```javascript
import { rtrim } from "@tolki/str";

const result = rtrim("  foo bar  ");

// result is "  foo bar"
```

### ucfirst

Make a string's first character uppercase.

```javascript
import { ucfirst } from "@tolki/str";

const result = ucfirst("foo bar");

// result is "Foo bar"
```

### ucsplit

Split a string into pieces by uppercase characters.

```javascript
import { ucsplit } from "@tolki/str";

const result = ucsplit("FooBar");

// result is ["Foo", "Bar"]
```

### ucwords

Uppercase the first letter of each word in a string.

```javascript
import { ucwords } from "@tolki/str";

const result = ucwords("laravel framework");

// result is "Laravel Framework"
```

### upper

Convert the given string to upper-case.

```javascript
import { upper } from "@tolki/str";

const result = upper("laravel");

// result is "LARAVEL"
```

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

You can reset to the default random string generator by calling the `createUlidsNormally` function.

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

### uuid

### uuid7

### wordCount

### wordWrap

### words

### wrap

### str
