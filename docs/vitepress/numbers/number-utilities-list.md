# Tolki Number Utilities List

## Number Utilities List

These are the number utilities that can be used independently as single functions.

<div class="collection-method-list" markdown="1">

[abbreviate](#abbreviate) [clamp](#clamp) [currency](#currency) [defaultCurrency](#defaultcurrency) [defaultLocale](#defaultlocale) [fileSize](#filesize) [forHumans](#forhumans) [format](#format) [minutesToHuman](#minutestohuman) [ordinal](#ordinal) [pairs](#pairs) [parseFloat](#parsefloat) [parseInt](#parseint) [percentage](#percentage) [spell](#spell) [spellOrdinal](#spellordinal) [secondsToHuman](#secondstohuman) [trim](#trim) [useLocale](#uselocale) [withLocale](#withlocale) [useCurrency](#usecurrency) [withCurrency](#withcurrency)

</div>

## Number Utilities Details

### abbreviate

Convert the number to its human-readable equivalent.

```javascript
import { abbreviate } from "@tolki/num";

const result = abbreviate(1000);

// result is "1K"

const result2 = abbreviate(489939);

// result2 is "490K"

const result3 = abbreviate(1230000, 2);

// result3 is "1.23M"
```

### clamp

Clamp the given number between the given minimum and maximum.

```javascript
import { clamp } from "@tolki/num";

const result = clamp(105, 10, 100);

// result is 100

const result2 = clamp(5, 10, 100);

// result2 is 10

const result3 = clamp(10, 10, 100);

// result3 is 10

const result4 = clamp(20, 10, 100);

// result4 is 20
```

### currency

Convert the given number to its currency equivalent.

```javascript
import { currency } from "@tolki/num";

const result = currency(1000);

// result is "$1,000.00"

const result2 = currency(1000, "EUR");

// result2 is "€1,000.00"

const result3 = currency(1000, "EUR", "de");

// result3 is "1.000,00 €"

const result4 = currency(1000, "EUR", "de", 0);

// result4 is "1.000 €"
```

### defaultCurrency

Get the configured default currency.

```javascript
import { defaultCurrency } from "@tolki/num";

const result = defaultCurrency();

// result is "USD"
```

### defaultLocale

Get the configured default locale.

```javascript
import { defaultLocale } from "@tolki/num";

const result = defaultLocale();

// result is "en"
```

### fileSize

Convert the given number to its file size equivalent.

```javascript
import { fileSize } from "@tolki/num";

const result = fileSize(1024);

// result is "1 KB"

const result2 = fileSize(1024 * 1024);

// result2 is "1 MB"

const result3 = fileSize(1024, 2);

// result3 is "1.00 KB"
```

### forHumans

Convert the number to its human-readable equivalent.

```javascript
import { forHumans } from "@tolki/num";

const result = forHumans(1000);

// result is "1 thousand"

const result2 = forHumans(489939);

// result2 is "490K"

const result3 = forHumans(1230000, 2);

// result3 is "1.23 million"
```

### format

Format the given number according to the current locale.

```javascript
import { format } from "@tolki/num";

const result = format(100000);

// result is "100,000"

const result2 = format(100000, 2);

// result2 is "100,000.00"

const result3 = format(100000.123, null, 2);

// result3 is "100,000.12"

const result4 = format(100000, null, null, "de");

// result4 is "100.000"
```

### minutesToHuman

Convert a duration in minutes to a human-readable format.

```javascript
import { minutesToHuman } from "@tolki/num";

const result = minutesToHuman(61);

// result is "1 hour"

const result2 = minutesToHuman(61, false);

// result2 is "1 hour, 1 minute"
```

### ordinal

Convert the given number to ordinal form.

```javascript
import { ordinal } from "@tolki/num";

const result = ordinal(1);

// result is "1st"

const result2 = ordinal(2);

// result2 is "2nd"

const result3 = ordinal(21);

// result3 is "21st"

const result4 = ordinal(13);

// result4 is "13th"
```

### pairs

Split the given number into pairs of min/max values.

```javascript
import { pairs } from "@tolki/num";

const result = pairs(25, 10);

// result is [[0, 9], [10, 19], [20, 25]]

const result2 = pairs(25, 10, 0, 0);

// result2 is [[0, 10], [10, 20], [20, 25]]
```

### parseInt

Parse a string into an integer according to the specified locale.

```javascript
import { parseInt } from "@tolki/num";

const result = parseInt("10.123");

// result is 10

const result2 = parseInt("10,123", "fr");

// result2 is 10
```

### parseFloat

Parse a string into a float according to the specified locale.

```javascript
import { parseFloat } from "@tolki/num";

const result = parseFloat("10");

// result is 10.0

const result2 = parseFloat("10", "fr");

// result2 is 10.0
```

### percentage

Convert the given number to its percentage equivalent.

```javascript
import { percentage } from "@tolki/num";

const result = percentage(10);

// result is "10%"

const result2 = percentage(10, 2);

// result2 is "10.00%"

const result3 = percentage(10.123, 0, 2);

// result3 is "10.12%"

const result4 = percentage(10, 2, null, "de");

// result4 is "10,00%"
```

### spell

Spell out the given number in the given locale. Returns a `Promise<string>`.

Uses the [`to-words`](https://www.npmjs.com/package/to-words) package. Locales are loaded dynamically on demand, so only the locale you request is bundled (~3KB gzip per locale instead of ~54KB for all 94 locales).

Supports 94 locales via [`to-words`](https://www.npmjs.com/package/to-words). You can pass a full locale code (e.g., `"fr-FR"`, `"en-IN"`) or a bare language code (e.g., `"fr"`, `"en"`) which will resolve to a sensible default. Unsupported locales fall back to `"en-US"`.

```javascript
import { spell } from "@tolki/num";

const result = await spell(102);

// result is "One Hundred Two"

const result2 = await spell(88, "fr");

// result2 is "Quatre-Vingt-Huit"
```

If the `after` argument is provided and the number is less than or equal to `after`, the number will be returned as a formatted string instead of spelled out.

```javascript
import { spell } from "@tolki/num";

const result = await spell(5, null, 10);

// result is "5"
```

If the `until` argument is provided and the number is greater than or equal to `until`, the number will be returned as a formatted string instead of spelled out.

```javascript
import { spell } from "@tolki/num";

const result = await spell(15, null, null, 10);

// result is "15"
```

### spellOrdinal

Spell out the given number in the given locale in ordinal form. Returns a `Promise<string>`.

Uses [`to-words`](https://www.npmjs.com/package/to-words) v5 native ordinal support. See the [spell](#spell) function for details on locale handling.

Decimal values are floored before conversion.

```javascript
import { spellOrdinal } from "@tolki/num";

const result = await spellOrdinal(1);

// result is "First"

const result2 = await spellOrdinal(2);

// result2 is "Second"

const result3 = await spellOrdinal(21);

// result3 is "Twenty First"
```

### secondsToHuman

Convert a duration in seconds to a human-readable format.

```javascript
import { secondsToHuman } from "@tolki/num";

const result = secondsToHuman(3661);

// result is "1 hour, 1 minute, 1 second"
```

### trim

Remove any trailing zero digits after the decimal point of the given number.

```javascript
import { trim } from "@tolki/num";

const result = trim(12.0);

// result is 12

const result2 = trim(12.3);

// result is 12.3
```

### useLocale

Set the default locale. This should be used at the start of your application to set the desired locale globally.

```javascript
import { useLocale } from "@tolki/num";

useLocale("fr");

// The default locale is now set to French
```

### withLocale

Execute the given callback using the given locale.

```javascript
import { withLocale, format } from "@tolki/num";

withLocale("fr", () => {
  return format(1234.56);
}); // "1 234,56"
```

### useCurrency

Set the default currency. This should be used at the start of your application to set the desired currency globally.

```javascript
import { useCurrency } from "@tolki/num";

useCurrency("EUR");

// The default currency is now set to Euro
```

### withCurrency

Execute the given callback using the given currency.

```javascript
import { withCurrency, format } from "@tolki/num";

withCurrency("EUR", () => {
  return format(1234.56);
}); // "€1,234.56"
```
