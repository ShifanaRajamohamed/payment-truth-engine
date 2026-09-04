import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VoiceService } from '../../core/services/voice.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-full flex flex-col w-64 transition-all duration-200"
         style="background: linear-gradient(180deg, #0a0f1d 0%, #0d1a3a 100%);">

      <!-- Logo -->
      <div class="h-16 px-5 flex items-center gap-3" style="border-bottom: 1px solid rgba(255,255,255,0.07);">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center"
             style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); box-shadow: 0 4px 14px rgba(79,70,229,0.4);">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
          </svg>
        </div>
        <div>
          <span class="text-sm font-bold text-white tracking-tight">DeepAudit AI</span>
          <span class="text-[9px] block font-medium tracking-wider uppercase -mt-0.5" style="color:rgba(255,255,255,0.45);">Fraud Prevention & Auth</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <!-- Overview -->
        <a routerLink="/app/home" routerLinkActive="active-nav" [routerLinkActiveOptions]="{exact:true}"
           class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
          </svg>
          <span class="text-xs font-semibold">Overview</span>
        </a>

        <!-- Corporate Treasury section -->
        <p class="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest" style="color:rgba(255,255,255,0.3);">Treasury & Fraud Ops</p>

        <a routerLink="/app/payments" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>
          </svg>
          <span class="text-xs font-semibold">Payments Ledger</span>
        </a>

        <a routerLink="/app/risk" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
          </svg>
          <span class="text-xs font-semibold">Fraud Risk Engine</span>
        </a>

        <a routerLink="/app/authorizations" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"/>
          </svg>
          <span class="text-xs font-semibold">Dual Approvals</span>
        </a>

        <a routerLink="/app/beneficiaries" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"/>
          </svg>
          <span class="text-xs font-semibold">Beneficiaries</span>
        </a>

        <a routerLink="/app/audit" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
          </svg>
          <span class="text-xs font-semibold">Audit Ledger</span>
        </a>

        <!-- Regional Intelligence section -->
        <p class="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest" style="color:rgba(255,255,255,0.3);">Regional Intelligence</p>

        <a routerLink="/app/map" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446l6.002-3.001a1.125 1.125 0 0 0.595-.992V4.05a1.125 1.125 0 0 0-1.503-1.047l-6.002 2.001a1.125 1.125 0 01-.8 0L8.399 3.002a1.125 1.125 0 00-.8 0L1.503 6.003a1.125 1.125 0 00-.595.992v11.705a1.125 1.125 0 001.503 1.047l6.002-2.001a1.125 1.125 0 01.8 0l3.998 1.333z"/>
          </svg>
          <span class="text-xs font-semibold">Live Geography Map</span>
        </a>

        <a routerLink="/app/decision-lab" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.25 48.25 0 01-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>
          </svg>
          <span class="text-xs font-semibold">Decision Simulator</span>
        </a>
      </nav>

      <!-- Bottom area -->
      <div class="p-3 space-y-1" style="border-top: 1px solid rgba(255,255,255,0.07);">
        <!-- Ask Dhwani / DeepAudit Agent -->
        <button (click)="openVoiceAssistant()"
                class="nav-link w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
          </svg>
          <span class="text-xs font-semibold">AI Voice Officer</span>
          <span class="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold"
                style="background:rgba(99,102,241,0.25);color:#a5b4fc;">Gemini</span>
        </button>

        <!-- Settings -->
        <a routerLink="/app/settings" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.831a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.83c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94zM12 15a3 3 0 100-6 3 3 0 000 6z"/>
          </svg>
          <span class="text-xs font-semibold">Settings</span>
        </a>

        <!-- User card -->
        <div class="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl"
             style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
               style="background:linear-gradient(135deg,#3b82f6,#6366f1);">
            {{ userInitials }}
          </div>
          <div class="overflow-hidden flex-1 min-w-0">
            <span class="text-xs font-semibold text-white block truncate">{{ userName }}</span>
            <span class="text-[9px] block truncate text-slate-400">MAKER (Treasury)</span>
          </div>
          <button type="button" (click)="onLogout()" title="Sign out"
                  class="p-1 rounded-lg transition-colors flex-shrink-0 text-slate-400 hover:text-white">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nav-link { color: rgba(255,255,255,0.65); }
    .nav-link:hover { background: rgba(255,255,255,0.08); color: #fff !important; }
    :host ::ng-deep .active-nav { background: rgba(79,70,229,0.25) !important; color: #c7d2fe !important; border-left: 3px solid #6366f1; }
  `]
})
export class SidebarComponent {
  constructor(
    private voiceService: VoiceService,
    private authService: AuthService,
    private router: Router,
  ) {}

  get userName()    { return this.authService.currentUser()?.name  || 'Aditya Sharma'; }
  get userEmail()   { return this.authService.currentUser()?.email || 'aditya.sharma@deepaudit.ai'; }
  get userInitials(){ return this.userName.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase(); }

  onLogout() { this.authService.logout(); this.router.navigate(['/login']); }
  openVoiceAssistant() { this.voiceService.setDrawerOpen(true); }
}
