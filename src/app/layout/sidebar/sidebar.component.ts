import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { VoiceService } from '../../core/services/voice.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent],
  template: `
    <div class="h-full flex flex-col w-64 transition-all duration-200 select-none"
         style="background: linear-gradient(180deg, #090e1a 0%, #0d1629 100%); border-right: 1px solid rgba(255,255,255,0.06);">

      <!-- Unified Brand Header -->
      <div class="h-16 px-5 flex items-center justify-between" style="border-bottom: 1px solid rgba(255,255,255,0.07);">
        <app-logo [iconSizeClass]="'w-8 h-8'"
                  [titleClass]="'text-sm font-extrabold text-white'"
                  [textColor]="'#ffffff'"
                  [subtitleColor]="'rgba(255,255,255,0.45)'"
                  [badgeText]="'Enterprise'"
                  [subtitle]="'Access Portal'">
        </app-logo>
      </div>

      <!-- Navigation Hierarchy -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        
        <!-- 0. Overview -->
        <a routerLink="/app/home" routerLinkActive="active-nav" [routerLinkActiveOptions]="{exact:true}"
           class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
          </svg>
          <span class="text-xs font-semibold">Overview</span>
        </a>

        <!-- ── Section 1: Money & Security ───────────────────────────────── -->
        <div class="pt-3 pb-1 px-3 flex items-center gap-1.5">
          <svg class="w-3 h-3 text-indigo-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
          </svg>
          <span class="text-[9px] font-bold uppercase tracking-widest text-slate-400/80">Money & Security</span>
        </div>

        <!-- 1. Corporate Payments Ledger (formerly Payments Ledger) -->
        <a routerLink="/app/payments" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
          </svg>
          <span class="text-xs font-semibold">Corporate Payments Ledger</span>
        </a>

        <!-- 2. Fraud Protection (formerly Fraud Risk Engine) -->
        <a routerLink="/app/risk" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
          </svg>
          <span class="text-xs font-semibold">Fraud Protection</span>
        </a>

        <!-- 3. Pending Approvals (formerly Dual Approvals) with badge counter -->
        <a routerLink="/app/authorizations" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
          </svg>
          <span class="text-xs font-semibold">Pending Approvals</span>
          <span class="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/25 text-indigo-300 border border-indigo-500/30">
            3
          </span>
        </a>

        <!-- 4. Recipients (formerly Beneficiaries) -->
        <a routerLink="/app/beneficiaries" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.999-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/>
          </svg>
          <span class="text-xs font-semibold">Recipients</span>
        </a>

        <!-- 5. Activity Log (formerly Audit Ledger) -->
        <a routerLink="/app/audit" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          <span class="text-xs font-semibold">Activity Log</span>
        </a>

        <!-- ── Section 2: Regional Analytics ─────────────────────────────── -->
        <div class="pt-4 pb-1 px-3 flex items-center gap-1.5">
          <svg class="w-3 h-3 text-cyan-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253"/>
          </svg>
          <span class="text-[9px] font-bold uppercase tracking-widest text-slate-400/80">Regional Analytics</span>
        </div>

        <!-- 6. Global Activity (formerly Live Geography Map) -->
        <a routerLink="/app/map" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
          </svg>
          <span class="text-xs font-semibold">Global Activity</span>
          <span class="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </a>

        <!-- 7. Policy Sandbox (formerly Decision Simulator) -->
        <a routerLink="/app/decision-lab" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/>
          </svg>
          <span class="text-xs font-semibold">Policy Sandbox</span>
        </a>
      </nav>

      <!-- Bottom User & Assistant Area -->
      <div class="p-3 space-y-1" style="border-top: 1px solid rgba(255,255,255,0.07);">
        <!-- Ask Dhwani / Voice Officer -->
        <button (click)="openVoiceAssistant()"
                class="nav-link w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group">
          <div class="w-4 h-4 flex items-center justify-center text-purple-300">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
            </svg>
          </div>
          <span class="text-xs font-semibold">Talk to Assistant</span>
          <span class="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Gemini
          </span>
        </button>

        <!-- Settings -->
        <a routerLink="/app/settings" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.831a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.83c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94zM12 15a3 3 0 100-6 3 3 0 000 6z"/>
          </svg>
          <span class="text-xs font-semibold">Settings</span>
        </a>

        <!-- User profile badge -->
        <div class="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl bg-white/5 border border-white/10">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-gradient-to-tr from-[#4f46e5] to-[#7c3aed]">
            {{ userInitials }}
          </div>
          <div class="overflow-hidden flex-1 min-w-0">
            <span class="text-xs font-semibold text-white block truncate">{{ userName }}</span>
            <span class="text-[9px] block truncate text-slate-400">TREASURY / AUTHORIZER</span>
          </div>
          <button type="button" (click)="onLogout()" title="Sign out"
                  class="p-1 rounded-lg text-slate-400 hover:text-white transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nav-link { color: rgba(255,255,255,0.7); }
    .nav-link:hover { background: rgba(255,255,255,0.08); color: #fff !important; }
    :host ::ng-deep .active-nav { 
      background: linear-gradient(90deg, rgba(79,70,229,0.3) 0%, rgba(99,102,241,0.15) 100%) !important; 
      color: #e0e7ff !important; 
      border-left: 3px solid #6366f1;
      font-weight: 700;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
  `]
})
export class SidebarComponent {
  constructor(
    private voiceService: VoiceService,
    private authService: AuthService,
    private router: Router,
  ) { }

  get userName() { return this.authService.currentUser()?.name || 'Aditya Sharma'; }
  get userEmail() { return this.authService.currentUser()?.email || 'aditya.sharma@dhwani.app'; }
  get userInitials() { return this.userName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase(); }

  onLogout() { this.authService.logout(); this.router.navigate(['/login']); }
  openVoiceAssistant() { this.voiceService.setDrawerOpen(true); }
}
