import { Observable } from 'rxjs';

/**
 * SpeechProvider interface — provider-independent.
 *
 * Swap out WebSpeechProvider for Sarvam, Bhashini, or any cloud STT/TTS
 * by creating a new class that implements this interface.
 * The rest of the application never changes.
 */
export interface SpeechProvider {
  /** True if this provider is supported in the current environment. */
  isSupported(): boolean;

  /**
   * Start listening. Emits transcript strings as speech is recognised.
   * Completes when recognition ends (silence / stop called).
   * Errors with a SpeechErrorCode string if something goes wrong.
   */
  startListening(locale: string): Observable<string>;

  /** Stop listening early. */
  stopListening(): void;

  /**
   * Speak text aloud.
   * Returns a Promise that resolves when speech finishes or rejects on error.
   */
  speak(text: string, locale: string, voiceGender: 'female' | 'male' | 'neutral', rate: number, pitch: number): Promise<void>;

  /** Cancel any ongoing speech. */
  cancelSpeech(): void;
}

export type SpeechErrorCode =
  | 'NOT_SUPPORTED'
  | 'MIC_DENIED'
  | 'NO_SPEECH'
  | 'NETWORK'
  | 'ABORTED'
  | 'UNKNOWN';
