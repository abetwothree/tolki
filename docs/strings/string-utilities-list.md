# Tolki String Utilities List

## Available String Utilities

These are the string utilities that can be used independently as single functions.

[after](#after), [afterLast](#afterlast), [apa](#apa), [ascii](#ascii), [before](#before), [beforeLast](#beforelast), [between](#between), [betweenFirst](#betweenfirst), [camel](#camel), [camelCacheSize](#camelcachesize), [charAt](#charat), [chopEnd](#chopend), [chopStart](#chopstart), [contains](#contains), [containsAll](#containsall), [createRandomStringsNormally](#createrandomstringsnormally), [createRandomStringsUsing](#createrandomstringsusing), [createRandomStringsUsingSequence](#createrandomstringsusingsequence), [deduplicate](#deduplicate), [doesntContain](#doesntcontain), [doesntEndWith](#doesntendwith), [doesntStartWith](#doesntstartwith), [endsWith](#endswith), [excerpt](#excerpt), [finish](#finish), [flushCache](#flushcache), [headline](#headline), [is](#is), [isAscii](#isascii), [isJson](#isjson), [isMatch](#ismatch), [isUrl](#isurl), [kebab](#kebab), [lcfirst](#lcfirst), [length](#length), [limit](#limit), [lower](#lower), [makePad](#makepad), [mask](#mask), [match](#match), [matchAll](#matchall), [numbers](#numbers), [padBoth](#padboth), [padLeft](#padleft), [padRight](#padright), [pascal](#pascal), [password](#password), [position](#position), [random](#random), [remove](#remove), [repeat](#repeat), [replace](#replace), [replaceArray](#replacearray), [replaceEnd](#replaceend), [replaceFirst](#replacefirst), [replaceLast](#replacelast), [replaceMatches](#replacematches), [replaceStart](#replacestart), [reverse](#reverse), [snake](#snake), [snakeCacheSize](#snakecachesize), [squish](#squish), [start](#start), [startsWith](#startswith), [stripTags](#striptags), [studly](#studly), [studlyCacheSize](#studlycachesize), [swap](#swap), [take](#take), [toStringOr](#tostringor), [ucfirst](#ucfirst), [ucsplit](#ucsplit), [ucwords](#ucwords), [unwrap](#unwrap), [wordCount](#wordcount), [wordWrap](#wordwrap), [words](#words), [wrap](#wrap)

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

Convert the given string to APA-style title case.

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

### camelCacheSize

### charAt

### chopEnd

### chopStart

### contains

### containsAll

### createRandomStringsNormally

### createRandomStringsUsing

### createRandomStringsUsingSequence

### deduplicate

### doesntContain

### doesntEndWith

### doesntStartWith

### endsWith

### excerpt

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
