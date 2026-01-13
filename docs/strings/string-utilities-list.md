# Tolki String Utilities List

## Available String Utilities

These are the string utilities that can be used independently as single functions.

[after](#after), [afterLast](#afterlast), [apa](#apa), [ascii](#ascii), [before](#before), [beforeLast](#beforelast), [between](#between), [betweenFirst](#betweenfirst), [camel](#camel), [charAt](#charat), [chopEnd](#chopend), [chopStart](#chopstart), [contains](#contains), [containsAll](#containsall), [doesntContain](#doesntcontain), [deduplicate](#deduplicate), [doesntEndWith](#doesntendwith), [doesntStartWith](#doesntstartwith), [endsWith](#endswith), [excerpt](#excerpt), [finish](#finish), [flushCache](#flushcache), [headline](#headline), [is](#is), [isAscii](#isascii), [isJson](#isjson), [isMatch](#ismatch), [isUrl](#isurl), [kebab](#kebab), [lcfirst](#lcfirst), [length](#length), [limit](#limit), [lower](#lower), [makePad](#makepad), [mask](#mask), [match](#match), [matchAll](#matchall), [numbers](#numbers), [padBoth](#padboth), [padLeft](#padleft), [padRight](#padright), [pascal](#pascal), [password](#password), [position](#position), [random](#random), [remove](#remove), [repeat](#repeat), [replace](#replace), [replaceArray](#replacearray), [replaceEnd](#replaceend), [replaceFirst](#replacefirst), [replaceLast](#replacelast), [replaceMatches](#replacematches), [replaceStart](#replacestart), [reverse](#reverse), [snake](#snake), [snakeCacheSize](#snakecachesize), [squish](#squish), [start](#start), [startsWith](#startswith), [stripTags](#striptags), [studly](#studly), [studlyCacheSize](#studlycachesize), [swap](#swap), [take](#take), [toStringOr](#tostringor), [ucfirst](#ucfirst), [ucsplit](#ucsplit), [ucwords](#ucwords), [unwrap](#unwrap), [wordCount](#wordcount), [wordWrap](#wordwrap), [words](#words), [wrap](#wrap)

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

const result2 = doesntEndWith("This is my name", ['name', 'foo']);

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


const result2 = doesntStartWith("This is my name", ['name', 'foo']);

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


const result2 = endsWith("This is my name", ['this', 'foo']);

// result2 is false
```

### excerpt

Extracts an excerpt from text that matches the first instance of a phrase.

```javascript
import { excerpt } from "@tolki/str";

const result = excerpt("This is my name", "my", {radius: 3});

// result is "... is my na ..."
```

The radius option, which defaults to 100, allows you to define the number of characters that should appear on each side of the truncated string.

In addition, you may use the omission option to define the string that will be prepended and appended to the truncated string:

```javascript
import { excerpt } from "@tolki/str";

const result = excerpt("This is my name", "my", {radius: 3, omission: "(...)"});

// result is "(...) is my na"
```

### finish

### flushCache

### headline

### is

### isAscii

### isJson

### isMatch

### isUrl

### kebab

### lcfirst

### length

### limit

### lower

### makePad

### mask

### match

### matchAll

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
