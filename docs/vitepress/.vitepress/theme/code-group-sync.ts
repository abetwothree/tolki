export const STORAGE_PREFIX = "tolki:code-group:";

const GROUP_SELECTOR = ".vp-code-group";

/**
 * Lists a group's tab labels in document order.
 *
 * @param group - A `.vp-code-group` element.
 * @returns The label elements that carry a `data-title`.
 */
function tabLabels(group: Element): HTMLLabelElement[] {
    return Array.from(
        group.querySelectorAll<HTMLLabelElement>("label[data-title]"),
    );
}

/**
 * Identifies which groups belong together by their set of tab titles.
 *
 * @param group - A `.vp-code-group` element.
 * @returns The sorted titles joined by "|".
 */
export function groupSignature(group: Element): string {
    return tabLabels(group)
        .map((label) => label.dataset.title ?? "")
        .sort()
        .join("|");
}

/**
 * Shows the tab with this title without clicking it, so VitePress never scrolls to the group.
 *
 * @param group - A `.vp-code-group` element.
 * @param title - The `data-title` of the tab to show.
 * @returns True when the group changed, false when the title is missing or already shown.
 */
export function activateTab(group: Element, title: string): boolean {
    const labels = tabLabels(group);
    const index = labels.findIndex((label) => label.dataset.title === title);
    const blocks = group.querySelector(".blocks");
    const block = blocks?.children[index];
    const input = group.querySelector<HTMLInputElement>(
        `input[id="${labels[index]?.htmlFor ?? ""}"]`,
    );
    if (!blocks || !block || !input || block.classList.contains("active")) {
        return false;
    }

    for (const child of Array.from(blocks.children)) {
        child.classList.remove("active");
    }
    block.classList.add("active");
    input.checked = true;
    group.ownerDocument.defaultView?.dispatchEvent(
        new CustomEvent("vitepress:codeGroupTabActivate", { detail: block }),
    );

    return true;
}

/**
 * Reads the localStorage that may be missing or throw.
 *
 * @param win - The window to read from.
 * @returns The storage, or null when access is blocked.
 */
function getStorage(win: Window): Storage | null {
    try {
        return win.localStorage;
    } catch {
        return null;
    }
}

/**
 * Applies a title to every other group with the same signature and remembers it.
 *
 * @param group - The group the reader clicked.
 * @param title - The chosen tab title.
 * @param doc - The document holding the groups.
 * @param win - The window used to compensate scroll and reach storage.
 * @returns Nothing.
 */
export function syncFrom(
    group: Element,
    title: string,
    doc: Document,
    win: Window,
): void {
    const signature = groupSignature(group);
    const before = group.getBoundingClientRect().top;

    for (const other of Array.from(doc.querySelectorAll(GROUP_SELECTOR))) {
        if (other !== group && groupSignature(other) === signature) {
            activateTab(other, title);
        }
    }

    // Groups above the viewport change height, so shift the scroll to keep the click under the pointer.
    const after = group.getBoundingClientRect().top;
    if (after !== before) {
        win.scrollBy(0, after - before);
    }

    try {
        getStorage(win)?.setItem(STORAGE_PREFIX + signature, title);
    } catch {
        // Storage full or blocked: the tabs still synced for this page.
    }
}

/**
 * Applies remembered titles to the groups on the page, then re-anchors the hash target.
 *
 * @param doc - The document holding the groups.
 * @param win - The window used to reach storage, the hash and scrolling.
 * @returns Nothing.
 */
export function restoreSelections(doc: Document, win: Window): void {
    const storage = getStorage(win);
    if (!storage) {
        return;
    }

    const id = decodeURIComponent(win.location.hash.slice(1));
    const target = id ? doc.getElementById(id) : null;
    const before = target?.getBoundingClientRect().top ?? 0;

    for (const group of Array.from(doc.querySelectorAll(GROUP_SELECTOR))) {
        try {
            const stored = storage.getItem(
                STORAGE_PREFIX + groupSignature(group),
            );
            if (stored !== null) {
                activateTab(group, stored);
            }
        } catch {
            // A throwing getItem leaves this group on its default tab.
        }
    }

    if (target) {
        const after = target.getBoundingClientRect().top;
        if (after !== before) {
            win.scrollBy(0, after - before);
        }
    }
}

/**
 * Listens for real tab clicks and syncs matching groups across the page.
 *
 * @param win - The window to listen on.
 * @returns A function that removes the listener.
 */
export function installCodeGroupSync(win: Window): () => void {
    const onClick = (event: Event): void => {
        const input = event.target;
        if (
            !event.isTrusted ||
            !(input instanceof win.HTMLInputElement) ||
            !input.matches(".vp-code-group input")
        ) {
            return;
        }

        const group = input.closest(GROUP_SELECTOR);
        const label = group?.querySelector<HTMLLabelElement>(
            `label[for="${input.id}"]`,
        );
        const title = label?.dataset.title;
        if (group && title) {
            syncFrom(group, title, win.document, win);
        }
    };

    win.addEventListener("click", onClick);

    return () => {
        win.removeEventListener("click", onClick);
    };
}
