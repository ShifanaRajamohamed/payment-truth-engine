import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TruthIncidentService } from '../../core/services/truth-incident.service';
import { PaymentIncident, IncidentSeverity } from '@deepaudit/shared-types';

@Component({
  selector: 'app-incidents-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 animate-fadeIn">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Live Feed
            </span>
            <span class="text-xs text-slate-400">Deterministic Resolution Center</span>
          </div>
          <h1 class="text-2xl font-black text-white mt-1">Payment Inconsistency Incidents</h1>
          <p class="text-xs text-slate-400">Investigate, deterministically verify, and repair multi-system payment state disparities.</p>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="router.navigate(['/app/voice-resolver'])"
                  class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
            </svg>
            <span>Voice Intake</span>
          </button>
          
          <button (click)="router.navigate(['/app/simulation-lab'])"
                  class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all">
            <span>+ Simulate Incident</span>
          </button>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button (click)="filterSeverity.set('ALL')"
                  [ngClass]="filterSeverity() === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all">
            All ({{ truthService.incidents().length }})
          </button>
          <button (click)="filterSeverity.set('CRITICAL')"
                  [ngClass]="filterSeverity() === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all">
            Critical (P0)
          </button>
          <button (click)="filterSeverity.set('HIGH')"
                  [ngClass]="filterSeverity() === 'HIGH' ? 'bg-amber-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all">
            High (P1)
          </button>
          <button (click)="filterSeverity.set('MEDIUM')"
                  [ngClass]="filterSeverity() === 'MEDIUM' ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all">
            Medium
          </button>
          <button (click)="filterSeverity.set('REPAIRED')"
                  [ngClass]="filterSeverity() === 'REPAIRED' ? 'bg-emerald-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all">
            Repaired ✅
          </button>
        </div>

        <div class="relative w-full sm:w-72">
          <input type="text"
                 (input)="onSearchInput($event)"
                 placeholder="Search Incident ID, Order, Amount..."
                 class="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          <svg class="w-4 h-4 text-slate-500 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
          </svg>
        </div>
      </div>

      <!-- Incidents Table / Cards -->
      <div class="space-y-3">
        <div *ngFor="let incident of filteredIncidents()"
             (click)="viewIncident(incident)"
             class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:bg-slate-900/90 group">
          
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <!-- Left Info -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 flex-wrap">
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
                <span class="text-[11px] text-slate-400 font-mono">Order: {{ incident.orderId }}</span>
                <span *ngIf="incident.isRepaired" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REPAIRED ✅
                </span>
              </div>
              <p class="text-xs text-slate-200 font-medium">
                {{ incident.customerClaim }}
              </p>
              <div class="flex items-center gap-3 text-[11px] text-slate-400">
                <span>Customer: <strong class="text-slate-300">{{ incident.customerName }}</strong></span>
                <span>•</span>
                <span>Root Cause: <strong class="text-indigo-300">{{ incident.aiAnalysis?.category || 'Analyzing...' }}</strong></span>
              </div>
            </div>

            <!-- Right Actions & Confidence -->
            <div class="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 flex-shrink-0">
              <div class="text-right">
                <span class="text-xs font-bold text-emerald-400 block">{{ incident.aiAnalysis?.confidence || 98 }}% Confidence</span>
                <span class="text-[10px] text-slate-500">{{ incident.status }}</span>
              </div>
              <button class="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/80 group-hover:bg-indigo-600 text-white transition-all flex items-center gap-1">
                <span>Investigate</span>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Cross-System Truth Strip -->
          <div class="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
            <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span class="text-slate-400 block font-medium">Bank</span>
              <span [ngClass]="{'text-emerald-400': incident.truthMatrix.bank.status === 'DEBITED' || incident.truthMatrix.bank.status === 'SUCCESS' || incident.truthMatrix.bank.status === 'CREDITED', 'text-rose-400': incident.truthMatrix.bank.status === 'FAILED'}" class="font-bold">
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
  `
})
export class IncidentsListComponent {
  readonly filterSeverity = signal<string>('ALL');
  readonly searchQuery = signal<string>('');

  readonly filteredIncidents = computed(() => {
    let list = this.truthService.incidents();
    const sev = this.filterSeverity();
    const query = this.searchQuery().toLowerCase().trim();

    if (sev === 'REPAIRED') {
      list = list.filter(i => i.isRepaired);
    } else if (sev !== 'ALL') {
      list = list.filter(i => i.severity === sev);
    }

    if (query) {
      list = list.filter(i => 
        i.id.toLowerCase().includes(query) ||
        i.orderId.toLowerCase().includes(query) ||
        (i.paymentId && i.paymentId.toLowerCase().includes(query)) ||
        i.customerClaim.toLowerCase().includes(query) ||
        i.customerName.toLowerCase().includes(query)
      );
    }

    return list;
  });

  constructor(
    public truthService: TruthIncidentService,
    public router: Router,
  ) {}

  onSearchInput(event: any) {
    this.searchQuery.set(event.target.value);
  }

  viewIncident(incident: PaymentIncident) {
    this.truthService.selectIncident(incident);
    this.router.navigate(['/app/incidents', incident.id]);
  }
}
