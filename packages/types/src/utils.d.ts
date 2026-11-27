/** Turns a locale into the spelling to use, such as `pt-BR` into `pt_BR`. */
type LocaleNormalizer = (locale: string) => string;

export type { LocaleNormalizer };
