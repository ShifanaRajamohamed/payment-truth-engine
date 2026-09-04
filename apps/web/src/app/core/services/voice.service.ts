import { Injectable, signal, computed } from '@angular/core';
import { LanguageService } from '../language/language.service';
import { TranslationService } from '../language/translation.service';
import { SpeechService, VoiceState } from '../voice/speech/speech.service';
import { AgentResponse } from '../agent/agent.types';

export interface VoiceMessage {
  sender: 'user' | 'dhwani';
  text: string;
  timestamp: Date;
  agentResponse?: AgentResponse;
}

@Injectable({ providedIn: 'root' })
export class VoiceService {

  // ── Drawer state ──────────────────────────────────────────────────────────
  readonly isDrawerOpen = signal<boolean>(false);

  // ── Conversation log ──────────────────────────────────────────────────────
  readonly conversations = signal<VoiceMessage[]>([]);

  // ── Active Topic tracking for follow-up intelligence ──────────────────────
  readonly activeTopic   = signal<any | null>(null);

  // ── Voice pipeline state (strictly mapped from SpeechService) ────────────
  readonly voiceState    = computed<VoiceState>(() => this.speech.state());
  readonly isListening   = computed<boolean>(() => this.speech.state() === 'LISTENING');
  readonly isProcessing  = computed<boolean>(() => this.speech.state() === 'PROCESSING');
  readonly isSpeaking    = computed<boolean>(() => this.speech.state() === 'SPEAKING');
  readonly transcript    = computed<string>(() => this.speech.transcript());
  readonly errorCode     = computed(() => this.speech.errorCode());
  readonly isSpeechSupported = computed(() => this.speech.isSupported());

  /** Set when voice intent resolves to a geographic region */
  readonly selectedRegionFromVoice = signal<string | null>(null);

  /** Expose language state for template convenience */
  readonly currentLangCode   = computed(() => this.lang.currentCode());
  readonly currentLanguage   = computed(() => this.lang.currentLanguage());

  constructor(
    public  lang: LanguageService,
    private i18n: TranslationService,
    private speech: SpeechService,
  ) {
    // 1. Provide conversation history & active topic to SpeechService
    this.speech.registerContextProvider(() => ({
      history: this.getConversationHistory(10),
      activeTopic: this.activeTopic()
    }));

    // 2. Register callback for when a turn completes
    this.speech.registerTurnCallback((userPrompt: string, response: AgentResponse) => {
      this._recordTurn(userPrompt, response);
    });
  }

  // ── History Helper ────────────────────────────────────────────────────────

  getConversationHistory(limit = 10): Array<{ role: 'user' | 'assistant'; content: string }> {
    return this.conversations()
      .slice(-limit)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));
  }

  // ── Drawer ────────────────────────────────────────────────────────────────

  toggleDrawer()              { this.isDrawerOpen.update(o => !o); }
  setDrawerOpen(open: boolean) { this.isDrawerOpen.set(open); }

  // ── Language ──────────────────────────────────────────────────────────────

  setLanguage(code: string) { this.lang.setLanguage(code); }

  // ── Voice interaction ─────────────────────────────────────────────────────

  /**
   * Only called when user explicitly clicks "Tap to speak".
   */
  startListening() {
    this.speech.startListening();
  }

  stopListening() {
    this.speech.stopListening();
  }

  cancelSpeech() {
    this.speech.cancelSpeech();
  }

  // ── Text / Tap interaction ────────────────────────────────────────────────

  /**
   * User explicitly typed a query.
   */
  async processText(text: string): Promise<void> {
    if (!text || !text.trim()) return;
    await this.speech.processValidatedUserPrompt(text.trim());
  }

  /**
   * User explicitly clicked a quick question or sample command.
   */
  processCommand(command: string): void {
    if (!command || !command.trim()) return;
    this.processText(command.trim());
  }

  // ── Conversation Log ──────────────────────────────────────────────────────

  clearConversation() {
    this.conversations.set([]);
    this.selectedRegionFromVoice.set(null);
    this.activeTopic.set(null);
  }

  getSuggestions(): string[] {
    return this.i18n.getSuggestions();
  }

  // ── Private Record Turn ───────────────────────────────────────────────────

  private _recordTurn(userPrompt: string, response: AgentResponse) {
    this.conversations.update(msgs => [
      ...msgs,
      { sender: 'user', text: userPrompt, timestamp: new Date() },
      { sender: 'dhwani', text: response.text, timestamp: new Date(), agentResponse: response }
    ]);

    // Update active topic
    if (response.activeTopic) {
      this.activeTopic.set(response.activeTopic);
    }

    if (response.focusRegion) {
      this.selectedRegionFromVoice.set(response.focusRegion);
    } else {
      const region = this._detectRegion(userPrompt);
      if (region) {
        this.selectedRegionFromVoice.set(region);
      }
    }
  }

  private _detectRegion(text: string): string | null {
    const lc = text.toLowerCase();
    const regions = ['coimbatore', 'madurai', 'trichy', 'mumbai', 'bangalore', 'chennai', 'delhi', 'கோயம்புத்தூர்', 'சென்னை', 'மதுரை', 'திருச்சி'];
    const found = regions.find(r => lc.includes(r));
    return found ? found.charAt(0).toUpperCase() + found.slice(1) : null;
  }
}
