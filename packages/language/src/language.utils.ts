import { LanguageRegistry } from './language.registry';

export function normalizeLanguageCode(rawCode?: string): string {
  if (!rawCode) return 'en';
  const clean = rawCode.trim().toLowerCase().split('-')[0];
  return LanguageRegistry.isValidCode(clean) ? clean : 'en';
}

export function formatLanguageLabel(code: string): string {
  const lang = LanguageRegistry.getByCode(code);
  return `${lang.nativeName} (${lang.name})`;
}
