import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VoiceResolverService, VoiceLanguage } from '../../core/services/voice-resolver.service';
import { TruthIncidentService } from '../../core/services/truth-incident.service';

@Component({
  selector: 'app-voice-resolver',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6 text-slate-100 animate-fadeIn">

      <!-- Header -->
      <div class="text-center max-w-2xl mx-auto space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
          <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
          Voice-First AI Payment Incident Resolver
        </div>
        <h1 class="text-2xl md:text-3xl font-black text-white">
          Speak Your Payment Issue in Any Indian Language
        </h1>
        <p class="text-xs md:text-sm text-slate-400">
          The AI listens, correlates Bank/Gateway/Webhook logs in real-time, explains the truth in your language, and offers safe repair.
        </p>
      </div>

      <!-- Language Selector Bar -->
      <div class="flex items-center justify-center gap-2 flex-wrap">
        <button *ngFor="let lang of voiceResolver.availableLanguages"
                (click)="voiceResolver.setLanguage(lang.code)"
                [ngClass]="voiceResolver.currentLanguage().code === lang.code 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-400' 
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800'"
                class="px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2">
          <span>{{ lang.flag }}</span>
          <span>{{ lang.name }}</span>
          <span class="text-[10px] opacity-75">({{ lang.nativeName }})</span>
        </button>
      </div>

      <!-- Voice Interaction Stage Center -->
      <div class="p-8 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center space-y-6">

        <!-- Visualizer Wave Ring -->
        <div class="relative flex items-center justify-center">
          <!-- Pulse wave 1 -->
          <div *ngIf="voiceResolver.isListening()"
               class="absolute w-44 h-44 rounded-full bg-indigo-500/20 animate-ping"></div>
          
          <!-- Pulse wave 2 -->
          <div *ngIf="voiceResolver.isListening() || voiceResolver.isSpeaking()"
               class="absolute w-36 h-36 rounded-full bg-purple-500/20 animate-pulse"></div>

          <!-- Mic / Speaker Circle Button -->
          <button (click)="toggleListening()"
                  class="w-24 h-24 rounded-full flex items-center justify-center relative z-10 transition-all transform active:scale-95 shadow-xl"
                  [ngClass]="{
                    'bg-gradient-to-tr from-rose-600 to-amber-500 ring-8 ring-rose-500/30 animate-pulse': voiceResolver.isListening(),
                    'bg-gradient-to-tr from-emerald-600 to-teal-500 ring-8 ring-emerald-500/30': voiceResolver.isSpeaking(),
                    'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 ring-8 ring-indigo-500/20': !voiceResolver.isListening() && !voiceResolver.isSpeaking()
                  }">
            
            <!-- Mic Icon -->
            <svg *ngIf="!voiceResolver.isSpeaking()" class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
            </svg>

            <!-- Speaker Icon -->
            <svg *ngIf="voiceResolver.isSpeaking()" class="w-10 h-10 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75Z"/>
            </svg>
          </button>
        </div>

        <!-- Voice Status Label -->
        <div class="space-y-1">
          <p class="text-sm font-bold text-white">
            <span *ngIf="voiceResolver.isListening()">🎙️ Listening in {{ voiceResolver.currentLanguage().name }}... Speak now</span>
            <span *ngIf="voiceResolver.isProcessing()">⚙️ Correlating multi-system logs with AI...</span>
            <span *ngIf="voiceResolver.isSpeaking()">🔊 AI Explaining Payment Truth...</span>
            <span *ngIf="!voiceResolver.isListening() && !voiceResolver.isProcessing() && !voiceResolver.isSpeaking()">
              Press microphone to start voice incident investigation
            </span>
          </p>
          <p class="text-xs text-slate-400">Language: <strong>{{ voiceResolver.currentLanguage().name }}</strong></p>
        </div>

        <!-- Live Transcript Display -->
        <div *ngIf="voiceResolver.transcript()"
             class="w-full max-w-xl p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-200 text-sm font-medium">
          <span class="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block mb-1">Live Transcript:</span>
          “{{ voiceResolver.transcript() }}”
        </div>

        <!-- Live Investigation Progress Stages -->
        <div *ngIf="truthService.isInvestigating() || truthService.activeInvestigationStage()"
             class="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs font-mono text-indigo-300 animate-pulse">
          {{ truthService.activeInvestigationStage() }}
        </div>

        <!-- Spoken Response Box -->
        <div *ngIf="voiceResolver.aiSpeechText()"
             class="w-full max-w-xl p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs md:text-sm text-left space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-wider text-emerald-400">AI Voice Explanation:</span>
            <button (click)="voiceResolver.speakText(voiceResolver.aiSpeechText(), voiceResolver.currentLanguage().code)"
                    class="text-[11px] font-bold text-emerald-400 hover:underline">
              🔊 Replay
            </button>
          </div>
          <p class="leading-relaxed">“{{ voiceResolver.aiSpeechText() }}”</p>
          
          <div *ngIf="truthService.selectedIncident() as inc" class="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
            <span class="text-xs text-slate-400">Incident: <strong>{{ inc.id }}</strong> (₹{{ inc.amount.toLocaleString('en-IN') }})</span>
            <button (click)="router.navigate(['/app/incidents', inc.id])"
                    class="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white">
              Open Incident Studio →
            </button>
          </div>
        </div>

      </div>

      <!-- Quick Voice Prompt Chips -->
      <div class="space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
          Or Click to Test Common Multi-Lingual Payment Claims
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          <!-- Tamil Sample -->
          <div (click)="testVoicePrompt('நான் ₹12,499 payment பண்ணிட்டேன், ஆனால் website இன்னும் payment pending என்று காட்டுது.', 'ta-IN')"
               class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:bg-slate-900/90 group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-indigo-400">🇮🇳 Tamil (தமிழ்)</span>
              <span class="text-[10px] text-slate-500">Scenario #1</span>
            </div>
            <p class="text-xs text-slate-200 mt-1">
              “நான் ₹12,499 payment பண்ணிட்டேன், ஆனால் website இன்னும் payment pending என்று காட்டுது.”
            </p>
          </div>

          <!-- Tanglish Sample -->
          <div (click)="testVoicePrompt('Naan ₹12,499 payment pannitten, aana website innum payment pending nu kaattuthu.', 'tanglish')"
               class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:bg-slate-900/90 group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-indigo-400">🇮🇳 Tanglish (Colloquial)</span>
              <span class="text-[10px] text-slate-500">Scenario #1</span>
            </div>
            <p class="text-xs text-slate-200 mt-1">
              “Naan ₹12,499 payment pannitten, aana website innum payment pending nu kaattuthu.”
            </p>
          </div>

          <!-- English Sample -->
          <div (click)="testVoicePrompt('I paid ₹12,499 successfully, but the order is still showing unpaid and pending.', 'en-IN')"
               class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:bg-slate-900/90 group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-indigo-400">🌐 English</span>
              <span class="text-[10px] text-slate-500">Scenario #1</span>
            </div>
            <p class="text-xs text-slate-200 mt-1">
              “I paid ₹12,499 successfully, but the order is still showing unpaid and pending.”
            </p>
          </div>

          <!-- Hindi Sample -->
          <div (click)="testVoicePrompt('मैंने ₹12,499 का भुगतान किया है, लेकिन वेबसाइट पर अभी भी पेंडिंग दिख रहा है।', 'hi-IN')"
               class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:bg-slate-900/90 group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-indigo-400">🇮🇳 Hindi (हिन्दी)</span>
              <span class="text-[10px] text-slate-500">Scenario #1</span>
            </div>
            <p class="text-xs text-slate-200 mt-1">
              “मैंने ₹12,499 का भुगतान किया है, लेकिन वेबसाइट पर अभी भी पेंडिंग दिख रहा है।”
            </p>
          </div>

        </div>
      </div>

    </div>
  `
})
export class VoiceResolverComponent {
  constructor(
    public voiceResolver: VoiceResolverService,
    public truthService: TruthIncidentService,
    public router: Router,
  ) {}

  toggleListening() {
    if (this.voiceResolver.isListening()) {
      this.voiceResolver.stopListening();
    } else if (this.voiceResolver.isSpeaking()) {
      this.voiceResolver.stopSpeaking();
    } else {
      this.voiceResolver.startListening();
    }
  }

  async testVoicePrompt(promptText: string, langCode: string) {
    this.voiceResolver.setLanguage(langCode);
    await this.voiceResolver.processVoiceQuery(promptText);
  }
}
