import en from "./en";
import de from "./de";

export type Translations = Record<keyof typeof en, string>;

const locales: Record<string, Translations> = { en, de };

export function getTranslations(locale: string | undefined): Translations {
  return locales[locale ?? "en"] ?? en;
}
