import { Injectable, computed } from '@angular/core';
import { LanguageService } from './language.service';
import { TRANSLATION_REGISTRY, TranslationMap } from './translations/index';
import { en } from './translations/en';

/**
 * TranslationService
 *
 * Resolves intent keys → localised strings.
 * Components and VoiceService call t() — they never contain language strings.
 *
 * Resolution order:
 *   1. Active language translation map
 *   2. Active language's declared fallback (usually English)
 *   3. English base map (always present)
 *   4. The key itself (last resort — never silently returns undefined)
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  constructor(private lang: LanguageService) {}

  /** Translate a key in the currently active language. */
  t(key: string, params?: Record<string, string>): string {
    const code = this.lang.translationCode();
    const map: TranslationMap = TRANSLATION_REGISTRY[code] ?? en;
    let text = map[key] ?? en[key] ?? key;

    // Simple {{param}} interpolation for future parameterised strings
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
      });
    }
    return text;
  }

  /** Return quick-suggestion strings for the current language. */
  getSuggestions(): string[] {
    return [
      this.t('suggestion.coimbatore_revenue'),
      this.t('suggestion.routing_opportunities'),
      this.t('suggestion.upi_vs_card'),
      this.t('suggestion.how_is_business'),
      this.t('suggestion.best_region'),
      this.t('suggestion.try_discount'),
    ];
  }

  /**
   * Return random mock STT commands for the current language.
   * Used by VoiceService to simulate speech recognition output.
   */
  getSampleCommands(): string[] {
    return [
      this.t('sample.command.1'),
      this.t('sample.command.2'),
      this.t('sample.command.3'),
      this.t('sample.command.4'),
      this.t('sample.command.5'),
    ];
  }

  /**
   * Resolve a Dhwani response key for a detected intent.
   * Intent detection lives in VoiceService — this service only resolves strings.
   */
  getResponse(intentKey: string, params?: Record<string, string>): string {
    return this.t(intentKey, params);
  }
}
