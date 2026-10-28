import { useLang } from "@tolki/lang/react";
import type { ReactElement } from "react";
import { createElement } from "react";

import type { LINES } from "./lines";

/**
 * Render the welcome line, an apples plural and the locale.
 *
 * @returns Three paragraphs in a div
 */
export function Greeting(): ReactElement {
    const { __, transChoice, locale } = useLang<typeof LINES>();

    return createElement(
        "div",
        null,
        createElement("p", null, __("Welcome")),
        createElement("p", null, transChoice("messages.apples", 2)),
        createElement("p", null, locale),
    );
}
