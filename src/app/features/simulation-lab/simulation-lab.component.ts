import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TruthIncidentService } from '../../core/services/truth-incident.service';
import { ScenarioType, ScenarioDefinition } from '@deepaudit/shared-types';

@Component({
  selector: 'app-simulation-lab',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 animate-fadeIn">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ⚡ Judge Evaluation Center
            </span>
            <span class="text-xs text-slate-400">Live Chaos & Inconsistency Simulation</span>
          </div>
          <h1 class="text-2xl font-black text-white mt-1">Payment Incident Simulation Lab</h1>
          <p class="text-xs text-slate-400">
            Inject synthetic multi-system failure modes to test AI correlation, deterministic verification, and safe state repair.
          </p>
        </div>
      </div>

      <!-- 5 Standard Hackathon Scenarios Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let sc of truthService.scenarioDefinitions; let i = index"
             class="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4 group">
          
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold font-mono text-indigo-400">Scenario #{{ i + 1 }}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {{ sc.badge }}
              </span>
            </div>

            <h3 class="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
              {{ sc.title }}
            </h3>

            <p class="text-xs text-slate-300 leading-relaxed">
              {{ sc.description }}
            </p>

            <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] space-y-1">
              <span class="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Expected Root Cause</span>
              <p class="font-semibold text-indigo-300">{{ sc.expectedRootCause }}</p>
              <span class="text-slate-500 block text-[10px] font-bold uppercase tracking-wider pt-1">Safe Action</span>
              <p class="font-semibold text-emerald-400">{{ sc.safeAction }}</p>
            </div>
          </div>

          <button (click)="runSimulation(sc.id)"
                  [disabled]="truthService.isLoading()"
                  class="w-full py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 active:scale-98">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"/>
            </svg>
            <span>Simulate & Investigate Live</span>
          </button>

        </div>
      </div>

    </div>
  `
})
export class SimulationLabComponent {
  constructor(
    public truthService: TruthIncidentService,
    private router: Router,
  ) {}

  async runSimulation(scenarioId: ScenarioType) {
    const incident = await this.truthService.simulateScenario(scenarioId);
    this.router.navigate(['/app/incidents', incident.id]);
  }
}
