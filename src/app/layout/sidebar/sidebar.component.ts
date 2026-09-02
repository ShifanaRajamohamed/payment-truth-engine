import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VoiceService } from '../../core/services/voice.service';
import { AuthService } from '../../core/services/auth.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';

interface NavItem {
  label: string;
  sublabel?: string;
  route: string;
  iconSvg: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-full flex flex-col w-64 transition-all duration-200"
         style="background: linear-gradient(180deg, #0f1629 0%, #0d1a3a 100%);">

      <!-- Logo -->
      <div class="h-16 px-5 flex items-center gap-3" style="border-bottom: 1px solid rgba(255,255,255,0.07);">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center"
             style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); box-shadow: 0 4px 14px rgba(59,130,246,0.4);">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
          </svg>
        </div>
        <div>
          <span class="text-sm font-bold text-white tracking-tight">Dhwani</span>
          <span class="text-[9px] block font-medium tracking-wider uppercase -mt-0.5" style="color:rgba(255,255,255,0.35);">by Razorpay</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        <!-- Home -->
        <a routerLink="/app/home" routerLinkActive="active-nav" [routerLinkActiveOptions]="{exact:true}"
           class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
          </svg>
          <span class="text-xs font-semibold">Home</span>
        </a>

        <!-- Business section -->
        <p class="px-3 pt-4 pb-1 text-[9px] font-bold uppercase tracking-widest" style="color:rgba(255,255,255,0.25);">Business</p>

        <a routerLink="/app/payments" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>
          </svg>
          <div class="flex-1 min-w-0">
            <span class="text-xs font-semibold block">My Payments</span>
          </div>
        </a>

        <a routerLink="/app/customers" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
          </svg>
          <span class="text-xs font-semibold">My Customers</span>
        </a>

        <!-- Geography section -->
        <p class="px-3 pt-4 pb-1 text-[9px] font-bold uppercase tracking-widest" style="color:rgba(255,255,255,0.25);">Where Am I Growing?</p>

        <a routerLink="/app/map" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446l6.002-3.001a1.125 1.125 0 00.595-.992V4.05a1.125 1.125 0 00-1.503-1.047l-6.002 2.001a1.125 1.125 0 01-.8 0L8.399 3.002a1.125 1.125 0 00-.8 0L1.503 6.003a1.125 1.125 0 00-.595.992v11.705a1.125 1.125 0 001.503 1.047l6.002-2.001a1.125 1.125 0 01.8 0l3.998 1.333z"/>
          </svg>
          <div class="flex-1 min-w-0">
            <span class="text-xs font-semibold block">Live Map</span>
          </div>
        </a>

        <a routerLink="/app/regions" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/>
          </svg>
          <span class="text-xs font-semibold">Region Insights</span>
        </a>

        <!-- Intelligence section -->
        <p class="px-3 pt-4 pb-1 text-[9px] font-bold uppercase tracking-widest" style="color:rgba(255,255,255,0.25);">Intelligence</p>

        <a routerLink="/app/opportunities" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
          </svg>
          <div class="flex-1 min-w-0">
            <span class="text-xs font-semibold block">What Should I Do?</span>
          </div>
        </a>

        <a routerLink="/app/decision-lab" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.25 48.25 0 01-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>
          </svg>
          <div class="flex-1 min-w-0">
            <span class="text-xs font-semibold block">Try Before You Decide</span>
          </div>
        </a>
      </nav>

      <!-- Bottom area -->
      <div class="p-3 space-y-1" style="border-top: 1px solid rgba(255,255,255,0.07);">
        <!-- Ask Dhwani -->
        <button (click)="openVoiceAssistant()"
                class="nav-link w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
          </svg>
          <span class="text-xs font-semibold">Ask Dhwani</span>
          <span class="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold"
                style="background:rgba(59,130,246,0.2);color:#60a5fa;">AI</span>
        </button>

        <!-- Settings -->
        <a routerLink="/app/settings" routerLinkActive="active-nav"
           class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.831a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.83c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94zM12 15a3 3 0 100-6 3 3 0 000 6z"/>
          </svg>
          <span class="text-xs font-semibold">Settings</span>
        </a>

        <!-- User card -->
        <div class="flex items-center gap-3 px-3 py-3 mt-1 rounded-xl"
             style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
               style="background:linear-gradient(135deg,#3b82f6,#6366f1);">
            {{ userInitials }}
          </div>
          <div class="overflow-hidden flex-1 min-w-0">
            <span class="text-xs font-semibold text-white block truncate">{{ userName }}</span>
            <span class="text-[10px] block truncate" style="color:rgba(255,255,255,0.35);">{{ userEmail }}</span>
          </div>
          <button type="button" (click)="onLogout()" title="Sign out"
                  class="p-1 rounded-lg transition-colors flex-shrink-0" style="color:rgba(255,255,255,0.35);">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nav-link { color: rgba(255,255,255,0.5); }
    .nav-link:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9) !important; }
    :host ::ng-deep .active-nav { background: rgba(59,130,246,0.18) !important; color: #93c5fd !important; border-left: 2px solid #3b82f6; }
  `]
})
export class SidebarComponent {
  constructor(
    private voiceService: VoiceService,
    private authService: AuthService,
    private router: Router,
  ) {}

  get userName()    { return this.authService.currentUser()?.name  || 'Merchant'; }
  get userEmail()   { return this.authService.currentUser()?.email || 'merchant@dhwani.app'; }
  get userInitials(){ return this.userName.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase(); }

  onLogout() { this.authService.logout(); this.router.navigate(['/login']); }
  openVoiceAssistant() { this.voiceService.setDrawerOpen(true); }
}
