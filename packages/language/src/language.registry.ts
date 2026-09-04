import { SupportedLanguage } from '@deepaudit/shared-types';
import { SUPPORTED_LANGUAGES, LANGUAGE_MAP } from './supported-languages';

export class LanguageRegistry {
  static getAll(): SupportedLanguage[] {
    return SUPPORTED_LANGUAGES;
  }

  static getByCode(code: string): SupportedLanguage {
    return LANGUAGE_MAP[code] || LANGUAGE_MAP['en'];
  }

  static isValidCode(code: string): boolean {
    return code in LANGUAGE_MAP;
  }

  static getLocale(code: string): string {
    return this.getByCode(code).locale;
  }

  static getFallback(code: string): string {
    return this.getByCode(code).fallback;
  }
}
