// @vitest-environment node
import { createLang } from "@tolki/lang/vue";
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";

import Greeting from "./fixtures/Greeting.vue";
import { syncLoad } from "./fixtures/lines";
import { VUE_SSR_HTML } from "./fixtures/ssr-html";

describe("createLang", () => {
    it("renders the locale's lines on the server", async () => {
        const app = createSSRApp(Greeting).use(
            createLang({ locale: "es", fallback: "en", load: syncLoad }),
        );

        expect(await renderToString(app)).toBe(VUE_SSR_HTML);
    });
});
