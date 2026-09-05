import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { VoiceService } from '../../core/services/voice.service';
import { AuthService } from '../../core/services/auth.service';
import { NewsIntelligenceFeedComponent } from '../news/news-intelligence-feed.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NewsIntelligenceFeedComponent],
  template: `
    <div class="space-y-7 font-sans pb-10">

      <!-- ── Top Header Row ─────────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Corporate Treasury & Security Dashboard</span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live & Protected
            </span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
            {{ greeting }}, {{ merchantName }}. Real-time settlement overview, corporate card controls & compliance feed.
          </p>
        </div>

        <!-- Quick AI Assistant Action -->
        <div class="flex items-center gap-3">
          <button (click)="openVoice()"
                  class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#4f46e5] to-[#4338ca] hover:from-[#4338ca] hover:to-[#3730a3] shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all active:scale-[0.98]">
            <svg class="w-4 h-4 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
            </svg>
            <span>Ask Dhwani AI</span>
          </button>
        </div>
      </div>

      <!-- ── Main 2-Column Structured Layout (Smart Bank / Stripe style) ── -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <!-- ── Left Column: Card, Quick Organizing Actions, Limits (5 cols) ── -->
        <div class="lg:col-span-5 space-y-5">

          <!-- Card Header & Universal Corporate Card -->
          <div class="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200/80">
            
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
                <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
                <span>Universal Corporate Card</span>
              </div>
              <span class="text-[11px] font-semibold text-slate-400">Default Card</span>
            </div>

            <!-- ── Beautiful Gradient Card ──────────────────────────────── -->
            <div class="relative w-full h-52 rounded-2xl p-5 text-white flex flex-col justify-between overflow-hidden shadow-[0_12px_30px_rgba(15,95,100,0.3)] transition-transform hover:scale-[1.01] duration-300"
                 style="background: linear-gradient(135deg, #1b6b7a 0%, #1e878e 45%, #62b19f 80%, #90cca8 100%);">
              
              <!-- Subtle Aurora Glow inside card -->
              <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
              
              <!-- Top Card Info -->
              <div class="flex items-start justify-between relative z-10">
                <div>
                  <p class="text-[11px] uppercase tracking-wider text-teal-100 font-semibold">Current Balance</p>
                  <p class="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                    ₹ 5,75,420.00
                  </p>
                </div>
                <!-- Mastercard / Payment Emblem -->
                <div class="flex items-center -space-x-2">
                  <div class="w-6 h-6 rounded-full bg-[#eb001b] opacity-90"></div>
                  <div class="w-6 h-6 rounded-full bg-[#f79e1b] opacity-90"></div>
                </div>
              </div>

              <!-- Bottom Card Info -->
              <div class="flex items-end justify-between relative z-10 pt-4">
                <div>
                  <p class="font-mono text-xs tracking-widest text-teal-50">
                    5282 3456 7890 1289
                  </p>
                  <p class="text-[10px] text-teal-200 mt-1 font-medium">Dhwani Access / Enterprise Platinum</p>
                </div>
                <div class="text-right">
                  <p class="text-[9px] uppercase text-teal-200 font-semibold">Expires</p>
                  <p class="font-mono text-xs text-teal-50 font-bold">09/28</p>
                </div>
              </div>
            </div>

            <!-- ── Quick Organizing Action Icons ──────────────────────────── -->
            <div class="grid grid-cols-3 gap-3 pt-6 pb-2">
              
              <!-- 1. Fund Card -->
              <button (click)="openAction('fund')"
                      class="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 transition-colors group text-center">
                <div class="w-12 h-12 rounded-full border border-slate-200/90 bg-white shadow-sm flex items-center justify-center text-slate-700 group-hover:border-[#4f46e5] group-hover:text-[#4f46e5] transition-all">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <span class="text-xs font-semibold text-slate-700 group-hover:text-slate-900">Fund card</span>
              </button>

              <!-- 2. Limits & Controls -->
              <button (click)="openAction('limits')"
                      class="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 transition-colors group text-center">
                <div class="w-12 h-12 rounded-full border border-slate-200/90 bg-white shadow-sm flex items-center justify-center text-slate-700 group-hover:border-[#4f46e5] group-hover:text-[#4f46e5] transition-all">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                </div>
                <span class="text-xs font-semibold text-slate-700 group-hover:text-slate-900">Limits</span>
              </button>

              <!-- 3. Transfer / Payout -->
              <button (click)="openAction('transfer')"
                      class="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 transition-colors group text-center">
                <div class="w-12 h-12 rounded-full border border-slate-200/90 bg-white shadow-sm flex items-center justify-center text-slate-700 group-hover:border-[#4f46e5] group-hover:text-[#4f46e5] transition-all">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <span class="text-xs font-semibold text-slate-700 group-hover:text-slate-900">Transfer</span>
              </button>

            </div>

            <!-- ── Card Info Metadata ──────────────────────────────────────── -->
            <div class="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-medium">Status</span>
                <span class="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-medium">Card number</span>
                <span class="font-mono text-slate-800 font-semibold">5282 3456 7890 1289</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-medium">Settlement Rate</span>
                <span class="text-slate-800 font-semibold">Instant (99.4% Success)</span>
              </div>
            </div>

          </div>

          <!-- ── Limits & Usage Gauge Card ──────────────────────────────── -->
          <div class="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200/80">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Limits & Quota</h3>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3.5">
                <!-- Donut Progress Ring -->
                <div class="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <svg class="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <path class="text-slate-100" stroke-width="4.5" stroke="currentColor" fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="text-[#f97316]" stroke-dasharray="45, 100" stroke-width="4.5" stroke-linecap="round" stroke="currentColor" fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  </svg>
                  <span class="absolute text-[10px] font-extrabold text-slate-800">45%</span>
                </div>
                <div>
                  <p class="text-xs font-semibold text-slate-400">Online settlement limit</p>
                  <p class="text-sm font-bold text-slate-900 mt-0.5">₹ 1,50,000 / ₹ 3,50,000</p>
                </div>
              </div>

              <a routerLink="/app/settings" class="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </a>
            </div>

            <!-- Currency Ticker mini-bar -->
            <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
              <div class="p-2 rounded-xl bg-slate-50">
                <p class="text-[10px] text-slate-400 font-semibold">USD / INR</p>
                <p class="text-xs font-bold text-slate-800 mt-0.5">₹ 83.42</p>
              </div>
              <div class="p-2 rounded-xl bg-slate-50">
                <p class="text-[10px] text-slate-400 font-semibold">EUR / INR</p>
                <p class="text-xs font-bold text-slate-800 mt-0.5">₹ 90.15</p>
              </div>
              <div class="p-2 rounded-xl bg-slate-50">
                <p class="text-[10px] text-slate-400 font-semibold">GBP / INR</p>
                <p class="text-xs font-bold text-slate-800 mt-0.5">₹ 105.80</p>
              </div>
            </div>

          </div>

        </div>

        <!-- ── Right Column: Recent Activity Feed (7 cols) ───────────────── -->
        <div class="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200/80">
          
          <!-- Header with Filter Controls -->
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 class="text-lg font-bold text-slate-900 tracking-tight">Recent activity</h2>
              <p class="text-xs text-slate-400 mt-0.5">Real-time ledger updates</p>
            </div>

            <div class="flex items-center gap-2">
              <button (click)="toggleCategoryFilter()" 
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                <span>Categories</span>
              </button>

              <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
                </svg>
                <span>Date</span>
              </button>
            </div>
          </div>

          <!-- Transactions List Structured by Date -->
          <div class="space-y-6">

            <!-- Group 1: May 22, 2026 -->
            <div>
              <p class="text-xs font-semibold text-slate-400 mb-3 px-1">May 22, 2026</p>
              <div class="space-y-2.5">
                
                <!-- 1. Starbucks -->
                <div class="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex items-center gap-3.5">
                    <div class="w-10 h-10 rounded-full bg-[#00704a] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                      ☕
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900 leading-tight">Starbucks</p>
                      <p class="text-xs text-slate-400 mt-0.5">Coffee and restaurants</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-extrabold text-slate-900">- ₹ 415.00</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">07:05 PM</p>
                  </div>
                </div>

                <!-- 2. Gloria Sparks -->
                <div class="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex items-center gap-3.5">
                    <div class="w-10 h-10 rounded-full bg-[#4096a5] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                      GS
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900 leading-tight">Gloria Sparks</p>
                      <p class="text-xs text-slate-400 mt-0.5">Receive Settlement</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-extrabold text-emerald-600">+ ₹ 11,200.00</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">06:33 PM</p>
                  </div>
                </div>

                <!-- 3. Amazon -->
                <div class="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex items-center gap-3.5">
                    <div class="w-10 h-10 rounded-full bg-[#131921] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                      a
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900 leading-tight">Amazon AWS</p>
                      <p class="text-xs text-slate-400 mt-0.5">Online Cloud Services</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-extrabold text-slate-900">- ₹ 9,198.00</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">01:10 PM</p>
                  </div>
                </div>

                <!-- 4. Walmart -->
                <div class="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex items-center gap-3.5">
                    <div class="w-10 h-10 rounded-full bg-[#0071dc] text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
                      ✱
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900 leading-tight">Walmart Retail</p>
                      <p class="text-xs text-slate-400 mt-0.5">Stores & Inventory</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-extrabold text-slate-900">- ₹ 1,120.00</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">08:27 AM</p>
                  </div>
                </div>

              </div>
            </div>

            <!-- Group 2: May 21, 2026 -->
            <div>
              <p class="text-xs font-semibold text-slate-400 mb-3 px-1">May 21, 2026</p>
              <div class="space-y-2.5">
                
                <!-- 5. Adam Miller -->
                <div class="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex items-center gap-3.5">
                    <div class="w-10 h-10 rounded-full bg-[#3a936a] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                      AM
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900 leading-tight">Adam Miller</p>
                      <p class="text-xs text-slate-400 mt-0.5">Sent Payout</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-extrabold text-slate-900">- ₹ 8,900.00</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">06:06 PM</p>
                  </div>
                </div>

                <!-- 6. Subway -->
                <div class="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex items-center gap-3.5">
                    <div class="w-10 h-10 rounded-full bg-[#008938] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                      🥪
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900 leading-tight">Subway</p>
                      <p class="text-xs text-slate-400 mt-0.5">Coffee and restaurants</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-extrabold text-slate-900">- ₹ 1,020.00</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">01:02 PM</p>
                  </div>
                </div>

                <!-- 7. Sam Gilbert -->
                <div class="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex items-center gap-3.5">
                    <div class="w-10 h-10 rounded-full bg-[#529b7c] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                      JB
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900 leading-tight">Sam Gilbert</p>
                      <p class="text-xs text-slate-400 mt-0.5">Receive Payment</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-extrabold text-emerald-600">+ ₹ 8,600.00</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">08:22 PM</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          <!-- Bottom Show More CTA -->
          <div class="mt-8 pt-4 border-t border-slate-100 text-center">
            <a routerLink="/app/payments"
               class="inline-block px-8 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all uppercase tracking-wider shadow-sm">
              Show More Transactions →
            </a>
          </div>

        </div>

      </div>

      <!-- ── Market & Regulatory News Intelligence Feed ─────────────────── -->
      <app-news-intelligence-feed></app-news-intelligence-feed>

    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class HomeComponent {
  constructor(
    public data: DataService,
    public voice: VoiceService,
    private auth: AuthService,
    private router: Router,
  ) {}

  get merchantName(): string {
    return this.auth.currentUser()?.name ?? 'Merchant';
  }

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  openVoice() {
    this.voice.setDrawerOpen(true);
  }

  openAction(type: 'fund' | 'limits' | 'transfer') {
    if (type === 'transfer') {
      this.router.navigate(['/app/authorizations']);
    } else if (type === 'limits') {
      this.router.navigate(['/app/settings']);
    } else {
      this.router.navigate(['/app/payments']);
    }
  }

  toggleCategoryFilter() {
    this.router.navigate(['/app/payments']);
  }
}
