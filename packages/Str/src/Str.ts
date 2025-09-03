import { Stringable } from "./Stringable.js";
import { transliterate } from "transliteration";
import anyAscii from "any-ascii";
import { ConvertCase, type ConvertCaseMode, CaseTypes } from "./ConvertCase.js";
import { toLower, isString, isEmpty } from "lodash-es";

export class Str {
    private static $camelCache = new Map<string, string>();

    static of(value: string): Stringable {
        return new Stringable(value);
    }

    /**
     * Return the remainder of a string after the last occurrence of a given value.
     *
     * @example
     *
     * Str.after('A house on a lake', 'house ') returns 'on a lake'
     */
    static after(subject: string, search: string | number): string {
        if (search === "") {
            return subject;
        }

        const needle = String(search);
        const index = subject.indexOf(needle);

        if (index === -1) {
            return subject;
        }

        return subject.slice(index + needle.length);
    }

    /**
     * Return the remainder of a string after the last occurrence of a given value.
     *
     * @example
     *
     * Str.afterLast('A house on a lake', 'a') returns ' lake'
     */
    static afterLast(subject: string, search: string | number): string {
        if (search === "") {
            return subject;
        }

        const position = subject.lastIndexOf(String(search));

        if (position === -1) {
            return subject;
        }

        return subject.slice(position + String(search).length);
    }

    /**
     * Transliterate a UTF-8 value to ASCII.
     *
     * @example
     *
     * Str.ascii('Héllo Wörld') returns 'Hello World'
     */
    static ascii(value: string): string {
        return transliterate(value);
    }

    /**
     * Transliterate a string to its closest ASCII representation.
     *
     * @example
     *
     * Str.transliterate('ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ') returns 'test@laravel.com'
     */
    static transliterate(value: string): string {
        return anyAscii(value);
    }

    /**
     * Get the portion of a string before the first occurrence of a given value.
     *
     * @example
     *
     * Str.before('hannah', 'nah') returns 'han'
     */
    static before(subject: string, search: string | number): string {
        if (search === "") {
            return subject;
        }

        const result = subject.indexOf(String(search));

        return result === -1 ? subject : subject.slice(0, result);
    }

    /**
     * Get the portion of a string before the last occurrence of a given value.
     *
     * @example
     *
     * Str.beforeLast('yvette', 'tte') returns 'yve'
     */
    static beforeLast(subject: string, search: string | number): string {
        if (search === "") {
            return subject;
        }

        const pos = subject.lastIndexOf(String(search));

        if (pos === -1) {
            return subject;
        }

        return subject.slice(0, pos);
    }

    /**
     * Get the portion of a string between two given values.
     *
     * @example
     *
     * Str.between('foofoobar', 'foo', 'bar') returns 'foo'
     */
    static between(
        subject: string,
        from: string | number,
        to: string | number,
    ): string {
        if (from === "" || to === "") {
            return subject;
        }

        return Str.beforeLast(Str.after(subject, from), to);
    }

    /**
     * Get the smallest possible portion of a string between two given values.
     *
     * @example
     *
     * Str.betweenFirst('foofoobar', 'foo', 'bar') returns 'foo'
     */
    static betweenFirst(
        subject: string,
        from: string | number,
        to: string | number,
    ): string {
        if (from === "" || to === "") {
            return subject;
        }

        return Str.before(Str.after(subject, from), to);
    }

    /**
     * Convert a value to camel case.
     *
     * @example
     *
     * Str.camel('foo_bar') returns 'fooBar'
     */
    static camel(value: string): string {
        if (this.$camelCache.has(value)) {
            return this.$camelCache.get(value)!;
        }

        // TODO
        // return this.$camelCache.set(value, lcfirst(this.studly(value)));
    }

    /**
     * Get the character at the specified index.
     *
     * @example
     *
     * Str.charAt('hello', 1) returns 'e'
     */
    static charAt(subject: string, index: number): string | false {
        const length = subject.length;

        if (index < 0 ? index < -length : index > length - 1) {
            return false;
        }

        // if index is a negative number, we need to adjust it
        if (index < 0) {
            index += length;
        }

        return subject.charAt(index);
    }

    /**
     * Remove the given string(s) if it exists at the start of the haystack.
     *
     * @example
     *
     * Str.chopStart('foobar', 'foo') returns 'bar'
     */
    static chopStart(subject: string, needle: string | string[]): string {
        for (const n of Array.isArray(needle) ? needle : [needle]) {
            if (subject.startsWith(n)) {
                return subject.slice(n.length);
            }
        }

        return subject;
    }

    /**
     * Remove the given string(s) if it exists at the end of the haystack.
     *
     * @example
     *
     * Str.chopEnd('foobar', 'bar') returns 'foo'
     */
    static chopEnd(subject: string, needle: string | string[]): string {
        for (const n of Array.isArray(needle) ? needle : [needle]) {
            if (subject.endsWith(n)) {
                return subject.slice(0, -n.length);
            }
        }

        return subject;
    }

    /**
     * Determine if a given string contains a given substring.
     *
     * @example
     *
     * Str.contains('Minion', 'ni') returns true
     * Str.contains('Minion', 'Ni', true) returns true
     * Str.contains('Minion', 'Ni', false) returns false
     */
    static contains(
        haystack: string,
        needles: string | Iterable<string>,
        ignoreCase = false,
    ): boolean {
        if (ignoreCase) {
            haystack = haystack.toLowerCase();
        }

        let needlesArray: string[];
        if (typeof needles === "string") {
            needlesArray = [needles];
        } else {
            needlesArray = Array.from(needles);
        }

        for (let needle of needlesArray) {
            if (ignoreCase) {
                needle = needle.toLowerCase();
            }

            if (needle !== "" && haystack.includes(needle)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if a given string contains all array values.
     *
     * @example
     *
     * Str.containsAll('Taylor Otwell', ['taylor', 'otwell'], false) returns true
     * Str.containsAll('Taylor Otwell', ['taylor', 'xxx'], true) returns false
     */
    static containsAll(
        haystack: string,
        needles: Iterable<string>,
        ignoreCase = false,
    ): boolean {
        for (const needle of needles) {
            if (!Str.contains(haystack, needle, ignoreCase)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Determine if a given string doesn't contain a given substring.
     *
     * @example
     *
     * Str.doesntContain('Minion', 'ni') returns false
     * Str.doesntContain('Minion', 'Ni', true) returns false
     * Str.doesntContain('Minion', 'Ni', false) returns true
     */
    static doesntContain(
        haystack: string,
        needles: string | Iterable<string>,
        ignoreCase = false,
    ): boolean {
        return !Str.contains(haystack, needles, ignoreCase);
    }

    /**
     * Convert the case of a string.
     *
     * @example
     *
     * Str.convertCase('hello', CaseTypes.upper) returns 'HELLO'
     */
    static convertCase(value: string, mode: ConvertCaseMode = CaseTypes.fold) {
        return new ConvertCase(value, mode).convert();
    }

    /**
     * Replace consecutive instances of a given character with a single character in the given string.
     *
     * @example
     *
     * Str.deduplicate('hello  world') returns 'hello world'
     * Str.deduplicate('hello---world', '-') returns 'hello-world'
     * Str.deduplicate('hello___world', '_') returns 'hello-world'
     * Str.deduplicate('hello  world', ' ') returns 'hello world'
     */
    static deduplicate(value: string, character: string | string[] = " ") {
        if (Array.isArray(character)) {
            character.forEach((char) => {
                value = value.replace(new RegExp(`${char}+`, "g"), char);
            });
            return value;
        }

        return value.replace(new RegExp(`${character}+`, "g"), character);
    }

    /**
     * Determine if a given string ends with a given substring.
     *
     * @example
     *
     * Str.endsWith("Jason", "on") returns true
     * Str.endsWith("Jason", "ON") returns false
     */
    static endsWith(
        haystack: string | number | null,
        needles: string | number | Iterable<string>,
    ): boolean {
        if (haystack === null) {
            return false;
        }

        haystack = String(haystack);

        if (!Array.isArray(needles)) {
            needles = [String(needles)];
        } else {
            needles = Array.from(needles);
        }

        for (const needle of needles) {
            if (needle !== "" && haystack.endsWith(needle)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if a given string doesn't end with a given substring.
     *
     * @example
     *
     * Str.doesntEndWith("Jason", "on") returns false
     * Str.doesntEndWith("Jason", "ON") returns true
     */
    static doesntEndWith(
        haystack: string | number | null,
        needles: string | number | Iterable<string>,
    ): boolean {
        return !Str.endsWith(haystack, needles);
    }

    /**
     * Extracts an excerpt from text that matches the first instance of a phrase.
     *
     * @example
     */
    static excerpt(
        text: string,
        phrase: string = "",
        options: Record<string, any> = {},
    ): string | null {
        const radius = options["radius"] ?? 100;
        const omission = options["omission"] ?? "...";

        const matches = text.match(/^(.*?)(\$\{phrase\})(.*)$/iu);

        if (!matches) {
            return null;
        }

        const start = matches[1]?.trim();

        // TODO

        // start = Str.of(start, max(start?.length - radius, 0), radius.length)->ltrim()->unless(
        //     (startWithRadius) => startWithRadius.exactly(start),
        //     (startWithRadius) => startWithRadius.prepend(omission),
        // );

        // const end = rtrim(matches[3]);

        // end = Str.of(mb_substr(end, 0, radius, 'UTF-8'))->rtrim()->unless(
        //     (endWithRadius) => endWithRadius.exactly(end),
        //     (endWithRadius) => endWithRadius.append(omission),
        // );

        // return start.append(matches[2], end).toString();
    }

    /**
     * Cap a string with a single instance of a given value.
     *
     * @example
     *
     * Str.finish('hello', '!') returns 'hello!'
     */
    static finish(value: string, cap: string): string {
        const quoted = cap.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        return value.replace(new RegExp(`(?:${quoted})+$`, "u"), "") + cap;
    }

    /**
     * Wrap the string with the given strings.
     *
     * @example
     *
     * Str.wrap('hello', '[', ']') returns '[hello]'
     */
    static wrap(
        value: string,
        before: string,
        after: string | null = null,
    ): string {
        return before + value + (after ?? before);
    }

    /**
     * Unwrap the string with the given strings.
     *
     * @example
     *
     * Str.unwrap('[hello]', '[', ']') returns 'hello'
     */
    static unwrap(
        value: string,
        before: string,
        after: string | null = null,
    ): string {
        // TODO
        // if (static::startsWith($value, $before)) {
        //     $value = static::substr($value, static::length($before));
        // }
        // if (static::endsWith($value, $after ??= $before)) {
        //     $value = static::substr($value, 0, -static::length($after));
        // }
        // return $value;
    }

    /**
     * Determine if a given string matches a given pattern.
     *
     * @example
     *
     * Str.is('hello', 'hello') returns true
     * Str.is('hello', 'Hello', true) returns true
     * Str.is('hello', 'world') returns false
     */
    static is(
        pattern: string | Iterable<string>,
        value: string | number,
        ignoreCase: boolean = false,
    ): boolean {
        value = String(value);

        let patterns: string[];
        if (typeof pattern === "string") {
            patterns = [pattern];
        } else {
            patterns = Array.from(pattern);
        }

        for (let pattern of patterns) {
            pattern = String(pattern);

            // If the given value is an exact match we can of course return true right
            // from the beginning. Otherwise, we will translate asterisks and do an
            // actual pattern match against the two strings to see if they match.
            if (pattern === value) {
                return true;
            }

            if (ignoreCase && toLower(pattern) === toLower(value)) {
                return true;
            }

            // Escape regex special characters in the pattern
            pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            // Asterisks are translated into zero-or-more regular expression wildcards
            // to make it convenient to check if the strings starts with the given
            // pattern such as "library/*", making any string check convenient.
            pattern = pattern.replace(/\\\*/g, ".*");

            const regexFlags = ignoreCase ? "iu" : "u";
            // Use JavaScript end-of-string anchor ($) instead of PHP's \z
            const regex = new RegExp(`^${pattern}$`, regexFlags);
            if (regex.test(value)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if a given string is 7 bit ASCII.
     *
     * @example
     *
     * Str.isAscii("Hello World") returns true
     * Str.isAscii("こんにちは") returns false
     * Str.isAscii("12345") returns true
     * Str.isAscii("!@#$%") returns true
     * Str.isAscii("Hello こんにちは") returns false
     */
    static isAscii(value: string): boolean {
        return /^[\x00-\x7F]*$/.test(value);
    }

    /**
     * Determine if a given value is valid JSON.
     *
     * @param  mixed  $value
     * @return bool
     */
    static isJson(value: unknown): boolean {
        if (!isString(value)) {
            return false;
        }

        try {
            JSON.parse(value as string);
        } catch {
            return false;
        }

        return true;
    }

    /**
     * Determine if a given value is a valid URL.
     *
     * @example
     * 
     * Str.isUrl('https://laravel.com'); returns true
     * Str.isUrl('http://localhost'); returns true
     * Str.isUrl('invalid url'); returns false
     */
    static isUrl(value: string | unknown, protocols: string[] = []): boolean {
        if (!isString(value)) {
            return false;
        }

        const protocolList = isEmpty(protocols)
            ? "aaa|aaas|about|acap|acct|acd|acr|adiumxtra|adt|afp|afs|aim|amss|android|appdata|apt|ark|attachment|aw|barion|beshare|bitcoin|bitcoincash|blob|bolo|browserext|calculator|callto|cap|cast|casts|chrome|chrome-extension|cid|coap|coap\+tcp|coap\+ws|coaps|coaps\+tcp|coaps\+ws|com-eventbrite-attendee|content|conti|crid|cvs|dab|data|dav|diaspora|dict|did|dis|dlna-playcontainer|dlna-playsingle|dns|dntp|dpp|drm|drop|dtn|dvb|ed2k|elsi|example|facetime|fax|feed|feedready|file|filesystem|finger|first-run-pen-experience|fish|fm|ftp|fuchsia-pkg|geo|gg|git|gizmoproject|go|gopher|graph|gtalk|h323|ham|hcap|hcp|http|https|hxxp|hxxps|hydrazone|iax|icap|icon|im|imap|info|iotdisco|ipn|ipp|ipps|irc|irc6|ircs|iris|iris\.beep|iris\.lwz|iris\.xpc|iris\.xpcs|isostore|itms|jabber|jar|jms|keyparc|lastfm|ldap|ldaps|leaptofrogans|lorawan|lvlt|magnet|mailserver|mailto|maps|market|message|mid|mms|modem|mongodb|moz|ms-access|ms-browser-extension|ms-calculator|ms-drive-to|ms-enrollment|ms-excel|ms-eyecontrolspeech|ms-gamebarservices|ms-gamingoverlay|ms-getoffice|ms-help|ms-infopath|ms-inputapp|ms-lockscreencomponent-config|ms-media-stream-id|ms-mixedrealitycapture|ms-mobileplans|ms-officeapp|ms-people|ms-project|ms-powerpoint|ms-publisher|ms-restoretabcompanion|ms-screenclip|ms-screensketch|ms-search|ms-search-repair|ms-secondary-screen-controller|ms-secondary-screen-setup|ms-settings|ms-settings-airplanemode|ms-settings-bluetooth|ms-settings-camera|ms-settings-cellular|ms-settings-cloudstorage|ms-settings-connectabledevices|ms-settings-displays-topology|ms-settings-emailandaccounts|ms-settings-language|ms-settings-location|ms-settings-lock|ms-settings-nfctransactions|ms-settings-notifications|ms-settings-power|ms-settings-privacy|ms-settings-proximity|ms-settings-screenrotation|ms-settings-wifi|ms-settings-workplace|ms-spd|ms-sttoverlay|ms-transit-to|ms-useractivityset|ms-virtualtouchpad|ms-visio|ms-walk-to|ms-whiteboard|ms-whiteboard-cmd|ms-word|msnim|msrp|msrps|mss|mtqp|mumble|mupdate|mvn|news|nfs|ni|nih|nntp|notes|ocf|oid|onenote|onenote-cmd|opaquelocktoken|openpgp4fpr|pack|palm|paparazzi|payto|pkcs11|platform|pop|pres|prospero|proxy|pwid|psyc|pttp|qb|query|redis|rediss|reload|res|resource|rmi|rsync|rtmfp|rtmp|rtsp|rtsps|rtspu|s3|secondlife|service|session|sftp|sgn|shttp|sieve|simpleledger|sip|sips|skype|smb|sms|smtp|snews|snmp|soap\.beep|soap\.beeps|soldat|spiffe|spotify|ssh|steam|stun|stuns|submit|svn|tag|teamspeak|tel|teliaeid|telnet|tftp|tg|things|thismessage|tip|tn3270|tool|ts3server|turn|turns|tv|udp|unreal|urn|ut2004|v-event|vemmi|ventrilo|videotex|vnc|view-source|wais|webcal|wpid|ws|wss|wtai|wyciwyg|xcon|xcon-userid|xfire|xmlrpc\.beep|xmlrpc\.beeps|xmpp|xri|ymsgr|z39\.50|z39\.50r|z39\.50s"
            : protocols.join("|");

        // Build a JS-compatible regex (simplified IPv6 part for maintainability).
        const escapedProtocols = protocolList
            .split("|")
            .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|");

        // Quick validation using URL parser for typical schemes (http/https etc.)
        try {
            const u = new URL(value);
            const scheme = u.protocol.replace(":", "");
            if (escapedProtocols.split("|").includes(scheme)) {
                return true;
            }
        } catch {
            /* ignore and fall back to regex */
        }

        /*
         * This pattern is derived from Symfony\Component\Validator\Constraints\UrlValidator (5.0.7).
         *
         * (c) Fabien Potencier <fabien@symfony.com> http://symfony.com
         */
        const regexSource = [
            "^(",
            escapedProtocols,
            "):\\/\\/",
            "(?:((?:[_.\\p{L}\\p{N}-]|%[0-9A-Fa-f]{2})+:)?((?:[_.\\p{L}\\p{N}-]|%[0-9A-Fa-f]{2})+)@)?",
            "(",
            "(?:[\\p{L}\\p{N}\\p{S}_\\.-]+(?:\\.?([\\p{L}\\p{N}]|xn--[\\p{L}\\p{N}-]+)+\\.?)",
            "|",
            "(?:\\d{1,3}\\.){3}\\d{1,3}",
            "|",
            "\\[(?:[0-9A-Fa-f:.]+)\\]",
            ")",
            "(?::[0-9]+)?",
            '(?:/(?:[\\p{L}\\p{N}\\-._~!$&"()*,;=:@]|%[0-9A-Fa-f]{2})*)*',
            '(?:\\?(?:[\\p{L}\\p{N}\\-._~!$&"()*,;=:@/?\\[\\]]|%[0-9A-Fa-f]{2})*)?',
            '(?:#(?:[\\p{L}\\p{N}\\-._~!$&"()*,;=:@/?]|%[0-9A-Fa-f]{2})*)?',
            "$",
        ].join("");

        try {
            return new RegExp(regexSource, "iu").test(value);
        } catch {
            return false;
        }
    }
}
