// @vitest-environment node
import { createLang, LangProvider } from "@tolki/lang/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { syncLoad } from "./fixtures/lines";
import { Greeting } from "./fixtures/react-greeting";
import { REACT_SSR_HTML } from "./fixtures/ssr-html";

describe("LangProvider", () => {
    it("renders the locale's lines on the server", () => {
        const lang = createLang({
            locale: "es",
            fallback: "en",
            load: syncLoad,
        });

        expect(
            renderToString(
                createElement(LangProvider, { lang }, createElement(Greeting)),
            ),
        ).toBe(REACT_SSR_HTML);
    });
});
