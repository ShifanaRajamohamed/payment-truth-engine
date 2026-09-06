import { Injectable, signal, computed } from '@angular/core';
import { LanguageService } from '../../language/language.service';
import { SpeechProvider, SpeechErrorCode } from './speech-provider.interface';
import { WebSpeechProvider } from './providers/web-speech.provider';
import { AgentService } from '../../agent/agent.service';
import { AgentResponse } from '../../agent/agent.types';
import { Router } from '@angular/router';

export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

@Injectable({ providedIn: 'root' })
export class SpeechService {

  private readonly provider: SpeechProvider = new WebSpeechProvider();

  // Strict State Machine: IDLE -> LISTENING -> PROCESSING -> SPEAKING -> IDLE
  readonly state        = signal<VoiceState>('IDLE');
  readonly transcript   = signal<string>('');
  readonly errorCode    = signal<SpeechErrorCode | null>(null);
  readonly isSupported  = computed(() => this.provider.isSupported());

  // Subscription handler
  private activeSubscription: any = null;
  private currentRequestId = 0;
  private userExplicitTrigger = false;

  // Context provider and turn callback
  private contextProvider?: () => { history: Array<{ role: 'user' | 'assistant'; content: string }>; activeTopic: any };
  private onTurnCompletedCallback?: (userPrompt: string, response: AgentResponse) => void;

  constructor(
    private lang: LanguageService,
    private agent: AgentService,
    private router: Router,
  ) {
    this._logState('IDLE');
  }

  registerTurnCallback(callback: (userPrompt: string, response: AgentResponse) => void) {
    this.onTurnCompletedCallback = callback;
  }

  registerContextProvider(provider: () => { history: Array<{ role: 'user' | 'assistant'; content: string }>; activeTopic: any }) {
    this.contextProvider = provider;
  }

  private _logState(nextState: VoiceState) {
    this.state.set(nextState);
    console.log('Voice State:', nextState);
  }

  // ── STT ───────────────────────────────────────────────────────────────────

  /**
   * Speech recognition starts after the user taps the mic.
   * Tapping while the assistant is speaking interrupts playback and starts listening.
   */
  startListening(): void {
    if (this.state() === 'PROCESSING') {
      console.warn('Microphone trigger ignored: AI is processing');
      return;
    }

    if (this.state() === 'SPEAKING') {
      this.provider.cancelSpeech();
      this.userExplicitTrigger = false;
      this._logState('IDLE');
    }

    if (!this.provider.isSupported()) {
      this.errorCode.set('NOT_SUPPORTED');
      this._logState('ERROR');
      return;
    }

    // Cancel any active audio playback before listening
    this.provider.cancelSpeech();

    if (this.activeSubscription) {
      this.activeSubscription.unsubscribe();
      this.activeSubscription = null;
    }

    this.userExplicitTrigger = true;
    this.transcript.set('');
    this.errorCode.set(null);
    this._logState('LISTENING');

    const locale = this.lang.sttConfig().locale;

    this.activeSubscription = this.provider.startListening(locale).subscribe({
      next: (partial) => {
        if (this.state() === 'LISTENING') {
          this.transcript.set(partial);
          console.log('Transcript:', partial);
        }
      },
      error: (code: SpeechErrorCode) => {
        this.userExplicitTrigger = false;
        this.errorCode.set(code);
        this._logState('ERROR');
      },
      complete: () => {
        const finalTranscript = this.transcript();
        if (this.userExplicitTrigger && this._isValidPrompt(finalTranscript)) {
          this._handleTranscript(finalTranscript.trim());
        } else {
          // No valid prompt spoken, cleanly return to IDLE
          this.userExplicitTrigger = false;
          this.provider.stopListening();
          this._logState('IDLE');
        }
      },
    });
  }

  stopListening(): void {
    if (this.state() === 'LISTENING') {
      this.provider.stopListening();
      const current = this.transcript();
      if (this.userExplicitTrigger && this._isValidPrompt(current)) {
        this._handleTranscript(current.trim());
      } else {
        this.userExplicitTrigger = false;
        this._logState('IDLE');
      }
    }
  }

  cancelSpeech(): void {
    this.provider.cancelSpeech();
    this.provider.stopListening();
    if (this.activeSubscription) {
      this.activeSubscription.unsubscribe();
      this.activeSubscription = null;
    }
    this.userExplicitTrigger = false;
    this._logState('IDLE');
  }

  // ── Unified Process Validated User Prompt ────────────────────────────────

  /**
   * Processes a validated prompt from either Speech Recognition, Text Input, or Quick Question tap.
   */
  async processValidatedUserPrompt(rawPrompt: string): Promise<AgentResponse | null> {
    if (!this._isValidPrompt(rawPrompt)) {
      console.warn('Rejected empty or invalid user prompt');
      return null;
    }

    const cleanPrompt = rawPrompt.trim();
    const requestId = ++this.currentRequestId;

    // 1. Ensure microphone is stopped
    this.provider.stopListening();
    if (this.activeSubscription) {
      this.activeSubscription.unsubscribe();
      this.activeSubscription = null;
    }

    // 2. Transition to PROCESSING
    this._logState('PROCESSING');
    console.log('Gemini request triggered:', cleanPrompt);

    // Retrieve conversation history & active topic context
    const ctx = this.contextProvider ? this.contextProvider() : { history: [], activeTopic: null };

    try {
      // 3. Call backend Gemini AI Orchestrator with memory & active topic
      const response = await this.agent.processWithAI(
        cleanPrompt,
        this.lang.currentCode(),
        ctx.history,
        ctx.activeTopic
      );

      if (requestId !== this.currentRequestId) {
        return null;
      }

      // Notify turn callback (adds conversation log in UI and updates activeTopic)
      if (this.onTurnCompletedCallback) {
        this.onTurnCompletedCallback(cleanPrompt, response);
      }

      // 4. Transition to SPEAKING
      this._logState('SPEAKING');
      console.log('TTS triggered:', response.text);

      // 5. Play Text-to-Speech while microphone remains disabled
      if (response.text && response.text.trim()) {
        const cfg = this.lang.ttsConfig();
        try {
          await this.provider.speak(response.text, cfg.locale, cfg.voiceGender, cfg.rate, cfg.pitch);
        } catch (ttsErr) {
          console.warn('TTS playback completed/interrupted:', ttsErr);
        }
      }

      // 6. Optional route navigation
      if (response.navigationTarget) {
        this.router.navigate([response.navigationTarget]);
      }

      // 7. Transition back to IDLE (DO NOT auto-restart microphone)
      this.userExplicitTrigger = false;
      this._logState('IDLE');
      return response;
    } catch (err) {
      console.error('Error processing prompt with AI:', err);
      this.userExplicitTrigger = false;
      this._logState('IDLE');
      return null;
    }
  }

  /**
   * Explicit test greeting for Settings page only
   */
  async speakGreeting(text: string): Promise<void> {
    if (!text || !text.trim()) return;
    this.provider.stopListening();
    this._logState('SPEAKING');
    console.log('TTS triggered:', text);
    const cfg = this.lang.ttsConfig();
    try {
      await this.provider.speak(text, cfg.locale, cfg.voiceGender, cfg.rate, cfg.pitch);
    } catch (e) {
      console.warn('TTS playback error:', e);
    }
    this._logState('IDLE');
  }

  // ── Validation Helper ────────────────────────────────────────────────────

  private _isValidPrompt(text: string | null | undefined): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    if (trimmed.length === 0) return false;
    if (trimmed === 'undefined' || trimmed === 'null') return false;
    return true;
  }

  private async _handleTranscript(transcript: string): Promise<void> {
    await this.processValidatedUserPrompt(transcript);
  }
}
