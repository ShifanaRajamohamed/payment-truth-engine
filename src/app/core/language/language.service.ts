import { Injectable, computed, signal } from '@angular/core';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_MAP,
  SupportedLanguage,
  SpeechRecognitionConfig,
  TextToSpeechConfig,
} from './supported-languages';

/**
 * LanguageService
 *
 * Single source of truth for which language is active. Components and services
 * read from this; no language state lives anywhere else.
 *
 * Provider-independent: STT/TTS providers read sttConfig() / ttsConfig() to
 * know how to initialise. Swapping from Web Speech API to Sarvam or Bhashini
 * means changing the consumer, not this service.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  /** Ordered list exposed to the UI (dropdown) */
  readonly supportedLanguages: SupportedLanguage[] = SUPPORTED_LANGUAGES;

  /** Currently active language code (e.g. 'ta', 'hi', 'en') */
  readonly currentCode = signal<string>('en');

  /** Full language object for the active language */
  readonly currentLanguage = computed<SupportedLanguage>(
    () => LANGUAGE_MAP[this.currentCode()] ?? LANGUAGE_MAP['en']
  );

  /** STT configuration for the active language — plug into any STT provider */
  readonly sttConfig = computed<SpeechRecognitionConfig>(
    () => this.currentLanguage().stt
  );

  /** TTS configuration for the active language — plug into any TTS provider */
  readonly ttsConfig = computed<TextToSpeechConfig>(
    () => this.currentLanguage().tts
  );

  /** Effective fallback code for the active language */
  readonly fallbackCode = computed<string>(
    () => this.currentLanguage().fallback
  );

  setLanguage(code: string): void {
    if (LANGUAGE_MAP[code]) {
      this.currentCode.set(code);
    } else {
      console.warn(`[LanguageService] Unknown language code: "${code}". Falling back to English.`);
      this.currentCode.set('en');
    }
  }

  /** True if the active language has first-class translation support */
  hasTranslations(code?: string): boolean {
    const check = code ?? this.currentCode();
    // Languages with full translation files; others fall back to English
    return ['en', 'ta', 'hi'].includes(check);
  }

  /** The code to use for translation lookup (falls back when no translations) */
  readonly translationCode = computed<string>(() => {
    const code = this.currentCode();
    if (this.hasTranslations(code)) return code;
    const fallback = this.currentLanguage().fallback;
    return this.hasTranslations(fallback) ? fallback : 'en';
  });
}
