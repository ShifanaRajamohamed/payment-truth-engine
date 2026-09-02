import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { TranslationService } from '../../core/language/translation.service';
import { VoiceService } from '../../core/services/voice.service';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-7">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">💡</span>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">{{ i18n.t('opportunities.title') }}</h1>
        </div>
        <p class="text-sm text-slate-500">{{ i18n.t('opportunities.subtitle') }}</p>
      </div>
      <button (click)="askAgent()" class="mt-3 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
              style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);box-shadow:0 4px 12px rgba(59,130,246,0.3);">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
        </svg>
        Ask Dhwani
      </button>
    </div>

    <!-- Summary row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Actions available</p>
        <p class="text-3xl font-extrabold text-slate-900">{{ activeCount }}</p>
        <p class="text-xs text-slate-500 mt-1">things you can do right now</p>
      </div>
      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">More payments will go through</p>
        <p class="text-3xl font-extrabold text-emerald-600">+3.8%</p>
        <p class="text-xs text-slate-500 mt-1">if you do these actions</p>
      </div>
      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Already done</p>
        <p class="text-3xl font-extrabold text-blue-600">{{ appliedCount }}</p>
        <p class="text-xs text-slate-500 mt-1">actions completed</p>
      </div>
    </div>

    <!-- Opportunity cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div *ngFor="let opp of dataService.opportunities()"
           class="bg-white rounded-2xl p-6 flex flex-col transition-all hover:shadow-md"
           style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);"
           [style.opacity]="opp.status === 'ignored' ? '0.5' : '1'">

        <!-- Status + difficulty -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  [style]="difficultyStyle(opp.difficulty)">
              {{ i18n.t('opportunities.difficulty.' + opp.difficulty) }}
            </span>
            <span *ngIf="opp.status === 'applied'"
                  class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;">
              ✓ Done
            </span>
          </div>
          <span class="text-lg">{{ impactIcon(opp.impactType) }}</span>
        </div>

        <!-- Plain title -->
        <h3 class="text-sm font-bold text-slate-900 mb-2">{{ opp.plainTitle }}</h3>
        <p class="text-xs text-slate-600 leading-relaxed mb-3 flex-1">{{ opp.plainDescription }}</p>

        <!-- Impact -->
        <div class="px-3 py-2.5 rounded-xl mb-4" [style]="impactBgStyle(opp.impactType)">
          <p class="text-xs font-semibold" [style]="impactTextStyle(opp.impactType)">{{ opp.plainImpact }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2" *ngIf="opp.status !== 'applied'">
          <button (click)="dataService.applyOpportunity(opp.id)"
                  class="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                  style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
            {{ i18n.t('opportunities.apply') }}
          </button>
          <button class="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            {{ i18n.t('opportunities.ignore') }}
          </button>
        </div>
        <div *ngIf="opp.status === 'applied'"
             class="py-2 px-3 rounded-xl text-xs font-semibold text-center"
             style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;">
          {{ i18n.t('opportunities.applied') }}
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display:block; }`]
})
export class OpportunitiesComponent {
  constructor(
    public dataService: DataService,
    public i18n: TranslationService,
    private voice: VoiceService,
  ) {}

  get activeCount() { return this.dataService.opportunities().filter(o => o.status === 'active').length; }
  get appliedCount(){ return this.dataService.opportunities().filter(o => o.status === 'applied').length; }

  askAgent() {
    this.voice.setDrawerOpen(true);
    setTimeout(() => this.voice.processCommand('What should I do to improve my business?'), 200);
  }

  impactIcon(type: string): string {
    if (type === 'success_rate') return '📈';
    if (type === 'cost_saving')  return '💰';
    return '⚡';
  }

  difficultyStyle(d: string): string {
    if (d === 'low')    return 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;';
    if (d === 'medium') return 'background:#fffbeb;color:#d97706;border:1px solid #fde68a;';
    return 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;';
  }

  impactBgStyle(type: string): string {
    if (type === 'success_rate') return 'background:#f0fdf4;border:1px solid #bbf7d0;';
    if (type === 'cost_saving')  return 'background:#eff6ff;border:1px solid #bfdbfe;';
    return 'background:#fffbeb;border:1px solid #fde68a;';
  }

  impactTextStyle(type: string): string {
    if (type === 'success_rate') return 'color:#16a34a;';
    if (type === 'cost_saving')  return 'color:#1d4ed8;';
    return 'color:#d97706;';
  }
}
