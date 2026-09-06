import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TruthIncidentService } from '../../core/services/truth-incident.service';
import { VoiceResolverService } from '../../core/services/voice-resolver.service';
import { PaymentIncident, ScenarioType } from '@deepaudit/shared-types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 animate-fadeIn">

      <!-- Hero Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl relative overflow-hidden"
           style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        <div class="space-y-1 relative z-10">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              AI Payment Incident Resolver
            </span>
            <span class="text-xs text-slate-400">Autonomous Multi-System Correlation</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight">
            “When money is involved, everyone should see the same truth.”
          </h1>
          <p class="text-xs md:text-sm text-slate-300 max-w-2xl">
            Correlating Bank authorizations, Gateway captures, Webhook telemetry, and Merchant ledgers to establish verifiable ground truth.
          </p>
        </div>

        <div class="flex items-center gap-3 relative z-10 flex-shrink-0">
          <button (click)="router.navigate(['/app/voice-resolver'])"
                  class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white transition-all transform active:scale-95"
                  style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); box-shadow: 0 4px 14px rgba(79,70,229,0.4);">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
            </svg>
            <span>Voice Assistant</span>
          </button>
          
          <button (click)="router.navigate(['/app/simulation-lab'])"
                  class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all">
            <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"/>
            </svg>
            <span>Demo Scenarios</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- System Health Score -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400">Payment System Health</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-black text-emerald-400">{{ truthService.metrics().healthScore }}%</span>
            <span class="text-[11px] font-semibold text-emerald-500">Optimal</span>
          </div>
          <p class="text-[10px] text-slate-400 mt-1">Multi-system ledger sync rate</p>
        </div>

        <!-- Critical Incidents -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400">Active Critical Desync</span>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300">P0</span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-black text-rose-400">{{ truthService.metrics().activeCritical }}</span>
            <span class="text-[11px] font-semibold text-rose-500">Require Escalate</span>
          </div>
          <p class="text-[10px] text-slate-400 mt-1">Zero auto-repair violations</p>
        </div>

        <!-- High Priority Inconsistencies -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400">High State Inconsistencies</span>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">Ready</span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-black text-amber-400">{{ truthService.metrics().activeHigh }}</span>
            <span class="text-[11px] font-semibold text-amber-500">Verified Safe</span>
          </div>
          <p class="text-[10px] text-slate-400 mt-1">Ready for 1-click state sync</p>
        </div>

        <!-- Resolved Today -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400">Auto-Resolved Today</span>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300">4.2s Avg</span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-black text-indigo-400">{{ truthService.metrics().resolvedToday }}</span>
            <span class="text-[11px] font-semibold text-indigo-300">100% Verified</span>
          </div>
          <p class="text-[10px] text-slate-400 mt-1">Immutable audit logging verified</p>
        </div>
      <div
  (click)="router.navigate(['/app/incidents/resolver'])"
  (keydown.enter)="router.navigate(['/app/incidents/resolver'])"
  (keydown.space)="$event.preventDefault(); router.navigate(['/app/incidents/resolver'])"
  class="group relative flex flex-col justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm
         cursor-pointer transition-all duration-150 ease-in-out
         hover:border-slate-700 hover:bg-slate-900/80
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
  tabindex="0"
  role="button"
  aria-label="Payment Incident Resolver – Investigate payment issues like technical incidents"
>
  <div>
    <div class="flex items-center gap-2.5">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50 text-indigo-400 group-hover:border-slate-700 transition-colors">
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <circle cx="12" cy="11" r="2.5" />
          <path d="m14 13 2.5 2.5" />
        </svg>
      </div>

      <h3 class="text-sm font-semibold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
        Payment Incident Resolver
      </h3>
    </div>

    <p class="mt-2.5 text-xs leading-relaxed text-slate-400">
      Investigate payment issues like technical incidents. Gather evidence, identify the root cause, and safely resolve or escalate the issue.
    </p>
  </div>

  <div class="mt-4 flex flex-wrap gap-1.5 pt-1">
    <span class="inline-flex items-center rounded border border-slate-800 bg-slate-950/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
      Investigate
    </span>
    <span class="inline-flex items-center rounded border border-slate-800 bg-slate-950/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
      Verify
    </span>
    <span class="inline-flex items-center rounded border border-slate-800 bg-slate-950/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
      Resolve
    </span>
    <span class="inline-flex items-center rounded border border-slate-800 bg-slate-950/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
      Escalate
    </span>
  </div>
</div>

      <!-- Payment Truth Capability Card -->
      <div
        (click)="router.navigate(['/app/payment-truth'])"
        (keydown.enter)="router.navigate(['/app/payment-truth'])"
        (keydown.space)="$event.preventDefault(); router.navigate(['/app/payment-truth'])"
        class="group relative flex flex-col justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm cursor-pointer transition-all duration-150 ease-in-out hover:border-slate-700 hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        tabindex="0"
        role="button"
        aria-label="Payment Truth – See what actually happened to a transaction"
      >
        <div>
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50 text-indigo-400 group-hover:border-slate-700 transition-colors">
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                Payment Truth
              </h3>
              <p class="text-[10px] font-medium text-slate-500 mt-0.5">Autonomous ledger &amp; state reconciliation</p>
            </div>
          </div>
          <p class="mt-2.5 text-xs leading-relaxed text-slate-400">
            Reconcile conflicting records across Bank, Gateway, and Merchant DB. Cryptographically verify and auto-repair dropped webhook states.
          </p>
        </div>
        <div class="mt-4 flex flex-wrap gap-1.5 pt-1">
          <span class="inline-flex items-center rounded border border-slate-800 bg-slate-950/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">Timeline Sync</span>
          <span class="inline-flex items-center rounded border border-slate-800 bg-slate-950/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">Drift Detection</span>
          <span class="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">Deterministic Gate</span>
        </div>
      </div>
</div>

      <!-- Live Payment Truth Feed & Quick Scenario Launch -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Left 2 Cols: Active Inconsistencies Feed -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
              </svg>
              <h2 class="text-base font-bold text-white">Live Payment Truth Feed</h2>
            </div>
            <a routerLink="/app/incidents" class="text-xs font-semibold text-indigo-400 hover:text-indigo-300">View All Incidents →</a>
          </div>

          <!-- Incidents Cards -->
          <div class="space-y-3">
            <div *ngFor="let incident of truthService.incidents()"
                 (click)="openIncident(incident)"
                 class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:bg-slate-900/90 group">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold text-indigo-400">{{ incident.id }}</span>
                    <span [ngClass]="{
                      'bg-rose-500/20 text-rose-300 border-rose-500/30': incident.severity === 'CRITICAL',
                      'bg-amber-500/20 text-amber-300 border-amber-500/30': incident.severity === 'HIGH',
                      'bg-blue-500/20 text-blue-300 border-blue-500/30': incident.severity === 'MEDIUM',
                      'bg-slate-500/20 text-slate-300 border-slate-500/30': incident.severity === 'LOW'
                    }" class="px-2 py-0.5 rounded text-[10px] font-bold border">
                      {{ incident.severity }}
                    </span>
                    <span class="text-xs font-bold text-white">₹{{ incident.amount.toLocaleString('en-IN') }}</span>
                    <span *ngIf="incident.isRepaired" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      REPAIRED ✅
                    </span>
                  </div>
                  <p class="text-xs text-slate-300 font-medium line-clamp-1">
                    {{ incident.customerClaim }}
                  </p>
                </div>

                <div class="text-right flex-shrink-0">
                  <span class="text-[11px] font-bold text-indigo-300">Confidence: {{ incident.aiAnalysis?.confidence || 98 }}%</span>
                  <span class="text-[10px] block text-slate-500">Order: {{ incident.orderId }}</span>
                </div>
              </div>

              <!-- Multi-System Truth Comparison Pill Row -->
              <div class="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center text-[10px]">
                <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span class="text-slate-400 block font-medium">Bank</span>
                  <span [ngClass]="{'text-emerald-400': incident.truthMatrix.bank.status === 'DEBITED' || incident.truthMatrix.bank.status === 'SUCCESS', 'text-rose-400': incident.truthMatrix.bank.status === 'FAILED'}" class="font-bold">
                    {{ incident.truthMatrix.bank.status }}
                  </span>
                </div>
                <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span class="text-slate-400 block font-medium">Gateway</span>
                  <span [ngClass]="{'text-emerald-400': incident.truthMatrix.gateway.status === 'CAPTURED', 'text-rose-400': incident.truthMatrix.gateway.status === 'FAILED', 'text-amber-400': incident.truthMatrix.gateway.status === 'REFUNDED'}" class="font-bold">
                    {{ incident.truthMatrix.gateway.status }}
                  </span>
                </div>
                <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span class="text-slate-400 block font-medium">Webhook</span>
                  <span [ngClass]="{'text-rose-400': incident.truthMatrix.webhook.status === 'FAILED', 'text-amber-400': incident.truthMatrix.webhook.status === 'DELAYED', 'text-emerald-400': incident.truthMatrix.webhook.status === 'SUCCESS'}" class="font-bold">
                    {{ incident.truthMatrix.webhook.status }}
                  </span>
                </div>
                <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span class="text-slate-400 block font-medium">Merchant DB</span>
                  <span [ngClass]="{'text-rose-400': incident.truthMatrix.merchantDb.orderStatus === 'UNPAID', 'text-emerald-400': incident.truthMatrix.merchantDb.orderStatus === 'PAID', 'text-blue-400': incident.truthMatrix.merchantDb.orderStatus === 'REFUNDED'}" class="font-bold">
                    {{ incident.truthMatrix.merchantDb.orderStatus }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Col: One-Click Judge Scenarios -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>
              </svg>
              Judge Quick Simulators
            </h2>
          </div>

          <div class="space-y-2.5">
            <button *ngFor="let sc of truthService.scenarioDefinitions"
                    (click)="triggerScenario(sc.id)"
                    class="w-full text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900/90 transition-all group">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white group-hover:text-indigo-300">{{ sc.title }}</span>
                <span class="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {{ sc.badge }}
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1 line-clamp-2">{{ sc.description }}</p>
              <div class="mt-2 text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                <span>▶ Trigger Incident</span>
              </div>
            </button>
          </div>
        </div>

      </div>

    </div>
  `
})
export class DashboardComponent {
  constructor(
    public truthService: TruthIncidentService,
    public router: Router,
  ) {}

  openIncident(incident: PaymentIncident) {
    this.truthService.selectIncident(incident);
    this.router.navigate(['/app/incidents', incident.id]);
  }

  async triggerScenario(scenarioId: ScenarioType) {
    const incident = await this.truthService.simulateScenario(scenarioId);
    this.router.navigate(['/app/incidents', incident.id]);
  }
}
