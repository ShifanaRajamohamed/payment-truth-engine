import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment } from '@deepaudit/shared-types';
import { RiskService } from '../../../core/services/risk.service';
import { LanguageService } from '../../../core/language/language.service';

@Component({
  selector: 'app-risk-explanation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="payment"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center"
                 [style]="headerBg()">
              <span class="text-lg">🛡️</span>
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-900 leading-tight">AI Fraud Risk Explanation</h2>
              <p class="text-[11px] font-mono text-slate-400">{{ payment.referenceNumber }}</p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="overflow-y-auto space-y-4 pr-1 text-xs">
          
          <!-- Score Summary Pill -->
          <div class="p-4 rounded-2xl flex items-center justify-between"
               [style]="scoreCardStyle()">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider block opacity-75">Deterministic Risk Score</span>
              <p class="text-2xl font-black">{{ payment.riskAssessment?.overallScore || 0 }} / 100</p>
              <p class="text-xs font-semibold mt-0.5">{{ payment.riskAssessment?.level }} Risk Classification</p>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-bold uppercase tracking-wider block opacity-75">Policy Action</span>
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/80 shadow-sm inline-block mt-1">
                {{ payment.riskAssessment?.actionRequired || 'ALLOW' }}
              </span>
            </div>
          </div>

          <!-- Verified AI Explanation -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                Gemini Intelligence Reasoning
              </span>
              <span class="text-[10px] text-slate-400">Model: Gemini 2.5 Flash</span>
            </div>

            <div *ngIf="riskService.isEvaluating()" class="py-6 flex flex-col items-center justify-center text-slate-400">
              <div class="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p class="text-xs font-semibold">Synthesizing authorized transaction context...</p>
            </div>

            <p *ngIf="!riskService.isEvaluating()" class="text-slate-700 leading-relaxed font-normal whitespace-pre-line">
              {{ riskService.currentExplanation() || payment.riskAssessment?.aiExplanation || 'Generating audit explanation...' }}
            </p>
          </div>

          <!-- Deterministic Signals Triggered -->
          <div class="space-y-2">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signals Detected By Risk Engine</h3>
            <div *ngFor="let sig of payment.riskAssessment?.signals"
                 class="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-start gap-2.5">
              <span class="text-amber-500 font-bold text-sm mt-0.5">⚠️</span>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-slate-800">{{ sig.title }}</h4>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                    +{{ sig.scoreContribution }} pts
                  </span>
                </div>
                <p class="text-[11px] text-slate-500 mt-0.5">{{ sig.description }}</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="pt-4 mt-4 border-t border-slate-100 flex gap-2">
          <button (click)="close.emit()"
                  class="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
            Close Audit View
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`:host { display: contents; }`]
})
export class RiskExplanationComponent {
  @Input() payment: Payment | null = null;
  @Output() close = new EventEmitter<void>();

  constructor(
    public riskService: RiskService,
    public lang: LanguageService
  ) {}

  headerBg(): string {
    const level = this.payment?.riskAssessment?.level;
    if (level === 'CRITICAL' || level === 'HIGH') return 'background:#fef2f2;color:#dc2626;';
    if (level === 'MEDIUM') return 'background:#fffbeb;color:#d97706;';
    return 'background:#f0fdf4;color:#16a34a;';
  }

  scoreCardStyle(): string {
    const level = this.payment?.riskAssessment?.level;
    if (level === 'CRITICAL' || level === 'HIGH') return 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;';
    if (level === 'MEDIUM') return 'background:#fef3c7;color:#92400e;border:1px solid #fcd34d;';
    return 'background:#dcfce7;color:#166534;border:1px solid #86efac;';
  }
}
