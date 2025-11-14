import { Locale } from 'date-fns';
import { bn } from 'date-fns/locale/bn';
import { de } from 'date-fns/locale/de';
import { el } from 'date-fns/locale/el';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { fr } from 'date-fns/locale/fr';
import { gu } from 'date-fns/locale/gu';
import { he } from 'date-fns/locale/he';
import { hi } from 'date-fns/locale/hi';
import { it } from 'date-fns/locale/it';
import { ja } from 'date-fns/locale/ja';
import { kn } from 'date-fns/locale/kn';
import { ko } from 'date-fns/locale/ko';
import { nl } from 'date-fns/locale/nl';
import { ta } from 'date-fns/locale/ta';
import { te } from 'date-fns/locale/te';
import { zhCN } from 'date-fns/locale/zh-CN';
import { zhTW } from 'date-fns/locale/zh-TW';

/**
 * Mapping from i18n locale codes (used in the app) to date-fns locale objects.
 * This ensures date formatting aligns with the application's language settings.
 *
 * Locale codes match the translation files in backend/chainlit/translations:
 * - bn.json, de-DE.json, el-GR.json, en-US.json, es.json, fr-FR.json, gu.json,
 * - he-IL.json, hi.json, it.json, ja.json, kn.json, ko.json, ml.json, mr.json,
 * - nl.json, ta.json, te.json, zh-CN.json, zh-TW.json
 */
const localeMap: Record<string, Locale> = {
  // Bengali (bn.json)
  bn: bn,

  // German (de-DE.json)
  'de-DE': de,
  de: de,

  // Greek (el-GR.json)
  'el-GR': el,
  el: el,

  // English (en-US.json)
  'en-US': enUS,
  en: enUS,

  // Spanish (es.json)
  es: es,

  // French (fr-FR.json)
  'fr-FR': fr,
  fr: fr,

  // Gujarati (gu.json)
  gu: gu,

  // Hebrew (he-IL.json)
  'he-IL': he,
  he: he,

  // Hindi (hi.json)
  hi: hi,

  // Italian (it.json)
  it: it,

  // Japanese (ja.json)
  ja: ja,

  // Korean (ko.json)
  ko: ko,

  // Kannada (kn.json)
  kn: kn,

  // Dutch (nl.json)
  nl: nl,

  // Tamil (ta.json)
  ta: ta,

  // Telugu (te.json)
  te: te,

  // Chinese Simplified (zh-CN.json)
  'zh-CN': zhCN,

  // Chinese Traditional (zh-TW.json)
  'zh-TW': zhTW

  // Note: ml (Malayalam) and mr (Marathi) are not available in date-fns
  // These will fall back to English (enUS)
};

export function getDateFnsLocale(i18nLocale: string | undefined): Locale {
  if (!i18nLocale) {
    return enUS;
  }

  // Try exact match first
  if (localeMap[i18nLocale]) {
    return localeMap[i18nLocale];
  }

  // Try to match base language (e.g., 'en' from 'en-GB')
  const baseLocale = i18nLocale.split('-')[0];
  if (localeMap[baseLocale]) {
    return localeMap[baseLocale];
  }

  // Fallback to English
  return enUS;
}
