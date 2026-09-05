import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TruthIncidentService } from '../../core/services/truth-incident.service';

@Component({
  selector: 'app-inspector',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 animate-fadeIn">

      <!-- Header -->
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Cross-System Search
          </span>
          <span class="text-xs text-slate-400">Verifiable Distributed Ledger Lookup</span>
        </div>
        <h1 class="text-2xl font-black text-white mt-1">Payment Truth Inspector</h1>
        <p class="text-xs text-slate-400">
          Query any Payment ID (PAY_xxx), Order ID (ORD_xxx), or Bank UTR to reconcile distributed ledger states.
        </p>
      </div>

      <!-- Search Input Bar -->
      <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <input type="text"
                 [(ngModel)]="searchQuery"
                 (keyup.enter)="executeLookup()"
                 placeholder="Enter Payment ID (e.g. PAY_98765) or Order ID (e.g. ORD_12345)..."
                 class="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          <svg class="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
          </svg>
        </div>

        <button (click)="executeLookup()"
                [disabled]="isSearching()"
                class="px-6 py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
          </svg>
          <span>{{ isSearching() ? 'Querying Systems...' : 'Inspect Truth' }}</span>
        </button>
      </div>

      <!-- Quick Search Suggestions -->
      <div class="flex items-center gap-2 flex-wrap text-xs text-slate-400">
        <span class="text-[11px] font-semibold">Try sample IDs:</span>
        <button *ngFor="let id of sampleIds"
                (click)="setSearch(id)"
                class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-[11px] hover:border-indigo-500">
          {{ id }}
        </button>
      </div>

      <!-- Inspection Result -->
      <div *ngIf="lookupResult() as res" class="space-y-6 animate-fadeIn">
        <div *ngIf="res.found; else notFoundResult" class="space-y-6">

          <!-- Match Summary Card -->
          <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-indigo-400">Order: {{ res.order?.orderId }}</span>
                <span class="text-xs font-mono font-bold text-slate-400">Payment: {{ res.payment?.paymentId }}</span>
              </div>
              <h2 class="text-xl font-black text-white">
                Reconciliation Truth: ₹{{ res.order?.amount?.toLocaleString('en-IN') }}
              </h2>
            </div>

            <div *ngIf="res.incident" class="flex-shrink-0">
              <button (click)="router.navigate(['/app/incidents', res.incident.id])"
                      class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5">
                <span>View Incident Resolution Studio</span>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Multi System Grid -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span class="text-xs font-bold text-slate-400">Bank Debit State</span>
              <div class="text-base font-black text-emerald-400">{{ res.bankRecord?.status || 'DEBITED' }}</div>
              <p class="text-[11px] text-slate-400">{{ res.bankRecord?.description || 'Account debited with bank UTR' }}</p>
            </div>

            <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span class="text-xs font-bold text-slate-400">Gateway Status</span>
              <div class="text-base font-black text-emerald-400">{{ res.payment?.status || 'CAPTURED' }}</div>
              <p class="text-[11px] text-slate-400">Signature Valid: <strong>{{ res.payment?.signatureValid ? 'YES ✅' : 'NO ❌' }}</strong></p>
            </div>

            <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span class="text-xs font-bold text-slate-400">Webhook Delivery</span>
              <div class="text-base font-black" [ngClass]="res.webhookRecord?.status === 'FAILED' ? 'text-rose-400' : 'text-emerald-400'">
                HTTP {{ res.webhookRecord?.httpStatusCode || '500' }}
              </div>
              <p class="text-[11px] text-slate-400">{{ res.webhookRecord?.lastError || 'Processed' }}</p>
            </div>

            <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span class="text-xs font-bold text-slate-400">Merchant DB Status</span>
              <div class="text-base font-black" [ngClass]="res.order?.status === 'UNPAID' ? 'text-rose-400' : 'text-emerald-400'">
                {{ res.order?.status || 'UNPAID' }}
              </div>
              <p class="text-[11px] text-slate-400">Last updated: {{ res.order?.updatedAt | date:'shortTime' }}</p>
            </div>
          </div>

        </div>

        <ng-template #notFoundResult>
          <div class="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <p class="text-sm font-bold text-slate-300">No active records found matching “{{ searchQuery }}”</p>
            <p class="text-xs text-slate-500">Try searching for one of the pre-seeded sample IDs above or simulate a new scenario.</p>
          </div>
        </ng-template>
      </div>

    </div>
  `
})
export class InspectorComponent {
  searchQuery = '';
  isSearching = signal<boolean>(false);
  lookupResult = signal<any | null>(null);

  sampleIds = ['ORD_12345', 'PAY_98765', 'INC-2026-001'];

  constructor(
    public truthService: TruthIncidentService,
    public router: Router,
  ) {}

  setSearch(id: string) {
    this.searchQuery = id;
    this.executeLookup();
  }

  async executeLookup() {
    if (!this.searchQuery.trim()) return;
    this.isSearching.set(true);
    try {
      const res = await this.truthService.lookup(this.searchQuery);
      this.lookupResult.set(res);
    } finally {
      this.isSearching.set(false);
    }
  }
}
