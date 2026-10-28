declare module "virtual:tolki-lang" {
    import type { LocaleLines } from "@tolki/lang";

    export const locales: readonly string[];
    export function load(locale: string): LocaleLines | Promise<LocaleLines>;
}
