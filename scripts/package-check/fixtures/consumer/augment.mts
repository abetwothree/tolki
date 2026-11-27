import type { RegisteredLines } from "@tolki/lang";

declare module "@tolki/lang" {
    interface LangRegister {
        lines: { greeting: string };
    }
}

export const registered: RegisteredLines = { en: { greeting: "Hello" } };
// @ts-expect-error the register narrows every locale's lines to { greeting: string }
export const unregistered: RegisteredLines = { en: { other: "x" } };
