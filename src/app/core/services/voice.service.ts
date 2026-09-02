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

/**
 * VoiceService
 *
 * Manages voice interaction state and the conversation log.
 * Delegates STT/TTS to SpeechService and intent processing to AgentService.
 *
 * This service is the single source of truth for:
 *   - Drawer open/closed
 *   - Conversation history
 *   - Current voice state (idle/listening/processing/speaking/error)
 *   - Selected region from voice commands
 *   - Interaction mode (voice / text / tap)
 */
@Injectable({ providedIn: 'root' })
export class VoiceService {

  // ── Drawer state ──────────────────────────────────────────────────────────
  readonly isDrawerOpen = signal<boolean>(false);

  // ── Conversation log ──────────────────────────────────────────────────────
  readonly conversations = signal<VoiceMessage[]>([]);

  // ── Voice pipeline state (sourced from SpeechService) ────────────────────
  readonly voiceState    = computed<VoiceState>(() => this.speech.state());
  readonly isListening   = computed<boolean>(() => this.speech.state() === 'listening');
  readonly isProcessing  = computed<boolean>(() => this.speech.state() === 'processing');
  readonly isSpeaking    = computed<boolean>(() => this.speech.state() === 'speaking');
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
    // Watch SpeechService for completed responses
    this._watchSpeechResponses();
  }

  // ── Drawer ────────────────────────────────────────────────────────────────

  toggleDrawer()              { this.isDrawerOpen.update(o => !o); }
  setDrawerOpen(open: boolean) { this.isDrawerOpen.set(open); }

  // ── Language ──────────────────────────────────────────────────────────────

  setLanguage(code: string) { this.lang.setLanguage(code); }

  // ── Voice interaction ─────────────────────────────────────────────────────

  startListening() {
    this.speech.startListening();
  }

  stopListening() {
    this.speech.stopListening();
  }

  cancelSpeech() {
    this.speech.cancelSpeech();
  }

  // ── Text / tap interaction ────────────────────────────────────────────────

  processText(text: string): void {
    if (!text.trim()) return;
    this.addMessage('user', text);
    const response = this.speech.processTextInput(text);
    setTimeout(() => {
      this.addMessage('dhwani', response.text, response);
      if (response.focusRegion) this.selectedRegionFromVoice.set(response.focusRegion);
    }, 400);
  }

  /** Tap-mode quick commands */
  processCommand(command: string): void {
    this.processText(command);
  }

  // ── Conversation ──────────────────────────────────────────────────────────

  addMessage(sender: 'user' | 'dhwani', text: string, agentResponse?: AgentResponse) {
    this.conversations.update(msgs => [...msgs, { sender, text, timestamp: new Date(), agentResponse }]);
    if (sender === 'user') {
      const region = this._detectRegion(text);
      if (region) this.selectedRegionFromVoice.set(region);
    }
  }

  clearConversation() {
    this.conversations.set([]);
    this.selectedRegionFromVoice.set(null);
  }

  // ── Suggestions ───────────────────────────────────────────────────────────

  getSuggestions(): string[] {
    return this.i18n.getSuggestions();
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /** Watch for responses emitted by SpeechService after STT completes. */
  private _watchSpeechResponses() {
    let lastResponse: AgentResponse | null = null;
    // Poll lastResponse signal for changes
    // In a real app this would use effect() — keeping simple to avoid circular dep
    setInterval(() => {
      const r = this.speech.lastResponse();
      if (r && r !== lastResponse) {
        lastResponse = r;
        // Ensure transcript is added as user message
        const t = this.speech.transcript();
        if (t) this.addMessage('user', t);
        this.addMessage('dhwani', r.text, r);
        if (r.focusRegion) this.selectedRegionFromVoice.set(r.focusRegion);
      }
    }, 250);
  }

  private _detectRegion(text: string): string | null {
    const lc = text.toLowerCase();
    const regions = ['coimbatore', 'madurai', 'trichy', 'mumbai', 'bangalore', 'chennai', 'delhi'];
    const found = regions.find(r => lc.includes(r));
    return found ? found.charAt(0).toUpperCase() + found.slice(1) : null;
  }
}
