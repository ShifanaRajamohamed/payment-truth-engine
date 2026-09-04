/**
 * Translation barrel — maps language code → translation map.
 *
 * To add a new language:
 *   1. Create translations/<code>.ts with keys from en.ts
 *   2. Import it here and add to TRANSLATION_REGISTRY
 *   3. Add the language to supported-languages.ts
 *   — no other files need to change.
 */
import { en } from './en';
import { ta } from './ta';
import { hi } from './hi';

export type TranslationMap = Record<string, string>;

export const TRANSLATION_REGISTRY: Record<string, TranslationMap> = {
  en,
  ta,
  hi,
  // Future languages — drop-in additions:
  // te, kn, ml, bn, mr, gu, pa, or, as, ur, mai, ks, sd, ne, sa, kok, mni, brx, doi, sat
};

export { en, ta, hi };
