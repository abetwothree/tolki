// @vitest-environment node
import { createLang, langContext } from "@tolki/lang/svelte";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import Greeting from "./fixtures/Greeting.svelte";
import { syncLoad } from "./fixtures/lines";
import { SVELTE_SSR_HTML } from "./fixtures/ssr-html";

describe("langContext", () => {
    it("renders the locale's lines on the server", () => {
        const { body } = render(Greeting, {
            context: langContext(
                createLang({ locale: "es", fallback: "en", load: syncLoad }),
            ),
        });

        expect(body).toBe(SVELTE_SSR_HTML);
    });
});
