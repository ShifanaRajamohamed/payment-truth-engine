import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceService } from '../../../core/services/voice.service';

@Component({
  selector: 'app-voice-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="toggleVoiceDrawer()"
      class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
    >
      <span class="relative flex h-2 w-2" *ngIf="voiceService.isListening()">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </span>
      
      <!-- Microphone SVG -->
      <svg *ngIf="!voiceService.isListening()" class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      </svg>
      
      <span>Ask Dhwani</span>
    </button>
  `,
  styles: []
})
export class VoiceControlComponent {
  constructor(public voiceService: VoiceService) {}

  toggleVoiceDrawer() {
    this.voiceService.toggleDrawer();
  }
}
