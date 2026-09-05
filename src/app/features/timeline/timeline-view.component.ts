import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TruthIncidentService } from '../../core/services/truth-incident.service';

@Component({
  selector: 'app-timeline-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 animate-fadeIn">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Chronological Correlation Engine
            </span>
            <span class="text-xs text-slate-400">Multi-System Event Stream</span>
          </div>
          <h1 class="text-2xl font-black text-white mt-1">Unified Payment Timeline</h1>
          <p class="text-xs text-slate-400">
            Real-time chronological log merging Bank transactions, Gateway webhooks, Merchant handlers, and State repairs.
          </p>
        </div>

        <div *ngIf="truthService.selectedIncident() as inc" class="flex items-center gap-3">
          <span class="text-xs font-mono text-slate-400">Active Incident: <strong class="text-indigo-400">{{ inc.id }}</strong></span>
          <button (click)="router.navigate(['/app/incidents', inc.id])"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500">
            Open Detail View →
          </button>
        </div>
      </div>

      <!-- Timeline Card -->
      <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">

        <div class="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
            Chronological Sequence (Earliest to Latest)
          </span>
          <span class="text-xs font-mono font-bold text-indigo-400">
            {{ timelineEvents().length }} Events Merged
          </span>
        </div>

        <!-- Event Stream -->
        <div class="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          <div *ngFor="let ev of timelineEvents()" class="relative group">
            
            <!-- Point on timeline -->
            <span class="absolute -left-8 top-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center"
                  [ngClass]="{
                    'bg-emerald-400 ring-4 ring-emerald-500/20': ev.status === 'SUCCESS',
                    'bg-rose-500 ring-4 ring-rose-500/30 animate-ping': ev.isFailurePoint || ev.status === 'FAILED',
                    'bg-amber-400 ring-4 ring-amber-500/20': ev.status === 'WARNING' || ev.status === 'PENDING',
                    'bg-indigo-400': ev.status === 'INFO'
                  }">
            </span>

            <div class="p-5 rounded-2xl border transition-all"
                 [ngClass]="{
                   'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/30': ev.isFailurePoint,
                   'bg-slate-950/70 border-slate-800/80 hover:border-slate-700': !ev.isFailurePoint
                 }">
              
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300">
                    {{ ev.source }}
                  </span>
                  <span class="text-sm font-black text-white">{{ ev.title }}</span>
                  <span [ngClass]="{
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30': ev.status === 'SUCCESS',
                    'bg-rose-500/20 text-rose-300 border-rose-500/30': ev.status === 'FAILED',
                    'bg-amber-500/20 text-amber-300 border-amber-500/30': ev.status === 'WARNING' || ev.status === 'PENDING',
                    'bg-blue-500/20 text-blue-300 border-blue-500/30': ev.status === 'INFO'
                  }" class="px-2 py-0.5 rounded text-[10px] font-bold border">
                    {{ ev.status }}
                  </span>
                </div>
                <span class="text-xs font-mono text-slate-400">{{ ev.relativeTime }}</span>
              </div>

              <p class="text-xs text-slate-300 mt-2 leading-relaxed">{{ ev.description }}</p>

              <div *ngIf="ev.isFailurePoint"
                   class="mt-3 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs font-semibold text-rose-300 flex items-center gap-2">
                <span class="text-sm">⚠️</span>
                <span>Desynchronization Point: Merchant webhook failed to process, causing stale database state.</span>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  `
})
export class TimelineViewComponent {
  timelineEvents = computed(() => {
    const inc = this.truthService.selectedIncident();
    if (inc && inc.timeline && inc.timeline.length > 0) {
      return inc.timeline;
    }
    return [];
  });

  constructor(
    public truthService: TruthIncidentService,
    public router: Router,
  ) {}
}
