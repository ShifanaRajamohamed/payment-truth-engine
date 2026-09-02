import { Injectable, signal, computed } from '@angular/core';
import { LanguageService } from '../../language/language.service';
import { SpeechProvider, SpeechErrorCode } from './speech-provider.interface';
import { WebSpeechProvider } from './providers/web-speech.provider';
import { AgentService } from '../../agent/agent.service';
import { AgentResponse } from '../../agent/agent.types';
import { Router } from '@angular/router';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

/**
 * SpeechService
 *
 * Orchestrates the complete voice pipeline:
 *   Mic → STT → AgentService → TTS → UI state
 *
 * The provider (WebSpeechProvider) is injected via a factory here.
 * To swap providers: change the factory — nothing else needs updating.
 */
@Injectable({ providedIn: 'root' })
export class SpeechService {

  private readonly provider: SpeechProvider = new WebSpeechProvider();

  readonly state         = signal<VoiceState>('idle');
  readonly transcript    = signal<string>('');     // live transcript during listening
  readonly errorCode     = signal<SpeechErrorCode | null>(null);
  readonly isSupported   = computed(() => this.provider.isSupported());
  readonly lastResponse  = signal<AgentResponse | null>(null);

  constructor(
    private lang: LanguageService,
    private agent: AgentService,
    private router: Router,
  ) {}

  // ── STT ───────────────────────────────────────────────────────────────────

  startListening(): void {
    if (!this.provider.isSupported()) {
      this.state.set('error');
      this.errorCode.set('NOT_SUPPORTED');
      return;
    }

    this.state.set('listening');
    this.transcript.set('');
    this.errorCode.set(null);

    const locale = this.lang.sttConfig().locale;

    this.provider.startListening(locale).subscribe({
      next: (partial) => {
        this.transcript.set(partial);
      },
      error: (code: SpeechErrorCode) => {
        this.errorCode.set(code);
        this.state.set('error');
      },
      complete: () => {
        const finalTranscript = this.transcript();
        if (finalTranscript.trim()) {
          this._handleTranscript(finalTranscript);
        } else {
          this.state.set('idle');
        }
      },
    });
  }

  stopListening(): void {
    this.provider.stopListening();
    // onend will fire → complete → _handleTranscript
  }

  // ── Process text input (same pipeline as voice) ───────────────────────────

  processTextInput(text: string): AgentResponse {
    return this._runAgent(text);
  }

  // ── TTS ───────────────────────────────────────────────────────────────────

  async speak(text: string): Promise<void> {
    const cfg = this.lang.ttsConfig();
    this.state.set('speaking');
    try {
      await this.provider.speak(text, cfg.locale, cfg.voiceGender, cfg.rate, cfg.pitch);
    } catch { /* TTS failure is non-fatal */ }
    finally { this.state.set('idle'); }
  }

  cancelSpeech(): void {
    this.provider.cancelSpeech();
    this.state.set('idle');
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _handleTranscript(transcript: string): void {
    this.state.set('processing');
    // Run agent synchronously — no async needed for rule-based intent detection
    setTimeout(() => {
      const response = this._runAgent(transcript);
      this.lastResponse.set(response);
      // Navigate if agent decided to
      if (response.navigationTarget) {
        this.router.navigate([response.navigationTarget]);
      }
      // Speak the response
      this.speak(response.text);
    }, 400); // small delay so "processing" state is visible
  }

  private _runAgent(text: string): AgentResponse {
    return this.agent.process(text);
  }
}
