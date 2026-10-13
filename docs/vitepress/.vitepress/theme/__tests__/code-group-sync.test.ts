import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    activateTab,
    groupSignature,
    installCodeGroupSync,
    restoreSelections,
    STORAGE_PREFIX,
    syncFrom,
} from "../code-group-sync";

const PKG_SIGNATURE = "@tolki/arr|@tolki/data|@tolki/obj";
const PM_SIGNATURE = "npm|pnpm|yarn";
let counter = 0;

/** Builds one group in the markup VitePress renders. */
function groupHtml(titles: string[]): string {
    const n = ++counter;
    const inputs = titles
        .map(
            (title, i) =>
                `<input type="radio" name="group-${n}" id="tab-${n}-${i}"${i === 0 ? " checked" : ""}>` +
                `<label data-title="${title}" for="tab-${n}-${i}">${title}</label>`,
        )
        .join("");
    const blocks = titles
        .map(
            (title, i) =>
                `<div class="language-js${i === 0 ? " active" : ""}"><pre>${title}</pre></div>`,
        )
        .join("");
    return `<div class="vp-code-group"><div class="tabs">${inputs}</div><div class="blocks">${blocks}</div></div>`;
}

const PKG_TITLES = ["@tolki/arr", "@tolki/obj", "@tolki/data"];

function groups(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>(".vp-code-group"));
}

function activeTitle(group: Element): string {
    const blocks = Array.from(group.querySelectorAll(".blocks > div"));
    const labels = Array.from(group.querySelectorAll("label"));
    const i = blocks.findIndex((b) => b.classList.contains("active"));
    return labels[i]?.dataset.title ?? "";
}

function inputFor(group: Element, title: string): HTMLInputElement {
    const label = Array.from(group.querySelectorAll("label")).find(
        (l) => l.dataset.title === title,
    );
    return document.getElementById(label?.htmlFor ?? "") as HTMLInputElement;
}

let clickHandler: EventListener | undefined;

/** jsdom makes isTrusted unforgeable, so call the captured listener with a trusted-looking event. */
function trustedClick(el: Element): void {
    clickHandler?.({ isTrusted: true, target: el } as unknown as Event);
}

beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = "";
    document.body.innerHTML =
        groupHtml(PKG_TITLES) +
        groupHtml(PKG_TITLES) +
        groupHtml(PKG_TITLES) +
        groupHtml(["npm", "pnpm", "yarn"]);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("groupSignature", () => {
    it("sorts the titles and joins them with a pipe", () => {
        expect(groupSignature(groups()[0] as Element)).toBe(PKG_SIGNATURE);
        expect(groupSignature(groups()[3] as Element)).toBe(PM_SIGNATURE);
    });
});

describe("activateTab", () => {
    it("moves checked and active to the titled tab and announces it", () => {
        const group = groups()[0] as Element;
        const listener = vi.fn();
        window.addEventListener("vitepress:codeGroupTabActivate", listener);

        expect(activateTab(group, "@tolki/obj")).toBe(true);

        window.removeEventListener("vitepress:codeGroupTabActivate", listener);
        expect(activeTitle(group)).toBe("@tolki/obj");
        expect(inputFor(group, "@tolki/obj").checked).toBe(true);
        expect(group.querySelectorAll(".blocks > .active")).toHaveLength(1);
        expect(listener).toHaveBeenCalledTimes(1);
        const event = listener.mock.calls[0]?.[0] as CustomEvent;
        expect(event.detail).toBe(group.querySelectorAll(".blocks > div")[1]);
    });

    it("returns false for an unknown or already active title", () => {
        const group = groups()[0] as Element;
        expect(activateTab(group, "@tolki/nope")).toBe(false);
        expect(activateTab(group, "@tolki/arr")).toBe(false);
    });

    it("does not call input.click()", () => {
        const spy = vi.spyOn(HTMLInputElement.prototype, "click");
        activateTab(groups()[0] as Element, "@tolki/data");
        expect(spy).not.toHaveBeenCalled();
    });
});

describe("installCodeGroupSync", () => {
    let uninstall: () => void;

    beforeEach(() => {
        const add = window.addEventListener.bind(window);
        vi.spyOn(window, "addEventListener").mockImplementation(
            (type: string, listener: EventListenerOrEventListenerObject) => {
                if (type === "click") {
                    clickHandler = listener as EventListener;
                }
                add(type, listener);
            },
        );
        uninstall = installCodeGroupSync(window);
    });

    afterEach(() => {
        uninstall();
    });

    it("syncs every group with the same signature", () => {
        const [first, second, third] = groups() as [Element, Element, Element];
        trustedClick(inputFor(first, "@tolki/obj"));

        expect(activeTitle(second)).toBe("@tolki/obj");
        expect(activeTitle(third)).toBe("@tolki/obj");
    });

    it("leaves groups with another signature alone", () => {
        const [first, , , managers] = groups() as [
            Element,
            Element,
            Element,
            Element,
        ];
        trustedClick(inputFor(first, "@tolki/obj"));

        expect(activeTitle(managers)).toBe("npm");

        trustedClick(inputFor(managers, "yarn"));
        expect(activeTitle(first)).toBe("@tolki/arr");
        expect(window.localStorage.getItem(STORAGE_PREFIX + PM_SIGNATURE)).toBe(
            "yarn",
        );
    });

    it("ignores untrusted clicks", () => {
        const [first, second] = groups() as [Element, Element];
        inputFor(first, "@tolki/obj").dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );

        expect(activeTitle(second)).toBe("@tolki/arr");
        expect(window.localStorage.length).toBe(0);
    });

    it("ignores trusted clicks outside a code group input", () => {
        trustedClick(document.body);
        trustedClick(document.querySelector("label") as Element);
        expect(window.localStorage.length).toBe(0);
    });

    it("stores the choice per signature", () => {
        trustedClick(inputFor(groups()[0] as Element, "@tolki/data"));

        expect(
            window.localStorage.getItem(STORAGE_PREFIX + PKG_SIGNATURE),
        ).toBe("@tolki/data");
        expect(window.localStorage.getItem(STORAGE_PREFIX + PM_SIGNATURE)).toBe(
            null,
        );
    });

    it("removes its listener when uninstalled", () => {
        const remove = vi.spyOn(window, "removeEventListener");
        uninstall();
        expect(remove).toHaveBeenCalledWith("click", clickHandler);
    });
});

describe("syncFrom", () => {
    it("keeps the clicked group in place", () => {
        const group = groups()[0] as HTMLElement;
        const tops = [300, 520];
        vi.spyOn(group, "getBoundingClientRect").mockImplementation(
            () => ({ top: tops.shift() ?? 520 }) as DOMRect,
        );
        const scrollBy = vi.fn();

        syncFrom(group, "@tolki/obj", document, {
            localStorage: window.localStorage,
            scrollBy,
        } as unknown as Window);

        expect(scrollBy).toHaveBeenCalledWith(0, 220);
    });

    it("does not scroll when the group did not move", () => {
        const scrollBy = vi.fn();
        syncFrom(groups()[0] as Element, "@tolki/obj", document, {
            localStorage: window.localStorage,
            scrollBy,
        } as unknown as Window);
        expect(scrollBy).not.toHaveBeenCalled();
    });

    it("syncs without storage when localStorage throws", () => {
        const win = {
            get localStorage(): Storage {
                throw new Error("blocked");
            },
            scrollBy: vi.fn(),
        } as unknown as Window;

        expect(() =>
            syncFrom(groups()[0] as Element, "@tolki/obj", document, win),
        ).not.toThrow();
        expect(activeTitle(groups()[2] as Element)).toBe("@tolki/obj");
    });

    it("syncs when setItem throws", () => {
        const win = {
            localStorage: {
                setItem(): void {
                    throw new Error("quota");
                },
            },
            scrollBy: vi.fn(),
        } as unknown as Window;

        expect(() =>
            syncFrom(groups()[0] as Element, "@tolki/obj", document, win),
        ).not.toThrow();
        expect(activeTitle(groups()[1] as Element)).toBe("@tolki/obj");
    });
});

describe("restoreSelections", () => {
    it("restores stored choices", () => {
        window.localStorage.setItem(
            STORAGE_PREFIX + PKG_SIGNATURE,
            "@tolki/obj",
        );
        window.localStorage.setItem(STORAGE_PREFIX + PM_SIGNATURE, "pnpm");

        restoreSelections(document, window);

        for (const group of groups().slice(0, 3)) {
            expect(activeTitle(group)).toBe("@tolki/obj");
        }
        expect(activeTitle(groups()[3] as Element)).toBe("pnpm");
    });

    it("leaves a group alone when it lacks the stored title", () => {
        window.localStorage.setItem(
            STORAGE_PREFIX + PKG_SIGNATURE,
            "@tolki/zzz",
        );
        restoreSelections(document, window);
        expect(activeTitle(groups()[0] as Element)).toBe("@tolki/arr");
    });

    it("restores nothing when localStorage throws", () => {
        const win = {
            get localStorage(): Storage {
                throw new Error("blocked");
            },
            location: { hash: "" },
            scrollBy: vi.fn(),
        } as unknown as Window;

        expect(() => restoreSelections(document, win)).not.toThrow();
        expect(activeTitle(groups()[0] as Element)).toBe("@tolki/arr");
    });

    it("re-anchors the hash target after restoring", () => {
        document.body.insertAdjacentHTML("beforeend", '<h2 id="g25">g25</h2>');
        const heading = document.getElementById("g25") as HTMLElement;
        const tops = [400, 640];
        vi.spyOn(heading, "getBoundingClientRect").mockImplementation(
            () => ({ top: tops.shift() ?? 640 }) as DOMRect,
        );
        window.localStorage.setItem(
            STORAGE_PREFIX + PKG_SIGNATURE,
            "@tolki/obj",
        );
        const scrollBy = vi.fn();

        restoreSelections(document, {
            localStorage: window.localStorage,
            location: { hash: "#g25" },
            scrollBy,
        } as unknown as Window);

        expect(scrollBy).toHaveBeenCalledWith(0, 240);
    });

    it("skips re-anchoring when the hash matches no element", () => {
        const scrollBy = vi.fn();
        restoreSelections(document, {
            localStorage: window.localStorage,
            location: { hash: "#missing" },
            scrollBy,
        } as unknown as Window);
        expect(scrollBy).not.toHaveBeenCalled();
    });
});
