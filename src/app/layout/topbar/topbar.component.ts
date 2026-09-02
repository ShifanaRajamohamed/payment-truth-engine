import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceService } from '../../core/services/voice.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 bg-white px-6 flex items-center justify-between z-10"
            style="border-bottom:1px solid rgba(0,0,0,0.06);box-shadow:0 1px 4px rgba(15,31,69,0.04);">

      <!-- Centre: Ask Dhwani voice bar -->
      <div class="flex-1 max-w-lg mx-auto">
        <button id="topbar-voice-btn"
                type="button"
                (click)="openVoice()"
                class="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all text-left"
                style="background:#f8fafc;border:1px solid #e2e8f0;">
          <svg class="w-4 h-4 flex-shrink-0" style="color:#3b82f6;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
          </svg>
          <span class="text-slate-400 text-xs font-medium flex-1">Ask Dhwani anything…</span>
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style="background:#eff6ff;color:#3b82f6;border:1px solid #bfdbfe;">🎙 Voice</span>
        </button>
      </div>

      <!-- Right: mode toggle + notification -->
      <div class="flex items-center gap-3 ml-4">

        <!-- Simple / Standard mode toggle -->
        <button type="button" id="mode-toggle-btn"
                (click)="toggleSimpleMode()"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                [style]="prefs.simpleMode()
                  ? 'background:#eff6ff;border-color:#bfdbfe;color:#3b82f6;'
                  : 'background:#f8fafc;border-color:#e2e8f0;color:#64748b;'">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
          </svg>
          {{ prefs.simpleMode() ? 'Simple' : 'Standard' }}
        </button>

        <!-- Notification indicator -->
        <button type="button" class="relative p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
          <span class="absolute top-1.5 right-1.5 block h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-white"></span>
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
          </svg>
        </button>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  constructor(
    private voice: VoiceService,
    public  prefs: UserPreferencesService,
  ) {}

  openVoice()       { this.voice.setDrawerOpen(true); }
  toggleSimpleMode(){ this.prefs.toggleSimpleMode(); }
}
