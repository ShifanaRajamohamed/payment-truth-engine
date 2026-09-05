import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceService } from '../../core/services/voice.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 bg-white px-6 flex items-center justify-between z-10 select-none border-b border-slate-200/80 shadow-[0_1px_4px_rgba(15,31,69,0.03)]">

      <!-- Left / Center: Global Search & Voice Query -->
      <div class="flex-1 max-w-xl">
        <button id="topbar-voice-btn"
                type="button"
                (click)="openVoice()"
                class="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all text-left bg-[#f8fafc] border border-slate-200/80 hover:border-indigo-300 hover:bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] group">
          <svg class="w-4 h-4 text-indigo-500 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span class="text-slate-400 text-xs font-medium flex-1">Search transaction hash, recipient, routing rule or ask Dhwani…</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1 shadow-sm">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
            </svg>
            <span>Ask AI</span>
          </span>
        </button>
      </div>

      <!-- Right: System Status + Mode Toggle + Notification -->
      <div class="flex items-center gap-3 ml-4">
        
        <!-- Live Clearing Status Badge -->
        <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>RTGS Instant: <strong class="text-slate-900">99.98%</strong></span>
        </div>

        <!-- Notification Bell with Active Indicator -->
        <button type="button" (click)="openVoice()" title="3 Actionable alerts"
                class="relative p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 border border-slate-200/80 transition-colors">
          <span class="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
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
    private auth: AuthService,
  ) {}

  get userName(): string {
    return this.auth.currentUser()?.name || 'Aditya Sharma';
  }

  openVoice() { 
    this.voice.setDrawerOpen(true); 
  }
}
