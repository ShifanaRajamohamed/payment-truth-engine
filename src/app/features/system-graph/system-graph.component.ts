import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TruthIncidentService } from '../../core/services/truth-incident.service';

@Component({
  selector: 'app-system-graph',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 animate-fadeIn">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              System Topology Map
            </span>
            <span class="text-xs text-slate-400">Real-time Node Health & Failure Tracking</span>
          </div>
          <h1 class="text-2xl font-black text-white mt-1">Payment Truth Graph</h1>
          <p class="text-xs text-slate-400">
            Interactive system map detailing node health and pinpointing exact failure origins across the payment lifecycle.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button (click)="router.navigate(['/app/simulation-lab'])"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20">
            Simulate Failure Mode
          </button>
        </div>
      </div>

      <!-- Graph Card -->
      <div class="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-8 relative overflow-hidden">
        
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
            Current Flow: Customer → Bank → Gateway → Webhook → Merchant Backend → DB
          </span>
          <div class="flex items-center gap-4 text-xs">
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> Healthy</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-400"></span> Delayed</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Failed Origin</span>
          </div>
        </div>

        <!-- Node Topology Visualizer -->
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div *ngFor="let node of activeNodes(); let i = index"
               class="p-5 rounded-2xl border relative flex flex-col justify-between space-y-3 transition-all transform hover:-translate-y-1"
               [ngClass]="{
                 'bg-rose-950/40 border-rose-500 shadow-xl shadow-rose-950/50 ring-2 ring-rose-500/50': node.isFailureOrigin || node.status === 'failed',
                 'bg-amber-950/30 border-amber-500/50': node.status === 'delayed' || node.status === 'warning',
                 'bg-slate-950/80 border-slate-800': node.status === 'healthy'
               }">
            
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono text-slate-500">Node {{ i + 1 }}</span>
              <span *ngIf="node.status === 'healthy'" class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span *ngIf="node.status === 'failed' || node.isFailureOrigin" class="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
              <span *ngIf="node.status === 'delayed' || node.status === 'warning'" class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            </div>

            <div>
              <h3 class="text-base font-black text-white">{{ node.label }}</h3>
              <p class="text-xs font-semibold mt-1"
                 [ngClass]="{
                   'text-rose-400': node.status === 'failed' || node.isFailureOrigin,
                   'text-amber-400': node.status === 'delayed' || node.status === 'warning',
                   'text-emerald-400': node.status === 'healthy'
                 }">
                {{ node.subtext }}
              </p>
            </div>

            <div class="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Type: {{ node.type }}</span>
              <span *ngIf="node.isFailureOrigin" class="text-rose-400 font-bold uppercase">Anomaly</span>
            </div>

            <span *ngIf="node.isFailureOrigin"
                  class="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-lg">
              DESYNC POINT
            </span>
          </div>
        </div>

        <!-- System Inconsistency Summary -->
        <div *ngIf="truthService.selectedIncident() as inc"
             class="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <span class="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Correlated Active Incident</span>
            <p class="text-sm font-bold text-white">{{ inc.id }} — {{ inc.customerClaim }}</p>
            <p class="text-xs text-slate-400">Root Cause: <strong class="text-indigo-300">{{ inc.aiAnalysis?.category }}</strong></p>
          </div>
          <button (click)="router.navigate(['/app/incidents', inc.id])"
                  class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex-shrink-0">
            Open Resolution Studio →
          </button>
        </div>

      </div>

    </div>
  `
})
export class SystemGraphComponent {
  activeNodes = computed(() => {
    const inc = this.truthService.selectedIncident();
    if (inc && inc.graphNodes && inc.graphNodes.length > 0) {
      return inc.graphNodes;
    }
    return [
      { id: 'node-cust', label: 'Customer', type: 'customer', status: 'healthy', subtext: 'Paid ₹12,499' },
      { id: 'node-bank', label: 'Bank', type: 'bank', status: 'healthy', subtext: 'Debited (Success)' },
      { id: 'node-gw', label: 'Gateway', type: 'gateway', status: 'healthy', subtext: 'Captured ✅' },
      { id: 'node-wh', label: 'Webhook', type: 'webhook', status: 'failed', subtext: 'HTTP 500 (Failed)', isFailureOrigin: true },
      { id: 'node-mb', label: 'Merchant Backend', type: 'merchant_backend', status: 'failed', subtext: 'Error in Handler' },
      { id: 'node-db', label: 'Database', type: 'database', status: 'warning', subtext: 'Order: UNPAID ❌' },
    ];
  });

  constructor(
    public truthService: TruthIncidentService,
    public router: Router,
  ) {}
}
